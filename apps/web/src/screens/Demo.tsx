// /demo — self-running stage for the pitch video (and live plan B).
// A 1920×1080 "slide" in Syntra's navy palette: the real app runs inside a phone (same-origin iframe) while
// technology cards animate around it. ?auto=1 starts immediately (used by the recorder); otherwise a click starts it.
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@synta/ui';
import QR from '../components/QR';
import './demo/demo.css';

interface Card { tag: string; title: string; body: string }
interface Escena { id: string; titulo: string; frase: string; url: string; izq: Card[]; der: Card[]; acciones?: Accion[] }
type Accion = { at: number; click?: string; scroll?: string | number };

const SEG = 8; // seconds per technology
const APP_URL = 'syntra-agro.vercel.app';

const ESCENAS: Escena[] = [
  {
    id: 'datos', titulo: 'Datos del campo', frase: 'Elegimos dónde va la infraestructura verde sin perder superficie productiva',
    url: '/mapa?sel=none&capas=parches,rendimiento,inundables',
    izq: [
      { tag: 'Satélite', title: 'Sentinel-2', body: 'NDVI y cambio de cobertura cada 5 días' },
      { tag: 'Cosechadora', title: 'Mapa de rendimiento', body: 'Zonas de bajo rinde histórico' },
    ],
    der: [
      { tag: 'Suelo y agua', title: 'Zonas inundables', body: 'Bajos y napa alta' },
      { tag: 'Paisaje', title: 'Parches de bosque', body: 'Nodos de biodiversidad a conectar' },
    ],
  },
  {
    id: 'conectividad', titulo: 'Conectividad ecológica', frase: 'Modelamos por dónde se mueven polinizadores y enemigos naturales',
    url: '/mapa?sel=none&capas=parches,conectividad',
    izq: [
      { tag: 'Modelo', title: 'Circuitscape', body: 'Teoría de circuitos · código abierto' },
      { tag: 'Resultado', title: 'Mapa de corriente', body: 'La síntesis de todas las capas' },
    ],
    der: [
      { tag: 'Diseño', title: 'Corredor mínimo', body: 'Conecta parches sobre zonas de bajo rinde' },
      { tag: 'Ciencia', title: 'CONICET · IMBIV', body: 'Galetto et al. 2026 · Amarilla et al. 2025' },
    ],
  },
  {
    id: 'plan', titulo: 'Certificación y plan de acción', frase: 'Cada requisito se traduce en acciones concretas en el campo',
    url: '/plan?cert=fsa',
    acciones: [{ at: 0.6, click: 'Generar plan' }, { at: 3.6, scroll: 'Qué hacer y cuándo' }],
    izq: [
      { tag: 'Estándar', title: 'FSA · SAI Platform', body: 'Requisitos traducidos a evidencia' },
      { tag: 'Motor de reglas', title: 'Qué cumple y qué mejorar', body: 'Mejoras necesarias por requisito' },
    ],
    der: [
      { tag: 'Plan', title: 'Acciones con plazos', body: 'Especies nativas de la ecorregión' },
    ],
  },
  {
    id: 'blockchain', titulo: 'Evidencia sellada', frase: 'Un escribano digital: si alguien cambia un dato, se detecta',
    url: '/trazabilidad',
    acciones: [{ at: 0.8, scroll: 'Simular alteración' }, { at: 2.2, click: 'Simular alteración' }, { at: 3.6, click: 'Verificar: Corredor A' }],
    izq: [
      { tag: 'Huella digital', title: 'SHA-256 + árbol de Merkle', body: 'Cada dato y cada monitoreo' },
    ],
    der: [
      { tag: 'Sello de tiempo', title: 'Blockchain Federal Argentina', body: 'Prueba qué existía y cuándo' },
    ],
  },
  {
    id: 'informe', titulo: 'Informe para la certificadora', frase: 'Biodiversidad que el productor puede demostrar',
    url: '/informe',
    acciones: [{ at: 2.5, scroll: 'Sellado de tiempo' }],
    izq: [
      { tag: 'Entregable', title: 'Informe de Evidencia Ambiental', body: 'PDF por certificación con QR' },
    ],
    der: [
      { tag: 'Verificación', title: 'Listo para el auditor', body: 'Cualquiera puede comprobarlo' },
    ],
  },
];
const OUTRO = 3; // seconds
const TOTAL = ESCENAS.length * SEG + OUTRO;

/** Finds a visible element in the iframe whose text or aria-label starts with `txt`. */
function buscar(doc: Document, txt: string): HTMLElement | null {
  const all = [...doc.querySelectorAll<HTMLElement>('button, a, h2, h3, strong, [aria-label]')];
  return all.find((e) => (e.getAttribute('aria-label') ?? '').startsWith(txt) || e.innerText?.trim().startsWith(txt)) ?? null;
}

