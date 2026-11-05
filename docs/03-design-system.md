# Nugagawen: Design system

> Deliverables 9–13: visual identity, design tokens, component inventory, accessibility standards, anti-AI design direction.
> Status: draft v0.1, written 4 Nov 2026, waiting for your review. Every contrast ratio in this file was computed (WCAG 2.x formula), not estimated.

> **Revision 2 (4 Nov 2026, build start).** The app is now built (see `src/`). Decisions from the user that override parts of this document: **English is the main UI language**, and every string now lives in [`src/copy/en.ts`](../src/copy/en.ts), which is the source of truth for copy (Taglish strings in the wireframes below are superseded); **Phosphor icons** replace Ionicons; the user's **logo** is used; the design moves to a cleaner, more timeless direction with the same font and colors.

### What changed in the design for revision 2
| Area | v1 (mockups) | v2 (built) | Why |
|---|---|---|---|
| Heading weight | Display/H1 Bold | SemiBold, tighter tracking (Display −0.8, H1 −0.6) | Lighter weights at large sizes read more refined |
| Selected option | Solid ink tile, white text | White surface, 1.5 pt ink outline, filled check | Calmer; still 15:1 contrast and never color alone |
| Unselected option | White tile | Transparent on paper with a hairline | Less visual weight; the selected one stands out |
| Icons | Ionicons | Phosphor (regular; fill when active) | User's choice |
| Wordmark | Text "Nugagawen?" | User's logo, tinted ink | User's choice |
| Primary CTA | "Nugagawen?" | "Decide for me" | English main language; says what happens |

Token values now live in code: [`src/theme/`](../src/theme/). Where this document and the theme files differ, the theme files win.

**Revision 3 (OpenStreetMap data).** OSM has no photos, ratings or prices. Places without a photo show a sage category tile with a specific Phosphor icon (coffee, burger, tree, waves…) instead of an empty photo frame; the Results lead pick uses a larger tile rather than a 16:9 placeholder. Rating rows appear only when real ratings exist. "© OpenStreetMap contributors" appears under results and place details (ODbL).

**Revision 4 (v1.2, Nov 2026).** The user's v1.2 brief refines the system. Where this revision and older sections below disagree, this revision wins.

| Area | Before | v1.2 | Why |
|---|---|---|---|
| Side padding | 24 | **16** on every screen | User's brief |
| Type scale | Display 32, H1 28, H2 24 | Display 28, H1 24, H2 22 | Headings stay modest, so the choices stay above the fold on small phones |
| Radius | 8, 12, 16 | 8 small controls, 12 inputs and tiles, 14 buttons, 16 cards, 20 tooltips, 24 large panels | User's brief |
| Borders | Mixed widths | 1 by default; a 2 ring for selected, drawn as an overlay so selecting never shifts the layout | User's brief |
| Selected state | Outline only on compact options (color alone) | Tiles: ink ring + check. Compact segments: solid ink fill. Never color alone | WCAG 1.4.1; the fill comes from the reference image |
| Containers | Spacing and hairlines | White cards with a 1 border for picks, saved places and settings groups | User's brief and reference image |
| Pick types | All sage | One card design; Safe Choice = sage + check, Surprise Me = coral tint + die, Hidden Gem = sand tint + gem | Distinguishable without three designs, and the word and icon say it too |
| Illustrations | None allowed (§9.5) | Original flat vector art for selectors, states and onboarding | User's brief. **Never presented as photos of real places** |
| Main action | "Find my three", tab "Discover" | Button "Discover", tab "Home" | The brief's guide says "Tap Discover"; two stacked "Discover" labels would be confusing |

**New tokens** (`src/theme/`): `tintCoral #FBE6DB`, `tintSand #F2EAD8`, `border`, `borderStrong`, `overlay`, `borderWidth`, radius `button`, `xl`, `xxl`, type `nav`, `tab`, and a separate `illustration` palette used only by `src/components/illustrations/`.

**Verified contrast for the new tints:** ink 13.06 / 13.13, inkSecondary 4.79 / 4.82, accentInk 4.72 / 4.74 (on tintCoral / tintSand). All pass 4.5:1.

**Kept deviations from the brief's palette.** The v1.2 brief lists Muted `#777168` and Warning `#A56617`, and also asks for WCAG 2.2 AA. On cream these measure 4.40:1 and 4.24:1, which fail AA, so `inkSecondary #6B655C` and `warning #965A12` stay.

