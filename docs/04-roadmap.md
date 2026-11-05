# Nugagawen: MVP roadmap and architecture

> Deliverable 14: MVP development roadmap, plus the technical architecture and decisions the roadmap depends on.
> Status: draft v0.1, written 4 Nov 2026, waiting for your review.

Related docs: [01 Product](01-product.md) · [02 UX](02-ux.md) · [03 Design system](03-design-system.md)

---

## 1. Where we are

| Phase | Status |
|---|---|
| 1. Product planning | Drafted in [01 Product](01-product.md). Needs your review and decisions D1–D6 |
| 2. Information architecture | Drafted in [02 UX](02-ux.md) §5–6 |
| 3. Low-fidelity design | ASCII wireframes for every screen and state in [02 UX](02-ux.md) §7 |
| 4. Design system | Done. Font glyphs (₱, ñ) and icon names verified in Phase 5 |
| 5. High-fidelity design | Done (draft 2): [mockups/index.html](mockups/index.html). Decisions D1–D6 accepted 4 Nov 2026 |
| 6–8. Prototype, foundation, core functionality | **Built on 4 Nov 2026** at your request: all six screens, recommendation engine with unit tests, saved places, preferences, sample data mode |
| 9. Integration | **Switched to OpenStreetMap on 4 Nov 2026** (your decision: no paid APIs or billing). Place data is downloaded once with `scripts/osm/`, bundled as a SQLite database, and searched on the phone; works offline across the Philippines. Google Places stays only as an opt-in with a key |
| 10–11 | Not started |

**To view the mockups:** they're served by a small static server defined in `.claude/launch.json` (configuration "mockups", Python's built-in server on port 4321). In a Claude session, ask to open the mockups preview.

## 2. Roadmap

Each phase is split into small slices. One slice is roughly one working session: build, explain, test, report. Each phase lists the React Native / TypeScript concepts it introduces, since learning is a goal of this project.

### Phase 5: High-fidelity design
- **Deliverables:** hi-fi mockups of Discover, Results (three picks, loading, few results), and Place details, using the real tokens.
- **How:** a rendered mockup board viewable here in the app, or in Figma if you connect it (the Figma connection currently needs authorising). Mockups use clearly fictional sample places.
- **Exit:** palette decision D1 settled on real screens; the §13.2 anti-AI checklist passes.
- **Outcome (4 Nov 2026):** seven frames (Discover at 390, 360 and 320 pt; Results with three picks, loading, and fewer than three; Place details). Reviewing draft 1 found two real problems, both fixed and re-measured in draft 2:
  1. Results hid the third pick below the fold. Actions moved after the list, the lead photo went to 16:9, and thumbnails went to 72 pt. All three picks' labels and names now fit on a 390 × 844 screen.
  2. Budget ranges wrapped raggedly, and "₱250–600" broke on 360 pt Android phones. Ranges now use a deliberate two-line form, tile padding drops from 12 to 8 pt when needed, and "per person" moved into the question.
- **Still open:** photos are placeholders, so D1 gets a final look with real photos in Phase 9. Not mocked: Location sheet, Saved, Settings (they follow platform patterns; wireframes in 02 UX are the spec).

### Phase 6: Prototyping (proposed merge, decision D5)
A clickable prototype built separately would be thrown away. **Proposal:** the Expo app running with mock data on your own phone (Phases 7–8) *is* the interactive prototype. The prototype's work still happens (navigation testing, journey testing, a 5-person usability test), but against the real app.
- **Exit:** 5 usability sessions run against the mock-data app; findings fed back before Phase 9.

### Phase 7: Development foundation
- **Slices:**
  1. Create the project (latest Expo SDK, TypeScript strict), run it on your phone.
  2. Theme tokens (`src/theme/`) and the `Text` component; load Plus Jakarta Sans.
  3. `Button` and `ChoiceGroup` with all states.
  4. Navigation skeleton: tabs, Location sheet, Results, Place details as placeholder screens.
- **Exit:** the app runs on iOS and Android; navigating between every screen works; no hardcoded colors or sizes outside the theme.
- **You'll learn:** how Expo projects are structured, file-based routing, components and props, TypeScript types and strict mode, `StyleSheet`, safe areas.

### Phase 8: Core functionality (mock data)
- **Slices:**
  1. Discover screen with working selectors and remembered preferences.
  2. Mock places dataset (clearly fictional names, no real businesses) and distance calculation.
  3. Recommendation engine as plain TypeScript functions, with unit tests.
  4. Results screen with all states, shuffle included.
  5. Place details and Saved (save, remove, undo).
- **Exit:** the full main journey works end to end with mock data; engine tests pass; every state in [02 UX](02-ux.md) §7 can be triggered.
- **You'll learn:** React state and hooks, context, pure functions and why they're easy to test, writing unit tests, storing data on the device.

