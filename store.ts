import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SavedPOI, Location, WeatherInfo, ChatMessage, ChecklistItem, AudioPostcard } from './types';
import { setImage as idbSetImage, getAllImages } from './services/imageDB';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  hasSeenWelcome: boolean;
  setHasSeenWelcome: () => void;
  hasFlippedCard: boolean;
  setHasFlippedCard: () => void;
  lastViewedDay: string;
  setLastViewedDay: (cityId: string) => void;

  userLocation?: Location;
  setUserLocation: (loc: Location) => void;

  savedPOIs: SavedPOI[];
  addSavedPOI: (poi: SavedPOI) => void;
  removeSavedPOI: (id: string) => void;
  updateSavedPOINote: (id: string, note: string) => void;
  updateSavedPOIPhoto: (id: string, photoUrl: string) => void;

  stamps: string[];
  addStamp: (cityId: string) => void;

  postcards: Record<string, string[]>;
  addPostcard: (cityId: string, url: string) => void;

  // Cache for AI generated images of locations (stored in IndexedDB, not localStorage)
  waypointImages: Record<string, string>;
  setWaypointImage: (key: string, data: string) => void;
  hydrateImages: () => Promise<void>;

  weatherData: Record<string, WeatherInfo>;
  setWeatherData: (data: Record<string, WeatherInfo>) => void;
  updateCityWeather: (cityId: string, info: WeatherInfo) => void;

  hasSeenTripComplete: boolean;
  setHasSeenTripComplete: () => void;

  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChatMessages: () => void;

  checklist: ChecklistItem[];
  setChecklist: (items: ChecklistItem[]) => void;
  toggleChecklistItem: (id: string) => void;
  addChecklistItem: (item: ChecklistItem) => void;
  removeChecklistItem: (id: string) => void;

  audioPostcards: AudioPostcard[];
  addAudioPostcard: (ap: AudioPostcard) => void;
  removeAudioPostcard: (id: string) => void;

  wishlistNotes: Record<string, string>; // poiId → note
  setWishlistNote: (poiId: string, note: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),

      hasSeenWelcome: false,
      setHasSeenWelcome: () => set({ hasSeenWelcome: true }),
      hasFlippedCard: false,
      setHasFlippedCard: () => set({ hasFlippedCard: true }),
      lastViewedDay: 'day-1',
      setLastViewedDay: (cityId) => set((state) => state.lastViewedDay === cityId ? state : { lastViewedDay: cityId }),

      userLocation: undefined,
      setUserLocation: (loc) => set({ userLocation: loc }),

      savedPOIs: [],
      addSavedPOI: (poi) => set((state) => ({ savedPOIs: [...state.savedPOIs, poi] })),
      removeSavedPOI: (id) => set((state) => ({ savedPOIs: state.savedPOIs.filter((p) => p.id !== id) })),
      updateSavedPOINote: (id, note) =>
        set((state) => ({
          savedPOIs: state.savedPOIs.map((p) => (p.id === id ? { ...p, notes: note } : p)),
        })),
      updateSavedPOIPhoto: (id, photoUrl) =>
        set((state) => ({
          savedPOIs: state.savedPOIs.map((p) => (p.id === id ? { ...p, photoUrl } : p)),
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
      setWaypointImage: (key, data) => {
        idbSetImage(key, data).catch((e) => console.error('[imageDB] write failed:', e));
        set((state) => ({
          waypointImages: { ...state.waypointImages, [key]: data }
        }));
      },
      hydrateImages: async () => {
        try {
          const images = await getAllImages();
          set({ waypointImages: images });
        } catch (e) {
          console.error('[imageDB] hydrate failed:', e);
        }
      },

      weatherData: {},
      setWeatherData: (data) => set({ weatherData: data }),
      updateCityWeather: (cityId, info) =>
        set((state) => ({ weatherData: { ...state.weatherData, [cityId]: info } })),

      hasSeenTripComplete: false,
      setHasSeenTripComplete: () => set({ hasSeenTripComplete: true }),

      chatMessages: [],
      addChatMessage: (msg) => set((state) => {
        const updated = [...state.chatMessages, msg];
        return { chatMessages: updated.length > 50 ? updated.slice(-50) : updated };
      }),
      clearChatMessages: () => set({ chatMessages: [] }),

      checklist: [],
      setChecklist: (items) => set({ checklist: items }),
      toggleChecklistItem: (id) =>
        set((state) => ({
          checklist: state.checklist.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item,
          ),
        })),
      addChecklistItem: (item) => set((state) => ({ checklist: [...state.checklist, item] })),
      removeChecklistItem: (id) =>
        set((state) => ({ checklist: state.checklist.filter((i) => i.id !== id) })),

      audioPostcards: [],
      addAudioPostcard: (ap) => set((state) => ({ audioPostcards: [...state.audioPostcards, ap] })),
      removeAudioPostcard: (id) =>
        set((state) => ({ audioPostcards: state.audioPostcards.filter((a) => a.id !== id) })),

      wishlistNotes: {},
      setWishlistNote: (poiId, note) =>
        set((state) => ({ wishlistNotes: { ...state.wishlistNotes, [poiId]: note } })),
    }),
    {
      name: 'grand-tour-storage',
      partialize: (state) => ({
        theme: state.theme,
        hasSeenWelcome: state.hasSeenWelcome,
        hasFlippedCard: state.hasFlippedCard,
        lastViewedDay: state.lastViewedDay,
        savedPOIs: state.savedPOIs,
        stamps: state.stamps,
        postcards: state.postcards,
        weatherData: state.weatherData,
        hasSeenTripComplete: state.hasSeenTripComplete,
        chatMessages: state.chatMessages.map(({ grounding, ...rest }) => rest),
        checklist: state.checklist,
        audioPostcards: state.audioPostcards,
        wishlistNotes: state.wishlistNotes,
      }),
    }
  )
);