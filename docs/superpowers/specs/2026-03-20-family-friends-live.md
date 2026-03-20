# Family & Friends Live Trip Experience

**Date:** 2026-03-20
**Status:** Approved

## Goal

Let family and friends follow the Italy trip in real-time and interact from afar. Two tiers: spectators (link only, read-only) and inner circle (code + nickname, can react/comment/play/send care packages).

## Architecture

### Two Surfaces

1. **Live Trip Page** (`/live`) — public, no auth. Map-first view with route drawing itself city by city. Shows: city arrivals, stamps, postcards, photos. No live GPS — just current city. Read-only Firestore listeners.

2. **Family Hub** (`/family`) — inner circle. Same live feed plus: emoji reactions on updates, guestbook messages, Piazza Puzzle leaderboard, care packages (surprise notes targeting a day/city).

### Access

- Live page: anyone with the link, no auth required (outside AuthGate)
- Family hub: join code + nickname, stored in localStorage as `familyUid`
- Partners (Haris & Maja): see care packages in their app, see family reactions/messages

### Data Model (Firestore)

```
trips/{tripId}/
  feed/{autoId}         — { type, cityId, title, detail, imageUrl?, timestamp }
  family/{familyUid}    — { nickname, color, joinedAt }
  reactions/{feedItemId} — { [uid]: emoji }
  guestbook/{autoId}    — { authorUid, authorName, message, timestamp }
  carePackages/{autoId}  — { senderUid, senderName, forCityId, message, timestamp, readBy[] }
  puzzle/{dateKey}       — { [uid]: score } (already exists, extend to family)
```

### Feed Generation

Auto-write feed items when:
- A stamp is collected → "Arrived in {city}!"
- A postcard is created → "New postcard from {city}"
- Feed written from `store.ts` actions (syncWrite pattern)

### Components

| Component | Route | Auth | Purpose |
|-----------|-------|------|---------|
| LiveTripPage | /live | None | Public map + feed |
| FamilyHub | /family | Family code | Inner circle hub |
| FamilyJoin | /family/join | None | Code + nickname entry |
| CarePackages | (in-app) | Partner | View received packages |

### Integration Points

- `App.tsx`: live/family routes outside AuthGate
- `store.ts`: feed items on stamp/postcard actions
- `BlockBlast.tsx`: family members in puzzle leaderboard
- Sidebar/TogetherHub: care package inbox + family link sharing

## Constraints

- No Google sign-in for family — localStorage nickname only
- Auto-publish stamps/postcards/arrivals (no manual curation needed during trip)
- GPS stays private — only city-level location shown
- Single shared join code (same as partner code or new one)