### Phase 9: Integration (real data)
- **Prerequisite (your action):** a Google Cloud project with the Places API (New) enabled and billing set up. I can't create accounts or enter payment details, so this part is yours.
- **Slices:**
  1. Current location with the permission flow (granted, denied, error).
  2. Manual area search with suggestions.
  3. Google places provider behind the same interface as the mock (§3.3), with field masks so we pay only for fields we use.
  4. Photos with attribution; Directions deep link.
  5. API key protection (decision D6).
- **Must confirm against current Google terms before storing anything beyond place IDs:** caching limits, attribution rules, and pricing per field.
- **Exit:** real searches in at least three areas (dense city, suburb, province) behave as specified; no unrestricted key in the app.
- **You'll learn:** permissions, `async`/`await`, environment variables and secrets, handling network errors, API cost control.

### Phase 10: Quality assurance
- Functional pass over every flow and state.
- Responsive pass at 320, 360, 375, 390, 430 pt, plus landscape.
- Accessibility pass: VoiceOver, TalkBack, largest text, Reduce Motion (the [§12](03-design-system.md#12-accessibility-standards) checklist).
- Performance on a budget Android phone.
- Anti-AI audit: the §13.2 checklist plus the Expo design-system skill's automated "native slop" checks.
- English strings, if D3 is accepted.
- Second usability round (5 people, including at least one older adult and one non-Tagalog speaker).

### Phase 11: Release preparation
- App icon and splash screen; store listing text and screenshots.
- Privacy policy; App Store privacy details and Google Play data-safety form (both simple: no account, no tracking, location used only for search).
- EAS Build for Android and iOS; internal testing track and TestFlight.
- Release checklist.
- **Prerequisite (your action):** Apple Developer Program and Google Play Console accounts.

### Definition of done for every screen
A screen is done only when all of these pass:
1. The brief's 17-point QA checklist (§15 of the brief).
2. The accessibility check in [03 Design system §12](03-design-system.md#12-accessibility-standards).
3. The anti-AI checklist in [03 Design system §13.2](03-design-system.md#132-review-checklist-every-screen-before-its-approved).
4. Tested on at least one iOS and one Android device or simulator, and the results reported.

---

## 3. Key technical decisions

### 3.1 Navigation
Expo Router, file-based. Routes live in `src/app/` (the current Expo template's convention). Discover sits inside the tab group (decision D4; reasoning in [02 UX §6](02-ux.md#6-navigation-structure)). The tab bar, headers, and Location sheet use the platform's own components.

### 3.2 Styling: StyleSheet, not NativeWind
The brief allows either. `StyleSheet` with TypeScript token files needs no extra build configuration, keeps every token typed, and teaches core React Native styling before adding a layer on top. NativeWind can be adopted later if it earns its place.

### 3.3 One interface for place data
Screens never know where place data comes from. They call a `PlacesProvider`:

```ts
interface PlacesProvider {
  searchNearby(query: NearbyQuery): Promise<Place[]>;
  getPlace(id: string): Promise<PlaceDetails>;
  searchAreas(text: string): Promise<AreaSuggestion[]>;
}
```

Phase 8 uses a mock provider; Phase 9 adds a Google provider. Swapping them changes one line. This is also how the recommendation engine stays testable: it takes a list of places and returns picks, with no network or React code inside.

### 3.4 Recommendation engine
Plain TypeScript in `src/features/recommendation/`: scoring, picking, and explanation as separate pure functions with unit tests. Rules are in [01 Product §1.6](01-product.md#16-recommendation-logic-product-rules).

### 3.5 State and storage
- React state, plus one context for preferences. No Redux or other state library for an app this size.
- Saved places and preferences are stored on the device in a key-value store (the choice between Expo's SQLite-backed store and AsyncStorage is made in Phase 8, with reasons).
- Saved places store the place ID plus the minimum needed to list them offline, subject to the Phase 9 terms check.

### 3.6 Maps and directions
**Changed in Nov 2026, user decision.** The first plan was a plain link to Google Maps or Apple Maps. The app now has its own directions screen; the README's "Maps and directions" section lists each service, its cost and its limits.

- **Map:** MapLibre React Native, because it's open source and works with any tile provider. It needs a development build, since Expo Go can't run its native code. In Expo Go the screen shows a notice and keeps the written directions.
- **Tiles:** OpenFreeMap by default, because it needs no key or account. Setting `EXPO_PUBLIC_MAPTILER_KEY` switches to MapTiler.
- **Routes:** the public OSRM server run by FOSSGIS, using OpenStreetMap roads. It's only for light use, so **a public launch needs its own routing server.**
- **Still handed to Google Maps:** live navigation, jeepney and bus routes, and traffic. None of these exist in the free OpenStreetMap services used here.

### 3.7 API key protection (decision D6, Phase 9)
A key inside a mobile app can be extracted. Two options:
- **Restricted key:** locked to our Android package and iOS bundle ID. Simplest, but quotas and abuse are harder to control.
- **Small proxy:** the app calls our own endpoint (an Expo Router API route on EAS Hosting, or a Firebase function), which holds the key. Hides the key, allows per-user rate limits and response shaping.

Recommendation: restricted key while developing, proxy before public release.

### 3.8 Firebase
Not needed for MVP: no accounts, no cloud sync, favorites on the device. It comes in if accounts or sync are added later, as the brief says ("when required").

---

## 4. Folder structure

```
nugagawen/                      project root (no spaces in the name; see §6)
├── CLAUDE.md                   working rules for AI sessions
├── docs/                       this specification
├── assets/                     fonts, app icon, splash
├── src/
│   ├── app/                    routes only: every file here is a screen URL
│   │   ├── _layout.tsx         root stack, fonts, providers
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx     platform tab bar
│   │   │   ├── index.tsx       Discover
│   │   │   ├── saved.tsx
│   │   │   └── settings.tsx
│   │   ├── location.tsx        form sheet
│   │   ├── results.tsx
│   │   └── place/[id].tsx
│   ├── screens/                screen bodies and their private parts
│   ├── components/             shared primitives (button.tsx, choice-group.tsx, …)
│   ├── theme/                  colors, typography, spacing, radius, shadows,
│   │                           dimensions, motion, index
│   ├── features/
│   │   └── recommendation/     score.ts, pick.ts, explain.ts (+ .test.ts)
│   ├── services/
│   │   ├── places/             provider interface, mock provider, Google provider
│   │   ├── location/           permission + current position
│   │   └── storage/            saved places, preferences
│   ├── data/                   mock places (fictional) for Phases 6–8
│   ├── copy/                   every UI string (fil.ts; en.ts if D3)
│   ├── hooks/
│   ├── types/                  Place, Preferences, Pick, …
│   └── utils/                  distance.ts, format-peso.ts (+ tests)
├── app.json
└── package.json
```

**Differences from the brief's suggested layout, and why**
- Routes in `src/app/` rather than `app/`: matches the current Expo template, keeping all app code under `src/`.
- Discover is `(tabs)/index.tsx` rather than a root `index.tsx` (decision D4).
- `profile.tsx` becomes `settings.tsx` (no account, so no profile).
- Added `screens/` (screen bodies kept out of the routes-only folder), `features/recommendation/` (business logic kept apart from data access), and `copy/` (strings in one place for translation).

## 5. Dependency plan

Every dependency gets explained when it's added. Most of these come with the Expo template; that's verified when the project is created, not assumed.

| Package | Why | Phase |
|---|---|---|
| `expo`, `expo-router`, `react-native`, `typescript` | The base app and file-based navigation | 7 (template) |
| `react-native-safe-area-context`, `react-native-screens` | Notches, home indicators, native screen containers | 7 (template) |
| `@expo/vector-icons` | Ionicons, our one icon family | 7 (template) |
| `expo-font` + `@expo-google-fonts/plus-jakarta-sans` | The brand typeface | 7 |
| `expo-image` | Photo caching and smooth loading; saves mobile data | 7 or 8 |
| `react-native-reanimated` | The results reveal and the save spring | 8 |
| `expo-haptics` | Selection and success feedback | 8 |
| Device key-value storage (choice in Phase 8) | Saved places and preferences | 8 |
| `jest-expo` (dev only) | Unit tests for the recommendation engine | 8 |
| `expo-location` | Current location | 9 |
| `@expo/ui` (only if our SDK supports what we need) | Native segmented control and grouped settings rows | 7–8 |
| `@maplibre/maplibre-react-native` | The interactive map on phones | Nov 2026 |
| `maplibre-gl` (v5; v6 doesn't bundle with Metro) | The same map in the web preview only | Nov 2026 |
| `expo-dev-client` | Lets a development build connect to the dev server, as Expo Go does | Nov 2026 |
| `eslint`, `eslint-config-expo` (dev only) | Linting: the `lint` script existed but couldn't run without them. Never shipped in the app | v1.2 |

**Deliberately not used in MVP:** NativeWind, Firebase, `react-native-maps`, Redux/Zustand, any UI kit.

## 6. Before Phase 7: things only you can do

1. **Rename the project folder.** It's currently `nu gagawen app ` with spaces and a trailing space, which some native build tools handle badly. Rename it to `nugagawen` while no Claude session is open in it, then open the renamed folder.
2. **Have a phone with Expo Go installed**, iOS or Android, to see the app running from day one.
3. **Phase 9:** Google Cloud project with the Places API (New) and billing.
4. **Phase 11:** Apple Developer Program and Google Play Console accounts.
