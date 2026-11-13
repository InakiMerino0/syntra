// Sealing adapter: the single place where "anchor this hash on a chain" is decided.
// Today the app uses SelladorSimulado (deterministic, no network). SelladorBFA is a stub for the real
// time-stamping service of the Blockchain Federal Argentina (https://bfa.ar): it is NOT tested against any real
// endpoint because the team still has to onboard with the BFA and confirm endpoint and terms of use.

export interface SelloInfo {
  /** Hash that was sealed (hex, no 0x prefix). */
  hash: string;
  /** Transaction id (0x-prefixed). */
  tx: string;
  /** Block number, formatted es-AR style (e.g. "52.345.678"). */
  bloque: string;
  /** ISO-8601 timestamp of the seal. */
  fecha: string;
  /** Human readable network label. */
  red: string;
  /** true when nothing was actually written on a chain. */
  simulado: boolean;
}

export interface Sellador {
  sellar(hashHex: string): Promise<SelloInfo>;
  verificar(hashHex: string, sello: SelloInfo): Promise<boolean>;
}

const enc = new TextEncoder();

async function sha256Hex(input: string): Promise<string> {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', enc.encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const formatearMiles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const limpiar = (h: string) => h.trim().toLowerCase().replace(/^0x/, '');

export const RED_SIMULADA = 'Blockchain Federal Argentina (BFA) · simulado';

/** Same derivation as informePdf.ts: block and tx come deterministically from the (Merkle root) hash. */
export class SelladorSimulado implements Sellador {
  private async derivar(hash: string): Promise<Pick<SelloInfo, 'tx' | 'bloque'>> {
    return {
      bloque: formatearMiles(50_000_000 + (parseInt(hash.slice(0, 7), 16) % 9_000_000)),
      tx: '0x' + (await sha256Hex('tx:' + hash)),
    };
  }

  async sellar(hashHex: string): Promise<SelloInfo> {
    const hash = limpiar(hashHex);
    const { tx, bloque } = await this.derivar(hash);
    const segundos = 20 + (parseInt(hash.slice(7, 12), 16) % 100);
    return { hash, tx, bloque, fecha: new Date(Date.now() + segundos * 1000).toISOString(), red: RED_SIMULADA, simulado: true };
  }

  async verificar(hashHex: string, sello: SelloInfo): Promise<boolean> {
    const hash = limpiar(hashHex);
    if (limpiar(sello.hash) !== hash) return false;
    const { tx, bloque } = await this.derivar(hash);
    return sello.tx === tx && sello.bloque === bloque;
  }
}

/**
 * UNTESTED stub. Expects VITE_BFA_TSA_URL to point to a base URL exposing (assumed contract, to be replaced by
 * the real one once the BFA confirms it):
 *   POST {url}/sellar    body {hash}                -> {tx, bloque, fecha}
 *   POST {url}/verificar body {hash, tx, bloque}    -> {valido: boolean}
 * Ideally this URL is OUR backend sealing worker (daily Merkle root), never a client holding BFA credentials.
 */
export class SelladorBFA implements Sellador {
  constructor(private readonly url: string | undefined = import.meta.env.VITE_BFA_TSA_URL as string | undefined) {}

  private base(): string {
    if (!this.url) throw new Error('No configurado: definí VITE_BFA_TSA_URL (servicio de sellado de la BFA) para usar el sellado real.');
    return this.url.replace(/\/$/, '');
  }

  async sellar(hashHex: string): Promise<SelloInfo> {
    const base = this.base();
    const hash = limpiar(hashHex);
    const r = await fetch(`${base}/sellar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash }) });
    if (!r.ok) throw new Error(`Sellado BFA falló: HTTP ${r.status}`);
    const j = (await r.json()) as { tx: string; bloque: string | number; fecha?: string };
    return { hash, tx: j.tx, bloque: String(j.bloque), fecha: j.fecha ?? new Date().toISOString(), red: 'Blockchain Federal Argentina (BFA)', simulado: false };
  }

  async verificar(hashHex: string, sello: SelloInfo): Promise<boolean> {
    const base = this.base();
    const r = await fetch(`${base}/verificar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash: limpiar(hashHex), tx: sello.tx, bloque: sello.bloque }) });
    if (!r.ok) throw new Error(`Verificación BFA falló: HTTP ${r.status}`);
    return Boolean(((await r.json()) as { valido?: boolean }).valido);
  }
}

/** Real sealer only when VITE_BFA_TSA_URL is set; otherwise the deterministic simulation. */
export function obtenerSellador(): Sellador {
  const url = import.meta.env.VITE_BFA_TSA_URL as string | undefined;
  return url ? new SelladorBFA(url) : new SelladorSimulado();
}
