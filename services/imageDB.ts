const DB_NAME = 'grand-tour-images';
const STORE_NAME = 'waypoint-images';
const POSTCARDS_STORE = 'postcards';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      // v2: postcards store. Each entry is a single base64 data URL keyed by
      // `${cityKey}::${randomId}` so we can store many per city without the
      // 1 MB Firestore-doc / 5 MB localStorage limits we kept hitting.
      if (e.oldVersion < 2 && !db.objectStoreNames.contains(POSTCARDS_STORE)) {
        db.createObjectStore(POSTCARDS_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getImage(key: string): Promise<string | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result ?? undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function setImage(key: string, data: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Delete every cached image whose key starts with `prefix` (e.g. "day-5"). */
export async function deleteImagesByPrefix(prefix: string): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    let deleted = 0;
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const key = String(cursor.key);
        if (key === prefix || key.startsWith(`${prefix}_`)) {
          cursor.delete();
          deleted += 1;
        }
        cursor.continue();
      } else {
        resolve(deleted);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAllImages(): Promise<Record<string, string>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const result: Record<string, string> = {};
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        result[cursor.key as string] = cursor.value;
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/** Append a new postcard data URL for the given city/stop key. Returns the IDB id. */
export async function addPostcardEntry(cityKey: string, dataUrl: string): Promise<string> {
  const db = await openDB();
  const id = `${cityKey}::${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(POSTCARDS_STORE, 'readwrite');
    tx.objectStore(POSTCARDS_STORE).put(dataUrl, id);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

/** Read all postcards back as Record<cityKey, dataUrl[]>. */
export async function getAllPostcards(): Promise<Record<string, string[]>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(POSTCARDS_STORE, 'readonly');
    const store = tx.objectStore(POSTCARDS_STORE);
    const result: Record<string, string[]> = {};
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const key = cursor.key as string;
        const cityKey = key.split('::')[0];
        if (!result[cityKey]) result[cityKey] = [];
        result[cityKey].push(cursor.value);
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/** Wipe all postcards (used by /photos refresh). */
export async function clearAllPostcards(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(POSTCARDS_STORE, 'readwrite');
    tx.objectStore(POSTCARDS_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
