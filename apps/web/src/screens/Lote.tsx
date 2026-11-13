import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, Polygon, Polyline, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge, ProgressBar } from '@synta/ui';
import { biodiversidadLote3 as bio, capas, parchesBosque, certificaciones, corredores, ecorregion, eventos, monitoreos, ndviSerie, reqLabel, seguimientoCorredores } from '@synta/data';
import type { Lote as LoteT, Certificacion as CertT } from '@synta/data';
import { useLote, LOTE_CON_DIAGNOSTICO } from '../store/lotes';

const TABS = [['cum', 'Certificación'], ['bio', 'Biodiversidad y corredores'], ['seg', 'Seguimiento'], ['sat', 'Diagnóstico satelital'], ['traz', 'Trazabilidad']] as const;
type Tab = (typeof TABS)[number][0];

type Kind = 'full' | 'cert' | 'none';
const kindOf = (l: LoteT): Kind => (l.id === LOTE_CON_DIAGNOSTICO ? 'full' : l.status === 'Certificado' ? 'cert' : l.status === 'Sin analizar' ? 'none' : 'full');

export default function Lote() {
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
  return <LoteDetalle lote={lote} />;
}

function SinDiagnostico({ id }: { id: string }) {
  return (
    <div className="card stack" style={{ gap: 12, alignItems: 'flex-start' }}>
      <strong style={{ fontSize: 16 }}>Este lote todavía no tiene diagnóstico</strong>
      <span className="muted" style={{ fontSize: 14, lineHeight: 1.45 }}>Analizalo para ver el avance hacia cada certificación y las mejoras necesarias.</span>
      <Link to={`/procesando/${id}`} className="btn btn-primary">Analizar y certificar</Link>
    </div>
  );
}

