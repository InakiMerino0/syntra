import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge, ProgressBar } from '@synta/ui';
import { certificaciones, fichaEspecies, generarPlan, nivelDe, prioridadTone } from '@synta/data';
import type { AccionPlan, MezclaCorredor, NivelPlan, Plan as PlanT, ResumenNivel } from '@synta/data';

type Fase = 'idle' | 'running' | 'done';

const wrap = { minWidth: 0, overflowWrap: 'anywhere' } as const;
const linkStyle = { display: 'inline-flex', alignItems: 'center', minHeight: 44, fontSize: 14, fontWeight: 600 } as const;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function Plan() {
  const [params, setParams] = useSearchParams();
  const certParam = params.get('cert');
  const certId = certificaciones.some((c) => c.id === certParam) ? certParam! : 'fsa';
  const [fase, setFase] = useState<Fase>('idle');
  const [paso, setPaso] = useState(0);
  const [hechas, setHechas] = useState<Set<string>>(new Set());
  const timers = useRef<number[]>([]);

  const cert = certificaciones.find((c) => c.id === certId)!;
  const nivel = nivelDe(params.get('nivel'));
  const plan = useMemo(() => generarPlan(certId, nivel), [certId, nivel]);
  const pasos = [
    `Leyendo ${plan.datos.length} datos del establecimiento`,
    `Comparando con ${cert.items.length} requisitos de ${cert.label}`,
    `Aplicando ${plan.reglas.length} reglas de decisión`,
    `Priorizando ${plan.acciones.length} acciones por plazo`,
  ];

  const clear = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  useEffect(() => clear, []);
  // Reset the generated plan whenever the selected certification changes (button, link or Back).
  useEffect(() => { clear(); setFase('idle'); setHechas(new Set()); }, [certId]);
  // Changing the tier changes the actions (ids differ), so the checked ones reset but the generated plan stays visible.
  useEffect(() => { setHechas(new Set()); }, [nivel]);

  const elegir = (id: string) => {
    setParams({ cert: id, nivel }, { replace: true });
  };
  const elegirNivel = (n: NivelPlan) => {
    setParams({ cert: certId, nivel: n }, { replace: true });
  };

  const generar = () => {
    clear();
    setHechas(new Set());
    if (reducedMotion()) { setPaso(pasos.length); setFase('done'); return; }
    setFase('running');
    setPaso(0);
    pasos.forEach((_, i) => timers.current.push(window.setTimeout(() => setPaso(i + 1), 300 * (i + 1))));
    timers.current.push(window.setTimeout(() => setFase('done'), 1250));
  };

  const toggle = (id: string) => setHechas((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="page">
      <header className="page-header">
        <div className="stack" style={{ gap: 6, ...wrap }}>
          <h1 className="page-title">Plan de acción</h1>
          <span className="muted" style={{ fontSize: 14 }}>Elegí la certificación y el algoritmo arma, con tus datos, qué hacer en el campo y cuándo.</span>
        </div>
        <span className="mono muted" style={{ fontSize: 12 }}>Algoritmo v0.3 · simulado</span>
      </header>

      <section className="card stack" aria-labelledby="paso1">
        <h2 id="paso1" className="section-title">1 · ¿Qué certificación vas a aplicar?</h2>
        <div role="group" aria-labelledby="paso1" className="row" style={{ gap: 8 }}>
          {certificaciones.map((c) => (
            <button key={c.id} type="button" className="chip" style={{ minHeight: 44, fontSize: 14, maxWidth: '100%', whiteSpace: 'normal' }} aria-pressed={c.id === certId} onClick={() => elegir(c.id)}>{c.label}</button>
          ))}
        </div>
        <span className="muted" style={{ fontSize: 13, ...wrap }}>{cert.desc}</span>
        <h2 id="paso2" className="section-title" style={{ marginTop: 8 }}>2 · ¿Con qué presupuesto?</h2>
        <div role="group" aria-labelledby="paso2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12 }}>
          {plan.niveles.map((n) => <NivelCard key={n.nivel} n={n} activo={n.nivel === nivel} elegir={() => elegirNivel(n.nivel)} />)}
        </div>
        <span className="muted" style={{ fontSize: 12, ...wrap }}>Costo relativo respecto del nivel Básico (1×). Sin precios: son proporciones ilustrativas, a ajustar con el equipo.</span>
        <div className="row" style={{ gap: 12, alignItems: 'center' }}>
          <button type="button" className="btn btn-primary" onClick={generar} disabled={fase === 'running'}>
            {fase === 'done' ? 'Volver a generar' : 'Generar plan'}
          </button>
          <span className="muted" style={{ fontSize: 13 }}>{cert.items.length} requisitos · {plan.datos.length} fuentes de datos</span>
        </div>
      </section>

      <div aria-live="polite">
        {fase === 'running' && (
          <section className="card-dark stack" style={{ gap: 10 }} aria-label="Algoritmo analizando">
            <strong>Algoritmo analizando…</strong>
            <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
              {pasos.map((p, i) => (
                <li key={p} style={{ color: i < paso ? 'var(--dark-ink)' : 'var(--dark-muted)', ...wrap }}>
                  {p}{i < paso ? ' ✓' : i === paso ? '…' : ''}
                </li>
              ))}
            </ol>
            <ProgressBar value={Math.round((paso / pasos.length) * 100)} label="Progreso del análisis" />
          </section>
        )}
        {fase === 'done' && <Resultado plan={plan} hechas={hechas} toggle={toggle} />}
      </div>
    </div>
  );
}

const fmtCosto = (c: number) => `${c.toLocaleString('es-AR')}×`;

function NivelCard({ n, activo, elegir }: { n: ResumenNivel; activo: boolean; elegir: () => void }) {
  return (
    <button
      type="button"
      className="card stack"
      aria-pressed={activo}
      onClick={elegir}
      style={{ gap: 8, padding: 16, textAlign: 'left', font: 'inherit', color: 'inherit', cursor: 'pointer', minHeight: 44, borderColor: activo ? 'var(--primary)' : undefined, borderWidth: 2, background: activo ? 'var(--primary-soft)' : undefined, ...wrap }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <strong style={{ fontSize: 16 }}>{n.label}</strong>
        <span className="display" style={{ fontSize: 20 }}>{fmtCosto(n.costoRelativo)}</span>
      </div>
      <span className="muted" style={{ fontSize: 13, lineHeight: 1.4 }}>{n.bajada}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', fontSize: 12 }}>
        <span><strong>{n.ha.toLocaleString('es-AR')}</strong> ha</span>
        <span><strong>{n.plantas.toLocaleString('es-AR')}</strong> plantas</span>
        <span>Biodiversidad → <strong>{n.bioProyectada}</strong></span>
      </div>
      <span style={{ fontSize: 12 }}><strong>Ejecuta:</strong> {n.ejecuta}</span>
      <span style={{ fontSize: 12 }}><strong>Garantía de reposición:</strong> {n.garantiaPct ? `${n.garantiaPct}% de las pérdidas` : 'no incluida'}</span>
      <span><Badge tone={n.sinCubrir.length ? 'warn' : 'ok'}>Cubre {n.cumplidosConPlan}/{n.totalRequisitos} requisitos</Badge></span>
      {n.sinCubrir.length > 0 && <span style={{ fontSize: 12, color: 'var(--warn-fg)' }}>Quedan sin cubrir: {n.sinCubrir.join('; ')}</span>}
    </button>
  );
}

function Especies({ m }: { m: MezclaCorredor }) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="stack" style={{ gap: 2 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-ink)', ...wrap }}>{m.titulo}</h3>
        <span className="muted" style={{ fontSize: 13, ...wrap }}>{m.ha.toLocaleString('es-AR')} ha · {m.plantas.toLocaleString('es-AR')} plantas · {m.nota}</span>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 10 }}>
        {m.especies.map(({ especie: e, densidad, plantas }) => (
          <li key={e.id} className="card stack" style={{ gap: 6, padding: 14, fontSize: 13, ...wrap }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'baseline', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 14 }}>{e.nombre} <em className="muted" style={{ fontWeight: 400 }}>{e.cientifico}</em></strong>
              <span className="muted">{e.estrato}</span>
            </div>
            <span className="muted">{e.rol}</span>
            <span><strong>Densidad:</strong> {densidad.toLocaleString('es-AR')} plantas/ha ({plantas.toLocaleString('es-AR')} en el corredor)</span>
            <span><strong>Época:</strong> {e.epoca}</span>
            <span><strong>Riego:</strong> {e.riego}</span>
            <span><strong>Cuidados:</strong> {e.cuidados}</span>
            <span><Badge tone={e.toleraAnegamiento ? 'ok' : 'warn'}>{e.toleraAnegamiento ? 'Tolera anegamiento' : 'No tolera anegamiento'}</Badge></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Resultado({ plan, hechas, toggle }: { plan: PlanT; hechas: Set<string>; toggle: (id: string) => void }) {
  const r = plan.resumen;
  const reqsCubiertos = new Set(plan.acciones.map((a) => a.requisito).filter((x): x is string => !!x));
  const cerradosAhora = [...reqsCubiertos].filter((req) => plan.acciones.filter((a) => a.requisito === req).every((a) => hechas.has(a.id))).length;
  const cumplidosAhora = r.cumplidosHoy + cerradosAhora;
  const pct = Math.round((cumplidosAhora / r.totalRequisitos) * 100);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <section className="card-dark stack" style={{ gap: 16 }} aria-labelledby="resumen">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <h2 id="resumen" className="section-title" style={wrap}>Plan para {r.certLabel}</h2>
          <span className="mono" style={{ fontSize: 12, color: 'var(--dark-muted)' }}>Algoritmo {plan.version}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 16 }}>
          <Stat label="Requisitos hoy → con el plan" value={`${r.cumplidosHoy}/${r.totalRequisitos} → ${r.cumplidosConPlan}/${r.totalRequisitos}`} />
          <Stat label="Superficie a implantar" value={r.haImplantar ? `${r.haImplantar.toLocaleString('es-AR')} ha` : '—'} />
          <Stat label="Biodiversidad Lote 3" value={r.bioProyectada !== r.bioActual ? `${r.bioActual} → ${r.bioProyectada}` : `${r.bioActual}`} />
          <Stat label={r.rinde ? `Masa de semilla de ${r.rinde.cultivo}*` : 'Masa de semilla'} value={r.rinde ? `+${r.rinde.pct}%` : '—'} />
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <span style={{ fontSize: 13, color: '#c9cff5' }}>Con lo que marcaste como hecho: {cumplidosAhora}/{r.totalRequisitos} requisitos · {hechas.size}/{plan.acciones.length} acciones</span>
          <ProgressBar value={pct} label={`Avance hacia ${r.certLabel} con las acciones hechas`} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--dark-muted)', ...wrap }}>
          {plan.acciones.length} {plan.acciones.length === 1 ? 'acción' : 'acciones'} · {r.porPrioridad.alta} alta · {r.porPrioridad.media} media · {r.porPrioridad.baja} baja
          {r.rinde && <> · Fuentes: *{r.rinde.cultivo[0].toUpperCase() + r.rinde.cultivo.slice(1)}: +{r.rinde.pct}% de {r.rinde.metrica} con polinizadores ({r.rinde.fuente}); girasol sin polinizadores: −30,4% de rendimiento (Amarilla et al. 2025, Field Crops Research 109736)</>}
        </span>
        <div className="row" style={{ gap: 10 }}>
          <Link to="/informe" className="btn btn-accent">Ver informe</Link>
          <Link to="/accion" className="btn btn-ghost-dark">Registrar acción</Link>
        </div>
      </section>

      <div className="row" style={{ alignItems: 'flex-start', gap: 24 }}>
        <section className="stack" style={{ flex: '3 1 480px', minWidth: 0, gap: 20 }} aria-labelledby="acciones">
          <h2 id="acciones" className="section-title">Qué hacer y cuándo</h2>
          {plan.acciones.length === 0 && <p className="card muted" style={{ margin: 0 }}>No hay mejoras necesarias: ya cumplís todos los requisitos.</p>}
          {plan.fases.map((f) => {
            const items = plan.acciones.filter((a) => a.fase === f.id);
            if (!items.length) return null;
            return (
              <div key={f.id} className="stack" style={{ gap: 10, borderLeft: '3px solid var(--primary)', paddingLeft: 14, minWidth: 0 }}>
                <div className="stack" style={{ gap: 2 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-ink)', ...wrap }}>{f.anio} · {f.titulo} <span className="muted" style={{ fontWeight: 500 }}>· {items.length}</span></h3>
                  <span className="muted" style={{ fontSize: 12, ...wrap }}>{f.periodo}</span>
                  <span className="muted" style={{ fontSize: 13, lineHeight: 1.4, ...wrap }}>{f.descripcion}</span>
                </div>
                {f.id === 'f12' && (
                  <div style={{ background: 'var(--ok-bg)', color: 'var(--ok-fg)', borderRadius: 8, padding: '8px 12px', fontSize: 13, lineHeight: 1.45 }}>
                    <strong>Garantía de reposición:</strong> {plan.garantia.texto}
                  </div>
                )}
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {items.map((a) => <Accion key={a.id} a={a} done={hechas.has(a.id)} toggle={toggle} />)}
                </ul>
              </div>
            );
          })}
          {plan.mezclas.length > 0 && (
            <section className="card stack" style={{ gap: 14 }} aria-labelledby="especies">
              <h2 id="especies" className="section-title">Especies y manejo</h2>
              <span className="muted" style={{ fontSize: 13 }}>Qué plantar en cada corredor, a qué densidad, cuándo, cómo regar y qué cuidados necesita.</span>
              {plan.mezclas.map((m) => <Especies key={m.corredorId} m={m} />)}
              <span style={{ fontSize: 12, background: 'var(--warn-bg)', color: 'var(--warn-fg)', borderRadius: 8, padding: '8px 12px' }}>
                {fichaEspecies.nota}{fichaEspecies.validadoPor ? ` (validó ${fichaEspecies.validadoPor})` : ''}. Densidades, épocas y cuidados son valores de referencia.
              </span>
            </section>
          )}
        </section>

        <aside className="stack" style={{ flex: '2 1 300px', minWidth: 0, gap: 16 }}>
          <section className="card stack" style={{ gap: 4 }} aria-labelledby="datos">
            <h2 id="datos" className="section-title">Datos que usó el algoritmo</h2>
            <dl style={{ margin: 0 }}>
              {plan.datos.map((d) => (
                <div key={d.label} style={{ padding: '10px 0', borderBottom: '1px solid var(--line-soft)', ...wrap }}>
                  <dt style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{d.label}</dt>
                  <dd style={{ margin: '2px 0 0', fontSize: 14 }}>{d.valor}</dd>
                  <dd className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>Fuente: {d.fuente}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="card stack" style={{ gap: 8 }} aria-labelledby="reglas">
            <h2 id="reglas" className="section-title">Reglas que se activaron</h2>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              {plan.reglas.map((rg) => (
                <li key={rg.id} style={wrap}><span className="mono muted">{rg.id}</span> Si {rg.si.charAt(0).toLowerCase() + rg.si.slice(1)} → {rg.entonces}.</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stack" style={{ gap: 4, minWidth: 0 }}>
      <span style={{ fontSize: 12, color: 'var(--dark-muted)' }}>{label}</span>
      <span className="display" style={{ fontSize: 26, lineHeight: 1.1, ...wrap }}>{value}</span>
    </div>
  );
}

function Accion({ a, done, toggle }: { a: AccionPlan; done: boolean; toggle: (id: string) => void }) {
  const cid = `chk-${a.id}`;
  return (
    <li className="card stack" style={{ gap: 10, padding: 16, opacity: done ? 0.7 : 1, ...wrap }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <label htmlFor={cid} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, margin: '-10px 0 0 -10px', cursor: 'pointer', flex: '0 0 auto', position: 'relative' }}>
          <input id={cid} type="checkbox" checked={done} onChange={() => toggle(a.id)} style={{ width: 20, height: 20, accentColor: 'var(--primary)' }} aria-describedby={`${cid}-t`} />
          <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Marcar como hecha</span>
        </label>
        <div className="stack" style={{ gap: 6, flex: '1 1 auto', minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <strong id={`${cid}-t`} style={{ fontSize: 15, textDecoration: done ? 'line-through' : 'none', flex: '1 1 200px', minWidth: 0 }}>{a.titulo}</strong>
            <Badge tone={prioridadTone[a.prioridad]}>Prioridad {a.prioridad}</Badge>
          </div>
          <span className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{a.detalle}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: 12 }}>
            <span><strong>Cuándo:</strong> {a.momento}</span>
            <span><strong>Lote:</strong> {a.lote}</span>
            <span><strong>Esfuerzo:</strong> {a.esfuerzo}</span>
            <span style={{ color: 'var(--primary-ink)', fontWeight: 600 }}>{a.impacto}</span>
          </div>
          <span style={{ fontSize: 12 }}><strong>Cierra:</strong> {a.requisito ?? 'recomendación (no es requisito)'}</span>
          <div style={{ background: 'var(--primary-soft)', color: 'var(--primary-ink)', borderRadius: 8, padding: '8px 12px', fontSize: 13, lineHeight: 1.45 }}>
            <strong>Por qué:</strong> {a.porQue}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 20px' }}>
            {!a.link.startsWith('/accion') && (
              <Link to={a.link} style={linkStyle}>{a.linkLabel ?? (a.link.startsWith('/procesando') ? 'Analizar ahora →' : 'Ver detalle →')}</Link>
            )}
            <Link to={a.link.startsWith('/accion') ? a.link : '/accion'} style={linkStyle}>Registrar cuando lo hagas →</Link>
          </div>
        </div>
      </div>
    </li>
  );
}
