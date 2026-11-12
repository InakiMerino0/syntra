// Mock data for the prototype. Single source of truth for every screen. No backend yet.
export type Tone = 'ok' | 'warn' | 'bad';
export type LatLng = [number, number];

export const establecimiento = {
  name: 'Establecimiento La Esperanza',
  location: 'Dpto. Río Seco, Córdoba',
  renspa: '14.123.0.00456/00',
  totalHa: 312,
  center: [-30.121, -63.483] as LatLng,
  biodiversity: 68,
};

/** Ecoregion drives which native species and corridor designs the algorithm recommends. Verify before the pitch. */
export const ecorregion = {
  nombre: 'Chaco Seco',
  descripcion: 'Bosque xerófilo del norte de Córdoba: quebrachales y algarrobales con estación seca marcada.',
  fuenteDatos: 'Capa de ecorregiones (APN) · OTBN Córdoba · Sentinel-2',
  especies: [
    { nombre: 'Algarrobo blanco', cientifico: 'Prosopis alba', rol: 'Estrato arbóreo · sombra para ganado' },
    { nombre: 'Quebracho blanco', cientifico: 'Aspidosperma quebracho-blanco', rol: 'Estrato arbóreo · estructura del corredor' },
    { nombre: 'Mistol', cientifico: 'Sarcomphalus mistol', rol: 'Fruto para fauna · polinizadores' },
    { nombre: 'Chañar', cientifico: 'Geoffroea decorticans', rol: 'Rebrota de raíz · autosiembra rápida' },
    { nombre: 'Tala', cientifico: 'Celtis ehrenbergiana', rol: 'Refugio de aves y enemigos naturales' },
  ],
};

/** Field biodiversity monitoring (pan traps / visual counts), Lote 3. Corridor edge vs. lot center. */
export interface Monitoreo { fecha: string; sitio: string; polinizadores: number; enemigosNaturales: number; riqueza: number }
export const monitoreos: Monitoreo[] = [
  { fecha: '15/09/2026', sitio: 'Centro del lote (sin corredor)', polinizadores: 9, enemigosNaturales: 4, riqueza: 6 },
  { fecha: '15/09/2026', sitio: 'Borde con monte nativo', polinizadores: 31, enemigosNaturales: 14, riqueza: 17 },
  { fecha: '12/11/2026', sitio: 'Centro del lote (sin corredor)', polinizadores: 11, enemigosNaturales: 5, riqueza: 7 },
  { fecha: '12/11/2026', sitio: 'Borde con monte nativo', polinizadores: 34, enemigosNaturales: 12, riqueza: 18 },
];

/** Long-term follow-up: a corridor proves it is functional and lasting only if it survives and self-seeds. */
export interface Seguimiento { id: string; titulo: string; implantado: string; nota: string; serie: { anio: number; ndvi: number; supervivencia: number; renuevos: number }[] }
export const seguimientoCorredores: Seguimiento[] = [
  { id: 'ref', titulo: 'Corredor de referencia · caso del equipo', implantado: '2016', nota: 'Corredor funcional autorreplicable implantado hace 10 años en una empresa agroexportadora (caso real, datos ilustrativos).', serie: [
    { anio: 2016, ndvi: 0.31, supervivencia: 100, renuevos: 0 },
    { anio: 2018, ndvi: 0.44, supervivencia: 91, renuevos: 120 },
    { anio: 2020, ndvi: 0.56, supervivencia: 88, renuevos: 410 },
    { anio: 2022, ndvi: 0.63, supervivencia: 87, renuevos: 780 },
    { anio: 2024, ndvi: 0.68, supervivencia: 87, renuevos: 1150 },
    { anio: 2026, ndvi: 0.71, supervivencia: 86, renuevos: 1420 },
  ] },
  { id: 'A', titulo: 'A · Corredor borde norte (Lote 3)', implantado: '12/11/2026', nota: 'Recién implantado: Syntra lo sigue por satélite cada 5 días y con monitoreo de campo cada campaña.', serie: [
    { anio: 2026, ndvi: 0.29, supervivencia: 100, renuevos: 0 },
  ] },
];


export interface Lote {
  id: string;
  name: string;
  crop: string;
  ha: number;
  bio: number;
  status: string;
  tone: Tone;
  note: string;
  polygon: LatLng[];
}

