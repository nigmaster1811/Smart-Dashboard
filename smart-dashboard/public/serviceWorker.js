const CACHE_NAME = 'smart-dashboard-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/styles/main.css',
  '/src/main.js',
  '/src/core/router.js',
  '/src/core/authService.js',
  '/src/core/dataService.js',
  '/src/core/cacheService.js',
  '/src/core/notificationService.js',
  '/src/core/uiContainer.js',
  '/src/modules/tasks/tasks.js',
  '/src/modules/tasks/tasksUI.js',
  '/src/modules/tasks/tasks.css',
  '/src/modules/notes/notes.js',
  '/src/modules/notes/notesUI.js',
  '/src/modules/notes/notes.css',
  '/src/modules/tracker/tracker.js',
  '/src/modules/tracker/trackerUI.js',
  '/src/modules/tracker/tracker.css',

  // ДОБАВЛЕНО: иконки PWA
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});