function LoteDetalle({ lote }: { lote: LoteT }) {
  const kind = kindOf(lote);
  const demo = kind === 'full' && lote.id !== LOTE_CON_DIAGNOSTICO;
  const [tab, setTab] = useState<Tab>('cum');
  const lat = lote.polygon.reduce((s, p) => s + p[0], 0) / lote.polygon.length;
  const lng = lote.polygon.reduce((s, p) => s + p[1], 0) / lote.polygon.length;
  const fmt = (n: number) => n.toFixed(2).replace('-', '−');

  return (
    <div className="page">
      <Link to="/mapa" style={{ fontSize: 13, fontWeight: 600, textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start' }}>← Mapa y lotes</Link>
      <header className="page-header">
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="page-title">{lote.name}</h1>
          <span className="muted" style={{ fontSize: 14, overflowWrap: 'anywhere' }}>{lote.ha.toLocaleString('es-AR')} ha · {lote.crop} 2026/27 · Centroide {fmt(lat)}, {fmt(lng)}{kind === 'full' && !demo ? ' · Diagnóstico de hoy 14:32' : ''}</span>
          {demo && <span className="muted" style={{ fontSize: 13 }}>Diagnóstico de demostración</span>}
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Link to={`/procesando/${lote.id}`} className="btn btn-secondary">Re-analizar</Link>
          <Link to="/informe" className="btn btn-primary">Generar informe</Link>
        </div>
      </header>

      <div role="tablist" aria-label="Secciones del lote" className="tabs">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" id={`tab-${id}`} aria-controls="lote-panel" aria-selected={tab === id} className="tab" onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <section role="tabpanel" id="lote-panel" aria-labelledby={`tab-${tab}`}>
        {tab === 'cum' && (kind === 'none' ? <SinDiagnostico id={lote.id} /> : <Certificacion kind={kind} onBio={() => setTab('bio')} />)}
        {tab === 'bio' && (kind === 'none' ? <SinDiagnostico id={lote.id} /> : <Biodiversidad lote={lote} kind={kind} />)}
        {tab === 'seg' && (kind === 'none' ? <SinDiagnostico id={lote.id} /> : <Seguimiento kind={kind} />)}
        {tab === 'sat' && <Satelital />}
        {tab === 'traz' && <Trazabilidad short={lote.name.split(' — ')[0]} />}
      </section>
    </div>
  );
}

function Certificacion({ kind, onBio }: { kind: Kind; onBio: () => void }) {
  const [certId, setCertId] = useState('fsa');
  const base = certificaciones.find((c) => c.id === certId)!;
  const evid = ['polígono firmado', 'cambio de cobertura 2020–2026: 0 ha', 'registros firmados en la trazabilidad'];
  const cert: CertT = kind === 'cert'
    ? { ...base, items: base.items.map((it, i) => ({ rule: it.rule, evidence: evid[i % evid.length], status: 'ok' as const })) }
    : base;
  const ok = cert.items.filter((i) => i.status === 'ok').length;
  const total = cert.items.length;
  const malas = cert.items.filter((i) => i.status === 'bad').length;
  const faltan = cert.items.filter((i) => i.status === 'warn').length;
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card stack">
        <span id="certlbl" style={{ fontSize: 13, fontWeight: 600 }}>¿Qué certificación buscás?</span>
        <div role="group" aria-labelledby="certlbl" className="row" style={{ gap: 8 }}>
          {certificaciones.map((c) => (
            <button key={c.id} type="button" className="chip" style={{ minHeight: 44, fontSize: 14 }} aria-pressed={c.id === certId} onClick={() => setCertId(c.id)}>{c.label}</button>
          ))}
        </div>
        <span className="muted" style={{ fontSize: 13 }}>{cert.desc}</span>
      </div>
      <div className="row" style={{ alignItems: 'stretch' }}>
        <div className="card-dark stack" style={{ flex: '1 1 240px' }}>
          <span style={{ fontSize: 13, color: 'var(--dark-muted)' }}>Avance hacia {cert.label}</span>
          <span className="display" style={{ fontSize: 48, lineHeight: 1 }}>{ok}/{total}</span>
          <span style={{ fontSize: 14, color: '#c9cff5' }}>requisitos cumplidos · {malas} {malas === 1 ? 'mejora necesaria' : 'mejoras necesarias'}{faltan > 0 && ` · ${faltan} ${faltan === 1 ? 'dato faltante' : 'datos faltantes'}`}</span>
          <ProgressBar value={Math.round((ok / total) * 100)} label={`Avance hacia ${cert.label}`} />
          {malas > 0 && (
            <button type="button" className="btn btn-accent" style={{ marginTop: 8 }} onClick={onBio}>Ver corredores recomendados</button>
          )}
        </div>
        <ul className="card" style={{ flex: '3 1 480px', minWidth: 0, padding: '8px clamp(14px, 4vw, 20px)', margin: 0, listStyle: 'none' }}>
          {cert.items.map((it) => (
            <li key={it.rule} className="row" style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid var(--line-soft)' }}>
              <div className="stack" style={{ flex: '1 1 220px', minWidth: 0, gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{it.rule}</span>
                <span className="muted" style={{ fontSize: 13 }}>Evidencia: {it.evidence}</span>
                {it.fix && <span style={{ fontSize: 13, color: 'var(--warn-fg)', fontWeight: 500 }}>Para cerrarlo: {it.fix}</span>}
              </div>
              <Badge tone={it.status}>{reqLabel[it.status]}</Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const swatch = (bg: string) => <span aria-hidden="true" style={{ width: 18, height: 8, background: bg, display: 'inline-block' }} />;

// Corridor/biodiversity data only exists for Lote 3; analyzed drawn lots reuse it as a demo template.
function Biodiversidad({ lote, kind }: { lote: LoteT; kind: Kind }) {
  const conLineas = lote.id === LOTE_CON_DIAGNOSTICO;
  if (kind === 'cert') {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <div className="card stack" style={{ gap: 14 }}>
          <div className="row" style={{ alignItems: 'baseline', gap: 12 }}>
            <span className="display" style={{ fontSize: 'clamp(36px, 10vw, 48px)', lineHeight: 1, color: 'var(--primary)' }}>{lote.bio}</span>
            <span className="muted" style={{ fontSize: 13 }}>índice de biodiversidad del lote</span>
          </div>
          <ProgressBar value={lote.bio} label={`Índice de biodiversidad de ${lote.name}: ${lote.bio}`} />
        </div>
        <div style={{ background: 'var(--primary-soft)', color: 'var(--primary-ink)', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <strong style={{ fontSize: 15 }}>No requiere corredores adicionales</strong>
          <span style={{ fontSize: 13, lineHeight: 1.45 }}>Seguí con el monitoreo de campo.</span>
        </div>
      </div>
    );
  }
  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <figure className="card" style={{ flex: '3 1 480px', minWidth: 0, margin: 0, padding: 0, overflow: 'hidden' }}>
        <div role="img" aria-label={conLineas ? `${lote.name} con ${corredores.length} corredores biológicos sugeridos que lo conectan con los parches de bosque` : `${lote.name}; los corredores sugeridos están en el informe`}>
          <MapContainer key={lote.id} bounds={conLineas ? [...lote.polygon, ...parchesBosque.flatMap((b) => b.polygon)] : lote.polygon} scrollWheelZoom={false} className="lote-map">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles © Esri" />
            {conLineas && parchesBosque.map((b) => <Polygon key={b.id} positions={b.polygon} pathOptions={{ color: '#2e4a26', fillColor: '#2e4a26', fillOpacity: 0.7 }} />)}
            <Polygon positions={lote.polygon} pathOptions={{ color: '#fff', weight: 2, fillOpacity: 0.05 }} />
            {conLineas && corredores.map((c) => (
              <Polyline key={c.id} positions={c.line} pathOptions={{ color: '#FFD166', weight: 10, opacity: 0.9 }}>
                <Tooltip permanent direction="center">{c.id}</Tooltip>
              </Polyline>
            ))}
          </MapContainer>
        </div>
        <figcaption className="row" style={{ padding: '12px 16px', fontSize: 13, alignItems: 'center' }}>
          {conLineas ? (
            <>
              <span className="row" style={{ gap: 8, alignItems: 'center' }}>{swatch('var(--corridor)')}Corredor sugerido</span>
              <span className="row" style={{ gap: 8, alignItems: 'center' }}>{swatch('#2e4a26')}Parches de bosque</span>
              <span className="muted">Total 4,2 ha · 4,9% del lote</span>
            </>
          ) : (
            <span className="muted">Corredores sugeridos en el informe</span>
          )}
        </figcaption>
      </figure>
      <div className="stack" style={{ flex: '2 1 320px', minWidth: 0, gap: 16 }}>
        <div className="card stack" style={{ gap: 14 }}>
          <div className="row" style={{ alignItems: 'baseline', gap: 12 }}>
            <span className="display" style={{ fontSize: 'clamp(36px, 10vw, 48px)', lineHeight: 1 }}>{bio.actual}</span>
            <span className="muted" style={{ fontSize: 20 }} aria-hidden="true">→</span>
            <span className="display" style={{ fontSize: 'clamp(36px, 10vw, 48px)', lineHeight: 1, color: 'var(--primary)' }}>{bio.proyectado}</span>
            <span className="muted" style={{ fontSize: 13 }}>índice de biodiversidad actual → con corredores</span>
          </div>
          {bio.breakdown.map((b) => (
            <div key={b.label} className="stack" style={{ gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span>{b.label}</span><strong>{b.from} → {b.to}</strong></div>
              <ProgressBar value={b.to} label={`${b.label}: de ${b.from} a ${b.to}`} />
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--primary-soft)', color: 'var(--primary-ink)', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <strong style={{ fontSize: 15 }}>{bio.rinde.metrica[0].toUpperCase() + bio.rinde.metrica.slice(1)} de {bio.rinde.cultivo} +{bio.rinde.pct}%*</strong>
          <span style={{ fontSize: 13, lineHeight: 1.45 }}>*Con polinizadores; el beneficio crece con el bosque cercano y cae con la distancia al borde.</span>
          <span style={{ fontSize: 12, lineHeight: 1.45 }}>Fuentes: {bio.rinde.fuente} (doi 10.1007/s10457-026-01430-w); Amarilla et al. 2025, Field Crops Research 109736 (girasol sin polinizadores: −30,4% de rendimiento).</span>
        </div>
      </div>
      <MonitoreoCampo />
      <div style={{ flex: '1 1 100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
        {corredores.map((c) => (
          <div key={c.id} className="card stack" style={{ gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <strong style={{ fontSize: 15 }}>{c.title}</strong>
              <span className="mono" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>+{c.impact}</span>
            </div>
            <span className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{c.body} ({c.ha.toLocaleString('es-AR')} ha)</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-ink)' }}>{c.closes}</span>
            <span><Badge tone={c.status === 'Implantado' ? 'ok' : 'warn'}>{c.status}</Badge></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonitoreoCampo() {
  const fecha = monitoreos[monitoreos.length - 1].fecha;
  const ult = monitoreos.filter((m) => m.fecha === fecha);
  const borde = ult.find((m) => m.sitio.startsWith('Borde'))!;
  const centro = ult.find((m) => m.sitio.startsWith('Centro'))!;
  const filas = [
    { k: 'Polinizadores', b: borde.polinizadores, c: centro.polinizadores },
    { k: 'Enemigos naturales', b: borde.enemigosNaturales, c: centro.enemigosNaturales },
    { k: 'Riqueza de especies', b: borde.riqueza, c: centro.riqueza },
  ];
  const veces = Math.round(borde.polinizadores / centro.polinizadores);
  return (
    <div style={{ flex: '1 1 100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 16 }}>
      <section className="card stack" style={{ gap: 14 }} aria-labelledby="monit-t">
        <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
          <strong id="monit-t" style={{ fontSize: 15 }}>Monitoreo de campo</strong>
          <span className="muted" style={{ fontSize: 13 }}>{fecha} · Fuente: Técnico de campo</span>
        </div>
        <strong style={{ fontSize: 15, color: 'var(--primary-ink)' }}>{veces}x más polinizadores en el borde con el parche de bosque que en el centro del lote</strong>
        {filas.map((f) => (
          <div key={f.k} className="stack" style={{ gap: 6 }} role="group" aria-label={`${f.k}: ${f.b} en el borde con el parche de bosque, ${f.c} en el centro del lote`}>
            <span style={{ fontSize: 14, fontWeight: 600 }} aria-hidden="true">{f.k}</span>
            {([['Borde con parche de bosque', f.b, 'var(--primary)'], ['Centro del lote', f.c, '#9AA69E']] as const).map(([l, v, col]) => (
              <div key={l} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 140px) 1fr 28px', gap: 8, alignItems: 'center', fontSize: 13 }} aria-hidden="true">
                <span className="muted">{l}</span>
                <span style={{ background: 'var(--line-soft)', borderRadius: 4, height: 10, display: 'block' }}><span style={{ display: 'block', height: 10, borderRadius: 4, background: col, width: `${Math.round((v / Math.max(f.b, f.c)) * 100)}%` }} /></span>
                <strong style={{ textAlign: 'right' }}>{v}</strong>
              </div>
            ))}
          </div>
        ))}
        <span className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>Es la evidencia de campo de que la biodiversidad es funcional: los polinizadores y enemigos naturales usan el borde. Se suma al dato satelital para sostener la certificación.</span>
      </section>
      <section className="card stack" style={{ gap: 10 }} aria-labelledby="eco-t">
        <strong id="eco-t" style={{ fontSize: 15 }}>Ecorregión: {ecorregion.nombre}</strong>
        <span className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>Los corredores usan especies nativas de esta ecorregión:</span>
        <ul className="row" style={{ gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
          {ecorregion.especies.map((e) => (
            <li key={e.cientifico} title={e.cientifico} style={{ border: '1px solid var(--input)', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, background: 'var(--surface)' }}>{e.nombre}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Seguimiento({ kind }: { kind: Kind }) {
  const ref = seguimientoCorredores.find((s) => s.id === 'ref')!;
  const a = seguimientoCorredores.find((s) => s.id === 'A')!;
  const s = ref.serie;
  const ult = s[s.length - 1];
  const y0 = s[0].anio;
  const y1 = ult.anio;
  const x = (anio: number) => 50 + ((anio - y0) / (y1 - y0)) * 730;
  const y = (v: number) => 180 - ((v - 0.1) / 0.8) * 160;
  const pts = s.map((p) => `${x(p.anio).toFixed(0)},${y(p.ndvi).toFixed(0)}`).join(' ');
  const anios = y1 - y0;
  const tile = { background: 'var(--primary-soft)', color: 'var(--primary-ink)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 } as const;
  const pasos = ['Satélite cada 5 días', 'Monitoreo de campo en primavera 2027', 'Primera medición de autosiembra 2028'];
  return (
    <div className="stack" style={{ gap: 16 }}>
      <section className="card stack" style={{ gap: 14 }} aria-labelledby="ref-t">
        <div className="stack" style={{ gap: 4 }}>
          <strong id="ref-t" style={{ fontSize: 16 }}>{ref.titulo}</strong>
          <span className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{ref.nota}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 12 }}>
          <div style={tile}><span className="display" style={{ fontSize: 30, lineHeight: 1.1 }}>{ult.supervivencia}%</span><span style={{ fontSize: 13 }}>supervivencia actual</span></div>
          <div style={tile}><span className="display" style={{ fontSize: 30, lineHeight: 1.1 }}>{ult.renuevos.toLocaleString('es-AR')}</span><span style={{ fontSize: 13 }}>renuevos por ha (autosiembra, último año)</span></div>
          <div style={tile}><span className="display" style={{ fontSize: 30, lineHeight: 1.1 }}>{anios} años</span><span style={{ fontSize: 13 }}>desde la implantación ({ref.implantado})</span></div>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>En {anios} años nunca hizo falta replantar: el corredor se renueva solo. Eso es biodiversidad perdurable.</p>
        <figure style={{ margin: 0 }} className="stack">
          <figcaption style={{ fontSize: 13, fontWeight: 600 }}>NDVI del corredor de referencia, {y0}–{y1}</figcaption>
          <svg viewBox="0 0 800 220" role="img" aria-label={`NDVI del corredor de referencia entre ${y0} y ${y1}: sube de ${s[0].ndvi.toLocaleString('es-AR')} a ${ult.ndvi.toLocaleString('es-AR')} y se estabiliza`} style={{ width: '100%', height: 'auto' }}>
            <g fontFamily="Inter, sans-serif" fontSize="12" fill="#55615A">
              <line x1="50" y1={y(0.9)} x2="790" y2={y(0.9)} stroke="#EEF1EC" /><text x="0" y={y(0.9) + 4}>0,9</text>
              <line x1="50" y1={y(0.5)} x2="790" y2={y(0.5)} stroke="#EEF1EC" /><text x="0" y={y(0.5) + 4}>0,5</text>
              <line x1="50" y1={y(0.1)} x2="790" y2={y(0.1)} stroke="#DDE2DA" /><text x="0" y={y(0.1) + 4}>0,1</text>
              {s.map((p) => <text key={p.anio} x={x(p.anio)} y="205" textAnchor="middle">{p.anio}</text>)}
            </g>
            <polyline points={pts} fill="none" stroke="#1b2370" strokeWidth="2.5" strokeLinejoin="round" />
            {s.map((p) => <circle key={p.anio} cx={x(p.anio)} cy={y(p.ndvi)} r="4" fill="#1b2370" />)}
          </svg>
        </figure>
      </section>
      {kind === 'full' && <section className="card stack" style={{ gap: 12 }} aria-labelledby="a-t">
        <div className="row" style={{ justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
          <strong id="a-t" style={{ fontSize: 16 }}>{a.titulo}</strong>
          <Badge tone="warn">Recién implantado</Badge>
        </div>
        <span className="muted" style={{ fontSize: 13 }}>Implantado el {a.implantado}</span>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pasos.map((p, i) => (
            <li key={p} className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'nowrap', fontSize: 14 }}>
              <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flex: '0 0 auto' }}>{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>Lo vamos a seguir de la misma forma que el corredor de referencia, para demostrar que perdura.</p>
        <Link to="/accion?tipo=monitoreo" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>Registrar monitoreo</Link>
      </section>}
    </div>
  );
}

function SatImg({ label, bg, field, stroke, sw }: { label: string; bg: string; field: string; stroke: string; sw: number }) {
  return (
    <svg viewBox="0 0 400 240" role="img" aria-label={label} style={{ display: 'block', width: '100%', height: 'auto' }}>
      <rect width="400" height="240" fill={bg} />
      <polygon points="40,30 300,20 330,210 60,225" fill={field} stroke={stroke} strokeWidth={sw} />
      <polygon points="300,20 400,10 400,240 330,210" fill="#2E4A26" />
    </svg>
  );
}

function Satelital() {
  const pts = ndviSerie.map((v, i) => `${(40 + (i * 750) / (ndviSerie.length - 1)).toFixed(0)},${(180 - (v - 0.1) * 200).toFixed(0)}`).join(' ');
  const max = Math.max(...ndviSerie).toLocaleString('es-AR');
  const figcap = { padding: '12px 16px', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 8 } as const;
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 16 }}>
        <figure className="card" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
          <SatImg label="Imagen satelital del lote en diciembre 2020" bg="#4C6B3A" field="#8FA95C" stroke="#FFFFFF" sw={2} />
          <figcaption style={figcap}><strong>Dic 2020 (línea base EUDR)</strong><span className="muted">Sentinel-2 L2A</span></figcaption>
        </figure>
        <figure className="card" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
          <SatImg label="Imagen satelital del lote en noviembre 2026, sin pérdida de parches de bosque" bg="#55703B" field="#A9B866" stroke="#FFD166" sw={3} />
          <figcaption style={figcap}><strong>Nov 2026</strong><span className="muted">0 ha de pérdida de cobertura</span></figcaption>
        </figure>
      </div>
      <figure className="card stack" style={{ margin: 0 }}>
        <figcaption className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
          <strong style={{ fontSize: 15 }}>NDVI medio del lote (línea de base)</strong>
          <span className="muted" style={{ fontSize: 13 }}>2024 → 2026 · cada punto es una escena firmada</span>
        </figcaption>
        <svg viewBox="0 0 800 220" role="img" aria-label={`Serie temporal de NDVI 2024–2026 con dos ciclos de cultivo, máximo ${max}`} style={{ width: '100%', height: 'auto' }}>
          <g fontFamily="Inter, sans-serif" fontSize="12" fill="#55615A">
            <line x1="40" y1="20" x2="790" y2="20" stroke="#EEF1EC" /><text x="0" y="24">0,9</text>
            <line x1="40" y1="100" x2="790" y2="100" stroke="#EEF1EC" /><text x="0" y="104">0,5</text>
            <line x1="40" y1="180" x2="790" y2="180" stroke="#DDE2DA" /><text x="0" y="184">0,1</text>
            <text x="40" y="205">2024</text><text x="400" y="205">2025</text><text x="750" y="205">2026</text>
          </g>
          <polyline points={pts} fill="none" stroke="#1b2370" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      </figure>
    </div>
  );
}

function Trazabilidad({ short }: { short: string }) {
  const regs = eventos.filter((e) => e.lote === short);
  return (
    <div className="card" style={{ padding: '8px clamp(14px, 4vw, 20px)' }}>
      {regs.length === 0 ? (
        <p className="muted">Todavía no hay registros firmados para este lote.</p>
      ) : (
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 640 }}>
            <thead><tr><th scope="col">Fecha</th><th scope="col">Registro</th><th scope="col">Fuente</th><th scope="col">Hash</th></tr></thead>
            <tbody>
              {regs.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.date}</td>
                  <td>{r.title}</td>
                  <td className="muted">{r.source}</td>
                  <td className="mono">{r.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link to="/trazabilidad" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontSize: 14, fontWeight: 600 }}>Abrir explorador de trazabilidad →</Link>
    </div>
  );
}
