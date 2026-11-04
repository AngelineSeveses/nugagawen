# Nugagawen: Product specification

> Deliverables 1–4: Product Requirements Document, target audience analysis, inclusive personas, user journey map.
> Status: draft v0.1, written 4 Nov 2026, waiting for your review. No user research has been done yet. Everything about users here is an **assumption to validate**, and it is labelled that way.

Related docs: [02 UX and information architecture](02-ux.md) · [03 Design system](03-design-system.md) · [04 Roadmap and architecture](04-roadmap.md)

---

## 1. Product Requirements Document

### 1.1 Problem

People lose time and energy deciding where to eat or where to go. Search and map apps answer "what exists?" with dozens of results; the person still has to browse, compare, and choose. The choice is often made under friction: a group that can't agree, a tight budget, an unfamiliar area, low data, or plain tiredness.

### 1.2 Product promise

**Less deciding. More doing.** Nugagawen asks two questions (what kind of outing, what budget), uses where you are, and answers with **three** grounded picks, each with a different role:

| Pick | Role | Why it exists |
|---|---|---|
| Safe choice | The most reliable match | Lets someone who doesn't want to think just go |
| Surprise me | A good option of a *different kind* | Breaks the "same place again" loop |
| Hidden gem | Highly rated but less known | Rewards curiosity, supports smaller places |

Nugagawen is **not** a map or a directory. It hands off to the user's maps app for navigation.

### 1.3 Goals

1. A returning user (location and preferences known) gets three picks in **10–15 seconds** from opening the app.
2. A first-time user understands what to do **without a tutorial**.
3. Every fact shown (name, rating, hours, photos) comes from real place data. Anything estimated is labelled as an estimate.
4. The core flow works for people with low digital literacy, large text settings, screen readers, and budget phones.

### 1.4 Non-goals (MVP)

- Turn-by-turn navigation or an in-app map (we deep-link to Google Maps / Apple Maps).
- User accounts, sign-in, or cloud sync. Saved places live on the device.
- Writing reviews, social feeds, chat, or sharing to group chats (sharing is a strong post-MVP candidate).
- Booking, payments, or deals.
- Advanced filters (cuisine, kid-friendly, parking). Activity + budget + radius only.

### 1.5 Functional requirements

**Discover (Home)**
- FR-1 The user can choose an activity: Kain (eat), Gala (go out), or Kahit ano (anything). Default: Kahit ano.
- FR-2 The user can choose a budget: Tipid (₱), Sakto (₱₱), or Sosyal (₱₱₱), each showing an approximate peso range per person. Default: Sakto.
- FR-3 The last-used activity, budget, location, and radius are remembered on the device.
- FR-4 One primary action, **Nugagawen?**, starts the recommendation.
- FR-5 If no location is set, the primary action opens location selection first, then continues to results.

**Location**
- FR-6 The user can use the device's current location (foreground permission only, asked in context, never on launch).
- FR-7 The user can search for an area manually, with suggestions as they type. Manual search works without granting location permission.
- FR-8 The user can choose a search radius: 1, 3, 5, or 10 km. Default: 3 km.
- FR-9 If permission is denied, the app explains how to enable it in Settings and keeps manual search available.

**Results**
- FR-10 The app shows up to three picks labelled Safe choice, Surprise me, and Hidden gem. Each shows photo, name, category, estimated cost per person, distance, rating (when available), and a one-line reason built from real attributes.
- FR-11 **Iba naman** (shuffle) replaces the picks with new ones from the same search, never repeating a place already shown this session.
- FR-12 The user can change preferences (back to Discover with selections kept) or start again (reset to defaults).
- FR-13 With fewer than three matches, the app shows what it found, says plainly that there are fewer options, and offers to widen the radius or change budget/activity.

**Place details**
- FR-14 Shows photos (with required attribution), name, category, rating and review count with source, estimated budget, address, distance, opening status/hours when available, description when available, and why it was picked.
- FR-15 **Directions** opens the device's maps app with the place as destination.
- FR-16 The user can save or unsave the place. Saving updates the button immediately and confirms with a short message.

**Saved**
- FR-17 Lists saved places (newest first) with thumbnail, name, category, estimated cost.
- FR-18 The user can remove a saved place, with **undo**.
- FR-19 Empty state explains how to save and links back to Discover.

**Profile / Settings**
- FR-20 Default activity, default budget, default radius, location preference.
- FR-21 Privacy: what is stored on the device, a control to clear saved places, location permission status with a link to system Settings.
- FR-22 About: version, data sources and attributions, open-source licences.

### 1.6 Recommendation logic (product rules)

The engine is a set of plain, testable rules. No machine learning in MVP.

**Inputs:** location, radius, activity, budget.

**1. Build a candidate pool.** One nearby search per request, up to 20 places, filtered by place types mapped from the activity:

