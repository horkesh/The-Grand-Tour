# State of the App

## Architecture Overview

**The Grand Tour** is an 8-day Italian anniversary travel companion PWA (May 2–9, 2026). It combines a Leaflet-powered map, Gemini AI concierge with Maps/Search grounding, a passport stamp collection, and polaroid-style postcard creation.

### Core Components

1. **State Management (`store.ts`)**
   - Single Zustand store with persist middleware
   - Persisted: theme, savedPOIs, stamps, postcards, waypointImages, weatherData, hasSeenWelcome, hasFlippedCard, lastViewedDay, hasSeenTripComplete, chatMessages (stripped of grounding)
   - Ephemeral: userLocation
   - No splitting needed at current ~120 lines

2. **AI Service (`services/geminiService.ts`)**
   - `enrichTripPlan()` — Chat with grounding (googleMaps + googleSearch tools), model: `gemini-2.5-flash`
   - `generateLocationImage()` — Image gen, model: `gemini-2.5-flash-image`
   - `getWeatherForecast()` — Weather via AI, model: `gemini-2.5-flash`
   - Shared retry logic with exponential backoff (3 retries, 2–5s delays)
   - 30s global cooldown on 429/RESOURCE_EXHAUSTED

3. **Map Integration**
   - Leaflet loaded via CDN, accessed through `window.L`
   - `hooks/useLeaflet.ts` — abstraction for init, markers, polylines, tiles
   - `OverviewMap.tsx` — master 8-marker view with dashed route
   - `ItineraryMapOverlay.tsx` — per-city map with planned stops + saved POIs

4. **Routing (React Router)**
   - HashRouter for broad compatibility
   - 20+ routes including public routes (`/live`, `/family`, `/family/join`) outside AuthGate
   - AnimatePresence with popLayout for transitions
   - Public routes bypass AuthGate for spectator/family access

5. **Family & Friends System**
   - **Live Trip Page** (`/live`) — public read-only map-first page, no auth required
   - **Family Hub** (`/family`) — inner circle with reactions, guestbook, care packages, puzzle leaderboard
   - **Family Join** (`/family/join`) — code + nickname entry, validates against Firestore
   - **Feed System** — auto-publishes stamp/postcard events to `trips/{tripId}/feed/`
   - **Care Packages** — surprise notes from family targeting specific cities, shown in DayDashboard

6. **Piazza Puzzle (Block Blast)**
   - Italy-themed block puzzle game at `/gioco`
   - Drag-and-drop: pointer events with `setPointerCapture`, floating piece follows finger, ghost preview on grid
   - Performance: DOM ref for floating piece position, `useMemo` for ghost cells and piece fit checks, `ResizeObserver` for cached cell size, re-renders only on grid cell boundary changes during drag
   - Premium visuals: dark gradient background, 3D glossy tiles with per-color light/base/dark gradients, glow effects, spring-animated cheers, floating score popups
   - Daily mode (seeded RNG, same pieces for all players) + free play
   - Firebase-synced daily scores between partners and family
   - Unlocks bonus Daily Reveal tiles at 200+ punti
   - Italian phrase reward after each game

5. **Image Pipeline**
   - `ImageGenerator.tsx` — background queue, 4s spacing, generates images for all cities/stops
   - `utils/imageProcessing.ts` — postcard merging (webcam photo + location image → polaroid)
   - Images cached in Zustand `waypointImages` (persisted)

### Data Flow

```
User Action → Component → useStore() or geminiService → State Update → Re-render
                                    ↓
                           Gemini API (grounding)
                                    ↓
                           GroundingResult → Save POI → useStore()
```

### Trip Data

All itinerary data lives in `constants.tsx` as `ITALIAN_CITIES: TripSegment[]`. 8 days, ~50 planned stops total. Each segment includes coordinates, Google Maps URIs, planned stops with types (sight/restaurant/hotel), narrative context for AI prompts, `driveFromPrev` driving times, `parking` ZTL warnings, and stop `duration`/`badge` fields.

---

## Known Issues & Technical Debt

### Critical

1. ~~**Weather model version**~~ — FIXED. Changed to `gemini-2.5-flash`.

2. ~~**Weather not persisted**~~ — FIXED. Added to Zustand `partialize`.

3. ~~**Image generation has no retry**~~ — FIXED. Re-enqueue to back with max 2 retries.

### High

4. ~~**POI city association**~~ — FIXED. Nearest-city matching by coordinates with 0.25° threshold.

5. ~~**3D card flip**~~ — NOT A BUG. Custom CSS in inline `<style>` tag defines `.rotate-y-180`. Works correctly.

6. ~~**Leaflet popup globals**~~ — FIXED. Delegated click handler with data attributes on document.

### Medium

7. ~~**ImageGenerator progress overshoot**~~ — FIXED. Separate completed/total counters with Math.min cap.

8. **Grounding types too broad** — `placeAnswerSources?: any` in types.ts. Fragile to SDK version changes.

9. **Unused stub component** — `CurrencyConverter.tsx` exports null. Intentional scope reduction.

10. ~~**No error notification system**~~ — FIXED. Toast system with Zustand store, 3 variants (info/error/success).

---

## Refactoring Log

### Initial State (2026-03-12)
- App exported from Google AI Studio
- Basic structure: components, hooks, services, store, utils
- No CLAUDE.md, no docs, no agent discipline
- Working features: map, chat with grounding, passport stamps, postcard creation, image generation
- Known bugs: weather model version, 3D flip, POI association
