# Collaborative Firebase — The Grand Tour

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform The Grand Tour from a single-device PWA into a real-time collaborative trip companion for two partners, with Firebase Auth, Firestore sync, and 13 interlocking interactive features.

**Architecture:** Firebase Auth (Google Sign-In) identifies each partner. Firestore holds all shared trip state in a single `trips/{tripId}` document tree. A Zustand middleware layer bridges local state ↔ Firestore listeners, so every component "just works" through `useStore()` as before — but mutations now propagate in real-time to the partner's device. New collaborative features (voting, claiming, challenges, surprises) are layered on top of this shared foundation.

**Tech Stack:** Firebase Auth, Cloud Firestore, Firebase Storage (postcard images), Zustand middleware, React 19, TypeScript, existing Tailwind/Framer Motion UI.

---

## System Architecture

### Firestore Data Model

```
trips/{tripId}/
  ├─ meta          { title, createdAt, partnerIds: [uid1, uid2] }
  ├─ stamps/       { [cityId]: { uid1: timestamp|null, uid2: timestamp|null } }
  ├─ pois/         { [poiId]: SavedPOI & { addedBy, votes: { uid1?: 👍|👎, uid2?: 👍|👎 } } }
  ├─ postcards/    { [id]: { cityId, url, createdBy, caption?, partnerCaption?, timestamp } }
  ├─ checklist/    { [itemId]: ChecklistItem & { claimedBy?: uid, packedBy?: uid } }
  ├─ chat/         { [msgId]: ChatMessage & { sentBy } }
  ├─ wishlistNotes/{ [poiId]: { uid1Note?, uid2Note? } }
  ├─ reactions/    { [targetId]: { uid1?: emoji, uid2?: emoji } }
  ├─ preferences/  { [uid]: { categories: Record<string, 1-5> } }
  ├─ prompts/      { [promptId]: { text, day, responses: { uid1?: string, uid2?: string }, revealedAt? } }
  ├─ surprises/    { [id]: { createdBy, forDay, title, note, revealOnDay: boolean, revealed: boolean } }
  ├─ challenges/   { [id]: { title, description, completions: { uid1?: photoUrl, uid2?: photoUrl } } }
  ├─ trivia/       { [dayKey]: { question, answer, options[], scores: { uid1?: number, uid2?: number } } }
  └─ reveals/      { [tileId]: { unlockedBy: uid[], reactions: { uid1?: emoji, uid2?: emoji } } }
```

### Firebase Storage Structure

```
trips/{tripId}/
  ├─ postcards/{uuid}.jpg        — postcard images (replace data URLs)
  ├─ challenges/{uuid}.jpg       — photo challenge submissions
  └─ audio/{uuid}.webm           — audio postcards
```

### File Map

```
services/
  ├─ firebase.ts              — Firebase app init, auth, db, storage exports
  ├─ firebaseAuth.ts          — Google Sign-In, trip creation/joining, user state
  ├─ firestoreSync.ts         — Zustand ↔ Firestore bidirectional sync middleware
  └─ firebaseStorage.ts       — Upload/download images & audio to Firebase Storage

components/
  ├─ AuthGate.tsx             — Login screen + trip join/create flow (NEW)
  ├─ UserAvatar.tsx           — Tiny avatar chip showing partner initial + color (NEW)
  ├─ SharedWishlist.tsx        — Replaces Wishlist.tsx: voting, "both want this" badges
  ├─ CollabPacking.tsx         — Replaces PackingChecklist.tsx: claim items, dual progress
  ├─ SharedChat.tsx            — Replaces ChatInterface.tsx: shared thread, sender labels
  ├─ DualPassport.tsx          — Enhances Passaporto.tsx: side-by-side stamp progress
  ├─ CollabReveal.tsx          — Enhances DailyReveal.tsx: co-unlock, reactions
  ├─ SharedGallery.tsx         — Enhances Gallery.tsx: attribution, dual captions
  ├─ PreferenceMatch.tsx       — NEW: swipe/rank categories, show alignment (NEW)
  ├─ ConversationStarters.tsx  — NEW: daily prompts, simultaneous reveal (NEW)
  ├─ SurprisePlanner.tsx       — NEW: secret surprise scheduler (NEW)
  ├─ PhotoChallenges.tsx       — NEW: creative photo challenge cards (NEW)
  ├─ TriviaChallenge.tsx       — NEW: daily Italy trivia game (NEW)
  └─ PartnerSync.tsx           — RETIRED (replaced by Firebase real-time sync)

store.ts                       — Add: currentUser, tripId, partnerId, partnerName
types.ts                       — Add: collaborative type definitions
App.tsx                        — Wrap in AuthGate, add new routes
```

---

## Chunk 1: Firebase Foundation (Tasks 1–5)

### Task 1: Install Firebase & Create Config

**Files:**
- Modify: `package.json`
- Create: `services/firebase.ts`

- [ ] **Step 1: Install Firebase SDK**

```bash
npm install firebase
```

- [ ] **Step 2: Create Firebase config module**

Create `services/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
```

- [ ] **Step 3: Add env vars to `.env.local`**

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> **Note:** You must create a Firebase project at https://console.firebase.google.com first. Enable Authentication (Google provider), Cloud Firestore, and Storage.

- [ ] **Step 4: Verify build still passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json services/firebase.ts
git commit -m "feat: add Firebase SDK and config module"
```

---

### Task 2: Firebase Auth Service

**Files:**
- Create: `services/firebaseAuth.ts`
- Modify: `types.ts`

- [ ] **Step 1: Add collaborative types to `types.ts`**

Add after existing types:

```typescript
// === Collaborative Types ===

export interface TripUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  color: 'teal' | 'rust'; // first user = teal, partner = rust
}

export interface TripMeta {
  id: string;
  title: string;
  createdAt: number;
  createdBy: string;
  partnerIds: string[];
  joinCode: string; // 6-char alphanumeric for partner to join
}

export interface VoteRecord {
  [uid: string]: 'up' | 'down' | undefined;
}

export interface DualTimestamp {
  [uid: string]: number | null;
}

export interface DualResponse {
  [uid: string]: string | undefined;
}

export interface PhotoCompletion {
  [uid: string]: string | undefined; // photoUrl
}
```

- [ ] **Step 2: Create auth service**

Create `services/firebaseAuth.ts`:

```typescript
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { TripMeta, TripUser } from '../types';

// Generate a 6-char join code
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function signInWithGoogle(): Promise<User> {
  // Use redirect on mobile (popup blocked), popup on desktop
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  if (isMobile) {
    await signInWithRedirect(auth, googleProvider);
    const result = await getRedirectResult(auth);
    if (!result) throw new Error('Redirect sign-in failed');
    return result.user;
  } else {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }
}

