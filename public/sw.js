/** Retire legacy offline caches that could keep the three-song fallback player. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith('creation-nowis-') || key.startsWith('nowis-'))
      .map((key) => caches.delete(key)));
    // Claim existing pages with a worker that does not intercept requests.
    // Do not force a reload: a visitor may be filling out a form.
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
