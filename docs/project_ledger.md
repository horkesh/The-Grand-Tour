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
