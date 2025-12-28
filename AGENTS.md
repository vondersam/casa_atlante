# Casa Atlante (Next.js)

## Overview
- Marketing and booking website for Casa Atlante (holiday home rental).
- Next.js App Router app with API routes under `src/app/api`.
- Deployed to Vercel (see `README.md` for the live URL).

## Structure
- `src/app`: App Router pages, layouts, and route segments.
- `src/app/api`: API routes (availability, cron, booking requests).
- `src/lib`: Supabase client and availability sync utilities.
- `public`: Static assets.

## Commands
- `npm run dev`: Run the Next.js dev server.
- `npm run build`: Production build.
- `npm run start`: Start the production server.
- `npm run lint`: Run Next.js lint rules.

## Environment
- Node.js 24.x (see `package.json` engines).
- Expected env vars (typically in `.env.local`):
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `AIRBNB_ICAL_URL`, `BOOKING_ICAL_URL`
  - `CRON_SECRET`, `WEBHOOK_SECRET`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`
  - `BOOKING_REQUEST_TO` (default: `booking@casa-atlante.com`)

## Notes
- Cron endpoint requires `CRON_SECRET` authorization (see `README.md`).
- No test suite is defined in `package.json`.
