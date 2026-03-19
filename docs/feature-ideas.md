# Feature Ideas — The Grand Tour

Compiled from brainstorming session. Grouped by theme.

---

## Pre-Trip: Building Anticipation

### 1. Countdown Dashboard
A landing page (or reimagined Welcome modal) showing days/hours until May 2 departure. Daily rotating "Did you know?" fact about each city from Gemini. Real-time countdown tick. Vibe shifts as the trip approaches.

### 2. Daily Reveal Calendar
Advent-calendar style. Each day in the weeks before May 2, a tile unlocks: a destination photo, a local phrase, a restaurant preview, a historical tidbit. Locked tiles show mystery silhouettes. Creates a daily drip of excitement.

### 3. Packing & Prep Checklist
Interactive shareable checklist (passports, adapters, reservations, outfits). Both partners mark items off via Partner Sync. Satisfying progress bar as items get checked.

### 4. "Learn a Phrase" Mini-Game
Daily Italian phrase flashcard with pronunciation (via Gemini or static data). Swipe to reveal translation. Track how many phrases learned before the trip.

### 5. Weather Watcher
2-week forecast trend for each city as the trip approaches, updating daily. "Rome is looking sunny for Day 1!" Real data builds real anticipation.

### 6. Route Preview Flyover
Animated map sequence that "flies" through the full 8-day route on Leaflet. Each stop gets a tooltip preview. Cinematic way to visualize the journey ahead.

### 7. Shared Wishlist (Pre-Trip POIs)
Both partners drop pins or save POIs before the trip with notes like "I heard this trattoria is amazing." Feeds directly into existing savedPOIs system and shows up on day pages during the trip.

---

## During & Post-Trip: Export & Keepsakes

### 8. Trip Memory Book (PDF/HTML Export)
Multi-page keepsake — cover page, day-by-day chapters with postcards, collected stamps, AI-generated highlights, weather snapshots. Could use html2canvas + jsPDF, or styled printable HTML (window.print() with @media print CSS). The biggest missing piece for a trip souvenir.

**TODO:** Study Codex app export templates (horkesh/the-codex) for patterns and libraries once access is available.

### 9. Timelapse Map Animation ("Replay Our Journey")
Button on Story page that animates the route on Leaflet day-by-day — polyline draws itself, stamps pop in at each city, camera icon flashes where postcards were taken. Framer Motion + Leaflet already in stack.

### 10. Shareable Story Link (Static HTML Export)
Export the Story page as a self-contained HTML file (inline styles, base64 images). Email or share — no server needed. Recipients open in any browser and see the full trip narrative.

### 11. Postcard Composer Upgrade
Text overlays with handwritten-style fonts, postcard border templates (vintage, polaroid, stamp-edged), font picker. Canvas work in imageProcessing.ts already supports compositing.

### 12. Daily Highlights Reel
Auto-generated "day in review" card at end of each day — weather, distance traveled, stamps collected, postcards taken, AI summary quote. Modal or special card in Story view.

### 13. Audio Postcards
Record short voice clips (Web Audio API) attached to postcards — ambient piazza sounds, laughter, a comment. Stored as base64 alongside image. Playable in Gallery with speaker icon.

### 14. Bulk Gallery Download
Zip all postcards into a single download. JSZip is tiny.

### 15. Social Share Cards
Generate Open Graph-style summary image for sharing on WhatsApp/Instagram.

### 16. Print-Ready Passport Page
@media print styles for the passport so it can be printed as a physical keepsake.

---

## Priority Recommendations

**Highest impact, pre-trip:** #2 Daily Reveal Calendar, #7 Shared Wishlist
**Highest impact, export:** #8 Trip Memory Book, #10 Shareable Story Link
**Quick wins:** #14 Bulk Download, #16 Print Passport, #1 Countdown

---

## Notes

- Codex app (horkesh/the-codex) has export templates to study — not yet accessible in this session. Need to review before implementing #8.
- All pre-trip features should gracefully transition into during-trip mode on May 2.
- Current stack: React 19, Vite, Tailwind (CDN), Leaflet, Framer Motion, Gemini AI, Zustand.
