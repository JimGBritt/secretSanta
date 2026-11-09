# Glass House Dance — Secret Santa 🩰

A whimsical, dance-themed Secret Santa site for the girls of [Glass House Dance](https://www.glasshousedance.com).
Parents open a link, tap their dancer's name, and the dancer pulls the curtain to reveal who she's shopping for.

- **Site:** static HTML/CSS/JS in `public/` (Azure Static Web Apps)
- **API:** Azure Functions (Node 20) in `api/`, data in one Azure Table Storage row
- **Admin:** `/admin` — enter names, set the gift exchange date, press **Draw**. Protected by the `ADMIN_KEY` app setting.
- **Privacy:** first names only, no accounts, no tracking, `noindex`.
- **Draw:** one random circle — nobody draws themselves, everyone gives and receives exactly once. Results are stored, so reloads show the same reveal.

## Develop
```sh
cd api && npm install && npm test      # logic + handler tests
ADMIN_KEY=test node dev/server.js      # http://localhost:4280 (in-memory store)
```

## Deploy
```sh
az group create -n rg-glasshouse-santa -l westus2
az deployment group create -g rg-glasshouse-santa -f infra/main.bicep -p adminKey="<choose-a-key>"
TOKEN=$(az staticwebapp secrets list -n <siteName> -g rg-glasshouse-santa --query properties.apiKey -o tsv)
(cd api && npm install --omit=dev)
SWA_CLI_DEPLOYMENT_TOKEN="$TOKEN" npx @azure/static-web-apps-cli@2 deploy ./public \
  --api-location ./api --api-language node --api-version 20 --env production
```
