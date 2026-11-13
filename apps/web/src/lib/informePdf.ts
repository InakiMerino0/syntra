// Evidence builder (real SHA-256 + Merkle root, simulated anchoring) and PDF generator (jsPDF + qrcode).
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  establecimiento, ecorregion, certificaciones, ejes, corredores, biodiversidadLote3, monitoreos,
  seguimientoCorredores, eventos, capas, parchesBosque, zonasRendimiento, zonasInundables, ndviSerie, reqLabel,
} from '@synta/data';
import type { Lote, LatLng, ReqStatus } from '@synta/data';
import { INFORME_NOMBRE, RED_SELLADO, URL_VERIFICACION } from './informe';
import type { ArchivoEvidencia, ConstruirEvidencia, DescargarInforme, EvidenciaInforme } from './informe';

const ID_INFORME = 'SYN-2026-000184';

// ---------- Hashing helpers (hex without the 0x prefix everywhere) ----------

const enc = new TextEncoder();

async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const data = typeof input === 'string' ? enc.encode(input) : input;
  const buf = await globalThis.crypto.subtle.digest('SHA-256', data as BufferSource);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Merkle root: pairwise sha256 of the concatenated hex hashes; the last one is duplicated when the level is odd. */
async function raizDeMerkle(hashes: string[]): Promise<string> {
  let nivel = hashes;
  if (nivel.length === 0) return sha256Hex('');
  while (nivel.length > 1) {
    const sig: string[] = [];
    for (let i = 0; i < nivel.length; i += 2) sig.push(await sha256Hex(nivel[i] + (nivel[i + 1] ?? nivel[i])));
    nivel = sig;
  }
  return nivel[0];
}

const formatearMiles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const dos = (n: number) => String(n).padStart(2, '0');

/** "dd/mm/yyyy HH:MM" in Argentina time (UTC-3, no DST). */
function fechaCorta(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * 3600_000);
  return `${dos(d.getUTCDate())}/${dos(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${dos(d.getUTCHours())}:${dos(d.getUTCMinutes())}`;
}

// ---------- Evidence ----------

