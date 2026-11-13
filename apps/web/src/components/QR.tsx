import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Real, scannable QR code (rendered to a data URL). */
export default function QR({ value, size = 160, label }: { value: string; size?: number; label: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: size * 2, color: { dark: '#13261C', light: '#FFFFFF' } })
      .then((u) => alive && setSrc(u))
      .catch(() => alive && setSrc(''));
    return () => { alive = false; };
  }, [value, size]);
  return src
    ? <img src={src} alt={label} width={size} height={size} style={{ display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: 8 }} />
    : <div role="img" aria-label={label} style={{ width: size, height: size, background: 'var(--bg)', borderRadius: 8 }} />;
}
