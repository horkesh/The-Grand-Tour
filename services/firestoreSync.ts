import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

let activeListeners: Unsubscribe[] = [];

export function teardownSync() {
  activeListeners.forEach((unsub) => unsub());
  activeListeners = [];
}

export function listenDoc(
  path: string,
  onChange: (data: any) => void
): Unsubscribe {
  const unsub = onSnapshot(doc(db, path), (snap) => {
    if (snap.exists()) onChange(snap.data());
  });
  activeListeners.push(unsub);
  return unsub;
}

export function listenCollection(
  path: string,
  onChange: (docs: Array<{ id: string; data: any }>) => void
): Unsubscribe {
  const unsub = onSnapshot(collection(db, path), (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    onChange(docs);
  });
  activeListeners.push(unsub);
  return unsub;
}

export async function writeDoc(path: string, data: any) {
  await setDoc(doc(db, path), data, { merge: true });
}

export async function patchDoc(path: string, data: any) {
  await updateDoc(doc(db, path), data);
}

export async function removeDoc(path: string) {
  await deleteDoc(doc(db, path));
}

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
