/* Gravador — service worker. Atualização automática:
   - HTML/navegação: network-first com cache:'no-store' (sempre a versão publicada quando online; cache só offline).
   - sw.js nunca é cacheado aqui; registrado com updateViaCache:'none'.
   - Supabase/CDNs (outra origem): não passam pelo SW.
   - Demais arquivos da mesma pasta: stale-while-revalidate. */
const C='gravador-v18',A=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-512-maskable.png','apple-touch-icon.png','favicon.ico','favicon-32.png','logo.png','bg.jpg'];
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(A.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x.indexOf('gravador-')===0).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);
 if(u.origin!==location.origin||!u.pathname.includes('/gravador/'))return;
 if(u.pathname.endsWith('/sw.js'))return;
 const isHtml=req.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('.html');
 if(isHtml){e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put('index.html',c))}return r}).catch(()=>caches.match('index.html').then(m=>m||caches.match('./'))));return}
 e.respondWith(caches.open(C).then(c=>c.match(req).then(m=>{const f=fetch(req,{cache:'no-cache'}).then(r=>{if(r.ok)c.put(req,r.clone());return r}).catch(()=>m);return m||f})))});
