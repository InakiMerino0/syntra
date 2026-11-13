// Data portability / API-ready export. Pure functions, not wired to the UI yet.
import { establecimiento, corredores, monitoreos, eventos, certificaciones, parchesBosque, type Lote, type LatLng } from '@synta/data';

export const ESQUEMA_VERSION = '1.0.0';

export interface GeoJSONFeature {
  type: 'Feature';
  id: string;
  properties: Record<string, unknown>;
  geometry: { type: 'Polygon' | 'LineString'; coordinates: number[][][] | number[][] };
}
export interface GeoJSONCollection { type: 'FeatureCollection'; features: GeoJSONFeature[] }

/** App polygons are [lat, lng]; GeoJSON (RFC 7946) wants [lng, lat] and closed rings. */
const aLngLat = (p: LatLng): number[] => [p[1], p[0]];
function anillo(poly: LatLng[]): number[][] {
  const r = poly.map(aLngLat);
  const [a, b] = [r[0], r[r.length - 1]];
  if (r.length && (a[0] !== b[0] || a[1] !== b[1])) r.push([...a]);
  return r;
}

export function exportarLotesGeoJSON(lotes: Lote[]): GeoJSONCollection {
  return {
    type: 'FeatureCollection',
    features: lotes.map((l) => ({
      type: 'Feature',
      id: l.id,
      properties: { nombre: l.name, cultivo: l.crop, ha: l.ha, biodiversidad: l.bio, estado: l.status, nota: l.note },
      geometry: { type: 'Polygon', coordinates: [anillo(l.polygon)] },
    })),
  };
}

export function exportarEstablecimiento(lotes: Lote[]) {
  const corredoresGeo: GeoJSONCollection = {
    type: 'FeatureCollection',
    features: corredores.map((c) => ({
      type: 'Feature', id: c.id,
      properties: { titulo: c.title, ha: c.ha, impacto: c.impact, estado: c.status, cierra: c.closes },
      geometry: { type: 'LineString', coordinates: c.line.map(aLngLat) },
    })),
  };
  const parchesGeo: GeoJSONCollection = {
    type: 'FeatureCollection',
    features: parchesBosque.map((p) => ({
      type: 'Feature', id: p.id, properties: { nombre: p.nombre, ha: p.ha },
      geometry: { type: 'Polygon', coordinates: [anillo(p.polygon)] },
    })),
  };
  return {
    esquemaVersion: ESQUEMA_VERSION,
    generado: new Date().toISOString(),
    nota: 'Exportación de datos del productor. Datos de demostración salvo los polígonos dibujados por el usuario.',
    establecimiento: { nombre: establecimiento.name, ubicacion: establecimiento.location, renspa: establecimiento.renspa, ha: establecimiento.totalHa, centro: aLngLat(establecimiento.center) },
    lotes: exportarLotesGeoJSON(lotes),
    parchesBosque: parchesGeo,
    corredores: corredoresGeo,
    monitoreos: monitoreos.map((m) => ({ ...m })),
    eventos: eventos.map((e) => ({ ...e })),
    certificaciones: certificaciones.map((c) => ({
      id: c.id,
      nombre: c.label,
      requisitos: c.items.length,
      cumple: c.items.filter((i) => i.status === 'ok').length,
      faltaDato: c.items.filter((i) => i.status === 'warn').length,
      mejoraNecesaria: c.items.filter((i) => i.status === 'bad').length,
    })),
  };
}

export type ExportacionEstablecimiento = ReturnType<typeof exportarEstablecimiento>;
