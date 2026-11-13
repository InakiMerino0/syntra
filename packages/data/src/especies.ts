// Ficha de especies nativas del Chaco Seco para corredores biológicos (ILUSTRATIVA).
// Densidades, épocas y cuidados son valores de referencia para el prototipo; los valida el equipo de biología.
export type Estrato = 'arbóreo' | 'arbustivo' | 'herbáceo';

export interface Especie {
  id: string;
  nombre: string;
  cientifico: string;
  estrato: Estrato;
  /** Rol funcional dentro del corredor. */
  rol: string;
  /** Plantas por ha dentro del corredor (referencia ilustrativa, tier medio). */
  densidad: number;
  epoca: string;
  riego: string;
  cuidados: string;
  /** Tolera anegamiento temporal (relevante en zonas inundables como el bajo del Lote 3). */
  toleraAnegamiento: boolean;
  /** Tiene aporte relevante para polinizadores / enemigos naturales. */
  polinizadores: boolean;
}

export const fichaEspecies = {
  /** null = todavía no la revisó biología. */
  validadoPor: null as string | null,
  nota: 'Ficha ilustrativa: a validar por el equipo de biología',
};

const EPOCA_ARBOL = 'Primavera, con las primeras lluvias (oct–dic)';
const EPOCA_ARBUSTO = 'Primavera o inicio del verano (oct–ene)';

export const especies: Especie[] = [
  { id: 'algarrobo', nombre: 'Algarrobo blanco', cientifico: 'Prosopis alba', estrato: 'arbóreo', rol: 'Estructura y sombra; flores melíferas', densidad: 100, epoca: EPOCA_ARBOL,
    riego: '2–3 riegos de establecimiento el 1.er verano', cuidados: 'Protector individual contra liebres y hormigas; control de malezas al pie el 1.er y 2.º año.', toleraAnegamiento: true, polinizadores: true },
  { id: 'quebracho', nombre: 'Quebracho blanco', cientifico: 'Aspidosperma quebracho-blanco', estrato: 'arbóreo', rol: 'Estructura del corredor; crecimiento lento y longevo', densidad: 80, epoca: EPOCA_ARBOL,
    riego: '3 riegos de establecimiento el 1.er verano (crece lento)', cuidados: 'Protector contra ganado y liebres; sombra parcial al inicio; reposición frecuente el 1.er año.', toleraAnegamiento: false, polinizadores: false },
  { id: 'mistol', nombre: 'Mistol', cientifico: 'Sarcomphalus mistol', estrato: 'arbóreo', rol: 'Fruto para fauna; atrae polinizadores', densidad: 80, epoca: EPOCA_ARBOL,
    riego: '2–3 riegos de establecimiento el 1.er verano', cuidados: 'Protector contra liebres; evitar suelos encharcables; control de malezas el 1.er año.', toleraAnegamiento: false, polinizadores: true },
  { id: 'chanar', nombre: 'Chañar', cientifico: 'Geoffroea decorticans', estrato: 'arbóreo', rol: 'Rebrota de raíz; autosiembra rápida; floración temprana', densidad: 120, epoca: EPOCA_ARBOL,
    riego: '1–2 riegos de establecimiento el 1.er verano', cuidados: 'Poco exigente; controlar que el rebrote no invada el lote vecino; protector el 1.er año.', toleraAnegamiento: false, polinizadores: true },
  { id: 'tala', nombre: 'Tala', cientifico: 'Celtis ehrenbergiana', estrato: 'arbóreo', rol: 'Refugio de aves y enemigos naturales', densidad: 100, epoca: EPOCA_ARBOL,
    riego: '2 riegos de establecimiento el 1.er verano', cuidados: 'Protector contra liebres; poda de formación solo si se cierra el paso de la franja.', toleraAnegamiento: true, polinizadores: false },
  { id: 'jarilla', nombre: 'Jarilla', cientifico: 'Larrea divaricata', estrato: 'arbustivo', rol: 'Estrato bajo; flores para abejas nativas', densidad: 200, epoca: EPOCA_ARBUSTO,
    riego: '1–2 riegos de establecimiento el 1.er verano', cuidados: 'Plantar en lo más alto y drenado de la franja; casi sin mantenimiento después del 1.er año.', toleraAnegamiento: false, polinizadores: true },
  { id: 'poleo', nombre: 'Poleo', cientifico: 'Lippia turbinata', estrato: 'arbustivo', rol: 'Flores melíferas; refugio de enemigos naturales', densidad: 150, epoca: EPOCA_ARBUSTO,
    riego: '2 riegos de establecimiento el 1.er verano', cuidados: 'Control de malezas el 1.er año; se autopropaga si la franja no se desmaleza en exceso.', toleraAnegamiento: false, polinizadores: true },
];

export const especiePorId = (id: string) => especies.find((e) => e.id === id)!;
