Website for the holiday home rental Casa Atlante, located on the island of La Palma, Canary Islands. Deployed with Vercel [here](https://www.casa-atlante.com/).

## i18n routing

- Default locale is English and uses unprefixed URLs (`/`, `/booking`).
- Spanish uses `/es` prefixed routes (`/es`, `/es/booking`).
- English and Spanish routes are real App Router routes with fixed-locale layouts, so the language selector does not depend on request rewrites.

## Translation files

- Messages live in-repo under:
  - `messages/en.json`
  - `messages/es.json`
- Keys are stable English-like identifiers and values contain only translated text.
- Recommended namespaces: `common`, `nav`, `footer`, `booking`, `calendar`, `errors`, `apiBooking`, `metadata`.

### Add or change translations

1. Add/update key in `messages/en.json`.
2. Mirror the same key in `messages/es.json`.
3. Use the key from UI/API code.
4. Run `npm run i18n:check`.
5. Run `npm run lint` and `npm run build`.

## Direct bookings

The site supports Stripe instant booking and owner-approved bank transfers. The owner dashboard is at `/admin`. Guest flows and agreements are available in English and Spanish.

Read [booking operations and setup](docs/booking-operations.md) before deploying. It covers the required database migration, Stripe webhooks, owner-only email-code authentication, private PDFs, five-minute Supabase Cron scheduling, iCal setup, environment variables, API contracts and recovery procedures. `STRIPE_ENABLED` defaults to disabled until setup is verified.

## Checks

Use Node.js 24, then run:

```bash
npm test
npm run lint
npm run i18n:check
npm run build
```

The booking tests use an isolated in-memory PostgreSQL engine; they do not contact production services.

## Background worker

The authenticated `/api/cron` endpoint reconciles pending payments/holds/refunds, imports calendars, and retries email delivery. Configure its five-minute schedule as described in the operations guide. The daily Vercel schedule is retained as a backup.
