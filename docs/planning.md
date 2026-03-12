# Implementation Plan

## Current State

Working travel companion app with map, AI chat, passport stamps, postcard creation, and background image generation. Exported from Google AI Studio, now under agent discipline.

## Phase 1: Stability Fixes (Priority)

### 1.1 Verify Gemini Model Names
- **Status**: DONE
- **Task**: Confirm `gemini-2.5-flash`, `gemini-2.5-flash-image`, and `gemini-3-flash-preview` are valid. Fix any invalid ones.
- **Files**: `services/geminiService.ts`

### 1.2 Weather Persistence
- **Status**: DONE
- **Task**: Add `weatherData` to Zustand `partialize` so it survives page refresh. Add a TTL check (e.g., 6 hours) so stale weather is re-fetched.
- **Files**: `store.ts`

### 1.3 Image Generation Retry
- **Status**: DONE
- **Task**: Add retry logic to `ImageGenerator.tsx` queue — on failure, re-enqueue with backoff (max 2 retries per image).
- **Files**: `components/ImageGenerator.tsx`

### 1.4 3D Card Flip Fix
- **Status**: NOT NEEDED — false positive. DayDashboard defines `.rotate-y-180` in inline `<style>` tag. Works correctly.

## Phase 2: UX Polish

### 2.1 POI City Association
- **Status**: DONE
- **Files**: `components/ChatInterface.tsx`, `components/GroundingResult.tsx`

### 2.2 Error Notification System
- **Status**: DONE
- **Files**: `components/Toast.tsx`, `components/DayDashboard.tsx`, `components/ChatInterface.tsx`, `App.tsx`

### 2.3 Leaflet Popup Refactor
- **Status**: DONE
- **Files**: `components/ItineraryMapOverlay.tsx`

## Phase 3: Feature Enhancements

### 3.1 Offline Support
- **Status**: DONE
- **Task**: Service worker for caching app shell (CDN resources) and navigation pages. Cache-first for CDN, network-first for HTML.
- **Files**: New `public/sw.js`, `index.html`

### 3.2 Travel Time Estimates
- **Status**: DONE
- **Task**: Static drive times between consecutive cities, displayed as dashed-line pills between city cards in the itinerary list.
- **Files**: `types.ts`, `constants.tsx`, `components/ItineraryList.tsx`

### 3.3 Partner Sync
- **Status**: Deferred to Phase 4
- **Task**: Enable real-time sync between two phones (partner location sharing, shared stamps). `PartnerSync` type already defined in types.ts.
- **Files**: New `services/p2p.ts`, `types.ts`, `store.ts`
