// Queue of signed actions created while offline. IndexedDB, with a localStorage fallback.
// The hash is computed locally at signing time, so nothing is lost. There is no backend in this prototype:
// "flushing" just marks the entries as synced; with a real API this is where they'd be POSTed.
import { useSyncExternalStore } from 'react';

export interface AccionPendiente { id: string; hash: string; resumen: string; creada: number; sincronizada: boolean }

const DB = 'syntra-offline', STORE = 'acciones', LS = 'syntra.cola.v1';
let cache: AccionPendiente[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function openDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    if (typeof indexedDB === 'undefined') return rej(new Error('no idb'));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function persistir(a: AccionPendiente[]) {
  try {
    const db = await openDb();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      const s = tx.objectStore(STORE);
      s.clear();
      a.forEach((x) => s.put(x));
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch {
    try { localStorage.setItem(LS, JSON.stringify(a)); } catch { /* ignore */ }
  }
}

async function cargar() {
  try {
    const db = await openDb();
    cache = await new Promise<AccionPendiente[]>((res, rej) => {
      const r = db.transaction(STORE).objectStore(STORE).getAll();
      r.onsuccess = () => res(r.result as AccionPendiente[]);
      r.onerror = () => rej(r.error);
    });
  } catch {
    try { cache = JSON.parse(localStorage.getItem(LS) ?? '[]') as AccionPendiente[]; } catch { cache = []; }
  }
  emit();
}
void cargar();

export async function encolar(hash: string, resumen: string): Promise<void> {
  cache = [...cache, { id: `${Date.now()}-${hash.slice(0, 8)}`, hash, resumen, creada: Date.now(), sincronizada: false }];
  emit();
  await persistir(cache);
}

/** Marks pending entries as synced (no backend here). Returns how many were flushed. */
export async function sincronizar(): Promise<number> {
  const n = cache.filter((a) => !a.sincronizada).length;
  if (!n) return 0;
  cache = cache.map((a) => ({ ...a, sincronizada: true }));
  emit();
  await persistir(cache);
  return n;
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const usePendientes = () => useSyncExternalStore(subscribe, () => cache, () => cache);

export function useOnline(): boolean {
  return useSyncExternalStore(
    (l) => { window.addEventListener('online', l); window.addEventListener('offline', l); return () => { window.removeEventListener('online', l); window.removeEventListener('offline', l); }; },
    () => navigator.onLine,
    () => true,
  );
}
