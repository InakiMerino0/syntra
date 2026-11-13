import { useEffect, useState, type ReactNode } from 'react';
import { Badge, Logo, shortHash } from '@synta/ui';
import { biodiversidadLote3, certificaciones, corredores, establecimiento, eventos, reqLabel } from '@synta/data';
import { useLotes } from '../store/lotes';
import HashTodo from '../components/HashTodo';
import QR from '../components/QR';
import { INFORME_NOMBRE, RED_SELLADO, URL_VERIFICACION, type EvidenciaInforme } from '../lib/informe';
import { construirEvidencia, descargarInforme } from '../lib/informePdf';
import './informe/informe.css';

const fmtHa = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 1 });
const fmtBytes = (n: number) => `${n.toLocaleString('es-AR')} B`;
const PASOS = [
  'Escaneá el QR del informe o abrí el link de verificación.',
  'Descargá el paquete de evidencia (los archivos del inventario).',
  'Calculá el SHA-256 de cada archivo y comparalo con el inventario.',
  'Combiná los hashes en el árbol de Merkle y verificá que la raíz coincida.',
  'Confirmá que la raíz está sellada en la Blockchain Federal Argentina con esa fecha.',
];

function Sec({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <section className="informe-sec" aria-labelledby={`sec-${n}`}>
      <h2 id={`sec-${n}`} className="section-title"><span className="num">{n}.</span> {titulo}</h2>
      <div className="informe-body">{children}</div>
    </section>
  );
}

