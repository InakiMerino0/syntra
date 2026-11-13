// "Plan de acción productivo" — deterministic MOCK of the recommendation algorithm (v0.3, simulated).
// Given a target certification + the establishment data, it decides which field actions close each gap.
// Rules are intentionally simple and data-driven so the demo shows *why* each action was chosen.
import { biodiversidadLote3, capas, certificaciones, corredores, ecorregion, establecimiento, eventos, lotes, monitoreos, ndviSerie, tiposAccion } from './index';
import { parchesBosque } from './capas';
import { especiePorId } from './especies';
import type { Especie } from './especies';
import type { Certificacion, Corredor, Lote, Requisito } from './index';

export type Prioridad = 'alta' | 'media' | 'baja';
export type Plazo = 'Esta semana' | 'Este mes' | 'Antes de la siembra' | 'Durante la campaña';
export const plazos: Plazo[] = ['Esta semana', 'Este mes', 'Antes de la siembra', 'Durante la campaña'];
export const prioridadTone: Record<Prioridad, 'bad' | 'warn' | 'ok'> = { alta: 'bad', media: 'warn', baja: 'ok' };

/** Multi-year timeline: a corridor takes ~1 year to implant and up to 5 years of additionality monitoring. */
export type FaseId = 'f0' | 'f1' | 'f12' | 'f25';
export interface FasePlan { id: FaseId; anio: string; titulo: string; periodo: string; descripcion: string }
export const fasesPlan: FasePlan[] = [
  { id: 'f0', anio: 'Año 0', titulo: 'Diagnóstico y diseño', periodo: 'Semanas 1–8', descripcion: 'Documentación, diseño del corredor, elección de especies y pedido de plantines al vivero.' },
  { id: 'f1', anio: 'Año 1', titulo: 'Implantación', periodo: 'Preparación jul–sep · plantación en primavera (oct–dic)', descripcion: 'Preparación de la franja, plantación con las primeras lluvias y riegos de establecimiento el 1.er verano.' },
  { id: 'f12', anio: 'Años 1–2', titulo: 'Mantenimiento y reposición', periodo: 'Desde la plantación hasta el 2.º año', descripcion: 'Control de malezas, protección y reposición de lo que no prendió. Después del 2.º–3.er año el corredor se sostiene solo.' },
  { id: 'f25', anio: 'Años 2–5', titulo: 'Monitoreo de adicionalidad', periodo: 'Una vez por año', descripcion: 'Evidencia para el certificador: plantas vivas, % de superficie intervenida y polinizadores / enemigos naturales.' },
];

export type NivelPlan = 'basico' | 'medio' | 'premium';
export const nivelesPlan: NivelPlan[] = ['basico', 'medio', 'premium'];
export interface NivelInfo { id: NivelPlan; label: string; bajada: string; ejecuta: string; monitoreo: string; garantiaPct: number; costoRelativo: number; densidadFactor: number; productorPct: number }
export const nivelInfo: Record<NivelPlan, NivelInfo> = {
  basico: { id: 'basico', label: 'Básico', bajada: 'Corredor mínimo para cumplir el requisito. Lo ejecutás vos, con guía de Syntra.', ejecuta: 'Productor, con guía', monitoreo: 'Anual con planilla guía (años 2–5)', garantiaPct: 0, costoRelativo: 1, densidadFactor: 0.7, productorPct: 1 },
  medio: { id: 'medio', label: 'Recomendado', bajada: 'Corredores conectados con densidad completa. Técnico de Syntra en los puntos clave.', ejecuta: 'Productor + técnico de Syntra', monitoreo: 'Anual con técnico (años 2–5)', garantiaPct: 30, costoRelativo: 1.6, densidadFactor: 1, productorPct: 0.6 },
  premium: { id: 'premium', label: 'Premium', bajada: 'Conectividad completa con islas de paso. Syntra lo ejecuta y lo monitorea más tiempo.', ejecuta: 'Syntra, llave en mano', monitoreo: 'Semestral con técnico y satélite (años 2–5) + 3 años extra', garantiaPct: 70, costoRelativo: 2.4, densidadFactor: 1.15, productorPct: 0.1 },
};
export const nivelDe = (v: string | null | undefined): NivelPlan => (v === 'basico' || v === 'premium' ? v : 'medio');

export interface EspecieMezcla { especie: Especie; /** plantas/ha ajustadas al nivel */ densidad: number; plantas: number }
export interface MezclaCorredor {
  corredorId: string;
  titulo: string;
  ha: number;
  plantas: number;
  zonaAnegable: boolean;
  nota: string;
  especies: EspecieMezcla[];
}

export interface DatoPlan { label: string; valor: string; fuente: string }

