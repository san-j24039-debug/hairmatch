const CACHE = 'hairmatch-runtime-v1';
const APP_SHELL = [
  './', './index.html', './css/style.css', './js/app.js',
  './manifest.webmanifest', './data/products.json',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
        return response;
      })
      .catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html')))
  );
});
