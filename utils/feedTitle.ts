import { ITALIAN_CITIES } from '../constants';

interface FeedItemLike {
  type: 'stamp' | 'postcard' | 'arrival' | 'voice';
  cityId: string;
  title: string;
}

/**
 * Backfill pretty title for legacy feed items written before the
 * resolveCityKey fix in store.ts. Old docs show titles like
 * "Stamp collected: day-1_1" — re-derive the proper text from the
 * cityId field so renderers don't need a Firestore migration.
 */
export function prettifyFeedTitle(item: FeedItemLike): string {
  const looksRaw = /(Stamp collected|New postcard from):?\s*day-\d+/i.test(item.title)
    || /(^|\s)day-\d+(_\d+)?(\s|$)/i.test(item.title);
  if (!looksRaw && !item.title.includes('day-')) return item.title;
  const m = item.cityId?.match(/^(.*?)(?:_(\d+))?$/);
  if (!m) return item.title;
  const city = ITALIAN_CITIES.find((c) => c.id === m[1]);
  if (!city) return item.title;
  const stop = m[2] !== undefined ? city.plannedStops?.[Number(m[2])] : undefined;
  if (item.type === 'stamp') {
    return stop ? `Stamped ${stop.title} in ${city.location}` : `Arrived in ${city.location}!`;
  }
  if (item.type === 'postcard') {
    return stop ? `New postcard from ${stop.title}, ${city.location}` : `New postcard from ${city.location}`;
  }
  return stop ? `${stop.title}, ${city.location}` : city.location;
}
