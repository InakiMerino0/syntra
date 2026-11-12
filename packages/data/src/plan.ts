// "Plan de acción productivo" — deterministic MOCK of the recommendation algorithm (v0.3, simulated).
// Given a target certification + the establishment data, it decides which field actions close each gap.
// Rules are intentionally simple and data-driven so the demo shows *why* each action was chosen.
import { biodiversidadLote3, capas, certificaciones, corredores, establecimiento, eventos, lotes, ndviSerie, tiposAccion } from './index';
import type { Certificacion, Corredor, Lote, Requisito } from './index';

export type Prioridad = 'alta' | 'media' | 'baja';
export type Plazo = 'Esta semana' | 'Este mes' | 'Antes de la siembra' | 'Durante la campaña';
export const plazos: Plazo[] = ['Esta semana', 'Este mes', 'Antes de la siembra', 'Durante la campaña'];
export const prioridadTone: Record<Prioridad, 'bad' | 'warn' | 'ok'> = { alta: 'bad', media: 'warn', baja: 'ok' };

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
  /** Why the algorithm chose it (rule that fired + data that triggered it). */
  porQue: string;
  /** Where to act in the app (defaults to /accion). */
  link: string;
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
  rinde: { cultivo: string; pct: number; fuente: string } | null;
  porPrioridad: Record<Prioridad, number>;
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
}

const fmt = (n: number, d = 1) => n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
const short = (l: Lote) => l.name.split(' — ')[0];
const tipoLabel = (id: string) => tiposAccion.find((t) => t.id === id)?.label ?? id;
const ORDEN_PRIORIDAD: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 };

/** Which lots a certification applies to (RTRS is soy-only). */
function lotesEnAlcance(cert: Certificacion): Lote[] {
  return cert.id === 'rtrs' ? lotes.filter((l) => l.crop.toLowerCase() === 'soja') : lotes;
}

/** Lots whose diagnosis mentions native forest on the border (Lote 3 & 4 in the mock). */
const lindaConMonte = (l: Lote) => /bosque|monte/i.test(l.note);

/** Corridor letters named in a requirement's fix text ("corredores A y B"). */
function corredoresDe(req: Requisito): Corredor[] {
  const letras = new Set((req.fix ?? '').match(/\b[A-Z]\b/g) ?? []);
  return corredores.filter((c) => letras.has(c.id));
}

