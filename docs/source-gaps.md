# Source HTML Gaps

Data present in `docs/italy_trip.html` but missing from the app.

## High Priority
1. **Parking/ZTL warnings** — Every day has specific parking instructions (e.g., "Orvieto: park at Campo della Fiera, do not drive into centro storico ZTL"). Critical for driving in Italy.
2. **Missing Day 7 lunch** — Romolo al Centro (Ostia Antica area) not in plannedStops.
3. **Backup anniversary restaurants (Day 5)** — La Terrazza della Val d'Orcia, La Terrazza del Chiostro, Bacco E Cerere 2.0.

## Medium Priority
4. **Budget/cost summary** — Full breakdown: flights 408 KM, accommodation 1,272 KM, car 1,280 KM, fuel 260 KM, tolls 50 KM, groceries 206 KM, meals 1,548 KM → total 5,124.94 KM.
5. **Car rental details** — Jeep Avenger, electric, all-inclusive protection (0 excess).
6. **Driving distances per day** — App has drive times but not km distances (Day 2: ~150km, Day 3: ~280km, etc.).
7. **Roman Awareness blurbs** — Historical Roman context per day. Could enrich `itineraryContext` or be a separate field.

## Low Priority
8. **Accommodation cost/thumbnails** — HTML has per-night costs and booking.com thumbnail URLs. App only has basic PlannedStop entries.
9. **Image galleries** — HTML has 3 curated photos per day; app has 1 hero image.
10. **Flight details** — Arrival FCO 23:40 (day 1), departure 20:05 (day 8). Partially in descriptions.
11. **Scenic stop durations** — HTML has time estimates per stop (e.g., "Civita di Bagnoregio 60-90 min"). App has stops but no durations.
