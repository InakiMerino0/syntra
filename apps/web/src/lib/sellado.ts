// Sealing adapter: the single place where "anchor this hash on a chain" is decided.
// Default: REAL sealing in the Blockchain Federal Argentina, "Sello de Tiempo 1.0" (TSA1), called straight from the
// browser (tsaapi.bfa.ar answers CORS with `Access-Control-Allow-Origin: *`, no keys). SelladorSimulado is only the
// fallback (offline / BFA error / VITE_SELLADO=simulado) and is always labelled "simulado".
//
// TSA1 flow (verified against the real service):
//   POST /api/tsa/stamp/  {file_hash}        -> {temporary_rd, status:"success"}   ("success" = RECEIVED, not sealed yet)
//   POST /api/tsa/verify/ {file_hash, rd}    -> {status:"pending"} ... minutes later
//                                               {status:"success", messages:"... bloque N el ...", attestation_time, permanent_rd}
// Public verification of TSA1 is NOT by hash: at https://bfa.ar/sello#tab_3 the user uploads the ORIGINAL FILE + the
// receipt (.rd). That is why Syntra seals the SHA-256 of an "acta" file the user can download.

export type EstadoSello = 'pendiente' | 'confirmado';

export interface ResultadoEnvio { estado: 'pendiente'; rd: string; enviadoEn: string }
export type ResultadoConsulta =
  | { estado: 'pendiente' }
  | { estado: 'confirmado'; bloque: string; fecha: string; permanentRd: string }
  | { estado: 'error'; mensaje: string };

export interface Sellador {
  /** Short label of the network/service, e.g. for the UI. */
  readonly red: string;
  /** true when nothing is written on any chain. */
  readonly simulado: boolean;
  sellar(hashHex: string): Promise<ResultadoEnvio>;
  consultar(hashHex: string, rd: string): Promise<ResultadoConsulta>;
}

/** What we keep in localStorage per sealed hash. */
export interface SelloGuardado {
  hash: string;
  rd: string;
  estado: EstadoSello;
  bloque?: string;
  /** As returned by BFA ("dd/mm/yyyy HH:MM:SS", Argentina time assumed). */
  fecha?: string;
  permanentRd?: string;
  enviadoEn: string;
  actaNombre: string;
  /** true if sealed with the fallback simulation. */
  simulado: boolean;
  /** `emitido` of the evidence the acta was built from, so the root can be reproduced. */
  emitido?: string;
  certId?: string;
  /** The acta text itself, so it can be downloaded again byte for byte. */
  acta?: string;
}

export const RED_BFA = 'Blockchain Federal Argentina (BFA) — Sello de Tiempo 1.0';
export const RED_SIMULADA = 'Blockchain Federal Argentina (BFA) · simulado';
export const URL_BFA_VERIFICAR = 'https://bfa.ar/sello#tab_3';
export const INSTRUCCION_BFA = 'Para verificar: entrá a bfa.ar/sello, subí el acta (.json) y el recibo (.rd).';
export const TIMEOUT_MS = 20_000;

const BASE_BFA = 'https://tsaapi.bfa.ar';
const enc = new TextEncoder();

