import { ITALIAN_CITIES } from '../constants';

interface FeedItemLike {
  type: 'stamp' | 'postcard' | 'arrival' | 'voice';
  cityId: string;
  title: string;
}

/**
 * Resolve a stamp/postcard composite key back to its city + optional stop.
 * Handles three legacy formats:
 *   - "day-1"        → modern city id
 *   - "day-1_2"      → modern composite (city + stop index)
 *   - "1_0" / "0"    → legacy numeric format from very early builds where the
 *                      key was `${cityIndex}_${stopIndex}` instead of using
 *                      the actual city.id
 */
export function resolveKey(key: string): { city?: typeof ITALIAN_CITIES[number]; stop?: typeof ITALIAN_CITIES[number]['plannedStops'][number] } {
  if (!key) return {};
  // Direct city id match
  const direct = ITALIAN_CITIES.find((c) => c.id === key);
  if (direct) return { city: direct };
  // city.id + "_" + stopIdx
  const composite = key.match(/^(.*?)_(\d+)$/);
  if (composite) {
    const city = ITALIAN_CITIES.find((c) => c.id === composite[1]);
    if (city) return { city, stop: city.plannedStops?.[Number(composite[2])] };
  }
  // Legacy: "1_0" or just "1" → numeric city index (1-based or 0-based — try both)
  const legacy = key.match(/^(\d+)(?:_(\d+))?$/);
  if (legacy) {
    const n = Number(legacy[1]);
    const candidates = [ITALIAN_CITIES[n], ITALIAN_CITIES[n - 1]].filter(Boolean);
    for (const city of candidates) {
      if (legacy[2] === undefined) return { city };
      const stop = city.plannedStops?.[Number(legacy[2])];
      if (stop) return { city, stop };
    }
  }
  return {};
}

/**
 * Pretty-print a feed item title, ignoring whatever was stored at write
 * time. We always rebuild from cityId because legacy entries have all kinds
 * of broken titles (raw composite keys, "Stamp collected: 1_0", etc.) and
 * the type+cityId pair is the reliable source of truth.
 */
export function prettifyFeedTitle(item: FeedItemLike): string {
  const { city, stop } = resolveKey(item.cityId);
  if (city) {
    if (item.type === 'stamp') {
      return stop ? `Stamped ${stop.title} in ${city.location}` : `Arrived in ${city.location}!`;
    }
    if (item.type === 'postcard') {
      return stop ? `New postcard from ${stop.title}, ${city.location}` : `New postcard from ${city.location}`;
    }
    if (item.type === 'voice') {
      return stop ? `Voice update from ${stop.title}, ${city.location}` : `Voice update from ${city.location}`;
    }
    return stop ? `${stop.title}, ${city.location}` : city.location;
  }
  // Couldn't resolve — only fall back to stored title if it doesn't look raw.
  const looksRaw = /\b\d+(_\d+)?\b/.test(item.title) || /day-\d+/.test(item.title);
  if (looksRaw) {
    if (item.type === 'stamp') return 'New stamp on the trip';
    if (item.type === 'postcard') return 'New postcard';
    if (item.type === 'voice') return 'Voice update';
    return 'New update';
  }
  return item.title;
}