export default function Informe() {
  const lotes = useLotes();
  const totalHa = lotes.reduce((sum, l) => sum + l.ha, 0);
  const cert = certificaciones.find((c) => c.id === 'fsa') ?? certificaciones[0];
  const [ev, setEv] = useState<EvidenciaInforme | null>(null);
  const [evErr, setEvErr] = useState(false);
  const [copiado, setCopiado] = useState('');
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setEv(null); setEvErr(false);
    Promise.resolve()
      .then(() => construirEvidencia(lotes))
      .then((e) => { if (alive) setEv(e); })
      .catch(() => { if (alive) setEvErr(true); });
    return () => { alive = false; };
  }, [lotes]);

  async function compartir() {
    try {
      await navigator.clipboard.writeText(URL_VERIFICACION);
      setCopiado('Link copiado');
    } catch {
      setCopiado(`Copiá este link: ${URL_VERIFICACION}`);
    }
  }

  async function descargar() {
    setGenerando(true); setError('');
    try {
      await descargarInforme(lotes);
    } catch {
      setError('No pudimos generar el PDF. Probá de nuevo en unos segundos.');
    } finally {
      setGenerando(false);
    }
  }

  const pend = evErr ? 'no disponible' : 'calculando…';
  const sellado = ev?.sellado;
  const emitido = (ev ? new Date(ev.emitido) : new Date()).toLocaleDateString('es-AR');

  return (
    <div className="informe">
      <div className="informe-actions">
        <span role="status" className="muted" style={{ fontSize: 13 }}>{error ? <span className="informe-err">{error}</span> : copiado}</span>
        <button type="button" className="btn btn-secondary" onClick={compartir}>Compartir link</button>
        <HashTodo variant="secondary" />
        <button type="button" className="btn btn-primary" onClick={descargar} disabled={generando} aria-busy={generando}>
          {generando ? 'Generando PDF…' : 'Descargar PDF'}
        </button>
      </div>

      <article className="informe-doc" aria-labelledby="informe-titulo">
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Logo size={24} color="var(--primary)" />
            <span className="display" style={{ fontWeight: 700 }}>Syntra</span>
          </div>
          <h1 id="informe-titulo" className="page-title">{INFORME_NOMBRE}</h1>
          <span className="muted" style={{ fontSize: 14 }}>Para certificación {cert.label} · con sello de integridad</span>
          <span className="muted" style={{ fontSize: 13 }}>Emitido {emitido} · Campaña 2026/27{ev ? ` · N.º ${ev.id}` : ''}</span>
          <p>Syntra deja constancia de que la evidencia de este informe es el registro fiel e inalterable de lo observado en el establecimiento. Syntra no otorga la certificación: entrega evidencia verificable a la certificadora, que es quien decide. Listo para revisión del perito/auditor de la certificadora.</p>
        </header>

        <Sec n={1} titulo="Establecimiento">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { l: 'Nombre', v: establecimiento.name },
              { l: 'Ubicación', v: `${establecimiento.location}, Argentina` },
              { l: 'Superficie', v: `${totalHa.toLocaleString('es-AR', { maximumFractionDigits: 1 })} ha` },
              { l: 'Lotes', v: String(lotes.length) },
              { l: 'Biodiversidad', v: `${establecimiento.biodiversity}/100` },
            ].map((f) => (
              <div key={f.l} className="informe-box">
                <span className="muted" style={{ fontSize: 12 }}>{f.l}</span>
                <strong style={{ fontSize: 15, overflowWrap: 'anywhere' }}>{f.v}</strong>
              </div>
            ))}
          </div>
        </Sec>

        <Sec n={2} titulo="Estado de cumplimiento">
          <p>Requisitos de {cert.label}, la certificación objetivo.</p>
          <div className="table-wrap">
            <table className="table" style={{ minWidth: 480 }}>
              <thead><tr><th scope="col">Requisito</th><th scope="col">Estado</th><th scope="col">Evidencia</th></tr></thead>
              <tbody>
                {cert.items.map((r) => (
                  <tr key={r.rule}>
                    <th scope="row" style={{ fontSize: 14, color: 'var(--ink)', borderBottomColor: 'var(--line-soft)' }}>{r.rule}</th>
                    <td><Badge tone={r.status}>{reqLabel[r.status]}</Badge></td>
                    <td className="muted">{r.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <strong style={{ fontSize: 14 }}>Plan de corredores</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {corredores.map((c) => (
              <div key={c.id} className="informe-box">
                <strong style={{ fontSize: 14 }}>{c.title}</strong>
                <span className="muted" style={{ fontSize: 13 }}>{fmtHa(c.ha)} ha · {c.closes}</span>
                <Badge tone={c.status === 'Implantado' ? 'ok' : 'warn'}>{c.status}</Badge>
              </div>
            ))}
          </div>
          <p>Biodiversidad del Lote 3: {biodiversidadLote3.actual} hoy → {biodiversidadLote3.proyectado} con el plan completo.</p>
        </Sec>

        <Sec n={3} titulo="Paquete de evidencia">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <QR value={URL_VERIFICACION} size={140} label="Código QR de verificación del informe" />
            <div className="stack" style={{ gap: 4, flex: '1 1 220px', minWidth: 0 }}>
              <strong style={{ fontSize: 14 }}>Escaneá para verificar en línea</strong>
              <span className="muted mono" style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{URL_VERIFICACION}</span>
              <p>{ev ? `${ev.archivos.length} archivos con huella SHA-256 individual.` : 'Reuniendo los archivos de evidencia…'}</p>
            </div>
          </div>
        </Sec>

        <Sec n={4} titulo="Sellado de tiempo">
          <ul className="informe-kv mono" style={{ listStyle: 'none', margin: 0 }}>
            <li><b>Hash del manifiesto:</b> {sellado?.hashManifiesto ?? pend}</li>
            <li><b>Raíz de Merkle:</b> {sellado?.raizMerkle ?? pend}</li>
            <li><b>Transacción:</b> {sellado?.transaccion ?? pend}</li>
            <li><b>Bloque:</b> {sellado?.bloque ?? pend}</li>
            <li><b>Fecha:</b> {sellado ? new Date(sellado.fecha).toLocaleString('es-AR') : pend}</li>
            <li><b>Red:</b> {RED_SELLADO}</li>
          </ul>
          <div className="informe-hashall">
            <p>¿Querés ver cómo se calcula la huella de todo lo que Syntra tiene del establecimiento?</p>
            <HashTodo variant="primary" />
          </div>
        </Sec>

        <Sec n={5} titulo="Cómo verificarlo">
          <ol className="informe-pasos">{PASOS.map((p) => <li key={p}>{p}</li>)}</ol>
        </Sec>

        <Sec n={6} titulo="Mapa">
          <svg viewBox="0 0 400 260" role="img" aria-label="Esquema de los lotes del establecimiento con los corredores" style={{ width: '100%', maxWidth: 520, height: 'auto', borderRadius: 8 }}>
            <rect width="400" height="260" fill="#E9EDE4" />
            <polygon points="40,30 150,22 156,110 50,118" fill="#CFE3D5" stroke="#1b2370" strokeWidth="2" />
            <polygon points="168,26 258,32 255,110 165,112" fill="#CFE3D5" stroke="#1b2370" strokeWidth="2" />
            <polygon points="50,130 160,124 172,220 58,232" fill="#FBE3C3" stroke="#C2620E" strokeWidth="2" />
            <polygon points="182,128 285,120 300,210 186,222" fill="#F3D0CC" stroke="#B42318" strokeWidth="2" strokeDasharray="5 3" />
            <line x1="52" y1="134" x2="160" y2="128" stroke="#D99A00" strokeWidth="5" />
            <line x1="104" y1="130" x2="112" y2="228" stroke="#D99A00" strokeWidth="5" strokeDasharray="6 3" />
            <g fontFamily="Inter, sans-serif" fontSize="12" fontWeight="700" fill="#15211B">
              <text x="78" y="72">L1</text><text x="200" y="74">L2</text><text x="96" y="180">L3</text><text x="228" y="172">L4</text>
            </g>
          </svg>
        </Sec>

        <Sec n={7} titulo="Historial">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {eventos.map((e) => (
              <li key={e.id} style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <strong>{e.title}</strong>
                <span className="muted" style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{e.lote} · {e.date} · {e.source} · <span className="mono" title={e.hash}>{e.hash}</span></span>
              </li>
            ))}
          </ul>
        </Sec>

        <Sec n={8} titulo="Inventario de archivos">
          <div className="table-wrap">
            <table className="table" style={{ minWidth: 520 }}>
              <thead><tr><th scope="col">Archivo</th><th scope="col">Descripción</th><th scope="col">Tamaño</th><th scope="col">SHA-256</th></tr></thead>
              <tbody>
                {ev ? ev.archivos.map((a) => (
                  <tr key={a.archivo}>
                    <th scope="row" className="mono" style={{ fontSize: 12, color: 'var(--ink)', borderBottomColor: 'var(--line-soft)', overflowWrap: 'anywhere' }}>{a.archivo}</th>
                    <td className="muted">{a.descripcion}</td>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>{fmtBytes(a.bytes)}</td>
                    <td className="mono" style={{ fontSize: 12 }} title={a.hash}>{shortHash(a.hash)}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="muted">{pend}</td></tr>}
              </tbody>
            </table>
          </div>
          <p>Fuentes: Copernicus Sentinel-2 L2A, NASA FIRMS, capa OTBN (Ley 26.331), declaraciones del productor. Este documento es un prototipo: Syntra no certifica cumplimiento, solo la integridad de la evidencia.</p>
        </Sec>
      </article>
    </div>
  );
}
