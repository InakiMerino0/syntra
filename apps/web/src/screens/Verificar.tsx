// /verificar — public verifier (opened from the QR, no login). Everything is computed in the browser.
import { useEffect, useState, type DragEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Logo, sha256 } from '@synta/ui';
import { eventos, type Evento } from '@synta/data';

// Same payload Trazabilidad hashes (keep in sync).
const payloadDe = (e: Evento) => JSON.stringify({ title: e.title, lote: e.lote, date: e.date, source: e.source });

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;
const norm = (h: string) => h.trim().toLowerCase().replace(/^0x/, '');

export default function Verificar() {
  const [params] = useSearchParams();
  const [entrada, setEntrada] = useState(params.get('h') ?? '');
  const [conocidos, setConocidos] = useState<{ e: Evento; hash: string }[]>([]);
  const [archivo, setArchivo] = useState<{ nombre: string; hash: string } | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [consultado, setConsultado] = useState(!!params.get('h'));

  useEffect(() => {
    let alive = true;
    Promise.all(eventos.map(async (e) => ({ e, hash: await sha256(payloadDe(e)) }))).then((r) => { if (alive) setConocidos(r); });
    return () => { alive = false; };
  }, []);

  const buscado = archivo ? archivo.hash : entrada;
  const q = norm(buscado);
  const hallado = q.length >= 8 && conocidos.length ? conocidos.find((c) => norm(c.hash) === q || (q.length < 64 && norm(c.hash).startsWith(q))) : undefined;
  const hayConsulta = q.length > 0 && (consultado || !!archivo);

  async function leer(f?: File | null) {
    if (!f) return;
    const buf = await f.arrayBuffer(); // local only: the file is never uploaded
    const d = await crypto.subtle.digest('SHA-256', buf);
    const hash = '0x' + [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
    setArchivo({ nombre: f.name, hash });
    setEntrada('');
  }
  const onDrop = (ev: DragEvent) => { ev.preventDefault(); setArrastrando(false); void leer(ev.dataTransfer.files?.[0]); };

  const card = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 'clamp(16px, 5vw, 24px)', display: 'flex', flexDirection: 'column', gap: 14 } as const;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ background: 'var(--dark)', color: 'var(--dark-ink)', padding: '14px 16px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={26} />
          <span style={{ fontFamily: 'var(--font-brand)', fontSize: 22, letterSpacing: 1, textTransform: 'uppercase' }}>Syntra</span>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--dark-muted)' }}>Verificador público</span>
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 6vw, 30px)', color: 'var(--primary-ink)' }}>Verificá un registro</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            Pegá el hash SHA-256 de un registro o soltá el archivo (JSON o PDF) del que querés comprobar la huella. Sin cuenta y sin datos sensibles del productor.
          </p>
        </div>

        <section style={card} aria-labelledby="v-hash">
          <label htmlFor="hash" id="v-hash" style={{ fontSize: 13, fontWeight: 600 }}>Hash SHA-256</label>
          <input id="hash" className="input mono" style={{ fontSize: 13 }} value={entrada} placeholder="0x…" autoComplete="off" spellCheck={false}
            onChange={(e) => { setEntrada(e.target.value); setArchivo(null); setConsultado(false); }} />
          <button type="button" className="btn btn-primary" style={{ minHeight: 48 }} disabled={!entrada.trim()} onClick={() => { setArchivo(null); setConsultado(true); }}>Verificar</button>
        </section>

        <section style={card} aria-labelledby="v-file">
          <span id="v-file" style={{ fontSize: 13, fontWeight: 600 }}>O verificá un archivo</span>
          <label htmlFor="archivo" onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }} onDragLeave={() => setArrastrando(false)} onDrop={onDrop}
            style={{ minHeight: 88, border: `2px dashed ${arrastrando ? 'var(--primary)' : 'var(--input)'}`, borderRadius: 8, background: arrastrando ? 'var(--primary-soft)' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, textAlign: 'center', fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>
            {archivo ? archivo.nombre : 'Soltá un JSON o PDF acá, o tocá para elegirlo'}
          </label>
          <input id="archivo" type="file" accept=".json,.pdf,application/json,application/pdf" style={srOnly} onChange={(e) => void leer(e.target.files?.[0])} />
          <span className="muted" style={{ fontSize: 12 }}>El archivo no se sube: el SHA-256 se calcula en tu dispositivo.</span>
          {archivo && <span className="mono" style={{ fontSize: 12, overflowWrap: 'anywhere', wordBreak: 'break-all' }}>{archivo.hash}</span>}
        </section>

        <div aria-live="polite">
          {hayConsulta && (hallado ? (
            <section style={{ ...card, background: 'var(--ok-bg)', borderColor: 'var(--ok-bar)' }}>
              <strong style={{ color: 'var(--ok-fg)', fontSize: 17 }}>Registro encontrado ✓</strong>
              <span style={{ fontSize: 14, color: 'var(--ok-fg)', fontWeight: 600 }}>Sellado en BFA (simulado) · bloque {hallado.e.block} · {hallado.e.date}</span>
              <dl style={{ margin: 0, fontSize: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><dt style={{ display: 'inline' }} className="muted">Registro: </dt><dd style={{ display: 'inline', margin: 0 }}>{hallado.e.title}</dd></div>
                <div><dt style={{ display: 'inline' }} className="muted">Fuente: </dt><dd style={{ display: 'inline', margin: 0 }}>{hallado.e.source}</dd></div>
              </dl>
              <span className="mono" style={{ fontSize: 12, overflowWrap: 'anywhere', wordBreak: 'break-all' }}>{hallado.hash}</span>
            </section>
          ) : (
            <section style={{ ...card, background: 'var(--bad-bg)', borderColor: 'var(--bad-bar)' }}>
              <strong style={{ color: 'var(--bad-fg)', fontSize: 17 }}>No encontrado ✗</strong>
              <span style={{ fontSize: 14, color: 'var(--bad-fg)' }}>Ningún registro conocido coincide con esta huella. Si el contenido cambió aunque sea una coma, el hash es otro.</span>
            </section>
          ))}
        </div>

        <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, margin: 0 }}>
          Demo: el anclaje en la Blockchain Federal Argentina (BFA) es simulado. Syntra no firma: los registros los revisa el auditor del certificador.
        </p>
        <Link to="/trazabilidad" style={{ fontSize: 14, fontWeight: 600, minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Ver trazabilidad completa</Link>
      </main>
    </div>
  );
}
