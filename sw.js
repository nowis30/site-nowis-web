/**
 * Service Worker - PWA Création NOWIS
 * Stratégie: Network-first pour le contenu, cache-first pour les assets
 * Support: Offline mode, installation PWA, mise à jour automatique
 */

const VERSION = 'v1.0';
const STATIC_CACHE = `creation-nowis-static-${VERSION}`;
const DYNAMIC_CACHE = `creation-nowis-dynamic-${VERSION}`;

// Assets à pré-cacher à l'installation
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

/**
 * Installation - Pré-cache des assets critiques
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Installation error:', err))
  );
});

/**
 * Activation - Nettoyage des anciens caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('nowis-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch - Stratégies de cache intelligentes
 * - Network-first: Contenu (HTML, JSON)
 * - Cache-first: Assets (CSS, JS, images)
 * - Offline fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP et les requêtes cross-origin
  if (!url.protocol.startsWith('http') || url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests - Network-first avec fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache les réponses valides
          if (response.ok) {
            const copy = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // Fallback: retourner la page d'accueil en cache
          return caches.match('/') ||
            new Response('Hors ligne - Réessaye plus tard', { status: 503 });
        })
    );
    return;
  }

  // API/JSON requests - Network-first
  if (request.headers.get('Accept')?.includes('application/json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Assets (CSS, JS, images, fonts) - Cache-first
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) return cached;
        
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => {
            // Placeholder pour images manquantes
            if (request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#333" width="100" height="100"/><text fill="#666" x="50%" y="50%" text-anchor="middle" dy=".3em">Image</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            return new Response('Ressource non disponible', { status: 404 });
          });
      })
  );
});

/**
 * Message Handler - Communication avec le client
 * Permet au service worker de notifier l'app de mises à jour
 */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

