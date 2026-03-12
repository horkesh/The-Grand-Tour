# The Grand Tour

An AI-powered Italian travel companion PWA for an 8-day anniversary trip (May 2–9, 2026). Built with React 19, TypeScript, Vite, Tailwind CSS (CDN), Leaflet maps, Framer Motion, and Google Gemini AI with Maps/Search grounding.

## Stack

- **Runtime**: Vite dev server (port 3000), browser-based SPA
- **UI**: React 19, Tailwind CSS (CDN in `index.html`), Framer Motion
- **State**: Zustand store (`store.ts`) with persist middleware → `localStorage`
- **AI**: Google Gemini API (`@google/genai`) via `services/geminiService.ts`
- **Maps**: Leaflet 1.9.4 (CDN), abstracted via `hooks/useLeaflet.ts`
- **Routing**: React Router DOM 7 (HashRouter)
- **Fonts**: Inter (sans), Playfair Display (serif) — loaded via CDN in `index.html`
- **Path alias**: `@/*` → `./*`

## Repo Structure

```
App.tsx            Main app — Layout, routing, mobile nav, weather prefetch
index.tsx          React DOM entry
index.html         HTML shell with CDN imports (Tailwind, Leaflet, fonts), importmap
constants.tsx      8-day itinerary data (TripSegment[]), PlannedStops, SVG Icons
types.ts           All shared type definitions
store.ts           Zustand store (theme, POIs, stamps, postcards, images, weather)
components/        UI components (12 files)
hooks/             Custom hooks (3 hooks)
services/          Gemini AI service
utils/             Image processing (postcard merging)
docs/              Planning, architecture, and session ledger
```

## Key Entrypoints

- `index.html` → `index.tsx` → `App.tsx`
- `App.tsx` renders `<Layout>` wrapping `<AnimatedRoutes>` (React Router)
- Routes: `/` (map), `/list` (itinerary), `/passport`, `/gallery`, `/chat`, `/day/:cityId`

## Commands

```bash
npm run dev       # Start Vite dev server on port 3000
npm run build     # Production build
npx tsc --noEmit  # Type check
```

## Environment

- `GEMINI_API_KEY` in `.env.local` (loaded via Vite `process.env.API_KEY`)
- Never commit `.env.local` or API keys

## Conventions

### State Management
- Single Zustand store in `store.ts` with persist middleware
- Components consume via `useStore()` directly
- Persisted: theme, savedPOIs, stamps, postcards, waypointImages
- Not persisted: userLocation, weatherData

### Components
- Route views live directly in `components/` (no `views/` subfolder)
- Leaflet map logic abstracted into `hooks/useLeaflet.ts`
- AI image generation handled by `components/ImageGenerator.tsx` (background queue)
- Postcard creation in `utils/imageProcessing.ts`

### AI Integration
- All Gemini calls go through `services/geminiService.ts`
- Chat uses grounding (googleMaps + googleSearch tools)
- Image generation: `gemini-2.5-flash-image` model
- Weather: `gemini-3-flash-preview` model
- Retry with exponential backoff, 30s global cooldown on rate limits

### Routing
- HashRouter for compatibility
- `AnimatePresence mode="popLayout"` wraps Routes for transitions
- Mobile bottom nav + desktop sidebar nav

### Styling
- Tailwind CSS via CDN (not Vite plugin) — utility classes throughout
- Theme colors: primary teal `#194f4c`, accent rust `#ac3d29`, warm white `#f9f7f4`
- Dark mode via `dark:` classes, toggled by `theme` state + `document.documentElement.classList`
- Custom CSS animations in `index.html`: grain overlay, radar pulse, marching ants
- Framer Motion for page transitions and stagger animations

### Code Style
- TypeScript strict mode
- Prefer hooks and functional components
- Zustand store is single flat file — no splitting needed at current scale
- No prop drilling — components read from `useStore()` directly
