import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ITALIAN_CITIES } from '../constants';
import { listenCollection, listenDoc } from '../services/firestoreSync';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ensureAnonymousAuth } from '../services/anonymousAuth';
import LiveMap, { LivePosition } from './LiveMap';
import ErrorBoundary from './ErrorBoundary';

// Lazy + wrapped — keeps any FamilyInteractions hiccup from blanking /live.
const FamilyInteractions = React.lazy(() => import('./FamilyInteractions'));

interface FeedItem {
  id: string;
  type: 'stamp' | 'postcard' | 'arrival' | 'voice';
  cityId: string;
  title: string;
  detail?: string;
  imageUrl?: string;
  audioData?: string;
  audioDuration?: number;
  timestamp: number;
}

const TRIP_START = new Date('2026-05-02T00:00:00').getTime();
const TRIP_TOTAL_DAYS = 8;

function tripDayLabel(now = Date.now()): string {
  const days = Math.floor((now - TRIP_START) / 86_400_000) + 1;
  if (days < 1) return 'Pre-departure';
  if (days > TRIP_TOTAL_DAYS) return 'Trip complete';
  return `Day ${days} of ${TRIP_TOTAL_DAYS}`;
}

const StatTile: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3 py-2.5 text-center shadow-sm">
    <p className="font-serif text-base sm:text-lg font-bold text-[#194f4c] dark:text-teal-300 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
      {value}
    </p>
    <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
  </div>
);

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function typeIcon(type: FeedItem['type']): string {
  if (type === 'stamp') return '🛂';
  if (type === 'postcard') return '📮';
  if (type === 'voice') return '🎙️';
  return '✈️';
}

function typeLabel(type: FeedItem['type']): string {
  if (type === 'stamp') return 'Passport Stamp';
  if (type === 'postcard') return 'Postcard';
  if (type === 'voice') return 'Voice Note';
  return 'Arrived';
}

