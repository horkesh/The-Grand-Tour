import React, { useEffect, useState, useRef } from 'react';
import { ITALIAN_CITIES } from '../constants';
import { useStore } from '../store';
import { fetchPlacePhoto, isPlacesApiBlocked, PlacesApiBlockedError } from '../services/placesService';
import { useToast } from './Toast';

const MAX_RETRIES = 2;
const CONSECUTIVE_FAIL_BAIL = 5; // Stop entirely after this many consecutive failures

interface QueueItem {
  key: string;
  name: string;
  lat: number;
  lng: number;
  retries?: number;
}

// A cached entry is stale if it's missing OR it's a legacy AI-generated PNG
// data URL from the old Gemini image-gen flow. Real Places photos are stored
// as https URLs and stay valid; we don't try to convert them to data URLs
// because the Google CDN doesn't send CORS headers fetch() needs.
function isStale(cached: string | undefined): boolean {
  if (!cached) return true;
  return cached.startsWith('data:');
}

const ImageGenerator: React.FC = () => {
  const waypointImages = useStore((s) => s.waypointImages);
  const imagesHydrated = useStore((s) => s.imagesHydrated);
  const setWaypointImage = useStore((s) => s.setWaypointImage);
  const showToast = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const waypointImagesRef = useRef(waypointImages);
  waypointImagesRef.current = waypointImages;
  const consecutiveFailsRef = useRef(0);
  const queueBuiltRef = useRef(false);

  // 1. Build the Queue once IndexedDB hydration finishes (avoids re-fetching cached items)
  useEffect(() => {
    if (!imagesHydrated || queueBuiltRef.current) return;
    queueBuiltRef.current = true;

    // If a previous session already discovered the Places API key is locked
    // down (403 / PERMISSION_DENIED), don't even build the queue. The user
    // can clear this from /photos when they've fixed the key restriction.
    if (isPlacesApiBlocked()) {
      console.info('[ImageGenerator] Skipping — Places API previously marked blocked.');
      setDone(true);
      return;
    }

    const newQueue: QueueItem[] = [];
    const cached = waypointImagesRef.current;

    ITALIAN_CITIES.forEach((city) => {
      if (isStale(cached[city.id])) {
        newQueue.push({
          key: city.id,
          name: city.location + ', Italy',
          lat: city.center.lat,
          lng: city.center.lng,
        });
      }

      city.plannedStops.forEach((stop, idx) => {
        const key = `${city.id}_${idx}`;
        if (isStale(cached[key])) {
          newQueue.push({
            key,
            name: stop.title,
            lat: stop.lat,
            lng: stop.lng,
          });
        }
      });
    });

    if (newQueue.length > 0) {
      console.log(`[ImageGenerator] Queuing ${newQueue.length} place photos to fetch.`);
      setQueue(newQueue);
      setTotal(newQueue.length);
    } else {
      setDone(true);
    }
  }, [imagesHydrated]);

  // 2. Process Queue
  useEffect(() => {
    if (queue.length === 0 || isProcessing) return;

    const processNext = async () => {
      setIsProcessing(true);
      const item = queue[0];

      try {
        if (isStale(waypointImagesRef.current[item.key])) {
          const photoUrl = await fetchPlacePhoto(item.name, item.lat, item.lng);
          setWaypointImage(item.key, photoUrl);
        }
        consecutiveFailsRef.current = 0;
        setQueue((prev) => prev.slice(1));
        setCompleted(c => c + 1);
      } catch (err) {
        consecutiveFailsRef.current += 1;
        console.warn(`[ImageGenerator] Failed ${item.key} "${item.name}" (attempt ${(item.retries || 0) + 1}):`, (err as Error).message);

        // Bail immediately on the auth/restriction error. The placesService has
        // already flipped the localStorage flag, so future loads skip the queue
        // entirely — user only sees this toast once instead of every app open.
        if (err instanceof PlacesApiBlockedError) {
          console.warn('[ImageGenerator] Places API blocked — disabling queue for future loads.');
          showToast('Place photos disabled — your Google API key restriction blocks the Places API. Visit /photos to retry after fixing.', 'error');
          setQueue([]);
          setDone(true);
          return;
        }

        // Bail out entirely if we see too many consecutive failures
        if (consecutiveFailsRef.current >= CONSECUTIVE_FAIL_BAIL) {
          console.warn(`[ImageGenerator] ${CONSECUTIVE_FAIL_BAIL} consecutive failures — stopping queue.`);
          showToast('Photo loading paused — check Places API key restrictions.', 'error');
          setQueue([]);
          setDone(true);
          return;
        }

        const attempts = (item.retries || 0) + 1;
        if (attempts <= MAX_RETRIES) {
          setQueue((prev) => [...prev.slice(1), { ...item, retries: attempts }]);
        } else {
          setQueue((prev) => prev.slice(1));
          setCompleted(c => c + 1);
        }
      } finally {
        setTimeout(() => {
          setIsProcessing(false);
        }, 300);
      }
    };

    processNext();
  }, [queue, isProcessing, setWaypointImage]);

  // 3. Hide indicator after all items processed
  useEffect(() => {
    if (total > 0 && queue.length === 0 && !isProcessing && completed >= total) {
      const timer = setTimeout(() => setDone(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [queue, isProcessing, completed, total]);

  if (done || total === 0) return null;
  if (queue.length === 0 && completed === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4 animate-pulse">
        <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300">
                {Math.min(100, Math.round((completed / total) * 100))}%
            </div>
        </div>
        <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Loading Photos</p>
            <p className="text-xs font-serif font-bold text-slate-800 dark:text-white">Fetching place photos...</p>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
