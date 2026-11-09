-- Apply once through Supabase migrations/SQL editor. All booking writes are server-only.
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  request_digest text not null,
  status_token uuid not null unique default gen_random_uuid(),
  status text not null check (status in ('request','checkout','awaiting_transfer','confirmed','expired','rejected','cancelled')),
  payment_method text not null check (payment_method in ('stripe','bank')),
  start_date date not null, end_date date not null, guests integer not null check (guests between 1 and 4),
  guest jsonb not null, billing jsonb not null, issuer jsonb not null,
  locale text not null check (locale in ('en','es')),
  subtotal_cents integer not null check (subtotal_cents > 0), tax_cents integer not null check (tax_cents >= 0),
  total_cents integer not null check (total_cents = subtotal_cents + tax_cents),
  terms_version text not null, terms_snapshot jsonb not null, accepted_at timestamptz not null default now(),
  privacy_accepted_at timestamptz not null default now(),
  expires_at timestamptz, stripe_session_id text unique, stripe_payment_id text unique,
  paid_at timestamptz, invoice_number text unique, invoice_date date,
  refund_cents integer not null default 0 check (refund_cents >= 0 and refund_cents <= total_cents),
  refund_state text not null default 'none' check (refund_state in ('none','pending','manual','succeeded','failed')),
  stripe_refund_id text unique, credit_number text unique,
  cancellation_reason text, cancelled_at timestamptz,
  conflict boolean not null default false, conflict_key text, acknowledged_conflict_key text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (end_date - start_date between 4 and 365)
);
create index reservations_dates on public.reservations(start_date, end_date);
create index reservations_pending on public.reservations(status, expires_at);
create table public.external_calendar_events (
  source text not null, uid text not null, start_date date not null, end_date date not null,
  primary key (source, uid), check (end_date > start_date)
);
create table public.calendar_sync_state (
  id integer primary key check (id = 1), started_at timestamptz not null, completed_at timestamptz not null
);
create table public.booking_number_series (series text primary key, last_number integer not null);
create table public.booking_documents (
  booking_id uuid not null references public.reservations(id), kind text not null check(kind in ('invoice','agreement','credit')),
  storage_path text not null unique, created_at timestamptz not null default now(), primary key (booking_id,kind)
);
create table public.booking_outbox (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.reservations(id),
  kind text not null, audience text not null check(audience in ('owner','guest')), dedupe_key text not null unique,
  payload jsonb not null default '{}', attempts integer not null default 0,
  available_at timestamptz not null default now(), locked_until timestamptz, claim_token uuid,
  sent_at timestamptz, last_error text, created_at timestamptz not null default now()
);
create index booking_outbox_pending on public.booking_outbox(available_at) where sent_at is null;
create table public.booking_audit (
  id bigint generated always as identity primary key, booking_id uuid references public.reservations(id),
  action text not null, actor text not null, created_at timestamptz not null default now(), details jsonb not null default '{}'
);
create table public.booking_rate_limits (key text primary key, window_start timestamptz not null, count integer not null);

-- A single inventory lock serializes sync, reservations, approval, expiry and payment confirmation.
-- Paid bookings may overlap external reservations: record and alert rather than discard a payment.
create function public.ca_blocks(r public.reservations) returns boolean language sql stable as $$
  select r.status in ('checkout','confirmed') or (r.status = 'awaiting_transfer' and r.expires_at > now())
$$;
create function public.ca_has_conflict(p_start date, p_end date, p_exclude uuid default null) returns boolean language sql stable as $$
  select (exists(select 1 from public.external_calendar_events where start_date < p_end and end_date > p_start)
      and not exists(select 1 from public.reservations a where a.id=p_exclude and a.conflict_key is not null and a.acknowledged_conflict_key=a.conflict_key))
    or exists(select 1 from public.reservations r where (p_exclude is null or r.id <> p_exclude)
      and public.ca_blocks(r) and r.start_date < p_end and r.end_date > p_start)
