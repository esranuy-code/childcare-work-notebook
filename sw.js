const cachePrefix = 'childcare-notebook-';
const cacheName = cachePrefix + 'v11';
const scope = self.registration.scope;
const shell = new URL('./', scope).href;
const shellFiles = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    for (const file of shellFiles) {
      const url = new URL(file, scope).href;
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok || response.redirected) throw new Error('Unavailable app asset: ' + file);
      await cache.put(url, response);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(cachePrefix) && name !== cacheName).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== new URL(scope).origin) return;
  if (url.href !== shell && url.href !== new URL('./index.html', scope).href) return;
  event.respondWith(fetch(request).catch(async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(shell) || Response.error();
  }));
});
