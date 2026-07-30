/*
 * MTalk service worker — NETWORK-FIRST with cache fallback.
 * Fresh version whenever online; cached copy keeps the app working offline.
 * (v1 was cache-first, which pinned users to the first version they loaded.)
 */
const CACHE = 'mtalk-v3';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim())
      // Force-reload any page still showing a version served by the old
      // cache-first worker, so users never have to know about "reload twice"
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) =>
        Promise.all(
          clients.map((client) => client.navigate(client.url).catch(() => undefined)),
        ),
      ),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached ?? caches.match('/'))
          .then((cached) => cached ?? Response.error()),
      ),
  );
});
