/* Nuflow Reline App — service worker
   - App shell + field tools are saved on install, so the tools work with no signal.
   - Online: always tries the network first for the latest version, but gives up
     after a few seconds and uses the saved copy (handy on patchy job-site signal).
   - Circle, the shop and other sites always go straight to the network.
   Bump CACHE when you want to force-clear old copies. */
const CACHE = 'nuflow-tech-v7';
const NET_TIMEOUT = 3500; // ms to wait on a slow connection before using the saved copy

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './tools/resin_usage_calculator.html',
  './tools/resin-cure-times.html',
  './tools/nuflow-bladder-pressure.html',
  './tools/nuflow-safe-depth-html.html',
  './tools/impregliner_uv_curing.html'
];

// Logos and fonts the tools load from other sites — saved so tools look right offline
const EXTERNAL = [
  'https://nuflow.net/wp-content/uploads/2022/05/Nuflow-Logo-Pos-RGB.png',
  'https://www.impreg.de/wpi/wp-content/uploads/2020/12/impreg-group-white.svg',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;900&display=swap'
];
const ASSET_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'nuflow.net', 'www.impreg.de'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
    await Promise.all(EXTERNAL.map(u =>
      fetch(new Request(u, { mode: 'no-cors' })).then(r => c.put(u, r)).catch(() => {})));
  })());
  self.skipWaiting();
});

// The app asks for a refresh each time it opens with signal, so saved tools stay current
self.addEventListener('message', e => {
  if (e.data === 'refresh') {
    e.waitUntil(caches.open(CACHE).then(c =>
      Promise.all(SHELL.map(u => fetch(u, { cache: 'no-store' })
        .then(r => r.ok && c.put(u, r)).catch(() => {})))));
  }
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(r => { clearTimeout(t); resolve(r); }, err => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // This app's own files (app, tools, posts): network first, saved copy as fallback
  if (url.origin === location.origin) {
    const net = fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    });
    e.respondWith(
      withTimeout(net, NET_TIMEOUT)
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then(r => r || net)                                   // nothing saved: keep waiting on the network
          .catch(() => caches.match('./index.html')))
    );
    return;
  }

  // Tool logos and fonts: saved copy first, refresh in the background
  if (ASSET_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; });
      return hit || net;
    }));
  }
  // Everything else (Circle, shop, social links) goes straight to the network.
});
