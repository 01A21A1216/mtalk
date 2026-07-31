import type { CustomStory, CustomTile } from '../types';

/**
 * Minimal IndexedDB wrapper for custom tiles and social stories. localStorage
 * is too small for photos + audio recordings, so those live here.
 */

const DB_NAME = 'mtalk';
const STORE = 'customTiles';
const STORY_STORE = 'customStories';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
      if (!req.result.objectStoreNames.contains(STORY_STORE)) {
        req.result.createObjectStore(STORY_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getAllTiles(): Promise<CustomTile[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as CustomTile[]);
    req.onerror = () => reject(req.error);
  });
}

export async function putTile(tile: CustomTile): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(tile);
  return txDone(tx);
}

export async function deleteTile(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
  return txDone(tx);
}

export async function getAllStories(): Promise<CustomStory[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORY_STORE, 'readonly').objectStore(STORY_STORE).getAll();
    req.onsuccess = () => resolve(req.result as CustomStory[]);
    req.onerror = () => reject(req.error);
  });
}

export async function putStory(story: CustomStory): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORY_STORE, 'readwrite');
  tx.objectStore(STORY_STORE).put(story);
  return txDone(tx);
}

export async function deleteStory(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORY_STORE, 'readwrite');
  tx.objectStore(STORY_STORE).delete(id);
  return txDone(tx);
}
