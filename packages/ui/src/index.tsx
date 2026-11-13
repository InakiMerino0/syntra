import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import './styles.css';

export type Tone = 'ok' | 'warn' | 'bad';

export function Logo({ size = 28, color = '#8dc63f' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      {/* Syntra leaf (as on the "A" of the wordmark) */}
      <path d="M4 24 C4 13, 11 5, 25 3 C25 15, 18 23, 6 24 Z" fill={color} />
      <path d="M6 23 C11 17, 15 12, 20 8" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export const NAV = [
  { to: '/panel', label: 'Panel' },
  { to: '/mapa', label: 'Mapa y lotes' },
  { to: '/plan', label: 'Plan de acción' },
  { to: '/trazabilidad', label: 'Trazabilidad' },
  { to: '/informe', label: 'Informe de evidencia' },
  { to: '/accion', label: 'Registrar acción' },
];

const NAV_ID = 'app-nav';
const MOBILE_MQ = '(max-width: 800px)';

/** Desktop: fixed sidebar. Mobile (≤800px): the same nav becomes a slide-in drawer (see .sidebar in styles.css). */
export function Sidebar({ open = false, onClose, onDismiss }: { open?: boolean; onClose?: () => void; onDismiss?: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);
  return (
    <nav id={NAV_ID} aria-label="Principal" className="sidebar" data-open={open}>
      <div className="sidebar-head">
        <NavLink to="/panel" className="sidebar-logo" onClick={onClose}><Logo />Syntra</NavLink>
        <button ref={closeRef} type="button" className="sidebar-close" aria-label="Cerrar menú" onClick={onDismiss ?? onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18" /></svg>
        </button>
      </div>
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} className="nav-link" onClick={onClose}>{n.label}</NavLink>
      ))}
      <div className="sidebar-foot">Datos de demostración</div>
    </nav>
  );
}

/** Layout for every screen except the landing: fixed sidebar (desktop) or fixed top bar + drawer (mobile). */
export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const menuRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const close = (refocus = false) => {
    setOpen(false);
    if (refocus) menuRef.current?.focus();
  };

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => { if (!mq.matches) setOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); menuRef.current?.focus(); }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    mainRef.current?.setAttribute('inert', '');
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      mainRef.current?.removeAttribute('inert');
    };
  }, [open]);

  return (
    <div className="app">
      <header className="topbar">
        <button ref={menuRef} type="button" className="topbar-menu" aria-label="Abrir menú" aria-expanded={open} aria-controls={NAV_ID} onClick={() => setOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7 H20 M4 12 H20 M4 17 H20" /></svg>
        </button>
        <NavLink to="/panel" className="topbar-logo"><Logo size={24} />Syntra</NavLink>
      </header>
      <div className="drawer-backdrop" data-open={open} aria-hidden="true" onClick={() => close(true)} />
      <Sidebar open={open} onClose={() => close(false)} onDismiss={() => close(true)} />
      <main ref={mainRef} className="content"><Outlet /></main>
    </div>
  );
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function ProgressBar({ value, tone = 'ok', label }: { value: number; tone?: Tone; label: string }) {
  return (
    <div className="bar" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${value}%`, background: `var(--${tone}-bar)` }} />
    </div>
  );
}

/** Real SHA-256 via Web Crypto (the on-chain anchoring is simulated). */
export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return '0x' + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const shortHash = (h: string) => `${h.slice(0, 8)}…${h.slice(-6)}`;

/** Illustrative QR-like grid (not a scannable QR). */
export function FakeQR({ cell = 8, seed = 7, label }: { cell?: number; seed?: number; label: string }) {
  const cells: boolean[] = [];
  for (let r = 0; r < 21; r++)
    for (let c = 0; c < 21; c++) {
      let f: boolean | null = null;
      for (const [r0, c0] of [[0, 0], [0, 14], [14, 0]]) {
        const y = r - r0, x = c - c0;
        if (y >= 0 && y < 7 && x >= 0 && x < 7) f = y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4);
      }
      cells.push(f ?? (r * seed + c * 13 + r * c) % 5 < 2);
    }
  return (
    <div role="img" aria-label={label} style={{ display: 'grid', gridTemplateColumns: `repeat(21, ${cell}px)`, gridAutoRows: cell, padding: 8, background: '#fff', border: '1px solid var(--line)', borderRadius: 8, width: 'fit-content' }}>
      {cells.map((on, i) => <span key={i} style={{ background: on ? 'var(--dark)' : '#fff' }} />)}
    </div>
  );
}