export default function Demo() {
  const auto = new URLSearchParams(location.search).has('auto');
  const [t, setT] = useState(-1); // seconds since start; -1 = not started
  const frame = useRef<HTMLIFrameElement>(null);
  const hechas = useRef(new Set<string>());
  const [escala, setEscala] = useState(1);

  // Fit the 1920×1080 stage into any window.
  useEffect(() => {
    const fit = () => setEscala(Math.min(innerWidth / 1920, innerHeight / 1080));
    fit(); addEventListener('resize', fit); return () => removeEventListener('resize', fit);
  }, []);

  function iniciar() {
    hechas.current.clear();
    const t0 = performance.now();
    console.log('DEMO_START');
    setT(0);
    const id = setInterval(() => {
      const s = (performance.now() - t0) / 1000;
      setT(s);
      if (s >= TOTAL + 0.5) { clearInterval(id); console.log('DEMO_END'); }
    }, 100);
  }
  useEffect(() => { if (auto) setTimeout(iniciar, 1500); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const idx = t < 0 ? 0 : Math.min(Math.floor(t / SEG), ESCENAS.length);
  const outro = t >= ESCENAS.length * SEG;
  const escena = ESCENAS[Math.min(idx, ESCENAS.length - 1)];
  const local = t - idx * SEG;

  // Navigate the phone to the scene's URL at the start of each scene.
  useEffect(() => {
    if (t < 0 || outro) return;
    const f = frame.current;
    if (f && !f.src.endsWith(escena.url)) f.src = escena.url;
  }, [idx, t < 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scripted interactions inside the phone.
  useEffect(() => {
    if (t < 0 || outro) return;
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    for (const [i, a] of (escena.acciones ?? []).entries()) {
      const key = `${escena.id}-${i}`;
      if (local < a.at || hechas.current.has(key)) continue;
      if (a.click) { const el = buscar(doc, a.click); if (!el) continue; el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.click(); }
      if (a.scroll !== undefined) {
        const el = typeof a.scroll === 'string' ? buscar(doc, a.scroll) : null;
        if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
        else if (typeof a.scroll === 'number') frame.current?.contentWindow?.scrollTo({ top: a.scroll, behavior: 'smooth' });
        else continue;
      }
      hechas.current.add(key);
    }
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps

  const progreso = t < 0 ? 0 : Math.min(t / TOTAL, 1);

  return (
    <div className="demo-root" onClick={() => t < 0 && iniciar()}>
      <div className="demo-stage" style={{ transform: `translate(-50%, -50%) scale(${escala})` }}>
        <header className="demo-head">
          <div className="demo-brand"><Logo size={44} color="#7BC59A" /><span>SYNTRA</span></div>
          {!outro && (
            <div key={escena.id} className="demo-step">
              <span className="demo-step-n">{idx + 1}/{ESCENAS.length}</span>
              <span className="demo-step-t">{escena.titulo}</span>
            </div>
          )}
        </header>

        {outro ? (
          <section className="demo-outro">
            <div className="demo-outro-text">
              <h1>Biodiversidad con <em>valor de mercado</em></h1>
              <p>Probalo ahora</p>
              <strong>{APP_URL}</strong>
            </div>
            <div className="demo-outro-qr"><QR value={`https://${APP_URL}`} size={300} label="QR a la plataforma Syntra" /></div>
          </section>
        ) : (
          <>
            <div className="demo-col demo-izq" key={`i-${escena.id}`}>
              {escena.izq.map((c, i) => <TechCard key={c.title} c={c} delay={0.3 + i * 0.5} />)}
            </div>
            <div className="demo-phone">
              <div className="demo-notch" />
              <iframe ref={frame} title="Plataforma Syntra" src={ESCENAS[0].url} />
            </div>
            <div className="demo-col demo-der" key={`d-${escena.id}`}>
              {escena.der.map((c, i) => <TechCard key={c.title} c={c} delay={0.8 + i * 0.5} />)}
            </div>
            <p className="demo-frase" key={`f-${escena.id}`}>{escena.frase}</p>
          </>
        )}

        <div className="demo-progress"><span style={{ width: `${progreso * 100}%` }} /></div>
        {t < 0 && !auto && <div className="demo-start">Tocá para iniciar la demo</div>}
      </div>
    </div>
  );
}

function TechCard({ c, delay }: { c: Card; delay: number }) {
  return (
    <div className="demo-card" style={{ animationDelay: `${delay}s` }}>
      <span className="demo-card-tag">{c.tag}</span>
      <strong>{c.title}</strong>
      <span>{c.body}</span>
    </div>
  );
}
