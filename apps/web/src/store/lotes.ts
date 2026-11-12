// Shared, session-persisted list of lots. Mapa writes to it; Panel, Lote, Procesando, Accion read it,
// so a lot drawn on the map exists everywhere (until the browser tab is closed).
import { useSyncExternalStore } from 'react';
import { lotes as lotesIniciales, type Lote } from '@synta/data';

const KEY = 'syntra.lotes.v1';

function load(): Lote[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Lote[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch { /* storage blocked or corrupt: fall back to the mock data */ }
  return lotesIniciales;
}

let state: Lote[] = load();
const listeners = new Set<() => void>();

export function setLotes(next: Lote[] | ((prev: Lote[]) => Lote[])) {
  state = typeof next === 'function' ? next(state) : next;
  try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function resetLotes() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  setLotes(lotesIniciales);
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => state;

/** All lots (mock + drawn by the user). */
export function useLotes(): Lote[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** One lot by id, or undefined when it doesn't exist. */
export function useLote(id: string | undefined): Lote | undefined {
  const all = useLotes();
  return all.find((l) => l.id === id);
}

/** Mock lots that come with a full diagnosis in the demo data (certification, corridors, monitoring). */
export const LOTE_CON_DIAGNOSTICO = 'l3';
