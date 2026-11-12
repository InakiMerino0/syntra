import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './styles.css';

export type Tone = 'ok' | 'warn' | 'bad';

export function Logo({ size = 28, color = '#7BC59A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 2 L25 8.5 V19.5 L14 26 L3 19.5 V8.5 Z" fill="none" stroke={color} strokeWidth="2" />
      <path d="M9 16 C11 10, 17 9, 19 12 C16 13, 13 15, 12 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export const NAV = [
  { to: '/panel', label: 'Panel' },
  { to: '/mapa', label: 'Mapa y lotes' },
  { to: '/trazabilidad', label: 'Trazabilidad' },
  { to: '/pasaporte', label: 'Pasaporte' },
  { to: '/accion', label: 'Registrar acción' },
];

export function Sidebar() {
  return (
    <nav aria-label="Principal" className="sidebar">
      <NavLink to="/panel" className="sidebar-logo"><Logo />Synta</NavLink>
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} className="nav-link">{n.label}</NavLink>
      ))}
      <div className="sidebar-foot">Datos de demostración</div>
    </nav>
  );
}

/** Layout for every screen except the landing: fixed sidebar + routed content. */
export function AppLayout() {
  return (
    <div className="app">
      <Sidebar />
      <main className="content"><Outlet /></main>
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
