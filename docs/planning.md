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
- **Task**: When saving a POI from chat, detect which city it's nearest to (by coordinates) and assign that `cityId`. Fall back to `'planned'` if no match.
- **Files**: `components/ChatInterface.tsx`, `components/GroundingResult.tsx`

### 2.2 Error Notification System
- **Task**: Replace `alert()` calls and generic catch blocks with a lightweight toast system. Reactivate `Toast.tsx` stub.
- **Files**: `components/Toast.tsx`, `components/DayDashboard.tsx`, `components/ChatInterface.tsx`

### 2.3 Leaflet Popup Refactor
- **Task**: Replace `window.handleEditNote` / `window.handleRemovePOI` globals with a message-passing pattern or React portal approach for Leaflet popups.
- **Files**: `components/ItineraryMapOverlay.tsx`

## Phase 3: Feature Enhancements

### 3.1 Offline Support
- **Task**: Add service worker for offline map tiles and cached itinerary data. PWA manifest already exists.
- **Files**: New `sw.js`, `index.html`

### 3.2 Travel Time Estimates
- **Task**: Show driving/transit times between cities using Gemini grounding or a directions API.
- **Files**: `services/geminiService.ts`, `components/ItineraryList.tsx`

### 3.3 Partner Sync
- **Task**: Enable real-time sync between two phones (partner location sharing, shared stamps). `PartnerSync` type already defined in types.ts.
- **Files**: New `services/p2p.ts`, `types.ts`, `store.ts`
