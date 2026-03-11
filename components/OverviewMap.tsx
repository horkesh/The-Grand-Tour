import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ITALIAN_CITIES } from '../constants';
import { useStore } from '../store';
import { useLeaflet } from '../hooks/useLeaflet';
import { MapInstance, LayerGroup, TileLayer } from '../types';

const OverviewMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const contentLayerRef = useRef<LayerGroup | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  
  const navigate = useNavigate();
  const { theme, userLocation } = useStore();
  
  const { 
    initMap, 
    removeMap, 
    createLayerGroup, 
    createTileLayer, 
    createMarker, 
    createDivIcon, 
    createPolyline 
  } = useLeaflet(mapContainerRef);

  useEffect(() => {
    const map = initMap([42.8, 12.0], 7);
    if (map) {
      mapInstanceRef.current = map;
      contentLayerRef.current = createLayerGroup(map);
    }

    return () => {
      removeMap();
      mapInstanceRef.current = null;
    };
  }, [initMap, removeMap, createLayerGroup]);

  // Handle tile layer updates independently to react to theme changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = createTileLayer(theme, mapInstanceRef.current);
  }, [theme, createTileLayer]);

  useEffect(() => {
    if (!mapInstanceRef.current || !contentLayerRef.current) return;
    const layer = contentLayerRef.current;
    layer.clearLayers();

    const routeCoords = ITALIAN_CITIES.map(city => [city.center.lat, city.center.lng] as [number, number]);
    
    const polyline = createPolyline(routeCoords, { 
      color: theme === 'dark' ? '#10b981' : '#ac3d29', 
      weight: 2, 
      dashArray: '5, 10', 
      opacity: 0.4 
    });
    polyline.addTo(layer);

    ITALIAN_CITIES.forEach((city, idx) => {
      const markerIcon = createDivIcon({
        html: `<div class="marker-visual radar-pulse bg-white dark:bg-slate-900 text-[#194f4c] dark:text-emerald-400 w-8 h-8 rounded-full shadow-2xl border-2 border-[#194f4c] dark:border-emerald-500 flex items-center justify-center font-bold text-xs cursor-pointer transition-transform duration-300 hover:scale-125">${idx + 1}</div>`,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      createMarker(city.center.lat, city.center.lng, { icon: markerIcon })
        .addTo(layer)
        .on('click', () => navigate(`/day/${city.id}`));
    });

    if (userLocation) {
      const userIcon = createDivIcon({
        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-ping"></div>`,
        className: 'custom-div-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      createMarker(userLocation.lat, userLocation.lng, { icon: userIcon }).addTo(layer);
    }
  }, [theme, userLocation, navigate, createPolyline, createDivIcon, createMarker]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full" />
      <style>{`
        .custom-div-icon { background: none !important; border: none !important; }
        @keyframes radar {
          0% { box-shadow: 0 0 0 0 rgba(172, 61, 41, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(172, 61, 41, 0); }
          100% { box-shadow: 0 0 0 0 rgba(172, 61, 41, 0); }
        }
        .radar-pulse { animation: radar 3s infinite ease-out; }
      `}</style>
    </div>
  );
};

export default OverviewMap;