async function sha256Hex(input: string): Promise<string> {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', enc.encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const formatearMiles = (n: number | string) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const formatearBloque = (b: string) => (/^\d+$/.test(b) ? formatearMiles(b) : b);
const limpiar = (h: string) => h.trim().toLowerCase().replace(/^0x/, '');
const dos = (n: number) => String(n).padStart(2, '0');

/** "dd/mm/yyyy HH:MM:SS" in Argentina time (UTC-3, no DST). */
function fechaArgentina(d: Date): string {
  const a = new Date(d.getTime() - 3 * 3600_000);
  return `${dos(a.getUTCDate())}/${dos(a.getUTCMonth() + 1)}/${a.getUTCFullYear()} ${dos(a.getUTCHours())}:${dos(a.getUTCMinutes())}:${dos(a.getUTCSeconds())}`;
}

/** Block number from a TSA1 verify response: "bloque N" in `messages`, else the last '-' segment of the decoded permanent_rd. */
export function bloqueDeRespuesta(j: { messages?: unknown; permanent_rd?: unknown }): string | null {
  const m = /bloque (\d+)/.exec(String(j.messages ?? ''));
  if (m) return m[1];
  try {
    const ultimo = globalThis.atob(String(j.permanent_rd ?? '')).split('-').pop() ?? '';
    return /^\d+$/.test(ultimo) ? ultimo : null;
  } catch { return null; }
}

async function postJson(url: string, body: unknown): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
    if (!r.ok) throw new Error(`BFA respondió HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw new Error('La BFA no respondió a tiempo.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Real sealing in the BFA (TSA1). `sellar` throws on network/service errors: the caller falls back to the simulation. */
export class SelladorBFA implements Sellador {
  readonly red = RED_BFA;
  readonly simulado = false;

  async sellar(hashHex: string): Promise<ResultadoEnvio> {
    const j = (await postJson(`${BASE_BFA}/api/tsa/stamp/`, { file_hash: limpiar(hashHex) })) as { temporary_rd?: string; status?: string };
    if (j.status !== 'success' || !j.temporary_rd) throw new Error('La BFA no confirmó la recepción del hash.');
    // "success" here only means RECEIVED: the seal enters a block some minutes later.
    return { estado: 'pendiente', rd: j.temporary_rd, enviadoEn: new Date().toISOString() };
  }

  async consultar(hashHex: string, rd: string): Promise<ResultadoConsulta> {
    try {
      const j = (await postJson(`${BASE_BFA}/api/tsa/verify/`, { file_hash: limpiar(hashHex), rd })) as {
        status?: string; messages?: unknown; attestation_time?: unknown; permanent_rd?: unknown;
      };
      if (j.status === 'pending') return { estado: 'pendiente' };
      if (j.status !== 'success') return { estado: 'error', mensaje: typeof j.messages === 'string' && j.messages ? j.messages : 'La BFA devolvió un estado desconocido.' };
      const bloque = bloqueDeRespuesta(j);
      if (!bloque) return { estado: 'error', mensaje: 'La BFA confirmó el sello pero no pudimos leer el número de bloque.' };
      // ⚠ sin confirmar: attestation_time se asume en hora argentina.
      const fecha = typeof j.attestation_time === 'string' && j.attestation_time ? j.attestation_time : fechaArgentina(new Date());
      return { estado: 'confirmado', bloque, fecha, permanentRd: typeof j.permanent_rd === 'string' ? j.permanent_rd : '' };
    } catch (e) {
      return { estado: 'error', mensaje: e instanceof Error ? e.message : 'No pudimos consultar a la BFA.' };
    }
  }
}

/** Fallback: deterministic, no network. Everything it returns is labelled "simulado" by the UI. */
export class SelladorSimulado implements Sellador {
  readonly red = RED_SIMULADA;
  readonly simulado = true;

  async sellar(hashHex: string): Promise<ResultadoEnvio> {
    return { estado: 'pendiente', rd: 'SIMULADO-' + limpiar(hashHex), enviadoEn: new Date().toISOString() };
  }

  async consultar(hashHex: string): Promise<ResultadoConsulta> {
    const hash = limpiar(hashHex);
    const bloque = String(50_000_000 + (parseInt(hash.slice(0, 7), 16) % 9_000_000));
    const permanentRd = 'SIMULADO-' + (await sha256Hex('tx:' + hash));
    return { estado: 'confirmado', bloque, fecha: fechaArgentina(new Date()), permanentRd };
  }
}

/** Real BFA by default; `VITE_SELLADO=simulado` forces the simulation. */
export function obtenerSellador(): Sellador {
  const modo = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SELLADO;
  return modo === 'simulado' ? new SelladorSimulado() : new SelladorBFA();
}

/** Real sealer; if the very first call fails (offline, BFA down) seals in simulation and says so. */
export async function sellarConFallback(hashHex: string): Promise<{ sellador: Sellador; envio: ResultadoEnvio; fallo?: string }> {
  const principal = obtenerSellador();
  try {
    return { sellador: principal, envio: await principal.sellar(hashHex) };
  } catch (e) {
    if (principal.simulado) throw e;
    const sim = new SelladorSimulado();
    return { sellador: sim, envio: await sim.sellar(hashHex), fallo: e instanceof Error ? e.message : 'No pudimos contactar a la BFA.' };
  }
}

// ---------- Persistence (localStorage, always try/catch) ----------

const claveHash = (h: string) => `syntra.sello.${limpiar(h)}`;
const claveCert = (certId: string) => `syntra.sello.cert.${certId}`;

export function guardarSelloLocal(s: SelloGuardado): boolean {
  try {
    localStorage.setItem(claveHash(s.hash), JSON.stringify(s));
    if (s.certId) localStorage.setItem(claveCert(s.certId), limpiar(s.hash));
    return true;
  } catch { return false; }
}

export function cargarSelloLocal(hash: string): SelloGuardado | null {
  try {
    const raw = localStorage.getItem(claveHash(hash));
    return raw ? (JSON.parse(raw) as SelloGuardado) : null;
  } catch { return null; }
}

/** Latest seal made for this certification's report, if any. */
export function selloDeCert(certId: string): SelloGuardado | null {
  try {
    const h = localStorage.getItem(claveCert(certId));
    return h ? cargarSelloLocal(h) : null;
  } catch { return null; }
}
