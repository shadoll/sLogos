// Basic service worker for caching static assets
// List of all files in the public folder to cache
const CACHE_NAME = 'pwa-cache-v5';

self.addEventListener('install', event => {
  event.waitUntil(
    fetch('/pwa-files-to-cache.json')
      .then(response => response.json())
      .then(files => {
        return caches.open(CACHE_NAME).then(cache => {
          return cache.addAll(files);
        });
      })
      .catch(err => {
        console.error('Failed to fetch pwa-files-to-cache.json', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Remove query params for cache matching for static files
  let cacheKey = url.pathname;
  // Only do this for files we know are static (e.g., /data/, /images/)
  if (cacheKey.startsWith('/data/') || cacheKey.startsWith('/images/')) {
    // ignore query params
  } else {
    cacheKey = event.request.url;
  }
  event.respondWith(
    caches.match(cacheKey).then(response => {
      if (response) return response;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return Response.error();
      });
    })
  );
});
