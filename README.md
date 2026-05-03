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

## Booking API locale payload

`POST /api/request-booking` accepts:

- `locale: "en" | "es"` (optional, defaults to `en`)

Validation errors and user-facing email copy are generated in the selected locale.

## Cronjob

Trigger the cron endpoint manually with the cron secret:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.casa-atlante.com/api/cron
```
