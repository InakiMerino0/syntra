import { Link } from 'react-router-dom';
import { Badge, ProgressBar } from '@synta/ui';
import HashTodo from '../components/HashTodo';
import { useLotes } from '../store/lotes';
import { ecorregion, establecimiento, kpis, ejes, certificaciones, corredores, biodiversidadLote3, eventos, eventKinds } from '@synta/data';

const cert = certificaciones.find((c) => c.id === 'fsa')!;
const count = (s: string) => cert.items.filter((i) => i.status === s).length;
const fmtHa = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });
const corredoresHa = fmtHa(corredores.reduce((sum, c) => sum + c.ha, 0));
const corredoresImplantadasHa = fmtHa(corredores.filter((c) => c.status === 'Implantado').reduce((sum, c) => sum + c.ha, 0));
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
const bio = biodiversidadLote3;

const sub = { fontSize: 13, color: 'var(--dark-muted)' };
const subLight = { fontSize: 14, color: '#c3d2c8' };
const big = { fontSize: 26 };
const sectionHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 } as const;
const smallLink = { fontSize: 13, fontWeight: 600, minHeight: 44, display: 'inline-flex', alignItems: 'center' } as const;

export default function Panel() {
  const lotes = useLotes();
  const totalHa = lotes.reduce((sum, l) => sum + l.ha, 0);
  const kpisVivos = kpis.map((k) => k.label === 'Superficie mapeada' ? { ...k, value: `${fmtHa(totalHa)} ha`, sub: plural(lotes.length, 'lote', 'lotes') } : k);
  return (
    <div className="page">
      <header className="page-header">
        <div className="stack" style={{ gap: 6 }}>
          <span className="muted" style={{ fontSize: 13 }}>{establecimiento.location} · RENSPA {establecimiento.renspa} · Ecorregión {ecorregion.nombre}</span>
          <h1 className="page-title">{establecimiento.name}</h1>
        </div>
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <Badge tone="warn">Datos de demostración</Badge>
          <HashTodo variant="secondary" />
          <Link to="/mapa?dibujar=1" className="btn btn-primary">+ Nuevo lote</Link>
        </div>
      </header>

      <section aria-label="Resumen" className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {kpisVivos.map((k) => (
          <div key={k.label} className="card stack" style={{ gap: 6, padding: '18px 20px' }}>
            <span className="muted" style={{ fontSize: 13 }}>{k.label}</span>
            <span className="display" style={{ fontSize: 30 }}>{k.value}</span>
            <span className="muted" style={{ fontSize: 12 }}>{k.sub}</span>
          </div>
        ))}
      </section>

      <section aria-labelledby="obj" className="card-dark row" style={{ gap: 24, alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px' }}>
        <div className="stack" style={{ gap: 6, flex: '1 1 320px' }}>
          <span id="obj" style={sub}>Certificación objetivo</span>
          <strong className="display" style={big}>FSA · producción agrícola sustentable</strong>
          <span style={subLight}>
            {count('ok')} de {cert.items.length} {count('ok') === 1 ? 'requisito cumplido' : 'requisitos cumplidos'} en el Lote 3 · {plural(count('bad'), 'mejora necesaria', 'mejoras necesarias')} de biodiversidad · {plural(count('warn'), 'dato faltante', 'datos faltantes')}
          </span>
        </div>
        <div className="stack" style={{ gap: 6, flex: '1 1 240px' }}>
          <span style={sub}>Plan de corredores</span>
          <strong className="display" style={big}>{corredoresHa} ha · {corredores.length} corredores</strong>
          <span style={subLight}>{corredoresImplantadasHa} ha ya implantada · biodiversidad {bio.actual} → {bio.proyectado} · masa de semilla de {bio.rinde.cultivo} +{bio.rinde.pct}%*</span>
        </div>
        <Link to="/lote/l3" className="btn btn-accent" style={{ minHeight: 48, fontSize: 15 }}>Ver mejoras necesarias</Link>
      </section>

      <section aria-labelledby="eco" className="card stack" style={{ gap: 12 }}>
        <h2 id="eco" className="section-title">Ecorregión {ecorregion.nombre}</h2>
        <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
          Ubicamos tu campo en su ecorregión y traemos los datos disponibles ({ecorregion.fuenteDatos}). {ecorregion.descripcion} Las especies y el diseño de los corredores se adaptan a ella.
        </p>
        <ul aria-label="Especies nativas recomendadas" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ecorregion.especies.slice(0, 5).map((s) => (
            <li key={s.nombre}><span className="badge badge-ok" title={s.cientifico}>{s.nombre}</span></li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ejes" className="stack">
        <h2 id="ejes" className="section-title">Cumplimiento por eje</h2>
        <div className="grid-auto">
          {ejes.map((e) => (
            <div key={e.name} className="card stack" style={{ gap: 14 }}>
              <div style={sectionHead}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{e.name}</span>
                <Badge tone={e.tone}>{e.status}</Badge>
              </div>
              <span className="display" style={{ fontSize: 40, lineHeight: 1 }}>{e.pct}%</span>
              <ProgressBar value={e.pct} tone={e.tone} label={`Cumplimiento ${e.name}`} />
              <span className="muted" style={{ fontSize: 12 }}>{e.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <section aria-labelledby="lotes" className="card stack" style={{ flex: '2 1 520px', minWidth: 0 }}>
          <div style={sectionHead}>
            <h2 id="lotes" className="section-title">Lotes</h2>
            <Link to="/mapa" style={smallLink}>Ver en mapa</Link>
          </div>
          <div className="table-wrap">
            <table className="table" style={{ minWidth: 560 }}>
              <thead>
                <tr><th scope="col">Lote</th><th scope="col">Cultivo</th><th scope="col">Superficie</th><th scope="col">Biodiversidad</th><th scope="col">Estado</th></tr>
              </thead>
              <tbody>
                {lotes.map((l) => (
                  <tr key={l.id}>
                    <td><Link to={`/lote/${l.id}`} style={{ fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>{l.name}</Link></td>
                    <td>{l.crop}</td>
                    <td>{l.ha.toLocaleString('es-AR')} ha</td>
                    <td className="mono">{l.status === 'Sin analizar' ? '—' : `${l.bio}/100`}</td>
                    <td><Badge tone={l.tone}>{l.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="stack" style={{ flex: '1 1 320px', minWidth: 0, gap: 16 }}>
          <section aria-labelledby="bio" className="card stack">
            <h2 id="bio" className="section-title">Índice de biodiversidad</h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="display" style={{ fontSize: 48, lineHeight: 1, color: 'var(--primary)' }}>{establecimiento.biodiversity}</span>
              <span className="muted" style={{ fontSize: 14 }}>/ 100 · +4 vs campaña anterior</span>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              Promedio ponderado por superficie. Con los corredores sugeridos el Lote 3 sube a {bio.proyectado}. *Soja: +31% de masa de semilla con polinizadores (Galetto et al. 2026, Agroforestry Systems 100:51).
            </p>
          </section>

          <section aria-labelledby="ult" className="card stack" style={{ gap: 14 }}>
            <div style={sectionHead}>
              <h2 id="ult" className="section-title">Últimos registros firmados</h2>
              <Link to="/trazabilidad" style={smallLink}>Ver todo</Link>
            </div>
            <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 14 }}>
              {eventos.slice(0, 4).map((ev) => (
                <li key={ev.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: eventKinds[ev.kind].color, marginTop: 5, flex: '0 0 auto' }} />
                  <div className="stack" style={{ gap: 3, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{ev.lote} — {ev.title}</span>
                    <span className="muted" style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{ev.date} · <span className="mono">{ev.hash}</span></span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
