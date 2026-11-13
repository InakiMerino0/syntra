// Datos reales Sentinel-2 L2A vía Earth Search (Element 84, AWS Open Data). Sin API keys, todo en el navegador.
import { fromUrl } from 'geotiff';

export type LatLng = [number, number]; // [lat, lng]
export type BBox = [number, number, number, number]; // [oeste, sur, este, norte]

export interface Escena {
  id: string;
  fecha: string; // ISO
  nubes: number; // % de nubes de la escena completa
  red: string;
  nir: string;
  epsg: number;
  scale: number;
  offset: number; // reflectancia = DN*scale + offset
}

export interface NdviResultado {
  escena: Escena;
  media: number;
  min: number;
  max: number;
  pixeles: number;
  png?: string; // dataURL (sólo en navegador)
  bounds: [[number, number], [number, number]]; // [[sur, oeste], [norte, este]]
}

const STAC = 'https://earth-search.aws.element84.com/v1/search';

function conTimeout<T>(p: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms);
    const limpiar = () => { clearTimeout(t); signal?.removeEventListener('abort', onAbort); };
    const onAbort = () => { limpiar(); reject(new DOMException('Cancelado', 'AbortError')); };
    if (signal?.aborted) return onAbort();
    signal?.addEventListener('abort', onAbort, { once: true });
    p.then(v => { limpiar(); resolve(v); }, e => { limpiar(); reject(e); });
  });
}

export function bboxDe(poly: LatLng[]): BBox {
  const lats = poly.map(p => p[0]), lngs = poly.map(p => p[1]);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

interface StacAsset { href: string }
interface StacItem {
  id: string;
  properties: Record<string, unknown>;
  assets: Record<string, StacAsset | undefined>;
}

export async function buscarEscenas(bbox: BBox, desde: string, hasta: string, maxNubes = 20, limite = 20, signal?: AbortSignal): Promise<Escena[]> {
  const res = await conTimeout(fetch(STAC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      collections: ['sentinel-2-l2a'],
      bbox,
      datetime: `${desde}/${hasta}`,
      query: { 'eo:cloud_cover': { lt: maxNubes } },
      limit: limite,
      sortby: [{ field: 'properties.datetime', direction: 'desc' }],
    }),
  }), 20000, signal);
  if (!res.ok) throw new Error(`Earth Search respondió ${res.status}`);
  const json = (await res.json()) as { features?: StacItem[] };
  const out: Escena[] = [];
  for (const f of json.features ?? []) {
    const red = f.assets.red, nir = f.assets.nir;
    const epsg = f.properties['proj:epsg'] as number | undefined;
    if (!red || !nir || !epsg) continue;
    const base = String(f.properties['s2:processing_baseline'] ?? '');
    // Baseline >= 04.00 suma +1000 DN a los datos originales (reflectancia = DN*0.0001 - 0.1). Earth Search lo marca con
    // earthsearch:boa_offset_applied=true cuando ya lo compensó (verificado: DN ~400 en rojo sobre cultivo => sin offset adicional).
    const aplicado = f.properties['earthsearch:boa_offset_applied'] === true;
    const scale = 0.0001;
    const offset = aplicado ? 0 : parseFloat(base) >= 4 ? -0.1 : 0;
    out.push({ id: f.id, fecha: String(f.properties.datetime), nubes: Number(f.properties['eo:cloud_cover'] ?? 0), red: red.href, nir: nir.href, epsg, scale, offset });
  }
  return out;
}

// WGS84 -> UTM (series de Krüger). EPSG 326zz norte, 327zz sur.
export function aUtm(lat: number, lng: number, epsg: number): [number, number] {
  const zona = epsg % 100;
  const sur = Math.floor(epsg / 100) === 327;
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996;
  const n = f / (2 - f);
  const A = (a / (1 + n)) * (1 + (n * n) / 4 + n ** 4 / 64);
  const al = [n / 2 - (2 * n * n) / 3 + (5 * n ** 3) / 16, (13 * n * n) / 48 - (3 * n ** 3) / 5, (61 * n ** 3) / 240];
  const lam0 = (((zona - 1) * 6 - 180 + 3) * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180, lam = (lng * Math.PI) / 180 - lam0;
  const e = Math.sqrt(f * (2 - f));
  const t = Math.sinh(Math.atanh(Math.sin(phi)) - e * Math.atanh(e * Math.sin(phi)));
  const xi = Math.atan2(t, Math.cos(lam));
  const eta = Math.atanh(Math.sin(lam) / Math.sqrt(1 + t * t));
  let x = eta, y = xi;
  for (let j = 1; j <= 3; j++) {
    x += al[j - 1] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta);
    y += al[j - 1] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta);
  }
  return [500000 + k0 * A * x, (sur ? 10000000 : 0) + k0 * A * y];
}

