import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sha256, shortHash } from '@synta/ui';
import { biodiversidadLote3, procesamientoPasos, type Lote } from '@synta/data';
import { useLote, setLotes } from '../store/lotes';

const HASH_STEP = procesamientoPasos.findIndex((p) => p.label.startsWith('Generando hash'));
const CHAIN_STEP = procesamientoPasos.findIndex((p) => p.label.startsWith('Anclando'));
const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

const css = `
@keyframes proc-spin { to { transform: rotate(360deg); } }
.proc-spin { width: 16px; height: 16px; border: 3px solid var(--accent); border-top-color: transparent; border-radius: 50%; animation: proc-spin 0.8s linear infinite; }
@media (prefers-reduced-motion: reduce) { .proc-spin { animation: none; border-top-color: var(--accent); opacity: 0.6; } }
`;

export default function Procesando() {
  const { loteId } = useParams();
  const lote = useLote(loteId);
  if (!lote) {
    return (
      <div className="page">
        <div className="card stack" style={{ maxWidth: 480, gap: 12 }}>
          <strong style={{ fontSize: 16 }}>Lote no encontrado</strong>
          <span className="muted" style={{ fontSize: 14 }}>Ese lote no existe o fue borrado.</span>
          <Link to="/mapa" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Volver al mapa</Link>
        </div>
      </div>
    );
  }
  return <Analisis lote={lote} />;
}

function Analisis({ lote }: { lote: Lote }) {
  const [step, setStep] = useState(0);
  const [run, setRun] = useState(0);
  const [hash, setHash] = useState('');

  useEffect(() => {
    setStep(0);
    const t = setInterval(() => setStep((s) => (s >= procesamientoPasos.length ? s : s + 1)), 900);
    let alive = true;
    sha256(JSON.stringify({ lote: lote.id, polygon: lote.polygon, timestamp: new Date().toISOString() })).then((h) => alive && setHash(h));
    return () => { clearInterval(t); alive = false; };
  }, [run, lote.id, lote.polygon]);

  const finished = step >= procesamientoPasos.length;
  useEffect(() => {
    if (!finished) return;
    setLotes((ls) => ls.map((l) => (l.id === lote.id && l.status === 'Sin analizar'
      ? { ...l, status: 'Mejoras necesarias', bio: biodiversidadLote3.actual, tone: 'warn' as const, note: 'Analizado hoy. Mirá las mejoras necesarias para certificar.' }
      : l)));
  }, [finished, lote.id]);
  // Anchoring is simulated: fake tx and block derived from the real hash.
  const tx = hash ? shortHash('0x' + hash.slice(10).split('').reverse().join('')) : '…';
  const block = hash ? '#58.' + (214000 + (parseInt(hash.slice(2, 6), 16) % 1000)).toLocaleString('es-AR') : '';

  const detail = (i: number, d: string) =>
    i === HASH_STEP && hash ? `${shortHash(hash)} · ${d}` : i === CHAIN_STEP && hash ? `${d} · tx ${tx}` : d;

  return (
    <div className="screen-fill" style={{ background: '#0F1F17', color: 'var(--dark-ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(20px, 4vh, 28px)', padding: 'clamp(24px, 6vh, 48px) 16px calc(clamp(24px, 6vh, 48px) + env(safe-area-inset-bottom, 0px))' }}>
      <style>{css}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--dark-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Analizando y certificando</span>
        <h1 className="display" style={{ fontSize: 'clamp(24px, 6vw, 36px)', overflowWrap: 'anywhere' }}>{lote.name} · {lote.ha.toLocaleString('es-AR')} ha</h1>
      </div>

      <ol aria-live="polite" style={{ listStyle: 'none', margin: 0, padding: 'clamp(16px, 5vw, 28px)', width: '100%', maxWidth: 560, background: '#1A3326', border: '1px solid var(--dark-line)', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {procesamientoPasos.map((p, i) => {
          const done = i < step, active = i === step;
          return (
            <li key={p.label} style={{ display: 'flex', gap: 'clamp(12px, 3vw, 16px)', alignItems: 'flex-start', padding: '10px 0' }}>
              <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: '50%', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', ...(done ? { background: 'var(--accent)' } : { border: `2px solid ${active ? 'var(--accent)' : '#3D5A48'}` }) }}>
                {done && <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" fill="none" stroke="var(--dark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                {active && <span className="proc-spin" />}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span style={{ fontSize: 16, fontWeight: active ? 700 : 500, color: done || active ? 'var(--dark-ink)' : '#7F9787' }}>
                  {p.label}<span style={srOnly}>{done ? ' (listo)' : active ? ' (en curso)' : ' (pendiente)'}</span>
                </span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--dark-muted)', overflowWrap: 'anywhere' }}>{detail(i, p.detail)}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {finished && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <span role="status" style={{ fontSize: 14, color: '#C3D2C8' }}>
            Registro anclado en el bloque <span className="mono" style={{ color: 'var(--dark-ink)' }}>{block}</span>
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', width: '100%', maxWidth: 560 }}>
            <Link to={`/lote/${lote.id}`} className="btn btn-accent" style={{ minHeight: 48, flex: '1 1 240px' }}>Ver mejoras necesarias para certificar</Link>
            <button type="button" className="btn btn-ghost-dark" style={{ minHeight: 48, flex: '1 1 180px' }} onClick={() => setRun((r) => r + 1)}>Repetir animación</button>
          </div>
        </div>
      )}

      <Link to="/mapa" style={{ fontSize: 14, color: 'var(--accent)', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Volver al mapa</Link>
    </div>
  );
}
