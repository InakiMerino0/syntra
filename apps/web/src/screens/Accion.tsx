import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { sha256, shortHash } from '@synta/ui';
import { establecimiento, tiposAccion } from '@synta/data';
import { useLotes } from '../store/lotes';
import { encolar, sincronizar, usePendientes, useOnline } from '../lib/colaOffline';

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

export default function Accion() {
  const navigate = useNavigate();
  const lotes = useLotes();
  const [params] = useSearchParams();
  const inicial = tiposAccion.find((t) => t.id === params.get('tipo')) ?? tiposAccion[0];
  const [tipoId, setTipoId] = useState(inicial.id);
  const [loteId, setLoteId] = useState('l3');
  const [fecha, setFecha] = useState('2026-11-12');
  const [v1, setV1] = useState(inicial.v1);
  const [v2, setV2] = useState(inicial.v2);
  const [sitio, setSitio] = useState('Borde con corredor / parche de bosque');
  const [notas, setNotas] = useState('');
  const [archivo, setArchivo] = useState('');
  const [fileFocus, setFileFocus] = useState(false);
  const [hash, setHash] = useState('');
  const [firmado, setFirmado] = useState('');
  const [estado, setEstado] = useState<'idle' | 'firmando' | 'ok' | 'offline'>('idle');
  const online = useOnline();
  const pendientes = usePendientes().filter((a) => !a.sincronizada);
  const [toast, setToast] = useState('');

  // Back online: flush the queue (no backend in the prototype, so this just marks entries as synced) and tell the user.
  useEffect(() => {
    if (!online) return;
    let t: number | undefined;
    sincronizar().then((n) => {
      if (!n) return;
      setToast(`Se sincronizaron ${n} registro${n === 1 ? '' : 's'} guardado${n === 1 ? '' : 's'} sin conexión`);
      t = window.setTimeout(() => setToast(''), 5000);
    });
    return () => window.clearTimeout(t);
  }, [online]);

  const tipo = tiposAccion.find((t) => t.id === tipoId)!;
  const lote = lotes.find((l) => l.id === loteId) ?? lotes[0];

  const payload = JSON.stringify({
    tipo: tipo.label,
    lote: lote.name,
    fecha,
    [tipo.f1.toLowerCase()]: v1,
    [tipo.f2.toLowerCase()]: v2,
    ...(tipo.id === 'monitoreo' && { sitio }),
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
    if (!hash) return;
    const signed = hash; // freeze the hash of what was submitted
    if (!navigator.onLine) {
      // No signal: the hash is already computed locally; keep the signed record in the queue until we're back online.
      setFirmado(signed);
      encolar(signed, `${tipo.label} · ${lote.name} · ${fecha}`);
      setEstado('offline');
      return;
    }
    setEstado('firmando');
    setTimeout(() => { setFirmado(signed); setEstado('ok'); }, 800);
  };

  // Editing anything after signing invalidates the banner: it is a new, unsigned record.
  useEffect(() => { setEstado((s) => (s === 'ok' || s === 'offline' ? 'idle' : s)); }, [payload]);

  // Simulated block number, derived from the hash so it's stable per payload.
  const bloque = firmado ? 48_000_000 + (parseInt(firmado.slice(2, 8), 16) % 1_000_000) : 0;

  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <header className="stack" style={{ gap: 6 }}>
        <h1 className="page-title">Registrar acción productiva</h1>
        <span className="muted" style={{ fontSize: 14 }}>Lo que hacés en el lote también queda firmado y suma evidencia de uso eficiente de insumos y agua.</span>
      </header>

      <div className="row" style={{ gap: 20, alignItems: 'flex-start' }}>
        <form onSubmit={onSubmit} className="card" style={{ flex: '1 1 420px', maxWidth: 720, minWidth: 0, padding: 'clamp(16px, 5vw, 28px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <fieldset style={{ margin: 0, padding: 0, border: 0 }}>
            <legend style={{ fontSize: 13, fontWeight: 600, padding: '0 0 10px' }}>Tipo de acción</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tiposAccion.map((t) => (
                <button key={t.id} type="button" className="chip" style={{ minHeight: 44, fontSize: 14 }} aria-pressed={t.id === tipoId} onClick={() => pickTipo(t.id)}>{t.label}</button>
              ))}
            </div>
          </fieldset>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
            <div className="field">
              <label htmlFor="lote">Lote</label>
              <select id="lote" className="input" value={loteId} onChange={(e) => setLoteId(e.target.value)}>
                {lotes.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.ha.toLocaleString('es-AR')} ha)</option>)}
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

          {tipo.id === 'monitoreo' && (
            <div className="field">
              <label htmlFor="sitio">Sitio</label>
              <select id="sitio" className="input" value={sitio} onChange={(e) => setSitio(e.target.value)} aria-describedby="sitio-ayuda">
                <option>Borde con corredor / parche de bosque</option>
                <option>Centro del lote</option>
              </select>
              <span id="sitio-ayuda" className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                Conteo de 15 minutos en el borde del corredor y en el centro del lote; sumá fotos georreferenciadas.
              </span>
            </div>
          )}

          <details style={{ border: '1px solid var(--line-soft)', borderRadius: 8, padding: '0 14px' }}>
            <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Más detalles (notas, respaldo y vista previa)</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 14 }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, background: '#0b1038', borderRadius: 8 }}>
            <h2 id="prev" style={{ fontSize: 15, margin: 0, color: '#fff' }}>Qué se va a firmar</h2>
            <pre className="mono" style={{ margin: 0, padding: 16, background: '#070b2a', borderRadius: 8, fontSize: 12, lineHeight: 1.6, color: '#c9cff5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{payload}</pre>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              <span style={{ color: 'var(--dark-muted)' }}>SHA-256 (vista previa)</span>
              <span className="mono" style={{ color: 'var(--accent)', overflowWrap: 'anywhere' }}>{hash || 'calculando…'}</span>
            </div>
            <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--dark-muted)' }}>El hash se ancla en la Blockchain Federal Argentina (BFA). Los datos quedan en Syntra; en la cadena solo queda la huella.</span>
          </div>
            </div>
          </details>

          {!online && (
            <div role="status" className="offline-banner">
              <span aria-hidden="true">●</span>
              <span>Sin conexión. Podés registrar igual: el registro se firma en tu dispositivo y se sincroniza al volver la señal.</span>
            </div>
          )}
          {online && pendientes.length > 0 && <div role="status" className="offline-pend">Sincronizando {pendientes.length} registro{pendientes.length === 1 ? '' : 's'}…</div>}
          {estado === 'offline' ? (
            <div role="status" style={{ background: 'var(--warn-bg)', color: 'var(--warn-fg)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Guardado sin conexión · se sincroniza al volver la señal</span>
              <span style={{ fontSize: 13 }}>Huella calculada en tu dispositivo: <span className="mono">{shortHash(firmado)}</span>. Todavía no está anclada ni en trazabilidad.</span>
            </div>
          ) : estado === 'ok' ? (
            <div role="status" style={{ background: 'var(--ok-bg)', color: 'var(--ok-fg)', borderRadius: 8, padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Registro firmado · hash <span className="mono">{shortHash(firmado)}</span> · bloque #{bloque.toLocaleString('es-AR')} (simulado)</span>
              <Link to="/trazabilidad" className="btn btn-primary">Ver en trazabilidad</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button type="submit" className="btn btn-primary" style={{ minHeight: 48, fontSize: 15, flex: '1 1 180px' }} disabled={estado === 'firmando'}>
                {estado === 'firmando' ? 'Firmando…' : 'Firmar y registrar'}
              </button>
              <button type="button" className="btn btn-secondary" style={{ minHeight: 48, fontSize: 15, flex: '1 1 120px' }} onClick={() => navigate('/panel')}>Cancelar</button>
            </div>
          )}
          <span aria-live="polite" style={srOnly}>{estado === 'firmando' ? 'Firmando registro…' : ''}</span>
        </form>
        {toast && <div role="status" className="toast-sync">{toast}</div>}

      </div>
    </div>
  );
}
