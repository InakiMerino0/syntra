import { corredores, biodiversidadLote3 } from '@synta/data';

/**
 * Impacto social y ambiental del plan de corredores.
 * Todo se calcula a partir de las hectáreas de corredores (datos del prototipo) y de
 * supuestos de planificación ILUSTRATIVOS, marcados como "estimado". Validar con
 * técnicos locales antes de comunicarlos como cifras de campo.
 */

// --- Supuestos (editables) ---
/** Jornadas de trabajo por ha para implantar (preparar suelo, plantar, protección, riego inicial). */
export const JORNADAS_IMPLANTACION_HA = 14;
/** Jornadas por ha y por año de mantenimiento y monitoreo en los primeros 3 años. */
export const JORNADAS_MONITOREO_HA_ANIO = 2;
/** Años de seguimiento considerados. */
export const ANIOS_SEGUIMIENTO = 3;
/** Plantas nativas por ha (espaciamiento mixto ~3 × 3 m, árboles + arbustos). */
export const PLANTAS_HA = 1100;
/** Visitas de monitoreo de campo por corredor y por año (estacionales). */
export const VISITAS_CORREDOR_ANIO = 4;

const haTotal = corredores.reduce((s, c) => s + c.ha, 0);

export interface Indicador {
  id: string;
  label: string;
  value: string;
  sub: string;
  /** true = calculado con supuestos; false = dato directo del plan. */
  estimado: boolean;
}

const n = (x: number) => Math.round(x).toLocaleString('es-AR');

export const indicadoresImpacto: Indicador[] = [
  {
    id: 'jornadas',
    label: 'Trabajo local generado',
    value: `${n(haTotal * (JORNADAS_IMPLANTACION_HA + JORNADAS_MONITOREO_HA_ANIO * ANIOS_SEGUIMIENTO))} jornadas`,
    sub: `implantación (${n(haTotal * JORNADAS_IMPLANTACION_HA)}) y mantenimiento durante ${ANIOS_SEGUIMIENTO} años · ${JORNADAS_IMPLANTACION_HA} jornadas/ha + ${JORNADAS_MONITOREO_HA_ANIO}/ha/año`,
    estimado: true,
  },
  {
    id: 'plantas',
    label: 'Plantas nativas implantadas',
    value: `~${n(haTotal * PLANTAS_HA)}`,
    sub: `${PLANTAS_HA.toLocaleString('es-AR')} plantas/ha de especies de la ecorregión, ideal con vivero local`,
    estimado: true,
  },
  {
    id: 'habitat',
    label: 'Hábitat conectado',
    value: `${haTotal.toLocaleString('es-AR', { maximumFractionDigits: 1 })} ha`,
    sub: `${corredores.length} corredores que unen el campo con los parches de bosque`,
    estimado: false,
  },
  {
    id: 'monitoreos',
    label: 'Monitoreos de campo',
    value: `${corredores.length * VISITAS_CORREDOR_ANIO * ANIOS_SEGUIMIENTO} visitas`,
    sub: `${VISITAS_CORREDOR_ANIO} por corredor y por año durante ${ANIOS_SEGUIMIENTO} años, con técnicos locales`,
    estimado: true,
  },
  {
    id: 'patrimonio',
    label: 'Patrimonio natural',
    value: `${biodiversidadLote3.actual} → ${biodiversidadLote3.proyectado}`,
    sub: 'índice de biodiversidad del Lote 3 con los corredores sugeridos (proyección del modelo)',
    estimado: true,
  },
];

/** Servicios ecosistémicos que recibe la comunidad (cualitativo). */
export const serviciosEcosistemicos = ['Polinización', 'Sombra y refugio para el ganado y la fauna', 'Regulación del agua en bajos inundables'];

export const fraseImpacto = 'La biodiversidad da resiliencia al sistema biológico, económico y social.';
