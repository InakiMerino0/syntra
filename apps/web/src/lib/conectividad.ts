// Simplified Circuitscape-style connectivity model, computed in the browser.
//
// Circuit theory: the landscape is a grid of resistors (resistance = how hard it is for an organism to cross a
// cell). Forest patches are the focal nodes. For each pair of patches we inject 1 A into one and ground the other,
// solve Kirchhoff's laws and read the current flowing through every cell. Summed over all pairs, the current
// density map shows where organisms are most likely to move: the "sixth layer" heat map. The suggested corridor
// is the least-cost path that follows the high-current / low-resistance cells (and so crosses low-yield land).
import { parchesBosque, zonasRendimiento, zonasInundables, extensionModelo, lotes, type LatLng } from '@synta/data';

export const COLS = 90;
export const ROWS = 75;

export interface ResultadoConectividad {
  grid: { rows: number; cols: number; bounds: { norte: number; sur: number; oeste: number; este: number } };
  /** Cumulative current density per cell, row-major from the north-west corner, normalised 0..1. */
  corriente: Float32Array;
  corredores: LatLng[][];
  metricas: { celdas: number; pares: number; iteraciones: number; ms: number };
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Ray casting point-in-polygon on [lat, lng] pairs. */
function dentro(lat: number, lng: number, poly: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Marks cells whose centre falls inside `poly` (only scans the polygon's bounding box). */
function rasterizar(poly: LatLng[], g: Grid, fn: (idx: number) => void) {
  const lats = poly.map((p) => p[0]), lngs = poly.map((p) => p[1]);
  const r0 = Math.max(0, Math.floor((g.norte - Math.max(...lats)) / g.dLat - 0.5));
  const r1 = Math.min(g.rows - 1, Math.ceil((g.norte - Math.min(...lats)) / g.dLat));
  const c0 = Math.max(0, Math.floor((Math.min(...lngs) - g.oeste) / g.dLng - 0.5));
  const c1 = Math.min(g.cols - 1, Math.ceil((Math.max(...lngs) - g.oeste) / g.dLng));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (dentro(g.norte - (r + 0.5) * g.dLat, g.oeste + (c + 0.5) * g.dLng, poly)) fn(r * g.cols + c);
  }
}

interface Grid { rows: number; cols: number; norte: number; sur: number; oeste: number; este: number; dLat: number; dLng: number }

const celdaLatLng = (g: Grid, idx: number): LatLng => [g.norte - (Math.floor(idx / g.cols) + 0.5) * g.dLat, g.oeste + ((idx % g.cols) + 0.5) * g.dLng];

/** Resistance surface. Priority: forest patch 1 > flood-prone 3 > low yield 4 / medium 6 > crop 10 > other 8. */
function construirResistencia(g: Grid): { res: Float32Array; parches: number[][] } {
  const n = g.rows * g.cols;
  const res = new Float32Array(n).fill(8); // roads, neighbouring fields
  lotes.forEach((l) => rasterizar(l.polygon, g, (i) => { res[i] = 10; }));
  zonasRendimiento.forEach((z) => rasterizar(z.polygon, g, (i) => { res[i] = z.nivel === 'bajo' ? 4 : 6; }));
  zonasInundables.forEach((z) => rasterizar(z.polygon, g, (i) => { res[i] = 3; }));
  const parches = parchesBosque.map((p) => {
    const cells: number[] = [];
    rasterizar(p.polygon, g, (i) => { res[i] = 1; cells.push(i); });
    if (!cells.length) { // tiny patch: fall back to the cell holding its centroid
      const lat = p.polygon.reduce((s, q) => s + q[0], 0) / p.polygon.length, lng = p.polygon.reduce((s, q) => s + q[1], 0) / p.polygon.length;
      const i = Math.floor((g.norte - lat) / g.dLat) * g.cols + Math.floor((lng - g.oeste) / g.dLng);
      res[i] = 1; cells.push(i);
    }
    return cells;
  });
  return { res, parches };
}

/**
 * One Circuitscape "pairwise" solve: potential 1 on the source nodes, 0 on the ground nodes, Kirchhoff's current law
 * on every other cell. Conjugate gradient (Jacobi preconditioned) on the free nodes of the 4-neighbour graph, with
 * conductance between neighbours = 2 / (r_i + r_j). Adds each cell's through-current (|I| summed over its edges / 2),
 * scaled so that 1 A leaves the source, into `acum`. Returns the iterations used.
 */
function resolverPar(g: Grid, res: Float32Array, fuente: number[], tierra: number[], acum: Float32Array): number {
  const { rows, cols } = g, n = rows * cols;
  const tipo = new Uint8Array(n); // 0 free, 1 source (V=1), 2 ground (V=0)
  fuente.forEach((i) => { tipo[i] = 1; });
  tierra.forEach((i) => { tipo[i] = 2; });
  const V = new Float64Array(n);
  fuente.forEach((i) => { V[i] = 1; });
  // Edge conductances: right (i→i+1) and down (i→i+cols).
  const gR = new Float32Array(n), gD = new Float32Array(n);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (c < cols - 1) gR[i] = 2 / (res[i] + res[i + 1]);
    if (r < rows - 1) gD[i] = 2 / (res[i] + res[i + cols]);
  }
  // y = A x restricted to free nodes (Laplacian rows).
  const diag = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    diag[i] = (c < cols - 1 ? gR[i] : 0) + (c > 0 ? gR[i - 1] : 0) + (i + cols < n ? gD[i] : 0) + (i >= cols ? gD[i - cols] : 0);
  }
  const matvec = (x: Float64Array, y: Float64Array) => {
    for (let i = 0; i < n; i++) {
      if (tipo[i]) { y[i] = 0; continue; }
      const c = i % cols;
      let s = diag[i] * x[i];
      if (c < cols - 1) s -= gR[i] * x[i + 1];
      if (c > 0) s -= gR[i - 1] * x[i - 1];
      if (i + cols < n) s -= gD[i] * x[i + cols];
      if (i >= cols) s -= gD[i - cols] * x[i - cols];
      y[i] = s;
    }
  };
  // Right-hand side: b = -A_free,fixed * V_fixed ; residual r = b - A_ff x with x = 0 initially on free nodes.
  const b = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    if (tipo[i]) continue;
    const c = i % cols;
    let s = 0;
    if (c < cols - 1 && tipo[i + 1] === 1) s += gR[i];
    if (c > 0 && tipo[i - 1] === 1) s += gR[i - 1];
    if (i + cols < n && tipo[i + cols] === 1) s += gD[i];
    if (i >= cols && tipo[i - cols] === 1) s += gD[i - cols];
    b[i] = s;
  }
  const x = new Float64Array(n), rr = b.slice(), z = new Float64Array(n), p = new Float64Array(n), Ap = new Float64Array(n);
  let rz = 0, bNorm = 0;
  for (let i = 0; i < n; i++) { if (tipo[i]) continue; z[i] = rr[i] / diag[i]; p[i] = z[i]; rz += rr[i] * z[i]; bNorm += b[i] * b[i]; }
  bNorm = Math.sqrt(bNorm) || 1;
  let it = 0;
  const MAX_IT = 600, TOL = 1e-6;
  for (; it < MAX_IT; it++) {
    matvec(p, Ap);
    let pAp = 0;
    for (let i = 0; i < n; i++) pAp += p[i] * Ap[i];
    if (pAp <= 0) break;
    const alpha = rz / pAp;
    let rNorm = 0;
    for (let i = 0; i < n; i++) { if (tipo[i]) continue; x[i] += alpha * p[i]; rr[i] -= alpha * Ap[i]; rNorm += rr[i] * rr[i]; }
    if (Math.sqrt(rNorm) / bNorm < TOL) { it++; break; }
    let rzN = 0;
    for (let i = 0; i < n; i++) { if (tipo[i]) continue; z[i] = rr[i] / diag[i]; rzN += rr[i] * z[i]; }
    const beta = rzN / rz; rz = rzN;
    for (let i = 0; i < n; i++) if (!tipo[i]) p[i] = z[i] + beta * p[i];
  }
  for (let i = 0; i < n; i++) V[i] = tipo[i] === 1 ? 1 : tipo[i] === 2 ? 0 : x[i];

  // Edge currents → per-cell through-current; total current leaving the source scales the pair to 1 A.
  const cur = new Float32Array(n);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    if (c < cols - 1) { const I = gR[i] * (V[i] - V[i + 1]); const a = Math.abs(I); cur[i] += a / 2; cur[i + 1] += a / 2; if (tipo[i] === 1 && tipo[i + 1] !== 1) total += I; else if (tipo[i + 1] === 1 && tipo[i] !== 1) total -= I; }
    if (i + cols < n) { const I = gD[i] * (V[i] - V[i + cols]); const a = Math.abs(I); cur[i] += a / 2; cur[i + cols] += a / 2; if (tipo[i] === 1 && tipo[i + cols] !== 1) total += I; else if (tipo[i + cols] === 1 && tipo[i] !== 1) total -= I; }
  }
  const k = total > 0 ? 1 / total : 0;
  for (let i = 0; i < n; i++) acum[i] += cur[i] * k;
  return it;
}

