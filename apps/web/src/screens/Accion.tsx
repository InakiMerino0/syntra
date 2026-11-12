import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sha256, shortHash } from '@synta/ui';
import { establecimiento, lotes, tiposAccion } from '@synta/data';

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

export default function Accion() {
  const navigate = useNavigate();
  const [tipoId, setTipoId] = useState('corredor');
  const [loteId, setLoteId] = useState('l3');
  const [fecha, setFecha] = useState('2026-11-12');
  const [v1, setV1] = useState(tiposAccion[0].v1);
  const [v2, setV2] = useState(tiposAccion[0].v2);
  const [notas, setNotas] = useState('');
  const [archivo, setArchivo] = useState('');
  const [fileFocus, setFileFocus] = useState(false);
  const [hash, setHash] = useState('');
  const [estado, setEstado] = useState<'idle' | 'firmando' | 'ok'>('idle');

  const tipo = tiposAccion.find((t) => t.id === tipoId)!;
  const lote = lotes.find((l) => l.id === loteId)!;

  const payload = JSON.stringify({
    tipo: tipo.label,
    lote: lote.name,
    fecha,
    [tipo.f1.toLowerCase()]: v1,
    [tipo.f2.toLowerCase()]: v2,
    ...(notas && { notas }),
    ...(archivo && { respaldo: archivo }),
    productor: establecimiento.name,
  }, null, 2);

  useEffect(() => {
    let alive = true;
    sha256(payload).then((h) => alive && setHash(h));
    return () => { alive = false; };
  }, [payload]);

  const pickTipo = (id: string) => {
    const t = tiposAccion.find((x) => x.id === id)!;
    setTipoId(id); setV1(t.v1); setV2(t.v2);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setEstado('firmando');
    setTimeout(() => setEstado('ok'), 800);
  };

  // Simulated block number, derived from the hash so it's stable per payload.
  const bloque = hash ? 48_000_000 + (parseInt(hash.slice(2, 8), 16) % 1_000_000) : 0;

  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <header className="stack" style={{ gap: 6 }}>
        <h1 className="page-title">Registrar acción productiva</h1>
        <span className="muted" style={{ fontSize: 14 }}>Lo que hacés en el lote también queda firmado y suma evidencia de uso eficiente de insumos y agua.</span>
      </header>

      <div className="row" style={{ gap: 20, alignItems: 'flex-start' }}>
        <form onSubmit={onSubmit} className="card" style={{ flex: '3 1 420px', minWidth: 0, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <fieldset style={{ margin: 0, padding: 0, border: 0 }}>
            <legend style={{ fontSize: 13, fontWeight: 600, padding: '0 0 10px' }}>Tipo de acción</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tiposAccion.map((t) => (
                <button key={t.id} type="button" className="chip" style={{ minHeight: 44, fontSize: 14 }} aria-pressed={t.id === tipoId} onClick={() => pickTipo(t.id)}>{t.label}</button>
              ))}
            </div>
          </fieldset>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="field">
              <label htmlFor="lote">Lote</label>
              <select id="lote" className="input" value={loteId} onChange={(e) => setLoteId(e.target.value)}>
                {lotes.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.ha} ha)</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="fecha">Fecha</label>
              <input id="fecha" type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="f1">{tipo.f1}</label>
              <input id="f1" type="text" className="input" value={v1} onChange={(e) => setV1(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="f2">{tipo.f2}</label>
              <input id="f2" type="text" className="input" value={v2} onChange={(e) => setV2(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="notas">Notas (opcional)</label>
            <textarea id="notas" rows={3} className="input" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>

          <div className="field">
            <span style={{ fontSize: 13, fontWeight: 600 }}>Respaldo (opcional)</span>
            <label htmlFor="respaldo" style={{ outline: fileFocus ? '3px solid #4c9bd6' : undefined, outlineOffset: 2,  minHeight: 64, border: '2px dashed var(--input)', borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', textAlign: 'center', fontSize: 14, fontWeight: 400, color: 'var(--muted)', cursor: 'pointer' }}>
              {archivo || 'Adjuntar remito, receta agronómica o foto'}
            </label>
            <input id="respaldo" type="file" style={srOnly} onFocus={() => setFileFocus(true)} onBlur={() => setFileFocus(false)} onChange={(e) => setArchivo(e.target.files?.[0]?.name ?? '')} />
          </div>

          {estado === 'ok' ? (
            <div role="status" style={{ background: 'var(--ok-bg)', color: 'var(--ok-fg)', borderRadius: 8, padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Registro firmado · hash <span className="mono">{shortHash(hash)}</span> · bloque #{bloque.toLocaleString('es-AR')} (simulado)</span>
              <Link to="/trazabilidad" className="btn btn-primary">Ver en trazabilidad</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button type="submit" className="btn btn-primary" style={{ minHeight: 48, fontSize: 15 }} disabled={estado === 'firmando'}>
                {estado === 'firmando' ? 'Firmando…' : 'Firmar y registrar'}
              </button>
              <button type="button" className="btn btn-secondary" style={{ minHeight: 48, fontSize: 15 }} onClick={() => navigate('/panel')}>Cancelar</button>
            </div>
          )}
          <span aria-live="polite" style={srOnly}>{estado === 'firmando' ? 'Firmando registro…' : ''}</span>
        </form>

        <aside aria-labelledby="prev" className="card-dark" style={{ flex: '2 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 id="prev" style={{ fontSize: 15 }}>Qué se va a firmar</h2>
          <pre className="mono" style={{ margin: 0, padding: 16, background: '#0d1b14', borderRadius: 8, fontSize: 12, lineHeight: 1.6, color: '#c3d2c8', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{payload}</pre>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
            <span style={{ color: 'var(--dark-muted)' }}>SHA-256 (vista previa)</span>
            <span className="mono" style={{ color: 'var(--accent)', overflowWrap: 'anywhere' }}>{hash || 'calculando…'}</span>
          </div>
          <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--dark-muted)' }}>El hash se ancla en blockchain. Los datos quedan en Synta; en la cadena solo queda la huella.</span>
        </aside>
      </div>
    </div>
  );
}