export const construirEvidencia: ConstruirEvidencia = async (lotes, certId = 'fsa') => {
  const cert = certificaciones.find((c) => c.id === certId) ?? certificaciones.find((c) => c.id === 'fsa') ?? certificaciones[0];
  const emitido = new Date().toISOString();
  const totalHa = lotes.reduce((s, l) => s + l.ha, 0);

  // Real GeoJSON (GeoJSON order is [lng, lat]; the data uses [lat, lng]); rings are closed.
  const geojson = {
    type: 'FeatureCollection',
    features: lotes.map((l) => {
      const ring = l.polygon.map(([lat, lng]) => [lng, lat]);
      if (ring.length) ring.push(ring[0]);
      return {
        type: 'Feature',
        properties: { id: l.id, nombre: l.name, cultivo: l.crop, superficie_ha: l.ha, biodiversidad: l.bio, estado: l.status },
        geometry: { type: 'Polygon', coordinates: [ring] },
      };
    }),
  };

  const datasets: { archivo: string; descripcion: string; contenido: unknown }[] = [
    { archivo: 'establecimiento.json', descripcion: 'Datos del establecimiento y ecorregión', contenido: { establecimiento, ecorregion } },
    { archivo: 'lotes.geojson', descripcion: `Polígonos georreferenciados de ${lotes.length} lotes`, contenido: geojson },
    {
      archivo: 'analisis-satelital.json',
      descripcion: 'NDVI, cobertura, parches de bosque y focos de calor',
      contenido: {
        fuente: 'Sentinel-2 L2A (Copernicus) · NASA FIRMS',
        ndviSerie2024_2026: ndviSerie,
        parchesBosque,
        zonasRendimiento,
        zonasInundables,
        focosCalor: capas.focosCalor,
        cambioCobertura2020_2026_ha: 0,
        superficieTotalHa: totalHa,
      },
    },
    {
      archivo: `cumplimiento-${cert.id}.json`,
      descripcion: `Requisitos y estado de ${cert.label}`,
      contenido: { certificacion: { id: cert.id, label: cert.label }, requisitos: cert.items.map((r) => ({ ...r, estado: reqLabel[r.status] })), ejes, biodiversidad: biodiversidadLote3 },
    },
    { archivo: 'corredores.json', descripcion: 'Diseño y seguimiento de corredores biológicos', contenido: { corredores, seguimiento: seguimientoCorredores } },
    { archivo: 'monitoreos-campo.json', descripcion: 'Conteos de polinizadores y enemigos naturales', contenido: monitoreos },
    { archivo: 'registros-campo.json', descripcion: 'Registros de campo firmados (eventos)', contenido: eventos },
  ];

  const archivos: ArchivoEvidencia[] = [];
  for (const d of datasets) {
    const bytes = enc.encode(JSON.stringify(d.contenido, null, 2));
    archivos.push({ archivo: d.archivo, descripcion: d.descripcion, bytes: bytes.length, hash: await sha256Hex(bytes) });
  }

  // Manifest: the list of every previous file with its hash. Its own hash joins the Merkle tree.
  const manifiesto = enc.encode(JSON.stringify({ informe: ID_INFORME, emitido, archivos: archivos.map((a) => ({ archivo: a.archivo, bytes: a.bytes, sha256: a.hash })) }, null, 2));
  const hashManifiesto = await sha256Hex(manifiesto);
  archivos.push({ archivo: 'manifest.json', descripcion: 'Manifiesto: lista de archivos con su huella SHA-256', bytes: manifiesto.length, hash: hashManifiesto });

  const raizMerkle = await raizDeMerkle(archivos.map((a) => a.hash));

  // Simulated anchoring, derived deterministically from the root.
  const bloque = formatearMiles(50_000_000 + (parseInt(raizMerkle.slice(0, 7), 16) % 9_000_000));
  const transaccion = '0x' + (await sha256Hex('tx:' + raizMerkle));
  const segundos = 20 + (parseInt(raizMerkle.slice(7, 12), 16) % 100);
  const fecha = fechaCorta(new Date(new Date(emitido).getTime() + segundos * 1000).toISOString()) + ' (hora Argentina)';

  return {
    id: ID_INFORME, emitido, certObjetivo: cert.label, lotes, archivos,
    sellado: { hashManifiesto, raizMerkle, transaccion, bloque, fecha },
  } satisfies EvidenciaInforme;
};

// ---------- PDF ----------

type RGB = [number, number, number];
const C = {
  verde: [0x13, 0x26, 0x1c] as RGB, primary: [0x1d, 0x6a, 0x47] as RGB, ink: [0x15, 0x21, 0x1b] as RGB,
  muted: [0x55, 0x61, 0x5a] as RGB, line: [0xdd, 0xe2, 0xda] as RGB,
  ok: [0x1d, 0x6a, 0x47] as RGB, warn: [0xc2, 0x62, 0x0e] as RGB, bad: [0xb4, 0x2b, 0x2b] as RGB,
};
const ESTADO_COLOR: Record<ReqStatus, RGB> = { ok: C.ok, bad: C.bad, warn: C.warn }; // same as the app badges: Mejora necesaria red, Falta dato orange

const M = 15;            // page margin (mm)
const W = 210, H = 297;
const COL_X = 65;        // right column x
const COL_W = W - M - COL_X;
const TOP = 30;          // content start under the header
const BOTTOM = H - 18;   // content limit above the footer
const LH = 4.2;          // line height for 9pt text

/** Standard PDF fonts only cover Latin-1: map the few typographic characters outside it. */
const t = (s: string) =>
  s.replace(/[—–−]/g, '-').replace(/→/g, '->').replace(/…/g, '...')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/✓/g, 'OK').replace(/≈/g, '~')
    .replace(/[^\u0000-ÿ]/g, '?');

interface Cell { text: string; color?: RGB; mono?: boolean; bold?: boolean }

class Pdf {
  doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  y = TOP;
  constructor(private ev: EvidenciaInforme) { this.header(); }

