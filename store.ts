import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SavedPOI, Location, WeatherInfo, ChatMessage, ChecklistItem, AudioPostcard, TripUser, TripMeta } from './types';
import { ITALIAN_CITIES } from './constants';
import { setImage as idbSetImage, getAllImages, addPostcardEntry, getAllPostcards } from './services/imageDB';
import {
  listenCollection, listenDoc, writeDoc, removeDoc,
  teardownSync, isSyncing, setSyncing, isSyncInitialized, markSyncInitialized,
} from './services/firestoreSync';

// Module-level guard so live-position writes throttle correctly across renders.
let lastLivePositionWriteAt = 0;

// Helper: get Firestore base path for the current trip
function tripPath(): string | null {
  const meta = useStore.getState().tripMeta;
  return meta ? `trips/${meta.id}` : null;
}

// Helper: write to Firestore if syncing is available and not an echo
function syncWrite(subpath: string, data: Record<string, unknown>) {
  const base = tripPath();
  if (base && !isSyncing()) {
    writeDoc(`${base}/${subpath}`, data).catch(e => console.warn('[sync] write failed:', e));
  }
}

function syncRemove(subpath: string) {
  const base = tripPath();
  if (base && !isSyncing()) {
    removeDoc(`${base}/${subpath}`).catch(e => console.warn('[sync] remove failed:', e));
  }
}

