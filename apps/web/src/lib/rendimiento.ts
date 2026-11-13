// Yield-map import: parse monitor exports (CSV / GeoJSON points), clean, grid, classify vs the field median.
// Pure functions (except `heatmapDataURL`, which needs a DOM canvas). Values are normalised to % of the median,
// so the unit (kg/ha, t/ha, bu/ac) doesn't matter. Nothing leaves the browser.
import { lotes, zonasRendimiento, type LatLng } from '@synta/data';

export interface Punto { lat: number; lng: number; v: number }
export interface Lectura { puntos: Punto[]; columna: string; props?: string[]; descartadas: number; error?: string }
export type Clase = 'bajo' | 'medio' | 'alto';
export interface Resultado {
  img: string; // canvas heat-map as dataURL ('' when no DOM)
  bounds: [[number, number], [number, number]]; // [[sur, oeste], [norte, este]]
  stats: { usados: number; descartados: number; medianaOriginal: number; celdas: number; celdaM: number; pct: Record<Clase, number> };
  bajo: LatLng[][]; // low-yield polygons (merged runs of cells) = candidate zones for green infrastructure
  celdasBajo: number;
}

export const UMBRAL_BAJO = 85;
export const UMBRAL_ALTO = 105;
export const COLORES: Record<Clase, string> = { bajo: '#E4572E', medio: '#F2C14E', alto: '#2E8B3D' };
const M_LAT = 111320;

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');

/** "1.234,5" / "1234,5" / "1234.5" / "12,5 kg" -> number. NaN when not numeric. */
export function num(raw: string | number | null | undefined): number {
  if (typeof raw === 'number') return raw;
  let s = String(raw ?? '').trim().replace(/[^\d.,+\-eE]/g, '');
  if (!s) return NaN;
  const c = s.lastIndexOf(','), d = s.lastIndexOf('.');
  if (c >= 0 && d >= 0) s = c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (c >= 0) s = s.replace(',', '.');
  return Number(s);
}

const LAT = ['lat', 'latitude', 'latitud', 'y'];
const LON = ['lon', 'lng', 'long', 'longitude', 'longitud', 'x'];
const YIELD_PRIO = ['yldvoldr', 'yldmassdr', 'yldvol', 'rendimiento', 'rinde', 'yield', 'rendimientokgha', 'kgha', 'tha', 'rindekgha', 'yieldkgha'];

function pickYield(headers: string[]): number {
  const n = headers.map(norm);
  for (const k of YIELD_PRIO) { const i = n.indexOf(k); if (i >= 0) return i; }
  return n.findIndex((h) => /(yield|yld|rend|rinde)/.test(h));
}

function splitLine(line: string, sep: string): string[] {
  const out: string[] = []; let cur = ''; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === sep && !q) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

function validar(lat: number, lng: number, v: number): Punto | null {
  if (![lat, lng, v].every(Number.isFinite)) return null;
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) { const t = lat; lat = lng; lng = t; } // swapped columns
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null;
  return { lat, lng, v };
}