/** Minimal binary min-heap of (cost, node) used by Dijkstra. */
class Heap {
  private k: number[] = []; private v: number[] = [];
  get size() { return this.k.length; }
  push(key: number, val: number) {
    let i = this.k.push(key) - 1; this.v.push(val);
    while (i > 0) { const p = (i - 1) >> 1; if (this.k[p] <= key) break; this.k[i] = this.k[p]; this.v[i] = this.v[p]; i = p; }
    this.k[i] = key; this.v[i] = val;
  }
  pop(): number {
    const top = this.v[0], lk = this.k.pop()!, lv = this.v.pop()!;
    const n = this.k.length;
    if (n) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1; if (c >= n) break;
        if (c + 1 < n && this.k[c + 1] < this.k[c]) c++;
        if (this.k[c] >= lk) break;
        this.k[i] = this.k[c]; this.v[i] = this.v[c]; i = c;
      }
      this.k[i] = lk; this.v[i] = lv;
    }
    return top;
  }
}

/** Least-cost path (8-neighbour Dijkstra) from any `origen` cell to the nearest `destino` cell; cost = resistance / (0.2 + current). */
function caminoMinimo(g: Grid, res: Float32Array, corriente: Float32Array, origen: number[], destino: Set<number>): number[] {
  const { rows, cols } = g, n = rows * cols;
  const costo = new Float32Array(n);
  for (let i = 0; i < n; i++) costo[i] = res[i] / (0.2 + corriente[i]);
  const dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1);
  const heap = new Heap();
  origen.forEach((i) => { dist[i] = 0; heap.push(0, i); });
  let fin = -1;
  while (heap.size) {
    const u = heap.pop();
    const du = dist[u];
    if (destino.has(u)) { fin = u; break; }
    const r = Math.floor(u / cols), c = u % cols;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
      const v = rr * cols + cc;
      const nd = du + ((costo[u] + costo[v]) / 2) * (dr && dc ? Math.SQRT2 : 1);
      if (nd < dist[v]) { dist[v] = nd; prev[v] = u; heap.push(nd, v); }
    }
  }
  const camino: number[] = [];
  for (let u = fin; u !== -1; u = prev[u]) camino.push(u);
  return camino.reverse();
}

