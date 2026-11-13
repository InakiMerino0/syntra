// Contract shared by the Informe screen and the PDF generator.
// "Informe de Evidencia Ambiental": Syntra does NOT certify compliance (FSA/RTRS/ISCC/etc. do); it certifies that the
// evidence in the report is a faithful, unaltered record (integrity), sealed in the Blockchain Federal Argentina (simulated).
import type { Certificacion, Corredor, Lote } from '@synta/data';
import { corredores } from '@synta/data';
import type { SelloGuardado } from './sellado';

export const INFORME_NOMBRE = 'Informe de Evidencia Ambiental';
export { RED_BFA as RED_SELLADO, RED_SIMULADA } from './sellado';
export const URL_VERIFICACION = 'https://syntra-agro.vercel.app/trazabilidad';

export interface ArchivoEvidencia { archivo: string; descripcion: string; bytes: number; hash: string }
export interface Sellado { hashManifiesto: string; raizMerkle: string }
export interface EvidenciaInforme {
  id: string;              // deterministic per certification, e.g. SYN-2026-000184-FSA
  certId: string;          // e.g. 'fsa'
  emitido: string;         // ISO date-time
  certObjetivo: string;    // e.g. 'FSA (SAI Platform)'
  lotes: Lote[];
  archivos: ArchivoEvidencia[]; // inventory, one per evidence file, real SHA-256
  sellado: Sellado;
  revision: RevisionAuditor | null; // external review loaded by the producer (sealed as revision-auditor.json), if any
}

/** Builds the evidence (real SHA-256 per file + Merkle root). `emitidoFijo` reuses a sealed emission date so the root reproduces. Implemented in informePdf.ts. */
export type ConstruirEvidencia = (lotes: Lote[], certId?: string, revision?: RevisionAuditor | null, emitidoFijo?: string) => Promise<EvidenciaInforme>;
/** Generates and downloads the multi-page PDF (prints the seal state if `sello` is given). Implemented in informePdf.ts. */
export type DescargarInforme = (lotes: Lote[], certId?: string, revision?: RevisionAuditor | null, sello?: SelloGuardado | null) => Promise<void>;

// ---------- One report per certification ----------

const ID_BASE = 'SYN-2026-000184';
export const informeId = (certId: string) => `${ID_BASE}-${certId.toUpperCase()}`;

/** Corridors named in the fix text of the certification's requirements ("corredores B y C"); empty = corridors not relevant. */
export function corredoresDeCert(cert: Certificacion): Corredor[] {
  const letras = new Set(cert.items.flatMap((r) => (/corredor/i.test(r.fix ?? '') ? (r.fix ?? '').match(/\b[A-Z]\b/g) ?? [] : [])));
  return corredores.filter((c) => letras.has(c.id));
}

/** Removes mentions of other standards in parentheses, e.g. "(FSA)" in an event title when the report is for RTRS. */
export function limpiarOtrasCerts(texto: string, cert: Certificacion): string {
  const propias = [cert.id, cert.label.split(' ')[0]].map((x) => x.toLowerCase());
  return texto.replace(/\s*\((FSA|ISCC|RTRS|EUDR)\b[^)]*\)/gi, (m, k: string) => (propias.includes(k.toLowerCase()) ? m : ''));
}

// ---------- External review (loaded by the producer; NOT a Syntra signature) ----------

export type Dictamen = 'aprobado' | 'observaciones' | 'rechazado';
export const DICTAMEN_LABEL: Record<Dictamen, string> = { aprobado: 'Aprobado', observaciones: 'Con observaciones', rechazado: 'Rechazado' };
export interface RevisionAuditor { nombre: string; organismo: string; matricula: string; fecha: string; dictamen: Dictamen | ''; observaciones: string }
export const REVISION_VACIA: RevisionAuditor = { nombre: '', organismo: '', matricula: '', fecha: '', dictamen: '', observaciones: '' };
export const ESTADO_REVISION = 'Listo para revisión del auditor de la certificadora';
export const TITULO_DICTAMEN = 'Dictamen de revisión externa (cargado por el productor)';

/** A review counts as loaded when it has at least the auditor's name and a dictamen. */
export const revisionCompleta = (r: RevisionAuditor | null | undefined): r is RevisionAuditor & { dictamen: Dictamen } => !!r && !!r.nombre.trim() && !!r.dictamen;

const claveRevision = (certId: string) => `syntra.informe.revision.${certId}`;
export function cargarRevision(certId: string): RevisionAuditor | null {
  try {
    const raw = localStorage.getItem(claveRevision(certId));
    if (!raw) return null;
    const r = { ...REVISION_VACIA, ...(JSON.parse(raw) as Partial<RevisionAuditor>) };
    return revisionCompleta(r) ? r : null;
  } catch { return null; }
}
export function guardarRevision(certId: string, r: RevisionAuditor | null): boolean {
  try {
    if (r) localStorage.setItem(claveRevision(certId), JSON.stringify(r)); else localStorage.removeItem(claveRevision(certId));
    return true;
  } catch { return false; }
}
