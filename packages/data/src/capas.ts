// Landscape layers for the connectivity model (mock). Coordinates are [lat, lng].
// The team's method: 5 layers (rendimiento, suelo/inundables, cobertura NDVI, parches de bosque, biodiversidad funcional)
// are combined into a resistance surface; Circuitscape (circuit theory) computes the current between forest patches
// → the "sixth layer" heat map, and the corridor follows the high-current, low-yield cells.
import type { LatLng } from './index';

/** Small forest patches in the agricultural landscape (not large native forests). Focal nodes for Circuitscape. */
export interface ParcheBosque { id: string; nombre: string; ha: number; polygon: LatLng[] }
export const parchesBosque: ParcheBosque[] = [
  { id: 'P1', nombre: 'Parche oeste (cortina de algarrobos)', ha: 4.1, polygon: [[-30.1192, -63.4985], [-30.1192, -63.4958], [-30.1212, -63.4955], [-30.1214, -63.4983]] },
  { id: 'P2', nombre: 'Parche este (monte)', ha: 18.6, polygon: [[-30.1205, -63.4760], [-30.1205, -63.4712], [-30.1290, -63.4708], [-30.1295, -63.4757]] },
  { id: 'P3', nombre: 'Parche norte (bajo con talas)', ha: 2.7, polygon: [[-30.1068, -63.4822], [-30.1068, -63.4795], [-30.1086, -63.4793], [-30.1087, -63.4820]] },
];

/** Historical yield map from the combine monitors: low-yield zones are where green infrastructure goes. */
export interface ZonaRendimiento { nivel: 'bajo' | 'medio'; loteId: string; rindePct: number; polygon: LatLng[] }
export const zonasRendimiento: ZonaRendimiento[] = [
  { nivel: 'bajo', loteId: 'l3', rindePct: 62, polygon: [[-30.1258, -63.4940], [-30.1258, -63.4880], [-30.1290, -63.4878], [-30.1293, -63.4938]] },
  { nivel: 'bajo', loteId: 'l3', rindePct: 70, polygon: [[-30.1212, -63.4948], [-30.1212, -63.4852], [-30.1222, -63.4852], [-30.1222, -63.4948]] },
  { nivel: 'medio', loteId: 'l4', rindePct: 81, polygon: [[-30.1240, -63.4790], [-30.1240, -63.4765], [-30.1282, -63.4762], [-30.1285, -63.4788]] },
  { nivel: 'bajo', loteId: 'l2', rindePct: 68, polygon: [[-30.1100, -63.4815], [-30.1100, -63.4790], [-30.1125, -63.4790], [-30.1125, -63.4815]] },
];

/** Flood-prone areas (napa alta / bajos): low yield, good for native vegetation that tolerates waterlogging. */
export const zonasInundables: { id: string; nombre: string; polygon: LatLng[] }[] = [
  { id: 'I1', nombre: 'Bajo de El Bajo', polygon: [[-30.1262, -63.4915], [-30.1262, -63.4885], [-30.1285, -63.4882], [-30.1288, -63.4912]] },
  { id: 'I2', nombre: 'Cañada norte', polygon: [[-30.1090, -63.4818], [-30.1090, -63.4800], [-30.1108, -63.4798], [-30.1110, -63.4816]] },
];

/** Grid extent used by the connectivity model (covers all lots and patches). */
export const extensionModelo = { norte: -30.1060, sur: -30.1305, oeste: -63.4995, este: -63.4700 };

export const fuenteConectividad = 'Modelado de conectividad con Circuitscape (teoría de circuitos, código abierto). Demo: implementación simplificada del mismo método en el navegador.';
