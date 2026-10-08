/* පහේ හපන්නු — offline service worker.
   When the app is updated, change VERSION (e.g. v2, v3) so phones download the new files.
   Progress is kept in localStorage and is NOT affected by updates. */
const VERSION = 'v2';
const CACHE = 'phh-' + VERSION;
const FILES = [
  '/', '/index.html', '/manifest.json', '/privacy.html', '/favicon.png',
  '/icons/icon-192.png', '/icons/icon-512.png',
  '/icons/maskable-192.png', '/icons/maskable-512.png', '/icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('phh-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // The app page itself: use the saved copy (fast, offline, no repeated 10 MB downloads).
  // New versions arrive when VERSION above is changed.
  if (req.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html')) {
    e.respondWith(caches.match('/index.html').then(hit => hit || fetch(req)));
    return;
  }
  // Everything else: saved copy first, otherwise download and save it.
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
