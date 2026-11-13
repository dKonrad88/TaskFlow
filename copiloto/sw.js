/* Copiloto — cache da pasta. Escopo publicado: /TaskFlow/copiloto/ */
const C = 'copiloto-v3';
const A = [
  './',
  'index.html',
  'manifest.json',
  'temas.css',
  'app.css',
  'js/app.js',
  'js/dados.js',
  'js/config.js',
  'js/contrato.js',
  'js/adaptador-mock.js',
  'js/adaptador-supabase.js',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png',
  'apple-touch-icon.png',
  'favicon-32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(C).then((c) => Promise.all(A.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((chaves) => Promise.all(chaves.filter((x) => x !== C && x.startsWith('copiloto-')).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== location.origin) return;
  if (!u.pathname.includes('/copiloto/')) return;
  if (u.pathname.endsWith('/sw.js')) return;
  const html = req.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html');
  if (html) {
    e.respondWith(fetch(req, { cache: 'no-store' }).then((r) => {
      if (r.ok) {
        const copia = r.clone();
        caches.open(C).then((c) => c.put('index.html', copia));
      }
      return r;
    }).catch(() => caches.match('index.html').then((m) => m || caches.match('./'))));
    return;
  }
  e.respondWith(caches.open(C).then((c) => c.match(req).then((m) => {
    const rede = fetch(req, { cache: 'no-cache' }).then((r) => {
      if (r.ok) c.put(req, r.clone());
      return r;
    }).catch(() => m);
    return m || rede;
  })));
});
