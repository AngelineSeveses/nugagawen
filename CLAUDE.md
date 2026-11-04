# Development Philosophy

- Build incrementally. Do not generate the entire application at once.
- Explain important implementation decisions before making complex changes.
- Prefer readable, maintainable TypeScript over unnecessarily clever code.
- Explain new React Native, JavaScript, and TypeScript concepts.
- Never introduce dependencies without explaining why they are needed.
- Follow official Expo and React Native documentation.
- Do not modify unrelated files.
- Test changes and report what was tested.
- Never claim a feature works without verifying it.
- Prioritize learning, code quality, accessibility, and usability.
- Do not sacrifice maintainability for faster AI-generated output.

# Project docs (source of truth; read before building)

- [docs/01-product.md](docs/01-product.md): PRD, audience, personas, journey, recommendation rules, open decisions D1–D6
- [docs/02-ux.md](docs/02-ux.md): screen inventory, navigation, flows, wireframes and states for every screen
- [docs/03-design-system.md](docs/03-design-system.md): visual identity, contrast-verified palette, tokens, components, accessibility, anti-AI rules
- [docs/04-roadmap.md](docs/04-roadmap.md): phases, architecture, dependency plan
- [docs/mockups/index.html](docs/mockups/index.html): Phase 5 hi-fi mockups (preview via the "mockups" config in `.claude/launch.json`)

The original master brief (from the user, 4 Nov 2026) is summarised across these docs. When a doc and the brief disagree, the doc explains why; ask the user before reverting a documented deviation.

# Decisions from the user (4 Nov 2026, build start)

- **Two languages: English (default) and Filipino** (user decision, 4 Nov 2026). All UI text lives in `src/localization/en.ts` and `fil.ts` (same keys, enforced by the `Copy` type and `localization.test.ts`). Components read it with `useCopy()`; never hardcode UI text. Word things at display time (reasons, prices, hours, categories), never store translated text.
- **Brand words never translate:** Nugagawen, Kain, Gala, Kahit Ano live in `src/localization/brand.ts`, and always appear with a description in the current language. Business names and addresses are never translated.
- **Design direction:** clean, timeless, sophisticated, modern. Keep the brief's font (Plus Jakarta Sans) and colors.
- **Icons:** Phosphor only (`phosphor-react-native`), imported per icon through `src/components/icons.ts`.
- **Logo:** the user's wordmark, as `assets/images/logo.png` (white on transparent; tint it with the `Logo` component). App icon, splash and favicon are generated from it.
- **Place data (user decision, 4 Nov 2026): OpenStreetMap, no paid APIs, no billing.** `scripts/osm/fetch.mjs` (Overpass, build time only) and `scripts/osm/build.mjs` produce `assets/data/places.db`, opened on device with `expo-sqlite` (`src/services/places/osm/`). All searches are local. Don't add runtime APIs. Google Places remains only as an opt-in if `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` is set.
- OSM has no ratings, reviews, photos or prices: never display or imply them. Ranking uses `PlaceSignals` (brand, notable, hours, contact, cuisine); prices are category/brand estimates, always marked as estimates. Show "© OpenStreetMap contributors" wherever place data appears (ODbL).

# Working in the code

- Read `AGENTS.md` (Expo SDK 58 rules: check versioned docs or installed type definitions before using an Expo API; install with `npx expo install`).
- Tokens only from `@/theme`; text only through `@/components/text`; screens import components.
- Before calling anything done: `npm run typecheck`, `npm test`, and look at it running (`app-web` config in `.claude/launch.json` for a quick browser check; Expo Go on a phone for the real thing).

# Tooling

- Expo plugin (`expo@claude-plugins-official`) is installed at user scope — use its skills (expo-router, expo-ui, expo-animation, expo-design-system, etc.) for app work.
- `frontend-design` skill is installed in this project at `.claude/skills/frontend-design` (tracked in `skills-lock.json`).
- For motion, prefer the Expo plugin's `expo-animation` guidance; the web-oriented `animate` / `apple-design` principles (springs, interruptibility, reduced motion) still apply.
