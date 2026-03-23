# Project Ledger

Chronological record of decisions, changes, and session notes.

---

## 2026-03-12 — Session 0: Adoption & Discipline Setup

### Context
Adopted agent discipline from the Tonight repo. Set up CLAUDE.md, napkin runbook, project ledger, state-of-app, and planning docs.

### What Was Done
- **CLAUDE.md** — project conventions, stack, structure, commands, coding style
- **.claude/napkin.md** — runbook with startup protocol, execution rules, frontend patterns, environment notes
- **.claude/settings.local.json** — permission allowlist for common commands
- **docs/state-of-app.md** — architecture overview, data flow, known issues (10 items)
- **docs/planning.md** — 3-phase implementation plan (stability → UX polish → features)
- **docs/project_ledger.md** — this file

### Audit Findings (Full Codebase)

**Critical**
1. Weather model `gemini-3-flash-preview` may be invalid — all weather calls fail silently
2. Weather data not persisted — re-fetched on every page load, wastes API quota
3. Image generation queue has no retry — failed images silently dropped

**High**
4. Chat-saved POIs hardcoded to `cityId: 'planned'` — appear on all city maps
5. 3D card flip uses invalid Tailwind class `rotate-y-180` — flip doesn't work
6. Leaflet popup callbacks stored as window globals — stale closure risk

**Medium**
7. ImageGenerator progress can overshoot 100%
8. Grounding metadata uses `any` types — fragile to SDK changes
9. No unified error notification system (mix of alert() and silent catches)
10. Stub components (CurrencyConverter, Toast) export null — intentional scope reduction

### Architecture Summary
- ~2,300 lines of TypeScript/React
- 12 components, 3 hooks, 1 service, 1 util
- Single Zustand store with localStorage persistence
- Leaflet maps via CDN + useLeaflet abstraction
- Gemini AI: chat with grounding, image generation, weather
- React Router HashRouter with 6 routes
- Background image generation queue (4s spacing, ~60 waypoints)

### What's Next
- Phase 1: Stability fixes (model names, weather persistence, image retry, card flip)

---

## 2026-03-12 — Phase 1: Stability Fixes + /simplify

### Context
First fix phase targeting critical stability issues from the audit.

### Fixes Applied

1. **Weather model name** (`services/geminiService.ts`) — changed `gemini-3-flash-preview` → `gemini-2.5-flash`. The old model ID was invalid; all weather calls were silently failing.

2. **Weather persistence** (`store.ts`) — added `weatherData` to Zustand `partialize` config. Weather now survives page refresh instead of re-fetching 8 API calls on every mount.

3. **Image generation retry** (`components/ImageGenerator.tsx`) — failed images are re-enqueued to the back of the queue with max 2 retries (3 total attempts). Previously dropped silently.

4. **Routes type error** (`App.tsx`) — removed `key` prop from `<Routes>` (not valid in React Router v7). Pre-existing type error, fixed incidentally.