$$;
create function public.ca_number(p_prefix text) returns text language plpgsql as $$
declare s text; n integer;
begin
  s := p_prefix || to_char(now() at time zone 'Atlantic/Canary','YYYY');
  insert into public.booking_number_series(series,last_number) values(s,1)
    on conflict(series) do update set last_number = booking_number_series.last_number + 1 returning last_number into n;
  return s || '-' || lpad(n::text,6,'0');
end $$;
create function public.ca_enqueue(p_id uuid, p_kind text, p_key text, p_payload jsonb default '{}', p_owner_only boolean default false)
returns void language plpgsql as $$
begin
  insert into public.booking_outbox(booking_id,kind,audience,dedupe_key,payload)
    values(p_id,p_kind,'owner',p_key || ':owner',p_payload) on conflict(dedupe_key) do nothing;
  if not p_owner_only then
    insert into public.booking_outbox(booking_id,kind,audience,dedupe_key,payload)
      values(p_id,p_kind,'guest',p_key || ':guest',p_payload) on conflict(dedupe_key) do nothing;
  end if;
end $$;
create function public.ca_detect_conflicts() returns void language plpgsql as $$
declare r public.reservations; k text;
begin
  -- Refresh fingerprints for expired requests too: a late bank payment must not reuse a stale acknowledgement.
  for r in select * from public.reservations x where x.status not in ('cancelled','rejected') loop
    select string_agg(v, ',' order by v) into k from (
      select e.source || ':' || e.uid || ':' || e.start_date || ':' || e.end_date as v
        from public.external_calendar_events e where e.start_date < r.end_date and e.end_date > r.start_date
      union all select 'direct:' || o.id from public.reservations o where o.id <> r.id
        and public.ca_blocks(o) and o.start_date < r.end_date and o.end_date > r.start_date
    ) conflicts;
    update public.reservations set conflict_key = k,
      conflict = k is not null and k is distinct from acknowledged_conflict_key where id = r.id;
    if public.ca_blocks(r) and k is not null and k is distinct from r.acknowledged_conflict_key and k is distinct from r.conflict_key then
      perform public.ca_enqueue(r.id,'conflict',r.id || ':conflict:' || md5(k),'{}',true);
    end if;
  end loop;
end $$;
create function public.ca_sync_calendars(p_events jsonb, p_started_at timestamptz) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform pg_advisory_xact_lock(73427037);
  if exists(select 1 from public.calendar_sync_state where started_at > p_started_at) then return false; end if;
  if jsonb_typeof(p_events) <> 'array' then raise exception 'invalid_events'; end if;
  delete from public.external_calendar_events where source in ('airbnb','booking.com');
  insert into public.external_calendar_events(source,uid,start_date,end_date)
    select source,uid,start_date,end_date from jsonb_to_recordset(p_events)
      as x(source text,uid text,start_date date,end_date date)
    where source in ('airbnb','booking.com');
  insert into public.calendar_sync_state values(1,p_started_at,now())
    on conflict(id) do update set started_at=excluded.started_at,completed_at=excluded.completed_at;
  perform public.ca_detect_conflicts();
  return true;
