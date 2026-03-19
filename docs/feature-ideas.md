# Feature Ideas — The Grand Tour

Compiled from brainstorming session. Grouped by theme.

---

## Pre-Trip: Building Anticipation

### 1. Countdown Dashboard ✅
Full-screen countdown with days:hours:minutes, daily rotating Italian facts (14 facts), 8-city preview grid, real-time `useCountdown` hook. Route: `/countdown`. Component: `CountdownDashboard.tsx`.

### 2. Daily Reveal Calendar ✅
30-tile advent calendar unlocking one tile per day for 30 days before departure. Tiles contain photos, phrases, facts, and restaurant previews. Locked tiles show "?" silhouettes. Modal detail view on tap. Route: `/reveals`. Component: `DailyReveal.tsx`.

### 3. Packing & Prep Checklist ✅
26 default items across 5 categories (documents, clothing, tech, toiletries, misc). Progress bar, custom items, batch-initialized Zustand state. Route: `/packing`. Component: `PackingChecklist.tsx`. Store: `checklist`, `setChecklist`, `toggleChecklistItem`, `addChecklistItem`, `removeChecklistItem`.

### 4. "Learn a Phrase" Mini-Game ✅
24 Italian flashcards with pronunciation across 6 categories (Greetings, Basics, Essential, Restaurant, Shopping, Driving, Expressions, Romance). Tap-to-reveal translation, learned tracking, category index. Route: `/phrases`. Component: `LearnPhrase.tsx`.

### 5. Weather Watcher
2-week forecast trend for each city as the trip approaches, updating daily. "Rome is looking sunny for Day 1!" Real data builds real anticipation.

### 6. Route Preview Flyover ✅
Animated Leaflet map that flies through all 8 cities with numbered markers, dashed polylines, and city info cards. L.layerGroup for clean replay. Route: `/flyover`. Component: `RouteFlyover.tsx`.

### 7. Shared Wishlist (Pre-Trip POIs) ✅
Save places with editable notes, grouped by day/city. Add form with city picker. Integrated with existing `savedPOIs` system + new `wishlistNotes` store. Route: `/wishlist`. Component: `Wishlist.tsx`.

---

## During & Post-Trip: Export & Keepsakes

### 8. Trip Memory Book (PDF/HTML Export)
Multi-page keepsake — cover page, day-by-day chapters with postcards, collected stamps, AI-generated highlights, weather snapshots. Could use html2canvas + jsPDF, or styled printable HTML (window.print() with @media print CSS). The biggest missing piece for a trip souvenir.

**TODO:** Study Codex app export templates (horkesh/the-codex) for patterns and libraries once access is available.

### 9. Timelapse Map Animation ("Replay Our Journey") ✅
Full-screen dark-themed Leaflet map launched from Story page. Flies through 8 cities showing stamp status, photo indicators, stamped/unstamped polylines. L.layerGroup for clean replay. Component: `JourneyReplay.tsx`. Integrated into `StoryMode.tsx`.

### 10. Shareable Story Link (Static HTML Export) ✅
Downloads entire Story page as self-contained HTML file with inline styles, CDN fonts, all 8 day chapters, stamp badges, postcard carousels. "Save as HTML" button on Story page hero. Utility: `utils/storyExport.ts`.

### 11. Postcard Composer Upgrade ✅
Canvas-based editor with 4 border styles (none, polaroid, vintage, stamp), 3 font options (Classic/Handwritten/Modern), title + subtitle text overlays. Debounced rendering with cached images. Component: `PostcardComposer.tsx`.

### 12. Daily Highlights Reel
Auto-generated "day in review" card at end of each day — weather, distance traveled, stamps collected, postcards taken, AI summary quote. Modal or special card in Story view.

### 13. Audio Postcards ✅
Web Audio API recording per-location. Play/delete clips inline. Stored as base64 in Zustand `audioPostcards` store. Cleanup on unmount for streams/intervals. Component: `AudioRecorder.tsx`. Integrated into `DayDashboard.tsx` sidebar.

### 14. Bulk Gallery Download ✅
JSZip loaded dynamically from CDN. Zips all postcards with city-named filenames. "Download All" button in Gallery header. Utility: `utils/bulkDownload.ts`. Integrated into `Gallery.tsx`.

### 15. Social Share Cards
Generate Open Graph-style summary image for sharing on WhatsApp/Instagram.

