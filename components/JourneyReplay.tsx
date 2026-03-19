import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ITALIAN_CITIES } from '../constants';
import { useStore } from '../store';

declare const L: any;

interface JourneyReplayProps {
  open: boolean;
  onClose: () => void;
}

const JourneyReplay: React.FC<JourneyReplayProps> = ({ open, onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const { stamps, postcards } = useStore();
  const [currentDay, setCurrentDay] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;

    // Small delay to let the DOM render
    const initTimer = setTimeout(() => {
      if (!mapRef.current || mapInstance.current) return;

      const map = L.map(mapRef.current, {
        center: [42.5, 12.5],
        zoom: 7,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapInstance.current = map;
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [open]);

  const replay = useCallback(async () => {
    if (!mapInstance.current || isPlaying) return;
    setIsPlaying(true);

    const allCoords = ITALIAN_CITIES.map((c) => [c.center.lat, c.center.lng] as [number, number]);

    for (let i = 0; i < ITALIAN_CITIES.length; i++) {
      const city = ITALIAN_CITIES[i];
      setCurrentDay(i);

      // Fly to city
      mapInstance.current.flyTo([city.center.lat, city.center.lng], city.zoom, {
        duration: 1.5,
      });

      // Wait for fly animation
      await new Promise((r) => (timeoutRef.current = setTimeout(r, 1800)));

      // Add day marker
      const isStamped = stamps.includes(city.id);
      const hasPhotos = Object.keys(postcards).some(
        (k) => k === city.id || k.startsWith(`${city.id}_`),
      );

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:40px;height:40px;
          background:${isStamped ? '#194f4c' : '#64748b'};
          color:white;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-weight:bold;font-size:14px;
          box-shadow:0 0 20px ${isStamped ? 'rgba(25,79,76,0.5)' : 'rgba(0,0,0,0.3)'};
          border:3px solid ${isStamped ? '#10b981' : '#94a3b8'};
          transition:all 0.3s;
        ">${i + 1}${hasPhotos ? '<span style="position:absolute;top:-4px;right:-4px;font-size:12px;">📸</span>' : ''}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker([city.center.lat, city.center.lng], { icon }).addTo(mapInstance.current);

      // Draw polyline from previous
      if (i > 0) {
        const prev = ITALIAN_CITIES[i - 1];
        L.polyline(
          [
            [prev.center.lat, prev.center.lng],
            [city.center.lat, city.center.lng],
          ],
          {
            color: isStamped ? '#10b981' : '#475569',
            weight: 3,
            opacity: 0.7,
            dashArray: isStamped ? undefined : '6 6',
          },
        ).addTo(mapInstance.current);
      }

      // Dwell at each city
      await new Promise((r) => (timeoutRef.current = setTimeout(r, 2500)));
    }

    // Final overview
    mapInstance.current.flyTo([42.5, 12.2], 7, { duration: 2 });
    setCurrentDay(-1);
    setIsPlaying(false);
  }, [isPlaying, stamps, postcards]);

  if (!open) return null;

  const city = currentDay >= 0 ? ITALIAN_CITIES[currentDay] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black"
    >
      <div ref={mapRef} className="absolute inset-0" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-white">Replay Our Journey</h2>
            <p className="text-white/40 text-xs uppercase tracking-widest">
              {isPlaying ? `Day ${currentDay + 1} of 8` : 'Our 8-day Italian adventure'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white border border-white/20"
          >
            ✕
          </button>
        </div>
      </div>

      {/* City info overlay */}
      <AnimatePresence>
        {city && (
          <motion.div
            key={currentDay}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-32 left-6 z-10 max-w-sm"
          >
            <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
              <p className="text-[#ac3d29] text-[10px] font-bold uppercase tracking-widest mb-1">
                Day {currentDay + 1}
              </p>
              <h3 className="font-serif text-2xl font-bold text-white">{city.location}</h3>
              <p className="text-white/50 text-xs mt-2 line-clamp-2">
                {city.milestone}
              </p>
              <div className="flex gap-3 mt-3 text-[10px] uppercase tracking-wider">
                {stamps.includes(city.id) && (
                  <span className="text-emerald-400 font-bold">✓ Stamped</span>
                )}
                {city.plannedStops.length > 0 && (
                  <span className="text-white/30">{city.plannedStops.length} stops</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play button */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex flex-col items-center gap-3">
        {/* Progress bar */}
        <div className="flex gap-1.5">
          {ITALIAN_CITIES.map((_, i) => (
            <div
              key={i}
              className={`w-8 h-1 rounded-full transition-all ${
                i <= currentDay ? 'bg-emerald-400' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        <button
          onClick={replay}
          disabled={isPlaying}
          className={`px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest shadow-2xl transition-all ${
            isPlaying
              ? 'bg-white/10 text-white/50 cursor-wait'
              : 'bg-white text-[#194f4c] hover:scale-105'
          }`}
        >
          {isPlaying ? 'Replaying...' : 'Replay Journey'}
        </button>
      </div>
    </motion.div>
  );
};

export default JourneyReplay;
