# Nugagawen

**Less deciding. More doing.** Tell the app what you're in the mood for and your budget; it picks three places nearby: a Safe choice, a Surprise, and a Hidden gem.

Expo (SDK 58) · React Native · TypeScript · Expo Router.

## Run it on your phone

1. Install dependencies (once): `npm install`
2. Start the dev server: `npx expo start`
3. Install **Expo Go** on your phone (App Store / Google Play) and scan the QR code shown in the terminal. Phone and computer must be on the same Wi-Fi.

The app works **offline** with no API key, account or payment. Place data comes from OpenStreetMap and ships inside the app.

## Where the places come from

Nugagawen uses **OpenStreetMap** (OSM), the free, volunteer-built map of the world, for every part of the Philippines: Metro Manila, Cebu, Davao, Baguio, Palawan and small provincial towns.

1. `node scripts/osm/fetch.mjs` downloads Philippine places and area names from the free public Overpass API into `data/osm-raw/` (not committed). It covers restaurants, cafés, fast food, bakeries, parks, gardens, museums, galleries, viewpoints, beaches, waterfalls, hot springs, malls, cinemas, zoos, aquariums and theme parks, plus every city, town, barangay, island and province name.
2. `node scripts/osm/build.mjs` turns that into one compact SQLite database, `assets/data/places.db`, with a controlled list of categories, duplicates merged, and private, closed or disused places removed.
3. The app opens that database with `expo-sqlite`. Every search runs on the phone: no network calls, no rate limits, no costs.

To refresh the data (say, every few months), run both scripts again, then rebuild the app. A new data version is copied onto phones automatically on their next launch.

**What OSM does and doesn't have.** OSM has names, categories, locations, opening hours (for many places), cuisines, websites and accessibility info. It has **no star ratings, reviews, photos or menu prices**. So the app picks places by distance, by how well-known a place is (well-known chains and landmarks), and by how complete its listing is (hours, contact details, cuisine). Prices shown are typical estimates per category or chain, always marked "(estimate)". Places show a category icon instead of a photo.

**Licence.** Map data © OpenStreetMap contributors, under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/). The app shows this credit wherever place data appears. `assets/data/places.db` is a derived database, so it's also available under the ODbL.

**Optional: Google Places.** If you ever want ratings and photos, put a Google Places API (New) key in `.env.local` (see `.env.example`) and the app switches to Google. Google requires a billing account and charges beyond its free monthly allowance, so it's off by default.

## Languages

English (default) and Filipino, switchable any time in Settings → Language / Wika, remembered on the phone. On a phone set to Filipino, the app offers Filipino once on first launch. Text lives in `src/localization/en.ts` and `fil.ts`; Kain, Gala and Kahit Ano are brand labels (`brand.ts`) and stay the same in both languages.

## Commands

| Command | What it does |
|---|---|
| `npx expo start` | Dev server (scan the QR code with Expo Go) |
| `npm run web` | Open in a browser (for quick checks; the product is mobile-only) |
| `npm test` | Unit tests (recommendation rules, opening hours, formatting) and searches against the real database in 12 places across the Philippines |
| `npm run typecheck` | TypeScript check |
| `npx expo-doctor` | Expo dependency and config health check |

## Where things are

```
src/app/          routes only (Expo Router): tabs, location modal, results, place/[id]
src/screens/      screen bodies
src/components/   shared UI (Text, Button, ChoiceGroup, RecommendationItem, …) and icons
src/features/recommendation/   the rules that pick the three places (+ tests)
src/services/     place data (OpenStreetMap database; optional Google), location, on-device storage
scripts/osm/      fetch.mjs + build.mjs: download OSM data and build assets/data/places.db
src/state/        preferences and saved places (React context, stored on the phone)
src/theme/        design tokens: colors, type scale, spacing, radius
src/localization/ English and Filipino text (en.ts, fil.ts), brand labels, language switching
docs/             product spec, UX, design system, roadmap
```
