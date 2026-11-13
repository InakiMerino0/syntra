// "Exportar datos": the producer owns their data — download it as JSON (full bundle) or GeoJSON (lots).
import { exportarEstablecimiento, exportarLotesGeoJSON } from '../lib/exportar';
import { useLotes } from '../store/lotes';

function descargar(nombre: string, contenido: unknown, tipo: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(contenido, null, 2)], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Exportar() {
  const lotes = useLotes();
  const fecha = new Date().toISOString().slice(0, 10);
  return (
    <details className="exportar">
      <summary className="btn btn-secondary">Exportar datos</summary>
      <div className="exportar-menu card" role="group" aria-label="Formatos de exportación">
        <button type="button" className="btn btn-secondary" onClick={() => descargar(`syntra-establecimiento-${fecha}.json`, exportarEstablecimiento(lotes), 'application/json')}>
          Todo el establecimiento (.json)
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => descargar(`syntra-lotes-${fecha}.geojson`, exportarLotesGeoJSON(lotes), 'application/geo+json')}>
          Lotes para SIG (.geojson)
        </button>
        <span className="muted" style={{ fontSize: 12, lineHeight: 1.4 }}>Tus datos son tuyos: se generan en tu dispositivo, listos para tu SIG, tu agrónomo o la certificadora.</span>
      </div>
    </details>
  );
}
