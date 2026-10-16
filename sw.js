const CACHE_NAME = 'mrsaldo-v1-modular';
const ASSETS = [
  './', 
  './index.html', 
  './manifest.json', 
  './assets/icon.png',
  './css/style.css',
  './js/store.js',
  './js/finance.js',
  './js/ui.js',
  './js/app.js'
];

self.addEventListener('install', e => {
  // Força a atualização do Service Worker imediatamente
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  // Limpeza de Caches Antigos (Fundamental para atualizações no código JS e CSS)
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});