
export interface Location {
  lat: number;
  lng: number;
  heading?: number;
  timestamp: number;
}

export interface WeatherInfo {
  temp: string;
  condition: string;
  icon: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'partlyCloudy';
  description: string;
}

export interface PartnerSync {
  enabled: boolean;
  syncCode?: string;
  partnerLocation?: Location;
}

export interface GroundingChunk {
  maps?: {
    uri?: string;
    title?: string;
    // SDK structure differs by version; keep broad typing for compatibility.
    placeAnswerSources?: any;
  };
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  grounding?: GroundingChunk[];
}

export interface SavedPOI {
  id: string;
  cityId: string;
  title: string;
  uri: string;
  lat?: number;
  lng?: number;
  description?: string;
  timestamp: number;
  openingHours?: string;
  phone?: string;
  website?: string;
  rating?: string;
  reviews?: string[];
  isEnriching?: boolean;
  notes?: string;
  photoUrl?: string;
}

export interface PlannedStop {
  title: string;
  uri: string;
  type: 'sight' | 'restaurant' | 'hotel';
  lat: number;
  lng: number;
  image?: string;
  duration?: string;
  badge?: string;
}

export interface TripSegment {
  id: string;
  title: string;
  location: string;
  description: string;
  milestone: string;
  image: string;
  itineraryContext: string;
  mapUrl: string;
  center: { lat: number, lng: number };
  zoom: number;
  plannedStops: PlannedStop[];
  driveFromPrev?: string; // Driving time from previous day's end point, e.g. "1h 30m"
  parking?: string; // Parking/ZTL warning for this day
}

export interface ChecklistItem {
  id: string;
  label: string;
  category: 'documents' | 'clothing' | 'tech' | 'toiletries' | 'misc';
  checked: boolean;
}

export interface AudioPostcard {
  id: string;
  cityId: string;
  audioData: string; // base64 encoded audio
  duration: number; // seconds
  timestamp: number;
  label?: string;
}

// Leaflet Interface Definitions
export interface LeafletMap {
  setView: (center: [number, number], zoom: number) => LeafletMap;
  remove: () => void;
  removeLayer: (layer: any) => LeafletMap;
  invalidateSize: () => void;
  closePopup: () => void;
}

export interface LeafletLayer {
  addTo: (target: LeafletMap | LeafletLayerGroup) => this;
  remove: () => this;
}

export interface LeafletLayerGroup extends LeafletLayer {
  clearLayers: () => this;
  addLayer: (layer: LeafletLayer) => this;
}

export interface LeafletMarker extends LeafletLayer {
  on: (event: string, handler: () => void) => this;
  bindPopup: (content: string) => this;
}

export interface LeafletPolyline extends LeafletLayer {}

export interface LeafletTileLayer extends LeafletLayer {}

export interface LeafletDivIcon {}

export type MapInstance = LeafletMap;
export type LayerGroup = LeafletLayerGroup;
export type Marker = LeafletMarker;
export type Polyline = LeafletPolyline;
export type TileLayer = LeafletTileLayer;
export type DivIcon = LeafletDivIcon;