| Activity | Place types (initial mapping, tune with real data) |
|---|---|
| Kain | restaurant, cafe, bakery, food court, dessert shop, coffee shop |
| Gala | park, museum, art gallery, tourist attraction, shopping mall, amusement park, zoo, aquarium, bowling alley, movie theater |
| Kahit ano | union of both |

Drop places that are permanently or temporarily closed. Prefer places open now. Places with unknown hours are kept but ranked lower.

**2. Budget fit.** Map the data source's price level to our bands:

| Band | Shown to user as | Matches price level |
|---|---|---|
| Tipid | ₱250 pababa (₱250 and below) | Free, Inexpensive |
| Sakto | ₱250–600 | Inexpensive, Moderate |
| Sosyal | ₱600 pataas (₱600 and up) | Expensive, Very expensive |

The budget question itself says "bawat tao" [per person] ("Magkano ang budget bawat tao?"), so prices on Results can stay short. Place details still spells out "bawat tao (tantya)" [per person (estimate)].

- If the place has a real price range from the data source, show that instead of the band.
- If price is unknown, keep the place, label cost "Walang presyo" (no price info), and rank it lower.
- **The peso values are assumptions.** Validate them in research (§2.4) before launch.

**3. Score each candidate** (0–1 each, weights to tune):
- Quality: Bayesian-adjusted rating, so 5.0 from 3 reviews doesn't beat 4.6 from 2,000. `adjusted = (v/(v+m))·R + (m/(v+m))·C`, with m ≈ 50 and C = the pool's mean rating.
- Closeness: `1 − distance / radius`.
- Budget fit: 1 for an exact band match, 0.5 for adjacent or unknown.
- Score = 0.5 quality + 0.3 closeness + 0.2 budget fit.

**4. Pick the three:**
- **Safe choice:** highest score among places with a strong track record (rating ≥ 4.2 and ≥ 100 reviews). Fallback: highest score overall.
- **Hidden gem:** rating ≥ 4.4 with relatively few reviews (≈ 10–300, or bottom third of the pool), not the Safe choice.
- **Surprise me:** a weighted-random pick among remaining places scoring within 80% of the best remaining one, preferring a *category that differs* from the Safe choice. This is controlled randomness, never a low-quality wildcard. (Changed from "upper half" during the build: a unit test showed that in small pools the upper half could hold only a same-category place, losing the variety.)

**5. Explain each pick** with a sentence assembled only from real attributes, for example "Mataas ang rating (4.6) at 850 m lang" ("Highly rated and only 850 m away"). Never invent atmosphere, dishes, or events.

**6. Shuffle** re-runs step 4 on the same pool, excluding places already shown. When the pool runs out, offer a wider radius instead of re-fetching.

**7. Fewer than three:** show what exists; say how many were found; offer "Palawakin sa 5 km" (widen to 5 km) and budget/activity changes.

### 1.7 Non-functional requirements

