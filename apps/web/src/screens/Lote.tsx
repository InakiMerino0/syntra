import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, Polygon, Polyline, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge, ProgressBar } from '@synta/ui';
import { biodiversidadLote3 as bio, capas, certificaciones, corredores, eventos, lotes, ndviSerie, reqLabel } from '@synta/data';
import type { Lote as LoteT } from '@synta/data';

const TABS = [['cum', 'Certificación'], ['bio', 'Biodiversidad y corredores'], ['sat', 'Diagnóstico satelital'], ['traz', 'Trazabilidad']] as const;
type Tab = (typeof TABS)[number][0];

export default function Lote() {
  const { loteId } = useParams();
  const lote = lotes.find((l) => l.id === loteId) ?? lotes.find((l) => l.id === 'l3')!;
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
          <span className="muted" style={{ fontSize: 14 }}>{lote.ha} ha · {lote.crop} 2026/27 · Centroide {fmt(lat)}, {fmt(lng)} · Diagnóstico de hoy 14:32</span>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Link to={`/procesando/${lote.id}`} className="btn btn-secondary">Re-analizar</Link>
          <Link to="/pasaporte" className="btn btn-primary">Generar pasaporte</Link>
        </div>
      </header>

      <div role="tablist" aria-label="Secciones del lote" className="tabs">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" id={`tab-${id}`} aria-controls="lote-panel" aria-selected={tab === id} className="tab" onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <section role="tabpanel" id="lote-panel" aria-labelledby={`tab-${tab}`}>
        {tab === 'cum' && <Certificacion onBio={() => setTab('bio')} />}
        {tab === 'bio' && <Biodiversidad lote={lote} />}
        {tab === 'sat' && <Satelital />}
        {tab === 'traz' && <Trazabilidad short={lote.name.split(' — ')[0]} />}
      </section>
    </div>
  );
}

function Certificacion({ onBio }: { onBio: () => void }) {
  const [certId, setCertId] = useState('rtrs');
  const cert = certificaciones.find((c) => c.id === certId)!;
  const ok = cert.items.filter((i) => i.status === 'ok').length;
  const total = cert.items.length;
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
          <span style={{ fontSize: 14, color: '#c3d2c8' }}>requisitos cumplidos · {total - ok} brechas</span>
          <ProgressBar value={Math.round((ok / total) * 100)} label={`Avance hacia ${cert.label}`} />
          {cert.items.some((i) => i.status === 'bad') && (
            <button type="button" className="btn btn-accent" style={{ marginTop: 8 }} onClick={onBio}>Ver corredores recomendados</button>
          )}
        </div>
        <ul className="card" style={{ flex: '3 1 480px', minWidth: 0, padding: '8px 20px', margin: 0, listStyle: 'none' }}>
          {cert.items.map((it) => (
            <li key={it.rule} className="row" style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid var(--line-soft)' }}>
              <div className="stack" style={{ flex: '1 1 320px', gap: 4 }}>
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

// shortcut: corridor/biodiversity data only exists for Lote 3; every lot shows it (prototype).
function Biodiversidad({ lote }: { lote: LoteT }) {
  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <figure className="card" style={{ flex: '3 1 480px', minWidth: 0, margin: 0, padding: 0, overflow: 'hidden' }}>
        <div role="img" aria-label={`${lote.name} con ${corredores.length} corredores biológicos sugeridos que lo conectan con el monte nativo al este`}>
          <MapContainer bounds={[...lote.polygon, ...capas.bosqueNativo]} scrollWheelZoom={false} style={{ height: 360 }}>
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles © Esri" />
            <Polygon positions={capas.bosqueNativo} pathOptions={{ color: '#2e4a26', fillColor: '#2e4a26', fillOpacity: 0.7 }} />
            <Polygon positions={lote.polygon} pathOptions={{ color: '#fff', weight: 2, fillOpacity: 0.05 }} />
            {corredores.map((c) => (
              <Polyline key={c.id} positions={c.line} pathOptions={{ color: '#FFD166', weight: 10, opacity: 0.9 }}>
                <Tooltip permanent direction="center">{c.id}</Tooltip>
              </Polyline>
            ))}
          </MapContainer>
        </div>
        <figcaption className="row" style={{ padding: '12px 16px', fontSize: 13, alignItems: 'center' }}>
          <span className="row" style={{ gap: 8, alignItems: 'center' }}>{swatch('var(--corridor)')}Corredor sugerido</span>
          <span className="row" style={{ gap: 8, alignItems: 'center' }}>{swatch('#2e4a26')}Monte nativo existente</span>
          <span className="muted">Total 4,2 ha · 4,9% del lote</span>
        </figcaption>
      </figure>
      <div className="stack" style={{ flex: '2 1 320px', minWidth: 0, gap: 16 }}>
        <div className="card stack" style={{ gap: 14 }}>
          <div className="row" style={{ alignItems: 'baseline', gap: 12 }}>
            <span className="display" style={{ fontSize: 48, lineHeight: 1 }}>{bio.actual}</span>
            <span className="muted" style={{ fontSize: 20 }} aria-hidden="true">→</span>
            <span className="display" style={{ fontSize: 48, lineHeight: 1, color: 'var(--primary)' }}>{bio.proyectado}</span>
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
          <strong style={{ fontSize: 15 }}>Rinde estimado en {bio.rinde.cultivo}: +{bio.rinde.pct}%</strong>
          <span style={{ fontSize: 13, lineHeight: 1.45 }}>Fuente: {bio.rinde.fuente}.</span>
        </div>
      </div>
      <div style={{ flex: '1 1 100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
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
          <SatImg label="Imagen satelital del lote en noviembre 2026, sin pérdida de monte lindero" bg="#55703B" field="#A9B866" stroke="#FFD166" sw={3} />
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
          <polyline points={pts} fill="none" stroke="#1D6A47" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      </figure>
    </div>
  );
}

function Trazabilidad({ short }: { short: string }) {
  const regs = eventos.filter((e) => e.lote === short);
  return (
    <div className="card" style={{ padding: '8px 20px' }}>
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
