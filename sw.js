/* Service worker: guarda la app y los 18 capítulos para leer sin conexión */
const VERSION = 'bh-mateo-v1';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/chapters.js',
  'js/card.js',
  'js/app.js',
  'vendor/qrcode.js',
  'img/logo-banner.png',
  'img/logo-mark.png',
  'img/icon-192.png',
  'img/icon-512.png',
  'img/apple-touch-icon.png',
  'fonts/cormorant-garamond-latin-500-italic.woff2',
  'fonts/cormorant-garamond-latin-500-normal.woff2',
  'fonts/cormorant-garamond-latin-600-normal.woff2',
  'fonts/cormorant-garamond-latin-700-normal.woff2',
  'fonts/cormorant-garamond-latin-ext-600-normal.woff2',
  'fonts/frank-ruhl-libre-hebrew-400-normal.woff2',
  'fonts/frank-ruhl-libre-hebrew-700-normal.woff2',
  'fonts/literata-latin-400-italic.woff2',
  'fonts/literata-latin-400-normal.woff2',
  'fonts/literata-latin-600-normal.woff2',
  'fonts/literata-latin-700-normal.woff2',
  'fonts/literata-latin-ext-400-normal.woff2',
  'data/mateo-1.json',
  'data/mateo-2.json',
  'data/mateo-3.json',
  'data/mateo-4.json',
  'data/mateo-5.json',
  'data/mateo-6.json',
  'data/mateo-7.json',
  'data/mateo-8.json',
  'data/mateo-9.json',
  'data/mateo-10.json',
  'data/mateo-11.json',
  'data/mateo-12.json',
  'data/mateo-13.json',
  'data/mateo-14.json',
  'data/mateo-15.json',
  'data/mateo-16.json',
  'data/mateo-17.json',
  'data/mateo-18.json'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const url = new URL(req.url);
  // Páginas: primero la red, si no hay conexión usa la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  // PDF y tarjetas: se guardan la primera vez que se abren
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.pathname.includes('/pdf/') || url.pathname.includes('/img/') || url.pathname.includes('/data/'))) {
      const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c));
    }
    return r;
  })));
});
