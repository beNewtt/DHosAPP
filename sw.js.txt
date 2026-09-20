const VERSION = 'v1.0.0';            // ← เปลี่ยนทุกครั้งที่แก้ index.html
const CACHE   = `dental-tracker-${VERSION}`;
const SHELL = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(err => console.warn('[SW]', err)));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // ข้าม Supabase / Google Fonts

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => { caches.open(CACHE).then(c => c.put('./index.html', res.clone())); return res; })
                .catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => hit))
  );
});