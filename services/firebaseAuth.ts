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
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { TripMeta, TripUser } from '../types';

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function signInWithGoogle(): Promise<User> {
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
