import { useEffect, useId, useRef, useState } from 'react';
import { sha256, shortHash } from '@synta/ui';
import * as data from '@synta/data';
import './hashtodo.css';

// Every dataset @synta/data exposes today. Read defensively: a missing export is skipped, not a crash.
const DATASETS: { key: string; label: string }[] = [
  { key: 'establecimiento', label: 'Establecimiento' },
  { key: 'lotes', label: 'Lotes (polígonos)' },
  { key: 'capas', label: 'Capas (bosque nativo, focos)' },
  { key: 'kpis', label: 'Indicadores' },
  { key: 'ejes', label: 'Ejes regulatorios' },
  { key: 'certificaciones', label: 'Certificaciones y requisitos' },
  { key: 'corredores', label: 'Corredores biológicos' },
  { key: 'biodiversidadLote3', label: 'Biodiversidad Lote 3' },
  { key: 'ndviSerie', label: 'Serie NDVI' },
  { key: 'eventos', label: 'Registros firmados' },
  { key: 'tiposAccion', label: 'Tipos de acción' },
];

const source = data as unknown as Record<string, unknown>;
const items = DATASETS.filter((d) => source[d.key] !== undefined).map((d) => ({ ...d, data: source[d.key] }));

interface Row { label: string; hash: string; bytes: number; count: number | null }
interface Anchor { tx: string; bloque: string; generado: string }

const enc = new TextEncoder();
const fmt = (n: number) => n.toLocaleString('es-AR');
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const countOf = (v: unknown) => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : null);

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
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [msg, setMsg] = useState('');

  async function run() {
    const id = ++runRef.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const step = reduce ? 0 : 150;
    setRows([]); setRoot(null); setAnchor(null); setMsg('');
    const out: Row[] = [];
    for (const d of items) {
      const json = JSON.stringify(d.data);
      const row = { label: d.label, hash: await sha256(json), bytes: enc.encode(json).length, count: countOf(d.data) };
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
    // Anchoring is simulated: fake tx and block derived from the real root (same approach as Procesando).
    setAnchor({
      tx: '0x' + r.slice(2).split('').reverse().join(''),
      bloque: '#58.' + (216000 + (parseInt(r.slice(2, 6), 16) % 1000)).toLocaleString('es-AR'),
      generado: new Date().toISOString(),
    });
  }

  function open() {
    dialogRef.current?.showModal();
    run();
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

  function descargar() {
    if (!root || !anchor) return;
    const evidencia = {
      generado: anchor.generado,
      root,
      tx: anchor.tx,
      bloque: anchor.bloque,
      red: 'Polygon Amoy (simulado)',
      datasets: rows.map((r) => ({ label: r.label, hash: r.hash, bytes: r.bytes })),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(evidencia, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `synta-evidencia-${root.slice(2, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg('Evidencia descargada');
  }

  const done = rows.length === items.length;

  return (
    <>
      <button ref={triggerRef} type="button" className={`btn btn-${variant}`} onClick={open} aria-haspopup="dialog">
        Hashear toda la información
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
              <h2 id={titleId} className="section-title" style={{ fontSize: 20 }}>Huella de toda la información</h2>
              <span className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
                SHA-256 real de cada conjunto de datos del establecimiento, combinados en una sola huella raíz (árbol de Merkle).
              </span>
            </div>
            <button type="button" className="btn btn-secondary hashtodo-x" onClick={close} aria-label="Cerrar">✕</button>
          </header>

          <ol className="hashtodo-list" aria-live="polite" aria-busy={!done}>
            {rows.map((r) => (
              <li key={r.label}>
                <div className="stack" style={{ gap: 2, minWidth: 0 }}>
                  <strong style={{ fontSize: 14 }}>{r.label}</strong>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {r.count !== null ? `${fmt(r.count)} ${r.count === 1 ? 'ítem' : 'ítems'} · ` : ''}{fmt(r.bytes)} bytes
                  </span>
                </div>
                <span className="mono hashtodo-hash" title={r.hash}>{shortHash(r.hash)}</span>
              </li>
            ))}
            {!done && <li className="muted" style={{ fontSize: 13 }}>Calculando {rows.length + 1} de {items.length}…</li>}
          </ol>

          <section className="card-dark stack" style={{ gap: 8 }} aria-live="polite">
            <span style={{ fontSize: 13, color: 'var(--dark-muted)' }}>Huella raíz del establecimiento</span>
            <strong className="mono hashtodo-root">{root ?? 'calculando…'}</strong>
            <span style={{ fontSize: 13, color: 'var(--dark-muted)' }}>
              {!root ? `${rows.length} de ${items.length} conjuntos hasheados`
                : !anchor ? 'Anclando en Polygon Amoy (simulado)…'
                : <>Anclado en Polygon Amoy (simulado) · tx <span className="mono" style={{ color: 'var(--dark-ink)' }}>{shortHash(anchor.tx)}</span> · bloque <span className="mono" style={{ color: 'var(--dark-ink)' }}>{anchor.bloque}</span> · {new Date(anchor.generado).toLocaleString('es-AR')}</>}
            </span>
          </section>

          <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>
            En la cadena solo queda la huella; los datos quedan en Synta. Si alguien cambia un solo dato, la huella raíz deja de coincidir.
          </p>

          <div className="hashtodo-actions">
            <span role="status" className="muted hashtodo-msg">{msg}</span>
            <button type="button" className="btn btn-secondary" onClick={copiar} disabled={!root}>Copiar huella raíz</button>
            <button type="button" className="btn btn-primary" onClick={descargar} disabled={!anchor}>Descargar evidencia (.json)</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