export const lotes: Lote[] = [
  { id: 'l1', name: 'Lote 1 — La Loma', crop: 'Maíz', ha: 96, bio: 71, status: 'Certificado', tone: 'ok', note: 'Último análisis hace 3 días. Sin cambios de cobertura desde 2020.', polygon: [[-30.110, -63.495], [-30.110, -63.485], [-30.119, -63.485], [-30.119, -63.495]] },
  { id: 'l2', name: 'Lote 2 — El Molino', crop: 'Soja', ha: 74, bio: 66, status: 'Certificado', tone: 'ok', note: 'Último análisis hace 2 días. Sin cambios de cobertura desde 2020.', polygon: [[-30.110, -63.484], [-30.110, -63.476], [-30.1186, -63.476], [-30.1186, -63.484]] },
  { id: 'l3', name: 'Lote 3 — El Bajo', crop: 'Soja', ha: 86, bio: 64, status: 'Con brechas', tone: 'warn', note: 'Limita con bosque nativo al este. 2 brechas de biodiversidad para RTRS.', polygon: [[-30.121, -63.495], [-30.121, -63.485], [-30.1285, -63.484], [-30.1295, -63.494]] },
  { id: 'l4', name: 'Lote 4 — Monte Norte', crop: 'Trigo', ha: 56, bio: 74, status: 'Sin analizar', tone: 'bad', note: 'Lote nuevo. Revisar superposición con zona de bosque protegido.', polygon: [[-30.121, -63.484], [-30.121, -63.477], [-30.128, -63.476], [-30.129, -63.483]] },
];

export const capas = {
  bosqueNativo: [[-30.120, -63.476], [-30.120, -63.466], [-30.134, -63.466], [-30.134, -63.475]] as LatLng[],
  focosCalor: [[-30.126, -63.470], [-30.131, -63.469]] as LatLng[],
};

export const kpis = [
  { label: 'Superficie mapeada', value: '312 ha', sub: '4 lotes' },
  { label: 'Registros firmados', value: '128', sub: 'en Polygon (testnet)' },
  { label: 'Último análisis satelital', value: 'Hoy', sub: 'Sentinel-2 · 10 m' },
  { label: 'Deforestación post 2020', value: '0 ha', sub: 'detectada en el establecimiento' },
];

export interface Eje { name: string; pct: number; tone: Tone; status: string; detail: string; normas: string; obs: string }

/** Regulatory axes. Nacional = OTBN (Ley 26.331); Provincial (Córdoba) = Ley Agroforestal + BPA. */
export const ejes: Eje[] = [
  { name: 'Provincial (Córdoba)', pct: 70, tone: 'warn', status: 'Parcial', detail: 'Ley Agroforestal · BPA · cobertura forestal pendiente en L3', normas: 'Ley Agroforestal de Córdoba; Buenas Prácticas Agropecuarias (BPA)', obs: 'Cobertura forestal del L3 por debajo del mínimo (en curso con corredores); faltan registros de aplicaciones y envases' },
  { name: 'Nacional', pct: 100, tone: 'ok', status: 'Cumple', detail: 'OTBN (Ley 26.331) · RENSPA vigente', normas: 'OTBN — Ordenamiento Territorial de Bosques Nativos (Ley 26.331); RENSPA', obs: 'Sin desmonte en categorías I/II; 0 ha de superposición con zonas protegidas' },
  { name: 'Internacional (EUDR)', pct: 78, tone: 'warn', status: 'Faltan datos', detail: 'Falta prueba de legalidad del Lote 4', normas: 'EUDR: geolocalización, no deforestación post 31/12/2020, legalidad', obs: 'Legalidad pendiente en L4' },
  { name: 'Certificaciones', pct: 40, tone: 'bad', status: 'Con brechas', detail: 'RTRS: faltan vegetación nativa y plan de biodiversidad', normas: 'RTRS (objetivo); ISCC', obs: 'Vegetación nativa y plan de biodiversidad: en curso con corredores' },
];

export type ReqStatus = 'ok' | 'warn' | 'bad'; // ok=Cumple, warn=Falta dato, bad=Brecha
export const reqLabel: Record<ReqStatus, string> = { ok: 'Cumple', warn: 'Falta dato', bad: 'Brecha' };

