// Contract shared by the Informe screen and the PDF generator.
// "Informe de Evidencia Ambiental": Syntra does NOT certify compliance (FSA/RTRS/ISCC/etc. do); it certifies that the
// evidence in the report is a faithful, unaltered record (integrity), sealed in the Blockchain Federal Argentina (simulated).
import type { Lote } from '@synta/data';

export const INFORME_NOMBRE = 'Informe de Evidencia Ambiental';
export const RED_SELLADO = 'Blockchain Federal Argentina (BFA) · simulado';
export const URL_VERIFICACION = 'https://syntra-agro.vercel.app/trazabilidad';

export interface ArchivoEvidencia { archivo: string; descripcion: string; bytes: number; hash: string }
export interface Sellado { hashManifiesto: string; raizMerkle: string; transaccion: string; bloque: string; fecha: string }
export interface EvidenciaInforme {
  id: string;              // e.g. SYN-2026-000184
  emitido: string;         // ISO date-time
  certObjetivo: string;    // e.g. 'FSA (SAI Platform)'
  lotes: Lote[];
  archivos: ArchivoEvidencia[]; // inventory, one per evidence file, real SHA-256
  sellado: Sellado;
}

/** Builds the evidence (real SHA-256 per file + Merkle root; anchoring simulated). Implemented in informePdf.ts. */
export type ConstruirEvidencia = (lotes: Lote[], certId?: string) => Promise<EvidenciaInforme>;
/** Generates and downloads the multi-page PDF. Implemented in informePdf.ts. */
export type DescargarInforme = (lotes: Lote[], certId?: string) => Promise<void>;
