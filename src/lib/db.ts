/**
 * Local persistence layer (IndexedDB).
 *
 * Everything the app needs goes through this module, so a real backend can be
 * swapped in later by re-implementing these functions only.
 */
import type { Journal } from "./types";

const DB_NAME = "jeevana-ejournal";
const DB_VERSION = 1;
const JOURNALS = "journals";
const IMAGES = "images";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(JOURNALS)) db.createObjectStore(JOURNALS, { keyPath: "id" });
        if (!db.objectStoreNames.contains(IMAGES)) db.createObjectStore(IMAGES);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function listJournals(): Promise<Journal[]> {
  const all = await tx<Journal[]>(JOURNALS, "readonly", (s) => s.getAll());
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getJournal(id: string): Promise<Journal | undefined> {
  return tx<Journal | undefined>(JOURNALS, "readonly", (s) => s.get(id));
}

export async function saveJournal(journal: Journal): Promise<Journal> {
  const next = { ...journal, updatedAt: Date.now() };
  await tx(JOURNALS, "readwrite", (s) => s.put(next));
  return next;
}

export function deleteJournal(id: string): Promise<unknown> {
  return tx(JOURNALS, "readwrite", (s) => s.delete(id));
}

/** Images are stored as data URLs, keyed by photo id. */
export function putImage(id: string, dataUrl: string): Promise<unknown> {
  return tx(IMAGES, "readwrite", (s) => s.put(dataUrl, id));
}

export function getImage(id: string): Promise<string | undefined> {
  return tx<string | undefined>(IMAGES, "readonly", (s) => s.get(id));
}

export async function getImages(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    ids.map(async (id) => {
      const v = await getImage(id).catch(() => undefined);
      if (v) out[id] = v;
    }),
  );
  return out;
}

export function deleteImage(id: string): Promise<unknown> {
  return tx(IMAGES, "readwrite", (s) => s.delete(id));
}