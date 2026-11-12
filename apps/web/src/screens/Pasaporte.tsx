import { useEffect, useState } from 'react';
import { Badge, FakeQR, Logo, sha256, type Tone } from '@synta/ui';
import { biodiversidadLote3, corredores, establecimiento, lotes } from '@synta/data';
import HashTodo from '../components/HashTodo';
import './pasaporte/pasaporte.css';

const URL_VERIFICACION = 'https://syntra.app/v/184';
const NUMERO = 'SYN-2026-000184';
const EMITIDO = '12/11/2026';

const facts = [
  { l: 'Superficie', v: `${establecimiento.totalHa} ha` },
  { l: 'Lotes', v: String(lotes.length) },
  { l: 'Deforestación post 2020', v: '0 ha' },
  { l: 'Biodiversidad', v: `${establecimiento.biodiversity}/100` },
];

const ejes: { eje: string; normas: string; res: string; tone: Tone; obs: string }[] = [
  { eje: 'Provincial (Córdoba)', normas: 'Ley Agroforestal de Córdoba; Buenas Prácticas Agropecuarias (BPA)', res: 'Cumple', tone: 'ok', obs: 'Cobertura forestal mínima en curso con corredores (L3); falta registro de aplicaciones' },
  { eje: 'Nacional', normas: 'OTBN (Ley 26.331); RENSPA', res: 'Cumple', tone: 'ok', obs: '—' },
  { eje: 'Internacional', normas: 'EUDR: geolocalización, no deforestación, legalidad', res: 'Parcial', tone: 'warn', obs: 'Legalidad pendiente en L4' },
  { eje: 'Certificaciones', normas: 'RTRS (objetivo); ISCC', res: 'Con brechas', tone: 'bad', obs: 'Vegetación nativa y plan de biodiversidad: en curso con corredores' },
];

const hashes = [
  { k: 'Polígonos (4 lotes)', v: '0x44c0a8…e29f12' },
  { k: 'Cobertura 2020→2026', v: '0x5a07c1…b0e3d1' },
  { k: 'Biodiversidad', v: '0x91bd5e…f204aa' },
];

const fmtHa = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 1 });

