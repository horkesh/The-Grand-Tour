
import React, { useEffect, useRef, useState } from 'react';
import { SavedPOI, TripSegment, PlannedStop, TravelTime, Location, WeatherInfo } from '../types';
import { Icons } from '../constants';

declare var L: any;

interface ItineraryMapOverlayProps {
  city: TripSegment;
  savedPOIs: SavedPOI[];
  onClose: () => void;
  onRemovePOI: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  theme?: 'light' | 'dark';
  userLocation?: Location;
}

const ItineraryMapOverlay: React.FC<ItineraryMapOverlayProps> = ({ 
  city, 
  savedPOIs, 
  onClose, 
  onRemovePOI, 
  onUpdateNotes, 
  theme = 'light',
  userLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  
  const [editingPOI, setEditingPOI] = useState<SavedPOI | null>(null);
  const [tempNote, setTempNote] = useState('');

  const saveEditedNote = () => {
    if (editingPOI) {
      onUpdateNotes(editingPOI.id, tempNote);
      setEditingPOI(null);
    }
  };

  useEffect(() => {
    (window as any).handleEditNote = (poiId: string) => {
      const poi = savedPOIs.find(p => p.id === poiId);
      if (poi) {
        setEditingPOI(poi);
        setTempNote(poi.notes || '');
        if (leafletMap.current) leafletMap.current.closePopup();
      }
    };
    return () => { delete (window as any).handleEditNote; };
  }, [savedPOIs]);

  useEffect(() => {
    if (!mapRef.current || !L || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
    }).setView([city.center.lat, city.center.lng], city.zoom);

    leafletMap.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [city.id]);

  // Reactive tile layer update
  useEffect(() => {
    if (!leafletMap.current) return;

    if (tileLayerRef.current) {
      leafletMap.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    ).addTo(leafletMap.current);
  }, [theme, city.id]);

  useEffect(() => {
    if (!leafletMap.current || !markersLayerRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    city.plannedStops.forEach((stop, idx) => {
      const icon = L.divIcon({
        html: `<div class="marker-visual marker-pulse-radar bg-[#194f4c] text-white w-9 h-9 rounded-full border-2 border-white flex items-center justify-center font-serif font-bold text-xs shadow-2xl">${idx + 1}</div>`,
        className: 'custom-div-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      L.marker([stop.lat, stop.lng], { icon }).addTo(layer).bindPopup(`<b>${stop.title}</b>`);
    });

    savedPOIs.filter(poi => poi.cityId === city.id).forEach(poi => {
      const icon = L.divIcon({
        html: `<div class="marker-visual poi-glow-effect bg-[#ac3d29] text-white w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg></div>`,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([poi.lat || city.center.lat, poi.lng || city.center.lng], { icon }).addTo(layer).bindPopup(`
        <div class="p-2">
          <b class="text-sm block mb-2 font-serif">${poi.title}</b>
          <button onclick="window.handleEditNote('${poi.id}')" class="text-[10px] text-[#ac3d29] font-bold hover:underline">Aggiungi Nota</button>
        </div>
      `);
    });
  }, [city.id, savedPOIs]);

  useEffect(() => {
    if (!leafletMap.current || !routeLayerRef.current) return;
    const layer = routeLayerRef.current;
    layer.clearLayers();

    for (let i = 0; i < city.plannedStops.length - 1; i++) {
      const coords = [
        [city.plannedStops[i].lat, city.plannedStops[i].lng],
        [city.plannedStops[i+1].lat, city.plannedStops[i+1].lng]
      ];
      L.polyline(coords, {
        color: theme === 'dark' ? '#10b981' : '#194f4c',
        weight: 5,
        opacity: 0.9,
        dashArray: '12, 18',
        className: 'marching-ants-path'
      }).addTo(layer);
    }
  }, [city.id, theme]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#194f4c]/90 dark:bg-black/95 backdrop-blur-xl flex flex-col pt-safe-top overflow-hidden">
      <div className="bg-white dark:bg-[#0a0a0a] w-full h-full flex flex-col lg:rounded-[3rem] lg:max-w-6xl lg:max-h-[90vh] lg:mx-auto lg:my-auto shadow-2xl relative">
        <div className="px-6 py-4 lg:p-8 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-4 shrink-0 bg-white dark:bg-[#0a0a0a] z-10">
          <h3 className="font-serif text-lg lg:text-3xl font-bold text-[#194f4c] dark:text-white truncate">{city.title}</h3>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 relative overflow-hidden bg-[#f9f7f4] dark:bg-black">
          <div ref={mapRef} className="w-full h-full" />
          {editingPOI && (
            <div className="absolute inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 lg:p-8 stagger-in">
                <h4 className="font-serif text-xl font-bold text-[#194f4c] dark:text-white mb-4">Nota Personale</h4>
                <textarea autoFocus value={tempNote} onChange={(e) => setTempNote(e.target.value)} className="w-full h-32 p-4 bg-slate-50 dark:bg-black rounded-2xl border-none outline-none text-sm mb-6 font-serif italic" />
                <div className="flex flex-col gap-2">
                  <button onClick={saveEditedNote} className="w-full py-3 bg-[#194f4c] text-white rounded-xl font-bold text-sm">Salva Nota</button>
                  <button onClick={() => setEditingPOI(null)} className="w-full py-3 text-slate-400 font-bold text-xs">Annulla</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .custom-div-icon { background: none !important; border: none !important; }
        .marching-ants-path { animation: travel-ants 2s linear infinite; }
        @keyframes travel-ants { to { stroke-dashoffset: -60; } }
        
        @keyframes radar-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 79, 76, 0.5); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(25, 79, 76, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 79, 76, 0); }
        }
        .marker-pulse-radar { animation: radar-pulse 2s infinite ease-out; }
        
        @keyframes poi-glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(172, 61, 41, 0.4); filter: brightness(1); }
          50% { box-shadow: 0 0 0 12px rgba(172, 61, 41, 0); filter: brightness(1.3); }
        }
        .poi-glow-effect { animation: poi-glow-pulse 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default ItineraryMapOverlay;
