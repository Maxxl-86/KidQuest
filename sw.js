// Cache-first service worker for KidQuest v5.2 (cache bump)
const CACHE = 'kidquest-v5.2';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './manifest.json',
  './assets/logo.svg', './assets/favicon.ico', './assets/icon-192.png', './assets/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(res => res || fetch(req).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => { if(req.method==='GET' && req.url.startsWith(self.location.origin)) c.put(req, copy); });
      return r;
    }).catch(()=>caches.match('./index.html')))
  );
});