  color(c: RGB) { this.doc.setTextColor(c[0], c[1], c[2]); }
  font(style: 'normal' | 'bold' = 'normal', size = 9, mono = false, c: RGB = C.ink) {
    this.doc.setFont(mono ? 'courier' : 'helvetica', style); this.doc.setFontSize(size); this.color(c);
  }
  rule(y = this.y, x1 = M, x2 = W - M) { this.doc.setDrawColor(...C.line); this.doc.setLineWidth(0.25); this.doc.line(x1, y, x2, y); }

  /** Header repeated on every page. */
  header() {
    const d = this.doc;
    this.font('bold', 13, false, C.verde); d.text('SYNTRA', M, 16);
    this.font('normal', 8, false, C.muted);
    d.text(t(INFORME_NOMBRE), W - M, 13, { align: 'right' });
    d.text(`${this.ev.id} · ${fechaCorta(this.ev.emitido)} (ART)`, W - M, 17.5, { align: 'right' });
    this.rule(21);
  }
  newPage() { this.doc.addPage(); this.header(); this.y = TOP; }
  ensure(h: number) { if (this.y + h > BOTTOM) this.newPage(); }

  wrap(text: string, w: number, size = 9, mono = false, bold = false): string[] {
    this.font(bold ? 'bold' : 'normal', size, mono);
    return this.doc.splitTextToSize(t(text), w) as string[];
  }

  /** Paragraph of wrapped text inside [x, x+w]; paginates line by line. */
  paragraph(text: string, x: number, w: number, o: { size?: number; mono?: boolean; bold?: boolean; color?: RGB } = {}) {
    const size = o.size ?? 9, lh = size * 0.47;
    for (const line of this.wrap(text, w, size, o.mono, o.bold)) {
      this.ensure(lh);
      this.font(o.bold ? 'bold' : 'normal', size, o.mono, o.color ?? C.ink);
      this.doc.text(line, x, this.y + lh * 0.8);
      this.y += lh;
    }
  }

  /** Numbered section: title in the left column (wide=false) or on its own line above full-width content. */
  section(n: number, title: string, wide = false) {
    this.ensure(wide ? 30 : 20);
    this.y += 3;
    this.rule(); this.y += 6;
    this.font('bold', 10.5, false, C.primary);
    this.doc.text(`${n}  ${t(title)}`, M, this.y);
    if (wide) this.y += 5; else this.y -= 0.5;
  }

  /** Label/value rows in the right column. */
  fields(rows: [string, string, boolean?][]) {
    for (const [k, v, mono] of rows) {
      const lines = this.wrap(v, COL_W - 38, mono ? 8 : 9, mono);
      this.ensure(lines.length * LH + 1);
      this.font('normal', 8.5, false, C.muted); this.doc.text(t(k), COL_X, this.y + 3.2);
      this.font('normal', mono ? 8 : 9, mono);
      lines.forEach((l, i) => this.doc.text(l, COL_X + 38, this.y + 3.2 + i * (mono ? 3.6 : LH)));
      this.y += lines.length * (mono ? 3.6 : LH) + 1.6;
    }
  }

  /** Table with wrapped cells, header row repeated after page breaks. */
  table(cols: { title: string; w: number }[], rows: Cell[][], size = 8) {
    const lh = size * 0.45, pad = 1.6;
    const head = () => {
      this.ensure(8);
      let x = M; this.font('bold', 8, false, C.muted);
      cols.forEach((c) => { this.doc.text(t(c.title), x, this.y + 3); x += c.w; });
      this.y += 5; this.rule(); this.y += 0.5;
    };
    head();
    for (const row of rows) {
      const wrapped = row.map((c, i) => this.wrap(c.text, cols[i].w - 3, c.mono ? size - 1 : size, c.mono, c.bold));
      const h = Math.max(...wrapped.map((l, i) => l.length * (row[i].mono ? lh - 0.3 : lh))) + pad * 2;
      if (this.y + h > BOTTOM) { this.newPage(); head(); }
      let x = M;
      row.forEach((c, i) => {
        this.font(c.bold ? 'bold' : 'normal', c.mono ? size - 1 : size, c.mono, c.color ?? C.ink);
        wrapped[i].forEach((l, j) => this.doc.text(l, x, this.y + pad + lh * 0.85 + j * (c.mono ? lh - 0.3 : lh)));
        x += cols[i].w;
      });
      this.y += h; this.rule();
    }
  }

