import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadImage(
  tripId: string,
  folder: 'postcards' | 'challenges' | 'audio',
  dataOrBlob: string | Blob,
  filename?: string
): Promise<string> {
  const path = `trips/${tripId}/${folder}/${filename || crypto.randomUUID()}`;
  const storageRef = ref(storage, path);

  let blob: Blob;
  if (typeof dataOrBlob === 'string') {
    const res = await fetch(dataOrBlob);
    blob = await res.blob();
  } else {
    blob = dataOrBlob;
  }

  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function deleteFile(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (e) {
    console.warn('[storage] delete failed:', e);
  }
}
