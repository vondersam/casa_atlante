import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { addDays, canaryDate } from "../src/lib/booking/policy";
import type { Reservation } from "../src/lib/booking/types";
let db: PGlite;
const start = addDays(canaryDate(), 40),
  end = addDays(start, 4);
const payload = (
  method = "stripe",
  overrides: Record<string, unknown> = {},
) => ({
  request_id: randomUUID(),
  request_digest: "digest",
  payment_method: method,
  start_date: start,
  end_date: end,
  guests: 2,
  guest: {
    firstName: "Test",
    lastName: "Guest",
    email: "test@example.invalid",
    message: "",
  },
  billing: {
    kind: "individual",
    name: "Test Guest",
    address: "Test",
    country: "GB",
    taxId: "",
  },
  issuer: {
    name: "Test",
    taxId: "TEST",
    address: "Test",
    iban: "TEST",
    swift: "TEST",
  },
  locale: "en",
  terms_version: "2026-10-03",
  terms_snapshot: ["Accepted terms"],
  ...overrides,
});
async function create(p = payload()): Promise<Reservation> {
  return (
    await db.query<{ r: Reservation }>(
      "select public.ca_create_reservation($1::jsonb) as r",
      [JSON.stringify(p)],
    )
  ).rows[0].r;
}
async function transition(
  id: string,
  action: string,
  data: Record<string, unknown> = {},
): Promise<Reservation> {
  return (
    await db.query<{ r: Reservation }>(
      "select public.ca_transition($1,$2,$3::jsonb) as r",
      [id, action, JSON.stringify(data)],
    )
  ).rows[0].r;
}
async function sync(events: Record<string, unknown>[] = []) {
  await db.query("select public.ca_sync_calendars($1::jsonb,now())", [
    JSON.stringify(events),
  ]);
}
async function confirm(r: Reservation) {
  return transition(r.id, "confirm_stripe", {
    session_id: `cs_${r.id}`,
    payment_id: `pi_${r.id}`,
    total: r.total_cents,
    currency: "eur",
  });
}
before(async () => {
  db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create role service_role; create schema storage; create table storage.objects(id uuid, bucket_id text); alter table storage.objects enable row level security; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit integer,allowed_mime_types text[]);",
  );
  await db.exec(
    await readFile(
      "supabase/migrations/202610030001_direct_bookings.sql",
      "utf8",
    ),
  );
});
after(async () => {
  await db.close();
});
beforeEach(async () => {
  await db.exec(
    "truncate reservations,external_calendar_events,calendar_sync_state,booking_outbox,booking_audit,booking_documents,booking_number_series,booking_rate_limits restart identity cascade",
  );
  await sync();
});
test("idempotent submissions do not create duplicate reservations; changed payload fails", async () => {
  const p = payload();
  const first = await create(p);
  const second = await create(p);
  assert.equal(first.id, second.id);
  assert.equal(first.total_cents, 38092);
  await assert.rejects(
    create({ ...p, request_digest: "changed" }),
    /idempotency_conflict/,
  );
});
test("competing checkout reservations cannot overlap; checkout date is exclusive", async () => {
  const results = await Promise.allSettled([create(), create()]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
  const adjacent = await create(
    payload("stripe", { start_date: end, end_date: addDays(end, 4) }),
  );
  assert.equal(adjacent.status, "checkout");
});
test("empty import removes stale external blocks but never erases direct paid bookings", async () => {
  await sync([
    { source: "airbnb", uid: "external", start_date: start, end_date: end },
  ]);
  await assert.rejects(create(), /dates_unavailable/);
  await sync();
  const r = await confirm(await create());
  await sync();
  assert.equal(
    (await db.query("select id from reservations where status='confirmed'"))
      .rows.length,
    1,
  );
  await assert.rejects(create(), /dates_unavailable/);
  assert.ok(r.invoice_number);
});
test("a stale concurrent sync cannot replace a more recent snapshot", async () => {
  await sync([
    { source: "airbnb", uid: "new", start_date: start, end_date: end },
  ]);
  await db.query("select ca_sync_calendars('[]',now()-interval '1 hour')");
  assert.equal(
    (await db.query("select * from external_calendar_events")).rows.length,
    1,
  );
});
test("duplicate payment confirmation issues one invoice and one email per recipient", async () => {
  const r = await create();
  const a = await confirm(r);
  const b = await confirm(r);
  assert.equal(a.invoice_number, b.invoice_number);
  assert.equal(
    (await db.query("select * from booking_outbox where kind='confirmed'")).rows
      .length,
    2,
  );
  await assert.rejects(
    transition(r.id, "confirm_stripe", {
      session_id: `cs_${r.id}`,
      payment_id: `pi_${r.id}`,
      total: 1,
      currency: "eur",
    }),
    /payment_mismatch/,
  );
});
test("checkout wall-clock expiry alone cannot release a possibly paid session", async () => {
  const r = await create();
  await db.query(
    "update reservations set expires_at=now()-interval '1 minute' where id=$1",
    [r.id],
  );
  await assert.rejects(create(), /dates_unavailable/);
  await transition(r.id, "expire_checkout");
  assert.equal((await create()).status, "checkout");
});
test("late verified payment is retained and an overlap raises one owner alert", async () => {
  const first = await create();
  await transition(first.id, "expire_checkout");
  await create();
  const paid = await confirm(first);
  assert.equal(paid.status, "confirmed");
  assert.equal(paid.conflict, true);
  await confirm(first);
  await sync();
  const notices = await db.query(
    "select * from booking_outbox where booking_id=$1 and kind='conflict'",
    [first.id],
  );
  assert.equal(notices.rows.length, 1);
});
test("unapproved bank request leaves dates free; approval rechecks availability", async () => {
  const bank = await create(payload("bank"));
  await create();
  await assert.rejects(transition(bank.id, "approve"), /dates_unavailable/);
});
test("bank hold is 48 hours, expires independently of cron, and late payment must recheck", async () => {
  const r = await transition((await create(payload("bank"))).id, "approve");
  assert.ok(r.expires_at);
  assert.ok(
    Math.abs(Date.parse(r.expires_at) - Date.now() - 48 * 3600000) < 60000,
  );
  await assert.rejects(create(), /dates_unavailable/);
  await db.query(
    "update reservations set expires_at=now()-interval '1 minute' where id=$1",
    [r.id],
  );
  await create();
  await assert.rejects(transition(r.id, "mark_paid"), /dates_unavailable/);
  await transition(r.id, "expire_bank");
});
test("bank extensions must move the deadline forward and stop before arrival", async () => {
  const r = await transition((await create(payload("bank"))).id, "approve");
  await assert.rejects(
    transition(r.id, "extend", {
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    }),
    /invalid_deadline/,
  );
  await assert.rejects(
    transition(r.id, "extend", { expires_at: addDays(end, 1) }),
    /invalid_deadline/,
  );
  const updated = await transition(r.id, "extend", {
    expires_at: new Date(Date.now() + 72 * 3600000).toISOString(),
  });
  assert.ok(updated.expires_at);
});
test("stale calendars fail closed for checkout and bank approval", async () => {
  await db.exec(
    "update calendar_sync_state set completed_at=now()-interval '3 minutes'",
  );
  await assert.rejects(create(), /calendar_unavailable/);
  const bank = await create(payload("bank"));
  await assert.rejects(transition(bank.id, "approve"), /calendar_unavailable/);
});
test("cancellation snapshot controls refunds; a confirmed booking cannot be released as unpaid", async () => {
  const r = await confirm(await create());
  await assert.rejects(transition(r.id, "release"), /invalid_transition/);
  await assert.rejects(
    transition(r.id, "cancel", { reason: "guest", expected_refund_cents: 0 }),
    /refund_quote_changed/,
  );
  const cancelled = await transition(r.id, "cancel", {
    reason: "guest",
    expected_refund_cents: r.total_cents,
  });
  assert.equal(cancelled.refund_state, "pending");
  assert.equal(cancelled.refund_cents, r.total_cents);
  assert.ok(cancelled.credit_number);
  await assert.rejects(
    transition(r.id, "cancel", {
      reason: "guest",
      expected_refund_cents: r.total_cents,
    }),
    /invalid_transition/,
  );
  assert.equal((await confirm(r)).status, "cancelled");
});
test("owner cancellation always returns 100%; bank refunds need explicit confirmation", async () => {
  const soon = addDays(canaryDate(), 3);
  let r = await create(
    payload("bank", { start_date: soon, end_date: addDays(soon, 4) }),
  );
  r = await transition(r.id, "approve");
  r = await transition(r.id, "mark_paid");
  r = await transition(r.id, "cancel", {
    reason: "owner",
    expected_refund_cents: r.total_cents,
  });
  assert.equal(r.refund_state, "manual");
  r = await transition(r.id, "bank_refunded");
  assert.equal(r.refund_state, "succeeded");
});
test("verified calendar copies can be acknowledged, but a new conflict alerts again", async () => {
  const r = await transition((await create(payload("bank"))).id, "approve");
  await sync([
    { source: "airbnb", uid: "copy", start_date: start, end_date: end },
  ]);
  await transition(r.id, "acknowledge_conflict");
  await sync([
    { source: "airbnb", uid: "copy", start_date: start, end_date: end },
  ]);
  assert.equal((await transition(r.id, "mark_paid")).conflict, false);
  await sync([
    { source: "airbnb", uid: "new-booking", start_date: start, end_date: end },
  ]);
  const row = await db.query<{ conflict: boolean }>(
    "select conflict from reservations where id=$1",
    [r.id],
  );
  assert.equal(row.rows[0].conflict, true);
});
test("mail claims cannot be taken by concurrent workers before their lease expires", async () => {
  await create(payload("bank"));
  const a = await db.query("select * from ca_claim_mail(10)"),
    b = await db.query("select * from ca_claim_mail(10)");
  assert.equal(a.rows.length, 2);
  assert.equal(b.rows.length, 0);
});
test("browser roles cannot access guest tables or privileged functions", async () => {
  const rows = await db.query<{ read: boolean; execute: boolean }>(
    "select has_table_privilege('anon','reservations','select') as read, has_function_privilege('authenticated','ca_transition(uuid,text,jsonb,text)','execute') as execute",
  );
  assert.deepEqual(rows.rows[0], { read: false, execute: false });
});

test("checkout expiry renewal requires the current uncreated session and cannot overwrite paid state", async () => {
  const r = await create();
  await assert.rejects(
    transition(r.id, "renew_checkout_creation", {
      expected_expiry: "2000-01-01T00:00:00Z",
    }),
    /invalid_transition/,
  );
  const renewed = await transition(r.id, "renew_checkout_creation", {
    expected_expiry: r.expires_at,
  });
  assert.ok(
    Date.parse(renewed.expires_at || "") >= Date.parse(r.expires_at || ""),
  );
  await confirm(renewed);
  const attached = await transition(r.id, "attach_session", {
    session_id: `cs_${r.id}`,
    expires_at: renewed.expires_at,
  });
  assert.equal(attached.expires_at, null);
  await assert.rejects(
    transition(r.id, "renew_checkout_creation", { expected_expiry: null }),
    /invalid_transition/,
  );
});
test("approval keeps the full agreed 48 hours even for an arrival two calendar days away", async () => {
  const near = addDays(canaryDate(), 2);
  const r = await create(
    payload("bank", { start_date: near, end_date: addDays(near, 4) }),
  );
  const approved = await transition(r.id, "approve");
  assert.ok(
    Math.abs(
      Date.parse(approved.expires_at || "") - Date.now() - 48 * 3600000,
    ) < 3000,
  );
});
test("private document policy overrides broader browser storage policies", async () => {
  await db.exec(
    "grant usage on schema storage to anon; grant select on storage.objects to anon; create policy test_broad_read on storage.objects for select to anon using (true); insert into storage.objects values (gen_random_uuid(),'booking-documents'),(gen_random_uuid(),'public-test'); set role anon",
  );
  try {
    assert.deepEqual(
      (await db.query("select bucket_id from storage.objects")).rows,
      [{ bucket_id: "public-test" }],
    );
  } finally {
    await db.exec("reset role; drop policy test_broad_read on storage.objects");
  }
});

test("an expired bank hold cannot reuse an old calendar acknowledgement after a new overlap", async()=>{
  const r = await create(payload('bank'));
  await transition(r.id,'approve');
  const copy = {source:'airbnb',uid:'calendar-copy',start_date:start,end_date:end};
  await sync([copy]);
  await transition(r.id,'acknowledge_conflict');
  await db.query("update reservations set expires_at=now()-interval '1 minute' where id=$1",[r.id]);
  await transition(r.id,'expire_bank');
  await sync([copy,{source:'booking.com',uid:'new-booking',start_date:start,end_date:end}]);
  await assert.rejects(transition(r.id,'mark_paid'),/dates_unavailable/);
});
