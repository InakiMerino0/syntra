import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FakeQR, sha256, shortHash } from '@synta/ui';
import HashTodo from '../components/HashTodo';
import { eventos, eventKinds, type EventKind, type Evento } from '@synta/data';

const PUBLIC_URL = 'https://synta.app/v/184';
const resumen = [
  ['Productor', 'La Esperanza (Córdoba)'],
  ['Lotes verificados', '3 de 4 · 256 ha'],
  ['Deforestación post 2020', '0 ha'],
  ['Registros íntegros', '128 / 128'],
];
const kinds = Object.entries(eventKinds) as [EventKind, { label: string; color: string }][];

export default function Trazabilidad() {
  const [filter, setFilter] = useState<EventKind | 'all'>('all');
  // id → 'busy' while verifying, then the recomputed hash
  const [checks, setChecks] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState(false);

  async function verify(e: Evento) {
    setChecks((c) => ({ ...c, [e.id]: 'busy' }));
    const [hash] = await Promise.all([sha256(JSON.stringify(e)), new Promise((r) => setTimeout(r, 600))]);
    setChecks((c) => ({ ...c, [e.id]: hash }));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(PUBLIC_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked: nothing to show */ }
  }

  const list = eventos.filter((e) => filter === 'all' || e.kind === filter);

  return (
    <div className="page">
      <header className="page-header">
        <div className="stack" style={{ gap: 6, flex: '1 1 320px', minWidth: 0 }}>
          <h1 className="page-title">Trazabilidad</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Cada registro tiene un hash SHA-256 anclado en blockchain. Cualquiera puede recalcularlo y comprobar que no cambió.
          </p>
        </div>
        <HashTodo variant="primary" />
      </header>

      <div role="group" aria-label="Filtrar por tipo" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[['all', 'Todos'] as const, ...kinds.map(([k, v]) => [k, v.label] as const)].map(([id, label]) => (
          <button key={id} type="button" className="chip" style={{ minHeight: 44 }} aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <ol className="card" style={{ flex: '2 1 560px', minWidth: 0, listStyle: 'none', margin: 0, padding: '8px 20px' }}>
          {list.map((e) => {
            const st = checks[e.id];
            return (
              <li key={e.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <span aria-hidden="true" title={eventKinds[e.kind].label} style={{ width: 12, height: 12, borderRadius: '50%', marginTop: 5, flex: '0 0 auto', background: eventKinds[e.kind].color }} />
                <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
                    <strong style={{ fontSize: 15 }}>{e.title}</strong>
                    <span className="muted" style={{ fontSize: 12 }}>{e.lote} · {eventKinds[e.kind].label}</span>
                  </div>
                  <span className="muted" style={{ fontSize: 13 }}>{e.date} · Fuente: {e.source}</span>
                  <span className="mono" style={{ fontSize: 12, color: '#3A4A41', overflowWrap: 'anywhere' }}>hash {e.hash} · bloque {e.block}</span>
                </div>
                <div aria-live="polite" style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>
                  {st && st !== 'busy' ? (
                    <span title={`SHA-256 recalculado: ${st}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--ok-fg)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12 L10 17 L19 7" /></svg>
                      Íntegro <span className="mono muted" style={{ fontWeight: 400, fontSize: 11 }}>{shortHash(st)}</span>
                    </span>
                  ) : (
                    <button type="button" className="btn btn-secondary" style={{ fontSize: 13, padding: '0 14px' }} disabled={st === 'busy'} onClick={() => verify(e)} aria-label={`Verificar: ${e.title}`}>
                      {st === 'busy' ? 'Verificando…' : 'Verificar'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <aside aria-labelledby="pub" className="card" style={{ flex: '1 1 320px', minWidth: 0, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="stack" style={{ gap: 4 }}>
            <h2 id="pub" className="section-title">Vista pública de verificación</h2>
            <span className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
              Lo que ve un comprador o certificador al escanear el QR. No muestra datos sensibles del productor.
            </span>
          </div>
          <div style={{ alignSelf: 'center' }}>
            <FakeQR label="Código QR ilustrativo hacia la vista pública" />
          </div>
          <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10, padding: 16, borderRadius: 10, background: 'var(--bg)', fontSize: 14 }}>
            {resumen.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
                <dt className="muted">{k}</dt>
                <dd style={{ margin: 0, fontWeight: 700 }}>{v}</dd>
              </div>
            ))}
          </dl>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: '1 1 auto' }} onClick={copy}>
              <span aria-live="polite">{copied ? '¡Copiado!' : 'Copiar link'}</span>
            </button>
            <Link to="/pasaporte" className="btn btn-primary" style={{ flex: '1 1 auto' }}>Ver pasaporte</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