export function leerCSV(texto: string): Lectura {
  const lineas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2) return { puntos: [], columna: '', descartadas: 0, error: 'El archivo no tiene filas de datos.' };
  const cab = lineas[0];
  const sep = [';', '\t', ','].map((s) => [s, cab.split(s).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const h = splitLine(cab, sep);
  const n = h.map(norm);
  const iLat = n.findIndex((x) => LAT.includes(x)), iLon = n.findIndex((x) => LON.includes(x)), iY = pickYield(h);
  if (iLat < 0 || iLon < 0) return { puntos: [], columna: '', descartadas: 0, error: 'No encontré columnas de latitud y longitud (lat/latitude, lon/lng/longitude).' };
  if (iY < 0) return { puntos: [], columna: '', descartadas: 0, error: 'No encontré la columna de rendimiento (rinde, rendimiento, yield, Yld_Vol_Dr).' };
  const puntos: Punto[] = []; let descartadas = 0;
  for (let i = 1; i < lineas.length; i++) {
    const c = splitLine(lineas[i], sep);
    const p = validar(num(c[iLat]), num(c[iLon]), num(c[iY]));
    if (p) puntos.push(p); else descartadas++;
  }
  return { puntos, columna: h[iY], descartadas };
}

type GJ = { type?: string; features?: { geometry?: { type?: string; coordinates?: number[] }; properties?: Record<string, unknown> }[] };

export function leerGeoJSON(texto: string, prop?: string): Lectura {
  let gj: GJ;
  try { gj = JSON.parse(texto); } catch { return { puntos: [], columna: '', descartadas: 0, error: 'El archivo no es un JSON válido.' }; }
  const feats = (gj.type === 'FeatureCollection' ? gj.features : null) ?? [];
  const pts = feats.filter((f) => f.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates));
  if (!pts.length) return { puntos: [], columna: '', descartadas: 0, error: 'Necesito un FeatureCollection de puntos (Point) con una propiedad numérica de rendimiento.' };
  const props = new Set<string>();
  pts.slice(0, 500).forEach((f) => Object.entries(f.properties ?? {}).forEach(([k, v]) => {
    if (v !== '' && v !== null && Number.isFinite(num(v as string | number))) props.add(k);
  }));
  const lista = [...props].filter((k) => !LAT.includes(norm(k)) && !LON.includes(norm(k)));
  const auto = lista[pickYield(lista)] ?? lista[0];
  const col = prop && lista.includes(prop) ? prop : auto;
  if (!col) return { puntos: [], columna: '', props: lista, descartadas: 0, error: 'No encontré ninguna propiedad numérica para usar como rendimiento.' };
  const puntos: Punto[] = []; let descartadas = 0;
  for (const f of pts) {
    const [lng, lat] = f.geometry!.coordinates!;
    const p = validar(lat, lng, num(f.properties?.[col] as string | number));
    if (p) puntos.push(p); else descartadas++;
  }
  return { puntos, columna: col, props: lista, descartadas };
}

export function leerArchivo(nombre: string, texto: string, prop?: string): Lectura {
  return /\.(geo)?json$/i.test(nombre) || texto.trimStart().startsWith('{') ? leerGeoJSON(texto, prop) : leerCSV(texto);
}

const percentil = (ord: number[], p: number) => ord[Math.min(ord.length - 1, Math.max(0, Math.round(p * (ord.length - 1))))];
export const clasificar = (pct: number): Clase => (pct < UMBRAL_BAJO ? 'bajo' : pct <= UMBRAL_ALTO ? 'medio' : 'alto');

