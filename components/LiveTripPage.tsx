import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ITALIAN_CITIES } from '../constants';
import { listenCollection } from '../services/firestoreSync';
import { ensureAnonymousAuth } from '../services/anonymousAuth';

interface FeedItem {
  id: string;
  type: 'stamp' | 'postcard' | 'arrival';
  cityId: string;
  title: string;
  detail?: string;
  imageUrl?: string;
  timestamp: number;
}

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
  return '✈️';
}

function typeLabel(type: FeedItem['type']): string {
  if (type === 'stamp') return 'Passport Stamp';
  if (type === 'postcard') return 'Postcard';
  return 'Arrived';
}

const LiveTripPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [currentCityId, setCurrentCityId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    ensureAnonymousAuth().then(() => setAuthReady(true)).catch((e) => {
      console.error('[LiveTripPage] anonymous auth failed:', e);
    });
  }, []);

  // Resolve tripId from localStorage (same key as Zustand persist)
  const tripId = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('grand-tour-storage');
      const parsed = JSON.parse(raw || '{}');
      return parsed?.state?.tripMeta?.id as string | undefined;
    } catch {
      return undefined;
    }
  }, []);

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

  // Derive visited city ids from feed
  const visitedIds = React.useMemo(() => {
    const ids = new Set<string>();
    feed.forEach((item) => {
      if (item.type === 'stamp' || item.type === 'arrival') ids.add(item.cityId);
    });
    return ids;
  }, [feed]);

  // Build Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    if (mapInstanceRef.current) return; // already initialised

    const map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false })
      .setView([42.5, 12.5], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '',
      maxZoom: 19,
    }).addTo(map);

    // Route polyline
    const coords = ITALIAN_CITIES.map((c) => [c.center.lat, c.center.lng] as [number, number]);
    L.polyline(coords, { color: '#194f4c', weight: 3, opacity: 0.7, dashArray: '6 4' }).addTo(map);

    // City markers
    ITALIAN_CITIES.forEach((city) => {
      const visited = visitedIds.has(city.id);
      const isCurrent = city.id === currentCityId;
      const color = visited ? '#194f4c' : '#9ca3af';
      const size = isCurrent ? 18 : 12;
      const border = isCurrent ? `3px solid #ac3d29` : `2px solid white`;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker([city.center.lat, city.center.lng], { icon });
      marker.bindPopup(`<strong>${city.title}</strong><br><small>${city.location}</small>`);
      marker.addTo(map);
    });

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once; markers updated below

  // Update markers when visited set changes (re-render markers layer)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    // Remove old markers and re-add with correct colours
    map.eachLayer((layer: any) => {
      if (layer.options?.icon) map.removeLayer(layer);
    });

    ITALIAN_CITIES.forEach((city) => {
      const visited = visitedIds.has(city.id);
      const isCurrent = city.id === currentCityId;
      const color = visited ? '#194f4c' : '#9ca3af';
      const size = isCurrent ? 18 : 12;
      const border = isCurrent ? `3px solid #ac3d29` : `2px solid white`;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker([city.center.lat, city.center.lng], { icon });
      marker.bindPopup(`<strong>${city.title}</strong><br><small>${city.location}</small>`);
      marker.addTo(map);
    });
  }, [visitedIds, currentCityId]);

  const currentCity = ITALIAN_CITIES.find((c) => c.id === currentCityId);

  const shareUrl = window.location.href;
  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-contain bg-[#f9f7f4] dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Header */}
      <header className="px-4 pt-8 pb-4 text-center">
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
      </header>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.6 }}
        className="w-full"
        style={{ height: '55vw', minHeight: 260, maxHeight: 480 }}
      >
        <div ref={mapRef} className="w-full h-full" />
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
          {feed.map((item, i) => (
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