function dentro(x: number, y: number, poly: [number, number][]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function rampa(v: number): [number, number, number] {
  // rojo (<=0,1) -> amarillo (~0,45) -> verde (>=0,8)
  const t = Math.max(0, Math.min(1, (v - 0.1) / 0.7));
  const lerp = (a: number, b: number, u: number) => Math.round(a + (b - a) * u);
  if (t < 0.5) { const u = t / 0.5; return [lerp(200, 245, u), lerp(40, 205, u), lerp(40, 70, u)]; }
  const u = (t - 0.5) / 0.5;
  return [lerp(245, 30, u), lerp(205, 130, u), lerp(70, 50, u)];
}

export async function ndviLote(polygon: LatLng[], escena: Escena, signal?: AbortSignal): Promise<NdviResultado> {
  const bb = bboxDe(polygon);
  const polyUtm = polygon.map(([la, ln]) => aUtm(la, ln, escena.epsg));
  const xs = polyUtm.map(p => p[0]), ys = polyUtm.map(p => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];

  const [tr, tn] = await conTimeout(Promise.all([fromUrl(escena.red, {}, signal), fromUrl(escena.nir, {}, signal)]), 25000, signal);
  const [ir, inn] = await Promise.all([tr.getImage(0), tn.getImage(0)]);
  const [ox, oy] = ir.getOrigin();
  const [rx, ry] = ir.getResolution(); // ry negativo
  const W = ir.getWidth(), H = ir.getHeight();
  const x0 = Math.floor((minX - ox) / rx), x1 = Math.ceil((maxX - ox) / rx);
  const y0 = Math.floor((maxY - oy) / ry), y1 = Math.ceil((minY - oy) / ry);
  if (x0 < 0 || y0 < 0 || x1 > W || y1 > H || x1 <= x0 || y1 <= y0) throw new Error('El lote cae fuera de esta escena');
  const win = [x0, y0, x1, y1];
  const w = x1 - x0, h = y1 - y0;
  if (w * h > 4_000_000) throw new Error('Lote demasiado grande para leer en el navegador');

  const [rr, nn] = await conTimeout(Promise.all([
    ir.readRasters({ window: win, samples: [0], signal }),
    inn.readRasters({ window: win, samples: [0], signal }),
  ]), 40000, signal);
  const R = (rr as unknown as ArrayLike<number>[])[0], N = (nn as unknown as ArrayLike<number>[])[0];

  const nd = new Float32Array(w * h).fill(NaN);
  let suma = 0, cnt = 0, mn = Infinity, mx = -Infinity;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const k = j * w + i;
      if (R[k] === 0 && N[k] === 0) continue; // sin dato
      const x = ox + (x0 + i + 0.5) * rx, y = oy + (y0 + j + 0.5) * ry;
      if (!dentro(x, y, polyUtm)) continue;
      const r = R[k] * escena.scale + escena.offset, n2 = N[k] * escena.scale + escena.offset;
      const den = n2 + r;
      if (den <= 0) continue;
      const v = (n2 - r) / den;
      nd[k] = v; suma += v; cnt++;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
  }
  if (!cnt) throw new Error('Sin píxeles válidos dentro del lote');

  let png: string | undefined;
  if (typeof document !== 'undefined') {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    if (ctx) {
      const img = ctx.createImageData(w, h);
      for (let k = 0; k < nd.length; k++) {
        const v = nd[k];
        if (Number.isNaN(v)) continue;
        const [r, g, b] = rampa(v);
        img.data[k * 4] = r; img.data[k * 4 + 1] = g; img.data[k * 4 + 2] = b; img.data[k * 4 + 3] = 235;
      }
      ctx.putImageData(img, 0, 0);
      png = cv.toDataURL('image/png');
    }
  }
  return { escena, media: suma / cnt, min: mn, max: mx, pixeles: cnt, png, bounds: [[bb[1], bb[0]], [bb[3], bb[2]]] };
}

export interface PuntoNdvi { fecha: string; ndvi: number; nubes: number; id: string }

function clave(polygon: LatLng[], id: string) {
  const h = polygon.map(p => p[0].toFixed(5) + p[1].toFixed(5)).join('|');
  let x = 0;
  for (let i = 0; i < h.length; i++) x = (x * 31 + h.charCodeAt(i)) | 0;
  return `ndvi:${x}:${id}`;
}
function leer(k: string): number | null {
  try { const v = sessionStorage.getItem(k); return v === null ? null : Number(v); } catch { return null; }
}
function guardar(k: string, v: number) { try { sessionStorage.setItem(k, String(v)); } catch { /* sin storage */ } }

/** NDVI medio de las últimas n escenas despejadas (secuencial, cancelable, con caché en sessionStorage). Devuelve orden cronológico. */
export async function serieNdvi(polygon: LatLng[], n = 10, onPunto?: (p: PuntoNdvi[]) => void, signal?: AbortSignal): Promise<PuntoNdvi[]> {
  const hoy = new Date(), ini = new Date(hoy.getTime() - 400 * 864e5);
  const escenas = await buscarEscenas(bboxDe(polygon), ini.toISOString().slice(0, 10) + 'T00:00:00Z', hoy.toISOString().slice(0, 10) + 'T23:59:59Z', 20, n * 3, signal);
  const dias = new Set<string>();
  const out: PuntoNdvi[] = [];
  for (const e of escenas) {
    if (out.length >= n) break;
    const dia = e.fecha.slice(0, 10);
    if (dias.has(dia)) continue;
    dias.add(dia);
    if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError');
    const k = clave(polygon, e.id);
    let v = leer(k);
    if (v === null) {
      try { v = (await ndviLote(polygon, e, signal)).media; } catch (err) {
        if ((err as Error).name === 'AbortError') throw err;
        continue; // escena puntual fallida: se omite
      }
      guardar(k, v);
    }
    out.push({ fecha: e.fecha, ndvi: v, nubes: e.nubes, id: e.id });
    onPunto?.([...out].reverse());
  }
  return out.reverse();
}
