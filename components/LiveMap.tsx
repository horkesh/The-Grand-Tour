import React, { useEffect, useRef } from 'react';
import { ITALIAN_CITIES } from '../constants';

interface BoundaryProps { children: React.ReactNode }
interface BoundaryState { hasError: boolean }
/** Catches render-time errors so a Leaflet hiccup doesn't blank the page. */
class MapErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  declare props: BoundaryProps;
  declare state: BoundaryState;
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): BoundaryState { return { hasError: true }; }
  componentDidCatch(err: unknown) { console.warn('[LiveMap] render error:', err); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-500" style={{ height: 220 }}>
          Map unavailable
        </div>
      );
    }
    return this.props.children;
  }
}

export interface LivePosition {
  lat: number;
  lng: number;
  heading?: number | null;
  timestamp: number;
}

interface Props {
  visitedIds: Set<string>;
  currentCityId: string | null;
  livePosition: LivePosition | null;
  /** CSS height value (e.g. '55vw', '300px'). Defaults to '55vw' with min 260 / max 480. */
  heightStyle?: React.CSSProperties;
}

/**
 * Shared Leaflet route-and-pin map. Used by /live and inside Family Hub so
 * both audiences see the same dashed route, visited cities, and pulsing
 * "currently here" dot. Leaflet is loaded via CDN in index.html.
 */
const LiveMapInner: React.FC<Props> = ({ visitedIds, currentCityId, livePosition, heightStyle }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const liveMarkerRef = useRef<any>(null);
  const cityMarkersRef = useRef<any[]>([]); // track city markers separately so we can clear ONLY those

  // Initialize once. Wrap Leaflet calls so a failure can't crash the React tree.
  useEffect(() => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false })
        .setView([42.5, 12.5], 6);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '',
        maxZoom: 19,
      }).addTo(map);

      const coords = ITALIAN_CITIES.map((c) => [c.center.lat, c.center.lng] as [number, number]);
      L.polyline(coords, { color: '#194f4c', weight: 3, opacity: 0.7, dashArray: '6 4' }).addTo(map);

      mapInstanceRef.current = map;
      return () => {
        try { map.remove(); } catch { /* ignore */ }
        mapInstanceRef.current = null;
        liveMarkerRef.current = null;
        cityMarkersRef.current = [];
      };
    } catch (e) {
      console.warn('[LiveMap] init failed:', e);
    }
  }, []);

  // Re-render city markers when visited / current changes. Only touch the
  // city markers we tracked — leave the live-position pin alone, otherwise
  // every feed update wipes it and it never comes back.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L) return;
    try {
      cityMarkersRef.current.forEach((m) => {
        try { map.removeLayer(m); } catch { /* ignore */ }
      });
      cityMarkersRef.current = [];

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
        cityMarkersRef.current.push(marker);
      });
    } catch (e) {
      console.warn('[LiveMap] markers failed:', e);
    }
  }, [visitedIds, currentCityId]);

  // Pulsing live-position marker, separate so it survives city re-renders
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L || !livePosition) return;
    try {
      if (liveMarkerRef.current) {
        liveMarkerRef.current.setLatLng([livePosition.lat, livePosition.lng]);
      } else {
        const icon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:28px;height:28px">
              <div style="position:absolute;inset:0;border-radius:50%;background:rgba(172,61,41,0.3);animation:gtour-live-ping 1.6s ease-out infinite"></div>
              <div style="position:absolute;top:8px;left:8px;width:12px;height:12px;border-radius:50%;background:#ac3d29;border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.4)"></div>
            </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker([livePosition.lat, livePosition.lng], { icon, zIndexOffset: 1000 });
        marker.bindPopup('<strong>Currently here</strong>');
        marker.addTo(map);
        liveMarkerRef.current = marker;
      }
    } catch (e) {
      console.warn('[LiveMap] live marker failed:', e);
    }
  }, [livePosition]);

  return (
    <div
      className="w-full"
      style={heightStyle ?? { height: '55vw', minHeight: 260, maxHeight: 480 }}
    >
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

const LiveMap: React.FC<Props> = (props) => (
  <MapErrorBoundary>
    <LiveMapInner {...props} />
  </MapErrorBoundary>
);

export default LiveMap;