### Audit Corrections
- **3D card flip (issue #5)**: False positive. DayDashboard defines `.rotate-y-180 { transform: rotateY(180deg); }` in an inline `<style>` tag (line 322). The flip works — it's custom CSS, not Tailwind.

### /simplify Findings (3-agent review)

**Fixed:**
1. **Progress counter inflation** — retried items were incrementing the progress counter, causing >100% display. Split into `completed`/`total` counters; `completed` only increments on permanent item removal.
2. **Unnecessary useEffect re-runs** — `waypointImages` in dependency array caused the processing effect to re-run on every image store update. Replaced with a ref for the double-check.
3. **Type annotation mismatch** — queue builder type now includes `retries?` field.

**Reviewed but not changed:**
- localStorage quota for base64 images — pre-existing issue (waypointImages was already persisted)
- Queue retry vs `withRetry` — different scopes (API-level vs queue-level)
- `setIsProcessing` race condition — guard prevents concurrent processing

### Verification
- `npx tsc --noEmit`: 0 errors
- `npm run build`: success

### What's Next
- Phase 2: UX polish (POI city association, error notifications, Leaflet popup refactor)

---

## 2026-03-12 — Phase 2: UX Polish + /simplify

### Context
Second fix phase targeting UX issues from the audit.

### Fixes Applied

1. **POI city association** (`ChatInterface.tsx`, `GroundingResult.tsx`) — saved POIs now matched to nearest city by coordinate distance (squared Euclidean, 0.25° threshold ≈ 50km). Falls back to `'planned'` if no city nearby or no coordinates available. GroundingResult passes lat/lng from grounding metadata.

2. **Toast notification system** (`Toast.tsx`, `App.tsx`, `DayDashboard.tsx`, `ChatInterface.tsx`) — reactivated stub Toast.tsx with Zustand-based store. Replaced all `alert()` calls. Three variants: info (teal), error (red), success (emerald). Auto-dismiss after 3 seconds with fade animation.

3. **Leaflet popup refactor** (`ItineraryMapOverlay.tsx`) — replaced `window.handleEditNote` / `window.handleRemovePOI` globals with delegated click handler using `data-poi-action` / `data-poi-id` attributes. No more window namespace pollution.

4. **POI map visibility** (`ItineraryMapOverlay.tsx`) — POIs with `cityId: 'planned'` now also shown on all city maps (backwards-compatible with existing saved data).

### /simplify Findings (3-agent review)

**Fixed:**
1. **Leaflet popup delegation target** — Leaflet renders popups in a separate DOM pane outside the map container. Changed delegation from `mapContainerRef.current` to `document` so popup button clicks are caught.
2. **Toast timer race condition** — rapid `show()` calls could orphan timers. Added `timerRef` to track and clear previous timers. Added `_seq` counter to distinguish repeated identical messages.
3. **Toast unnecessary re-renders** — `useToast` hook now returns only the `show` function via selector, so consumer components don't re-render when message state changes.
4. **Leaflet handler listener churn** — removed `savedPOIs` from useEffect deps (used ref instead) so the delegated listener isn't re-attached on every POI change.

**Reviewed but not changed:**
- `findNearestCityId` extraction to utils — only one call site, premature
- `handleSavePOI` memoization — GroundingResult isn't memoized, no benefit
- 8-city iteration on POI save — negligible (16 arithmetic ops)

### Verification
- `npx tsc --noEmit`: 0 errors

### What's Next
- Phase 3 features if desired (offline support, travel time estimates, partner sync)

---

## 2026-03-12 — Phase 3: Feature Enhancements + /simplify

### Context
Feature phase adding offline support and inter-city travel time display.

### Fixes Applied

1. **Travel time display** (`types.ts`, `constants.tsx`, `ItineraryList.tsx`) — added `driveFromPrev?: string` to `TripSegment`. Populated 7 cities with static drive times (20m–2h 45m). ItineraryList renders a dashed-line pill with car emoji between consecutive city cards. Removed unused `TravelTime` interface from types.ts.

2. **Service worker** (`public/sw.js`, `index.html`) — lightweight SW for offline capability. Caches app shell (Tailwind, Leaflet, fonts, grain SVG, icon) on install. Cache-first for CDN assets (esm.sh, unpkg, fonts.googleapis.com), network-first for navigation HTML. Explicitly skips Gemini API calls. Registration on window load with error logging.

### /simplify Findings (3-agent review)

**Fixed:**
1. **SW registration error swallowed** — `.catch(() => {})` replaced with `console.warn` for debuggability.
2. **Fragile CDN origin matching** — 5 `startsWith` calls (including partial `fonts.g`) replaced with single regex using full domain names.

**Reviewed but not changed:**
- DashedDivider extraction — 2 identical divs in same JSX block, premature to extract
- Cache size quota/TTL — overkill for 8-day trip PWA with ~10 cached CDN resources
- Network-first timeout — simple travel app, not a critical service
- Weather icon memoization — O(1) lookup on 8 items
- React.Fragment wrapper — necessary for conditional sibling rendering from map

### Docs corrections
- state-of-app: weatherData moved from "Ephemeral" to "Persisted" (was fixed in Phase 1 but doc not updated)
- state-of-app: weather model corrected to `gemini-2.5-flash`
- CLAUDE.md: weather model corrected to `gemini-2.5-flash`

### Verification
- `npx tsc --noEmit`: 0 errors

### What's Next
- Phase 4: Make It Memorable

---

## 2026-03-13 — Phase 4A: Emotional Core + /simplify

### Context
Transform the app from a functional tool into a personal anniversary gift.

### What Was Done

1. **Welcome / Love Letter Screen** (`components/Welcome.tsx`, `store.ts`, `App.tsx`) — full-screen teal overlay on first open with staggered Framer Motion animations. Heart icon, "Our Grand Tour" title, personal message about twenty years. "Begin Our Journey" button persists `hasSeenWelcome` flag.

2. **Anniversary Day 5 Treatment** (`components/DayDashboard.tsx`, `components/ItineraryList.tsx`, `constants.tsx`) — Day 5 gets rust-colored "Anniversary Day" badge, gradient card back with wedding date ("May 6, 2006 — May 6, 2026"), rust stamp button. ItineraryList shows heart emoji instead of day number on Day 5 card. Extracted `ANNIVERSARY_DAY_ID` constant.

3. **Stamp Celebration** (`components/DayDashboard.tsx`) — confetti burst (30 particles, memoized positions) + haptic vibration on stamp collection. 2-second auto-dismiss with proper useEffect cleanup.

4. **Card Flip Hint** (`components/DayDashboard.tsx`, `store.ts`) — pulsing "Tap to flip" overlay on hero card, auto-dismissed after first flip via persisted `hasFlippedCard` flag.

5. **Day Navigation** (`components/DayDashboard.tsx`, `App.tsx`, `store.ts`) — prev/next day arrows in hero card. Mobile "Journal" nav button remembers last-viewed day via persisted `lastViewedDay`.

### /simplify Findings

**Fixed:**
1. Merged double city lookup (find + findIndex → single findIndex)
2. Same-value guard on `setLastViewedDay` (prevents no-op localStorage writes)
3. Merged duplicate `useStore()` calls in App.tsx Layout
4. Memoized confetti particles (Math.random on every render → useMemo per burst)
5. Proper setTimeout cleanup for confetti (memory leak → useEffect with clearTimeout)
6. Removed useless AnimatePresence wrapper from Welcome.tsx
7. Extracted `ANNIVERSARY_DAY_ID` constant from magic string 'day-5'

### Verification
- `npx tsc --noEmit`: 0 errors

---

## 2026-03-13 — Phase 4B: Practical Travel + /simplify

### Context
Making the app useful on the ground with real driving/parking info and chat persistence.

### What Was Done

1. **Parking & ZTL Warnings** (`types.ts`, `constants.tsx`, `components/DayDashboard.tsx`) — added `parking?: string` field to TripSegment. Populated 5 days with specific warnings (Orvieto ZTL, Pienza paid lots, Spello ZTL, Via Appia official lots, FCO car return). Amber left-border warning banner displayed in DayDashboard below itinerary header.

2. **Stop Durations** (`types.ts`, `constants.tsx`, `components/DayDashboard.tsx`) — added `duration?: string` to PlannedStop. Populated ~15 key stops with time estimates from source HTML (e.g., "60–90 min" for Civita, "Best light 05:40–06:15" for Podere Belvedere). Displayed as "type · duration" in waypoint cards.

3. **Missing Stops & Backup Restaurants** (`types.ts`, `constants.tsx`) — added `badge?: string` to PlannedStop. Added Day 7 lunch (Romolo al Centro). Added 3 Day 5 anniversary backup restaurants with "Backup" badge: La Terrazza della Val d'Orcia, La Terrazza del Chiostro, Bacco E Cerere 2.0.

4. **Chat Persistence** (`store.ts`, `components/ChatInterface.tsx`) — moved chat messages from component-local useState to Zustand persisted store. Messages survive page refresh. Capped at 50 messages. Grounding data stripped from persistence (stored only in memory session). Added header with message count + Clear button.

### /simplify Findings

**Fixed:**
1. Removed unnecessary `const messages = chatMessages` alias (used store value directly)
2. Capped chat messages at 50 (prevents unbounded localStorage growth)
3. Stripped grounding data from persisted chat (reduces localStorage by ~2-5KB per assistant message)

**Reviewed but not changed:**
- Badge union type — only one value used, premature to constrain
- Confirm dialog on clear — low-risk action, not destructive enough
- Separate chat storage key — over-engineering for personal trip app
- Amber color extraction — intentional warning palette, distinct from design system

### Verification
- `npx tsc --noEmit`: 0 errors

### What's Next
- Phase 4C: Delight & Sharing

---

## 2026-03-13 — Phase 4C: Delight & Sharing + /simplify

### Context
Final sub-phase adding sharing, celebration, and cleanup.

### What Was Done

1. **Shareable Postcards** (`components/Gallery.tsx`) — download button on every polaroid card (creates anchor element, triggers PNG download). Share button via Web Share API on supported devices (converts data URL to blob, shares as file). Falls back to download on share failure. Buttons appear on hover.

2. **Trip Complete Ceremony** (`components/TripComplete.tsx`, `store.ts`, `App.tsx`) — full-screen Italian flag celebration overlay when all 8 city stamps are collected. Stamp grid with staggered spring animations. "Until Next Time" dismissal persisted via `hasSeenTripComplete` flag. Mounted in Layout alongside Welcome.

3. **Dead Code Cleanup** — deleted `components/CurrencyConverter.tsx` (stub exporting null, not imported anywhere).

### /simplify Findings

**Fixed:**
1. Removed unnecessary `async` from `downloadPostcard` (synchronous DOM operation)
2. Replaced `fetch()` on data URLs with direct `atob()` + `Uint8Array` blob conversion (avoids Fetch API overhead on inline data)
3. Persisted TripComplete dismissed state (`hasSeenTripComplete` in store) — ceremony no longer repeats on page refresh

**Reviewed but not changed:**
- Hidden hover buttons (standard CSS pattern, not worth state-based hover)
- TripComplete always mounted (same pattern as Welcome, negligible cost)
- Animation pattern overlap with Welcome (distinct narrative purposes)
- navigator.share type check (reliable as-is)

### Verification
- `npx tsc --noEmit`: 0 errors

### What's Next
- Phase 5: Geolocation, Photo Uploads, Story Mode, Partner Sync

---

## 2026-03-13 — Phase 5: Full Feature Set + /simplify

### Context
All four deferred features implemented in a single pass: geolocation tracking, real photo uploads, story mode narrative, and partner sync.

### What Was Done

1. **Geolocation Tracking** (`hooks/useGeolocation.ts`, `App.tsx`, `components/OverviewMap.tsx`, `components/ItineraryMapOverlay.tsx`) — browser `watchPosition` via custom hook, invoked in Layout for app-wide tracking. Pulsing blue dot marker on both overview and day-level maps. `maximumAge: 30000` to avoid battery drain.

2. **Real Photo Uploads** (`utils/imageResize.ts`, `components/DayDashboard.tsx`, `store.ts`) — file input with `accept="image/*"` on DayDashboard. Images resized via canvas (800px max, JPEG 0.7 quality) to keep localStorage reasonable. `removeWaypointImage` action added for reverting to AI-generated images. Upload and remove buttons in header controls.

3. **Story Mode** (`components/StoryMode.tsx`, `App.tsx`, `components/Sidebar.tsx`, `constants.tsx`) — scrollable post-trip narrative at `/story`. Each of 8 days rendered as a chapter: hero image, milestone quote, stop badges (stamped/unstamped), stop image grid, postcard carousel. Finale section with stamp/photo totals. `whileInView` animations, lazy-loaded images. Book icon added to Icons.

4. **Partner Sync** (`components/PartnerSync.tsx`, `components/Sidebar.tsx`) — clipboard-based stamp and POI sync between two phones. Export encodes stamps + POIs as base64 JSON (v1 schema), partner pastes to import. Merges stamps (union) and POIs (deduplicated by URI). No backend needed. Accessible from Sidebar.

### /simplify Findings

**Fixed:**
1. Duplicated user marker CSS in OverviewMap + ItineraryMapOverlay → moved to `index.html`
2. `userLocation` in marker effect deps caused full marker rebuild every 30s → split into separate `userLayerRef` + effect in both map components
3. `exportCode` in PartnerSync recomputed on every render → `useMemo` with `[stamps, savedPOIs]`
4. PartnerSync POI type inline-defined → `Pick<SavedPOI, ...>` for type safety

**Reviewed but not changed:**
- Canvas helper extraction (imageResize vs imageProcessing) — different purposes, 5 shared lines, premature
- Modal component extraction — 3 different modals with different needs, premature
- Waypoint key builder utility — string concat is clear at current scale
- FileReader abort on unmount — sub-second operation, edge case
- StoryMode virtualization — 8 sections with lazy images, not heavy enough

### Verification
- `npx tsc --noEmit`: 0 errors

### What's Next
- UI polish pass

---

## 2026-03-13 — UI Polish Pass

### Context
Full UI/UX audit followed by targeted fixes across the app.

### What Was Done

1. **Story Mode in MobileNav** — was only accessible from desktop sidebar. Added 6th nav button ("Story") so mobile users can reach the story view.

2. **Sidebar Day Journal fix** — navigated to day-1 always. Now uses `lastViewedDay` from store, matching mobile nav behavior. Removed unused `ITALIAN_CITIES` import.

3. **ARIA labels** — added `aria-label` to 6 icon-only buttons: theme toggle (App + Sidebar), map close (ItineraryMapOverlay), camera capture, prev/next day arrows (DayDashboard).

4. **MobileNav dark mode** — `bg-white/5` was nearly invisible in dark mode. Changed to `dark:bg-slate-900/80` for better visibility. Also bumped light mode to `bg-white/60`.

5. **Passaporto dark mode** — passport background `#2a3b4c` had no dark variant. Added `dark:bg-[#1a2530]`.

6. **Passaporto empty state** — added onboarding hint when no stamps collected: "Visit a city and flip the card to start collecting stamps."

7. **PartnerSync focus rings** — both textareas had no visible focus state. Added `focus:ring-2 focus:ring-[#194f4c] outline-none`.

### Audit Items Reviewed But Not Changed
- Border radius inconsistency (2rem/2.5rem/3rem) — intentional hierarchy (containers/hero/small)
- Font size system (text-[10px] vs text-xs) — consistent within categories
- Passaporto stamp grid sizing — 2-col on mobile already gives adequate touch targets
- MobileNav scroll discoverability — acceptable with horizontal layout
- Shadow hierarchy — reasonable escalation across component types

### Verification
- `npx tsc --noEmit`: 0 errors
- `npm run build`: success
- Deployed to Vercel

### What's Next
- App is feature-complete and polished. Ready for the trip.

---

## 2026-03-20 — Piazza Puzzle + Family & Friends Live

### Context
Two major features: an Italy-themed Block Blast puzzle game and a family/friends live trip experience.

### What Was Done

#### Piazza Puzzle (Block Blast)
1. **Game Component** (`components/BlockBlast.tsx`) — 8x8 grid puzzle with 27 piece shapes, 7 Italian-inspired tile colors. Tap-to-select, tap-to-place mechanics. Line clear animations with Italian cheers ("Bravo!", "Magnifico!"). Daily mode (seeded RNG) + free play.
2. **Firebase Score Sync** — Daily scores written to `trips/{tripId}/puzzle/{date}`, real-time partner score listener with toast notifications.
3. **Daily Reveal Integration** — Scoring 200+ punti in daily mode unlocks the next locked reveal tile. DailyReveal.tsx checks both date-based and puzzle-earned unlocks.
4. **Italian Phrase Reward** — Random phrase shown on game-over screen from 12 curated trip phrases.
5. **Route & Navigation** — `/gioco` route, accessible from TogetherHub. Puzzle icon added to Icons.

#### Family & Friends Live
1. **Live Trip Page** (`components/LiveTripPage.tsx`) — Public read-only page at `/live`. Map-first Leaflet view with route polyline, city markers (visited/upcoming), and real-time feed. No auth required.
2. **Family Hub** (`components/FamilyHub.tsx`) — Inner circle hub at `/family` with 4 tabs: Feed (with emoji reactions), Guestbook (messages), Care Packages (surprise notes for specific cities), Puzzle (leaderboard + play).
3. **Family Join** (`components/FamilyJoin.tsx`) — Join flow at `/family/join`. Enter 6-letter code + nickname + color. Validates code against Firestore (queries `trips` collection). Stores familyUid in localStorage.
4. **Care Package Inbox** (`components/CarePackageInbox.tsx`) — Embedded in DayDashboard. Shows surprise notes from family for the current city. Expand to read, mark-as-read tracking.
5. **Feed System** (`store.ts`) — Auto-publishes feed items to Firestore when stamps are collected or postcards created.
6. **Public Route Architecture** (`App.tsx`) — `/live`, `/family`, `/family/join` routes bypass AuthGate via `AppContent` component that checks pathname before rendering.

### /simplify Findings

**Fixed:**
1. CarePackageInbox `markRead` was spreading entire pkg into writeDoc — now only writes `readBy` field
2. FamilyJoin validated join code against localStorage (which doesn't exist on family devices) — now queries Firestore
3. App.tsx had duplicated `isPublic` check in both `PublicRoutes` and `AppContent` — collapsed into single component
4. FamilyHub had dead `useEffect` that set reactions to empty object — removed
5. FamilyHub tripId resolution now checks `bb_family_tripId` (set during join) as primary source

**Reviewed but not changed:**
- FeedItem interface duplicated in LiveTripPage + FamilyHub — acceptable for 2 files
- relTime helper duplicated — same reasoning
- CarePackageInbox filters full collection client-side — trivial for trip scale
- LiveTripPage visitedIds Set reference triggers marker rebuild — 8 cities, negligible

### Verification
- `npx tsc --noEmit`: 0 errors
- `npm run build`: success

---

## 2026-03-20 — Piazza Puzzle Rewrite: Drag-and-Drop + Premium Visuals

### Context
Wife tested the game and found tap-to-select unintuitive (real Block Blast uses drag-and-drop) and visuals too basic. Full rewrite needed.

### What Was Done

1. **Drag-and-Drop** — replaced tap-to-select/tap-to-place with pointer event drag. Touch a piece in the tray, it lifts and follows your finger as a floating overlay, ghost preview appears on the grid at the snapped position, release to place or cancel. Uses `setPointerCapture` for reliable tracking.

2. **Premium Visual Overhaul** — dark gradient background (deep navy/indigo), 3D glossy block tiles with per-color light/base/dark gradient system (`TILE_PALETTES`), `BlockTile` sub-component for reusable rendering, dark glass game board with inner glow, frosted glass score bar, amber accent system, floating +score popups, spring-animated cheers with gold glow, line clear glow effects.

3. **All Integrations Preserved** — Firebase daily score sync, partner score display/toast, Daily Reveal tile unlock at 200+ punti, Italian phrase reward, streak tracking.

### /simplify Findings

**Fixed:**
1. `setDrag` on every pointer pixel caused hundreds of re-renders/sec — now only re-renders on grid cell boundary changes; floating piece position updated via direct DOM ref mutation
2. `getBoundingClientRect()` called in render path — replaced with `cellSizeRef` cached via `ResizeObserver`
3. `canPieceFitAnywhere` called for each piece on every render during drag — memoized into `pieceFits` array keyed on `[grid, pieces]`
4. `ghostCells` Set recreated every render — wrapped in `useMemo([drag, pieces, grid])`
5. Score popup timeouts untracked — IDs now stored in `popupTimerRefs`, cleaned up on unmount and reset
6. Cell size CSS string recreated 64x per render — extracted to module-level `CELL_SIZE_CSS` constant; `dragColorIdx` hoisted outside cell loop

**Reviewed but not changed:**
- `drag` + `dragRef` duplication — intentional pattern (ref for callbacks, state for render)
- `doPlace` dependency array — correctly includes all 5 used values
- `dateKey`/`REWARD_PHRASES` overlap with other files — acceptable for self-contained game component

### Verification
- `npx tsc --noEmit`: 0 errors
- `npm run build`: success

---

## 2026-03-20 — Piazza Puzzle Edge-Case Fixes

### Context
Two rounds of bug fixes after real-device testing revealed game-breaking issues.

### Fixes Applied

**Round 1 — Grid Edge Placement** (`ad2016c`)
1. `getGridPos` used `Math.round` with asymmetric offset (`- shapeCols/2 + 0.5`) creating a left-biased dead zone. Wide pieces (e.g., 1x5) couldn't reach rightmost columns. Fixed with `Math.floor` and symmetric centering `(shapeCols - 1) / 2`.

**Round 2 — Five Game-Breaking Edge Cases** (`54438a8`)
1. **Invisible placed piece during clear** — grid state jumped from pre-placement to post-clear, skipping the placed state. Now `setGrid(newGrid)` fires immediately so the piece is visible, then `clearedGrid` replaces it after 350ms animation.
2. **Second piece erased by clear timeout** — clear timeout overwrote grid with stale snapshot from before second placement. Fixed by immediate grid update on every placement.
3. **Multi-touch drag corruption** — second finger started new drag overwriting `dragRef`. Added guard: `handlePointerDown` returns early if `dragRef.current` is set.
4. **Grid cell size miscalculation** — `gridRef` pointed to padded outer container and ignored 2px gaps. Moved ref to inner grid div, accounted for gaps in both `cellSize` computation and `getGridPos` stride.
5. **False "Nuovo record" badge** — displayed on tied scores (`>=`) but save used strict `>`. Aligned display condition to `>`.

### Verification
- `npx tsc --noEmit`: 0 errors
- `npm run build`: success

---

## 2026-03-24 — Piazza Puzzle iPhone 16 Pro Viewport Fix

### Context
Wife reported the game doesn't render completely on iPhone 16 Pro — the piece tray (bottom block) is cut off.

### Root Cause
`CELL_SIZE_CSS` only constrained cell size by viewport **width**: `clamp(34px, calc((100vw - 48px) / 8), 50px)`. The outer container uses `overflow-hidden` and all children are `shrink-0`. On iPhone 16 Pro with Safari chrome + safe areas + app bottom nav, total content height exceeds available viewport height, clipping the piece tray.

### Fix Applied
Changed `CELL_SIZE_CSS` to constrain by both width and height using CSS `min()`:
```
clamp(34px, min(calc((100vw - 48px) / 8), calc((100dvh - 310px) / 8)), 50px)
```
The 310px accounts for header (~44px), score bar (~65px), piece tray (~90px), padding/gaps (~45px), bottom nav (~34px), and safe areas (~32px). Uses `dvh` (dynamic viewport height) to handle Safari's collapsing address bar.

### Verification
- `npx tsc --noEmit`: 0 errors
