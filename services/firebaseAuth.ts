import {
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
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { TripMeta, TripUser } from '../types';

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(values, v => chars[v % chars.length]).join('');
}

// Known partners — personalized names and roles
const KNOWN_PARTNERS: Record<string, { name: string; color: 'teal' | 'rust' }> = {
  'haris.daul@gmail.com': { name: 'Haris', color: 'teal' },
  'maja.daul@gmail.com': { name: 'Maja', color: 'rust' },
};

/** Build a TripUser from a Firebase User — single source of truth for shape. */
export function buildTripUser(fbUser: User, color: 'teal' | 'rust'): TripUser {
  const known = KNOWN_PARTNERS[fbUser.email || ''];
  return {
    uid: fbUser.uid,
    displayName: known?.name || fbUser.displayName || 'Partner',
    email: fbUser.email || '',
    photoURL: fbUser.photoURL,
    color: known?.color || color,
  };
}

/** Check if this email is a known partner (for auto-join). */
export function isKnownPartner(email: string | null): boolean {
  return !!email && email in KNOWN_PARTNERS;
}

export async function signInWithGoogle(): Promise<User | null> {
  // Always use redirect — popup is blocked by COOP headers on many hosts (Vercel, etc.)
  await signInWithRedirect(auth, googleProvider);
  return null; // page will reload, onAuthStateChanged handles the rest
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

  const tripUser = buildTripUser(user, 'teal');
  await setDoc(doc(db, 'trips', tripRef.id, 'users', user.uid), {
    ...tripUser,
    joinedAt: Date.now(),
  });

  return meta;
}

export async function joinTrip(user: User, joinCode: string): Promise<TripMeta> {
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
    await updateDoc(tripDoc.ref, {
      'meta.partnerIds': arrayUnion(user.uid),
    });

    const tripUser = buildTripUser(user, 'rust');
    await setDoc(doc(db, 'trips', tripDoc.id, 'users', user.uid), {
      ...tripUser,
      joinedAt: Date.now(),
    });
  }

  return { ...meta, partnerIds: [...new Set([...meta.partnerIds, user.uid])] };
}

export async function getUserTrip(uid: string): Promise<TripMeta | null> {
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

/** Find a trip created by the other known partner (for auto-join). */
export async function findTripByPartnerEmail(myEmail: string): Promise<TripMeta | null> {
  // Find the other known partner's email
  const partnerEmails = Object.keys(KNOWN_PARTNERS).filter(e => e !== myEmail);
  if (partnerEmails.length === 0) return null;

  // Search all trips for one that has the partner
  const tripsRef = collection(db, 'trips');
  const snapshot = await getDocs(tripsRef);
  for (const tripDoc of snapshot.docs) {
    const meta = tripDoc.data().meta as TripMeta;
    if (meta && meta.partnerIds.length > 0) {
      // Check if any partner in this trip matches a known partner email
      for (const pid of meta.partnerIds) {
        const userDocRef = await getDoc(doc(db, 'trips', tripDoc.id, 'users', pid));
        if (userDocRef.exists()) {
          const userData = userDocRef.data() as TripUser;
          if (partnerEmails.includes(userData.email)) {
            return meta;
          }
        }
      }
    }
  }
  return null;
}
