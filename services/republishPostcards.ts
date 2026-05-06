import { ITALIAN_CITIES } from '../constants';
import { getAllPostcards } from './imageDB';
import { writeDoc, removeDoc, readCollection } from './firestoreSync';
import { shrinkDataUrl } from '../utils/shrinkDataUrl';

interface ProgressTick {
  step: 'scanning' | 'cleaning' | 'publishing' | 'done';
  current: number;
  total: number;
  message?: string;
}

function resolveCityKey(key: string) {
  if (!key) return {};
  const direct = ITALIAN_CITIES.find((c) => c.id === key);
  if (direct) return { city: direct };
  const m = key.match(/^(.*)_(\d+)$/);
  if (!m) return {};
  const city = ITALIAN_CITIES.find((c) => c.id === m[1]);
  const stop = city?.plannedStops?.[Number(m[2])];
  return { city, stop };
}

/**
 * Walks the local IndexedDB postcards store, scrubs the existing
 * trips/{tripId}/feed of stale postcard docs (the ones written before the
 * thumbnail fix where imageUrl was dropped), and re-publishes every
 * postcard with a deterministic feedId so each is exactly one feed entry
 * with a working thumbnail. Idempotent — safe to run multiple times.
 */
export async function republishAllPostcards(
  tripId: string,
  onProgress?: (p: ProgressTick) => void,
): Promise<{ removed: number; published: number }> {
  // 1. Read local postcards (cityKey → urls[])
  onProgress?.({ step: 'scanning', current: 0, total: 0, message: 'Reading local postcards…' });
  const map = await getAllPostcards();
  const postcardEntries: Array<{ cityKey: string; url: string; idx: number }> = [];
  for (const [cityKey, urls] of Object.entries(map)) {
    urls.forEach((url, idx) => postcardEntries.push({ cityKey, url, idx }));
  }
  const total = postcardEntries.length;

  // 2. Delete every existing postcard feed doc so we don't duplicate when the
  //    new deterministic IDs differ from the legacy timestamp-keyed ones.
  onProgress?.({ step: 'cleaning', current: 0, total, message: 'Removing old postcard entries…' });
  let removed = 0;
  try {
    const feedDocs = await readCollection(`trips/${tripId}/feed`);
    const oldPostcardDocs = feedDocs.filter((d) => (d.data as { type?: string }).type === 'postcard');
    for (const d of oldPostcardDocs) {
      try {
        await removeDoc(`trips/${tripId}/feed/${d.id}`);
        removed += 1;
      } catch (e) {
        console.warn('[republish] failed to delete', d.id, e);
      }
    }
  } catch (e) {
    console.warn('[republish] feed scan failed:', e);
  }

  // 3. Re-publish each postcard with a deterministic feedId so reruns are
  //    idempotent. Thumbnail goes through shrinkDataUrl so it stays under
  //    the Firestore 1 MB doc limit.
  let published = 0;
  for (let i = 0; i < postcardEntries.length; i++) {
    const { cityKey, url, idx } = postcardEntries[i];
    onProgress?.({ step: 'publishing', current: i + 1, total, message: `Publishing ${i + 1} of ${total}…` });
    try {
      const thumb = await shrinkDataUrl(url, 800, 0.7);
      const { city, stop } = resolveCityKey(cityKey);
      const title = stop && city
        ? `New postcard from ${stop.title}, ${city.location}`
        : `New postcard from ${city?.location || 'the trip'}`;
      // Deterministic feedId: same key + index always overwrites the same doc.
      const feedId = `postcard-${cityKey.replace(/[^a-zA-Z0-9_-]/g, '_')}-${idx}`;
      await writeDoc(`trips/${tripId}/feed/${feedId}`, {
        type: 'postcard',
        cityId: cityKey,
        title,
        imageUrl: thumb,
        // Approximate timestamp: spread them slightly so sort order is stable.
        timestamp: Date.now() - (postcardEntries.length - i) * 1000,
      });
      published += 1;
    } catch (e) {
      console.warn('[republish] failed to publish', cityKey, e);
    }
  }

  onProgress?.({ step: 'done', current: total, total, message: 'Done.' });
  return { removed, published };
}
