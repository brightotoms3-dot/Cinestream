import { DownloadItem } from '../types';

/**
 * In-app downloads library.
 *
 * Entries live ONLY inside the app's private IndexedDB database.
 * Nothing is written to the phone's gallery, files, or camera roll —
 * downloads stay in the app and can be watched from the Downloads tab.
 */

const DB_NAME = 'cinepulse_downloads';
const DB_VERSION = 1;
const STORE_NAME = 'downloads';

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
};

const runTx = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const request = action(tx.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const downloadKey = (
  kind: 'movie' | 'season',
  tmdbId: number | string,
  seasonNumber?: number
): string => (kind === 'movie' ? `movie-${tmdbId}` : `tv-${tmdbId}-s${seasonNumber ?? 1}`);

export const listDownloads = async (): Promise<DownloadItem[]> => {
  try {
    const items = await runTx<DownloadItem[]>('readonly', store => store.getAll() as IDBRequest<DownloadItem[]>);
    return (items || []).sort((a, b) => (a.downloadedAt < b.downloadedAt ? 1 : -1));
  } catch (e) {
    console.error('Failed to list downloads:', e);
    return [];
  }
};

export const getDownload = async (id: string): Promise<DownloadItem | undefined> => {
  try {
    return await runTx<DownloadItem | undefined>('readonly', store => store.get(id) as IDBRequest<DownloadItem | undefined>);
  } catch (e) {
    console.error('Failed to get download:', e);
    return undefined;
  }
};

export const isDownloaded = async (id: string): Promise<boolean> => {
  return !!(await getDownload(id));
};

export const saveDownload = async (item: DownloadItem): Promise<void> => {
  await runTx('readwrite', store => store.put(item));
};

export const removeDownload = async (id: string): Promise<void> => {
  await runTx('readwrite', store => store.delete(id));
};