**Reference image (travel app concept).** Taken: tinted selector tiles with art, a small label above a value beside an icon in a tinted circle, white bordered cards, round icon buttons, a solid dark fill for selected segments, modest section headings. Left out: its lavender and teal palette, tilted presentation, ticket shapes, points and voucher promos, and thin low-contrast text.

**Illustration style.** Flat, rounded shapes with no outlines, gradients or shadows. Coral, sage, sand and ink only. Each one explains something: Kain is rice with a spoon and fork, Gala is a palm tree and hills, Kahit Ano is dice. All are hidden from screen readers unless the words nearby don't already say it (onboarding art has a description).

**Components, by the brief's names**

| Brief | In the code |
|---|---|
| PrimaryButton, SecondaryButton | `Button` variants `primary`, `secondary` (plus `ghost`, `dark`) |
| IconButton, SectionHeader, ProgressIndicator, SearchInput | `icon-button`, `section-header`, `progress-indicator`, `search-input` |
| ActivitySelector, BudgetSelector, LocationPicker | `activity-selector`, `budget-selector` (over `choice-group`), `location-picker` |
| RecommendationCard, PlaceCard | `recommendation-card`, `place-card` |
| LoadingSkeleton | `Skeleton` in `misc` (a slow pulse; still with Reduce Motion) |
| EmptyState, ErrorState | `state-message` |
| OnboardingSlide | `onboarding-slide` |
| Tooltip | The tooltip in `features/guide/guide-overlay` |
| BottomNavigation | The tab layout in `src/app/(tabs)/_layout.tsx` |
| BottomSheet | Not needed yet: the Location screen uses the platform's modal |

Related docs: [01 Product](01-product.md) · [02 UX](02-ux.md) · [04 Roadmap and architecture](04-roadmap.md)

---

## 9. Visual identity

### 9.0 Concept: the question gets answered

The brand is a question: **Nugagawen?** ("What do we do?"). The interface stays quiet until it answers.

- **Discover asks.** A large, plain question ("Wala pang plano?") and one orange button with the brand's question on it.
- **Results answer.** An equally plain answer ("Pili ka na lang." [Just pick one.]) and three picks, the first one leading.
- **The orange button is a signboard.** Hand-painted shop signs and jeepney route boards use dark lettering on a solid bright field: direct, legible from a distance, warm. The primary action borrows that: dark ink on solid orange. It also happens to be the only accessible way to use this orange (see §9.2).

Everything else is ink on warm paper, so place photos carry the color.

**The one bold thing:** the question/answer type moments on Discover and Results. Everything around them stays disciplined.

**Design plan review.** First-pass ideas that were rejected for being generic defaults rather than choices made for this brief:

| First-pass idea | Why it was rejected | What replaced it |
|---|---|---|
| Serif display headline on the cream background | Cream + terracotta + serif is the most common generated look right now | One sans family; personality comes from the question/answer treatment |
| Three equal recommendation cards in a row or grid | The "SaaS card kit"; also makes all three picks look equally important | Lead pick + two rows, separated by space and hairlines |
| Pill chips for activity and budget | The brief bans excessive pills; chips are too small for first-time users | Large 12 pt-radius tiles with icon, label, and peso range |
| Sage used as a decorative tint | Decoration without a job | Sage marks Nugagawen's own voice: pick labels and "why this" reasons |
| White text on the orange button | Fails contrast (2.82:1) | Dark ink on orange (5.58:1), the signboard treatment |

### 9.1 A concern about the palette (decision D1)

Your palette (paper `#F7F4ED` + orange `#E77D51`) is very close to the single most common color scheme in AI-generated interfaces today: warm cream background with a terracotta/clay accent. Your brief's words win, so this spec keeps it. Three rules keep it from reading generic:

1. Orange appears once per screen: the primary action. Plus the app icon.
2. Sage has a functional job, so the palette reads as three colors working, not cream-and-orange.
3. No serif display type, the third ingredient of that look.

If the first high-fidelity screens still read generic, the cheapest lever is the accent hue. Paper, ink, and sage can stay. We'll judge that on real screens, not in theory.

**Phase 5 outcome (decision D1: keep).** On the mockups, orange appears exactly once on Discover (the Nugagawen? button) and once on Place details (Directions), and not at all on Results. With no serif and orange that scarce, the screens read as a quiet utility rather than the generic warm-cream look. The photos were placeholders, though, and photos carry most of the color, so judge again in Phase 9 with real place photos.

### 9.2 Color

**Roles**