export interface Requisito { rule: string; evidence: string; status: ReqStatus; fix?: string }
export interface Certificacion { id: string; label: string; desc: string; items: Requisito[] }

/** Requirements per standard (illustrative — validate against the official standards before the pitch). */
export const certificaciones: Certificacion[] = [
  { id: 'rtrs', label: 'RTRS (soja responsable)', desc: 'Estándar internacional para soja; exige conservar y restaurar vegetación nativa y un plan de biodiversidad.', items: [
    { rule: 'Sin conversión de ecosistemas naturales', evidence: 'cambio de cobertura firmado 0x5a07…', status: 'ok' },
    { rule: 'Geolocalización de los lotes', evidence: 'polígono firmado 0x44c0…', status: 'ok' },
    { rule: 'Áreas de vegetación nativa mantenidas o restauradas', evidence: 'cobertura nativa 3,1% del lote', status: 'bad', fix: 'implantar 4,2 ha de corredores (A, B y C).' },
    { rule: 'Plan de manejo de biodiversidad', evidence: 'no hay plan cargado', status: 'bad', fix: 'Syntra lo genera a partir del diagnóstico y los corredores elegidos.' },
    { rule: 'Buenas prácticas de aplicación de fitosanitarios', evidence: 'sin registros de aplicación', status: 'warn', fix: 'registrar las aplicaciones en "Registrar acción".' },
  ] },
  { id: 'eudr', label: 'EUDR (Unión Europea)', desc: 'Reglamento europeo de deforestación: geolocalización, no deforestación posterior al 31/12/2020 y legalidad.', items: [
    { rule: 'Geolocalización de la parcela', evidence: 'polígono firmado 0x44c0…', status: 'ok' },
    { rule: 'Sin deforestación posterior al 31/12/2020', evidence: 'Sentinel-2 2020 vs 2026: 0 ha', status: 'ok' },
    { rule: 'Legalidad de la producción', evidence: 'documentación no cargada', status: 'warn', fix: 'cargar RENSPA y titularidad o contrato de arrendamiento.' },
  ] },
  { id: 'iscc', label: 'ISCC', desc: 'Certificación de sustentabilidad para biocombustibles y cadenas agroindustriales.', items: [
    { rule: 'Sin uso de tierras de alto valor de biodiversidad', evidence: 'superposición 0 ha con áreas protegidas', status: 'ok' },
    { rule: 'Medidas de protección de la biodiversidad', evidence: 'cobertura nativa 3,1% del lote', status: 'bad', fix: 'implantar corredores A y B (3,0 ha).' },
    { rule: 'Registro de insumos y emisiones', evidence: 'sin registros de insumos', status: 'warn', fix: 'registrar siembra y fertilización.' },
  ] },
  { id: 'nacional', label: 'OTBN · Ley 26.331', desc: 'Eje nacional: Ordenamiento Territorial de Bosques Nativos (Ley 26.331 de Presupuestos Mínimos de Bosques Nativos).', items: [
    { rule: 'Sin desmonte de bosque nativo en categorías I (rojo) y II (amarillo)', evidence: 'cambio de cobertura 2020–2026: 0 ha', status: 'ok' },
    { rule: 'Sin intervención en zonas protegidas del OTBN', evidence: 'superposición 0 ha con capa OTBN (Lotes 1–3)', status: 'ok' },
    { rule: 'Lotes nuevos verificados contra la capa OTBN', evidence: 'Lote 4 sin analizar; linda con monte nativo', status: 'warn', fix: 'analizar el Lote 4 y verificar su superposición con bosque nativo.' },
  ] },
  { id: 'cordoba', label: 'Ley Agroforestal + BPA Córdoba', desc: 'Eje provincial: Ley Agroforestal de Córdoba (cobertura forestal mínima por predio) y Buenas Prácticas Agropecuarias (BPA).', items: [
    { rule: 'Cobertura forestal mínima del predio según Ley Agroforestal (2–5% según zona)', evidence: 'cobertura nativa 3,1% del Lote 3; mínimo de la zona 5%', status: 'bad', fix: 'implantar corredores A, B y C (4,2 ha) con especies nativas.' },
    { rule: 'Registro de aplicaciones fitosanitarias y distancias a zonas sensibles', evidence: 'sin registros de aplicación', status: 'warn', fix: 'registrar las aplicaciones con ubicación en "Registrar acción".' },
    { rule: 'BPA: rotación de cultivos', evidence: 'maíz / soja / trigo en los últimos 3 ciclos', status: 'ok' },
    { rule: 'BPA: cobertura de suelo entre campañas', evidence: 'NDVI invernal bajo (0,20) en el Lote 3', status: 'warn', fix: 'declarar cultivo de servicio o cobertura invernal.' },
    { rule: 'BPA: gestión de envases vacíos de fitosanitarios', evidence: 'sin comprobantes de entrega a centro de acopio', status: 'warn', fix: 'cargar el comprobante de entrega de envases (triple lavado).' },
  ] },
];

