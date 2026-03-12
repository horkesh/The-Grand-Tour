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
