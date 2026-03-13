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
- **Status**: Deferred to Phase 5
- **Task**: Enable real-time sync between two phones (partner location sharing, shared stamps). `PartnerSync` type already defined in types.ts.
- **Files**: New `services/p2p.ts`, `types.ts`, `store.ts`

## Phase 4: Make It Memorable

Goal: Transform from a functional tool into a personal anniversary gift. Three sub-phases with /simplify between each.

### Phase 4A: Emotional Core

#### 4A.1 Welcome / Love Letter Screen
- **Status**: DONE
- **Task**: Full-screen welcome card on first open. Serif text, personal message, "20 years" motif. Show once (persisted flag), accessible from sidebar after. Framer Motion entrance.
- **Files**: New `components/Welcome.tsx`, `store.ts`, `App.tsx`

#### 4A.2 Anniversary Day 5 Special Treatment
- **Status**: DONE
- **Task**: Day 5 gets a unique rust/red header gradient (already in source HTML), heart badge on the itinerary list card, and "❤️ Anniversary" label. Wedding date shown on card back.
- **Files**: `components/DayDashboard.tsx`, `components/ItineraryList.tsx`

#### 4A.3 Stamp Celebration Animation
- **Status**: DONE
- **Task**: Confetti burst + haptic feedback (`navigator.vibrate`) when collecting a stamp. Short Framer Motion scale/rotate animation on the stamp button.
- **Files**: `components/DayDashboard.tsx`

#### 4A.4 Card Flip Hint
- **Status**: DONE
- **Task**: Subtle "tap to flip" hint on the hero card (pulsing icon or text), auto-dismissed after first flip. Prevents the flip mechanic from being invisible.
- **Files**: `components/DayDashboard.tsx`, `store.ts` (persist `hasFlipped` flag)

### Phase 4B: Practical Travel

#### 4B.1 Day-to-Day Navigation
- **Status**: DONE
- **Task**: Prev/next arrows in DayDashboard header. Swipe gesture support optional. Mobile "Journal" nav remembers last-viewed day.
- **Files**: `components/DayDashboard.tsx`, `store.ts`

#### 4B.2 Parking & ZTL Warnings
- **Status**: DONE
- **Task**: Add `parking?: string` field to `TripSegment`. Populate from source HTML. Display as a warning banner in DayDashboard (amber left-border box, matching source HTML's style).
- **Files**: `types.ts`, `constants.tsx`, `components/DayDashboard.tsx`

#### 4B.3 Stop Durations & Descriptions
- **Status**: DONE
- **Task**: Add `duration?: string` and `description?: string` to `PlannedStop`. Populate key stops from source HTML. Show in waypoint cards.
- **Files**: `types.ts`, `constants.tsx`, `components/DayDashboard.tsx`

#### 4B.4 Missing Stops & Backup Restaurants
- **Status**: DONE
- **Task**: Add Day 7 lunch (Romolo al Centro). Add Day 5 backup anniversary restaurants with a "backup" badge. Pull from source-gaps.md.
- **Files**: `constants.tsx`

#### 4B.5 Persist Chat History
- **Status**: DONE
- **Task**: Add `chatMessages` to Zustand persisted state so AI concierge conversations survive tab close / page refresh.
- **Files**: `store.ts`, `components/ChatInterface.tsx`

### Phase 4C: Delight & Sharing

#### 4C.1 Shareable Postcards
- **Status**: DONE
- **Task**: Download button on postcards in Gallery. Convert data URL to blob, trigger download as PNG. Optional: Web Share API for mobile sharing.
- **Files**: `components/Gallery.tsx`

#### 4C.2 Trip Complete Ceremony
- **Status**: DONE
- **Task**: When all 8 city stamps collected, show a celebratory full-screen modal. "Our Grand Tour — Complete" with stamp grid, total distance, and farewell message.
- **Files**: New `components/TripComplete.tsx`, `components/Passaporto.tsx`, `store.ts`

#### 4C.3 Postcard Personal Messages
- **Status**: DONE
- **Task**: After taking a postcard photo, prompt for a short handwritten-style message overlay. Rendered on the polaroid.
- **Files**: `components/DayDashboard.tsx`, `utils/imageProcessing.ts`

#### 4C.4 Clean Up Dead Code
- **Status**: DONE
- **Task**: Remove CurrencyConverter stub. Update napkin to remove the "don't delete stubs" rule. Clean any other dead references.
- **Files**: `components/CurrencyConverter.tsx`, `.claude/napkin.md`

### Phase 5: Full Feature Set

#### 5.1 Geolocation Tracking
- **Status**: DONE
- **Task**: Show user's current position on maps via browser Geolocation API. Pulsing blue dot marker on both overview and day-level maps.
- **Files**: New `hooks/useGeolocation.ts`, `App.tsx`, `components/OverviewMap.tsx`, `components/ItineraryMapOverlay.tsx`

#### 5.2 Real Photo Uploads
- **Status**: DONE
- **Task**: Replace AI-generated images with camera roll photos. File input with canvas resize (800px, JPEG 0.7). Remove/revert option.
- **Files**: New `utils/imageResize.ts`, `components/DayDashboard.tsx`, `store.ts`

#### 5.3 Story Mode
- **Status**: DONE
- **Task**: Scrollable post-trip narrative. Each day as a chapter with hero image, milestone quote, stop badges, stop images, postcards. Finale with totals.
- **Files**: New `components/StoryMode.tsx`, `App.tsx`, `components/Sidebar.tsx`, `constants.tsx`

#### 5.4 Partner Sync
- **Status**: DONE
- **Task**: Clipboard-based sync between two phones. Export stamps + POIs as base64 JSON, import partner's to merge. No backend needed.
- **Files**: New `components/PartnerSync.tsx`, `components/Sidebar.tsx`

### Phase 6: UI Polish
- TBD — user-directed polish pass
