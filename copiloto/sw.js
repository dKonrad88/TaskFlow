/* Copiloto — cache da pasta. Escopo publicado: /TaskFlow/copiloto/ */
const C = 'copiloto-v14';
const A = [
  './',
  'index.html',
  'manifest.json',
  'temas.css',
  'app.css',
  'js/app.js',
  'js/dados.js',
  'js/config.js',
  'js/prefs.js',
  'js/versao.js',
  'assets/fundo-familia.webp',
  'js/contrato.js',
  'js/adaptador-mock.js',
  'js/adaptador-supabase.js',
  'vendor/supabase-js-2.119.0.js',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png',
  'apple-touch-icon.png',
  'favicon-32.png',
];

function redePrimeiro(caminho) {
  const p = String(caminho || '').split('?')[0].toLowerCase();
  if (p.includes('/vendor/')) return false;
  return p.endsWith('.js') || p.endsWith('.css');
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(C).then((c) => Promise.all(A.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))));
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((chaves) => Promise.all(chaves.filter((x) => x !== C && x.startsWith('copiloto-')).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});

/**
 * Avisa as janelas quando um JS ou CSS mudou. A janela que pediu o arquivo ao
 * carregar a página (pulaId) já recebe a versão nova e não precisa do aviso.
 */
async function avisarSeMudou(cache, req, resposta, pulaId) {
  if (!redePrimeiro(new URL(req.url).pathname)) return;
  const antiga = await cache.match(req);
  if (!antiga) return;
  const [a, b] = await Promise.all([antiga.clone().text(), resposta.clone().text()]);
  if (a === b) return;
  const clientes = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const c of clientes) {
    if (pulaId && c.id === pulaId) continue;
    c.postMessage({ tipo: 'versao' });
  }
}

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
  if (redePrimeiro(u.pathname)) {
    const daPagina = req.destination === 'script' || req.destination === 'style';
    const pulaId = daPagina ? (e.clientId || e.resultingClientId || '') : '';
    e.respondWith(caches.open(C).then(async (c) => {
      try {
        const rede = await fetch(req, { cache: 'no-cache' });
        if (rede.ok) {
          await avisarSeMudou(c, req, rede, pulaId);
          await c.put(req, rede.clone());
        }
        return rede;
      } catch {
        const m = await c.match(req);
        return m || new Response('', { status: 504, statusText: 'offline' });
      }
    }));
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
