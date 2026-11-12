import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { establecimiento, lotes as lotesIniciales, capas, type Lote, type LatLng } from '@synta/data';

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
const toLatLngs = (layer: L.Layer) => ((layer as L.Polygon).getLatLngs()[0] as L.LatLng[]).map((p) => [p.lat, p.lng] as LatLng);

type Modo = 'draw' | 'edit' | 'remove' | null;

/** Map side-effects: fly to the selection, receive drawn polygons and track Geoman modes. */
function MapEffects({ selected, onCreate, onModo }: { selected?: Lote; onCreate: (p: LatLng[]) => void; onModo: (m: Modo) => void }) {
  const map = useMap();
  useEffect(() => {
    if (selected) map.flyToBounds(L.latLngBounds(selected.polygon), { maxZoom: 15, duration: 0.8 });
  }, [map, selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const toggled = (m: Modo) => (e: L.LeafletEvent) => onModo((e as unknown as { enabled: boolean }).enabled ? m : null);
    const handlers = {
      'pm:create': (e: L.LeafletEvent) => {
        onCreate(toLatLngs(e.layer));
        e.layer.remove(); // React renders the lot from state instead
      },
      'pm:globaldrawmodetoggled': toggled('draw'),
      'pm:globaleditmodetoggled': toggled('edit'),
      'pm:globalremovalmodetoggled': toggled('remove'),
    } as L.LeafletEventHandlerFnMap;
    map.on(handlers);
    return () => { map.off(handlers); };
  }, [map, onCreate, onModo]);
  return null;
}

