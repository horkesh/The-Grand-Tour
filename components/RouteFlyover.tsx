import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ITALIAN_CITIES, ANNIVERSARY_DAY_ID } from '../constants';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || '';

// Cinematic camera settings per city — bearing rotates for variety
const CAMERA_PRESETS = [
  { pitch: 65, bearing: -20, zoom: 13.5 },   // Day 1: Rome arrival — looking north
  { pitch: 60, bearing: 30, zoom: 13 },       // Day 2: Bagnoregio — looking east over valley
  { pitch: 70, bearing: -45, zoom: 12.5 },    // Day 3: San Gimignano — towers from southwest
  { pitch: 60, bearing: 60, zoom: 12 },       // Day 4: Val d'Orcia — wide rolling hills
  { pitch: 55, bearing: 0, zoom: 14 },        // Day 5: Saturnia — thermal springs close-up
  { pitch: 65, bearing: -30, zoom: 13 },      // Day 6: Spello — hillside approach
  { pitch: 60, bearing: 45, zoom: 12.5 },     // Day 7: Via Appia — looking northeast
  { pitch: 70, bearing: -60, zoom: 13 },      // Day 8: Ostia — coastal departure
];

const RouteFlyover: React.FC = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [currentStop, setCurrentStop] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'outdoors'>('satellite');
  const cancelRef = useRef(false);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/outdoors-v12',
      center: [12.5, 42.5],
      zoom: 5.5,
      pitch: 45,
      bearing: 0,
      antialias: true,
      projection: 'globe',
    });

    m.on('style.load', () => {
      // Add 3D terrain
      m.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      m.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // Atmosphere/sky for globe view
      m.setFog({
        color: 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(11, 11, 25)',
        'star-intensity': 0.6,
      });
    });

    map.current = m;

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      m.remove();
      map.current = null;
    };
  }, [mapStyle]);

  const addMarker = useCallback((index: number) => {
    if (!map.current) return;
    const city = ITALIAN_CITIES[index];
    const isAnniversary = city.id === ANNIVERSARY_DAY_ID;

    const el = document.createElement('div');
    el.className = 'flyover-marker';
    el.innerHTML = `
      <div style="
        width: 44px; height: 44px;
        background: ${isAnniversary ? '#ac3d29' : '#194f4c'};
        color: white;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-weight: bold; font-size: 16px; font-family: 'Playfair Display', serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        border: 3px solid white;
        transform: scale(0);
        animation: markerPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      ">${isAnniversary ? '❤️' : index + 1}</div>
    `;

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([city.center.lng, city.center.lat])
      .addTo(map.current);

    markersRef.current.push(marker);
  }, []);

  const drawRoute = useCallback((upToIndex: number) => {
    if (!map.current) return;
    const sourceId = 'route-line';

    const coords = ITALIAN_CITIES.slice(0, upToIndex + 1).map(c => [c.center.lng, c.center.lat]);
    if (coords.length < 2) return;

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords },
    };

    if (map.current.getSource(sourceId)) {
      (map.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      map.current.addSource(sourceId, { type: 'geojson', data: geojson });
      map.current.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#194f4c',
          'line-width': 4,
          'line-opacity': 0.8,
          'line-dasharray': [2, 1],
        },
      });
    }
  }, []);

  const flyToCity = useCallback(
    (index: number): Promise<void> => {
      return new Promise((resolve) => {
        if (!map.current || index >= ITALIAN_CITIES.length || cancelRef.current) {
          resolve();
          return;
        }

        const city = ITALIAN_CITIES[index];
        const camera = CAMERA_PRESETS[index] || { pitch: 60, bearing: 0, zoom: 13 };

        setCurrentStop(index);
        addMarker(index);
        drawRoute(index);

        map.current.flyTo({
          center: [city.center.lng, city.center.lat],
          zoom: camera.zoom,
          pitch: camera.pitch,
          bearing: camera.bearing,
          duration: 4000,
          essential: true,
          curve: 1.5,
        });

        // Wait for fly animation + dwell time
        setTimeout(() => {
          if (!cancelRef.current) {
            // Gentle orbit while dwelling
            if (map.current) {
              map.current.easeTo({
                bearing: camera.bearing + 25,
                duration: 2500,
                easing: (t) => t,
              });
            }
          }
          setTimeout(resolve, 3000);
        }, 4000);
      });
    },
    [addMarker, drawRoute],
  );

  const startFlyover = useCallback(async () => {
    if (isPlaying || !map.current) return;
    setIsPlaying(true);
    cancelRef.current = false;

    // Clear previous
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (map.current.getLayer('route-line-layer')) map.current.removeLayer('route-line-layer');
    if (map.current.getSource('route-line')) map.current.removeSource('route-line');

    // Zoom out to show Italy first
    map.current.flyTo({
      center: [12.5, 42.5],
      zoom: 5.5,
      pitch: 45,
      bearing: 0,
      duration: 2000,
    });
    await new Promise(r => setTimeout(r, 2500));

    for (let i = 0; i < ITALIAN_CITIES.length; i++) {
      if (cancelRef.current) break;
      await flyToCity(i);
    }

    // Final zoom out
    if (map.current && !cancelRef.current) {
      map.current.flyTo({
        center: [12.5, 42.2],
        zoom: 6.5,
        pitch: 50,
        bearing: -15,
        duration: 3000,
      });
    }

    setIsPlaying(false);
  }, [isPlaying, flyToCity]);

  const stopFlyover = useCallback(() => {
    cancelRef.current = true;
    setIsPlaying(false);
    setCurrentStop(-1);
  }, []);

  const city = currentStop >= 0 ? ITALIAN_CITIES[currentStop] : null;
  const isAnniversary = city?.id === ANNIVERSARY_DAY_ID;

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#f9f7f4] dark:bg-black p-6">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-4">🗺️</p>
          <h2 className="font-serif text-2xl font-bold mb-2">Mapbox Token Required</h2>
          <p className="text-sm text-slate-500">Add MAPBOX_TOKEN to your .env.local to enable the 3D flyover.</p>
          <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-[#194f4c] text-white rounded-full text-sm font-bold">
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full"
    >
      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* Marker animation style */}
      <style>{`
        @keyframes markerPop {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      `}</style>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/60 via-black/30 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-white drop-shadow-lg">Route Flyover</h2>
            <p className="text-white/60 text-xs uppercase tracking-widest">
              {isPlaying
                ? `Day ${currentStop + 1} of 8 · ${city?.location || ''}`
                : '8 days across Italy · 3D terrain view'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMapStyle(s => s === 'satellite' ? 'outdoors' : 'satellite')}
              className="px-4 py-2 bg-white/15 backdrop-blur-xl text-white text-xs font-bold rounded-full border border-white/20 hover:bg-white/25 transition-colors"
            >
              {mapStyle === 'satellite' ? '🗺️ Map' : '🛰️ Satellite'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-white/15 backdrop-blur-xl text-white text-xs font-bold rounded-full border border-white/20 hover:bg-white/25 transition-colors"
            >
              Back to Map
            </button>
          </div>
        </div>
      </div>

      {/* City info card */}
      <AnimatePresence mode="wait">
        {city && (
          <motion.div
            key={currentStop}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute bottom-28 left-6 right-6 z-10 max-w-md"
          >
            <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-xl border ${
              isAnniversary
                ? 'bg-[#ac3d29]/90 border-[#ac3d29]/50 text-white'
                : 'bg-white/90 dark:bg-black/80 border-white/30 dark:border-white/10'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 shadow-lg ${
                  isAnniversary
                    ? 'bg-white/20 text-white'
                    : 'bg-[#194f4c] text-white'
                }`}>
                  {isAnniversary ? '❤️' : currentStop + 1}
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${
                    isAnniversary ? 'text-white/70' : 'text-[#ac3d29]'
                  }`}>
                    {isAnniversary ? 'Anniversary Day' : `Day ${currentStop + 1}`}
                  </p>
                  <h3 className={`font-serif text-xl font-bold ${
                    isAnniversary ? 'text-white' : 'text-slate-900 dark:text-white'
                  }`}>
                    {city.location}
                  </h3>
                  <p className={`text-xs mt-1 ${
                    isAnniversary ? 'text-white/60' : 'text-slate-400'
                  }`}>
                    {city.plannedStops.length} stops · {city.driveFromPrev || 'Starting point'}
                  </p>
                </div>
              </div>
              <p className={`font-serif text-sm italic mt-3 ${
                isAnniversary ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
              }`}>
                "{city.milestone}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress dots */}
      <div className="absolute bottom-[4.5rem] left-0 right-0 z-10 flex justify-center gap-2">
        {ITALIAN_CITIES.map((c, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-500 ${
              i <= currentStop
                ? c.id === ANNIVERSARY_DAY_ID
                  ? 'bg-[#ac3d29] w-3 h-3'
                  : 'bg-[#194f4c] w-3 h-3'
                : 'bg-white/30 w-2 h-2'
            }`}
          />
        ))}
      </div>

      {/* Control button */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-3">
        <button
          onClick={isPlaying ? stopFlyover : startFlyover}
          className={`px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest shadow-2xl transition-all backdrop-blur-xl border ${
            isPlaying
              ? 'bg-white/20 text-white border-white/30 hover:bg-white/30'
              : 'bg-[#194f4c] text-white border-[#194f4c] hover:scale-105 hover:shadow-[0_0_40px_rgba(25,79,76,0.4)]'
          }`}
        >
          {isPlaying ? 'Stop Flyover' : 'Start 3D Flyover'}
        </button>
      </div>
    </motion.div>
  );
};

export default RouteFlyover;
