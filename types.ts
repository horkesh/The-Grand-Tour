
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
}

export interface PlannedStop {
  title: string;
  uri: string;
  type: 'sight' | 'restaurant' | 'hotel';
  lat: number;
  lng: number;
}

export interface TravelTime {
  from: string;
  to: string;
  duration: string;
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
}