const iconBtn = (on: boolean): CSSProperties => ({
  width: 44, height: 44, border: 0, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: on ? 'var(--primary-soft)' : 'transparent', color: on ? 'var(--primary-ink)' : 'var(--ink)',
});
const floating: CSSProperties = { position: 'absolute', zIndex: 1000, background: 'var(--surface)', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' };

export default function Mapa() {
  const [lotes, setLotes] = useState<Lote[]>(lotesIniciales);
  const [selId, setSelId] = useState(lotesIniciales[2].id);
  const [nombre, setNombre] = useState(`Lote ${lotesIniciales.length + 1} — Potrero Este`);
  const [capa, setCapa] = useState({ ndvi: false, bosque: true, focos: true });
  const [modo, setModo] = useState<Modo>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const sel = lotes.find((l) => l.id === selId);
  const totalHa = Math.round(lotes.reduce((s, l) => s + l.ha, 0));

  const onCreate = (polygon: LatLng[]) => {
    const id = `n${Date.now()}`;
    const name = nombre.trim() || `Lote ${lotes.length + 1}`;
    setLotes((ls) => [...ls, { id, name, crop: 'Sin definir', ha: areaHa(polygon), bio: 50, status: 'Sin analizar', tone: 'bad', note: 'Lote nuevo dibujado en el mapa. Analizalo para ver sus brechas de certificación.', polygon }]);
    setSelId(id);
    setNombre(`Lote ${lotes.length + 2}`);
  };
  const updatePolygon = (id: string, polygon: LatLng[]) =>
    setLotes((ls) => ls.map((l) => (l.id === id ? { ...l, polygon, ha: areaHa(polygon) } : l)));
  const removeLote = (id: string) => setLotes((ls) => ls.filter((l) => l.id !== id));

  const capasUI = [
    { key: 'ndvi', label: 'NDVI (vigor vegetal)', color: '#1A9850' },
    { key: 'bosque', label: 'Bosque nativo protegido', color: '#B8860B' },
    { key: 'focos', label: 'Focos de calor (FIRMS)', color: '#EA580C' },
  ] as const;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: '100vh' }}>
      <aside aria-label="Lotes" style={{ flex: '1 1 300px', maxWidth: '100%', background: 'var(--surface)', borderRight: '1px solid var(--line)', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 className="display" style={{ fontSize: 24 }}>Mapa y lotes</h1>
          <span className="muted" style={{ fontSize: 13 }}>La Esperanza · {totalHa} ha mapeadas</span>
        </div>
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
        <div className="field" style={{ padding: 16, borderRadius: 10, background: 'var(--bg)' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Nuevo lote</span>
          <label htmlFor="nombre-lote">Nombre</label>
          <input id="nombre-lote" className="input" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <span className="muted" style={{ fontSize: 12 }}>
            {modo === 'draw' ? 'Marcá los vértices y cerrá el polígono para calcular la superficie.' : 'Tocá "Dibujar polígono" en el mapa para marcar el lote.'}
          </span>
        </div>
      </aside>

      <section aria-label="Mapa satelital" style={{ flex: '999 1 520px', minWidth: 0, position: 'relative', minHeight: 'max(520px, 100vh)' }}>
        <MapContainer ref={setMap} center={establecimiento.center} zoom={14} style={{ position: 'absolute', inset: 0 }}>
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles © Esri" />
          {capa.bosque && (
            <Polygon positions={capas.bosqueNativo} pathOptions={{ color: '#FFD166', weight: 2, dashArray: '6 4', fillColor: '#FFD166', fillOpacity: 0.3, pmIgnore: true } as L.PathOptions} interactive={false}>
              <Tooltip permanent direction="center">Bosque nativo · Cat. II</Tooltip>
            </Polygon>
          )}
          {capa.focos && capas.focosCalor.map((p, i) => (
            <CircleMarker key={i} center={p} radius={8} pathOptions={{ color: '#fff', weight: 2, fillColor: '#F97316', fillOpacity: 1, pmIgnore: true } as L.PathOptions}>
              <Tooltip>Foco de calor (NASA FIRMS)</Tooltip>
            </CircleMarker>
          ))}
          {lotes.map((l) => {
            const on = l.id === selId;
            return (
              <Polygon
                key={l.id}
                positions={l.polygon}
                pathOptions={{ color: on ? '#FFD166' : '#fff' /* = var(--corridor); SVG attributes can't read CSS vars */, weight: on ? 4 : 2, fillColor: capa.ndvi ? ndviColor(l.bio) : '#fff', fillOpacity: capa.ndvi ? 0.6 : 0.05 }}
                eventHandlers={{
                  click: () => setSelId(l.id),
                  'pm:edit': (e: L.LeafletEvent) => updatePolygon(l.id, toLatLngs(e.target)),
                  'pm:remove': () => removeLote(l.id),
                } as L.LeafletEventHandlerFnMap}
              >
                <Tooltip permanent direction="center">{l.name.split(' — ')[0]}</Tooltip>
              </Polygon>
            );
          })}
          <MapEffects selected={sel} onCreate={onCreate} onModo={setModo} />
        </MapContainer>

        <div role="toolbar" aria-label="Herramientas de dibujo" style={{ ...floating, top: 16, left: 56, display: 'flex', gap: 6, padding: 6 }}>
          <button type="button" aria-label="Dibujar polígono" aria-pressed={modo === 'draw'} style={iconBtn(modo === 'draw')}
            onClick={() => (map?.pm.globalDrawModeEnabled() ? map.pm.disableDraw() : map?.pm.enableDraw('Polygon'))}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M5 19 L4 7 L13 4 L20 12 L14 20 Z" /><circle cx="4" cy="7" r="1.5" fill="currentColor" /><circle cx="13" cy="4" r="1.5" fill="currentColor" /></svg>
          </button>
          <button type="button" aria-label="Editar vértices" aria-pressed={modo === 'edit'} style={iconBtn(modo === 'edit')} onClick={() => map?.pm.toggleGlobalEditMode()}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 20 L8 19 L19 8 L16 5 L5 16 Z" /></svg>
          </button>
          <button type="button" aria-label="Borrar lote" aria-pressed={modo === 'remove'} style={iconBtn(modo === 'remove')} onClick={() => map?.pm.toggleGlobalRemovalMode()}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 7 H19 M10 7 V4 H14 V7 M7 7 L8 20 H16 L17 7" /></svg>
          </button>
        </div>

        <fieldset style={{ ...floating, top: 16, right: 16, margin: 0, border: 0, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 210 }}>
          <legend style={{ float: 'left', fontSize: 12, fontWeight: 700, padding: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }} className="muted">Capas</legend>
          {capasUI.map((c) => (
            <button key={c.key} type="button" aria-pressed={capa[c.key]} onClick={() => setCapa((s) => ({ ...s, [c.key]: !s[c.key] }))}
              style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '0 8px', border: 0, borderRadius: 6, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: 'var(--ink)', textAlign: 'left' }}>
              <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: 4, flex: '0 0 auto', border: `2px solid ${c.color}`, background: capa[c.key] ? c.color : 'transparent' }} />
              {c.label}
            </button>
          ))}
        </fieldset>

        {sel && (
          <div aria-live="polite" style={{ ...floating, left: 16, right: 16, bottom: 24, maxWidth: 420, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <strong style={{ fontSize: 16 }}>{sel.name}</strong>
              <span className="muted" style={{ fontSize: 13 }}>{sel.ha} ha · {sel.crop}</span>
            </div>
            <span className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{sel.note}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Link to={`/procesando/${sel.id}`} className="btn btn-primary">Analizar y certificar lote</Link>
              <Link to={`/lote/${sel.id}`} className="btn btn-secondary">Ver detalle</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