export async function handleRedirectResult(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signOut() {
  await fbSignOut(auth);
}

export async function createTrip(user: User): Promise<TripMeta> {
  const tripRef = doc(collection(db, 'trips'));
  const joinCode = generateJoinCode();
  const meta: TripMeta = {
    id: tripRef.id,
    title: 'Our Grand Tour',
    createdAt: Date.now(),
    createdBy: user.uid,
    partnerIds: [user.uid],
    joinCode,
  };
  await setDoc(tripRef, { meta });

  // Store user profile in trip subcollection
  await setDoc(doc(db, 'trips', tripRef.id, 'users', user.uid), {
    uid: user.uid,
    displayName: user.displayName || 'Partner 1',
    email: user.email,
    photoURL: user.photoURL,
    color: 'teal',
    joinedAt: Date.now(),
  } satisfies TripUser & { joinedAt: number });

  return meta;
}

export async function joinTrip(user: User, joinCode: string): Promise<TripMeta> {
  // Find trip by join code
  const tripsRef = collection(db, 'trips');
  const q = query(tripsRef, where('meta.joinCode', '==', joinCode.toUpperCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) throw new Error('No trip found with that code');

  const tripDoc = snapshot.docs[0];
  const tripData = tripDoc.data();
  const meta = tripData.meta as TripMeta;

  if (meta.partnerIds.length >= 2 && !meta.partnerIds.includes(user.uid)) {
    throw new Error('This trip already has two partners');
  }

  if (!meta.partnerIds.includes(user.uid)) {
    // Add partner
    await updateDoc(tripDoc.ref, {
      'meta.partnerIds': arrayUnion(user.uid),
    });

    await setDoc(doc(db, 'trips', tripDoc.id, 'users', user.uid), {
      uid: user.uid,
      displayName: user.displayName || 'Partner 2',
      email: user.email,
      photoURL: user.photoURL,
      color: 'rust',
      joinedAt: Date.now(),
    } satisfies TripUser & { joinedAt: number });
  }

  return { ...meta, partnerIds: [...new Set([...meta.partnerIds, user.uid])] };
}

export async function getUserTrip(uid: string): Promise<TripMeta | null> {
  // Check if user already belongs to a trip
  const tripsRef = collection(db, 'trips');
  const q = query(tripsRef, where('meta.partnerIds', 'array-contains', uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data().meta as TripMeta;
}

export async function getPartnerInfo(tripId: string, partnerUid: string): Promise<TripUser | null> {
  const userDoc = await getDoc(doc(db, 'trips', tripId, 'users', partnerUid));
  if (!userDoc.exists()) return null;
  return userDoc.data() as TripUser;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add types.ts services/firebaseAuth.ts
git commit -m "feat: add Firebase auth service with trip create/join flow"
```

---

### Task 3: AuthGate Component

**Files:**
- Create: `components/AuthGate.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: Create AuthGate component**

Create `components/AuthGate.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import {
  signInWithGoogle,
  handleRedirectResult,
  onAuthChange,
  getUserTrip,
  createTrip,
  joinTrip,
} from '../services/firebaseAuth';
import { TripMeta } from '../types';
import { useStore } from '../store';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setCurrentUser, setTripMeta } = useStore();
  const [user, setUser] = useState<User | null>(null);
  const [trip, setTrip] = useState<TripMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'loading' | 'signIn' | 'joinOrCreate' | 'joinInput' | 'ready'>('loading');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  // Listen for auth state
  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        // Check for redirect result (mobile)
        await handleRedirectResult();
        // Check existing trip
        const existing = await getUserTrip(fbUser.uid);
        if (existing) {
          setTrip(existing);
          setCurrentUser({
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'Partner',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL,
            color: existing.createdBy === fbUser.uid ? 'teal' : 'rust',
          });
          setTripMeta(existing);
          setStep('ready');
        } else {
          setStep('joinOrCreate');
        }
      } else {
        setStep('signIn');
      }
      setLoading(false);
    });
    return unsub;
  }, [setCurrentUser, setTripMeta]);

  const handleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message || 'Sign-in failed');
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    setError('');
    try {
      const newTrip = await createTrip(user);
      setTrip(newTrip);
      setCurrentUser({
        uid: user.uid,
        displayName: user.displayName || 'Partner',
        email: user.email || '',
        photoURL: user.photoURL,
        color: 'teal',
      });
      setTripMeta(newTrip);
      setStep('ready');
    } catch (e: any) {
      setError(e.message || 'Could not create trip');
    }
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setError('');
    try {
      const joined = await joinTrip(user, joinCode.trim());
      setTrip(joined);
      setCurrentUser({
        uid: user.uid,
        displayName: user.displayName || 'Partner',
        email: user.email || '',
        photoURL: user.photoURL,
        color: 'rust',
      });
      setTripMeta(joined);
      setStep('ready');
    } catch (e: any) {
      setError(e.message || 'Could not join trip');
    }
  };

  if (step === 'ready') return <>{children}</>;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#194f4c] to-[#0d2f2d] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-2xl p-8 max-w-sm w-full text-center"
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold mb-2">May 2 – 9, 2026</p>
        <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white mb-2">Our Grand Tour</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">A trip for two across Italy</p>

        <AnimatePresence mode="wait">
          {step === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-8 h-8 border-2 border-[#194f4c] border-t-transparent rounded-full animate-spin mx-auto" />
            </motion.div>
          )}

          {step === 'signIn' && (
            <motion.div key="signin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <button
                onClick={handleSignIn}
                className="w-full py-4 bg-[#194f4c] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-[#163f3d] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google
              </button>
              <p className="text-[10px] text-slate-400">Sign in to sync your trip with your partner in real-time</p>
            </motion.div>
          )}

          {step === 'joinOrCreate' && (
            <motion.div key="choice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-xs text-slate-500 mb-4">Welcome, {user?.displayName?.split(' ')[0]}!</p>
              <button
                onClick={handleCreate}
                className="w-full p-4 bg-[#194f4c] text-white rounded-2xl font-bold text-sm hover:bg-[#163f3d] transition-colors"
              >
                Start a New Trip
              </button>
              <button
                onClick={() => setStep('joinInput')}
                className="w-full p-4 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                Join Partner's Trip
              </button>
            </motion.div>
          )}

          {step === 'joinInput' && (
            <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-xs text-slate-500 mb-2">Enter the 6-letter code your partner shared</p>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                className="w-full text-center text-2xl font-mono font-bold tracking-[0.5em] py-4 bg-slate-50 dark:bg-black rounded-2xl border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-[#194f4c]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length < 6}
                  className="flex-1 py-3 bg-[#194f4c] text-white rounded-xl font-bold text-sm disabled:opacity-50"
                >
                  Join Trip
                </button>
                <button onClick={() => setStep('joinOrCreate')} className="px-6 py-3 text-slate-400 font-bold text-xs">Back</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
      </motion.div>
    </div>
  );
};

export default AuthGate;
```

- [ ] **Step 2: Add user/trip state to store**

In `store.ts`, add to the `AppState` interface:

```typescript
// Collaborative state
currentUser: TripUser | null;
setCurrentUser: (user: TripUser) => void;
tripMeta: TripMeta | null;
setTripMeta: (meta: TripMeta) => void;
partnerUser: TripUser | null;
setPartnerUser: (user: TripUser | null) => void;
```

And in the store body:

```typescript
currentUser: null,
setCurrentUser: (user) => set({ currentUser: user }),
tripMeta: null,
setTripMeta: (meta) => set({ tripMeta: meta }),
partnerUser: null,
setPartnerUser: (user) => set({ partnerUser: user }),
```

Add to `partialize`:

```typescript
currentUser: state.currentUser,
tripMeta: state.tripMeta,
```

- [ ] **Step 3: Wrap App in AuthGate**

In `App.tsx`, wrap the `<Layout>` inside `<AuthGate>`:

```tsx
import AuthGate from './components/AuthGate';

// In the return:
<HashRouter>
  <AuthGate>
    <Layout>
      <AnimatedRoutes />
    </Layout>
  </AuthGate>
</HashRouter>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add components/AuthGate.tsx store.ts App.tsx
git commit -m "feat: add AuthGate with Google sign-in and trip create/join flow"
```

---

### Task 4: Firestore Sync Middleware

**Files:**
- Create: `services/firestoreSync.ts`
- Modify: `store.ts`

This is the critical piece — a Zustand middleware that:
1. On mount: subscribes to Firestore `trips/{tripId}` and populates local state
2. On local mutation: writes to Firestore
3. On remote change: updates local state (partner's actions appear in real-time)

- [ ] **Step 1: Create sync service**

Create `services/firestoreSync.ts`:

```typescript
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

type UnsubFn = Unsubscribe;

let activeListeners: UnsubFn[] = [];

export function teardownSync() {
  activeListeners.forEach((unsub) => unsub());
  activeListeners = [];
}

/**
 * Listen to a Firestore document and call onChange whenever it updates.
 * Returns an unsubscribe function.
 */
export function listenDoc(
  path: string,
  onChange: (data: any) => void
): UnsubFn {
  const unsub = onSnapshot(doc(db, path), (snap) => {
    if (snap.exists()) onChange(snap.data());
  });
  activeListeners.push(unsub);
  return unsub;
}

/**
 * Listen to a Firestore collection and call onChange with the full array.
 */
export function listenCollection(
  path: string,
  onChange: (docs: Array<{ id: string; data: any }>) => void
): UnsubFn {
  const unsub = onSnapshot(collection(db, path), (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    onChange(docs);
  });
  activeListeners.push(unsub);
  return unsub;
}

/**
 * Write a document (merge by default).
 */
export async function writeDoc(path: string, data: any) {
  await setDoc(doc(db, path), data, { merge: true });
}

/**
 * Update specific fields on a document.
 */
export async function patchDoc(path: string, data: any) {
  await updateDoc(doc(db, path), data);
}

/**
 * Delete a document.
 */
export async function removeDoc(path: string) {
  await deleteDoc(doc(db, path));
}

/**
 * Batch write multiple documents.
 */
export async function batchWrite(ops: Array<{ path: string; data: any; op: 'set' | 'update' | 'delete' }>) {
  const batch = writeBatch(db);
  for (const { path, data, op } of ops) {
    const ref = doc(db, path);
    if (op === 'set') batch.set(ref, data, { merge: true });
    else if (op === 'update') batch.update(ref, data);
    else if (op === 'delete') batch.delete(ref);
  }
  await batch.commit();
}
```

- [ ] **Step 2: Add sync initialization to store**

Add a `initSync` action to the store that sets up Firestore listeners when the user is authenticated and has a trip. This connects the existing Zustand actions to Firestore writes, and listens for remote changes.

In `store.ts`, add:

```typescript
import { listenDoc, listenCollection, writeDoc, patchDoc, removeDoc, teardownSync } from './services/firestoreSync';

// Add to AppState interface:
initSync: () => void;
destroySync: () => void;
_isSyncing: boolean; // guard against echo writes

// Add to store body:
_isSyncing: false,

initSync: () => {
  const state = useStore.getState();
  const tripId = state.tripMeta?.id;
  if (!tripId) return;

  const basePath = `trips/${tripId}`;

  // Listen for stamps
  listenCollection(`${basePath}/stamps`, (docs) => {
    set({ _isSyncing: true });
    const stamps = docs.map(d => d.id);
    set({ stamps, _isSyncing: false });
  });

  // Listen for POIs
  listenCollection(`${basePath}/pois`, (docs) => {
    set({ _isSyncing: true });
    const pois = docs.map(d => ({ ...d.data, id: d.id })) as SavedPOI[];
    set({ savedPOIs: pois, _isSyncing: false });
  });

  // Listen for checklist
  listenCollection(`${basePath}/checklist`, (docs) => {
    set({ _isSyncing: true });
    const items = docs.map(d => ({ ...d.data, id: d.id })) as ChecklistItem[];
    set({ checklist: items, _isSyncing: false });
  });

  // Listen for chat messages
  listenCollection(`${basePath}/chat`, (docs) => {
    set({ _isSyncing: true });
    const msgs = docs
      .map(d => ({ ...d.data, id: d.id }))
      .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0)) as ChatMessage[];
    set({ chatMessages: msgs, _isSyncing: false });
  });

  // Listen for postcards
  listenDoc(`${basePath}/postcardIndex`, (data) => {
    set({ _isSyncing: true });
    set({ postcards: data?.postcards || {}, _isSyncing: false });
  });

  // Listen for partner user info
  const partnerUid = state.tripMeta?.partnerIds.find(id => id !== state.currentUser?.uid);
  if (partnerUid) {
    listenDoc(`${basePath}/users/${partnerUid}`, (data) => {
      if (data) set({ partnerUser: data as TripUser });
    });
  }
},

destroySync: () => {
  teardownSync();
},
```

- [ ] **Step 3: Wrap mutating actions to also write to Firestore**

Modify each existing mutating action so that if `tripMeta` exists and `_isSyncing` is false, it also writes to Firestore. For example, `addStamp`:

```typescript
addStamp: (cityId) => {
  set((state) => ({ stamps: Array.from(new Set([...state.stamps, cityId])) }));
  const { tripMeta, _isSyncing, currentUser } = useStore.getState();
  if (tripMeta && !_isSyncing) {
    writeDoc(`trips/${tripMeta.id}/stamps/${cityId}`, {
      [`${currentUser?.uid}`]: Date.now(),
    });
  }
},
```

Apply same pattern to: `addSavedPOI`, `removeSavedPOI`, `updateSavedPOINote`, `addPostcard`, `toggleChecklistItem`, `addChecklistItem`, `removeChecklistItem`, `addChatMessage`, `setWishlistNote`.

- [ ] **Step 4: Call `initSync()` in AuthGate after trip is resolved**

In `AuthGate.tsx`, after `setTripMeta(...)` in both create and join paths:

```typescript
// After setTripMeta(existing):
useStore.getState().initSync();
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add services/firestoreSync.ts store.ts components/AuthGate.tsx
git commit -m "feat: add Firestore bidirectional sync middleware for real-time collaboration"
```

---

### Task 5: Firebase Storage Service

**Files:**
- Create: `services/firebaseStorage.ts`

- [ ] **Step 1: Create storage upload/download service**

Create `services/firebaseStorage.ts`:

```typescript
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { useStore } from '../store';

function getTripPath(): string {
  const tripId = useStore.getState().tripMeta?.id;
  if (!tripId) throw new Error('No active trip');
  return `trips/${tripId}`;
}

/**
 * Upload an image (data URL or Blob) and return the download URL.
 */
export async function uploadImage(
  folder: 'postcards' | 'challenges' | 'audio',
  dataOrBlob: string | Blob,
  filename?: string
): Promise<string> {
  const path = `${getTripPath()}/${folder}/${filename || crypto.randomUUID()}`;
  const storageRef = ref(storage, path);

  let blob: Blob;
  if (typeof dataOrBlob === 'string') {
    // Convert data URL to blob
    const res = await fetch(dataOrBlob);
    blob = await res.blob();
  } else {
    blob = dataOrBlob;
  }

  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (e) {
    console.warn('[storage] delete failed:', e);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add services/firebaseStorage.ts
git commit -m "feat: add Firebase Storage service for image/audio uploads"
```

---

## Chunk 2: Upgrade Existing Features to Collaborative (Tasks 6–11)

### Task 6: UserAvatar Component

**Files:**
- Create: `components/UserAvatar.tsx`

A reusable tiny avatar chip used throughout collaborative features to show who did what.

- [ ] **Step 1: Create UserAvatar**

```tsx
import React from 'react';
import { TripUser } from '../types';

interface Props {
  user: TripUser | null;
  size?: 'sm' | 'md';
  showName?: boolean;
}

const colors = {
  teal: 'bg-[#194f4c] text-white',
  rust: 'bg-[#ac3d29] text-white',
};

const sizes = {
  sm: 'w-5 h-5 text-[9px]',
  md: 'w-7 h-7 text-xs',
};

const UserAvatar: React.FC<Props> = ({ user, size = 'sm', showName = false }) => {
  if (!user) return null;

  const initial = (user.displayName || '?')[0].toUpperCase();
  const colorClass = colors[user.color] || colors.teal;
  const sizeClass = sizes[size];

  return (
    <span className="inline-flex items-center gap-1.5">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-white dark:ring-black`}
        />
      ) : (
        <span className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-bold ring-2 ring-white dark:ring-black`}>
          {initial}
        </span>
      )}
      {showName && (
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {user.displayName?.split(' ')[0]}
        </span>
      )}
    </span>
  );
};

export default UserAvatar;
```

- [ ] **Step 2: Commit**

```bash
git add components/UserAvatar.tsx
git commit -m "feat: add UserAvatar component for collaborative attribution"
```

---

### Task 7: Shared Wishlist with Voting

**Files:**
- Modify: `components/Wishlist.tsx`
- Modify: `types.ts`

Replace the existing solo wishlist with a collaborative version that shows who added each place and lets the partner vote.

- [ ] **Step 1: Add vote fields to SavedPOI type**

In `types.ts`, extend `SavedPOI`:

```typescript
export interface SavedPOI {
  id: string;
  cityId: string;
  title: string;
  uri: string;
  lat?: number;
  lng?: number;
  timestamp: number;
  notes?: string;
  photoUrl?: string;
  // Collaborative fields
  addedBy?: string;        // uid of who added it
  votes?: VoteRecord;      // { [uid]: 'up' | 'down' }
}
```

- [ ] **Step 2: Rewrite Wishlist.tsx with voting UI**

Key changes to `Wishlist.tsx`:
- Show `UserAvatar` next to each POI showing who added it
- Add thumbs up/down buttons for the partner to vote
- Show a "Both want this!" badge when both vote 'up'
- Sort: "both want" items first, then by vote count
- When adding a new wish, set `addedBy: currentUser.uid`

Add to the POI card rendering:

```tsx
import UserAvatar from './UserAvatar';

// Inside the POI card:
const myUid = currentUser?.uid;
const partnerUid = tripMeta?.partnerIds.find(id => id !== myUid);
const myVote = poi.votes?.[myUid || ''];
const partnerVote = poi.votes?.[partnerUid || ''];
const bothWant = myVote === 'up' && partnerVote === 'up';

// Vote handler:
const handleVote = (poiId: string, vote: 'up' | 'down') => {
  if (!myUid || !tripMeta) return;
  const poi = savedPOIs.find(p => p.id === poiId);
  if (!poi) return;
  const newVotes = { ...poi.votes, [myUid]: vote };
  // Update locally and in Firestore
  writeDoc(`trips/${tripMeta.id}/pois/${poiId}`, { votes: newVotes });
};
```

Badge rendering:

```tsx
{bothWant && (
  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded-full">
    Both want this!
  </span>
)}
```

Vote buttons:

```tsx
<div className="flex gap-1">
  <button
    onClick={() => handleVote(poi.id, 'up')}
    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
      myVote === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-emerald-50'
    }`}
  >
    👍
  </button>
  <button
    onClick={() => handleVote(poi.id, 'down')}
    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
      myVote === 'down' ? 'bg-red-100 text-red-600' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-red-50'
    }`}
  >
    👎
  </button>
</div>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/Wishlist.tsx types.ts
git commit -m "feat: add collaborative voting to wishlist with 'both want this' badges"
```

---

### Task 8: Collaborative Packing Checklist

**Files:**
- Modify: `components/PackingChecklist.tsx`
- Modify: `types.ts`

Add `claimedBy` and `packedBy` to checklist items so each partner can claim items and see who's packed what.

- [ ] **Step 1: Extend ChecklistItem type**

In `types.ts`:

```typescript
export interface ChecklistItem {
  id: string;
  label: string;
  category: 'documents' | 'clothing' | 'tech' | 'toiletries' | 'misc';
  checked: boolean;
  claimedBy?: string;   // uid — "I'll bring this"
  packedBy?: string;     // uid — who actually packed it
}
```

- [ ] **Step 2: Update PackingChecklist.tsx**

Key changes:
- Each item shows a "Claim" button (if unclaimed) or `UserAvatar` of who claimed it
- Checking an item sets `packedBy` to current user's uid
- Dual progress bars: "Haris: 5/12 packed" | "Partner: 3/10 packed"
- Filter view: "All" | "Mine" | "Theirs" | "Unclaimed"
- Color-code items by claimer (teal vs rust border)

Claim button:

```tsx
const handleClaim = (itemId: string) => {
  if (!currentUser || !tripMeta) return;
  const item = checklist.find(i => i.id === itemId);
  if (!item) return;
  const claimedBy = item.claimedBy === currentUser.uid ? undefined : currentUser.uid;
  writeDoc(`trips/${tripMeta.id}/checklist/${itemId}`, { ...item, claimedBy });
};
```

Dual progress section:

```tsx
const myItems = checklist.filter(i => i.claimedBy === currentUser?.uid);
const myPacked = myItems.filter(i => i.checked).length;
const partnerItems = checklist.filter(i => i.claimedBy === partnerUser?.uid);
const partnerPacked = partnerItems.filter(i => i.checked).length;

// Render two progress bars side by side
<div className="grid grid-cols-2 gap-4">
  <div>
    <UserAvatar user={currentUser} size="sm" showName />
    <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-1">
      <div className="h-full bg-[#194f4c] rounded-full" style={{ width: `${(myPacked / Math.max(myItems.length, 1)) * 100}%` }} />
    </div>
    <span className="text-[10px] text-slate-400">{myPacked}/{myItems.length}</span>
  </div>
  <div>
    <UserAvatar user={partnerUser} size="sm" showName />
    <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-1">
      <div className="h-full bg-[#ac3d29] rounded-full" style={{ width: `${(partnerPacked / Math.max(partnerItems.length, 1)) * 100}%` }} />
    </div>
    <span className="text-[10px] text-slate-400">{partnerPacked}/{partnerItems.length}</span>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add components/PackingChecklist.tsx types.ts
git commit -m "feat: add collaborative packing with claims and dual progress bars"
```

---

### Task 9: Shared Chat Thread

**Files:**
- Modify: `components/ChatInterface.tsx`

- [ ] **Step 1: Add sender attribution to chat messages**

In `types.ts`, extend `ChatMessage`:

```typescript
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  grounding?: GroundingChunk[];
  sentBy?: string;       // uid of who sent the message
  senderName?: string;   // display name for the bubble
  timestamp?: number;
}
```

- [ ] **Step 2: Update ChatInterface.tsx**

Key changes:
- When sending a message, set `sentBy: currentUser.uid` and `senderName: currentUser.displayName`
- User message bubbles show `UserAvatar` + first name
- Partner's messages appear in rust color, yours in teal
- Both see the same AI responses
- Messages sync in real-time via Firestore

```tsx
// In the message bubble rendering:
const isMyMessage = msg.sentBy === currentUser?.uid;
const isPartner = msg.role === 'user' && !isMyMessage;

{msg.role === 'user' && (
  <div className={`flex items-center gap-1.5 mb-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
    <UserAvatar user={isMyMessage ? currentUser : partnerUser} size="sm" />
    <span className="text-[10px] font-bold text-slate-400">
      {msg.senderName?.split(' ')[0] || (isMyMessage ? 'You' : 'Partner')}
    </span>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add components/ChatInterface.tsx types.ts
git commit -m "feat: make chat collaborative with sender attribution and real-time sync"
```

---

### Task 10: Dual Passport (Side-by-Side Stamps)

**Files:**
- Modify: `components/Passaporto.tsx`

- [ ] **Step 1: Update passport to show both partners' stamps**

Key changes:
- Each city stamp shows two small avatar dots: filled if that partner has stamped it
- A "race" indicator: "Haris: 5/8 | Partner: 3/8"
- When both partners stamp the same city, show a special heart animation
- Keep existing print/export functionality

```tsx
// For each city stamp card, show dual completion:
const myStamped = stamps.includes(city.id); // local user's stamps
// Partner stamps come from Firestore listener — stored as stamps collection docs
// Each stamp doc: { [uid1]: timestamp, [uid2]: timestamp }

<div className="flex gap-1 mt-1">
  <span className={`w-3 h-3 rounded-full border-2 ${
    myStamped ? 'bg-[#194f4c] border-[#194f4c]' : 'border-slate-300 dark:border-slate-600'
  }`} title={currentUser?.displayName} />
  <span className={`w-3 h-3 rounded-full border-2 ${
    partnerStamped ? 'bg-[#ac3d29] border-[#ac3d29]' : 'border-slate-300 dark:border-slate-600'
  }`} title={partnerUser?.displayName} />
</div>
```

Header race bar:

```tsx
<div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl mb-6">
  <div className="flex items-center gap-2">
    <UserAvatar user={currentUser} size="sm" />
    <span className="text-amber-100 font-bold text-sm">{myStampCount}/8</span>
  </div>
  <span className="text-amber-400/40 text-xs font-bold uppercase tracking-widest">Stamp Race</span>
  <div className="flex items-center gap-2">
    <span className="text-amber-100 font-bold text-sm">{partnerStampCount}/8</span>
    <UserAvatar user={partnerUser} size="sm" />
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add components/Passaporto.tsx
git commit -m "feat: add dual passport with side-by-side stamp tracking and race bar"
```

---

### Task 11: Collaborative Daily Reveals & Shared Gallery

**Files:**
- Modify: `components/DailyReveal.tsx`
- Modify: `components/Gallery.tsx`

- [ ] **Step 1: Update DailyReveal with reactions**

Key changes:
- When a tile is unlocked, both partners can add an emoji reaction
- Show partner's reaction next to yours under each tile
- "Unlocked by" shows who tapped it first

```tsx
// Reaction bar under each revealed tile:
const myReaction = revealReactions[tile.id]?.[currentUser?.uid || ''];
const partnerReaction = revealReactions[tile.id]?.[partnerUser?.uid || ''];

<div className="flex items-center gap-2 mt-2">
  {['😍', '😂', '🤤', '🇮🇹', '❤️'].map(emoji => (
    <button
      key={emoji}
      onClick={() => handleReaction(tile.id, emoji)}
      className={`text-sm ${myReaction === emoji ? 'scale-125' : 'opacity-50 hover:opacity-100'} transition-all`}
    >
      {emoji}
    </button>
  ))}
  {partnerReaction && (
    <span className="ml-auto flex items-center gap-1">
      <UserAvatar user={partnerUser} size="sm" />
      <span className="text-sm">{partnerReaction}</span>
    </span>
  )}
</div>
```

- [ ] **Step 2: Update Gallery with photographer attribution**

Key changes:
- Each postcard shows a `UserAvatar` badge in the corner
- Filter: "All" | "Mine" | "Partner's"
- Both partners can add a caption to any postcard (dual captions shown)

```tsx
// Postcard card:
<div className="relative">
  <img src={postcard.url} ... />
  <div className="absolute top-2 right-2">
    <UserAvatar user={postcard.createdBy === currentUser?.uid ? currentUser : partnerUser} size="sm" />
  </div>
  {postcard.caption && (
    <p className="text-xs italic text-slate-500 mt-1">"{postcard.caption}"</p>
  )}
  {postcard.partnerCaption && (
    <p className="text-xs italic text-[#ac3d29] mt-0.5">"{postcard.partnerCaption}"</p>
  )}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add components/DailyReveal.tsx components/Gallery.tsx
git commit -m "feat: add reactions to daily reveals and photographer attribution to gallery"
```

---

## Chunk 3: New Collaborative Features (Tasks 12–18)

### Task 12: Preference Matcher

**Files:**
- Create: `components/PreferenceMatch.tsx`
- Modify: `App.tsx` (add route)

A swipe-style interface where each partner independently rates trip categories, then the app reveals where they align and where to compromise.

- [ ] **Step 1: Create PreferenceMatch component**

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { writeDoc } from '../services/firestoreSync';
import UserAvatar from './UserAvatar';

const CATEGORIES = [
  { id: 'museums', label: 'Museums & Art', emoji: '🏛️', desc: 'Galleries, churches, history' },
  { id: 'food', label: 'Food & Wine', emoji: '🍷', desc: 'Restaurants, tastings, markets' },
  { id: 'nature', label: 'Nature & Walks', emoji: '🌿', desc: 'Hikes, gardens, viewpoints' },
  { id: 'romance', label: 'Romance', emoji: '💕', desc: 'Couples moments, sunset spots' },
  { id: 'adventure', label: 'Adventure', emoji: '🏎️', desc: 'Driving, exploring, spontaneous' },
  { id: 'relax', label: 'Relaxation', emoji: '♨️', desc: 'Thermal baths, slow mornings' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', desc: 'Markets, boutiques, souvenirs' },
  { id: 'nightlife', label: 'Evening Out', emoji: '🌙', desc: 'Aperitivo, night walks, live music' },
  { id: 'photography', label: 'Photography', emoji: '📸', desc: 'Photo stops, golden hour' },
  { id: 'culture', label: 'Local Culture', emoji: '🎭', desc: 'Traditions, festivals, people' },
];

const PreferenceMatch: React.FC = () => {
  const { currentUser, partnerUser, tripMeta } = useStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [myRatings, setMyRatings] = useState<Record<string, number>>({});
  const [partnerRatings, setPartnerRatings] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const category = CATEGORIES[currentIdx];

  const handleRate = (rating: number) => {
    const updated = { ...myRatings, [category.id]: rating };
    setMyRatings(updated);

    if (currentIdx < CATEGORIES.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Submit to Firestore
      if (tripMeta && currentUser) {
        writeDoc(`trips/${tripMeta.id}/preferences/${currentUser.uid}`, {
          categories: updated,
          submittedAt: Date.now(),
        });
      }
      setSubmitted(true);
    }
  };

  // Listen for partner's preferences via store/sync
  // Show results only when both have submitted

  if (showResults) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-lg mx-auto">
        <h2 className="font-serif text-2xl font-bold text-center mb-8">Your Match</h2>

        {CATEGORIES.map(cat => {
          const mine = myRatings[cat.id] || 0;
          const theirs = partnerRatings[cat.id] || 0;
          const diff = Math.abs(mine - theirs);
          const match = diff <= 1 ? 'perfect' : diff <= 2 ? 'close' : 'compromise';

          return (
            <div key={cat.id} className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-white/5">
              <span className="text-2xl">{cat.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">{cat.label}</span>
                  {match === 'perfect' && <span className="text-[9px] font-bold text-emerald-500 uppercase">Perfect Match</span>}
                  {match === 'compromise' && <span className="text-[9px] font-bold text-amber-500 uppercase">Compromise Zone</span>}
                </div>
                <div className="flex items-center gap-2">
                  <UserAvatar user={currentUser} size="sm" />
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className={`w-6 h-2 rounded-full ${n <= mine ? 'bg-[#194f4c]' : 'bg-slate-200 dark:bg-white/10'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <UserAvatar user={partnerUser} size="sm" />
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className={`w-6 h-2 rounded-full ${n <= theirs ? 'bg-[#ac3d29]' : 'bg-slate-200 dark:bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    );
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 text-center">
        <p className="text-4xl mb-4">✅</p>
        <h2 className="font-serif text-2xl font-bold mb-2">Submitted!</h2>
        <p className="text-sm text-slate-500 mb-6">Waiting for your partner to finish rating...</p>
        {/* Check if partner has submitted, then show results */}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center p-6">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
        {currentIdx + 1} / {CATEGORIES.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={category.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-2xl p-8 max-w-sm w-full text-center"
        >
          <span className="text-5xl block mb-4">{category.emoji}</span>
          <h3 className="font-serif text-xl font-bold mb-1">{category.label}</h3>
          <p className="text-xs text-slate-400 mb-6">{category.desc}</p>

          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">How important to you?</p>
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                onClick={() => handleRate(n)}
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-[#194f4c] hover:text-white text-slate-700 dark:text-white font-bold text-lg transition-colors"
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-slate-300 mt-3">1 = skip it · 5 = must do</p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default PreferenceMatch;
```

- [ ] **Step 2: Add route in App.tsx**

```tsx
import PreferenceMatch from './components/PreferenceMatch';

// In AnimatedRoutes:
<Route path="/preferences" element={<PreferenceMatch />} />
```

- [ ] **Step 3: Add navigation link in Sidebar.tsx**

Add a "Preferences" button in the sidebar pre-trip section.

- [ ] **Step 4: Commit**

```bash
git add components/PreferenceMatch.tsx App.tsx components/Sidebar.tsx
git commit -m "feat: add preference matcher — partners rate categories independently, then see alignment"
```

---

### Task 13: Daily Conversation Starters

**Files:**
- Create: `components/ConversationStarters.tsx`
- Modify: `App.tsx`

Daily prompts leading up to the trip. Both partners answer independently, then tap "Reveal" to see each other's answer simultaneously.

- [ ] **Step 1: Create ConversationStarters component**

```tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { writeDoc, listenDoc } from '../services/firestoreSync';
import UserAvatar from './UserAvatar';

const PROMPTS = [
  { id: 'p1', text: "What's the one thing you're most excited about?", day: -30 },
  { id: 'p2', text: "Describe your perfect Italian morning.", day: -29 },
  { id: 'p3', text: "One restaurant dish you MUST try?", day: -28 },
  { id: 'p4', text: "What will you miss most about home?", day: -27 },
  { id: 'p5', text: "Your dream photo from this trip looks like...", day: -26 },
  { id: 'p6', text: "One word that captures what Italy means to you.", day: -25 },
  { id: 'p7', text: "What's the bravest thing you want to do on this trip?", day: -24 },
  { id: 'p8', text: "A surprise you'd love to experience.", day: -23 },
  { id: 'p9', text: "Which day are you most looking forward to?", day: -22 },
  { id: 'p10', text: "What should our trip motto be?", day: -21 },
  { id: 'p11', text: "One thing about our relationship this trip should celebrate.", day: -20 },
  { id: 'p12', text: "If we could only visit ONE place, which?", day: -19 },
  { id: 'p13', text: "A song that should be our Italy soundtrack.", day: -18 },
  { id: 'p14', text: "What's your gelato flavor strategy?", day: -17 },
  { id: 'p15', text: "The cheesiest romantic thing you want to do.", day: -16 },
  { id: 'p16', text: "One Italian phrase you want to master.", day: -15 },
  { id: 'p17', text: "What does '20 years together' feel like?", day: -14 },
  { id: 'p18', text: "A gift you'd love to bring home.", day: -13 },
  { id: 'p19', text: "Your ideal pace: go-go-go or slow-and-savour?", day: -12 },
  { id: 'p20', text: "One memory from the last 20 years this trip reminds you of.", day: -11 },
  { id: 'p21', text: "What's the one photo you WILL take on anniversary day?", day: -10 },
  { id: 'p22', text: "Driving through Tuscany — windows down or AC on?", day: -9 },
  { id: 'p23', text: "A toast you'll make on our anniversary dinner.", day: -8 },
  { id: 'p24', text: "The thing about traveling with me that drives you crazy (lovingly).", day: -7 },
  { id: 'p25', text: "One thing you hope we talk about during this trip.", day: -6 },
  { id: 'p26', text: "Your packing confession: what unnecessary thing are you bringing?", day: -5 },
  { id: 'p27', text: "A promise you want to make for the next 20 years.", day: -4 },
  { id: 'p28', text: "The meal you're already fantasizing about.", day: -3 },
  { id: 'p29', text: "How will we know the trip was perfect?", day: -2 },
  { id: 'p30', text: "Last words before takeoff?", day: -1 },
];

const ConversationStarters: React.FC = () => {
  const { currentUser, partnerUser, tripMeta } = useStore();
  const [responses, setResponses] = useState<Record<string, Record<string, string>>>({});
  const [myAnswer, setMyAnswer] = useState('');
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  // Calculate which prompts are unlocked based on days until May 2
  const tripDate = new Date(2026, 4, 2); // May 2, 2026
  const now = new Date();
  const daysUntil = Math.ceil((tripDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const unlockedPrompts = PROMPTS.filter(p => Math.abs(p.day) <= daysUntil);

  // Today's prompt
  const todayPrompt = unlockedPrompts[unlockedPrompts.length - 1];

  // Listen for responses from Firestore
  useEffect(() => {
    if (!tripMeta) return;
    const unsub = listenDoc(`trips/${tripMeta.id}/prompts/responses`, (data) => {
      if (data) setResponses(data);
    });
    return unsub;
  }, [tripMeta]);

  const handleSubmit = async () => {
    if (!myAnswer.trim() || !currentUser || !tripMeta || !todayPrompt) return;
    await writeDoc(`trips/${tripMeta.id}/prompts/responses`, {
      [`${todayPrompt.id}.${currentUser.uid}`]: myAnswer.trim(),
    });
    setMyAnswer('');
  };

  const handleReveal = (promptId: string) => {
    setRevealed(prev => new Set([...prev, promptId]));
  };

  const myUid = currentUser?.uid || '';
  const partnerUid = partnerUser?.uid || '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black p-6 pb-32"
    >
      <h1 className="font-serif text-3xl font-bold text-center mb-2">Daily Prompts</h1>
      <p className="text-xs text-slate-400 text-center mb-8">Answer independently, then reveal together</p>

      {/* Today's prompt (featured) */}
      {todayPrompt && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-xl p-8 mb-8 max-w-lg mx-auto">
          <p className="text-[10px] uppercase tracking-widest text-[#ac3d29] font-bold mb-3">Today's Prompt</p>
          <h2 className="font-serif text-xl font-bold mb-6">{todayPrompt.text}</h2>

          {!responses[todayPrompt.id]?.[myUid] ? (
            <div>
              <textarea
                value={myAnswer}
                onChange={(e) => setMyAnswer(e.target.value)}
                placeholder="Your answer..."
                className="w-full p-4 bg-slate-50 dark:bg-black rounded-2xl border border-slate-200 dark:border-white/10 text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-[#194f4c] mb-3"
              />
              <button
                onClick={handleSubmit}
                disabled={!myAnswer.trim()}
                className="w-full py-3 bg-[#194f4c] text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                Submit Answer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <UserAvatar user={currentUser} size="md" />
                <div className="flex-1 p-3 bg-[#194f4c]/10 rounded-2xl">
                  <p className="text-sm">{responses[todayPrompt.id][myUid]}</p>
                </div>
              </div>

              {responses[todayPrompt.id]?.[partnerUid] ? (
                revealed.has(todayPrompt.id) ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                    <UserAvatar user={partnerUser} size="md" />
                    <div className="flex-1 p-3 bg-[#ac3d29]/10 rounded-2xl">
                      <p className="text-sm">{responses[todayPrompt.id][partnerUid]}</p>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => handleReveal(todayPrompt.id)}
                    className="w-full py-3 bg-[#ac3d29] text-white rounded-xl font-bold text-sm"
                  >
                    Reveal Partner's Answer
                  </button>
                )
              ) : (
                <p className="text-xs text-slate-400 text-center italic">Waiting for your partner to answer...</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Past prompts (scrollable history) */}
      <div className="max-w-lg mx-auto space-y-4">
        {unlockedPrompts.slice(0, -1).reverse().map(prompt => (
          <div key={prompt.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-400 mb-2 font-bold">Day {prompt.day}</p>
            <p className="font-serif text-sm font-bold mb-3">{prompt.text}</p>
            {responses[prompt.id]?.[myUid] && responses[prompt.id]?.[partnerUid] && (
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><UserAvatar user={currentUser} size="sm" /> Answered</span>
                <span className="flex items-center gap-1"><UserAvatar user={partnerUser} size="sm" /> Answered</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ConversationStarters;
```

- [ ] **Step 2: Add route**

```tsx
import ConversationStarters from './components/ConversationStarters';
<Route path="/prompts" element={<ConversationStarters />} />
```

- [ ] **Step 3: Commit**

```bash
git add components/ConversationStarters.tsx App.tsx
git commit -m "feat: add daily conversation starters with simultaneous reveal"
```

---

### Task 14: Surprise Planner

**Files:**
- Create: `components/SurprisePlanner.tsx`
- Modify: `App.tsx`

A private section where one partner can plan a surprise that stays hidden until the right day.

- [ ] **Step 1: Create SurprisePlanner component**

```tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { writeDoc, listenCollection, removeDoc } from '../services/firestoreSync';
import { ITALIAN_CITIES } from '../constants';

interface Surprise {
  id: string;
  createdBy: string;
  forDay: string;   // cityId
  title: string;
  note: string;
  revealOnDay: boolean;  // auto-reveal when that day arrives
  revealed: boolean;
}

const SurprisePlanner: React.FC = () => {
  const { currentUser, partnerUser, tripMeta } = useStore();
  const [surprises, setSurprises] = useState<Surprise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [forDay, setForDay] = useState('day-1');

  useEffect(() => {
    if (!tripMeta) return;
    const unsub = listenCollection(`trips/${tripMeta.id}/surprises`, (docs) => {
      setSurprises(docs.map(d => ({ ...d.data, id: d.id } as Surprise)));
    });
    return unsub;
  }, [tripMeta]);

  const handleSave = async () => {
    if (!title.trim() || !currentUser || !tripMeta) return;
    const id = crypto.randomUUID();
    await writeDoc(`trips/${tripMeta.id}/surprises/${id}`, {
      id,
      createdBy: currentUser.uid,
      forDay,
      title: title.trim(),
      note: note.trim(),
      revealOnDay: true,
      revealed: false,
    });
    setTitle('');
    setNote('');
    setShowForm(false);
  };

  const mySurprises = surprises.filter(s => s.createdBy === currentUser?.uid);
  const forMeSurprises = surprises.filter(s => s.createdBy !== currentUser?.uid);

  // Revealed surprises: partner's surprises that have been revealed
  const revealedForMe = forMeSurprises.filter(s => s.revealed);
  // Hidden: show count only ("Your partner has X surprises planned!")
  const hiddenForMe = forMeSurprises.filter(s => !s.revealed);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black p-6 pb-32"
    >
      <h1 className="font-serif text-3xl font-bold text-center mb-2">Surprises</h1>
      <p className="text-xs text-slate-400 text-center mb-8">Plan secret moments for your partner</p>

      {/* Teaser: hidden surprises for me */}
      {hiddenForMe.length > 0 && (
        <div className="bg-gradient-to-br from-[#ac3d29]/10 to-[#ac3d29]/5 rounded-[2rem] p-6 mb-8 text-center max-w-lg mx-auto">
          <span className="text-4xl block mb-3">🎁</span>
          <p className="font-serif text-lg font-bold">
            {hiddenForMe.length} surprise{hiddenForMe.length > 1 ? 's' : ''} waiting for you!
          </p>
          <p className="text-xs text-slate-400 mt-1">They'll be revealed at just the right moment</p>
        </div>
      )}

      {/* Revealed surprises */}
      {revealedForMe.length > 0 && (
        <div className="max-w-lg mx-auto mb-8">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">Revealed</h3>
          {revealedForMe.map(s => {
            const city = ITALIAN_CITIES.find(c => c.id === s.forDay);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm mb-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎁</span>
                  <h4 className="font-bold text-sm">{s.title}</h4>
                  <span className="text-[9px] text-slate-400 ml-auto">{city?.location}</span>
                </div>
                {s.note && <p className="text-sm text-slate-600 dark:text-slate-400">{s.note}</p>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* My planned surprises (visible only to me) */}
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">My Planned Surprises</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-[10px] font-bold text-[#194f4c] uppercase tracking-wider"
          >
            {showForm ? 'Cancel' : '+ New'}
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm mb-4 overflow-hidden"
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Surprise title..."
                className="w-full p-3 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-white/10 text-sm outline-none mb-3"
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Details (only you can see this until revealed)..."
                className="w-full p-3 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-white/10 text-sm resize-none h-20 outline-none mb-3"
              />
              <select
                value={forDay}
                onChange={(e) => setForDay(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-white/10 text-sm outline-none mb-4"
              >
                {ITALIAN_CITIES.map((city, i) => (
                  <option key={city.id} value={city.id}>Day {i + 1}: {city.location}</option>
                ))}
              </select>
              <button onClick={handleSave} disabled={!title.trim()} className="w-full py-3 bg-[#194f4c] text-white rounded-xl font-bold text-sm disabled:opacity-50">
                Save Surprise
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {mySurprises.map(s => {
          const city = ITALIAN_CITIES.find(c => c.id === s.forDay);
          return (
            <div key={s.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm mb-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">{s.title}</h4>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  s.revealed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {s.revealed ? 'Revealed' : 'Hidden'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{city?.location} · Day {ITALIAN_CITIES.indexOf(city!) + 1}</p>
              {!s.revealed && (
                <button
                  onClick={() => writeDoc(`trips/${tripMeta!.id}/surprises/${s.id}`, { revealed: true })}
                  className="mt-3 text-xs font-bold text-[#ac3d29]"
                >
                  Reveal Now
                </button>
              )}
            </div>
          );
        })}

        {mySurprises.length === 0 && !showForm && (
          <p className="text-center text-slate-400 text-sm py-8">No surprises planned yet. Tap + New to start!</p>
        )}
      </div>
    </motion.div>
  );
};

export default SurprisePlanner;
```

- [ ] **Step 2: Add route and navigation**

```tsx
import SurprisePlanner from './components/SurprisePlanner';
<Route path="/surprises" element={<SurprisePlanner />} />
```

- [ ] **Step 3: Commit**

```bash
git add components/SurprisePlanner.tsx App.tsx
git commit -m "feat: add surprise planner with hidden/revealed states per partner"
```

---

### Task 15: Photo Challenge Cards

**Files:**
- Create: `components/PhotoChallenges.tsx`
- Modify: `App.tsx`

Pre-loaded creative photo challenges for the trip that both partners can complete.

- [ ] **Step 1: Create PhotoChallenges component**

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { listenCollection, writeDoc } from '../services/firestoreSync';
import { uploadImage } from '../services/firebaseStorage';
import UserAvatar from './UserAvatar';

const CHALLENGES = [
  { id: 'ch1', title: 'The Kiss', desc: 'Kiss in front of a famous Italian landmark', emoji: '💋', day: null },
  { id: 'ch2', title: 'Gelato Face', desc: 'Capture the first bite of gelato reaction', emoji: '🍦', day: null },
  { id: 'ch3', title: 'Golden Hour', desc: 'Silhouette photo at sunset', emoji: '🌅', day: null },
  { id: 'ch4', title: 'La Vespa', desc: 'Pose with a Vespa (bonus: ride one)', emoji: '🛵', day: null },
  { id: 'ch5', title: 'Mirror Mirror', desc: 'Reflection photo in water or glass', emoji: '🪞', day: null },
  { id: 'ch6', title: 'Local Friend', desc: 'Photo with a friendly local (with permission)', emoji: '🤝', day: null },
  { id: 'ch7', title: 'The Toast', desc: 'Glasses clinking — aperitivo hour', emoji: '🥂', day: null },
  { id: 'ch8', title: 'Lost & Found', desc: 'Photo of a beautiful unexpected discovery', emoji: '🗺️', day: null },
  { id: 'ch9', title: 'Door Envy', desc: 'The most beautiful Italian door you find', emoji: '🚪', day: null },
  { id: 'ch10', title: 'Market Haul', desc: 'Show off your local market finds', emoji: '🧺', day: null },
  { id: 'ch11', title: 'The View', desc: 'Best panoramic view of the trip', emoji: '⛰️', day: null },
  { id: 'ch12', title: 'Nonna Approved', desc: 'A plate of food so good nonna would approve', emoji: '👵', day: null },
  { id: 'ch13', title: 'Street Art', desc: 'Find and photograph street art', emoji: '🎨', day: null },
  { id: 'ch14', title: 'Us × 20', desc: 'Recreate a photo from early in your relationship', emoji: '📷', day: null },
  { id: 'ch15', title: 'Tiny Street', desc: 'The narrowest, most charming alley you find', emoji: '🏘️', day: null },
  { id: 'ch16', title: 'Anniversary Selfie', desc: 'The official anniversary day portrait', emoji: '❤️', day: 'day-5' },
];

const PhotoChallenges: React.FC = () => {
  const { currentUser, partnerUser, tripMeta } = useStore();
  const [completions, setCompletions] = useState<Record<string, Record<string, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!tripMeta) return;
    const unsub = listenCollection(`trips/${tripMeta.id}/challenges`, (docs) => {
      const map: Record<string, Record<string, string>> = {};
      for (const d of docs) map[d.id] = d.data.completions || {};
      setCompletions(map);
    });
    return unsub;
  }, [tripMeta]);

  const handleUpload = async (challengeId: string, file: File) => {
    if (!currentUser || !tripMeta) return;
    setUploadingId(challengeId);
    try {
      const url = await uploadImage('challenges', file, `${challengeId}-${currentUser.uid}`);
      await writeDoc(`trips/${tripMeta.id}/challenges/${challengeId}`, {
        completions: { ...completions[challengeId], [currentUser.uid]: url },
      });
    } catch (e) {
      console.error('Upload failed:', e);
    }
    setUploadingId(null);
  };

  const myUid = currentUser?.uid || '';
  const partnerUid = partnerUser?.uid || '';
  const completedCount = CHALLENGES.filter(c => completions[c.id]?.[myUid] && completions[c.id]?.[partnerUid]).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black p-6 pb-32"
    >
      <h1 className="font-serif text-3xl font-bold text-center mb-2">Photo Challenges</h1>
      <p className="text-xs text-slate-400 text-center mb-2">{completedCount}/{CHALLENGES.length} completed by both</p>

      {/* Progress bar */}
      <div className="max-w-lg mx-auto mb-8">
        <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-[#194f4c] to-[#ac3d29] rounded-full transition-all"
            style={{ width: `${(completedCount / CHALLENGES.length) * 100}%` }}
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingId) handleUpload(uploadingId, file);
          e.target.value = '';
        }}
      />

      <div className="max-w-lg mx-auto grid grid-cols-1 gap-4">
        {CHALLENGES.map(ch => {
          const myPhoto = completions[ch.id]?.[myUid];
          const partnerPhoto = completions[ch.id]?.[partnerUid];
          const bothDone = myPhoto && partnerPhoto;

          return (
            <div
              key={ch.id}
              className={`bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm overflow-hidden ${
                bothDone ? 'ring-2 ring-emerald-400' : ''
              }`}
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{ch.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{ch.title}</h3>
                    <p className="text-[10px] text-slate-400">{ch.desc}</p>
                  </div>
                  {bothDone && <span className="text-emerald-500 font-bold text-[9px] uppercase">Both done!</span>}
                </div>

                {/* Photo submissions */}
                <div className="flex gap-3 mt-3">
                  {/* My submission */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <UserAvatar user={currentUser} size="sm" />
                      <span className="text-[9px] text-slate-400 font-bold">You</span>
                    </div>
                    {myPhoto ? (
                      <img src={myPhoto} alt="My submission" className="w-full aspect-square object-cover rounded-xl" />
                    ) : (
                      <button
                        onClick={() => {
                          setUploadingId(ch.id);
                          fileInputRef.current?.click();
                        }}
                        disabled={uploadingId === ch.id}
                        className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 hover:border-[#194f4c] transition-colors"
                      >
                        {uploadingId === ch.id ? (
                          <div className="w-5 h-5 border-2 border-[#194f4c] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span className="text-xl">📸</span>
                            <span className="text-[9px] text-slate-400 font-bold">Add photo</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Partner submission */}
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <UserAvatar user={partnerUser} size="sm" />
                      <span className="text-[9px] text-slate-400 font-bold">{partnerUser?.displayName?.split(' ')[0] || 'Partner'}</span>
                    </div>
                    {partnerPhoto ? (
                      <img src={partnerPhoto} alt="Partner submission" className="w-full aspect-square object-cover rounded-xl" />
                    ) : (
                      <div className="w-full aspect-square rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                        <span className="text-[9px] text-slate-300 dark:text-slate-600">Waiting...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PhotoChallenges;
```

- [ ] **Step 2: Add route**

```tsx
import PhotoChallenges from './components/PhotoChallenges';
<Route path="/challenges" element={<PhotoChallenges />} />
```

- [ ] **Step 3: Commit**

```bash
git add components/PhotoChallenges.tsx App.tsx
git commit -m "feat: add photo challenge cards with dual submissions and progress tracking"
```

---

### Task 16: Daily Trivia Challenge

**Files:**
- Create: `components/TriviaChallenge.tsx`
- Modify: `App.tsx`

A daily Italy trivia question where both partners answer and compare scores.

- [ ] **Step 1: Create TriviaChallenge component**

```tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { writeDoc, listenDoc } from '../services/firestoreSync';
import UserAvatar from './UserAvatar';
import { getDayOfYear } from '../utils/dateUtils';

const TRIVIA = [
  { q: "Which Italian city is built on 118 small islands?", options: ["Venice", "Naples", "Genoa", "Bari"], answer: 0 },
  { q: "What is the traditional Italian afternoon break called?", options: ["Siesta", "Riposo", "Pausa", "Dolce"], answer: 1 },
  { q: "Which region is Chianti wine from?", options: ["Piedmont", "Tuscany", "Umbria", "Lazio"], answer: 1 },
  { q: "What does 'al dente' literally mean?", options: ["To the fork", "To the tooth", "To the plate", "To the taste"], answer: 1 },
  { q: "The Amalfi Coast is in which Italian region?", options: ["Calabria", "Sicily", "Campania", "Sardinia"], answer: 2 },
  { q: "What year was the Colosseum completed?", options: ["80 AD", "120 AD", "55 AD", "200 AD"], answer: 0 },
  { q: "Which city is famous for its thermal baths since Roman times?", options: ["Orvieto", "Saturnia", "Assisi", "Perugia"], answer: 1 },
  { q: "What is a ZTL in Italian driving?", options: ["Speed camera zone", "Restricted traffic zone", "Toll road", "Parking area"], answer: 1 },
  { q: "The leaning tower is in which Tuscan city?", options: ["Siena", "Florence", "Pisa", "Lucca"], answer: 2 },
  { q: "What is bruschetta traditionally topped with?", options: ["Mozzarella", "Tomato & basil", "Prosciutto", "Mushrooms"], answer: 1 },
  { q: "Civita di Bagnoregio is known as what?", options: ["The Eternal City", "The Dying City", "The Hidden City", "The Dream City"], answer: 1 },
  { q: "Which wine is Montalcino famous for?", options: ["Barolo", "Prosecco", "Brunello", "Amarone"], answer: 2 },
  { q: "What does 'dolce vita' mean?", options: ["Sweet life", "Good day", "Beautiful view", "Happy heart"], answer: 0 },
  { q: "Pienza is called the 'Ideal City of' which era?", options: ["Medieval", "Renaissance", "Baroque", "Roman"], answer: 1 },
  { q: "What is the Italian word for 'cheers'?", options: ["Grazie", "Prego", "Salute", "Ciao"], answer: 2 },
  { q: "Which road was ancient Rome's first highway?", options: ["Via Veneto", "Via Appia", "Via Roma", "Via Aurelia"], answer: 1 },
  { q: "Spello is famous for its annual festival of what?", options: ["Music", "Wine", "Flowers", "Film"], answer: 2 },
  { q: "What is a trattoria?", options: ["Bakery", "Casual restaurant", "Wine bar", "Deli"], answer: 1 },
  { q: "Ostia Antica was Rome's ancient what?", options: ["Military camp", "Port city", "Temple complex", "Villa district"], answer: 1 },
  { q: "How many regions does Italy have?", options: ["15", "18", "20", "25"], answer: 2 },
  { q: "The Val d'Orcia is a UNESCO site in which region?", options: ["Umbria", "Lazio", "Tuscany", "Marche"], answer: 2 },
  { q: "What color is traditional limoncello?", options: ["Red", "Clear", "Yellow", "Green"], answer: 2 },
  { q: "San Gimignano is famous for its medieval what?", options: ["Bridges", "Towers", "Fountains", "Walls"], answer: 1 },
  { q: "Which lake borders Bolsena?", options: ["Lake Como", "Lake Garda", "Lake Bolsena", "Lake Trasimeno"], answer: 2 },
  { q: "What is an aperitivo?", options: ["Dessert", "Pre-dinner drink", "Breakfast", "Side dish"], answer: 1 },
  { q: "What anniversary are you celebrating in Italy?", options: ["10th", "15th", "20th", "25th"], answer: 2 },
  { q: "How many days is The Grand Tour?", options: ["5", "7", "8", "10"], answer: 2 },
  { q: "What is your anniversary day destination?", options: ["Rome", "Orvieto", "Saturnia", "Spello"], answer: 2 },
  { q: "Which sea is Ostia on?", options: ["Adriatic", "Tyrrhenian", "Ionian", "Ligurian"], answer: 1 },
  { q: "How do you say 'I love you' in Italian?", options: ["Ti amo", "Ti voglio", "Mi piaci", "Sei bella"], answer: 0 },
];

const TriviaChallenge: React.FC = () => {
  const { currentUser, partnerUser, tripMeta } = useStore();
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const todayIdx = getDayOfYear() % TRIVIA.length;
  const today = TRIVIA[todayIdx];
  const dayKey = `day-${getDayOfYear()}`;

  const myUid = currentUser?.uid || '';
  const partnerUid = partnerUser?.uid || '';

  useEffect(() => {
    if (!tripMeta) return;
    const unsub = listenDoc(`trips/${tripMeta.id}/trivia/scores`, (data) => {
      if (data) setScores(data);
    });
    return unsub;
  }, [tripMeta]);

  const todayScore = scores[dayKey];
  const alreadyAnswered = todayScore?.[myUid] !== undefined;
  const partnerAnswered = todayScore?.[partnerUid] !== undefined;

  const handleAnswer = async (idx: number) => {
    if (alreadyAnswered || !tripMeta || !currentUser) return;
    setSelectedAnswer(idx);
    const correct = idx === today.answer ? 1 : 0;
    await writeDoc(`trips/${tripMeta.id}/trivia/scores`, {
      [dayKey]: { ...todayScore, [currentUser.uid]: correct },
    });
    setRevealed(true);
  };

  // All-time scores
  const myTotal = Object.values(scores).reduce((sum, day) => sum + (day[myUid] || 0), 0);
  const partnerTotal = Object.values(scores).reduce((sum, day) => sum + (day[partnerUid] || 0), 0);
  const totalDays = Object.keys(scores).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black p-6 pb-32"
    >
      <h1 className="font-serif text-3xl font-bold text-center mb-2">Daily Trivia</h1>
      <p className="text-xs text-slate-400 text-center mb-6">Who knows Italy better?</p>

      {/* Scoreboard */}
      <div className="max-w-lg mx-auto bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <UserAvatar user={currentUser} size="md" />
            <p className="text-2xl font-serif font-bold mt-2">{myTotal}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">points</p>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{totalDays} rounds</p>
            <p className="font-serif text-lg font-bold text-slate-300">vs</p>
          </div>
          <div className="text-center flex-1">
            <UserAvatar user={partnerUser} size="md" />
            <p className="text-2xl font-serif font-bold mt-2">{partnerTotal}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">points</p>
          </div>
        </div>
      </div>

      {/* Today's question */}
      <div className="max-w-lg mx-auto bg-white dark:bg-[#1a1a1a] rounded-[2rem] shadow-xl p-8">
        <p className="text-[10px] uppercase tracking-widest text-[#ac3d29] font-bold mb-3">Today's Question</p>
        <h2 className="font-serif text-lg font-bold mb-6">{today.q}</h2>

        <div className="space-y-3">
          {today.options.map((opt, idx) => {
            const isCorrect = idx === today.answer;
            const isSelected = selectedAnswer === idx;
            let btnClass = 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10';

            if (revealed || alreadyAnswered) {
              if (isCorrect) btnClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-400';
              else if (isSelected && !isCorrect) btnClass = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
              else btnClass = 'bg-slate-50 dark:bg-white/5 text-slate-400';
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={alreadyAnswered || revealed}
                className={`w-full p-4 rounded-2xl font-bold text-sm text-left transition-colors ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {(revealed || alreadyAnswered) && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <UserAvatar user={currentUser} size="sm" />
                <span className={`text-xs font-bold ${todayScore?.[myUid] ? 'text-emerald-500' : 'text-red-400'}`}>
                  {todayScore?.[myUid] ? 'Correct!' : 'Wrong'}
                </span>
              </div>
              {partnerAnswered ? (
                <div className="flex items-center gap-1.5">
                  <UserAvatar user={partnerUser} size="sm" />
                  <span className={`text-xs font-bold ${todayScore?.[partnerUid] ? 'text-emerald-500' : 'text-red-400'}`}>
                    {todayScore?.[partnerUid] ? 'Correct!' : 'Wrong'}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Partner hasn't answered yet</span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TriviaChallenge;
```

- [ ] **Step 2: Add route**

```tsx
import TriviaChallenge from './components/TriviaChallenge';
<Route path="/trivia" element={<TriviaChallenge />} />
```

- [ ] **Step 3: Commit**

```bash
git add components/TriviaChallenge.tsx App.tsx
git commit -m "feat: add daily trivia challenge with live scoreboard"
```

---

### Task 17: Navigation Update — Collaborative Hub

**Files:**
- Modify: `components/Sidebar.tsx`
- Modify: `App.tsx` (bottom nav for mobile)

Add a "Together" section to navigation grouping all collaborative features.

- [ ] **Step 1: Update Sidebar.tsx**

Add a "Together" section after existing navigation:

```tsx
{/* Together Section */}
<div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-3 px-2">Together</p>
  <div className="space-y-1">
    <NavButton to="/preferences" icon="💕" label="Our Preferences" />
    <NavButton to="/prompts" icon="💬" label="Daily Prompts" />
    <NavButton to="/trivia" icon="🧠" label="Trivia" />
    <NavButton to="/challenges" icon="📸" label="Photo Challenges" />
    <NavButton to="/surprises" icon="🎁" label="Surprises" />
  </div>
</div>
```

- [ ] **Step 2: Update mobile bottom nav**

In `App.tsx`, add a "Together" tab to the mobile bottom nav that opens a sheet/drawer with the collaborative feature links.

- [ ] **Step 3: Add Join Code display in Sidebar**

Show the trip join code in the sidebar so the first partner can share it:

```tsx
{tripMeta?.joinCode && tripMeta.partnerIds.length < 2 && (
  <div className="mx-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl text-center mb-4">
    <p className="text-[9px] uppercase tracking-widest text-amber-600 font-bold mb-1">Invite Partner</p>
    <p className="font-mono text-lg font-bold text-amber-700 tracking-[0.3em]">{tripMeta.joinCode}</p>
    <p className="text-[9px] text-amber-500 mt-1">Share this code</p>
  </div>
)}
```

- [ ] **Step 4: Show partner status**

```tsx
{partnerUser && (
  <div className="flex items-center gap-2 mx-2 mb-4">
    <UserAvatar user={partnerUser} size="md" showName />
    <span className="text-[9px] text-emerald-500 font-bold">Connected</span>
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add components/Sidebar.tsx App.tsx
git commit -m "feat: add collaborative hub navigation with partner status and join code"
```

---

### Task 18: Retire PartnerSync & Clean Up

**Files:**
- Modify: `components/Sidebar.tsx` — remove PartnerSync button
- Delete: `components/PartnerSync.tsx` — no longer needed
- Modify: `store.ts` — final cleanup, ensure all sync paths are covered

- [ ] **Step 1: Remove PartnerSync import and button from Sidebar**

Remove the `PartnerSync` modal trigger and import from `Sidebar.tsx`.

- [ ] **Step 2: Delete PartnerSync.tsx**

```bash
git rm components/PartnerSync.tsx
```

- [ ] **Step 3: Final store audit**

Verify all mutating actions in `store.ts` have Firestore write-through:
- `addStamp` ✓
- `addSavedPOI` ✓
- `removeSavedPOI` ✓
- `updateSavedPOINote` ✓
- `updateSavedPOIPhoto` ✓
- `addPostcard` ✓
- `toggleChecklistItem` ✓
- `addChecklistItem` ✓
- `removeChecklistItem` ✓
- `addChatMessage` ✓
- `setWishlistNote` ✓

- [ ] **Step 4: Verify full build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add components/Sidebar.tsx store.ts
git commit -m "chore: retire clipboard-based PartnerSync, replaced by Firebase real-time sync"
```

---

## Chunk 4: Firestore Security Rules & Final Integration (Task 19)

### Task 19: Firestore Security Rules

**Files:**
- Create: `firestore.rules` (at repo root, deployed via Firebase CLI)

- [ ] **Step 1: Write security rules**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Trip documents — only partners can read/write
    match /trips/{tripId} {
      allow read, write: if request.auth != null
        && request.auth.uid in resource.data.meta.partnerIds;

      // Allow creation by any authenticated user
      allow create: if request.auth != null;

      // Subcollections inherit trip-level access
      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/trips/$(tripId)).data.meta.partnerIds;
      }
    }
  }
}
```

- [ ] **Step 2: Deploy rules**

```bash
npx firebase deploy --only firestore:rules
```

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: add Firestore security rules — trip data accessible only by partners"
```

---

## Summary: Feature Interaction Map

All 13 collaborative features interlock through the shared Firestore data layer:

```
┌─────────────────────────────────────────────────────┐
│                    Firebase Auth                      │
│              (Google Sign-In, 2 users)               │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│               Firestore Trip Document                │
│         trips/{tripId} — real-time sync              │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬────────┘
   │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────────┐
│Wish-││Pack-││Chat ││Pass-││Gall-││Daily││Surprise │
│list ││ing  ││     ││port ││ery  ││Reve-││Planner  │
│Vote ││Claim││Send-││Dual ││Attr-││als  ││Hidden/  │
│     ││     ││er   ││Race ││ibut-││React││Revealed │
│     ││     ││Label││     ││ion  ││ions ││         │
└─────┘└─────┘└─────┘└─────┘└─────┘└─────┘└─────────┘

┌─────┐┌──────────┐┌─────────┐┌───────┐
│Pref-││Conversa- ││Photo    ││Trivia │
│eren-││tion      ││Challenge││Daily  │
│ce   ││Starters  ││Cards    ││Quiz   │
│Match││Sim.      ││Dual     ││Score- │
│     ││Reveal    ││Submit   ││board  │
└─────┘└──────────┘└─────────┘└───────┘

Interlocking connections:
• Wishlist votes → inform Preference Matcher results
• Photo Challenges → feed into Gallery (shared photos)
• Surprise Planner → can reference Wishlist "both want" items
• Trivia questions → reference actual trip destinations
• Conversation Starters → build up to trip themes
• Packing claims → reduce duplicate items
• Stamps race → creates friendly competition across all days
• Daily Reveals → reactions show personality alignment
```

## Execution Order

**Phase 1 (Foundation):** Tasks 1–5 — Firebase setup, auth, sync, storage
**Phase 2 (Upgrade existing):** Tasks 6–11 — Make 6 existing features collaborative
**Phase 3 (New features):** Tasks 12–17 — Build 7 new interactive features
**Phase 4 (Polish):** Tasks 18–19 — Retire old sync, security rules

Each phase builds on the previous. Phase 1 must complete before any other phase. Phases 2 and 3 can be parallelized (tasks within each phase are independent of each other).