export interface AccionPlan {
  id: string;
  titulo: string;
  detalle: string;
  lote: string;
  /** Requirement (rule text) this action helps close; null = recommended but not tied to a requirement. */
  requisito: string | null;
  prioridad: Prioridad;
  plazo: Plazo;
  esfuerzo: string;
  impacto: string;
  /** Matches a `tiposAccion` id when the action is registered from "Registrar acción". */
  tipo?: string;
  /** Phase of the multi-year timeline this action belongs to. */
  fase: FaseId;
  /** When within the phase (e.g. "Semanas 1–2", "oct–dic del año 1"). */
  momento: string;
  /** Species mix + density (corridor-implantation actions only). */
  mezcla?: MezclaCorredor;
  /** Why the algorithm chose it (rule that fired + data that triggered it). */
  porQue: string;
  /** Where to act in the app (defaults to /accion). */
  link: string;
  /** Label for the secondary link when `link` is not /accion (defaults by route). */
  linkLabel?: string;
}

export interface ResumenPlan {
  certId: string;
  certLabel: string;
  totalRequisitos: number;
  cumplidosHoy: number;
  cumplidosConPlan: number;
  haImplantar: number;
  bioActual: number;
  bioProyectada: number;
  rinde: { cultivo: string; metrica: string; pct: number; fuente: string } | null;
  porPrioridad: Record<Prioridad, number>;
  /** Plants, field days (years 0–2) and the share the producer does, for the selected tier. */
  plantas: number;
  jornadas: number;
  jornadasProductor: number;
}

export interface ResumenNivel {
  nivel: NivelPlan;
  label: string;
  bajada: string;
  ejecuta: string;
  monitoreo: string;
  garantiaPct: number;
  /** Relative cost vs. the básico tier (no currency). */
  costoRelativo: number;
  ha: number;
  plantas: number;
  jornadas: number;
  jornadasProductor: number;
  bioProyectada: number;
  cumplidosConPlan: number;
  totalRequisitos: number;
  /** Requirements that stay as "Falta dato" or "Mejora necesaria" with this tier. */
  sinCubrir: string[];
}

export interface ReglaPlan { id: string; si: string; entonces: string }

export interface Plan {
  version: string;
  cert: Certificacion;
  datos: DatoPlan[];
  acciones: AccionPlan[];
  resumen: ResumenPlan;
  /** Rules that fired for this certification (in evaluation order). */
  reglas: ReglaPlan[];
  nivel: NivelPlan;
  /** Side-by-side summary of the three tiers (same certification). */
  niveles: ResumenNivel[];
  fases: FasePlan[];
  /** Species + density per planned corridor (illustrative sheet, pending biology validation). */
  mezclas: MezclaCorredor[];
  garantia: { pct: number; texto: string };
}

const fmt = (n: number, d = 1) => n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
const short = (l: Lote) => l.name.split(' — ')[0];
const tipoLabel = (id: string) => tiposAccion.find((t) => t.id === id)?.label ?? id;
const ORDEN_PRIORIDAD: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 };

/** Which lots a certification applies to (RTRS is soy-only). */
function lotesEnAlcance(cert: Certificacion): Lote[] {
  return cert.id === 'rtrs' ? lotes.filter((l) => l.crop.toLowerCase() === 'soja') : lotes;
}

/** Lots whose diagnosis mentions a forest patch on the border (Lote 3 & 4 in the mock). */
const lindaConMonte = (l: Lote) => /bosque|monte/i.test(l.note);

/** Corridor letters named in a requirement's fix text ("corredores A y B"). */
function corredoresDe(req: Requisito): Corredor[] {
  const letras = new Set((req.fix ?? '').match(/\b[A-Z]\b/g) ?? []);
  return corredores.filter((c) => letras.has(c.id));
}

/** Base species mix per corridor (plants/ha at the recommended tier). Illustrative, pending biology validation. */
const MEZCLAS: Record<string, [string, number][]> = {
  B: [['algarrobo', 100], ['quebracho', 80], ['mistol', 80], ['chanar', 120], ['tala', 60], ['jarilla', 150], ['poleo', 100]],
  C: [['algarrobo', 160], ['tala', 140], ['chanar', 60], ['poleo', 100]],
  P: [['mistol', 100], ['algarrobo', 100], ['chanar', 100], ['tala', 50], ['jarilla', 150], ['poleo', 100]],
};
const PLANTAS_POR_JORNADA = 350;
const ISLAS_HA = 1.2;
const ISLAS_IMPACTO = 4;

function mezclaDe(clave: string, corredorId: string, titulo: string, ha: number, factor: number, zonaAnegable: boolean): MezclaCorredor {
  const base = MEZCLAS[clave] ?? MEZCLAS.B;
  const especies: EspecieMezcla[] = base.map(([id, d]) => {
    const densidad = Math.round((d * factor) / 10) * 10;
    return { especie: especiePorId(id), densidad, plantas: Math.round(densidad * ha) };
  });
  return {
    corredorId, titulo, ha, zonaAnegable, especies,
    plantas: especies.reduce((t, e) => t + e.plantas, 0),
    nota: zonaAnegable
      ? 'Zona anegable (el bajo): las especies que no toleran anegamiento van solo en el borde alto de la franja.'
      : 'Mezcla de árboles y arbustos: los arbustos dan flores para polinizadores y los árboles dan estructura.',
  };
}