// DayDashboard stamps/postcards using a composite key like "day-1_2"
// (city id + stop index). Resolve back to the actual city + stop so the
// family feed shows real names instead of "Stamp collected: day-1_1".
function resolveCityKey(key: string): { city?: typeof ITALIAN_CITIES[number]; stop?: typeof ITALIAN_CITIES[number]['plannedStops'][number] } {
  const direct = ITALIAN_CITIES.find((c) => c.id === key);
  if (direct) return { city: direct };
  const m = key.match(/^(.*)_(\d+)$/);
  if (!m) return {};
  const city = ITALIAN_CITIES.find((c) => c.id === m[1]);
  const stop = city?.plannedStops?.[Number(m[2])];
  return { city, stop };
}

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

  shareLivePosition: boolean;
  toggleShareLivePosition: () => void;

  sendVoiceUpdate: (audioDataUrl: string, durationSec: number) => void;

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
  imagesHydrated: boolean;
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

  wishlistNotes: Record<string, string>;
  setWishlistNote: (poiId: string, note: string) => void;

  learnedPhrases: string[];
  toggleLearnedPhrase: (id: string) => void;

  // Collaborative state
  currentUser: TripUser | null;
  setCurrentUser: (user: TripUser) => void;
  tripMeta: TripMeta | null;
  setTripMeta: (meta: TripMeta) => void;
  partnerUser: TripUser | null;
  setPartnerUser: (user: TripUser | null) => void;

  // Sync
  initSync: () => void;
  destroySync: () => void;
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
      setUserLocation: (loc) => {
        set({ userLocation: loc });
        // Stream debounced position to Firestore so /live can show a pulsing pin.
        // Throttle to once every 30s to spare battery and write quota.
        const state = useStore.getState();
        if (!state.shareLivePosition) return;
        const last = lastLivePositionWriteAt;
        if (last && Date.now() - last < 30_000) return;
        lastLivePositionWriteAt = Date.now();
        // Doc path must have an even number of segments — nest under /current.
        syncWrite('livePosition/current', {
          lat: loc.lat,
          lng: loc.lng,
          heading: loc.heading ?? null,
          timestamp: loc.timestamp,
        });
      },

      shareLivePosition: true,
      toggleShareLivePosition: () => set((s) => ({ shareLivePosition: !s.shareLivePosition })),

      sendVoiceUpdate: (audioDataUrl, durationSec) => {
        const state = useStore.getState();
        const senderName = state.currentUser?.displayName?.split(' ')[0] || 'Traveler';
        const cityId = state.lastViewedDay || 'live';
        const city = ITALIAN_CITIES.find((c) => c.id === cityId);
        const feedId = `voice-${Date.now()}`;
        syncWrite(`feed/${feedId}`, {
          type: 'voice',
          cityId,
          title: `Voice note from ${senderName}${city ? ` — ${city.location}` : ''}`,
          audioData: audioDataUrl,
          audioDuration: durationSec,
          timestamp: Date.now(),
        });
      },

      savedPOIs: [],
      addSavedPOI: (poi) => {
        set((state) => ({ savedPOIs: [...state.savedPOIs, poi] }));
        syncWrite(`pois/${poi.id}`, poi as unknown as Record<string, unknown>);
      },
      removeSavedPOI: (id) => {
        set((state) => ({ savedPOIs: state.savedPOIs.filter((p) => p.id !== id) }));
        syncRemove(`pois/${id}`);
      },
      updateSavedPOINote: (id, note) => {
        set((state) => ({
          savedPOIs: state.savedPOIs.map((p) => (p.id === id ? { ...p, notes: note } : p)),
        }));
        syncWrite(`pois/${id}`, { notes: note });
      },
      updateSavedPOIPhoto: (id, photoUrl) => {
        set((state) => ({
          savedPOIs: state.savedPOIs.map((p) => (p.id === id ? { ...p, photoUrl } : p)),
        }));
        syncWrite(`pois/${id}`, { photoUrl });
      },

      stamps: [],
      addStamp: (cityId) => {
        set((state) => ({ stamps: Array.from(new Set([...state.stamps, cityId])) }));
        const uid = useStore.getState().currentUser?.uid;
        if (uid) syncWrite(`stamps/${cityId}`, { [uid]: Date.now() });
        // Auto-publish feed item for family/friends
        const feedId = `stamp-${cityId}-${Date.now()}`;
        const { city, stop } = resolveCityKey(cityId);
        const title = stop && city
          ? `Stamped ${stop.title} in ${city.location}`
          : city
            ? `Arrived in ${city.location}!`
            : 'New stamp on the trip';
        syncWrite(`feed/${feedId}`, {
          type: 'stamp',
          cityId,
          title,
          detail: stop?.title ? city?.milestone || '' : city?.milestone || '',
          imageUrl: stop?.image || city?.image || '',
          timestamp: Date.now(),
        });
      },

      postcards: {},
      addPostcard: (cityId, url) => {
        // Postcards live in IndexedDB now (was localStorage, blew the 5 MB
        // quota on iOS Safari with a few full-quality data URLs). State still
        // mirrors them for fast render — but we don't persist this slice.
        addPostcardEntry(cityId, url).catch((e) => console.warn('[postcardDB] write failed:', e));
        set((state) => ({
          postcards: {
            ...state.postcards,
            [cityId]: [...(state.postcards[cityId] || []), url]
          }
        }));
        // Auto-publish feed item for family/friends
        const feedId = `postcard-${cityId}-${Date.now()}`;
        const { city, stop } = resolveCityKey(cityId);
        // Skip oversized data URLs in the feed item to stay under Firestore's
        // 1 MB doc limit. https URLs are tiny and embed cleanly.
        const safeImageUrl = url.length < 600_000 ? url : '';
        const title = stop && city
          ? `New postcard from ${stop.title}, ${city.location}`
          : `New postcard from ${city?.location || 'the trip'}`;
        syncWrite(`feed/${feedId}`, {
          type: 'postcard',
          cityId,
          title,
          imageUrl: safeImageUrl,
          timestamp: Date.now(),
        });
      },

      waypointImages: {},
      imagesHydrated: false,
      setWaypointImage: (key, data) => {
        idbSetImage(key, data).catch((e) => console.error('[imageDB] write failed:', e));
        set((state) => ({
          waypointImages: { ...state.waypointImages, [key]: data }
        }));
      },
      hydrateImages: async () => {
        try {
          const [images, pcsFromIdb] = await Promise.all([
            getAllImages(),
            getAllPostcards().catch(() => ({} as Record<string, string[]>)),
          ]);

          // One-time migration: if IDB has no postcards but the previous
          // localStorage-persisted state has some, push them to IDB so the
          // user doesn't lose their existing memories on this deploy.
          const fromLocalStorage = useStore.getState().postcards;
          const idbEmpty = Object.keys(pcsFromIdb).length === 0;
          const hasLegacy = Object.keys(fromLocalStorage).length > 0;
          let pcs = pcsFromIdb;
          if (idbEmpty && hasLegacy) {
            for (const [cityId, urls] of Object.entries(fromLocalStorage)) {
              for (const url of urls) {
                try { await addPostcardEntry(cityId, url); } catch (e) { console.warn('[postcardDB] migrate failed:', e); }
              }
            }
            pcs = await getAllPostcards().catch(() => fromLocalStorage);
          }

          set({ waypointImages: images, postcards: pcs, imagesHydrated: true });
        } catch (e) {
          console.error('[imageDB] hydrate failed:', e);
          set({ imagesHydrated: true });
        }
      },

      weatherData: {},
      setWeatherData: (data) => set({ weatherData: data }),
      updateCityWeather: (cityId, info) =>
        set((state) => ({ weatherData: { ...state.weatherData, [cityId]: info } })),

      hasSeenTripComplete: false,
      setHasSeenTripComplete: () => set({ hasSeenTripComplete: true }),

      chatMessages: [],
      addChatMessage: (msg) => {
        set((state) => {
          const updated = [...state.chatMessages, msg];
          return { chatMessages: updated.length > 50 ? updated.slice(-50) : updated };
        });
        const { grounding: _, ...msgWithoutGrounding } = msg;
        syncWrite(`chat/${msg.id}`, { ...msgWithoutGrounding, timestamp: msg.timestamp || Date.now() } as unknown as Record<string, unknown>);
      },
      clearChatMessages: () => set({ chatMessages: [] }),

      checklist: [],
      setChecklist: (items) => set({ checklist: items }),
      toggleChecklistItem: (id) => {
        set((state) => ({
          checklist: state.checklist.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item,
          ),
        }));
        const item = useStore.getState().checklist.find(i => i.id === id);
        if (item) syncWrite(`checklist/${id}`, item as unknown as Record<string, unknown>);
      },
      addChecklistItem: (item) => {
        set((state) => ({ checklist: [...state.checklist, item] }));
        syncWrite(`checklist/${item.id}`, item as unknown as Record<string, unknown>);
      },
      removeChecklistItem: (id) => {
        set((state) => ({ checklist: state.checklist.filter((i) => i.id !== id) }));
        syncRemove(`checklist/${id}`);
      },

      audioPostcards: [],
      addAudioPostcard: (ap) => set((state) => ({ audioPostcards: [...state.audioPostcards, ap] })),
      removeAudioPostcard: (id) =>
        set((state) => ({ audioPostcards: state.audioPostcards.filter((a) => a.id !== id) })),

      wishlistNotes: {},
      setWishlistNote: (poiId, note) => {
        set((state) => ({ wishlistNotes: { ...state.wishlistNotes, [poiId]: note } }));
        syncWrite(`wishlistNotes/${poiId}`, { note });
      },

      learnedPhrases: [],
      toggleLearnedPhrase: (id) =>
        set((state) => ({
          learnedPhrases: state.learnedPhrases.includes(id)
            ? state.learnedPhrases.filter((p) => p !== id)
            : [...state.learnedPhrases, id],
        })),

      // Collaborative state
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      tripMeta: null,
      setTripMeta: (meta) => set({ tripMeta: meta }),
      partnerUser: null,
      setPartnerUser: (user) => set({ partnerUser: user }),

      // Sync
      initSync: () => {
        // Idempotency: don't set up duplicate listeners
        if (isSyncInitialized()) return;

        const state = useStore.getState();
        const tripId = state.tripMeta?.id;
        if (!tripId) return;

        // Tear down any stale listeners before setting up new ones
        teardownSync();
        markSyncInitialized();

        const basePath = `trips/${tripId}`;

        // Listen for stamps
        listenCollection(`${basePath}/stamps`, (docs) => {
          setSyncing(true);
          set({ stamps: docs.map(d => d.id) });
          setSyncing(false);
        });

        // Listen for POIs
        listenCollection(`${basePath}/pois`, (docs) => {
          setSyncing(true);
          set({ savedPOIs: docs.map(d => ({ ...d.data, id: d.id })) as SavedPOI[] });
          setSyncing(false);
        });

        // Listen for checklist
        listenCollection(`${basePath}/checklist`, (docs) => {
          setSyncing(true);
          set({ checklist: docs.map(d => ({ ...d.data, id: d.id })) as ChecklistItem[] });
          setSyncing(false);
        });

        // Listen for chat messages
        listenCollection(`${basePath}/chat`, (docs) => {
          setSyncing(true);
          const msgs = docs
            .map(d => ({ ...d.data, id: d.id }))
            .sort((a, b) => ((a as any).timestamp || 0) - ((b as any).timestamp || 0)) as ChatMessage[];
          set({ chatMessages: msgs });
          setSyncing(false);
        });

        // Postcards used to live in trips/{id}/postcardIndex but the doc
        // overflowed Firestore's 1 MB limit fast — they're now in IndexedDB
        // per device. Listener removed; cross-device postcard sync would
        // need a per-postcard sub-collection if we add it back.

        // Listen for partner user info
        const partnerUid = state.tripMeta?.partnerIds.find(id => id !== state.currentUser?.uid);
        if (partnerUid) {
          listenDoc(`${basePath}/users/${partnerUid}`, (data) => {
            set({ partnerUser: data as TripUser });
          });
        }
      },

      destroySync: () => {
        teardownSync();
      },
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
        // postcards: intentionally NOT persisted to localStorage — they're
        // base64 data URLs that overflow Safari's 5 MB quota. Stored in
        // IndexedDB via imageDB and re-hydrated by hydrateImages().
        weatherData: state.weatherData,
        hasSeenTripComplete: state.hasSeenTripComplete,
        chatMessages: state.chatMessages.map(({ grounding, ...rest }) => rest),
        checklist: state.checklist,
        audioPostcards: state.audioPostcards,
        wishlistNotes: state.wishlistNotes,
        learnedPhrases: state.learnedPhrases,
        shareLivePosition: state.shareLivePosition,
        currentUser: state.currentUser,
        tripMeta: state.tripMeta,
      }),
    }
  )
);
