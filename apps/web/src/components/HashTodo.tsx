import { useEffect, useId, useRef, useState } from 'react';
import { sha256, shortHash } from '@synta/ui';
import * as data from '@synta/data';
import { useLotes } from '../store/lotes';
import {
  SelladorBFA, SelladorSimulado, sellarConFallback, guardarSelloLocal, formatearBloque, URL_BFA_VERIFICAR, type SelloGuardado,
} from '../lib/sellado';
import './hashtodo.css';

// The evidence a certifier cares about, grouped in the producer's words. Each group bundles one or more
// @synta/data exports (read defensively: a missing export is skipped, not a crash).
const GRUPOS: { label: string; desc: string; keys: string[] }[] = [
  { label: 'Datos del establecimiento', desc: 'Nombre, RENSPA, ubicación y ecorregión', keys: ['establecimiento', 'ecorregion'] },
  { label: 'Lotes y sus polígonos', desc: 'Límites georreferenciados y superficie de cada lote', keys: ['lotes'] },
  { label: 'Análisis satelital', desc: 'NDVI, cambio de cobertura, parches de bosque y focos de calor', keys: ['capas', 'ndviSerie', 'kpis'] },
  { label: 'Cumplimiento por certificación', desc: 'Estado de cada requisito y de cada eje regulatorio', keys: ['certificaciones', 'ejes'] },
  { label: 'Índice de biodiversidad', desc: 'Puntaje actual, proyectado y su desglose', keys: ['biodiversidadLote3'] },
  { label: 'Corredores biológicos', desc: 'Diseño, superficie y seguimiento en el tiempo', keys: ['corredores', 'seguimientoCorredores'] },
  { label: 'Monitoreos de campo', desc: 'Conteos de polinizadores y enemigos naturales', keys: ['monitoreos'] },
  { label: 'Registros de campo firmados', desc: 'Siembras, aplicaciones, implantaciones, análisis y cosechas', keys: ['eventos'] },
];

const source = data as unknown as Record<string, unknown>;
const items = GRUPOS
  .map((g) => {
    const present = g.keys.filter((k) => source[k] !== undefined);
    const payload = Object.fromEntries(present.map((k) => [k, source[k]]));
    const count = present.reduce((n, k) => n + (Array.isArray(source[k]) ? (source[k] as unknown[]).length : 1), 0);
    return { label: g.label, desc: g.desc, data: payload, count, present: present.length };
  })
  .filter((g) => g.present > 0);

interface Row { label: string; desc: string; hash: string; bytes: number; count: number }
const MAX_ESPERA_MS = 30 * 60_000;

const enc = new TextEncoder();
const fmt = (n: number) => n.toLocaleString('es-AR');
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Merkle root: pairwise sha256 of concatenated child hashes; the last one is duplicated when odd. */
async function merkleRoot(hashes: string[]): Promise<string> {
  let level = hashes;
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) next.push(await sha256(level[i] + (level[i + 1] ?? level[i])));
    level = next;
  }
  return level[0] ?? (await sha256(''));
}

type Variant = 'primary' | 'secondary' | 'accent';