export default function Pasaporte() {
  const [hash, setHash] = useState<string | null>(null);
  const [copiado, setCopiado] = useState('');

  useEffect(() => {
    sha256(JSON.stringify({ numero: NUMERO, emitido: EMITIDO, establecimiento, lotes, ejes, corredores })).then(setHash);
  }, []);

  async function compartir() {
    try {
      await navigator.clipboard.writeText(URL_VERIFICACION);
      setCopiado('Link copiado');
    } catch {
      setCopiado(`Copiá este link: ${URL_VERIFICACION}`);
    }
  }

  return (
    <div className="pasaporte">
      <div className="pasaporte-actions">
        <span role="status" className="muted" style={{ fontSize: 13 }}>{copiado}</span>
        <button type="button" className="btn btn-secondary" onClick={compartir}>Compartir link</button>
        <HashTodo variant="secondary" />
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>Descargar PDF</button>
      </div>

      <article className="pasaporte-doc" aria-labelledby="pasaporte-titulo">
        <header>
          <div className="stack" style={{ gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Logo size={24} color="var(--primary)" />
              <span className="display" style={{ fontWeight: 700 }}>Syntra</span>
            </div>
            <h1 id="pasaporte-titulo" className="page-title">Pasaporte de cumplimiento</h1>
            <span className="muted" style={{ fontSize: 14 }}>{establecimiento.name} · {establecimiento.location}, Argentina</span>
            <span className="muted" style={{ fontSize: 13 }}>Emitido {EMITIDO} · Campaña 2026/27 · N.º {NUMERO}</span>
          </div>
          <div className="stack" style={{ alignItems: 'center', gap: 6 }}>
            <FakeQR cell={5} label="Código QR ilustrativo de verificación" />
            <span className="muted" style={{ fontSize: 11 }}>Verificar en syntra.app/v/184</span>
          </div>
        </header>

        <section style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
          <svg viewBox="0 0 400 260" role="img" aria-label="Mapa de los 4 lotes del establecimiento con los corredores" style={{ flex: '1 1 300px', minWidth: 0, height: 'auto', borderRadius: 8 }}>
            <rect width="400" height="260" fill="#E9EDE4" />
            <polygon points="40,30 150,22 156,110 50,118" fill="#CFE3D5" stroke="#1D6A47" strokeWidth="2" />
            <polygon points="168,26 258,32 255,110 165,112" fill="#CFE3D5" stroke="#1D6A47" strokeWidth="2" />
            <polygon points="50,130 160,124 172,220 58,232" fill="#FBE3C3" stroke="#C2620E" strokeWidth="2" />
            <polygon points="182,128 285,120 300,210 186,222" fill="#F3D0CC" stroke="#B42318" strokeWidth="2" strokeDasharray="5 3" />
            <line x1="52" y1="134" x2="160" y2="128" stroke="#D99A00" strokeWidth="5" />
            <line x1="104" y1="130" x2="112" y2="228" stroke="#D99A00" strokeWidth="5" strokeDasharray="6 3" />
            <g fontFamily="Inter, sans-serif" fontSize="12" fontWeight="700" fill="#15211B">
              <text x="78" y="72">L1</text><text x="200" y="74">L2</text><text x="96" y="180">L3</text><text x="228" y="172">L4</text>
            </g>
          </svg>
          <div style={{ flex: '1 1 260px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, alignContent: 'start' }}>
            {facts.map((f) => (
              <div key={f.l} className="pasaporte-box">
                <span className="muted" style={{ fontSize: 12 }}>{f.l}</span>
                <strong className="display" style={{ fontSize: 22 }}>{f.v}</strong>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title">Estado por eje regulatorio</h2>
          <div className="table-wrap">
            <table className="table" style={{ minWidth: 560 }}>
              <thead><tr><th scope="col">Eje</th><th scope="col">Normas evaluadas</th><th scope="col">Resultado</th><th scope="col">Observaciones</th></tr></thead>
              <tbody>
                {ejes.map((e) => (
                  <tr key={e.eje}>
                    <th scope="row" style={{ fontSize: 14, color: 'var(--ink)', borderBottomColor: 'var(--line-soft)' }}>{e.eje}</th>
                    <td>{e.normas}</td>
                    <td><Badge tone={e.tone}>{e.res}</Badge></td>
                    <td className="muted">{e.obs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="section-title">Certificación objetivo: RTRS — plan para cerrar brechas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {corredores.map((c) => (
              <div key={c.id} className="pasaporte-box">
                <strong style={{ fontSize: 14 }}>{c.title}</strong>
                <span className="muted" style={{ fontSize: 13 }}>{fmtHa(c.ha)} ha · {c.closes}</span>
                <Badge tone={c.status === 'Implantado' ? 'ok' : 'warn'}>{c.status}</Badge>
              </div>
            ))}
          </div>
          <p>Biodiversidad del Lote 3: {biodiversidadLote3.actual} hoy → {biodiversidadLote3.proyectado} con el plan completo. Cada corredor implantado se registra y firma como evidencia para el certificador.</p>
        </section>

        <section>
          <h2 className="section-title">Evidencia anclada en blockchain</h2>
          <ul className="pasaporte-hashes mono" style={{ listStyle: 'none', margin: 0 }}>
            {hashes.map((h) => <li key={h.k}>{h.k} — {h.v}</li>)}
            <li>Este pasaporte — {hash ?? 'calculando…'}</li>
          </ul>
          <div className="pasaporte-hashall">
            <p>¿Querés una sola huella de todo lo que Syntra tiene del establecimiento? Hasheamos cada conjunto de datos y los combinamos en una huella raíz.</p>
            <HashTodo variant="primary" />
          </div>
          <p style={{ fontSize: 12 }}>Red: Polygon Amoy (testnet). Fuentes: Copernicus Sentinel-2 L2A, NASA FIRMS, capa OTBN (Ley 26.331), declaraciones del productor. Este documento es un prototipo y no constituye una certificación oficial.</p>
        </section>
      </article>
    </div>
  );
}
