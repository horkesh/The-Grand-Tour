import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ITALIAN_CITIES } from '../constants';

declare const L: any;

const RouteFlyover: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const [currentStop, setCurrentStop] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [42.5, 12.5],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      map.remove();
      mapInstance.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  const flyToCity = useCallback(
    (index: number): Promise<void> => {
      return new Promise((resolve) => {
        if (!mapInstance.current || index >= ITALIAN_CITIES.length) {
          resolve();
          return;
        }

        const city = ITALIAN_CITIES[index];
        setCurrentStop(index);

        mapInstance.current.flyTo([city.center.lat, city.center.lng], city.zoom, {
          duration: 2,
          easeLinearity: 0.25,
        });

        const icon = L.divIcon({
          className: '',
          html: `<div style="width:36px;height:36px;background:#194f4c;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;">${index + 1}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        L.marker([city.center.lat, city.center.lng], { icon }).addTo(layerGroupRef.current);

        if (index > 0) {
          const prev = ITALIAN_CITIES[index - 1];
          L.polyline(
            [
              [prev.center.lat, prev.center.lng],
              [city.center.lat, city.center.lng],
            ],
            { color: '#194f4c', weight: 3, opacity: 0.6, dashArray: '8 8' },
          ).addTo(layerGroupRef.current);
        }

        timeoutRef.current = setTimeout(resolve, 3000);
      });
    },
    [],
  );

  const startFlyover = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);

    // Clear previous markers/polylines
    if (layerGroupRef.current) layerGroupRef.current.clearLayers();

    for (let i = 0; i < ITALIAN_CITIES.length; i++) {
      await flyToCity(i);
    }

    if (mapInstance.current) {
      mapInstance.current.flyTo([42.5, 12.5], 7, { duration: 2 });
    }

    setIsPlaying(false);
    setCurrentStop(-1);
  }, [isPlaying, flyToCity]);

  const city = currentStop >= 0 ? ITALIAN_CITIES[currentStop] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full"
    >
      <div ref={mapRef} className="absolute inset-0 z-0" />

      <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-white">Route Flyover</h2>
            <p className="text-white/50 text-xs uppercase tracking-widest">
              {isPlaying
                ? `Flying to Day ${currentStop + 1} of 8`
                : '8 days across Italy'}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-white/20 backdrop-blur-xl text-white text-xs font-bold rounded-full border border-white/30"
          >
            Back to Map
          </button>
        </div>
      </div>

      {city && (
        <motion.div
          key={currentStop}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-24 left-6 right-6 z-10 max-w-md"
        >
          <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#194f4c] rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                {currentStop + 1}
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#ac3d29] uppercase tracking-widest">
                  Day {currentStop + 1}
                </p>
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                  {city.location}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{city.plannedStops.length} stops</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center">
        <button
          onClick={startFlyover}
          disabled={isPlaying}
          className={`px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest shadow-2xl transition-all ${
            isPlaying
              ? 'bg-slate-300 text-slate-500 cursor-wait'
              : 'bg-[#194f4c] text-white hover:scale-105'
          }`}
        >
          {isPlaying ? `Flying... Day ${currentStop + 1}/8` : 'Start Flyover'}
        </button>
      </div>

      <div className="absolute bottom-16 left-0 right-0 z-10 flex justify-center gap-2">
        {ITALIAN_CITIES.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i <= currentStop ? 'bg-[#194f4c]' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default RouteFlyover;
