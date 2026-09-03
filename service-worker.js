const CACHE='cct-sicomercio-25-26-v2';
const ASSETS=['./','index.html','style.css','app.js','data.js','manifest.webmanifest','icon-192.png','icon-512.png','logo-sicomercio.png'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(cache => cache.put('./', copy));
          return resp;
        })
        .catch(() => caches.match('./'))
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
        return resp;
      })
      .catch(() => caches.match(req))
  );
});
