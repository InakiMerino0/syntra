import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ecorregion, establecimiento, lotes as lotesIniciales, capas, type Lote, type LatLng } from '@synta/data';

// Spherical excess approximation (Chamberlain & Duquette) — good enough for field-sized polygons.
export function areaHa(poly: LatLng[]): number {
  const R = 6378137, rad = Math.PI / 180;
  let s = 0;
  poly.forEach(([lat1, lng1], i) => {
    const [lat2, lng2] = poly[(i + 1) % poly.length];
    s += (lng2 - lng1) * rad * (2 + Math.sin(lat1 * rad) + Math.sin(lat2 * rad));
  });
  return Math.round(Math.abs((s * R * R) / 2) / 1000) / 10;
}
// Self-check: Lote 1 in the mock data is declared as 96 ha.
if (import.meta.env.DEV) console.assert(Math.abs(areaHa(lotesIniciales[0].polygon) - 96) < 1, 'areaHa: Lote 1 debería medir ~96 ha');

const ndviColor = (bio: number) => (bio >= 70 ? '#1A9850' : bio >= 66 ? '#66BD63' : bio >= 60 ? '#D9EF8B' : '#FDAE61');
const fmtHa = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });

/** Touch-friendly handles: big visible dot + invisible 44px hit area (see .vtx in styles.css). */
const vtxIcon = (kind: 'vtx' | 'first' | 'sel' | 'mid') =>
  L.divIcon({ className: `vtx vtx-${kind}`, html: kind === 'mid' ? '<span>+</span>' : '<span></span>', iconSize: [44, 44], iconAnchor: [22, 22] });
const ICONS = { vtx: vtxIcon('vtx'), first: vtxIcon('first'), sel: vtxIcon('sel'), mid: vtxIcon('mid') };

type Modo = 'view' | 'draw' | 'edit';