end $$;
create function public.ca_create_reservation(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.reservations; total integer; subtotal integer; tax integer;
begin
  perform pg_advisory_xact_lock(73427037);
  select * into r from public.reservations where request_id = (p->>'request_id')::uuid;
  if found then
    if r.request_digest <> p->>'request_digest' then raise exception 'idempotency_conflict'; end if;
    return to_jsonb(r);
  end if;
  if (p->>'start_date')::date < (now() at time zone 'Atlantic/Canary')::date + 2 then raise exception 'arrival_too_soon'; end if;
  if p->>'payment_method' = 'stripe' then
    if not exists(select 1 from public.calendar_sync_state where completed_at > now() - interval '2 minutes') then raise exception 'calendar_unavailable'; end if;
    if public.ca_has_conflict((p->>'start_date')::date,(p->>'end_date')::date) then raise exception 'dates_unavailable'; end if;
  end if;
  subtotal := ((p->>'end_date')::date - (p->>'start_date')::date) * (8900 + greatest(0,(p->>'guests')::integer - 2) * 2000);
  tax := round(subtotal * 0.07); total := subtotal + tax;
  insert into public.reservations(request_id,request_digest,status,payment_method,start_date,end_date,guests,
    guest,billing,issuer,locale,subtotal_cents,tax_cents,total_cents,terms_version,terms_snapshot,expires_at)
  values((p->>'request_id')::uuid,p->>'request_digest',case when p->>'payment_method'='stripe' then 'checkout' else 'request' end,
    p->>'payment_method',(p->>'start_date')::date,(p->>'end_date')::date,(p->>'guests')::integer,
    p->'guest',p->'billing',p->'issuer',p->>'locale',subtotal,tax,total,p->>'terms_version',p->'terms_snapshot',
    case when p->>'payment_method'='stripe' then now() + interval '30 minutes 10 seconds' else null end) returning * into r;
  if r.status='request' then perform public.ca_enqueue(r.id,'request',r.id || ':request'); end if;
  insert into public.booking_audit(booking_id,action,actor) values(r.id,'created','guest');
  return to_jsonb(r);
end $$;
create function public.ca_transition(p_id uuid, p_action text, p_data jsonb default '{}', p_actor text default 'system')
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.reservations; deadline timestamptz; percentage integer; refund integer; days integer;
begin
  perform pg_advisory_xact_lock(73427037);
  select * into r from public.reservations where id=p_id for update;
  if not found then raise exception 'not_found'; end if;
  if p_action='attach_session' then
    if r.stripe_session_id is not null and r.stripe_session_id <> p_data->>'session_id' then raise exception 'payment_mismatch'; end if;
    update public.reservations set stripe_session_id=p_data->>'session_id', expires_at=case when status='checkout' then (p_data->>'expires_at')::timestamptz else expires_at end where id=p_id;
  elsif p_action='renew_checkout_creation' then
    if r.status <> 'checkout' or r.stripe_session_id is not null or r.created_at < now() - interval '10 minutes'
      or r.expires_at is distinct from (p_data->>'expected_expiry')::timestamptz then raise exception 'invalid_transition'; end if;
    update public.reservations set expires_at=now()+interval '30 minutes 10 seconds' where id=p_id;
  elsif p_action='confirm_stripe' then
    if r.payment_method <> 'stripe' or (p_data->>'total')::integer <> r.total_cents or p_data->>'currency' <> 'eur'
      or (r.stripe_session_id is not null and r.stripe_session_id <> p_data->>'session_id')
      or (r.stripe_payment_id is not null and r.stripe_payment_id <> p_data->>'payment_id') then raise exception 'payment_mismatch'; end if;
    if r.paid_at is not null then return to_jsonb(r); end if;
    if r.status not in ('checkout','expired') then raise exception 'invalid_transition'; end if;
    update public.reservations set status='confirmed',paid_at=now(),expires_at=null,
      stripe_session_id=p_data->>'session_id',stripe_payment_id=p_data->>'payment_id',
      invoice_number=public.ca_number('CA-'),invoice_date=(now() at time zone 'Atlantic/Canary')::date where id=p_id;
    perform public.ca_enqueue(p_id,'confirmed',p_id || ':confirmed');
  elsif p_action='expire_checkout' then
    if r.status='checkout' then
      if r.stripe_session_id is not null and r.stripe_session_id is distinct from p_data->>'session_id' then raise exception 'payment_mismatch'; end if;
      update public.reservations set status='expired',expires_at=null where id=p_id;
    end if;
  elsif p_action in ('approve','extend','mark_paid') then
    if r.payment_method <> 'bank' then raise exception 'invalid_transition'; end if;
    if p_action='approve' and r.status <> 'request' then raise exception 'invalid_transition'; end if;
    if p_action='extend' and r.status <> 'awaiting_transfer' then raise exception 'invalid_transition'; end if;
    if p_action='mark_paid' and r.status not in ('awaiting_transfer','expired') then raise exception 'invalid_transition'; end if;
    if r.start_date < (now() at time zone 'Atlantic/Canary')::date or (p_action <> 'mark_paid' and r.start_date = (now() at time zone 'Atlantic/Canary')::date) then raise exception 'arrival_too_soon'; end if;
    if not exists(select 1 from public.calendar_sync_state where completed_at > now() - interval '2 minutes') then raise exception 'calendar_unavailable'; end if;
    if public.ca_has_conflict(r.start_date,r.end_date,p_id) then raise exception 'dates_unavailable'; end if;
    if p_action='mark_paid' then
      update public.reservations set status='confirmed',paid_at=now(),expires_at=null,
        invoice_number=public.ca_number('CA-'),invoice_date=(now() at time zone 'Atlantic/Canary')::date where id=p_id;
      perform public.ca_enqueue(p_id,'confirmed',p_id || ':confirmed');
    else
      deadline := case when p_action='approve' then now() + interval '48 hours' else (p_data->>'expires_at')::timestamptz end;
      if deadline is null or deadline <= now() or (p_action='extend' and deadline > (r.start_date::timestamp at time zone 'Atlantic/Canary')) then raise exception 'invalid_deadline'; end if;
      if p_action='extend' and deadline <= r.expires_at then raise exception 'invalid_deadline'; end if;
      update public.reservations set status='awaiting_transfer',expires_at=deadline where id=p_id;
      perform public.ca_enqueue(p_id,'approved',p_id || ':approved:' || deadline,jsonb_build_object('expires_at',deadline));
    end if;
  elsif p_action='expire_bank' then
    if r.status='awaiting_transfer' and r.expires_at <= now() then
      update public.reservations set status='expired' where id=p_id;
      perform public.ca_enqueue(p_id,'expired',p_id || ':expired:' || r.expires_at);
    end if;
  elsif p_action in ('reject','release') then
    if (p_action='reject' and r.status <> 'request') or (p_action='release' and r.status <> 'awaiting_transfer') then raise exception 'invalid_transition'; end if;
    update public.reservations set status=case when p_action='reject' then 'rejected' else 'expired' end,expires_at=null where id=p_id;
    perform public.ca_enqueue(p_id,'released',p_id || ':released:' || p_action);
  elsif p_action='cancel' then
    if r.status <> 'confirmed' then raise exception 'invalid_transition'; end if;
    if p_data->>'reason' not in ('guest','owner') then raise exception 'invalid_request'; end if;
    days := r.start_date - (now() at time zone 'Atlantic/Canary')::date;
    percentage := case when p_data->>'reason'='owner' or days >= 14 then 100 when days >= 7 then 50 else 0 end;
    refund := round(r.total_cents * percentage / 100.0);
    if (p_data->>'expected_refund_cents')::integer is distinct from refund then raise exception 'refund_quote_changed'; end if;
    update public.reservations set status='cancelled',cancelled_at=now(),cancellation_reason=p_data->>'reason',refund_cents=refund,
      refund_state=case when refund=0 then 'none' when payment_method='bank' then 'manual' else 'pending' end,
      credit_number=case when refund>0 then public.ca_number('CR-') else null end,conflict=false where id=p_id;
    perform public.ca_enqueue(p_id,'cancelled',p_id || ':cancelled');
  elsif p_action='refund_result' then
    if r.status <> 'cancelled' or r.refund_cents=0 then raise exception 'invalid_transition'; end if;
    if r.refund_state='succeeded' then return to_jsonb(r); end if;
    if p_data->>'state' not in ('pending','failed','succeeded') then raise exception 'invalid_request'; end if;
    if r.stripe_refund_id is not null and r.stripe_refund_id is distinct from p_data->>'refund_id' then raise exception 'payment_mismatch'; end if;
    update public.reservations set refund_state=p_data->>'state',stripe_refund_id=p_data->>'refund_id' where id=p_id;
    if p_data->>'state' in ('succeeded','failed') then
      perform public.ca_enqueue(p_id,'refund_' || (p_data->>'state'),p_id || ':refund:' || (p_data->>'state'),'{}',p_data->>'state'='failed');
    end if;
  elsif p_action='bank_refunded' then
    if r.payment_method <> 'bank' or r.refund_state <> 'manual' then raise exception 'invalid_transition'; end if;
    update public.reservations set refund_state='succeeded' where id=p_id;
    perform public.ca_enqueue(p_id,'refund_succeeded',p_id || ':refund:succeeded');
  elsif p_action='acknowledge_conflict' then
    update public.reservations set acknowledged_conflict_key=conflict_key,conflict=false where id=p_id;
  elsif p_action='resend' then
    if r.paid_at is null then raise exception 'invalid_transition'; end if;
    perform public.ca_enqueue(p_id,case when r.status='cancelled' then 'cancelled' else 'confirmed' end,p_id || ':resend:' || gen_random_uuid());
  else raise exception 'invalid_action';
  end if;
  update public.reservations set updated_at=now() where id=p_id;
  perform public.ca_detect_conflicts();
  insert into public.booking_audit(booking_id,action,actor,details) values(p_id,p_action,p_actor,p_data);
  select * into r from public.reservations where id=p_id;
  return to_jsonb(r);
end $$;
create function public.ca_claim_mail(p_limit integer default 10) returns setof public.booking_outbox
language sql security definer set search_path = public, pg_temp as $$
  update public.booking_outbox set locked_until=now() + interval '5 minutes',claim_token=gen_random_uuid(),attempts=attempts+1
    where id in(select id from public.booking_outbox where sent_at is null and available_at<=now()
      and (locked_until is null or locked_until<now()) order by created_at for update skip locked limit least(p_limit,20)) returning *
$$;
create function public.ca_rate_limit(p_key text, p_limit integer, p_seconds integer) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  insert into public.booking_rate_limits values(p_key,now(),1)
    on conflict(key) do update set
      count=case when booking_rate_limits.window_start < now() - make_interval(secs=>p_seconds) then 1 else booking_rate_limits.count+1 end,
      window_start=case when booking_rate_limits.window_start < now() - make_interval(secs=>p_seconds) then now() else booking_rate_limits.window_start end
    returning count into n;
  delete from public.booking_rate_limits where window_start < now() - interval '2 days';
  return n <= p_limit;
end $$;

-- No browser role may read guest data or invoke inventory/payment operations.
do $$ declare t text; f record; begin
  foreach t in array array['reservations','external_calendar_events','calendar_sync_state','booking_number_series','booking_documents','booking_outbox','booking_audit','booking_rate_limits'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
  for f in select oid::regprocedure as signature from pg_proc where pronamespace='public'::regnamespace and proname like 'ca\_%' escape '\' loop
    execute format('revoke all on function %s from public, anon, authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
grant usage, select on sequence public.booking_audit_id_seq to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('booking-documents','booking-documents',false,5242880,array['application/pdf'])
on conflict(id) do update set public=false;

create function public.ca_replace_manual(p_events jsonb) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform pg_advisory_xact_lock(73427037);
  delete from public.external_calendar_events where source='webhook';
  insert into public.external_calendar_events(source,uid,start_date,end_date)
    select 'webhook',uid,start_date,end_date from jsonb_to_recordset(p_events) as x(uid text,start_date date,end_date date);
  perform public.ca_detect_conflicts(); return true;
end $$;
revoke all on function public.ca_replace_manual(jsonb) from public,anon,authenticated;
grant execute on function public.ca_replace_manual(jsonb) to service_role;

create policy booking_documents_deny_browser_access on storage.objects as restrictive
  for all to anon, authenticated
  using (bucket_id <> 'booking-documents') with check (bucket_id <> 'booking-documents');