| Role | Meaning |
|---|---|
| Paper | The page. Warm, low-glare background |
| Ink | Content: text, icons, and the selected state |
| Orange | The one action to take on this screen |
| Sage | Nugagawen speaking: pick labels, reasons, placeholders |
| Status colors | Success, error, warning messages only |

**Palette.** Brief values are kept; four accessible additions or adjustments are marked.

| Token | Value | Use | Source |
|---|---|---|---|
| `paper` | `#F7F4ED` | Screen background | Brief |
| `surface` | `#FFFFFF` | Inputs, selector tiles, sheets | Brief |
| `sage` | `#E6EBDE` | Pick labels, "Bakit ito?" block, photo placeholders | Brief |
| `ink` | `#24231F` | Primary text, icons, selected fill | Brief |
| `inkSecondary` | `#6B655C` | Secondary text | **Adjusted** from `#777168` (failed 4.40:1 on paper) |
| `accent` | `#E77D51` | Primary button fill, app icon. **Never text on a light background** | Brief |
| `onAccent` | `#24231F` | Text and icons on `accent` | **Added** (white fails, 2.82:1) |
| `accentInk` | `#A84B24` | Orange-family text or icon on light surfaces, when needed | **Added** (brief orange fails as text, 2.57:1) |
| `onInk` | `#FFFFFF` | Text and icons on `ink` (selected tiles) | — |
| `hairline` | `#DED8CC` | Decorative dividers only | Brief "Border" |
| `controlBorder` | `#8A8377` | Outline of text inputs and other controls whose edge identifies them | **Added** (hairline is 1.29:1, needs 3:1) |
| `success` | `#287A52` | Success text and icons | Brief |
| `error` | `#C13D36` | Error text and icons | Brief |
| `warning` | `#965A12` | Warning text and icons | **Adjusted** from `#A56617` (failed 4.24:1 on paper) |
| `scrim` | `rgba(36,35,31,0.55)` | Behind text placed on photos (attribution) | — |
| `skeleton` | `#EAE5DA` | Loading placeholders | — |

**Verified contrast** (text needs 4.5:1; control boundaries and state indicators need 3:1)

| Pair | Ratio | Result |
|---|---:|---|
| ink on paper / surface / sage | 14.32 / 15.73 / 12.96 | Pass |
| inkSecondary on paper / surface / sage | 5.25 / 5.77 / 4.75 | Pass |
| onAccent (ink) on accent | 5.58 | Pass |
| accentInk on paper / surface / sage | 5.17 / 5.68 / 4.68 | Pass |
| onInk (white) on ink | 15.73 | Pass |
| controlBorder vs paper / surface / sage | 3.42 / 3.75 / 3.09 | Pass (3:1) |
| success on paper / surface | 4.78 / 5.26 | Pass |
| error on paper / surface | 4.79 / 5.27 | Pass |
| warning on paper / surface / sage | 5.07 / 5.57 / 4.59 | Pass |

**Not allowed** (verified failures)

| Pair | Ratio | Rule |
|---|---:|---|
| accent as text on paper / surface | 2.57 / 2.82 | Use `accentInk` for orange text |
| white text on accent | 2.82 | Use `onAccent` |
| hairline as the only edge of an input | 1.29 / 1.42 | Use `controlBorder` |
| success / error text on sage | 4.33 / 4.34 | Status messages sit on paper or surface only |
| original `#777168` secondary text on paper | 4.40 | Replaced by `inkSecondary` |

**When a boundary needs 3:1.** A button or tile with a text label is identified by its label, so its edge can be a decorative hairline. A text input is identified by its edge, so it uses `controlBorder`. A selected state must always reach 3:1: selected tiles use an ink fill plus a check icon.

**Dark mode.** MVP ships light only, locked in the app config, so nothing half-breaks when the system theme changes. Tokens are stored as light/dark pairs from day one, so dark mode later is a values change, not a component rewrite.

### 9.3 Typography

**Family: Plus Jakarta Sans, one family only (decision D2).** The brief recommends Plus Jakarta Sans for headings with DM Sans for body. Both are geometric sans serifs of similar proportions, so side by side they look like a mistake rather than a pairing. One family with clear weight contrast is calmer, loads fewer font files (faster start on budget phones), and still meets "maximum two families". Plus Jakarta Sans was made for Jakarta's city identity by an Indonesian foundry, so it's a Southeast Asian typeface for a Southeast Asian product.

