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
- Phase 4: Partner Sync (deferred from Phase 3)