  /** Footer "Página X de N" on every page, drawn at the end. */
  footers() {
    const n = this.doc.getNumberOfPages();
    for (let p = 1; p <= n; p++) {
      this.doc.setPage(p);
      this.rule(H - 14);
      this.font('normal', 7.5, false, C.muted);
      this.doc.text('Prototipo - no constituye una certificación oficial', M, H - 9);
      this.doc.text(`Página ${p} de ${n}`, W - M, H - 9, { align: 'right' });
    }
  }
}

/** Draws lots, forest patches and corridors as vector lines inside a box. */
function dibujarMapa(p: Pdf, lotes: Lote[], x0: number, y0: number, bw: number, bh: number) {
  const d = p.doc;
  const puntos: LatLng[] = [...lotes.flatMap((l) => l.polygon), ...parchesBosque.flatMap((b) => b.polygon), ...corredores.flatMap((c) => c.line)];
  const lats = puntos.map((q) => q[0]), lngs = puntos.map((q) => q[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180); // lng degrees shrink with latitude
  const spanX = Math.max((maxLng - minLng) * kx, 1e-9), spanY = Math.max(maxLat - minLat, 1e-9);
  const pad = 6, s = Math.min((bw - 2 * pad) / spanX, (bh - 2 * pad) / spanY);
  const ox = x0 + (bw - spanX * s) / 2, oy = y0 + (bh - spanY * s) / 2;
  const pr = ([lat, lng]: LatLng): [number, number] => [ox + (lng - minLng) * kx * s, oy + (maxLat - lat) * s];

  d.setFillColor(0xf7, 0xf9, 0xf5); d.setDrawColor(...C.line); d.setLineWidth(0.3); d.rect(x0, y0, bw, bh, 'FD');

  const poligono = (pts: LatLng[], fill: RGB, stroke: RGB, lw: number) => {
    const q = pts.map(pr);
    d.setFillColor(...fill); d.setDrawColor(...stroke); d.setLineWidth(lw);
    d.lines(q.slice(1).map((pt, i) => [pt[0] - q[i][0], pt[1] - q[i][1]]), q[0][0], q[0][1], [1, 1], 'FD', true);
    return q;
  };

  parchesBosque.forEach((b) => poligono(b.polygon, [0x9f, 0xc4, 0xad], C.verde, 0.5));
  lotes.forEach((l) => {
    const q = poligono(l.polygon, [0xe8, 0xf1, 0xe3], C.primary, 0.4);
    const cx = q.reduce((a, b) => a + b[0], 0) / q.length, cy = q.reduce((a, b) => a + b[1], 0) / q.length;
    p.font('bold', 6.5, false, C.ink);
    d.text(t(l.name), cx, cy, { align: 'center' });
    p.font('normal', 6, false, C.muted);
    d.text(`${l.ha} ha`, cx, cy + 3, { align: 'center' });
  });
  corredores.forEach((c) => {
    const q = c.line.map(pr);
    d.setDrawColor(...(c.status === 'Implantado' ? C.warn : ([0xe0, 0xb0, 0x1c] as RGB))); d.setLineWidth(0.9);
    for (let i = 1; i < q.length; i++) d.line(q[i - 1][0], q[i - 1][1], q[i][0], q[i][1]);
    p.font('bold', 6, false, C.ink); d.text(c.id, q[0][0] + 1, q[0][1] - 1);
  });
  p.font('normal', 6.5, false, C.muted);
  d.text('N', x0 + bw - 4, y0 + 5);
  d.setDrawColor(...C.muted); d.setLineWidth(0.3); d.line(x0 + bw - 3.6, y0 + 9, x0 + bw - 3.6, y0 + 6.5);
}

async function generarPdf(ev: EvidenciaInforme): Promise<jsPDF> {
  const p = new Pdf(ev);
  const d = p.doc;
  const cert = certificaciones.find((c) => c.label === ev.certObjetivo) ?? certificaciones[0];
  const totalHa = ev.lotes.reduce((s, l) => s + l.ha, 0);
  const s = ev.sellado;

  // Title block
  p.font('bold', 20, false, C.ink); d.text(t(INFORME_NOMBRE), M, p.y + 6); p.y += 11;
  p.font('normal', 10.5, false, C.primary); d.text(t(`Para certificación ${ev.certObjetivo} · con sello de integridad`), M, p.y + 3); p.y += 8;
  p.paragraph('Syntra deja constancia de que los datos técnicos y la evidencia recogidos en este informe constituyen el registro fiel e inalterable del establecimiento a la fecha de emisión. Syntra no otorga la certificación: acompaña al productor y entrega a la entidad certificadora evidencia verificable. Listo para revisión del perito/auditor de la certificadora.', M, W - 2 * M, { size: 9.5 });
  p.y += 2;
  p.paragraph('Huella raíz: ' + s.raizMerkle, M, W - 2 * M, { size: 8, mono: true, bold: true });
  p.y += 1;

  // 1 Establecimiento
  p.section(1, 'Establecimiento');
  p.fields([
    ['Nombre', establecimiento.name], ['RENSPA', establecimiento.renspa], ['Ubicación', establecimiento.location],
    ['Ecorregión', ecorregion.nombre], ['Lotes', `${ev.lotes.length} lotes · ${Math.round(totalHa * 10) / 10} ha`],
    ['Certificación objetivo', ev.certObjetivo],
  ]);

  // 2 Estado de cumplimiento
  p.section(2, 'Estado de cumplimiento', true);
  p.table(
    [{ title: 'Requisito', w: 50 }, { title: 'Estado', w: 26 }, { title: 'Evidencia', w: 48 }, { title: 'Cómo completarlo', w: 56 }],
    cert.items.map((r) => [{ text: r.rule }, { text: reqLabel[r.status], color: ESTADO_COLOR[r.status], bold: true }, { text: r.evidence }, { text: r.fix ?? '-' }]),
  );
  const totalCorr = corredores.reduce((a, c) => a + c.ha, 0);
  const impl = corredores.filter((c) => c.status === 'Implantado').reduce((a, c) => a + c.ha, 0);
  const fmtHa = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');
  p.y += 3;
  p.paragraph(`Plan de corredores: ${fmtHa(totalCorr)} ha en total (${fmtHa(impl)} ha implantadas, ${fmtHa(totalCorr - impl)} ha planificadas). Biodiversidad del Lote 3: ${biodiversidadLote3.actual} actual -> ${biodiversidadLote3.proyectado} proyectado.`, M, W - 2 * M, { size: 9 });

  // 3 Paquete de evidencia (QR block needs ~34 mm)
  p.section(3, 'Paquete de evidencia');
  p.ensure(36);
  const yQr = p.y;
  const qr = await QRCode.toDataURL(URL_VERIFICACION, { margin: 1, width: 300, errorCorrectionLevel: 'M' });
  d.addImage(qr, 'PNG', W - M - 28, yQr, 28, 28);
  p.font('normal', 6.5, false, C.muted); d.text('Escaneá para verificar en línea', W - M - 14, yQr + 31, { align: 'center' });
  const w3 = COL_W - 32;
  p.paragraph('El paquete contiene cada archivo de evidencia con su huella digital SHA-256, listados en el inventario de la sección 8.', COL_X, w3);
  p.y += 1.5;
  const yAntes = p.y;
  p.fields([['Archivo contenedor', `evidencia-${ev.id}.zip`], ['Política de retención', '5 años desde la emisión']]);
  void yAntes;
  p.y = Math.max(p.y, yQr + 34);

  // 4 Sellado de tiempo
  p.section(4, 'Sellado de tiempo');
  p.fields([
    ['Red', RED_SELLADO], ['Hash del manifiesto', s.hashManifiesto, true], ['Raíz del árbol de Merkle', s.raizMerkle, true],
    ['Transacción', s.transaccion, true], ['Número de bloque', s.bloque], ['Fecha/hora de sellado', s.fecha],
  ]);
  p.paragraph('La huella del manifiesto forma parte del árbol de Merkle; el valor registrado en la BFA es la raíz, que certifica todas las evidencias con un único sello de tiempo.', COL_X, COL_W, { size: 8.5, color: C.muted });

  // 5 Cómo verificarlo
  p.section(5, 'Cómo verificarlo');
  [
    'Obtené el SHA-256 de cada archivo de evidencia.',
    'Compará cada huella con el inventario (sección 8) y con el manifiesto.',
    'Recalculá la raíz de Merkle a partir de las huellas del inventario.',
    'Contrastá la raíz con el sello registrado en la BFA (transacción y bloque).',
    'Si un solo dato cambió, la raíz no coincide.',
  ].forEach((txt, i) => {
    const lines = p.wrap(txt, COL_W - 7);
    p.ensure(lines.length * LH + 1);
    p.font('bold', 9, false, C.primary); d.text(`${i + 1}.`, COL_X, p.y + 3.2);
    p.font('normal', 9); lines.forEach((l, j) => d.text(l, COL_X + 7, p.y + 3.2 + j * LH));
    p.y += lines.length * LH + 1.2;
  });

  // 6 Mapa
  p.section(6, 'Mapa del establecimiento', true);
  p.ensure(90 + 12);
  p.y += 1;
  dibujarMapa(p, ev.lotes, M, p.y, 180, 90);
  p.y += 94;
  // Legend
  let lx = M;
  const leyenda: { txt: string; kind: 'lote' | 'bosque' | 'impl' | 'plan' }[] = [
    { txt: 'Lotes', kind: 'lote' }, { txt: 'Parches de bosque', kind: 'bosque' }, { txt: 'Corredor implantado', kind: 'impl' }, { txt: 'Corredor planificado', kind: 'plan' },
  ];
  leyenda.forEach((it) => {
    if (it.kind === 'lote') { d.setFillColor(0xe8, 0xf1, 0xe3); d.setDrawColor(...C.primary); d.setLineWidth(0.4); d.rect(lx, p.y, 5, 3, 'FD'); }
    else if (it.kind === 'bosque') { d.setFillColor(0x9f, 0xc4, 0xad); d.setDrawColor(...C.verde); d.setLineWidth(0.4); d.rect(lx, p.y, 5, 3, 'FD'); }
    else { d.setDrawColor(...(it.kind === 'impl' ? C.warn : ([0xe0, 0xb0, 0x1c] as RGB))); d.setLineWidth(0.9); d.line(lx, p.y + 1.5, lx + 5, p.y + 1.5); }
    p.font('normal', 7.5, false, C.muted); d.text(it.txt, lx + 7, p.y + 2.5);
    lx += 7 + d.getTextWidth(it.txt) + 7;
  });
  p.y += 6;

  // 7 Historial de eventos
  p.section(7, 'Historial de eventos', true);
  p.table(
    [{ title: 'Fecha', w: 30 }, { title: 'Evento', w: 100 }, { title: 'Fuente', w: 50 }],
    eventos.map((e) => [{ text: e.date }, { text: `${e.title} (${e.lote})` }, { text: e.source }]),
  );

  // 8 Inventario de archivos
  p.section(8, 'Inventario de archivos', true);
  p.table(
    [{ title: 'Archivo', w: 38 }, { title: 'Descripción', w: 48 }, { title: 'Bytes', w: 16 }, { title: 'Hash SHA-256', w: 78 }],
    ev.archivos.map((a) => [
      { text: a.archivo, bold: true }, { text: a.descripcion }, { text: formatearMiles(a.bytes) },
      { text: a.hash.slice(0, 32) + '\n' + a.hash.slice(32), mono: true },
    ]),
  );

  p.footers();
  return d;
}

export const descargarInforme: DescargarInforme = async (lotes, certId) => {
  const ev = await construirEvidencia(lotes, certId);
  const doc = await generarPdf(ev);
  doc.save(`syntra-informe-evidencia-${ev.id}.pdf`);
};