**Glyph coverage, verified in Phase 5.** The font file from Google's official fonts repository was read directly (its character map, not a browser guess). It contains `₱` (U+20B1), `ñ`, `Ñ`, the en dash, and the ellipsis, plus every character used in the mockup copy. A control character (Tifinagh) correctly came back missing, confirming the check works.

**Scale.** Brief sizes are kept. Line heights and tracking added. Tracking tightens as size grows.

| Style | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|
| Display | 32 / 38 | Bold 700 | −0.5 | The question and the answer (Discover, Results) |
| H1 | 28 / 34 | Bold 700 | −0.4 | Place name on details |
| H2 | 24 / 30 | SemiBold 600 | −0.2 | Rare: large empty-state titles |
| H3 | 20 / 26 | SemiBold 600 | −0.1 | Place name in Results, state titles |
| H4 | 18 / 24 | SemiBold 600 | 0 | Group labels, section headings |
| Body L | 16 / 24 | Regular 400 | 0 | **Default reading text** |
| Body | 14 / 20 | Regular 400 | +0.1 | Secondary info, meta rows |
| Caption | 12 / 16 | Medium 500 | +0.2 | Non-essential only: photo attribution, timestamps |
| Button | 16 / 20 | SemiBold 600 | +0.1 | Button labels, selector tile labels |
| *Added in Phase 5:* | | | | |
| Body L Strong | 16 / 24 | SemiBold 600 | 0 | The location line on Discover |
| Label | 14 / 20 | SemiBold 600 | +0.1 | Pick labels (Safe choice, Surprise me, Hidden gem) |
| Button large | 18 / 24 | Bold 700 | 0 | The **Nugagawen?** button only: the signboard |
| Wordmark | 20 / 24 | ExtraBold 800 | −0.3 | The Nugagawen? wordmark only |

**Rules**
- **Body L (16) is the default** for anything a person must read. The brief's 14 pt Body is for secondary info only. That's a deliberate choice for older readers.
- Essential information is never Caption size. Peso ranges in budget tiles are Body.
- Headlines are sentence case. No single word in a headline gets a different color or italic.
- No all-caps labels. The only exception is platform grouped-list headers in Settings, where the platform decides.
- All text scales with the system text size. Rows use minimum heights, never fixed heights, so they can grow.
- Line length stays under ~80 characters. On phones it naturally does.

### 9.4 Layout and composition

- **Grid:** 8 pt, with 4 pt for optical adjustments. Side padding 24 pt on every screen.
- **Spacing carries meaning.** The gaps get bigger as the relationship gets weaker:

| Relationship | Gap |
|---|---|
| Lines inside one item (name → category) | 4 |
| Items in a group (tile to tile, meta to meta) | 8 |
| Label to its control | 12 |
| Group to group (activity → budget) | 32 |
| Section to section | 40 |

- **Left-aligned** throughout: it reads fastest and works with any text length. The only centered text is inside buttons.
- **Grouping without boxes.** Use spacing first, hairlines second, a sage or surface background third. A white rounded shadowed box is never the default container.
- **Editorial hierarchy on Results:** one lead pick, then two alternates as rows. Picks are labelled, never numbered. They aren't a sequence.
- **Pinned action bar** on Discover, Location, and Place details: primary action in the thumb zone, a hairline above, safe-area padding below. Scroll content gets a bottom inset equal to the bar's height, so nothing hides under it.
- **Results has no pinned bar** (changed in Phase 5). Its actions come after the third pick, so all three picks fit on one screen. Choosing a pick is that screen's primary action.

### 9.5 Imagery

- **Only real place photos** from the place data source, with the attribution it requires shown on or under the photo.
- No stock photos, no AI-generated images, no illustrations as decoration.
- **Ratios:** lead pick 16:9 (changed from 4:3 in Phase 5 so all three picks fit on one screen), details hero 4:3 full-bleed, result rows 1:1 (72 pt, changed from 88), Saved rows 1:1 (56 pt).
- **Status bar over the details hero** gets a short top scrim (ink fading to transparent) so it stays readable over any photo. Like the attribution scrim, it's functional, not decoration.
- **Crop** centered. Request the smallest size that looks sharp on the device, to save data.
- **No photo available:** a sage block with the category icon in `inkSecondary`. Never a generic stock image.
- **Text on photos:** only the attribution line, always on the `scrim`. Names and prices sit below the photo, never on top.

### 9.6 Motion

Built with the `expo-animation` approach (decide whether it should animate at all, then what, then how), applying the Apple fluid-interface and Emil Kowalski principles loaded for this project.

