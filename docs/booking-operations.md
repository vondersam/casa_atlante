# Direct bookings and owner operations

Issue #37 adds full-payment Stripe bookings and an owner-approved bank-transfer path. The agreed base price is EUR 89 per night for two guests, plus EUR 20 for each additional guest (maximum four), plus 7% IGIC. Stays require 4–365 nights and arrival at least two Canary Islands calendar dates ahead. Amounts are calculated on the server in integer cents and rechecked by the database. There is no Stripe surcharge.

## Before deploying

1. Apply `supabase/migrations/202610030001_direct_bookings.sql` to a staging Supabase project first. It creates new tables and a private `booking-documents` bucket. It does **not** delete or alter the legacy `bookings` table. Export/retain a database backup before applying it to production. The new application reads the new tables; perform a successful initial import before enabling bookings. If there are manual blocks in the legacy table, transfer those through the authenticated manual-block API after reviewing their source. Do not copy imported events as manual blocks.
2. Configure the server environment below. Do not expose keys with a `NEXT_PUBLIC_` prefix. Keep `STRIPE_ENABLED=false` until setup and test payments pass. Deploy the migration before deploying the new application because the bank-transfer path also uses the new tables.
3. In Supabase Auth, create/invite **only** `casa.atlante.lapalma@gmail.com`. Disable public sign-ups. Configure production SMTP for Supabase Auth separately from the application's SMTP. In the Magic Link email template, include `{{ .Token }}` so the owner receives a code. Do not rely on Supabase's restricted default email sender. The app uses `shouldCreateUser:false`, verifies the user against Supabase on every protected request, and grants access only to the verified owner email.
4. Configure a Stripe webhook at `https://www.casa-atlante.com/api/stripe/webhook` (use the actual canonical `SITE_URL`). Subscribe to `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `refund.created`, `refund.updated`, and `refund.failed`. Use the webhook signing secret for the corresponding test/live endpoint. Stripe SDK 23 uses API version **2026-09-30.endive**; configure the endpoint to that version. Enable card payments in Stripe. The Checkout allowlist permits only `card`; eligible Apple Pay/Google Pay are presented by Stripe. Delayed bank debits and other asynchronous payment methods are excluded.
5. Configure the five-minute worker using the Supabase Cron instructions below. The checked-in Vercel daily cron remains a backup and is compatible with Hobby limits. A daily job alone is insufficient for the agreed background operation.
6. Add `/api/availability.ics` to **both** Airbnb and Booking.com as an imported calendar. Verify each platform actually blocks a test approved bank hold and a test confirmed booking, then clears a released hold after its next import. Keep the site's inbound `AIRBNB_ICAL_URL` and `BOOKING_ICAL_URL` configured as their exported feeds.
7. Verify owner code login, all acceptance cases below, SMTP delivery and private PDF downloads. Then set `STRIPE_ENABLED=true`. Use separate Stripe/Supabase test configuration for preview deployments; never send test confirmations to real guests.

No Stripe credentials, remote database migrations, Auth configuration, payment execution, or production deployment are performed by the repository tests.

## Environment

| Variable | Meaning |
| --- | --- |
| `SITE_URL` | Canonical HTTPS origin, e.g. `https://www.casa-atlante.com`. In development, `http://localhost:3000` is allowed. Used for redirects and same-origin checks. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Server-side database, private PDF storage, and isolated Auth client. |
| `AIRBNB_ICAL_URL`, `BOOKING_ICAL_URL` | Both HTTPS feeds are required for instant checkout and approval/payment confirmation of bank requests. Feed URLs are secrets. |
| `STRIPE_SECRET_KEY` | Server-side test/live Stripe key. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for this exact webhook endpoint. |
| `STRIPE_ENABLED` | Explicit `true` to offer/create instant checkout; default disabled. Existing webhooks/reconciliation continue when disabled. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` | Transactional SMTP. Port defaults to 587; port 465 implies TLS. |
| `MAIL_FROM` | Optional verified sender address; defaults to `SMTP_USER`. Never uses the guest as the envelope sender. |
| `NIF`, `IBAN`, `SWIFT` | Issuer tax ID and bank-transfer instructions. |
| `INVOICE_ISSUER_NAME` | Optional; defaults to Samuel Rodriguez Medina. Verify the actual fiscal issuer before launch. |
| `INVOICE_ISSUER_ADDRESS` | Optional; defaults to the existing Casa Atlante address. |
| `CRON_SECRET` | Long random bearer secret for the background worker. |
| `WEBHOOK_SECRET` | Long random secret for legacy manual-block/sync endpoints. Missing secrets deny access. |

Owner notifications and dashboard access are fixed to `casa.atlante.lapalma@gmail.com`. `BOOKING_REQUEST_TO` is no longer used by the new flow. The approved 7% IGIC rate is retained; the operator must keep fiscal identity/tax settings consistent with their business. Billing name, address, country and tax ID where applicable are collected before payment.

## Five-minute worker with Supabase Cron

Enable Supabase Cron (`pg_cron`) and HTTP requests (`pg_net`) in the project's dashboard. Store these two values using Supabase Vault's dashboard (do not paste them into source control):

- `casa_atlante_site_url`: the canonical `SITE_URL`.
- `casa_atlante_cron_secret`: the same `CRON_SECRET` as the application.

Run this in that project's SQL editor after the extensions and Vault secrets exist:

```sql
select cron.schedule(
  'casa-atlante-bookings',
  '*/5 * * * *',
  $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'casa_atlante_site_url') || '/api/cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'casa_atlante_cron_secret')
    ),
    timeout_milliseconds := 60000
  );
  $$
);
```

Check cron run history and `net._http_response` for failures. Requests must return HTTP 200; investigate 401 (secret mismatch), 502 (calendars/payments/mail), or timeouts. The dashboard shows the latest successful import and pending mail attempts. The authenticated “Refresh calendars and process pending work” action can run recovery manually. Extension/account configuration and actual Vercel plan limits must be verified in the target accounts; no Vercel plan upgrade is inherently required for this setup. [Supabase Cron](https://supabase.com/docs/guides/cron), [scheduled HTTP requests](https://supabase.com/docs/guides/functions/schedule-functions), [Vercel limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## State and concurrency

- Bank request: `request` (no dates blocked) → owner approval → `awaiting_transfer` (48-hour hold) → owner verifies full receipt → `confirmed`. Rejected requests become `rejected`; released/expired holds become `expired`.
- Card booking: `checkout` → verified paid Checkout Session → `confirmed`, or verified expiration → `expired`. A 10-second transport margin allows Stripe's minimum 30-minute expiry validation. The exact Stripe deadline is saved.
- All inventory mutations/imports take a common PostgreSQL transaction advisory lock. Overlapping website checkouts/approvals are rejected atomically. Checkout is exclusive, so back-to-back stays are permitted.
- Bank hold expiry is checked against the database clock on every reservation decision and against its timestamp in calendar reads/exports. A late “mark paid” rechecks availability. Approval always grants the agreed full 48 hours, including for short-notice requests. Extension must move the deadline forward and remain before arrival; the owner can record received payment on the arrival date.
- An overdue Stripe hold is **not** released solely by the clock. Reconciliation retrieves/expires the Session first; a payment that won the expiry race is preserved. Lost create responses are recovered by reservation metadata before any hold is released. An unresolved recovery keeps dates blocked and alerts the owner.
- Stripe Checkout creation uses a stable idempotency key and frozen parameters. Payment confirmation checks reservation metadata, session/payment IDs, EUR currency, and the complete amount. Repeated/out-of-order callbacks do not issue duplicate invoices, confirmations or refunds. The return page is never evidence of payment.
- Signed webhook requests are verified from the raw request body. Durable transitions finish before the webhook acknowledges success. The owner/guest emails are then processed immediately, with the cron worker retrying failures.
- A process crash after SMTP accepts a message but before the database records delivery can produce a duplicate email. Stable Message-ID and outbox leases reduce duplicates; SMTP cannot provide an exactly-once guarantee. Booking/payment/invoice operations remain idempotent. Mail failures never reverse a confirmed booking.

## Calendars and acknowledged conflicts

Both external feeds must refresh successfully before a new instant checkout or bank approval/payment confirmation. A failed feed leaves the previous snapshot intact and disables instant checkout; guests can still submit an unreserved bank request. Valid empty calendars clear previous imported events. Older concurrent imports cannot overwrite newer snapshots. Malformed or unsupported recurring iCal events fail closed. Do not configure recurring-rule calendars without extending the parser.

Incoming events and direct reservations are separate. Outgoing iCal contains **only confirmed direct bookings and active approved bank holds**, with stable UIDs and no guest details. Stripe checkout holds and unapproved requests are excluded. Own UIDs are ignored on reimport to avoid obvious feed loops.

An imported overlapping block may be another booking, a manually blocked date, or a platform copy with a rewritten UID. The application conservatively alerts the owner. If the owner verifies that the exact overlap represents the same direct booking, “Acknowledge verified calendar copies” records that decision. The same unchanged copies no longer block owner completion; a new/changed conflict alerts again. Another direct reservation is never bypassed by this acknowledgement. Never acknowledge an actual competing guest booking.

The owner must manually update Airbnb/Booking.com after confirmation, cancellation, and release/expiry of a manually copied bank hold. iCal remains delayed backup: the website cannot force an external refresh. Accepted residual cross-platform double-booking risk is not presented as a synchronization guarantee.

## Cancellations and refunds

All cutoffs use **Atlantic/Canary** local calendar dates, including DST:

- 100% through 23:59 on the date 14 calendar days before check-in.
- 50% through 23:59 on the date 7 calendar days before check-in.
- 0% thereafter.
- Owner cancellation because the stay cannot be provided: 100%.

The amount includes IGIC and no service-fee deduction. The server recalculates it on confirmation; if a cutoff passed while the owner reviewed the screen, the action refuses the stale quote. Cancellation releases the dates, records the refund obligation and issues a sequential credit-note number where applicable. Stripe refunds are submitted/reconciled automatically and may remain pending or fail. Failure is shown in the dashboard and emailed to the owner; investigate in Stripe before attempting any separate manual refund. Original processing fees are Casa Atlante's cost. Bank refunds are made manually and then explicitly marked sent. Cancelling a paid booking and releasing an unpaid hold are separate operations.

## Documents and privacy

Accepted terms are stored as an immutable text snapshot with version, locale and server acceptance timestamp. Issuer and billing details are snapshotted with the booking. Payment creates a unique invoice number in a transactional annual series; cancellation with a refund creates a separate annual credit-note number. PDFs are retained in the private bucket and never overwritten by regeneration. Owner download routes authenticate every request; guests receive attachments. The operator retains/removes records in accordance with the published privacy policy and applicable accounting duties; there is no automatic deletion of invoices.

The font is Noto Sans, embedded as a subset; its OFL license is in `assets/fonts/OFL.txt`. No remote font fetch occurs during invoice generation. Font assets are included in Vercel function tracing. Runtime dependencies are Stripe (payments), pdf-lib and fontkit (PDFs); PGlite/tsx are development-only test tools.

## API contract

`POST /api/request-booking` requires same-origin JSON:

```json
{
  "requestId": "a-client-generated-UUID-v4",
  "locale": "en",
  "paymentMethod": "stripe",
  "firstName": "Guest",
  "lastName": "Name",
  "email": "guest@example.com",
  "message": "",
  "guests": 2,
  "start": "2027-06-01",
  "end": "2027-06-05",
  "billing": {"kind":"individual","name":"Guest Name","address":"Street, postcode and city","country":"GB","taxId":""},
  "termsVersion": "2026-10-03",
  "termsAccepted": true,
  "privacyAccepted": true
}
```

Response: `{ "ok": true, "url": "..." }` redirects to Stripe or a bearer-token status page. Reuse the same request ID **and exact normalized payload** after an uncertain network result. Changing the payload requires a new ID. Errors return `{ "error": "localized safe message", "code": "stable_code" }`; relevant statuses are 400, 401/403, 404, 409, 429 and 503. The API ignores client-supplied price calculations.

`GET /api/booking-status?token=...` returns limited booking status, dates and total, never contact/billing data. Treat the status URL as private. `/admin` and `/api/admin/*` require owner authentication for booking data/actions; cookie-changing and action requests also require the exact configured origin. `POST /api/availability` is retained for authenticated manual blocks only, accepts `{bookings:[{start,end}]}` including an empty array to clear manual blocks, and never replaces imported/direct bookings. Both legacy write endpoints fail closed when `WEBHOOK_SECRET` is absent.

## Validation

Use Node 24. Run `npm test`, `npm run lint`, `npm run i18n:check`, and `npm run build`. Tests run a local in-memory PostgreSQL engine (PGlite) and use fictional guests; they do not access Supabase or Stripe accounts. They cover serialized overlapping requests, empty imports, duplicate/late confirmations, expired holds, refund boundaries/DST, private-role permissions, outbox leases, iCal parsing, webhook signature verification and PDF generation.

Before live activation, run a Stripe **test-mode** end-to-end booking against staging, including a declined card, abandoned checkout, successful payment, duplicate webhook delivery, cancelled booking/refund and a temporarily failing SMTP server. Test a bank request → approval → extension → paid → cancellation → manual refund. Verify private document access is denied when logged out, and check English/Spanish content and narrow-screen/keyboard usability. Verify source feed outages offer only the request path. The automated local tests do not replace these account-dependent checks.

### Document character support

The embedded Noto Sans font supports Latin (including accents), Greek, and Cyrillic names. Guest and billing fields are checked before accepting payment; unsupported scripts must use a Latin-script spelling. Documents never silently replace a name with missing glyphs. Store the font and its OFL license with the deployment.
