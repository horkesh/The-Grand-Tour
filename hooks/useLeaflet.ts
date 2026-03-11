import React, { useRef, useCallback } from 'react';
import { MapInstance, LayerGroup, Marker, Polyline, TileLayer, DivIcon } from '../types';

// Declare L global only here
declare var L: any;

export const useLeaflet = (containerRef: React.RefObject<HTMLDivElement>) => {
  const mapRef = useRef<MapInstance | null>(null);

  const initMap = useCallback((center: [number, number], zoom: number) => {
    if (!containerRef.current || !L || mapRef.current) return null;
    
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
    }).setView(center, zoom);
    
    mapRef.current = map;
    return map as MapInstance;
  }, [containerRef]);

  const removeMap = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, []);

  const createLayerGroup = useCallback((map: MapInstance): LayerGroup => {
    return L.layerGroup().addTo(map);
  }, []);

  const createTileLayer = useCallback((theme: 'light' | 'dark', map: MapInstance): TileLayer => {
    const url = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    return L.tileLayer(url).addTo(map);
  }, []);

  const createMarker = useCallback((lat: number, lng: number, options: any): Marker => {
    return L.marker([lat, lng], options);
  }, []);

  const createDivIcon = useCallback((options: any): DivIcon => {
    return L.divIcon(options);
  }, []);

  const createPolyline = useCallback((coords: [number, number][], options: any): Polyline => {
    return L.polyline(coords, options);
  }, []);

  const addZoomControl = useCallback((map: MapInstance) => {
     L.control.zoom({ position: 'bottomright' }).addTo(map);
  }, []);

  return {
    mapRef,
    initMap,
    removeMap,
    createLayerGroup,
    createTileLayer,
    createMarker,
    createDivIcon,
    createPolyline,
    addZoomControl
  };
};
