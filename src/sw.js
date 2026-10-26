// Career Navigator service worker: makes the app work offline (installable PWA).
// It caches ONLY the app's own files (HTML, JS, CSS, icons), never your workspace,
// and never answers for other websites. "Delete everything" removes these caches.
// __PRECACHE__ and __VERSION__ are filled in at build time (scripts/lib/sw-plugin.mjs).
/* eslint-disable no-restricted-globals */
const VERSION = '__VERSION__';
const CACHE = 'career-navigator-app-' + VERSION;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  // Remove app caches from older versions (other caches, such as the WebLLM model, are kept).
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('career-navigator-app-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Only same-origin GET requests for app files. AI providers and model downloads pass straight through.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    // Network first for the page, so updates arrive; cached page when offline.
    event.respondWith(fetch(request).catch(async () =>
      await caches.match(request, { ignoreSearch: true }) ||
      await caches.match(new URL('./', self.registration.scope).href) ||
      await caches.match('index.html')));
    return;
  }
  // Cache first for versioned assets; lazy files (pdf.js, WebLLM library) are cached on first use.
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && url.pathname.includes('/assets/')) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  })));
});
