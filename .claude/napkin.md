# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Startup Protocol
1. **[2026-03-12] Every Grand Tour session should begin with context alignment**
   Do instead: read `CLAUDE.md` first, `.claude/napkin.md` second, `docs/project_ledger.md` third, and `docs/planning.md` fourth before substantial work.
2. **[2026-03-12] Use docs/state-of-app.md for architecture questions**
   Do instead: read `docs/state-of-app.md` before proposing architectural changes so you understand the current patterns and known issues.
3. **[2026-03-12] Update the ledger after every meaningful change**
   Do instead: append a dated entry to `docs/project_ledger.md` after landing fixes, features, or decisions so the next session has continuity.

## Execution & Validation
1. **[2026-03-12] Type-check before committing**
   Do instead: run `npx tsc --noEmit` after meaningful changes to catch type errors early.
2. **[2026-03-12] Keep docs and code in sync**
   Do instead: when adding new hooks, components, or changing architecture, update `docs/state-of-app.md`, `docs/planning.md`, and `docs/project_ledger.md` in the same session.
3. **[2026-03-12] Test in browser after UI changes**
   Do instead: run `npm run dev` and verify visually when making component or styling changes.
4. **[2026-03-12] Verify Gemini model names against the actual API before using them**
   Do instead: check `@google/genai` SDK docs or the Google AI Studio model list for valid model IDs. Never guess model names.

## Frontend Patterns
1. **[2026-03-12] Tailwind is loaded via CDN, not Vite plugin**
   Do instead: don't add `@tailwindcss/vite` or try to configure tailwind.config.js. Classes work via the CDN script in `index.html`.
2. **[2026-03-12] Maps use Leaflet via CDN, abstracted through useLeaflet hook**
   Do instead: use `hooks/useLeaflet.ts` for map operations. Don't import Leaflet directly — access via `window.L`.
3. **[2026-03-12] Image generation runs as a background queue**
   Do instead: `ImageGenerator.tsx` processes waypoint images sequentially with 4s spacing. Don't call `generateLocationImage` directly from components.
4. **[2026-03-12] Animation constants — use Framer Motion with popLayout**
   Do instead: page transitions use `<AnimatePresence mode="popLayout">` in App.tsx. Wrap new views with `motion.div` for transitions.
5. **[2026-03-12] Theme toggle affects Tailwind dark: classes**
   Do instead: toggle via `document.documentElement.classList.toggle('dark')` — already handled in Layout. Use `dark:` prefix for dark mode styles.
6. **[2026-03-12] Zustand store is persisted — be careful what you add**
   Do instead: only persist data that should survive page refresh. Ephemeral UI state (loading, modals) stays in component state.
7. **[2026-03-12] POIs saved from chat are not city-associated**
   Do instead: saved POIs from ChatInterface use `cityId: 'planned'`. They appear on all city maps. This is a known limitation — see planning.md.
8. **[2026-03-12] Stub components exist — don't delete them**
   Do instead: `CurrencyConverter.tsx` and `Toast.tsx` are intentionally stripped to null exports. They were removed as part of scope reduction.

## Shell & Environment
1. **[2026-03-12] This is a Windows machine with bash shell**
   Do instead: use Unix shell syntax (forward slashes, /dev/null) but be aware that some tools may behave differently on Windows.
2. **[2026-03-12] Vite dev server runs on port 3000**
   Do instead: check `vite.config.ts` for server configuration before assuming defaults.
3. **[2026-03-12] API key injected via process.env, not import.meta.env**
   Do instead: Vite `define` config maps `process.env.API_KEY` and `process.env.GEMINI_API_KEY` from `.env.local`. Use `process.env.API_KEY` in code.

## Working Style
1. **[2026-03-12] Keep changes grounded in the real codebase**
   Do instead: inspect entrypoints, configs, and active implementation files before proposing structure or documenting behavior.
2. **[2026-03-12] Favor concise, actionable guidance**
   Do instead: record short rules with clear next actions rather than long explanations.
3. **[2026-03-12] Napkin updates are part of the work, not an afterthought**
   Do instead: read `.claude/napkin.md` at session start and update it during the same slice whenever a reusable rule becomes clearer.
4. **[2026-03-12] Ledger updates are part of every fix session**
   Do instead: after landing fixes or making decisions, append a dated entry to `docs/project_ledger.md` before ending the session.