export interface Corredor { id: string; title: string; ha: number; impact: number; body: string; closes: string; status: 'Implantado' | 'Planificado'; line: LatLng[] }

export const corredores: Corredor[] = [
  { id: 'A', title: 'A · Corredor borde norte', ha: 1.2, impact: 6, body: 'Franja de 10 m × 1.200 m con especies nativas autosustentables.', closes: 'Cierra: vegetación nativa (RTRS)', status: 'Implantado', line: [[-30.1215, -63.4945], [-30.1215, -63.4852]] },
  { id: 'B', title: 'B · Corredor central N–S', ha: 1.8, impact: 5, body: 'Franja que conecta el borde norte con el monte del este.', closes: 'Cierra: protección de biodiversidad (ISCC)', status: 'Planificado', line: [[-30.1215, -63.4900], [-30.1288, -63.4890], [-30.1280, -63.4760]] },
  { id: 'C', title: 'C · Isla de vegetación en el bajo', ha: 1.2, impact: 3, body: 'En la zona de menor rinde histórico (NDVI bajo) del lote.', closes: 'Suma al plan de biodiversidad (RTRS)', status: 'Planificado', line: [[-30.1270, -63.4930], [-30.1280, -63.4915]] },
];

export const biodiversidadLote3 = {
  actual: 64,
  proyectado: 78,
  breakdown: [
    { label: 'Cobertura nativa en 500 m', from: 58, to: 70 },
    { label: 'Conectividad (bordes y corredores)', from: 61, to: 82 },
    { label: 'Heterogeneidad del paisaje', from: 73, to: 81 },
  ],
  rinde: { cultivo: 'soja', pct: 14, fuente: '[FUENTE A CITAR] estudios del equipo sobre corredores funcionales' },
};

/** NDVI mean per scene, 2024 → 2026. */
export const ndviSerie = [0.22, 0.3, 0.48, 0.7, 0.81, 0.76, 0.5, 0.28, 0.2, 0.25, 0.36, 0.58, 0.78, 0.82, 0.7, 0.45, 0.27, 0.22, 0.31, 0.52, 0.74];

export type EventKind = 'sat' | 'bio' | 'prod' | 'lote';
export interface Evento { id: number; kind: EventKind; title: string; lote: string; date: string; source: string; hash: string; block: string }

