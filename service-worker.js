const CACHE = 'hairmatch-runtime-v3';
const APP_SHELL = [
  './', './index.html', './css/style.css', './js/app.js',
  './manifest.webmanifest', './data/products.json',
  './js/catalog.js', './js/products.js', './js/questions.js', './js/diagnosis.js', './js/ui.js',
  './js/favorites.js', './js/history.js', './js/history-tools.js', './js/ingredients.js',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('hairmatch-') && key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request,{cache:'no-cache'})
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
        }
        return response;
      })
      .catch(async () => (await caches.match(event.request)) ||
        (event.request.mode === 'navigate' ? await caches.match('./index.html') : Response.error()))
  );
});
