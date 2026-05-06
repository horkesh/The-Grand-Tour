import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  Unsubscribe,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

let activeListeners: Unsubscribe[] = [];
let _initialized = false;

// Module-level sync guard — not in Zustand so it doesn't trigger renders
let _isSyncing = false;
export function isSyncing() { return _isSyncing; }
export function setSyncing(v: boolean) { _isSyncing = v; }

export function isSyncInitialized() { return _initialized; }

export function teardownSync() {
  activeListeners.forEach((unsub) => unsub());
  activeListeners = [];
  _initialized = false;
}

/** Call before setting up listeners to prevent duplicates. */
export function markSyncInitialized() { _initialized = true; }

export function listenDoc(
  path: string,
  onChange: (data: DocumentData) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const unsub = onSnapshot(
    doc(db, path),
    (snap) => { if (snap.exists()) onChange(snap.data()); },
    (err) => {
      console.error(`[firestoreSync] listenDoc(${path}) failed:`, err);
      onError?.(err);
    },
  );
  activeListeners.push(unsub);
  return unsub;
}

export function listenCollection(
  path: string,
  onChange: (docs: Array<{ id: string; data: DocumentData }>) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const unsub = onSnapshot(
    collection(db, path),
    (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
      onChange(docs);
    },
    (err) => {
      console.error(`[firestoreSync] listenCollection(${path}) failed:`, err);
      onError?.(err);
    },
  );
  activeListeners.push(unsub);
  return unsub;
}

export async function writeDoc(path: string, data: Record<string, unknown>) {
  await setDoc(doc(db, path), data, { merge: true });
}

export async function patchDoc(path: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, path), data);
}

export async function removeDoc(path: string) {
  await deleteDoc(doc(db, path));
}

export async function readCollection(path: string): Promise<Array<{ id: string; data: DocumentData }>> {
  const snap = await getDocs(collection(db, path));
  return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

export async function batchWrite(ops: Array<{ path: string; data: Record<string, unknown>; op: 'set' | 'update' | 'delete' }>) {
  const batch = writeBatch(db);
  for (const { path, data, op } of ops) {
    const ref = doc(db, path);
    if (op === 'set') batch.set(ref, data, { merge: true });
    else if (op === 'update') batch.update(ref, data);
    else if (op === 'delete') batch.delete(ref);
  }
  await batch.commit();
}
