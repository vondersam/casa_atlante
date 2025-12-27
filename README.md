Website for the holiday home rental Casa Atlante, located on the island of La Palma, Canary Islands. Deployed with Vercel [here](https://www.casa-atlante.com/).

## Cronjob

Trigger the cron endpoint manually with the cron secret:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.casa-atlante.com/api/cron
```
