# Glass House Dance — Secret Santa 🩰

A whimsical, dance-themed Secret Santa site for the girls of [Glass House Dance](https://www.glasshousedance.com).
Parents open a link, tap their dancer's name, and the dancer pulls the curtain to reveal who she's shopping for.

- **Site:** static HTML/CSS/JS in `public/`, served by a tiny dependency-free Node server (`server.js`) on Azure App Service (Linux, free F1 tier)
- **API:** JSON endpoints in `server.js` / `src/lib/`, data in one Azure Table Storage row
- **Admin:** `/admin` — enter names, set the gift exchange date, press **Draw**. Protected by a password (the `ADMIN_KEY` app setting).
- **Privacy:** first names only, no accounts, no tracking, `noindex`.
- **Draw:** one random circle — nobody draws themselves, everyone gives and receives exactly once. Results are stored, so reloads show the same reveal.

## Develop
```sh
npm install && npm test          # logic + handler tests
ADMIN_KEY=test node server.js    # http://localhost:4280 (in-memory store)
```

## Deploy
```sh
az group create -n rg-glasshouse-santa -l westus2
az deployment group create -g rg-glasshouse-santa -f infra/main.bicep -p adminKey="<choose-a-password>"
zip -qr app.zip server.js package.json package-lock.json src public
az webapp deploy -g rg-glasshouse-santa -n team-pitch-secret-santa --src-path app.zip --type zip
```
Site: https://team-pitch-secret-santa.azurewebsites.net (F1 quota is 0 in westus2 on this subscription, so the app lives in westus3).