### 16. Print-Ready Passport Page ✅
@media print CSS in `index.html` with A4 layout, hidden nav/header/buttons, 4-column stamp grid, page break rules. "Print Passport" button in `Passaporto.tsx`.

---

## Implementation Status

**Implemented (12/16):** #1, #2, #3, #4, #6, #7, #9, #10, #11, #13, #14, #16
**Not implemented (4/16):** #5 Weather Watcher (existing weather covers this), #8 Trip Memory Book (PDF), #12 Daily Highlights Reel, #15 Social Share Cards

---

## Codex Export System — Reference Architecture

Studied from `horkesh/the-codex` (`src/export/`). This is the pattern to follow for Grand Tour exports.

### Core: `exporter.ts`
- **`html2canvas`** renders any DOM element to PNG at 3x scale (`useCORS: true`, `backgroundColor: null`)
- 30s timeout via `Promise.race`
- `exportToPng(element)` → `Blob`
- `shareImage(blob, filename)` → Web Share API with download fallback
- `exportAndShare(element, filename)` — one-call convenience
- `exportMultipleToPng(elements[], onProgress?)` — carousel/multi-page with progress callback
- `shareMultipleImages(blobs[], prefix)` — batch share or sequential download fallback

### Template Pattern
All templates use **inline styles** (not Tailwind) because html2canvas needs computed styles. Pattern:
- Fixed canvas sizes: `1080×1920` (story), `1080×1350` (portrait), `1080×1080` (square)
- `React.forwardRef` on every template so exporter can grab the DOM node
- Inline style objects, not CSS classes
- Design tokens in `shared/utils.ts`: `FONT` (display/body/mono), `COLOR` (obsidian/gold/ivory)

### Shared Components (`templates/shared/`)
- **`BackgroundLayer`** — full-bleed image + dark gradient overlay (two strengths)
- **`InsetFrame`** — decorative gold border 24px inset with darkened/blurred edges (gallery mat effect)
- **`GoldRule`** — gradient horizontal divider (transparent → gold → transparent)
- **`BrandMark`** — logo at sm/md/lg sizes
- **`ParticipantRow`** — avatar row for multi-person entries
- **`PassportFrame`** — reusable passport layout wrapper

### Template Gallery (what exists)
- **CountdownCard** — days-until with giant number, event title, location, background image
- **PassportPage** — 4-column stamp grid, dark bg, gold accents, country/stamp counts
- **AnnualWrapped** — Spotify-wrapped style year-in-review with stat boxes + per-person rows
- **MissionCarousel** — 4 visual variants (V1 centered, V2 bold hero, V3 passport stamp, V4 full-bleed)
- **Plus:** AchievementCard, CallingCard, DebriefPage, GatheringInviteCard, GatheringRecap, IftarCard, InterludeCard, LiveMusicCard, NightOutCard, PS5MatchCard, RivalryCard, SteakVerdict, ToastCard, WrappedCard, YearInReview, visa-carousel/

### Key Takeaways for Grand Tour
1. **Use html2canvas, not jsPDF** — render React templates to PNG, share via Web Share API
2. **Inline styles only** in export templates (html2canvas doesn't reliably read Tailwind CDN)
3. **forwardRef pattern** — template components expose ref, exporter calls `exportToPng(ref.current)`
4. **Design token system** — adapt Codex's FONT/COLOR to Grand Tour's palette (teal/rust/warm-white)
5. **Multi-image export** with progress callback for carousel-style sharing (Instagram stories)
6. **Fixed canvas sizes** for pixel-perfect social media output (1080px width standard)

### Grand Tour Adaptations
- Replace Codex gold (#C9A84C) → Grand Tour teal (#194f4c) + rust (#ac3d29) + warm white (#f9f7f4)
- Replace "The Gents Chronicles" branding → "The Grand Tour" with Italian typography
- Reuse: BackgroundLayer, InsetFrame, GoldRule patterns (rename GoldRule → TealRule or AccentRule)
- New templates needed: DayCard, TripSummaryCard, StampCollectionPage, PostcardGrid, CountdownCard

---

## Notes

- All pre-trip features should gracefully transition into during-trip mode on May 2.
- Current stack: React 19, Vite, Tailwind (CDN), Leaflet, Framer Motion, Gemini AI, Zustand.
- Export dependency to add: `html2canvas` (the only new dep needed).
