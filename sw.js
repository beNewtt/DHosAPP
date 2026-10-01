/* Dental Tracker — service worker
   ไม่ต้องแก้เลขเวอร์ชันอีกต่อไป:
   ออนไลน์ = ดึงจากเน็ตเสมอ (ได้ไฟล์ใหม่ล่าสุดทุกครั้ง) แล้วค่อยเก็บ cache ไว้
   ออฟไลน์ = ใช้ cache ที่เก็บไว้ครั้งล่าสุด                                   */
const CACHE = 'dental-tracker';
const SHELL = ['./', './index.html', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './icon-maskable.png'];

self.addEventListener('install', e => {
  self.skipWaiting();                                   // ใช้ตัวใหม่ทันที
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(SHELL))
    .catch(err => console.warn('[SW] precache', err)));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();                   // ลบ cache รุ่นเก่าทิ้ง
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;  // ข้าม Supabase / Google Fonts

  // network-first ทุกไฟล์ในโดเมนนี้ — ของใหม่มาก่อนเสมอ ไม่มีทางค้างเวอร์ชันเก่า
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req.mode === 'navigate' ? './index.html' : req, copy));
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req.mode === 'navigate' ? './index.html' : req);
      if (hit) return hit;
      throw err;
    }
  })());
});
