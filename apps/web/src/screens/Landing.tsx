import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@synta/ui';

const STEPS = [
  { n: '01', title: 'Mapeá tus lotes', text: 'Dibujá los polígonos sobre imagen satelital.' },
  { n: '02', title: 'Elegí tu certificación', text: 'RTRS, EUDR, ISCC: ves qué cumplís y qué te falta.' },
  { n: '03', title: 'Cerrá brechas con biodiversidad', text: 'Corredores biológicos recomendados y evidencia firmada para el certificador.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate('/panel'); // prototipo: sin autenticación real
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap', background: 'var(--bg)', color: 'var(--ink)' }}>
      <section style={{ flex: '1 1 520px', background: 'var(--dark)', color: 'var(--dark-ink)', padding: 'clamp(32px, 5vw, 56px) clamp(16px, 5vw, 64px)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo size={36} />
          <span className="display" style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>Synta</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 620 }}>
          <h1 className="display" style={{ margin: 0, fontSize: 'clamp(34px, 5vw, 52px)', lineHeight: 1.05, letterSpacing: -1.5 }}>
            Certificá para exportar. Te decimos qué falta y cómo cerrarlo.
          </h1>
          <p style={{ margin: 0, fontSize: 19, lineHeight: 1.55, color: '#C3D2C8' }}>
            Ayudamos a productores y agroexportadores a acceder a mercados internacionales: adaptamos los parámetros a cada certificación y te indicamos cómo incorporar biodiversidad para cumplirla.
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {STEPS.map((s) => (
              <li key={s.n} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 18, border: '1px solid var(--dark-line)', borderRadius: 12 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>{s.n}</span>
                <strong style={{ fontSize: 15 }}>{s.title}</strong>
                <span style={{ fontSize: 13, lineHeight: 1.45, color: '#B3C4B9' }}>{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--dark-muted)' }}>Hack to the Future · Córdoba Tech Week 2026 · Vertical Agro</p>
      </section>

      <section style={{ flex: '1 1 420px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', boxSizing: 'border-box' }}>
        <form onSubmit={onSubmit} aria-labelledby="login-title" style={{ width: '100%', maxWidth: 400, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 'clamp(24px, 5vw, 36px)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h2 id="login-title" className="display" style={{ margin: 0, fontSize: 26 }}>Ingresar</h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Accedé al panel de tu establecimiento.</p>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" autoComplete="email" placeholder="productor@campo.com" />
          </div>
          <div className="field">
            <label htmlFor="pass">Contraseña</label>
            <input id="pass" className="input" type="password" autoComplete="current-password" placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: 48, justifyContent: 'center' }}>Entrar</button>
          <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--muted)' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />o<span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>
          <Link to="/panel" className="btn" style={{ height: 48, justifyContent: 'center', border: '1px solid var(--primary)', color: 'var(--primary)', textDecoration: 'none' }}>
            Entrar como productor demo
          </Link>
          <p className="muted" style={{ margin: 0, fontSize: 12, textAlign: 'center' }}>Prototipo: no hay autenticación real.</p>
        </form>
      </section>
    </div>
  );
}
