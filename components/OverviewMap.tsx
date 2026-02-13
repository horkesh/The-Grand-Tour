
import React, { useEffect, useRef } from 'react';
import { TripSegment, Location } from '../types';

declare var L: any;

interface OverviewMapProps {
  cities: TripSegment[];
  onCitySelect: (city: TripSegment) => void;
  theme?: 'light' | 'dark';
  userLocation?: Location;
}

const OverviewMap: React.FC<OverviewMapProps> = ({ cities, onCitySelect, theme = 'light', userLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const contentLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !L || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true
    }).setView([42.8, 12.0], 7);

    leafletMap.current = map;
    contentLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Handle tile layer updates independently to react to theme changes
  useEffect(() => {
    if (!leafletMap.current) return;

    if (tileLayerRef.current) {
      leafletMap.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    ).addTo(leafletMap.current);
  }, [theme]);

  useEffect(() => {
    if (!leafletMap.current || !contentLayerRef.current) return;
    const layer = contentLayerRef.current;
    layer.clearLayers();

    const routeCoords = cities.map(city => [city.center.lat, city.center.lng]);
    L.polyline(routeCoords, { 
      color: theme === 'dark' ? '#10b981' : '#ac3d29', 
      weight: 2, 
      dashArray: '5, 10', 
      opacity: 0.4 
    }).addTo(layer);

    cities.forEach((city, idx) => {
      const markerIcon = L.divIcon({
        html: `<div class="marker-visual radar-pulse bg-white dark:bg-slate-900 text-[#194f4c] dark:text-emerald-400 w-8 h-8 rounded-full shadow-2xl border-2 border-[#194f4c] dark:border-emerald-500 flex items-center justify-center font-bold text-xs cursor-pointer transition-transform duration-300 hover:scale-125">${idx + 1}</div>`,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([city.center.lat, city.center.lng], { icon: markerIcon })
        .addTo(layer)
        .on('click', () => onCitySelect(city));
    });

    if (userLocation) {
      const userIcon = L.divIcon({
        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-ping"></div>`,
        className: 'custom-div-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(layer);
    }
  }, [cities, theme, userLocation]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />
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
