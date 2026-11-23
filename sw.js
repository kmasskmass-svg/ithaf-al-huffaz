// يحفظ التطبيق في الجهاز ليعمل دون اتصال. يأخذ من الشبكة أولًا، فيصل كل تحديث وحده.
const V = 'ithaf-v5';
const CORE = ['./', './index.html', './app.html', './data.json', './app.webmanifest', './version.json', './ighatha.json', './quran.json', './og-image.jpg',
  './app-icon-192.png', './app-icon-512.png', './app-icon-180.png', './pdf.min.mjs', './pdf.worker.min.mjs', './fonts/AmiriQuran.ttf', './fonts/Amiri-Regular.ttf', './fonts/Amiri-Bold.ttf'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'ithaf-books').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // التلاوات من خارج الموقع لا تُحفظ
  if (/\.pdf$/.test(u.pathname) && e.request.headers.has('range')) return; // طلبات الأجزاء تذهب إلى الشبكة مباشرة
  if (/\.pdf$/.test(u.pathname)) {
    // الكتب: تُحفظ بعد أول فتح لها، فتُقرأ بعدها دون اتصال
    e.respondWith(caches.open('ithaf-books').then(async c => {
      const hit = await c.match(u.pathname);
      if (hit) return hit;
      const r = await fetch(e.request);
      if (r.ok && r.status === 200) c.put(u.pathname, r.clone());
      return r;
    }));
    return;
  }
  // بقية الملفات: الشبكة أولًا ليصل كل تحديث، والمحفوظ عند انقطاعها
  e.respondWith(fetch(new Request(e.request.url, {cache: 'no-cache', credentials: 'same-origin'})).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./app.html'))));
});