| Moment | How often | Decision |
|---|---|---|
| Choosing activity / budget | Several times a session | Instant state change, about 120 ms color transition, light selection haptic. No bounce, no scale on tiles |
| Pressing a button | Constant | On press-in: dims slightly and scales to 0.98 (100 ms). Rows highlight their background instead of scaling |
| **Results arriving (first load)** | Once per search | **The one orchestrated moment.** Lead pick fades in and rises 8 pt; the two rows follow at 60 ms intervals; 250 ms, strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)` |
| Results on back-navigation | Often | No animation. They're already there |
| Shuffle | A few times | 150 ms cross-fade of content. Nothing moves |
| Save toggle | Occasional | Icon fills with a critically damped spring (no overshoot), plus a success haptic in the same frame |
| Sheets, screen pushes, tab switches | Constant | Platform native. Not customised |
| Loading skeleton | While loading | Static blocks, or a slow, low-contrast shimmer. Static when Reduce Motion is on |

**Reduce Motion on:** the results reveal becomes a plain 150 ms fade with no rise and no stagger; nothing slides.

### 9.7 Iconography

- **One family on both platforms:** Ionicons (bundled with Expo's `@expo/vector-icons`, so no new dependency). This is a deliberate platform-neutral choice for a branded app, as the brief asks for one family.
- Outline style by default; filled style only for an active state (the Saved bookmark, the selected tab).
- Sizes: 20 pt inline with text, 24 pt in buttons and tabs.
- **Icons never stand alone for an essential action.** Exception: back and close, which are universal and still carry accessibility labels.
- **Not allowed:** sparkle icons (the generic "AI magic" glyph), emoji used as icons, decorative icons beside headings.

Mapping, verified in Phase 5: all 24 icon names used in the mockups exist in Ionicons 7.4. In Phase 7, re-check them against the Ionicons version bundled with `@expo/vector-icons`.

| Meaning | Icon |
|---|---|
| Cost | `wallet-outline` |
| Rating | `star` (meta rows), `star-outline` (details fact list) |
| Opening hours | `time-outline` |
| Accessible entrance | `accessibility-outline` |
| Widen radius | `expand-outline` |
| Kain | `restaurant-outline` |
| Gala | `walk-outline` |
| Kahit ano | `apps-outline` |
| Safe choice | `checkmark-circle-outline` |
| Surprise me | `dice-outline` |
| Hidden gem | `diamond-outline` |
| Iba naman (shuffle) | `refresh-outline` |
| Location | `location-outline` |
| Directions | `navigate-outline` |
| Save / Saved | `bookmark-outline` / `bookmark` |

### 9.8 Voice and tone

Nugagawen talks like a friend who knows the area: "Tara, hanapan kita."

- **Taglish, plain, warm.** Short sentences. Everyday words over formal Filipino or jargon.
- **Say what happens.** Buttons name the result: "Directions", "Gamitin ito" [Use this], "Iba naman" [Something else].
- **One name per action, everywhere.** Save → "Na-save" [Saved] → Saved tab.
- **Errors don't apologise and are never vague.** They say what happened and what to do: "Walang internet. Subukan ulit." [No internet. Try again.]
- **Empty screens invite action.** "Wala ka pang naka-save." [Nothing saved yet.] plus a button that goes somewhere.
- **Honest about estimates.** "~₱250–600 bawat tao (tantya)" [per person (estimate)].
- **No emoji in UI copy.** No "amazing", "unlock", "your journey", or exclamation marks to fake energy.
- To validate: whether the casual register suits older users (research assumption A4).

### 9.9 What we take from the reference image, and what we leave

The reference (a hotel-booking concept) is useful for its restraint and its photo-led detail screen. It's a different product, so it informs patterns, not the look.

| Take | Where it goes in Nugagawen |
|---|---|
| Quiet near-monochrome chrome so photos carry color | Ink-on-paper UI; orange only for the main action |
| Photo-led detail screen with a pinned bottom bar (price + main action) | Place details: Save + Directions in a pinned bar |
| Facts as icon + label pairs | Details fact list (open status, distance, cost, rating), as larger vertical rows |
| Photo strip with "+N more" | Details photo strip |
| Big, plain, sentence-case headline on the first screen | Discover question |
| Solid dark fill for the selected option | Selector selected state (plus a check icon) |

| Leave | Why |
|---|---|
| Floating photo collage on the welcome screen | Decorative; we have no welcome screen (straight to Discover) |
| Capsule shape on every button, chip, and input | The brief bans excessive pills; 12 pt radius instead |
| "Hey, Runel" name greeting and notification bell | Needs an account and notifications; neither is in MVP |
| Horizontal carousels of image cards | A browsing pattern; Nugagawen is for deciding |
| Rating breakdown bars | Our data source doesn't provide them; we never fabricate |
| White text directly on photos | Contrast varies with every photo; we use a scrim or put text below |
| Price histogram filter | Asks the user to do the deciding; our budget is three choices |

---

## 10. Design tokens

All tokens live in `src/theme/` with one entry point (`src/theme/index.ts`). Components import tokens; screens import components. No hex values, font sizes, or spacing numbers anywhere else (a one-off optical nudge may stay inline, with a comment).

### `colors.ts`
Exactly the table in §9.2, stored as light/dark pairs (dark values to be designed later; MVP is locked to light).

### `typography.ts`
The scale in §9.3. Each style sets `fontFamily` per weight (for example `PlusJakartaSans_600SemiBold`) instead of `fontWeight`, so iOS doesn't fake the weight. Exposed through one `Text` component with a `variant` prop. Screens never set `fontSize`.

### `spacing.ts`

| Token | Value | Typical use |
|---|---:|---|
| `xxs` | 4 | Lines within an item, optical nudges |
| `xs` | 8 | Items in a group |
| `sm` | 12 | Label to control |
| `md` | 16 | Inner padding of controls, action bar vertical padding |
| `lg` | 24 | Screen side padding |
| `xl` | 32 | Group to group |
| `xxl` | 40 | Section to section |
| `xxxl` | 48 | Large empty-state spacing |
| `xxxxl` | 64 | Rare: top spacing on empty screens |

### `radius.ts`

| Token | Value | Use |
|---|---:|---|
| `sm` | 8 | Pick labels, small tags |
| `md` | 12 | Buttons, inputs, selector tiles, thumbnails |
| `lg` | 16 | Lead pick photo |
| `full` | 9999 | Round icon buttons on photos only |

All non-round corners use the continuous (squircle) curve.

### `shadows.ts`

| Token | Value | Use |
|---|---|---|
| `none` | — | Default for everything |
| `onPhoto` | `0 1px 3px rgba(36,35,31,0.16)` | Round icon buttons sitting on photos, the only shadow in the app |

Sheets and tab bars use their native platform treatment.

### `dimensions.ts`

| Token | Value | Notes |
|---|---:|---|
| `touchMin` | 44 | Minimum target in both directions |
| `buttonPrimaryMin` | 56 | Minimum height; grows with text |
| `buttonSecondaryMin` | 48 | |
| `inputMin` | 52 | |
| `iconButton` | 44 | |
| `selectorTileMin` | 72 | Activity and budget tiles |
| `listRowMin` | 56 | Settings rows, location suggestions |
| `thumbResult` | 72 | Alternate picks (was 88; changed in Phase 5) |
| `selectorTilePadding` | 12 → 8 | Horizontal padding; drops to 8 only when 12 would wrap a label |
| `thumbSaved` | 56 | Saved rows |
| `screenPadding` | 24 | Alias of `spacing.lg` |

Heights are always minimums (`minHeight`), so larger text grows the control instead of clipping it.

### `motion.ts`

| Token | Value |
|---|---|
| `press` | 100 ms |
| `fast` | 150 ms (shuffle cross-fade, reduced-motion fades) |
| `base` | 250 ms (results reveal) |
| `stagger` | 60 ms |
| `easeOut` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| `spring` | critically damped (damping ratio 1), ~350 ms response |

---

## 11. Component inventory

Built from the brief's list, adjusted where the platform already provides the component or where two brief items are really one component.

**Platform-provided (configured, not rebuilt):** tab bar (Expo Router native tabs), stack headers, the Location form sheet, grouped rows in Settings, switches, the system share sheet later. The brief's **BottomNavigation** and **BottomSheet** map here. Rebuilding them costs accessibility and gesture behavior for no gain.

| Component | Brief name | Variants | States | Accessibility |
|---|---|---|---|---|
| `Text` | — | One variant per type style (§9.3) | — | Headings get the header role |
| `Button` | PrimaryButton, SecondaryButton | `primary` (accent fill, onAccent text), `secondary` (surface, ink text, hairline edge), `ghost` (text only), `destructive` | default, pressed, disabled, loading | Button role; label stays available while the loading spinner shows |
| `IconButton` | IconButton | `plain`, `onPhoto` (round surface + `onPhoto` shadow) | default, pressed, disabled | Required label; 44 pt target |
| `ChoiceGroup` | (shared base) | `tiles`: 3 across with 12 pt side padding, then 8 pt, then stacked rows, whichever is the first to keep every label on one line (measured, see [02 UX §7.1](02-ux.md#71-screen-01-discover-home)) | per option: default, pressed, selected, disabled | Radio group; each option is a radio with selected state; label reads as "Sakto, ₱250 hanggang 600, napili" [selected] |
| `ActivitySelector` | ActivitySelector | `ChoiceGroup` with activity options | as above | as above |
| `BudgetSelector` | BudgetSelector | `ChoiceGroup` with budget options and peso ranges | as above | ₱ symbols are read as words, not "peso sign peso sign" |
| `LocationRow` | LocationPicker | `set`, `unset`, `updating` | default, pressed | Button role; label includes area and radius; hint "Opens location" |
| `SearchInput` | SearchInput | — | empty, focused, filled, disabled | Search role; clear button labelled; keyboard "search" key |
| `RadiusPicker` | (part of LocationPicker) | Native segmented control where the SDK provides one, else `ChoiceGroup` | — | Adjustable / radio group |
| `Recommendation` | RecommendationCard | `lead` (4:3 photo, text below), `row` (88 pt thumb left, text right) | default, pressed, loading (skeleton) | Whole item is one button; label reads pick type, name, category, distance, rating, cost in that order |
| `PickLabel` | — | `safe`, `surprise`, `gem` | — | Icon hidden from screen readers; text read |
| `PlaceRow` | PlaceCard | `saved` (56 pt thumb + remove toggle) | default, pressed, removing | Row is a button; remove toggle is a separate labelled control |
| `FactRow` | — | — | — | Icon decorative; text carries meaning |
| `SectionHeader` | SectionHeader | with or without trailing action | — | Header role |
| `ActionBar` | — | 1 or 2 buttons | — | Comes last in screen-reader order |
| `Photo` | — | `lead`, `hero`, `thumb` | loading (skeleton), loaded, failed (sage placeholder) | Label "Larawan ng {place}" [Photo of {place}]; attribution readable |
| `Skeleton` | LoadingSkeleton | shapes: `line`, `block`, `thumb` | static, shimmer (off with Reduce Motion) | Hidden from screen readers; the screen announces "Naglo-load" [Loading] once |
| `StateMessage` | EmptyState, ErrorState | `empty`, `error`, `offline`, `info` | — | Title is a header; message announced when it appears |
| `Toast` | — (needed for Save/Undo) | `info`, `undo` | visible, dismissing | Announced; stays ~5 s, longer when a screen reader is running; never the only way to undo |

**Every interactive component defines:** default, pressed (feedback on press-in, not release), disabled, and where relevant selected, loading, and focused (a 2 pt ink outline for keyboard and switch access). Callers may pass a `style` prop for layout only (margins, flex), never to change a component's colors.

**Promotion rule:** a view becomes a shared component only when two or more screens use it, it has a nameable role, and its API is smaller than its implementation. Until then it lives with its screen.

---

## 12. Accessibility standards

**Target:** WCAG 2.2 AA where it applies to native mobile apps, plus platform guidance (Apple HIG accessibility, Android accessibility).

| WCAG 2.2 | Requirement in Nugagawen |
|---|---|
| 1.1.1 Non-text content | Every icon-only control has a label. Place photos are labelled. Decorative icons are hidden from screen readers |
| 1.3.1 Info and relationships | Headings marked as headers. Selectors exposed as radio groups. Lists as lists |
| 1.3.4 Orientation | Not locked to portrait. Layouts scroll, so landscape works; verified in Phase 10 |
| 1.4.1 Use of color | Selected = fill + check icon. Open/closed = words + icon. Pick types = icon + words |
| 1.4.3 Contrast (text) | 4.5:1 minimum, verified for every pair in §9.2 |
| 1.4.4 Resize text | Works at the largest system text sizes without lost content or overlap |
| 1.4.10 Reflow | Selector tiles stack into rows at narrow widths or large text |
| 1.4.11 Non-text contrast | Input edges and selected states at least 3:1 (§9.2) |
| 2.2.1 Timing adjustable | No time limits on tasks. Undo toast lasts longer with a screen reader, and is never the only path |
| 2.4.3 Focus order | Reading order follows visual order; pinned action bar last |
| 2.4.6 Headings and labels | Labels describe the purpose: "Magkano ang budget?" not "Budget" alone |
| 2.4.11 Focus not obscured | Pinned action bar never covers the focused element (scroll inset) |
| 2.5.1 / 2.5.7 Gestures and dragging | No path or multi-finger gestures required. Sheets also close with Cancel. Swipe-to-remove is optional, never the only way |
| 2.5.8 Target size | 44 × 44 pt minimum (WCAG requires 24; we exceed it on purpose) |
| 3.1.2 Language of parts | Filipino strings marked with the Filipino language where the platform supports it, so screen readers pronounce them better; tested with VoiceOver and TalkBack |
| 3.2.3 / 3.2.4 Consistency | Same action names and positions on every screen |
| 3.3.1 / 3.3.3 Errors | Every error says what happened and how to fix it, next to where it happened |
| 3.3.7 Redundant entry | Location and preferences remembered; never asked twice |
| 4.1.2 Name, role, value | All custom controls expose role, label, and state (selected, disabled, busy) |
| 4.1.3 Status messages | Results loaded, shuffle, saved, removed, and errors are announced |

**Also required**
- Reduce Motion respected (§9.6). Reduce Transparency: no translucent surfaces in MVP, so nothing to adjust.
- Bold Text and grayscale don't break meaning, since meaning never depends on color or weight alone.
- Screen readers: the core flow (Discover → Results → Details → Directions) is tested end-to-end with VoiceOver and TalkBack before each phase is called done.
- Large text: every screen is checked at the largest accessibility text size on both platforms.

**Per-screen accessibility check (run in every phase):**
1. Can the core task be done with VoiceOver and with TalkBack?
2. Does the screen survive the largest text size without clipping or overlap?
3. Are all targets at least 44 pt?
4. Is any meaning carried by color alone?
5. Are state changes announced?

---

## 13. Anti-AI design direction

The goal isn't "no cards, no rounded corners". It's that **every visual choice can be defended for this product**. These rules turn the brief's anti-AI section into checks we can actually run.

### 13.1 Nugagawen's rules

| Do | Don't |
|---|---|
| Orange once per screen, on the action to take | Orange accents, gradients, glows, or tinted icons for decoration |
| Group with spacing, then hairlines, then a sage/surface background | A white rounded shadowed card around every section ("Everything's a Card") |
| 12 pt radius by default, 16 on the lead photo, round only for icon buttons on photos | Capsules on everything; one radius regardless of hierarchy |
| One shadow, only for icon buttons on photos | Soft grey shadows under every element |
| Distinct spacing steps (4 / 8 / 12 / 32 / 40) | The same 16 pt everywhere, so nothing groups ("16-Everything") |
| Platform tab bar, headers, and sheets | Floating pill tab bar, hand-rolled headers, centered web-style modals |
| One orchestrated reveal on Results | Fade-and-slide-up entrances on every screen and list |
| Real place photos with attribution | Stock, AI-generated, or decorative images |
| Sentence-case labels that say what they mean | All-caps eyebrows above headings, "A · B · C" meta strings, "→" appended to buttons |
| Picks labelled by role (Safe choice, Surprise me, Hidden gem) | Numbering things that aren't a sequence (01 / 02 / 03) |
| Ionicons outline icons that carry meaning | Emoji icons, sparkle icons, icons beside every heading |
| Specific, plain Taglish copy | "Discover amazing places", "Unlock your next adventure" |
| Skeletons in the shape of the real layout | A full-screen spinner between every state ("Spinner Blink") |
| Show only facts the data provides | Invented ratings, reviews, rating bars, descriptions, or prices |

### 13.2 Review checklist (every screen, before it's approved)

Screenshot the screen, then ask:

1. Remove the logo. Would someone still recognise it as Nugagawen (question/answer type, ink on paper, one orange action, sage reasons)?
2. Is there more than one orange element? Remove the extras.
3. Is anything boxed that could be grouped by space instead?
4. Is there any element whose only job is decoration? Remove it.
5. Would this screen look the same for a hotel app, a banking app, or a to-do app? If yes, it isn't designed for this product yet.
6. Look in the mirror and remove one accessory: what is the one thing you could take away?

In Phase 10, the Expo design-system skill's 20 named "native slop" tells and their search checks run across the codebase (hardcoded colors, `TouchableOpacity`, custom tab bar styles, `headerShown: false`, gradients, emoji glyphs) as an automated second opinion.