export function generarPlan(certId: string, nivel: NivelPlan = 'medio'): Plan {
  const plan = construirPlan(certId, nivel);
  const niveles: ResumenNivel[] = nivelesPlan.map((n) => {
    const p = n === nivel ? plan : construirPlan(certId, n);
    const info = nivelInfo[n];
    const cubiertos = new Set(p.acciones.map((a) => a.requisito).filter(Boolean));
    return {
      nivel: n, label: info.label, bajada: info.bajada, ejecuta: info.ejecuta, monitoreo: info.monitoreo,
      garantiaPct: info.garantiaPct, costoRelativo: info.costoRelativo,
      ha: p.resumen.haImplantar, plantas: p.resumen.plantas, jornadas: p.resumen.jornadas, jornadasProductor: p.resumen.jornadasProductor,
      bioProyectada: p.resumen.bioProyectada, cumplidosConPlan: p.resumen.cumplidosConPlan, totalRequisitos: p.resumen.totalRequisitos,
      sinCubrir: p.cert.items.filter((i) => i.status !== 'ok' && !cubiertos.has(i.rule)).map((i) => i.rule),
    };
  });
  return { ...plan, niveles };
}

function construirPlan(certId: string, nivel: NivelPlan): Plan {
  const info = nivelInfo[nivel];
  const porNivel = (b: string, m: string, p: string): string => (nivel === 'basico' ? b : nivel === 'premium' ? p : m);
  const cert = certificaciones.find((c) => c.id === certId) ?? certificaciones[0];
  const alcance = lotesEnAlcance(cert);
  const sinAnalizar = lotes.filter((l) => l.tone === 'bad' || /sin analizar/i.test(l.status));
  const linderos = lotes.filter(lindaConMonte);
  const lote3 = lotes.find((l) => l.id === 'l3')!;
  const regs = (kind: string) => eventos.filter((e) => e.kind === 'prod' && new RegExp(kind, 'i').test(e.title));
  const hayFito = regs('fitosanitari|aplicaci').length > 0;
  const hayFert = regs('fertiliz').length > 0;
  const haySiembra = regs('siembra').length > 0;
  const hayCosecha = regs('cosecha').length > 0;
  const espNativas = [0, 1, 3].map((i) => ecorregion.especies[i].nombre.toLowerCase());
  const espTexto = `${espNativas.slice(0, -1).join(', ')} y ${espNativas[espNativas.length - 1]} (${ecorregion.nombre})`;
  const ultimaCampania = ndviSerie.slice(-8);
  const ndviMin = Math.min(...ultimaCampania);
  const ndviMax = Math.max(...ultimaCampania);

  const ok = cert.items.filter((i) => i.status === 'ok').length;
  const bad = cert.items.filter((i) => i.status === 'bad').length;
  const warn = cert.items.filter((i) => i.status === 'warn').length;

  const acciones: AccionPlan[] = [];
  const reglas: ReglaPlan[] = [];
  const corredoresPlan = new Map<string, Corredor>();
  const mezclas: MezclaCorredor[] = [];
  /** `opcional` actions are left out of the básico tier (it covers the minimum for the requirement). */
  const add = (a: Omit<AccionPlan, 'id' | 'link' | 'fase' | 'momento'> & { link?: string; fase?: FaseId; momento?: string; opcional?: boolean }) => {
    if (a.opcional && nivel === 'basico') return;
    const { opcional: _o, ...resto } = a;
    acciones.push({ ...resto, fase: a.fase ?? 'f0', momento: a.momento ?? (a.plazo === 'Esta semana' ? 'Semanas 1–2' : a.plazo === 'Este mes' ? 'Semanas 2–4' : 'Semanas 4–8'), id: `${cert.id}-${acciones.length + 1}`, link: a.link ?? (a.tipo ? `/accion?tipo=${a.tipo}` : '/accion') });
  };
  const regla = (id: string, si: string, entonces: string) => { if (!reglas.some((r) => r.id === id)) reglas.push({ id, si, entonces }); };

  const addPlanBio = (req: Requisito) => {
    regla('R2', 'Falta el plan de manejo de biodiversidad', 'aprobar el borrador que genera Syntra con el diagnóstico');
    add({
      titulo: 'Revisar y aprobar el plan de manejo de biodiversidad',
      detalle: `Borrador generado con el diagnóstico (${biodiversidadLote3.actual}/100) y los corredores elegidos. Lo firmás y queda anclado.`,
      lote: short(lote3), requisito: req.rule, prioridad: 'alta', plazo: 'Esta semana',
      esfuerzo: '30 min de lectura', impacto: 'completa el requisito', link: `/lote/${lote3.id}`, linkLabel: 'Ver diagnóstico del lote →',
      porQue: `Requisito en "Mejora necesaria" (${req.evidence}). El algoritmo ya tiene los datos para redactarlo: solo falta tu aprobación.`,
    });
  };

  for (const req of cert.items) {
    const rule = req.rule;
    if (req.status === 'ok') continue;

    // R1 — biodiversity / native vegetation gap → corridors that connect the lot with the native forest.
    if (req.status === 'bad' && /vegetación nativa|biodiversidad|cobertura forestal/i.test(rule) && !/plan de manejo/i.test(rule)) {
      regla('R1', 'Mejora necesaria en vegetación nativa / biodiversidad + lote lindero a parches de bosque', 'corredores biológicos que conecten los parches de bosque');
      const lista = corredoresDe(req);
      for (const [i, c] of lista.entries()) {
        // Básico: only the corridor that connects with the forest patch; islands are left to the other tiers.
        if (nivel === 'basico' && c.status === 'Planificado' && !/conecta/i.test(c.body)) continue;
        corredoresPlan.set(c.id, c);
        if (c.status === 'Implantado') continue; // already done → counted in datos, no action
        const enBajo = /NDVI bajo|menor rinde/i.test(c.body);
        const mezcla = mezclaDe(c.id, c.id, c.title, c.ha, info.densidadFactor, enBajo || /bajo/i.test(c.title));
        mezclas.push(mezcla);
        add({
          titulo: `Implantar ${c.title}`,
          detalle: `${c.body} ${fmt(c.ha)} ha con ${mezcla.especies.length} especies nativas (${espTexto} y otras); ${mezcla.plantas.toLocaleString('es-AR')} plantas.`,
          fase: 'f1',
          momento: 'Plantación en primavera (oct–dic del año 1)',
          mezcla,
          lote: short(lote3),
          requisito: rule,
          prioridad: 'alta',
          plazo: i <= 1 ? 'Este mes' : 'Antes de la siembra',
          esfuerzo: `${Math.ceil(mezcla.plantas / PLANTAS_POR_JORNADA)} jornadas + ${mezcla.plantas.toLocaleString('es-AR')} plantines nativos`,
          impacto: `+${c.impact} biodiversidad`,
          tipo: 'corredor',
          porQue: enBajo
            ? `Mejora necesaria "${rule}" (evidencia: ${req.evidence}). La zona tiene NDVI bajo (mín. ${fmt(ndviMin, 2)}): se resigna poco rinde y suma heterogeneidad.`
            : `Mejora necesaria "${rule}" (evidencia: ${req.evidence}) + ${short(lote3)} linda con un parche de bosque al este → el corredor conecta el lote con los parches de bosque.`,
        });
      }
      if (/plan/i.test(rule)) addPlanBio(req);
      continue;
    }

    // R2 — missing biodiversity management plan → Syntra drafts it from the diagnosis.
    if (/plan de manejo/i.test(rule)) {
      addPlanBio(req);
      continue;
    }

    // R9 — social / labor conditions (FSA) → upload the staff training record.
    if (/laboral|capacitaci|comunidad/i.test(rule)) {
      regla('R9', 'Falta evidencia social (capacitaciones del personal)', 'cargar el registro de capacitaciones');
      add({
        titulo: 'Cargar el registro de capacitaciones del personal',
        detalle: 'Planilla o foto de las capacitaciones de seguridad y manejo de agroquímicos del personal del establecimiento.',
        lote: 'Todos', requisito: rule, prioridad: 'media', plazo: 'Este mes',
        esfuerzo: '10 min (PDF o foto)', impacto: 'completa dato social',
        porQue: `Requisito "Falta dato" (${req.evidence}). Es documental y no depende del campo.`,
      });
      continue;
    }

    // R8 — empty containers (BPA).
    if (/envases/i.test(rule)) {
      regla('R8', 'Sin comprobante de gestión de envases', 'cargar comprobante de entrega a centro de acopio');
      add({
        titulo: 'Cargar comprobante de entrega de envases vacíos',
        detalle: 'Envases con triple lavado entregados a un centro de acopio habilitado. Una foto del comprobante alcanza.',
        lote: 'Todos', requisito: rule, prioridad: 'baja', plazo: 'Este mes',
        esfuerzo: '5 min', impacto: 'completa BPA', opcional: true,
        porQue: `Requisito "Falta dato" (${req.evidence}). Bajo esfuerzo; prioridad baja porque no bloquea otros requisitos.`,
      });
      continue;
    }

    // R3 — no phytosanitary records → record applications (with location / distances).
    if (/fitosanitari|aplicaci/i.test(rule)) {
      regla('R3', 'No hay registros de aplicaciones fitosanitarias en la trazabilidad', 'registrar cada aplicación con ubicación y producto');
      add({
        titulo: 'Registrar las aplicaciones fitosanitarias de la campaña',
        detalle: 'Producto, dosis, fecha y ubicación de cada aplicación. Syntra calcula la distancia a los parches de bosque y zonas sensibles.',
        lote: alcance.map(short).join(', '), requisito: rule, prioridad: req.status === 'bad' ? 'alta' : 'media', plazo: 'Esta semana',
        esfuerzo: '10 min por aplicación', impacto: 'completa dato', tipo: 'fito',
        porQue: `Requisito "Falta dato" y ${hayFito ? 'hay' : '0'} registros de "${tipoLabel('fito')}" en la trazabilidad. Sin ellos el auditor no puede verificar distancias.`,
      });
      continue;
    }

    // R4 — inputs / emissions → record fertilization (sowing already recorded).
    if (/insumos|emisiones/i.test(rule)) {
      regla('R4', 'Faltan registros de insumos', 'registrar fertilización (y siembra si no está)');
      if (!hayFert) add({
        titulo: 'Registrar la fertilización de la campaña',
        detalle: 'Producto y dosis por lote. Con esto se estima el balance de emisiones.',
        lote: alcance.map(short).join(', '), requisito: rule, prioridad: 'media', plazo: 'Esta semana',
        esfuerzo: '10 min por lote', impacto: 'completa dato', tipo: 'fert',
        porQue: `Requisito "Falta dato" (${req.evidence}); hay 0 registros de "${tipoLabel('fert')}"${haySiembra ? ', la siembra ya está registrada' : ''}.`,
      });
      continue;
    }

    // R5 — legality evidence (EUDR) → upload RENSPA + land tenure.
    if (/legalidad/i.test(rule)) {
      regla('R5', 'Falta prueba de legalidad', 'cargar RENSPA y titularidad / arrendamiento');
      add({
        titulo: 'Cargar RENSPA y titularidad o contrato de arrendamiento',
        detalle: `RENSPA ${establecimiento.renspa}. Subí la escritura o el contrato que cubra ${sinAnalizar.map(short).join(', ') || 'todos los lotes'}.`,
        lote: sinAnalizar.map(short).join(', ') || 'Todos', requisito: rule, prioridad: 'alta', plazo: 'Esta semana',
        esfuerzo: '15 min (PDF o foto)', impacto: 'cierra requisito',
        porQue: `Requisito "Falta dato" (${req.evidence}). Es documental: el cierre más rápido del plan.`,
      });
      continue;
    }

    // R6 — new lots must be checked against the OTBN layer → analyze + overlay with native forest.
    if (/lotes nuevos|otbn/i.test(rule) && sinAnalizar.length) {
      regla('R6', 'Lote sin analizar que linda con un parche de bosque', 'analizar y verificar superposición con la capa de bosque');
      for (const l of sinAnalizar) add({
        titulo: `Analizar ${short(l)} y verificar superposición con parches de bosque`,
        detalle: `${l.ha} ha de ${l.crop.toLowerCase()}. Corre el análisis satelital y cruza el polígono con la capa OTBN.`,
        lote: short(l), requisito: rule, prioridad: 'alta', plazo: 'Esta semana',
        esfuerzo: '2 min (automático)', impacto: 'cierra requisito', link: `/procesando/${l.id}`,
        porQue: `${short(l)} está "${l.status}" y ${lindaConMonte(l) ? 'linda con un parche de bosque' : 'no tiene diagnóstico'}: no se puede afirmar que no hubo desmonte.`,
      });
      continue;
    }

    // R7 — soil cover between seasons (BPA) → service crop.
    if (/cobertura de suelo/i.test(rule)) {
      regla('R7', `NDVI invernal bajo (mín. ${fmt(ndviMin, 2)})`, 'cultivo de servicio entre campañas');
      add({
        titulo: 'Sembrar cultivo de servicio después de la cosecha',
        detalle: 'Vicia o centeno entre la cosecha de soja y la próxima siembra. Registralo como siembra.',
        lote: short(lote3), requisito: rule, prioridad: 'media', plazo: 'Durante la campaña',
        esfuerzo: '1 jornada de siembra', impacto: '+suelo · completa BPA', tipo: 'siembra', opcional: true,
        fase: 'f1', momento: 'Después de la cosecha de la 1.ª campaña',
        porQue: `Serie NDVI de la última campaña: mín. ${fmt(ndviMin, 2)} / máx. ${fmt(ndviMax, 2)} → el suelo queda desnudo en invierno.`,
      });
      continue;
    }

    // Fallback — generic data-loading action from the requirement's fix text.
    regla('R0', 'Requisito con dato faltante sin regla específica', 'cargar el dato indicado');
    add({
      titulo: `Completar: ${rule}`,
      detalle: req.fix ? `Para cerrarlo: ${req.fix}` : 'Cargar la evidencia del requisito.',
      lote: 'Todos', requisito: rule, prioridad: req.status === 'bad' ? 'alta' : 'media', plazo: 'Este mes',
      esfuerzo: 'a definir', impacto: 'completa dato',
      porQue: `Requisito en estado "${req.status === 'bad' ? 'Mejora necesaria' : 'Falta dato'}" (${req.evidence}).`,
    });
  }

  // Cross-cutting rules (not tied to a single requirement).
  // X1 — any unanalyzed lot in scope blocks the certification scope, even if no requirement names it.
  for (const l of sinAnalizar.filter((x) => alcance.includes(x))) {
    if (acciones.some((a) => a.link === `/procesando/${l.id}`)) continue;
    regla('X1', `Lote "${l.status}" dentro del alcance`, 'analizarlo antes de incluirlo en la certificación');
    add({
      titulo: `Analizar ${short(l)} antes de incluirlo`,
      detalle: `${short(l)} es nuevo y ${lindaConMonte(l) ? 'linda con un parche de bosque' : 'no tiene diagnóstico'}. Sin análisis queda fuera del alcance.`,
      lote: short(l), requisito: null, prioridad: 'media', plazo: 'Esta semana',
      esfuerzo: '2 min (automático)', impacto: 'amplía alcance', link: `/procesando/${l.id}`,
      porQue: `Estado del lote: "${l.status}". ${l.note}`,
    });
  }
  // X2 — traceability standards need harvest records to close the chain of custody.
  if (!hayCosecha && cert.items.some((i) => /geolocalizaci/i.test(i.rule))) {
    regla('X2', 'Estándar con geolocalización + 0 registros de cosecha', 'registrar cosecha por lote para la cadena de custodia');
    add({
      titulo: 'Registrar la cosecha por lote',
      detalle: 'Destino y rinde por lote: une el polígono certificado con el embarque.',
      lote: alcance.map(short).join(', '), requisito: null, prioridad: 'baja', plazo: 'Durante la campaña',
      esfuerzo: '5 min por lote', impacto: 'cadena de custodia', tipo: 'cosecha', opcional: true,
      fase: 'f1', momento: 'En la cosecha del año 1',
      porQue: `${cert.label} exige geolocalización; sin registro de cosecha no se puede vincular el grano con el lote.`,
    });
  }

  // X3 — field monitoring data available → monitor each campaign: evidence that biodiversity is functional.
  const fechaMon = monitoreos[monitoreos.length - 1]?.fecha;
  const ultMon = monitoreos.filter((m) => m.fecha === fechaMon);
  const borde = ultMon.find((m) => /borde/i.test(m.sitio));
  const centro = ultMon.find((m) => /centro/i.test(m.sitio));
  if (borde && centro) {
    regla('X3', 'Hay datos de monitoreo de campo (borde vs. centro del lote)', 'repetir el monitoreo cada campaña como evidencia de biodiversidad funcional');
    add({
      titulo: 'Monitoreo anual de adicionalidad',
      detalle: `Cada año, durante la floración (años 2–5): plantas vivas, % de superficie intervenida y conteo de 15 minutos de polinizadores y enemigos naturales en el borde del corredor y en el centro del lote, con fotos georreferenciadas. ${porNivel('Lo cargás vos con la planilla guía.', 'Lo hace un técnico con vos.', 'Semestral, con técnico y seguimiento satelital cada 5 días.')}`,
      lote: short(lote3), requisito: null, prioridad: 'media', plazo: 'Durante la campaña',
      fase: 'f25', momento: porNivel('1 vez por año', '1 vez por año', '2 veces por año'),
      esfuerzo: porNivel('1 jornada por año', '30 min por campaña (con técnico)', '30 min por campaña (lo hace Syntra)'), impacto: 'evidencia funcional', tipo: 'monitoreo',
      porQue: `Último monitoreo (${fechaMon}): polinizadores ${borde.polinizadores} en el borde vs ${centro.polinizadores} en el centro. Repetirlo cada campaña muestra que el corredor funciona y no solo está implantado.`,
    });
  }

  // Multi-year actions: only when there are corridors to implant.
  const planif = [...corredoresPlan.values()].filter((c) => c.status === 'Planificado');
  const reqCorredor = acciones.find((a) => a.tipo === 'corredor')?.requisito ?? null;
  if (planif.length) {
    const ids = planif.map((c) => c.id).join(' y ');
    const lugar = short(lote3);
    regla('M1', 'Corredores planificados', 'cronograma de 5 años: diseño, implantación, mantenimiento y monitoreo de adicionalidad');
    add({
      titulo: 'Diseñar el corredor y elegir las especies', fase: 'f0', momento: 'Semanas 1–4',
      detalle: `Trazado de ${ids} sobre el mapa, chequeo de zonas anegables y elección de la mezcla de especies nativas y su densidad (ver "Especies y manejo").`,
      lote: lugar, requisito: null, prioridad: 'alta', plazo: 'Este mes', esfuerzo: porNivel('2 horas con guía', '2 horas con técnico', 'lo hace Syntra'), impacto: 'define la implantación',
      link: '/mapa', linkLabel: 'Ver corredores en el mapa →',
      porQue: 'Antes de plantar hay que decidir qué especie va en qué parte de la franja; en zonas anegables no todas sobreviven.',
    });
    add({
      titulo: 'Reservar los plantines en un vivero de nativas', fase: 'f0', momento: 'Semanas 4–8',
      detalle: 'Plantines de procedencia local y de al menos un año, que se piden con meses de anticipación para plantar en primavera.',
      lote: lugar, requisito: null, prioridad: 'media', plazo: 'Antes de la siembra', esfuerzo: porNivel('1 llamado al vivero', '1 llamado al vivero', 'lo hace Syntra'), impacto: 'asegura la plantación de primavera',
      porQue: 'Las nativas no se consiguen de un día para otro: sin reserva se pierde la ventana de plantación con las primeras lluvias.',
    });
    add({
      titulo: 'Preparar la franja y proteger el sitio', fase: 'f1', momento: 'Julio–septiembre del año 1',
      detalle: 'Laboreo mínimo de la franja, cerco o protectores individuales contra ganado y liebres, y marcación de la densidad de plantación.',
      lote: lugar, requisito: null, prioridad: 'media', plazo: 'Antes de la siembra', esfuerzo: `${Math.max(1, Math.ceil(info.productorPct * planif.reduce((t, c) => t + c.ha, 0)))} jornadas`, impacto: 'mejora la supervivencia',
      porQue: 'La causa principal de pérdida de plantas nuevas es el ramoneo y la competencia con malezas: se previene antes de plantar.',
    });
    add({
      titulo: 'Riego de establecimiento', fase: 'f1', momento: 'Nov–mar del año 1 (1.er verano)',
      detalle: '2–3 riegos en el 1.er verano; después las nativas se arreglan con la lluvia. Registralo como riego.',
      lote: lugar, requisito: null, prioridad: 'alta', plazo: 'Durante la campaña', esfuerzo: '2–3 jornadas con cisterna', impacto: 'asegura el prendimiento', tipo: 'riego',
      porQue: 'Con olas de calor el 1.er verano define cuánto prende. Syntra mira el NDVI de la franja para avisarte cuándo regar.',
    });
    add({
      titulo: 'Mantenimiento de la franja', fase: 'f12', momento: 'Años 1–2, 2–3 veces por año',
      detalle: 'Control de malezas al pie, revisión de protectores y cerco, control de hormigas. A partir del 2.º–3.er año el corredor se sostiene solo.',
      lote: lugar, requisito: null, prioridad: 'media', plazo: 'Durante la campaña', esfuerzo: porNivel('1 jornada por visita', '1 jornada por visita', 'lo hace Syntra'), impacto: 'sostiene la supervivencia',
      porQue: 'El mantenimiento solo hace falta los primeros 2 años: es una inversión limitada, no un costo permanente.',
    });
    add({
      titulo: 'Reposición de plantas perdidas', fase: 'f12', momento: 'Otoño o primavera siguiente',
      detalle: info.garantiaPct
        ? `Se reponen las plantas que no prendieron o murieron (por ejemplo por olas de calor): Syntra cubre ${info.garantiaPct}% de las pérdidas (valor ilustrativo, a definir). El resto lo reponés vos.`
        : 'Reponés vos las plantas que no prendieron. Esta opción no incluye garantía de reposición de Syntra.',
      lote: lugar, requisito: null, prioridad: 'media', plazo: 'Durante la campaña', esfuerzo: porNivel('según pérdidas', 'según pérdidas (Syntra cubre 30%)', 'según pérdidas (Syntra cubre 70%)'), impacto: 'mantiene la densidad',
      porQue: 'Los certificadores piden plantas vivas hasta el año 5: se repone lo perdido antes de que el corredor se sostenga solo.',
    });
    add({
      titulo: 'Informe de adicionalidad para el certificador', fase: 'f25', momento: 'Años 3 y 5',
      detalle: 'Syntra arma el informe con la evolución de plantas vivas, % de superficie intervenida y polinizadores, anclado en blockchain.',
      lote: lugar, requisito: reqCorredor, prioridad: 'media', plazo: 'Durante la campaña', esfuerzo: '15 min para revisar y firmar', impacto: 'evidencia a 5 años', link: '/informe', linkLabel: 'Ver informe →',
      porQue: 'Los estándares piden planes de hasta 5 años: mostrar adicionalidad (más superficie intervenida y más polinizadores) mantiene la certificación.',
    });
    if (nivel === 'premium') {
      regla('M2', 'Nivel Premium', 'islas de paso entre el corredor B y el parche de bosque + seguimiento extendido');
      const islas = mezclaDe('P', 'P', 'Islas de paso (stepping stones)', ISLAS_HA, info.densidadFactor, false);
      mezclas.push(islas);
      add({
        titulo: 'Implantar islas de paso entre el corredor y el parche de bosque', fase: 'f1', momento: 'Plantación en primavera (oct–dic del año 1)', mezcla: islas,
        detalle: `2 islas de ${fmt(ISLAS_HA / 2)} ha cada una, para que la conectividad no dependa de una sola franja. ${islas.plantas.toLocaleString('es-AR')} plantas.`,
        lote: lugar, requisito: null, prioridad: 'media', plazo: 'Antes de la siembra', esfuerzo: `${Math.ceil(islas.plantas / PLANTAS_POR_JORNADA)} jornadas (las hace Syntra)`, impacto: `+${ISLAS_IMPACTO} biodiversidad · conectividad completa`, tipo: 'corredor',
        porQue: 'El modelo de conectividad (tipo Circuitscape) muestra que las islas de paso reducen la resistencia entre el lote y los parches de bosque.',
      });
      add({
        titulo: 'Seguimiento extendido de adicionalidad', fase: 'f25', momento: 'Años 6–8',
        detalle: '3 años más de monitoreo anual con técnico y satélite, para mostrar que el corredor se mantiene y se autorreplica.',
        lote: lugar, requisito: null, prioridad: 'baja', plazo: 'Durante la campaña', esfuerzo: 'lo hace Syntra', impacto: 'evidencia de largo plazo',
        porQue: 'Incluido en Premium: el corredor de referencia del equipo muestra renuevos que crecen año a año.',
      });
    }
  }

  acciones.sort((a, b) => fasesPlan.findIndex((f) => f.id === a.fase) - fasesPlan.findIndex((f) => f.id === b.fase) || plazos.indexOf(a.plazo) - plazos.indexOf(b.plazo) || ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad]);

  const cubiertos = new Set(acciones.map((a) => a.requisito).filter(Boolean));
  const cumplidosConPlan = cert.items.filter((i) => i.status === 'ok' || cubiertos.has(i.rule)).length;
  const haImplantar = planif.reduce((s, c) => s + c.ha, 0) + (nivel === 'premium' && planif.length ? ISLAS_HA : 0);
  const bioProyectada = biodiversidadLote3.actual + [...corredoresPlan.values()].reduce((s, c) => s + c.impact, 0) + (nivel === 'premium' && planif.length ? ISLAS_IMPACTO : 0);
  const plantas = mezclas.reduce((s, m) => s + m.plantas, 0);
  const jornadasImpl = Math.ceil(plantas / PLANTAS_POR_JORNADA);
  const jornadas = planif.length ? jornadasImpl + Math.ceil(haImplantar * 3) : 0;
  const porPrioridad = { alta: 0, media: 0, baja: 0 } as Record<Prioridad, number>;
  for (const a of acciones) porPrioridad[a.prioridad]++;

  const prodRegs = eventos.filter((e) => e.kind === 'prod');
  const datos: DatoPlan[] = [
    { label: 'Certificación objetivo', valor: `${cert.label} · ${cert.items.length} requisitos`, fuente: 'Catálogo Syntra (ilustrativo)' },
    { label: 'Estado de los requisitos', valor: `${ok} ${ok === 1 ? 'cumple' : 'cumplen'} · ${bad} ${bad === 1 ? 'mejora necesaria' : 'mejoras necesarias'} · ${warn} ${warn === 1 ? 'dato faltante' : 'datos faltantes'}`, fuente: 'Diagnóstico de hoy 14:32' },
    { label: 'Lotes en alcance', valor: `${alcance.map(short).join(', ')} (${alcance.reduce((s, l) => s + l.ha, 0)} ha)`, fuente: cert.id === 'rtrs' ? 'Solo lotes de soja' : 'Polígonos firmados' },
    { label: 'Lotes sin analizar', valor: sinAnalizar.length ? sinAnalizar.map((l) => `${short(l)} (${l.ha} ha)`).join(', ') : 'Ninguno', fuente: 'Mapa y lotes' },
    { label: 'Lotes linderos a parches de bosque', valor: linderos.map(short).join(', ') || 'Ninguno', fuente: `Capa de parches de bosque (${parchesBosque.length} parches · ${fmt(parchesBosque.reduce((t, p) => t + p.ha, 0))} ha)` },
    { label: `Biodiversidad ${short(lote3)}`, valor: `${biodiversidadLote3.actual}/100`, fuente: 'Syntra · algoritmo v0.3' },
    { label: 'Nivel del plan', valor: `${info.label} · costo relativo ${fmt(info.costoRelativo)}× · ${info.ejecuta}`, fuente: 'Syntra (costos relativos ilustrativos)' },
    { label: 'Corredores', valor: corredores.map((c) => `${c.id} ${c.status.toLowerCase()}`).join(' · '), fuente: 'Plan de corredores 12/11/2026' },
    { label: 'Ecorregión', valor: ecorregion.nombre, fuente: ecorregion.fuenteDatos },
    ...(borde && centro ? [{ label: `Monitoreo de campo (${fechaMon})`, valor: `Polinizadores borde vs centro: ${borde.polinizadores} vs ${centro.polinizadores} · enemigos naturales ${borde.enemigosNaturales} vs ${centro.enemigosNaturales}`, fuente: 'Monitoreo de campo + satélite' }] : []),
    { label: 'NDVI última campaña', valor: `mín. ${fmt(ndviMin, 2)} · máx. ${fmt(ndviMax, 2)}`, fuente: 'Sentinel-2 L2A' },
    { label: 'Registros de campo', valor: `${prodRegs.length} intervenciones · fitosanitarios ${hayFito ? '✓' : '0'} · fertilización ${hayFert ? '✓' : '0'} · cosecha ${hayCosecha ? '✓' : '0'}`, fuente: 'Trazabilidad (blockchain)' },
    { label: 'Focos de calor', valor: `${capas.focosCalor.length} en parches de bosque linderos, 0 en lotes`, fuente: 'NASA FIRMS' },
  ];

  return {
    version: 'v0.3 · simulado',
    nivel,
    niveles: [],
    fases: fasesPlan,
    mezclas,
    garantia: {
      pct: info.garantiaPct,
      texto: info.garantiaPct
        ? `Syntra repone ${info.garantiaPct}% de las plantas perdidas en los años 1–2 (por ejemplo por olas de calor). Porcentaje ilustrativo, a definir.`
        : 'El nivel Básico no incluye garantía de reposición: la reposición corre por tu cuenta, con guía de Syntra.',
    },
    cert,
    datos,
    acciones,
    reglas,
    resumen: {
      certId: cert.id,
      certLabel: cert.label,
      totalRequisitos: cert.items.length,
      cumplidosHoy: ok,
      cumplidosConPlan,
      haImplantar: Math.round(haImplantar * 10) / 10,
      bioActual: biodiversidadLote3.actual,
      bioProyectada,
      rinde: corredoresPlan.size ? biodiversidadLote3.rinde : null,
      porPrioridad,
      plantas,
      jornadas,
      jornadasProductor: Math.round(jornadas * info.productorPct),
    },
  };
}