const LiveTripPage: React.FC = () => {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [livePosition, setLivePosition] = useState<LivePosition | null>(null);
  const [currentCityId, setCurrentCityId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    ensureAnonymousAuth().then(() => setAuthReady(true)).catch((e) => {
      console.error('[LiveTripPage] anonymous auth failed:', e);
    });
  }, []);

  // Resolve tripId + owner status. Owners get their tripId from the persisted
  // Zustand snapshot. Family viewers who joined via /family/join/:code have
  // bb_family_tripId in localStorage. Anyone else (fresh share link, cleared
  // browser) starts with nothing and we fall back to a Firestore lookup once
  // anonymous auth lands — this is a 2-person app, there's only one trip.
  const initial = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('grand-tour-storage');
      const parsed = JSON.parse(raw || '{}');
      const ownerId = parsed?.state?.tripMeta?.id as string | undefined;
      const uid = parsed?.state?.currentUser?.uid as string | undefined;
      if (ownerId && uid) return { tripId: ownerId, isOwner: true };
      const familyId = localStorage.getItem('bb_family_tripId') || undefined;
      return { tripId: ownerId || familyId, isOwner: false };
    } catch {
      return { tripId: localStorage.getItem('bb_family_tripId') || undefined, isOwner: false };
    }
  }, []);
  const [tripId, setTripId] = useState<string | undefined>(initial.tripId);
  const isOwner = initial.isOwner;

  // Firestore fallback: any authenticated visitor without a known tripId can
  // discover the trip from the (single) trips/* collection.
  useEffect(() => {
    if (tripId || !authReady) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'trips'), limit(1)));
        if (!cancelled && !snap.empty) {
          const id = snap.docs[0].id;
          setTripId(id);
          localStorage.setItem('bb_family_tripId', id);
        }
      } catch (e) {
        console.warn('[LiveTripPage] trip lookup failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [tripId, authReady]);

  // Firestore listener
  useEffect(() => {
    if (!tripId || !authReady) return;
    const unsub = listenCollection(`trips/${tripId}/feed`, (docs) => {
      const items: FeedItem[] = docs
        .map((d) => ({ id: d.id, ...(d.data as Omit<FeedItem, 'id'>) } as FeedItem))
        .filter((item) => item.timestamp)
        .sort((a, b) => b.timestamp - a.timestamp);
      setFeed(items);

      // Latest stamp determines current city
      const latestStamp = items.find((i) => i.type === 'stamp' || i.type === 'arrival');
      if (latestStamp) setCurrentCityId(latestStamp.cityId);
    });
    return () => unsub();
  }, [tripId, authReady]);

  // Live position listener
  useEffect(() => {
    if (!tripId || !authReady) return;
    const unsub = listenDoc(`trips/${tripId}/livePosition`, (data) => {
      const pos = data as LivePosition;
      if (typeof pos?.lat === 'number' && typeof pos?.lng === 'number') {
        setLivePosition(pos);
      }
    });
    return () => unsub();
  }, [tripId, authReady]);

  // Derive visited city ids from feed
  const visitedIds = React.useMemo(() => {
    const ids = new Set<string>();
    feed.forEach((item) => {
      if (item.type === 'stamp' || item.type === 'arrival') ids.add(item.cityId);
    });
    return ids;
  }, [feed]);

  const currentCity = ITALIAN_CITIES.find((c) => c.id === currentCityId);

  const photoFeed = React.useMemo(
    () => feed.filter((f) => f.type === 'postcard' && !!f.imageUrl),
    [feed],
  );
  const textFeed = React.useMemo(
    () => feed.filter((f) => !(f.type === 'postcard' && f.imageUrl)),
    [feed],
  );
  const stats = React.useMemo(() => {
    const stamps = feed.filter((f) => f.type === 'stamp' || f.type === 'arrival').length;
    const postcards = feed.filter((f) => f.type === 'postcard').length;
    const cities = new Set(feed.map((f) => f.cityId)).size;
    return { stamps, postcards, cities };
  }, [feed]);
  const liveAgo = livePosition ? relativeTime(livePosition.timestamp) : null;

  // Anniversary-day vibe: May 6, 2026
  const isAnniversaryDay = React.useMemo(() => {
    const now = new Date();
    return now.getFullYear() === 2026 && now.getMonth() === 4 && now.getDate() === 6;
  }, []);

  const shareUrl = window.location.href;
  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-contain bg-[#f9f7f4] dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {isOwner && (
        <div
          className="px-4 max-w-xl mx-auto w-full"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <button
            onClick={() => navigate('/together')}
            className="inline-flex items-center gap-1 text-[#194f4c] dark:text-teal-300 hover:opacity-80 text-xs font-bold uppercase tracking-wider"
          >
            <span aria-hidden>←</span> Back to your trip
          </button>
        </div>
      )}
      {/* Header */}
      <header
        className="px-4 pb-4 text-center"
        style={{ paddingTop: isOwner ? '24px' : 'calc(env(safe-area-inset-top, 0px) + 24px)' }}
      >
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-serif text-3xl sm:text-4xl text-[#194f4c] dark:text-teal-300 tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          The Grand Tour
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-1 text-sm sm:text-base text-[#ac3d29] dark:text-orange-400 font-medium tracking-widest uppercase"
        >
          Live from Italy
        </motion.p>
        {currentCity && (
          <motion.div
            key={currentCity.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3 inline-flex items-center gap-2 bg-[#194f4c] text-white text-xs sm:text-sm px-4 py-1.5 rounded-full shadow"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            Currently in {currentCity.location}
          </motion.div>
        )}
        {liveAgo && (
          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
            Live position updated {liveAgo}
          </p>
        )}
      </header>

      {/* Anniversary banner — only on May 6, 2026 */}
      {isAnniversaryDay && (
        <div className="mx-auto max-w-xl w-full px-4 mb-2">
          <div className="rounded-2xl px-4 py-3 text-center bg-gradient-to-r from-[#ac3d29] via-[#d97757] to-[#ac3d29] text-white shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-90">
              Today, May 6
            </p>
            <p className="font-serif text-base sm:text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              🥂 Twenty years. Cin cin to Haris &amp; Maja.
            </p>
          </div>
        </div>
      )}

      {/* Stats banner */}
      <div className="mx-auto max-w-xl w-full px-4 mb-3">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <StatTile value={tripDayLabel().replace(' of 8', '/8')} label="Day" />
          <StatTile value={String(stats.cities)} label="Cities" />
          <StatTile value={String(stats.stamps)} label="Stamps" />
          <StatTile value={String(stats.postcards)} label="Photos" />
        </div>
      </div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6 }}
      >
        <LiveMap
          visitedIds={visitedIds}
          currentCityId={currentCityId}
          livePosition={livePosition}
        />
      </motion.div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#194f4c] inline-block" /> Visited
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> Upcoming
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#194f4c] border-2 border-[#ac3d29] inline-block" /> Here now
        </span>
      </div>

      {/* Photo wall */}
      {photoFeed.length > 0 && (
        <section className="max-w-xl mx-auto w-full px-4 pb-2">
          <h2
            className="font-serif text-lg text-[#194f4c] dark:text-teal-300 mt-4 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Photos from the road
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {photoFeed.map((item, i) => {
              const city = ITALIAN_CITIES.find((c) => c.id === item.cityId);
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.3 }}
                  onClick={() => setLightboxUrl(item.imageUrl!)}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 group"
                >
                  <img
                    src={item.imageUrl!}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-[10px] text-white/80 font-medium">{relativeTime(item.timestamp)}</p>
                    <p className="text-xs text-white font-bold truncate">{city?.location || item.cityId}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <button
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4"
          aria-label="Close photo"
        >
          <img src={lightboxUrl} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
        </button>
      )}

      {/* Feed */}
      <section className="flex-1 max-w-xl mx-auto w-full px-4 pb-6">
        <h2
          className="font-serif text-lg text-[#194f4c] dark:text-teal-300 mt-4 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Updates
        </h2>

        {feed.length === 0 && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-10">
            {tripId ? 'No updates yet — check back soon.' : 'Trip data not found.'}
          </p>
        )}

        <div className="space-y-3">
          {textFeed.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <div className="flex gap-3 p-3 items-start">
                <div className="text-2xl leading-none mt-0.5 shrink-0" aria-hidden>
                  {typeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#ac3d29] dark:text-orange-400">
                      {typeLabel(item.type)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                      {relativeTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 font-medium text-sm text-gray-800 dark:text-gray-200 leading-snug">
                    {item.title}
                  </p>
                  {item.detail && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {item.detail}
                    </p>
                  )}
                  {item.audioData && (
                    <audio src={item.audioData} controls className="w-full h-9 mt-2" />
                  )}
                </div>
              </div>
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full object-cover"
                  style={{ maxHeight: 260 }}
                  loading="lazy"
                />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Family interactions — lazy + boundary so any failure here can't blank /live */}
      {tripId && (
        <ErrorBoundary
          label="FamilyInteractions"
          fallback={
            <div className="max-w-xl mx-auto w-full px-4 pb-2 text-center text-xs text-slate-400">
              Notes panel unavailable.
            </div>
          }
        >
          <React.Suspense fallback={null}>
            <FamilyInteractions tripId={tripId} authReady={authReady} />
          </React.Suspense>
        </ErrorBoundary>
      )}

      {/* Share */}
      <footer className="max-w-xl mx-auto w-full px-4 pb-10">
        <div className="rounded-2xl border border-dashed border-[#194f4c]/40 dark:border-teal-700/40 p-4 text-center">
          <p
            className="font-serif text-sm text-[#194f4c] dark:text-teal-300 mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Share this journey
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 break-all mb-3">{shareUrl}</p>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 bg-[#194f4c] hover:bg-[#15403d] text-white text-xs font-medium px-5 py-2 rounded-full transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LiveTripPage;