| Area | Requirement |
|---|---|
| Speed | Results visible ≤ 3 s after tapping the primary action on 4G. Skeleton (not a spinner) while loading. |
| Data cost | Request small photo sizes. Cache images. One search request per Nugagawen tap. Shuffle uses the existing pool. |
| Devices | Smooth on a budget Android phone (≈3 GB RAM). Layouts verified at 320, 360, 375, 390, 430 pt widths. |
| Accessibility | WCAG 2.2 AA where it applies to native mobile. Details in [03 Design system §12](03-design-system.md#12-accessibility-standards). |
| Privacy | No account. No location history stored or sent anywhere except to the place search. Saved places and preferences stay on the device. |
| Honesty | No fabricated places, ratings, reviews, or photos. Estimates labelled. Data source attributed. |
| Offline | A clear offline state with retry. Saved places list still opens offline. |
| Security | Place-search API key never shipped unrestricted. See [04 Roadmap §3](04-roadmap.md#3-key-technical-decisions). |

### 1.8 Success measures

The MVP has no analytics (privacy-first). These are measured in moderated usability sessions (Phase 6 and Phase 10):

| Measure | Target |
|---|---|
| Time from open to three picks (returning user) | Median ≤ 15 s |
| First-time users who complete the core flow unaided | ≥ 8 of 10 participants |
| Participants who can say what each of the three labels means | ≥ 7 of 10 |
| Searches in a dense area that return three picks | ≥ 80% |
| Participants who feel the picks are "worth considering" | ≥ 7 of 10 |

### 1.9 Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Price data is sparse for Philippine places | Budget filter feels wrong | Label estimates, include "no price info" state, validate peso bands |
| Thin coverage outside big cities | Fewer than three picks | Honest few-results state, one-tap radius widening |
| Place-search API cost and quota | Cost grows with users | One search per tap, field masks (request only needed fields), shuffle reuses pool, proxy with quotas |
| Data-provider terms (caching, attribution) | Compliance problem | Store place IDs only for saved places, show attributions; confirm current terms in Phase 9 before storing anything else |
| Taglish copy excludes non-Tagalog speakers and tourists | Lower comprehension | Centralised strings from day one; English option (open decision D3) |
| Brand palette reads as a common AI-generated look | Weakens the anti-AI goal | See [03 Design system §9.1](03-design-system.md#91-a-concern-about-the-palette-decision-d1) |
| Brand font missing the ₱ or ñ glyph | Broken-looking prices and place names (Parañaque, Las Piñas) | **Resolved in Phase 5:** the font file's character map contains ₱, ñ and Ñ |

### 1.10 Decisions (all six accepted by you on 4 Nov 2026)

| ID | Question | Decision |
|---|---|---|
| D1 | Keep the brief's palette, or explore a less common combination | Keep, with the contrast fixes. Checked on the Phase 5 mockups; judge again once real place photos are in (Phase 9) |
| D2 | One font family (Plus Jakarta Sans) instead of the brief's two | One family. See design system §9.3 |
| D3 | English UI option in MVP | **Changed by you on 4 Nov 2026: English is the main language.** A Taglish option can be added later as `src/copy/fil.ts` |
| D4 | Discover inside the tab bar (deviates from the brief's suggested file layout) | Yes. See [02 UX §6](02-ux.md#6-navigation-structure) |
| D5 | Merge "prototype" into the coded app with mock data | Yes. See [04 Roadmap](04-roadmap.md) |
| D6 | Proxy server vs. restricted API key for place search | **Superseded 4 Nov 2026:** place data now comes from OpenStreetMap, bundled in the app; no key, no server, no billing |

---

## 2. Target audience analysis

Nugagawen is for everyone. Instead of segmenting by age or job, this analysis segments by the **situation** and **constraints** that shape a decision, because the same person can be in different situations on different days.

### 2.1 Situations

| Situation | What changes |
|---|---|
| Alone, with free time | Wants something easy, possibly low cost, safe to go alone |
| With barkada (friends) | Group indecision. The app's answer settles the argument |
| As a couple / date | Atmosphere and a "nice enough" place matter; budget varies |
| With family / kids / elders | Accessibility, seating, kid-friendliness, parking, distance |
| Visiting an unfamiliar place | No local knowledge; trust in ratings matters more |
| Odd hours (shift workers, late nights) | "Open now" is essential |

### 2.2 Constraints that apply across all situations

| Constraint | Design response |
|---|---|
| Budget, from very tight to generous | Budget is one of only two questions; peso ranges make bands concrete |
| Digital literacy, from first smartphone to power user | Two questions, one big button, plain words, no hidden gestures for essential actions |
| Vision and reading | Text scales with system setting; contrast verified; no color-only meaning |
| Motor | Targets ≥ 44 pt; essential actions in the thumb zone; no precision gestures |
| Language | Taglish default; strings centralised for English (and later regional languages) |
| Connectivity and data cost | Light payloads; offline state; no auto-playing media |
| Device | Works on small, older Android phones as well as new iPhones |

### 2.3 Digital literacy levels to design for

1. **First-time or reluctant smartphone users.** Recognise big buttons and words, not icons alone. Avoid swipes and long-presses for anything important.
2. **Everyday users.** Comfortable with messaging and social apps. Expect standard patterns (tabs, back, sheets).
3. **Power users.** Want speed: remembered preferences, one tap to results.

The design is built for level 1 and stays fast for level 3. Remembered defaults let a power user tap once; large labelled controls carry a first-timer through.

### 2.4 Research assumptions to validate

| # | Assumption | How to validate (lightweight) |
|---|---|---|
| A1 | Three options reduce decision time compared with a list | 5 short task tests: same request in Nugagawen vs. a maps search |
| A2 | People understand "Safe choice / Surprise me / Hidden gem" without explanation | Ask participants to describe each label before tapping |
| A3 | The peso bands (₱250 / ₱600) match how people think about Tipid/Sakto/Sosyal | Quick survey of 20+ people in different regions and incomes |
| A4 | Taglish copy reads as friendly and clear to most users | Read-aloud test with participants from different regions and ages |
| A5 | Users trust ratings from the data source when attributed | Interview question after viewing place details |
| A6 | Not requiring an account increases first-session completion | Observe first-run sessions; note any sign-in expectations |

---

## 3. Inclusive personas

These are **proto-personas**: plausible people built from assumptions, to keep the team honest about who we design for. Replace with research-based personas after Phase 6. Each persona exists because they force a specific design requirement.

### Remedios, 68, retired teacher, Dagupan City
- **Phone:** mid-range Android, text size set to large. Uses Messenger and Facebook; asks a grandchild for help with new apps.
- **Goal:** find a place for Sunday merienda with grandchildren after mass.
- **Budget:** Tipid.
- **Frustrations:** small text, English-only screens, apps that ask to sign up first, too many choices.
- **Forces us to:** support large text without breaking layouts, use plain Filipino words, avoid account walls, keep the main flow to two choices and one button.

### Jomar, 21, college student, Sampaloc, Manila
- **Phone:** older Android, prepaid data.
- **Goal:** something cheap to do with friends between classes. Usually the group can't agree.
- **Budget:** Tipid.
- **Frustrations:** data-heavy apps, "budget" filters that still show expensive places.
- **Forces us to:** keep data usage low, make Tipid honest (free places count), make shuffle fast. Sharing to group chat is the top post-MVP request to watch for.

### Kat and Paolo, 31 and 33, working professionals, Taguig
- **Phone:** recent iPhone and Android.
- **Goal:** a weeknight dinner that isn't the usual chain, decided in the car after work.
- **Budget:** Sakto, sometimes Sosyal.
- **Frustrations:** decision fatigue, scrolling through reviews when tired.
- **Forces us to:** make the Safe choice good enough to go without reading more, make Hidden gem genuinely interesting, show "open now" and closing time up front.

### Ana, 42, nurse, Cebu City
- **Situation:** plans weekend outings for two kids (8 and 13) and a father who uses a wheelchair.
- **Goal:** somewhere everyone can enjoy and physically get into.
- **Budget:** Sakto.
- **Frustrations:** arriving at places with steps and no ramp; information that turns out wrong.
- **Forces us to:** show wheelchair-accessible entrance information when the data has it, never claim accessibility we don't know. "Accessible places only" is a strong post-MVP filter.

### Rizza, 35, BPO agent on night shift, Ortigas
- **Situation:** eats at 3 a.m.; free time is mid-morning.
- **Goal:** know what is actually open right now.
- **Budget:** Tipid to Sakto.
- **Frustrations:** recommendations for places that are closed.
- **Forces us to:** rank open-now places first, show opening status as text with an icon (not just green/red), handle "hours unknown" honestly.

### Daniel, 34, tourist from Germany, visiting Cebu
- **Phone:** iPhone with a local SIM. Reads English, not Filipino.
- **Goal:** good local food near the hotel, without tourist traps.
- **Budget:** Sakto.
- **Frustrations:** not knowing which places are good or what prices mean.
- **Forces us to:** plan for an English option (D3), show peso amounts rather than only ₱ symbols, make the Hidden gem logic favour well-rated local places.

---

## 4. User journey map

Main journey: a returning user who wants to go out now. The design response column links each moment to a concrete decision in the UX spec.

| Stage | User does | Thinks / feels | Risk | Design response |
|---|---|---|---|---|
| 1. Trigger | Feels hungry, bored, or has free time; group asks "saan tayo?" ("where to?") | Tired of deciding | Opens a maps app instead | App name and promise are the question itself: "Nugagawen?" ("What do we do?") |
| 2. Open | Opens the app | "Let's get this over with" | Splash, onboarding, or sign-up delays them | Opens straight to Discover; no onboarding carousel; no account |
| 3. Location | Checks the location line | "Is it looking near me?" | Wrong area; permission prompt with no context | Location shown as plain text at the top ("Malapit sa Poblacion, Makati"); permission asked only inside the location sheet with a reason |
| 4. Choose | Taps an activity and a budget | Quick, low-effort | Unclear options; tiny targets | Two questions, three large options each, defaults pre-selected and remembered |
| 5. Ask | Taps **Nugagawen?** | Slight anticipation | Long wait, spinner | Skeleton in the shape of the results; one orchestrated reveal |
| 6. Review | Reads three picks | "Okay, one of these" | Too much text; can't tell the picks apart | Lead pick large; two alternates as rows; each labelled with icon and words; one-line reason |
| 7. Not convinced | Taps **Iba naman** | "Show me something else" | Same places again; waiting | Instant shuffle from the existing pool; no repeats |
| 8. Inspect | Opens a pick | "Is it open? How far? How much?" | Key facts buried | Open status, distance, cost, address first; description after |
| 9. Decide and go | Taps **Directions** | Relief | Leaves the app confused | Opens their maps app with the destination set |
| 10. Later | Saves a place for another day | "Next time" | Can't find it again | Saved tab, one tap; undo on remove |

### Alternate journeys (designed in [02 UX §7](02-ux.md#7-screen-by-screen-ux))
- **First run, no location yet:** the primary action opens the location sheet first, then continues to results automatically.
- **Permission denied:** manual search remains; a plain explanation and a Settings link.
- **No or few results:** honest message, one-tap radius widening.
- **Offline:** clear message with retry; the Saved tab still works.
