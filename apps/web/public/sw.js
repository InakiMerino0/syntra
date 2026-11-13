/* Syntra service worker: lets the app open and work in the field without signal.
 * - Precache: index.html, manifest, icons.
 * - Navigations: network-first, falling back to the cached index.html (SPA routes open offline).
 * - Same-origin static assets (JS/CSS/fonts/images): cache-first, runtime-cached (hashed filenames never go stale).
 * - Map tiles: not cached here (satellite tiles are heavy); only a small LRU-ish cache of recent ones.
 */
const VERSION = 'syntra-v1';
const TILES = 'syntra-tiles-v1';
const MAX_TILES = 300;
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== TILES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trimTiles() {
  const c = await caches.open(TILES);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await c.delete(keys[i]); // oldest inserted first
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('/index.html', copy)); return res; })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    );
    return;
  }

  if (url.origin !== self.location.origin) {
    if (/tile|arcgisonline/.test(url.hostname + url.pathname)) {
      e.respondWith(
        caches.open(TILES).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
          if (res.ok || res.type === 'opaque') { c.put(req, res.clone()).then(trimTiles); }
          return res;
        }))),
      );
    } else if (/fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
      e.respondWith(
        caches.open(VERSION).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }))),
      );
    }
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    })),
  );
});
