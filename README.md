Website for the holiday home rental Casa Atlante, located on the island of La Palma, Canary Islands. Deployed with Vercel [here](https://www.casa-atlante.com/).

## Google Search Console verification

`public/googlea0852f88a5ebb71f.html` is the Google ownership verification file for `https://www.casa-atlante.com/`. Keep its filename and contents unchanged, including after verification succeeds.

After deploying to production, confirm that `https://www.casa-atlante.com/googlea0852f88a5ebb71f.html` displays the verification text without requiring login, then click **Verify** in Google Search Console.

### Crawl discovery and indexing reports

`src/app/robots.ts` serves `/robots.txt`, allows crawling (including the favicon), and advertises the existing `/sitemap.xml` with English and Spanish page URLs. After deployment, confirm both endpoints return HTTP 200 and submit `https://www.casa-atlante.com/sitemap.xml` in Search Console's **Sitemaps** report.

The November 2026 report lists `/night`, `/&`, and `/$` as **Not found (404)**. These are not site pages or sitemap entries; they should remain 404. No links to these paths were found in the current source. Their discovery source is unconfirmed: use **URL inspection** to check the referring page, if Google provides one, and correct that link if it exists. Do not redirect arbitrary missing paths to the homepage or block them in robots.txt; crawlers need to see the actual 404 response.

The reported `/favicon.ico?favicon.0e8eu-pf65txd.ico` returns HTTP 200 with an icon content type. **Crawled – currently not indexed** for this asset does not mean the site's HTML pages are excluded. Keep the favicon crawlable; it does not need to appear as a page in the sitemap.

For an actual content URL reported as excluded, inspect that URL and run **Test live URL** after deployment. Request indexing only for intended content pages. Sitemap discovery helps Google find pages but does not guarantee indexing or clear historical report entries immediately.

References: [Google's crawling-error guidance](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors), [favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search), and [sitemap submission](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

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

The generated invoice requires the following server-side environment variables:

- `NIF`
- `IBAN`
- `SWIFT`

## Cronjob

Trigger the cron endpoint manually with the cron secret:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.casa-atlante.com/api/cron
```
