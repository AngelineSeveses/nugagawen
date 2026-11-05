# Nugagawen

**Less deciding. More doing.** Tell the app what you're in the mood for and your budget; it picks three places nearby: a Safe choice, a Surprise, and a Hidden gem.

Expo (SDK 58) · React Native · TypeScript · Expo Router.

## Run it on your phone

No API key or payment is needed. Finding places works **offline**, because the data ships inside the app. The map, routes and photos need an internet connection.

### Quick look: Expo Go

1. Install dependencies (once): `npm install`
2. Start the dev server: `npm run go`
3. Install **Expo Go** on your phone (App Store / Google Play) and scan the QR code shown in the terminal. Phone and computer must be on the same Wi-Fi.

Everything works here except the map itself, which shows a short notice instead. Times, distances and written directions still appear.

### The full app, with the map: a development build

MapLibre, the map library, includes native code, and Expo Go can only run the native code it was shipped with. A **development build** is your own version of Expo Go with MapLibre inside. You install it once, then start the dev server with `npx expo start` and open the app. You only rebuild when native code changes.

- **Android phone:** create a free account at [expo.dev](https://expo.dev/signup), then run `npx eas-cli build --platform android --profile development` and install the file from the link it gives you. Expo's Free plan includes up to 15 Android and 15 iOS builds ([current terms](https://expo.dev/pricing)).
- **iPhone:** a cloud build for a real iPhone requires a paid Apple Developer account. According to [Expo's docs](https://docs.expo.dev/develop/development-builds/create-a-build/), the only way without one is a local build with Xcode (`npx expo run:ios --device`).
- **On this Mac, without a phone:** install Xcode or Android Studio, then run `npx expo run:ios` or `npx expo run:android`. Native build tools can struggle with spaces in folder names, so rename this folder first (see [the roadmap](docs/04-roadmap.md#6-before-phase-7-things-only-you-can-do)).

The first cloud build asks for an app ID, such as `com.yourname.nugagawen`. It identifies the app in the stores, so choose it with care.

## Maps and directions

| Part | What does it | Cost and limits |
|---|---|---|
| Drawing the map | MapLibre React Native (`maplibre-gl` in the web preview) | Free, open source |
| Map tiles and style | [OpenFreeMap](https://openfreemap.org), or [MapTiler](https://www.maptiler.com) if `EXPO_PUBLIC_MAPTILER_KEY` is set (see `.env.example`) | OpenFreeMap: no key or account. MapTiler free plan: non-commercial, pauses at its monthly limit |
| Routes and written directions | The public [OSRM](https://project-osrm.org) server at `routing.openstreetmap.de`, run by FOSSGIS, using OpenStreetMap roads | No key. Light use only; the app sends at most one request per second |
| Where the trip starts | `expo-location`, or the area chosen in the app if location is off | Free, on the phone |

**Before a public launch,** run your own routing server (OSRM, GraphHopper or Valhalla), because the public one isn't meant for heavy use. Then change the address in `src/services/routing/osrm.ts`.

**What directions can't do.** There are no jeepney or bus routes, and driving times don't include traffic. The screen says so and offers **Open in Google Maps**, which is a plain link with no API.

**Credit.** The directions screen credits OSRM and OpenStreetMap and links to [Fix the map](https://www.openstreetmap.org/fixthemap), as the routing server's policy requires. The map shows its own attribution.

## Photos

Photos are a separate service from the map: MapTiler and OpenFreeMap only supply map visuals.

- **Wikimedia Commons** supplies free photos for places whose OpenStreetMap listing links to one (`src/services/photos/wikimedia.ts`), with the photographer and licence always shown.
- **Other places** show a placeholder with their category icon. They also get a **See photos on Google Maps** link, which uses no API.
- **Foursquare isn't used.** Its photos are a paid Premium endpoint ([pricing](https://foursquare.com/pricing/)), and this project doesn't use paid APIs.

To check that the Commons service still answers: `node scripts/check-photos.mjs`.

## Where the places come from

Nugagawen uses **OpenStreetMap** (OSM), the free, volunteer-built map of the world, for every part of the Philippines: Metro Manila, Cebu, Davao, Baguio, Palawan and small provincial towns.

1. `node scripts/osm/fetch.mjs` downloads Philippine places and area names from the free public Overpass API into `data/osm-raw/` (not committed). It covers restaurants, cafés, fast food, bakeries, parks, gardens, museums, galleries, viewpoints, beaches, waterfalls, hot springs, malls, cinemas, zoos, aquariums and theme parks, plus every city, town, barangay, island and province name.
2. `node scripts/osm/build.mjs` turns that into one compact SQLite database, `assets/data/places.db`, with a controlled list of categories, duplicates merged, and private, closed or disused places removed.
3. The app opens that database with `expo-sqlite`. Every place search runs on the phone: no network calls, no rate limits, no costs.

To refresh the data (say, every few months), run both scripts again, then rebuild the app. A new data version is copied onto phones automatically on their next launch.

**What OSM does and doesn't have.** OSM has names, categories, locations, opening hours (for many places), cuisines, websites and accessibility info. It has **no star ratings, reviews, photos or menu prices**. So the app picks places by distance, by how well-known a place is (well-known chains and landmarks), and by how complete its listing is (hours, contact details, cuisine). Prices shown are typical estimates per category or chain, always marked "(estimate)".

**Licence.** Map data © OpenStreetMap contributors, under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/). The app shows this credit wherever place data appears. `assets/data/places.db` is a derived database, so it's also available under the ODbL.

**Optional: Google Places.** If you ever want ratings and photos, put a Google Places API (New) key in `.env.local` (see `.env.example`) and the app switches to Google. Google requires a billing account and charges beyond its free monthly allowance, so it's off by default.

## Languages

English (default) and Filipino, switchable any time in Settings → Language / Wika, remembered on the phone. On a phone set to Filipino, the app offers Filipino once on first launch. Text lives in `src/localization/en.ts` and `fil.ts`; Kain, Gala and Kahit Ano are brand labels (`brand.ts`) and stay the same in both languages.

## Commands

| Command | What it does |
|---|---|
| `npm run go` | Dev server for Expo Go (no map) |
| `npx expo start` | Dev server for a development build (with the map) |
| `npm run web` | Open in a browser, map included (for quick checks; the product is mobile-only) |
| `npm test` | Unit tests (recommendation rules, opening hours, formatting, route parsing) and searches against the real database in 12 places across the Philippines |
| `npm run typecheck` | TypeScript check |
| `npx expo-doctor` | Expo dependency and config health check |

## Where things are

```
src/app/          routes only (Expo Router): tabs, location modal, results, place/[id], directions/[id]
src/screens/      screen bodies
src/components/   shared UI (Text, Button, ChoiceGroup, RecommendationItem, …), icons, map/ (phone and web maps)
src/hooks/        screen data: directions, place photos
src/features/recommendation/   the rules that pick the three places (+ tests)
src/services/     place data (OpenStreetMap database; optional Google), routing, photos, map links, location, on-device storage
scripts/osm/      fetch.mjs + build.mjs: download OSM data and build assets/data/places.db
src/state/        preferences and saved places (React context, stored on the phone)
src/theme/        design tokens: colors, type scale, spacing, radius
src/localization/ English and Filipino text (en.ts, fil.ts), brand labels, language switching
docs/             product spec, UX, design system, roadmap
```