/** Map side-effects: fly to the selection, add vertices on tap while drawing, toggle double-click zoom. */
function MapEffects({ selected, modo, onTap }: { selected?: Lote; modo: Modo; onTap: (p: LatLng) => void }) {
  const map = useMap();
  useEffect(() => {
    if (selected && modo === 'view') map.flyToBounds(L.latLngBounds(selected.polygon), { maxZoom: 15, duration: 0.8 });
  }, [map, selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (modo === 'view') map.doubleClickZoom.enable(); else map.doubleClickZoom.disable();
    if (modo !== 'view') map.getContainer().closest('.mapa-map')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    // Keep the lot clear of the floating controls (top) and the edit bar (bottom).
    if (modo === 'edit' && selected) map.flyToBounds(L.latLngBounds(selected.polygon), { paddingTopLeft: [24, 72], paddingBottomRight: [24, 190], maxZoom: 16, duration: 0.6 });
  }, [map, modo]); // eslint-disable-line react-hooks/exhaustive-deps
  useMapEvents({ click: (e) => { if (modo === 'draw') onTap([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

/** Draggable vertices (+ midpoints to insert new ones while editing). */
function Vertices({ pts, modo, selIdx, onMove, onSelect, onInsert, onCloseShape }: {
  pts: LatLng[]; modo: Modo; selIdx: number | null;
  onMove: (i: number, p: LatLng) => void; onSelect: (i: number) => void; onInsert: (i: number, p: LatLng) => void; onCloseShape: () => void;
}) {
  const mids = modo === 'edit' && pts.length >= 3
    ? pts.map((p, i) => { const q = pts[(i + 1) % pts.length]; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as LatLng; })
    : [];
  return (
    <>
      {mids.map((m, i) => (
        <Marker key={`m${i}-${m[0]}-${m[1]}`} position={m} icon={ICONS.mid} draggable title="Agregar punto"
          eventHandlers={{
            click: () => onInsert(i + 1, m),
            dragend: (e) => { const ll = (e.target as L.Marker).getLatLng(); onInsert(i + 1, [ll.lat, ll.lng]); },
          }} />
      ))}
      {pts.map((p, i) => (
        <Marker key={`v${i}`} position={p} draggable title={`Punto ${i + 1}`}
          icon={modo === 'draw' && i === 0 && pts.length >= 3 ? ICONS.first : selIdx === i ? ICONS.sel : ICONS.vtx}
          eventHandlers={{
            drag: (e) => { const ll = (e.target as L.Marker).getLatLng(); onMove(i, [ll.lat, ll.lng]); },
            click: () => (modo === 'draw' && i === 0 && pts.length >= 3 ? onCloseShape() : onSelect(i)),
          }} />
      ))}
    </>
  );
}

const floating: CSSProperties = { position: 'absolute', zIndex: 1000, background: 'var(--surface)', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' };

export default function Mapa() {
  const [lotes, setLotes] = useState<Lote[]>(lotesIniciales);
  const [selId, setSelId] = useState(lotesIniciales[2].id);
  const [nombre, setNombre] = useState(`Lote ${lotesIniciales.length + 1} — Potrero Este`);
  const [capa, setCapa] = useState({ ndvi: false, bosque: true, focos: true });
  const [modo, setModo] = useState<Modo>('view');
  const [draft, setDraft] = useState<LatLng[]>([]);
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [naming, setNaming] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [capasOpen, setCapasOpen] = useState(false);
  const sel = lotes.find((l) => l.id === selId);
  const totalHa = Math.round(lotes.reduce((s, l) => s + l.ha, 0));
  const draftHa = draft.length >= 3 ? areaHa(draft) : 0;

  const startDraw = () => { setDraft([]); setSelIdx(null); setNaming(false); setConfirmDel(false); setModo('draw'); };
  const startEdit = () => { if (!sel) return; setDraft(sel.polygon); setSelIdx(null); setConfirmDel(false); setModo('edit'); };
  const cancel = () => { setModo('view'); setDraft([]); setSelIdx(null); setNaming(false); };
  const undo = () => setDraft((d) => d.slice(0, -1));
  const movePt = (i: number, p: LatLng) => setDraft((d) => d.map((q, j) => (j === i ? p : q)));
  const insertPt = (i: number, p: LatLng) => { setDraft((d) => [...d.slice(0, i), p, ...d.slice(i)]); setSelIdx(i); };
  const deletePt = () => { if (selIdx === null || draft.length <= 3) return; setDraft((d) => d.filter((_, j) => j !== selIdx)); setSelIdx(null); };

  const saveNew = () => {
    if (draft.length < 3) return;
    const id = `n${Date.now()}`;
    const name = nombre.trim() || `Lote ${lotes.length + 1}`;
    setLotes((ls) => [...ls, { id, name, crop: 'Sin definir', ha: areaHa(draft), bio: 50, status: 'Sin analizar', tone: 'bad', note: 'Lote nuevo dibujado en el mapa. Analizalo para ver sus brechas de certificación.', polygon: draft }]);
    setSelId(id);
    setNombre(`Lote ${lotes.length + 2}`);
    cancel();
  };
  const saveEdit = () => {
    setLotes((ls) => ls.map((l) => (l.id === selId ? { ...l, polygon: draft, ha: areaHa(draft) } : l)));
    cancel();
  };
  const removeLote = () => {
    const rest = lotes.filter((l) => l.id !== selId);
    setLotes(rest);
    setSelId(rest[0]?.id ?? '');
    setConfirmDel(false);
  };

  useEffect(() => {
    if (modo === 'view') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modo]);

  const capasUI = [
    { key: 'ndvi', label: 'NDVI (vigor vegetal)', color: '#1A9850' },
    { key: 'bosque', label: 'Bosque nativo protegido', color: '#B8860B' },
    { key: 'focos', label: 'Focos de calor (FIRMS)', color: '#EA580C' },
  ] as const;

  return (
    <div className="mapa screen-fill">
      <header className="mapa-head">
        <h1 className="display" style={{ fontSize: 24 }}>Mapa y lotes</h1>
        <span className="muted" style={{ fontSize: 13 }}>La Esperanza · Ecorregión {ecorregion.nombre} · {totalHa} ha mapeadas</span>
      </header>
      <aside aria-label="Lotes" className="mapa-list">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lotes.map((l) => {
            const on = l.id === selId;
            return (
              <button key={l.id} type="button" aria-pressed={on} onClick={() => setSelId(l.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, width: '100%', minHeight: 56, padding: 12, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: 'var(--ink)', background: on ? 'var(--primary-soft)' : 'var(--surface)', border: on ? '2px solid var(--primary)' : '1px solid var(--line)' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{l.name}</span>
                  <span className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{l.ha} ha</span>
                </span>
                <span className="muted" style={{ fontSize: 12 }}>{l.crop} · {l.status}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className="btn btn-primary" onClick={startDraw} disabled={modo !== 'view'}>+ Dibujar nuevo lote</button>
      </aside>

      <section aria-label="Mapa satelital" className="mapa-map">
        <MapContainer center={establecimiento.center} zoom={14} style={{ position: 'absolute', inset: 0 }} className={modo === 'draw' ? 'mapa-drawing' : undefined}>
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles © Esri" />
          {capa.bosque && (
            <Polygon positions={capas.bosqueNativo} pathOptions={{ color: '#FFD166', weight: 2, dashArray: '6 4', fillColor: '#FFD166', fillOpacity: 0.3 }} interactive={false}>
              <Tooltip permanent direction="center">Bosque nativo · Cat. II</Tooltip>
            </Polygon>
          )}
          {capa.focos && capas.focosCalor.map((p, i) => (
            <CircleMarker key={i} center={p} radius={8} interactive={modo === 'view'} pathOptions={{ color: '#fff', weight: 2, fillColor: '#F97316', fillOpacity: 1 }}>
              <Tooltip>Foco de calor (NASA FIRMS)</Tooltip>
            </CircleMarker>
          ))}
          {lotes.map((l) => {
            const on = l.id === selId;
            if (modo === 'edit' && on) return null; // the draft replaces it while editing
            return (
              <Polygon
                key={`${l.id}-${modo}`}
                positions={l.polygon}
                interactive={modo === 'view'}
                pathOptions={{ color: on ? '#FFD166' : '#fff' /* = var(--corridor); SVG attributes can't read CSS vars */, weight: on ? 4 : 2, fillColor: capa.ndvi ? ndviColor(l.bio) : '#fff', fillOpacity: capa.ndvi ? 0.6 : 0.05, opacity: modo === 'view' ? 1 : 0.6 }}
                eventHandlers={{ click: () => setSelId(l.id) }}
              >
                {modo === 'view' && <Tooltip permanent direction="center">{l.name.split(' — ')[0]}</Tooltip>}
              </Polygon>
            );
          })}
          {modo !== 'view' && draft.length >= 3 && (
            <Polygon positions={draft} interactive={false} pathOptions={{ color: '#FFD166', weight: 3, fillColor: '#FFD166', fillOpacity: 0.25 }} />
          )}
          {modo === 'draw' && draft.length === 2 && (
            <Polyline positions={draft} interactive={false} pathOptions={{ color: '#FFD166', weight: 3 }} />
          )}
          {modo !== 'view' && (
            <Vertices pts={draft} modo={modo} selIdx={selIdx} onMove={movePt} onSelect={setSelIdx} onInsert={insertPt} onCloseShape={() => setNaming(true)} />
          )}
          <MapEffects selected={sel} modo={modo} onTap={(p) => { setDraft((d) => [...d, p]); setNaming(false); }} />
        </MapContainer>

        {modo === 'view' && (
          <button type="button" className="btn btn-primary mapa-tools" style={{ position: 'absolute', zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.25)' }} onClick={startDraw}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M5 19 L4 7 L13 4 L20 12 L14 20 Z" /></svg>
            Dibujar lote
          </button>
        )}

        <button type="button" className="mapa-capas-toggle" aria-expanded={capasOpen} aria-controls="mapa-capas" onClick={() => setCapasOpen((o) => !o)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 L22 8 L12 13 L2 8 Z" /><path d="M2 13 L12 18 L22 13" /></svg>
          Capas
        </button>
        <fieldset id="mapa-capas" className="mapa-capas" data-open={capasOpen} style={{ ...floating, margin: 0, border: 0, padding: 12 }}>
          <legend style={{ float: 'left', fontSize: 12, fontWeight: 700, padding: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }} className="muted">Capas</legend>
          {capasUI.map((c) => (
            <button key={c.key} type="button" aria-pressed={capa[c.key]} onClick={() => setCapa((s) => ({ ...s, [c.key]: !s[c.key] }))}
              style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '0 8px', border: 0, borderRadius: 6, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: 'var(--ink)', textAlign: 'left' }}>
              <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: 4, flex: '0 0 auto', border: `2px solid ${c.color}`, background: capa[c.key] ? c.color : 'transparent' }} />
              {c.label}
            </button>
          ))}
        </fieldset>

        {modo === 'view' && sel && (
          <div aria-live="polite" className="mapa-sel" style={{ ...floating, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <strong style={{ fontSize: 16 }}>{sel.name}</strong>
              <span className="muted" style={{ fontSize: 13 }}>{sel.ha} ha · {sel.crop}</span>
            </div>
            <span className="muted mapa-sel-note" style={{ fontSize: 13, lineHeight: 1.45 }}>{sel.note}</span>
            {confirmDel ? (
              <div className="mapa-sel-actions">
                <button type="button" className="btn btn-danger" onClick={removeLote}>Sí, borrar lote</button>
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmDel(false)}>No</button>
              </div>
            ) : (
              <>
                <div className="mapa-sel-actions">
                  <Link to={`/procesando/${sel.id}`} className="btn btn-primary">Analizar y certificar</Link>
                  <Link to={`/lote/${sel.id}`} className="btn btn-secondary">Ver detalle</Link>
                </div>
                <div className="mapa-sel-actions">
                  <button type="button" className="btn btn-secondary" onClick={startEdit}>Editar forma</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmDel(true)}>Borrar</button>
                </div>
              </>
            )}
          </div>
        )}

        {modo !== 'view' && (
          <div role="region" aria-label={modo === 'draw' ? 'Dibujando lote' : 'Editando lote'} className="mapa-sel mapa-editbar" style={{ ...floating, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <strong style={{ fontSize: 15 }}>{modo === 'draw' ? 'Nuevo lote' : `Editando ${sel?.name.split(' — ')[0] ?? 'lote'}`}</strong>
              <span aria-live="polite" className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{draft.length >= 3 ? `${fmtHa(draftHa)} ha` : `${draft.length} punto${draft.length === 1 ? '' : 's'}`}</span>
            </div>
            {naming ? (
              <div className="field">
                <label htmlFor="nombre-lote">Nombre del lote</label>
                <input id="nombre-lote" className="input" type="text" value={nombre} autoFocus onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveNew(); }} />
              </div>
            ) : (
              <span className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
                {modo === 'draw'
                  ? draft.length < 3 ? 'Tocá el mapa en cada esquina del lote. Podés arrastrar los puntos para ajustarlos.' : 'Seguí agregando esquinas o tocá Terminar. Arrastrá un punto para moverlo.'
                  : selIdx !== null ? `Punto ${selIdx + 1} seleccionado: arrastralo o borralo.` : 'Arrastrá los puntos blancos. Tocá un "+" para agregar un punto en ese borde.'}
              </span>
            )}
            <div className="mapa-sel-actions">
              {modo === 'draw' && !naming && <button type="button" className="btn btn-secondary" onClick={undo} disabled={draft.length === 0}>Deshacer</button>}
              {modo === 'edit' && <button type="button" className="btn btn-secondary" onClick={deletePt} disabled={selIdx === null || draft.length <= 3}>Borrar punto</button>}
              <button type="button" className="btn btn-secondary" onClick={cancel}>Cancelar</button>
              {modo === 'draw' && (naming
                ? <button type="button" className="btn btn-primary" onClick={saveNew}>Guardar lote</button>
                : <button type="button" className="btn btn-primary" onClick={() => setNaming(true)} disabled={draft.length < 3}>Terminar</button>)}
              {modo === 'edit' && <button type="button" className="btn btn-primary" onClick={saveEdit}>Listo</button>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