export const eventos: Evento[] = [
  { id: 10, kind: 'bio', title: 'Monitoreo de campo · 34 polinizadores y 12 enemigos naturales en el borde', lote: 'Lote 3', date: '12/11/2026 17:20', source: 'Técnico de campo + fotos georreferenciadas', hash: '0x8d21e7…4b90c2', block: '#58.217.006' },
  { id: 8, kind: 'prod', title: 'Corredor A implantado · 1,2 ha de nativas', lote: 'Lote 3', date: '12/11/2026 16:05', source: 'Productor + foto georreferenciada', hash: '0x0c5f2b…d1a930', block: '#58.216.441' },
  { id: 9, kind: 'bio', title: 'Plan de corredores propuesto · 4,2 ha (RTRS)', lote: 'Lote 3', date: '12/11/2026 14:33', source: 'Syntra · algoritmo v0.3', hash: '0x3be14c…a077d0', block: '#58.214.908' },
  { id: 1, kind: 'bio', title: 'Análisis de biodiversidad 64/100', lote: 'Lote 3', date: '12/11/2026 14:32', source: 'Syntra · algoritmo v0.3', hash: '0x91bd5e…f204aa', block: '#58.214.907' },
  { id: 2, kind: 'sat', title: 'NDVI medio 0,70', lote: 'Lote 3', date: '12/11/2026 14:31', source: 'Sentinel-2 L2A (Copernicus)', hash: '0x7f3a02…98c21e', block: '#58.214.906' },
  { id: 3, kind: 'sat', title: 'Cambio de cobertura 2020 → 2026: 0 ha', lote: 'Lote 3', date: '12/11/2026 14:31', source: 'Sentinel-2 L2A (Copernicus)', hash: '0x5a07c1…b0e3d1', block: '#58.214.906' },
  { id: 4, kind: 'sat', title: 'Sin focos de calor en el lote', lote: 'Lote 3', date: '12/11/2026 14:30', source: 'NASA FIRMS', hash: '0xe1f49a…3d72b5', block: '#58.214.905' },
  { id: 5, kind: 'prod', title: 'Siembra de maíz · 96 ha', lote: 'Lote 1', date: '11/11/2026 09:10', source: 'Declaración del productor', hash: '0x2c8817…a47e10', block: '#58.180.122' },
  { id: 6, kind: 'prod', title: 'Siembra de soja · 86 ha', lote: 'Lote 3', date: '02/10/2026 08:45', source: 'Declaración del productor', hash: '0x6b30de…19c4f8', block: '#57.402.310' },
  { id: 7, kind: 'lote', title: 'Polígono del lote creado · 86,2 ha', lote: 'Lote 3', date: '15/09/2026 17:02', source: 'Productor', hash: '0x44c0a8…e29f12', block: '#56.950.004' },
];

export const eventKinds: Record<EventKind, { label: string; color: string }> = {
  sat: { label: 'Satelital', color: '#1E5AA8' },
  bio: { label: 'Biodiversidad', color: '#1D6A47' },
  prod: { label: 'Intervenciones', color: '#C2620E' },
  lote: { label: 'Lotes', color: '#55615A' },
};

export const procesamientoPasos = [
  { label: 'Obteniendo imágenes Sentinel-2', detail: '14 escenas · 2020-01 → 2026-11 · nubosidad < 20%' },
  { label: 'Calculando índices', detail: 'NDVI, NDWI, cambio de cobertura vs. 31/12/2020' },
  { label: 'Análisis de biodiversidad', detail: 'cobertura nativa · bordes · heterogeneidad → 64/100' },
  { label: 'Comparando con la certificación objetivo', detail: 'RTRS · 5 requisitos · 2 brechas · 1 dato faltante' },
  { label: 'Diseñando corredores biológicos', detail: '3 corredores · 4,2 ha · biodiversidad 64 → 78' },
  { label: 'Generando hash SHA-256', detail: 'del diagnóstico completo' },
  { label: 'Anclando en blockchain', detail: 'Polygon Amoy (simulado)' },
];

export const tiposAccion = [
  { id: 'corredor', label: 'Corredor / vegetación nativa', f1: 'Corredor del plan', v1: 'A · borde norte', f2: 'Superficie implantada', v2: '1,2 ha' },
  { id: 'siembra', label: 'Siembra', f1: 'Semilla / híbrido', v1: 'Soja DM 46R18', f2: 'Densidad', v2: '320.000 pl/ha' },
  { id: 'fert', label: 'Fertilización', f1: 'Producto', v1: 'Urea 46-0-0', f2: 'Dosis', v2: '90 kg/ha' },
  { id: 'fito', label: 'Aplicación fitosanitaria', f1: 'Producto', v1: 'Glifosato 66,2%', f2: 'Dosis', v2: '1,5 l/ha' },
  { id: 'riego', label: 'Riego', f1: 'Fuente de agua', v1: 'Pozo 2', f2: 'Lámina', v2: '25 mm' },
  { id: 'cosecha', label: 'Cosecha', f1: 'Destino', v1: 'Acopio Río Seco', f2: 'Rinde', v2: '3.400 kg/ha' },
  { id: 'monitoreo', label: 'Monitoreo de biodiversidad', f1: 'Polinizadores (individuos / 15 min)', v1: '34', f2: 'Enemigos naturales (individuos)', v2: '12' },
];

export * from './plan';