export function generarPlan(certId: string): Plan {
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
  const ultimaCampania = ndviSerie.slice(-8);
  const ndviMin = Math.min(...ultimaCampania);
  const ndviMax = Math.max(...ultimaCampania);

  const ok = cert.items.filter((i) => i.status === 'ok').length;
  const bad = cert.items.filter((i) => i.status === 'bad').length;
  const warn = cert.items.filter((i) => i.status === 'warn').length;

  const acciones: AccionPlan[] = [];
  const reglas: ReglaPlan[] = [];
  const corredoresPlan = new Map<string, Corredor>();
  const add = (a: Omit<AccionPlan, 'id' | 'link'> & { link?: string }) => {
    acciones.push({ ...a, id: `${cert.id}-${acciones.length + 1}`, link: a.link ?? (a.tipo ? `/accion?tipo=${a.tipo}` : '/accion') });
  };
  const regla = (id: string, si: string, entonces: string) => { if (!reglas.some((r) => r.id === id)) reglas.push({ id, si, entonces }); };

  for (const req of cert.items) {
    const rule = req.rule;
    if (req.status === 'ok') continue;

    // R1 — biodiversity / native vegetation gap → corridors that connect the lot with the native forest.
    if (req.status === 'bad' && /vegetación nativa|biodiversidad|cobertura forestal/i.test(rule) && !/plan de manejo/i.test(rule)) {
      regla('R1', 'Brecha de vegetación nativa / biodiversidad + lote lindero a monte nativo', 'corredores biológicos que conecten el lote con el monte');
      const lista = corredoresDe(req);
      for (const [i, c] of lista.entries()) {
        corredoresPlan.set(c.id, c);
        if (c.status === 'Implantado') continue; // already done → counted in datos, no action
        const enBajo = /NDVI bajo|menor rinde/i.test(c.body);
        add({
          titulo: `Implantar ${c.title}`,
          detalle: `${c.body} ${fmt(c.ha)} ha con especies nativas.`,
          lote: short(lote3),
          requisito: rule,
          prioridad: 'alta',
          plazo: i <= 1 ? 'Este mes' : 'Antes de la siembra',
          esfuerzo: `${Math.ceil(c.ha)} jornada${Math.ceil(c.ha) > 1 ? 's' : ''} + plantines nativos`,
          impacto: `+${c.impact} biodiversidad`,
          tipo: 'corredor',
          porQue: enBajo
            ? `Brecha "${rule}" (evidencia: ${req.evidence}). La zona tiene NDVI bajo (mín. ${fmt(ndviMin, 2)}): se resigna poco rinde y suma heterogeneidad.`
            : `Brecha "${rule}" (evidencia: ${req.evidence}) + ${short(lote3)} linda con monte nativo al este → el corredor conecta el lote con el monte.`,
        });
      }
      continue;
    }

    // R2 — missing biodiversity management plan → Syntra drafts it from the diagnosis.
    if (/plan de manejo/i.test(rule)) {
      regla('R2', 'Falta el plan de manejo de biodiversidad', 'aprobar el borrador que genera Syntra con el diagnóstico');
      add({
        titulo: 'Revisar y aprobar el plan de manejo de biodiversidad',
        detalle: `Borrador generado con el diagnóstico (${biodiversidadLote3.actual}/100) y los corredores elegidos. Lo firmás y queda anclado.`,
        lote: short(lote3), requisito: rule, prioridad: 'alta', plazo: 'Esta semana',
        esfuerzo: '30 min de lectura', impacto: 'cierra brecha', link: `/lote/${lote3.id}`,
        porQue: `Requisito en "Brecha" (${req.evidence}). El algoritmo ya tiene los datos para redactarlo: solo falta tu aprobación.`,
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
        esfuerzo: '5 min', impacto: 'completa BPA',
        porQue: `Requisito "Falta dato" (${req.evidence}). Bajo esfuerzo; prioridad baja porque no bloquea otros requisitos.`,
      });
      continue;
    }

    // R3 — no phytosanitary records → record applications (with location / distances).
    if (/fitosanitari|aplicaci/i.test(rule)) {
      regla('R3', 'No hay registros de aplicaciones fitosanitarias en la trazabilidad', 'registrar cada aplicación con ubicación y producto');
      add({
        titulo: 'Registrar las aplicaciones fitosanitarias de la campaña',
        detalle: 'Producto, dosis, fecha y ubicación de cada aplicación. Syntra calcula la distancia a monte y zonas sensibles.',
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
      regla('R6', 'Lote sin analizar que linda con bosque nativo', 'analizar y verificar superposición con la capa de bosque');
      for (const l of sinAnalizar) add({
        titulo: `Analizar ${short(l)} y verificar superposición con bosque nativo`,
        detalle: `${l.ha} ha de ${l.crop.toLowerCase()}. Corre el análisis satelital y cruza el polígono con la capa OTBN.`,
        lote: short(l), requisito: rule, prioridad: 'alta', plazo: 'Esta semana',
        esfuerzo: '2 min (automático)', impacto: 'cierra requisito', link: `/procesando/${l.id}`,
        porQue: `${short(l)} está "${l.status}" y ${lindaConMonte(l) ? 'linda con monte nativo' : 'no tiene diagnóstico'}: no se puede afirmar que no hubo desmonte.`,
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
        esfuerzo: '1 jornada de siembra', impacto: '+suelo · completa BPA', tipo: 'siembra',
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
      porQue: `Requisito en estado "${req.status === 'bad' ? 'Brecha' : 'Falta dato'}" (${req.evidence}).`,
    });
  }

  // Cross-cutting rules (not tied to a single requirement).
  // X1 — any unanalyzed lot in scope blocks the certification scope, even if no requirement names it.
  for (const l of sinAnalizar.filter((x) => alcance.includes(x))) {
    if (acciones.some((a) => a.link === `/procesando/${l.id}`)) continue;
    regla('X1', `Lote "${l.status}" dentro del alcance`, 'analizarlo antes de incluirlo en la certificación');
    add({
      titulo: `Analizar ${short(l)} antes de incluirlo`,
      detalle: `${short(l)} es nuevo y ${lindaConMonte(l) ? 'linda con monte nativo' : 'no tiene diagnóstico'}. Sin análisis queda fuera del alcance.`,
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
      esfuerzo: '5 min por lote', impacto: 'cadena de custodia', tipo: 'cosecha',
      porQue: `${cert.label} exige geolocalización; sin registro de cosecha no se puede vincular el grano con el lote.`,
    });
  }

  acciones.sort((a, b) => plazos.indexOf(a.plazo) - plazos.indexOf(b.plazo) || ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad]);

  const cubiertos = new Set(acciones.map((a) => a.requisito).filter(Boolean));
  const cumplidosConPlan = cert.items.filter((i) => i.status === 'ok' || cubiertos.has(i.rule)).length;
  const planificados = [...corredoresPlan.values()].filter((c) => c.status === 'Planificado');
  const haImplantar = planificados.reduce((s, c) => s + c.ha, 0);
  const bioProyectada = biodiversidadLote3.actual + [...corredoresPlan.values()].reduce((s, c) => s + c.impact, 0);
  const porPrioridad = { alta: 0, media: 0, baja: 0 } as Record<Prioridad, number>;
  for (const a of acciones) porPrioridad[a.prioridad]++;

  const prodRegs = eventos.filter((e) => e.kind === 'prod');
  const datos: DatoPlan[] = [
    { label: 'Certificación objetivo', valor: `${cert.label} · ${cert.items.length} requisitos`, fuente: 'Catálogo Syntra (ilustrativo)' },
    { label: 'Estado de los requisitos', valor: `${ok} cumplen · ${bad} brechas · ${warn} faltan dato`, fuente: 'Diagnóstico de hoy 14:32' },
    { label: 'Lotes en alcance', valor: `${alcance.map(short).join(', ')} (${alcance.reduce((s, l) => s + l.ha, 0)} ha)`, fuente: cert.id === 'rtrs' ? 'Solo lotes de soja' : 'Polígonos firmados' },
    { label: 'Lotes sin analizar', valor: sinAnalizar.length ? sinAnalizar.map((l) => `${short(l)} (${l.ha} ha)`).join(', ') : 'Ninguno', fuente: 'Mapa y lotes' },
    { label: 'Lotes linderos a monte nativo', valor: linderos.map(short).join(', ') || 'Ninguno', fuente: `Capa de bosque nativo (${capas.bosqueNativo.length} vértices)` },
    { label: `Biodiversidad ${short(lote3)}`, valor: `${biodiversidadLote3.actual}/100`, fuente: 'Syntra · algoritmo v0.3' },
    { label: 'Corredores', valor: corredores.map((c) => `${c.id} ${c.status.toLowerCase()}`).join(' · '), fuente: 'Plan de corredores 12/11/2026' },
    { label: 'NDVI última campaña', valor: `mín. ${fmt(ndviMin, 2)} · máx. ${fmt(ndviMax, 2)}`, fuente: 'Sentinel-2 L2A' },
    { label: 'Registros de campo', valor: `${prodRegs.length} intervenciones · fitosanitarios ${hayFito ? '✓' : '0'} · fertilización ${hayFert ? '✓' : '0'} · cosecha ${hayCosecha ? '✓' : '0'}`, fuente: 'Trazabilidad (blockchain)' },
    { label: 'Focos de calor', valor: `${capas.focosCalor.length} en el monte lindero, 0 en lotes`, fuente: 'NASA FIRMS' },
  ];

  return {
    version: 'v0.3 · simulado',
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
    },
  };
}