/** Clean, grid (cell mean, holes filled by IDW from neighbours within 2 cells), normalise and classify. */
export function procesar(entrada: Punto[], descartadasPrevias = 0, celdaM = 20): Resultado | { error: string } {
  const pos = entrada.filter((p) => p.v > 0);
  if (pos.length < 30) return { error: 'Muy pocos puntos con rendimiento válido (mínimo 30).' };
  const ord = pos.map((p) => p.v).sort((a, b) => a - b);
  const lo = percentil(ord, 0.01), hi = percentil(ord, 0.99);
  const ok = pos.filter((p) => p.v >= lo && p.v <= hi);
  const med = percentil(ok.map((p) => p.v).sort((a, b) => a - b), 0.5);
  let sur = Infinity, norte = -Infinity, oeste = Infinity, este = -Infinity;
  ok.forEach((p) => { sur = Math.min(sur, p.lat); norte = Math.max(norte, p.lat); oeste = Math.min(oeste, p.lng); este = Math.max(este, p.lng); });
  const dLat = celdaM / M_LAT, dLng = celdaM / (M_LAT * Math.cos(((sur + norte) / 2) * Math.PI / 180));
  const nx = Math.max(1, Math.ceil((este - oeste) / dLng) + 1), ny = Math.max(1, Math.ceil((norte - sur) / dLat) + 1);
  if (nx * ny > 1_500_000) return { error: 'La extensión del mapa es demasiado grande para la grilla (¿coordenadas mezcladas?).' };
  const suma = new Float64Array(nx * ny), cuenta = new Uint32Array(nx * ny);
  ok.forEach((p) => {
    const x = Math.min(nx - 1, Math.floor((p.lng - oeste) / dLng)), y = Math.min(ny - 1, Math.floor((norte - p.lat) / dLat));
    suma[y * nx + x] += p.v; cuenta[y * nx + x]++;
  });
  const medidas = new Float64Array(nx * ny).fill(NaN);
  for (let i = 0; i < suma.length; i++) if (cuenta[i]) medidas[i] = suma[i] / cuenta[i] / med * 100;
  const pct: (number | null)[] = new Array(nx * ny).fill(null);
  const conteo: Record<Clase, number> = { bajo: 0, medio: 0, alto: 0 };
  let celdas = 0;
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    const i = y * nx + x;
    if (!Number.isNaN(medidas[i])) { pct[i] = medidas[i]; conteo[clasificar(medidas[i])]++; celdas++; continue; }
    let s = 0, w = 0; // needs several neighbours around it, so it never extrapolates past the data
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if ((dx || dy) && xx >= 0 && yy >= 0 && xx < nx && yy < ny && !Number.isNaN(medidas[yy * nx + xx])) { const k = 1 / (dx * dx + dy * dy); s += medidas[yy * nx + xx] * k; w += k; }
    }
    if (w > 0.9) pct[i] = s / w;
  }
  // Merge horizontal runs of "bajo" cells (measured or filled) into rectangles: few polygons, same area.
  const bajo: LatLng[][] = []; let celdasBajo = 0;
  const esBajo = (i: number) => pct[i] !== null && (pct[i] as number) < UMBRAL_BAJO;
  for (let y = 0; y < ny; y++) {
    let x = 0;
    while (x < nx) {
      if (!esBajo(y * nx + x)) { x++; continue; }
      const x0 = x; while (x < nx && esBajo(y * nx + x)) x++;
      celdasBajo += x - x0;
      const n1 = norte - y * dLat, s1 = n1 - dLat, w1 = oeste + x0 * dLng, e1 = oeste + x * dLng;
      bajo.push([[n1, w1], [n1, e1], [s1, e1], [s1, w1]]);
    }
  }
  const tot = Math.max(1, celdas);
  return {
    img: heatmapDataURL(nx, ny, pct),
    bounds: [[norte - ny * dLat, oeste], [norte, oeste + nx * dLng]],
    stats: {
      usados: ok.length, descartados: descartadasPrevias + (entrada.length - ok.length), medianaOriginal: med, celdas, celdaM,
      pct: { bajo: Math.round(conteo.bajo / tot * 100), medio: Math.round(conteo.medio / tot * 100), alto: Math.round(conteo.alto / tot * 100) },
    },
    bajo, celdasBajo,
  };
}

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
/** One pixel per cell, coloured by class. Returns '' outside the browser. */
export function heatmapDataURL(nx: number, ny: number, pct: (number | null)[]): string {
  if (typeof document === 'undefined') return '';
  const cv = document.createElement('canvas'); cv.width = nx; cv.height = ny;
  const ctx = cv.getContext('2d'); if (!ctx) return '';
  const im = ctx.createImageData(nx, ny);
  pct.forEach((v, i) => {
    if (v === null) return;
    const [r, g, b] = hex(COLORES[clasificar(v)]);
    im.data.set([r, g, b, 215], i * 4);
  });
  ctx.putImageData(im, 0, 0);
  return cv.toDataURL('image/png');
}

// ---------- Synthetic sample (Lote 3, soja) ----------
function rng(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function dentro(p: LatLng, poly: LatLng[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if (yi > p[0] !== yj > p[0] && p[1] < ((xj - xi) * (p[0] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Synthetic combine passes over Lote 3: ~3.200 kg/ha with noise, dropping to the zonasRendimiento 'bajo' % inside those zones. */
export function csvEjemplo(): string {
  const lote = lotes.find((l) => l.id === 'l3')!;
  const bajos = zonasRendimiento.filter((z) => z.loteId === 'l3' && z.nivel === 'bajo');
  const lats = lote.polygon.map((p) => p[0]), lngs = lote.polygon.map((p) => p[1]);
  const s = Math.min(...lats), n = Math.max(...lats), w = Math.min(...lngs), e = Math.max(...lngs);
  const r = rng(2026), dPasada = 20 / M_LAT, dPunto = 12 / (M_LAT * Math.cos(((s + n) / 2) * Math.PI / 180));
  const filas = ['Latitude,Longitude,Rendimiento_kg_ha'];
  for (let lat = s; lat <= n; lat += dPasada) {
    for (let lng = w; lng <= e; lng += dPunto) {
      const p: LatLng = [lat + (r() - 0.5) * 1e-5, lng];
      if (!dentro(p, lote.polygon)) continue;
      const z = bajos.find((b) => dentro(p, b.polygon));
      const base = 3200 * (z ? z.rindePct / 100 : 1 + 0.05 * Math.sin(lng * 9000) * Math.cos(lat * 7000));
      const v = r() < 0.01 ? 0 : base * (1 + (r() + r() + r() - 1.5) * 0.12);
      filas.push(`${p[0].toFixed(6)},${p[1].toFixed(6)},${v.toFixed(0)}`);
    }
  }
  return filas.join('\n');
}