/** Drops intermediate points of near-straight runs so the polyline stays light. */
function simplificar(pts: LatLng[]): LatLng[] {
  if (pts.length < 3) return pts;
  const out: LatLng[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (Math.abs(cross) > 1e-9 || i % 6 === 0) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

let memo: ResultadoConectividad | null = null;

/** Runs the whole model (memoised): resistance grid → pairwise circuit solves → current map → corridors. */
export function modelarConectividad(): ResultadoConectividad {
  if (memo) return memo;
  const t0 = now();
  const { norte, sur, oeste, este } = extensionModelo;
  const g: Grid = { rows: ROWS, cols: COLS, norte, sur, oeste, este, dLat: (norte - sur) / ROWS, dLng: (este - oeste) / COLS };
  const { res, parches } = construirResistencia(g);
  const n = ROWS * COLS;

  // Pairwise mode over all patch pairs: P1-P2, P1-P3, P2-P3.
  const acum = new Float32Array(n);
  const pares: [number, number][] = [[0, 1], [0, 2], [1, 2]];
  let iteraciones = 0;
  pares.forEach(([a, b]) => { iteraciones += resolverPar(g, res, parches[a], parches[b], acum); });

  // Normalise 0..1, clipping at the 99th percentile so the heat map isn't dominated by the nodes' surroundings.
  const orden = Array.from(acum).sort((x, y) => x - y);
  const tope = orden[Math.floor(n * 0.99)] || orden[n - 1] || 1;
  const corriente = new Float32Array(n);
  for (let i = 0; i < n; i++) corriente[i] = Math.min(1, acum[i] / tope);

  // Corridors: P1→P2, then P3→nearest of (P2 or the first corridor).
  const c1 = caminoMinimo(g, res, corriente, parches[0], new Set(parches[1]));
  const objetivo = new Set<number>([...parches[1], ...c1]);
  const c2 = caminoMinimo(g, res, corriente, parches[2], objetivo);
  const corredores = [c1, c2].filter((c) => c.length > 1).map((c) => simplificar(c.map((i) => celdaLatLng(g, i))));

  memo = { grid: { rows: ROWS, cols: COLS, bounds: { norte, sur, oeste, este } }, corriente, corredores, metricas: { celdas: n, pares: pares.length, iteraciones, ms: Math.round(now() - t0) } };
  return memo;
}

/** Heat-map colour ramp: transparent → yellow → orange → red. Low values are fully transparent. */
function rampa(v: number): [number, number, number, number] {
  if (v < 0.3) return [0, 0, 0, 0];
  const t = (v - 0.3) / 0.7;
  const a = Math.round(255 * Math.min(1, 0.25 + t * 0.9));
  if (t < 0.5) { const k = t / 0.5; return [255, Math.round(230 - 70 * k), Math.round(60 - 40 * k), a]; } // yellow → orange
  const k = (t - 0.5) / 0.5; return [Math.round(255 - 30 * k), Math.round(160 - 120 * k), Math.round(20 + 10 * k), a]; // orange → red
}

let memoImg: string | null = null;
/** Draws the current density on an offscreen cols×rows canvas and returns it as a PNG data URL for an ImageOverlay. */
export function heatmapDataURL(): string {
  if (memoImg) return memoImg;
  const { grid, corriente } = modelarConectividad();
  const canvas = document.createElement('canvas');
  canvas.width = grid.cols; canvas.height = grid.rows;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(grid.cols, grid.rows);
  for (let i = 0; i < corriente.length; i++) {
    const [r, g, b, a] = rampa(corriente[i]);
    img.data.set([r, g, b, a], i * 4);
  }
  ctx.putImageData(img, 0, 0);
  memoImg = canvas.toDataURL('image/png');
  return memoImg;
}

/** CSS gradient matching `rampa`, for the legend bar. */
export const gradienteLeyenda = 'linear-gradient(90deg, rgba(255,230,60,0.25), #FFA028 50%, #E1281E)';
