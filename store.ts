import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SavedPOI, Location, WeatherInfo } from './types';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  userLocation?: Location;
  setUserLocation: (loc: Location) => void;

  savedPOIs: SavedPOI[];
  addSavedPOI: (poi: SavedPOI) => void;
  removeSavedPOI: (id: string) => void;
  updateSavedPOINote: (id: string, note: string) => void;

  stamps: string[];
  addStamp: (cityId: string) => void;

  postcards: Record<string, string[]>;
  addPostcard: (cityId: string, url: string) => void;

  // Cache for AI generated images of locations
  waypointImages: Record<string, string>;
  setWaypointImage: (key: string, url: string) => void;

  weatherData: Record<string, WeatherInfo>;
  setWeatherData: (data: Record<string, WeatherInfo>) => void;
  updateCityWeather: (cityId: string, info: WeatherInfo) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),

      userLocation: undefined,
      setUserLocation: (loc) => set({ userLocation: loc }),

      savedPOIs: [],
      addSavedPOI: (poi) => set((state) => ({ savedPOIs: [...state.savedPOIs, poi] })),
      removeSavedPOI: (id) => set((state) => ({ savedPOIs: state.savedPOIs.filter((p) => p.id !== id) })),
      updateSavedPOINote: (id, note) =>
        set((state) => ({
          savedPOIs: state.savedPOIs.map((p) => (p.id === id ? { ...p, notes: note } : p)),
        })),

      stamps: [],
      addStamp: (cityId) => set((state) => ({ stamps: Array.from(new Set([...state.stamps, cityId])) })),

      postcards: {},
      addPostcard: (cityId, url) => set((state) => ({ 
        postcards: { 
          ...state.postcards, 
          [cityId]: [...(state.postcards[cityId] || []), url] 
        } 
      })),

      waypointImages: {},
      setWaypointImage: (key, url) => set((state) => ({ 
        waypointImages: { ...state.waypointImages, [key]: url } 
      })),

      weatherData: {},
      setWeatherData: (data) => set({ weatherData: data }),
      updateCityWeather: (cityId, info) =>
        set((state) => ({ weatherData: { ...state.weatherData, [cityId]: info } })),
    }),
    {
      name: 'grand-tour-storage',
      partialize: (state) => ({
        theme: state.theme,
        savedPOIs: state.savedPOIs,
        stamps: state.stamps,
        postcards: state.postcards,
        waypointImages: state.waypointImages,
      }),
    }
  )
);