// Session store for the imported yield map (in memory + sessionStorage when it fits). Same pattern as store/lotes.ts.
import { useSyncExternalStore } from 'react';
import type { Resultado } from '../lib/rendimiento';

export interface Importado { nombre: string; columna: string; resultado: Resultado }
const KEY = 'syntra.rendimiento.v1';

function load(): Importado | null {
  try { const raw = sessionStorage.getItem(KEY); return raw ? (JSON.parse(raw) as Importado) : null; } catch { return null; }
}
let state: Importado | null = load();
const listeners = new Set<() => void>();

export function setRendimiento(next: Importado | null) {
  state = next;
  try { if (next) sessionStorage.setItem(KEY, JSON.stringify(next)); else sessionStorage.removeItem(KEY); } catch { /* too big or blocked: keep in memory only */ }
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useRendimiento = () => useSyncExternalStore(subscribe, () => state, () => state);