export default function HashTodo({ variant = 'secondary' }: { variant?: Variant }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const runRef = useRef(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [root, setRoot] = useState<string | null>(null);
  const [sello, setSello] = useState<SelloGuardado | null>(null);
  const selloRef = useRef<SelloGuardado | null>(null);
  selloRef.current = sello;
  const enVuelo = useRef(false);
  const [msg, setMsg] = useState('');
  const [started, setStarted] = useState(false);
  const lotesActuales = useLotes(); // includes lots drawn on the map

  async function run() {
    const id = ++runRef.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const step = reduce ? 0 : 150;
    setStarted(true); setRows([]); setRoot(null); setSello(null); setMsg('');
    const out: Row[] = [];
    for (const d of items) {
      const json = JSON.stringify('lotes' in d.data ? { ...d.data, lotes: lotesActuales } : d.data);
      const row = { label: d.label, desc: d.desc, hash: await sha256(json), bytes: enc.encode(json).length, count: 'lotes' in d.data ? lotesActuales.length : d.count };
      if (step) await wait(step);
      if (runRef.current !== id) return;
      out.push(row);
      setRows([...out]);
    }
    const r = await merkleRoot(out.map((x) => x.hash));
    if (runRef.current !== id) return;
    setRoot(r);
    if (!reduce) await wait(900);
    if (runRef.current !== id) return;
    // Real sealing in the BFA (TSA1): what gets sealed is the SHA-256 of this acta file (the user downloads it + the receipt).
    const acta = JSON.stringify({
      tipo: 'acta-evidencia-campo-syntra', version: 1, generado: new Date().toISOString(), raiz: r,
      datasets: out.map((x) => ({ label: x.label, hash: x.hash, bytes: x.bytes })),
    }, null, 2);
    const hash = (await sha256(acta)).slice(2);
    try {
      const { sellador, envio, fallo } = await sellarConFallback(hash);
      if (runRef.current !== id) return;
      const nuevo: SelloGuardado = {
        hash, rd: envio.rd, estado: 'pendiente', enviadoEn: envio.enviadoEn, actaNombre: `syntra-evidencia-${r.slice(2, 10)}.json`,
        simulado: sellador.simulado, acta,
      };
      guardarSelloLocal(nuevo);
      setSello(nuevo);
      if (fallo) setMsg(`No pudimos contactar a la BFA (${fallo}). Sello simulado, sin validez.`);
    } catch {
      if (runRef.current === id) setMsg('No pudimos sellar. Probá de nuevo en unos segundos.');
    }
  }

  async function consultar() {
    const s = selloRef.current;
    if (!s || s.estado !== 'pendiente' || enVuelo.current) return;
    enVuelo.current = true;
    try {
      const res = await (s.simulado ? new SelladorSimulado() : new SelladorBFA()).consultar(s.hash, s.rd);
      if (selloRef.current?.hash !== s.hash) return;
      if (res.estado === 'confirmado') {
        const nuevo: SelloGuardado = { ...s, estado: 'confirmado', bloque: res.bloque, fecha: res.fecha, permanentRd: res.permanentRd };
        guardarSelloLocal(nuevo); setSello(nuevo); setMsg('');
      } else setMsg(res.estado === 'error' ? `No pudimos consultar a la BFA (${res.mensaje}).` : 'Sigue pendiente de bloque.');
    } finally { enVuelo.current = false; }
  }

  // Auto-consult every 60 s (max ~30 min) while a seal is pending.
  const selloHash = sello?.hash, selloEstado = sello?.estado;
  useEffect(() => {
    if (!selloHash || selloEstado !== 'pendiente') return;
    void consultar();
    const idt = setInterval(() => {
      const s = selloRef.current;
      if (!s || Date.now() - Date.parse(s.enviadoEn) > MAX_ESPERA_MS) { clearInterval(idt); return; }
      void consultar();
    }, 60_000);
    return () => clearInterval(idt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selloHash, selloEstado]);

  function open() {
    runRef.current++;
    setStarted(false); setRows([]); setRoot(null); setSello(null); setMsg('');
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  // Native close (button, Esc, backdrop) → stop the run and return focus to the trigger.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onClose = () => { runRef.current++; triggerRef.current?.focus(); };
    dlg.addEventListener('close', onClose);
    return () => dlg.removeEventListener('close', onClose);
  }, []);

  async function copiar() {
    if (!root) return;
    try {
      await navigator.clipboard.writeText(root);
      setMsg('Huella raíz copiada');
    } catch {
      setMsg(`Copiala a mano: ${root}`);
    }
  }

  function bajar(nombre: string, contenido: string, tipo: string) {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function descargar() {
    if (!sello?.acta) return;
    bajar(sello.actaNombre, sello.acta, 'application/json');
    setMsg('Acta descargada');
  }

  function descargarRecibo() {
    if (!sello) return;
    bajar(sello.actaNombre.replace(/\.json$/, '') + '.rd', (sello.estado === 'confirmado' && sello.permanentRd) || sello.rd, 'text/plain');
    setMsg('Recibo descargado');
  }

  const done = rows.length === items.length;

  return (
    <>
      <button ref={triggerRef} type="button" className={`btn btn-${variant}`} onClick={open} aria-haspopup="dialog">
        Sellar evidencia del campo
      </button>

      <dialog
        ref={dialogRef}
        className="hashtodo"
        aria-labelledby={titleId}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="hashtodo-body">
          <header className="hashtodo-head">
            <div className="stack" style={{ gap: 4, minWidth: 0 }}>
              <h2 id={titleId} className="section-title" style={{ fontSize: 20 }}>Sellar la evidencia del campo</h2>
              <span className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
                Generamos una huella digital única de toda la evidencia de tu establecimiento. Sirve para demostrarle al certificador o al comprador que nada se modificó desde hoy.
              </span>
            </div>
            <button type="button" className="btn btn-secondary hashtodo-x" onClick={close} aria-label="Cerrar">✕</button>
          </header>

          {!started ? (
            <>
              <strong style={{ fontSize: 14 }}>Qué se va a sellar ({items.length} conjuntos)</strong>
              <ul className="hashtodo-list">
                {items.map((g) => (
                  <li key={g.label}>
                    <div className="stack" style={{ gap: 2, minWidth: 0 }}>
                      <strong style={{ fontSize: 14 }}>{g.label}</strong>
                      <span className="muted" style={{ fontSize: 12 }}>{g.desc}</span>
                    </div>
                    <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{(n => `${fmt(n)} ${n === 1 ? 'registro' : 'registros'}`)('lotes' in g.data ? lotesActuales.length : g.count)}</span>
                  </li>
                ))}
              </ul>
              <div className="hashtodo-actions">
                <button type="button" className="btn btn-secondary" onClick={close}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={run}>Generar huella</button>
              </div>
            </>
          ) : (
          <>
          <ol className="hashtodo-list" aria-live="polite" aria-busy={!done}>
            {rows.map((r) => (
              <li key={r.label}>
                <div className="stack" style={{ gap: 2, minWidth: 0 }}>
                  <strong style={{ fontSize: 14 }}>{r.label}</strong>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {fmt(r.count)} {r.count === 1 ? 'registro' : 'registros'} · {fmt(r.bytes)} bytes
                  </span>
                </div>
                <span className="mono hashtodo-hash" title={r.hash}>✓ {shortHash(r.hash)}</span>
              </li>
            ))}
            {!done && <li className="muted" style={{ fontSize: 13 }}>Sellando {rows.length + 1} de {items.length}…</li>}
          </ol>

          <section className="card-dark stack" style={{ gap: 8 }} aria-live="polite">
            <span style={{ fontSize: 13, color: 'var(--dark-muted)' }}>Huella única del establecimiento (combina las {items.length} anteriores)</span>
            <strong className="mono hashtodo-root">{root ?? 'calculando…'}</strong>
            <span style={{ fontSize: 13, color: 'var(--dark-muted)' }}>
              {!root ? `${rows.length} de ${items.length} conjuntos sellados`
                : !sello ? 'Enviando a la Blockchain Federal Argentina…'
                : sello.estado === 'pendiente' ? `${sello.simulado ? 'Simulado · ' : ''}Enviado a la BFA · pendiente de bloque (suele tardar unos minutos)`
                : <>{sello.simulado ? 'Sello simulado (sin validez)' : 'Sellado en BFA'} · bloque <span className="mono" style={{ color: 'var(--dark-ink)' }}>{formatearBloque(sello.bloque ?? '-')}</span> · {sello.fecha} (hora Argentina)</>}
            </span>
          </section>

          <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>
            En la cadena solo queda la huella; los datos quedan en Syntra. Si alguien cambia un solo dato, la huella raíz deja de coincidir.
            {sello && !sello.simulado && <> Para verificar: entrá a <a href={URL_BFA_VERIFICAR} target="_blank" rel="noreferrer noopener">bfa.ar/sello</a> y subí el acta y el recibo.</>}
          </p>

          <div className="hashtodo-actions">
            <span role="status" className="muted hashtodo-msg">{msg}</span>
            <button type="button" className="btn btn-secondary" onClick={copiar} disabled={!root}>Copiar huella raíz</button>
            {sello?.estado === 'pendiente' && <button type="button" className="btn btn-secondary" onClick={() => void consultar()}>Consultar</button>}
            <button type="button" className="btn btn-secondary" onClick={descargarRecibo} disabled={!sello}>Descargar recibo (.rd)</button>
            <button type="button" className="btn btn-primary" onClick={descargar} disabled={!sello}>Descargar acta (.json)</button>
          </div>
          </>
          )}
        </div>
      </dialog>
    </>
  );
}
