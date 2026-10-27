// Cache simple : le jeu s'ouvre même avec un réseau faible (le mode en ligne exige Internet).
const CACHE = 'parchesi-arcanes-v4-1';
const LOCAL = ['./index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(LOCAL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('parchesi-arcanes-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.endsWith('peerjs.com')) return;
  const cdn = /unpkg\.com|jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u.hostname);
  if (u.origin !== location.origin && !cdn) return;
  // réseau d'abord pour la page, cache d'abord pour les bibliothèques
  if (cdn) e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res; })));
  else e.respondWith(fetch(e.request).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
