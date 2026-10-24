/** A same-origin redirect. Old caches are selected by their request URLs, not names alone. */
export function legacyRedirect() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; connect-src 'self'; base-uri 'none'"><title>Career Navigator has moved</title></head><body><p>Moving you to the new address… <a href="../">Open Career Navigator</a></p><script src="./move.js"></script></body></html>`;
}

export const redirectScript = `
(async () => {
  const oldScope = new URL('./', location.href).href.split('#')[0];
  const target = new URL('../', oldScope);
  target.hash = location.hash;
  document.querySelector('a').href = target.href;
  try {
    if ('serviceWorker' in navigator) {
      for (const registration of await navigator.serviceWorker.getRegistrations()) {
        if (registration.scope === oldScope) await registration.unregister();
      }
    }
    if ('caches' in globalThis) {
      for (const name of await caches.keys()) {
        if (!name.startsWith('career-navigator-app-')) continue;
        const cache = await caches.open(name);
        const requests = await cache.keys();
        const old = requests.filter(request => request.url.startsWith(oldScope));
        if (old.length && old.length === requests.length) await caches.delete(name);
        else for (const request of old) await cache.delete(request);
      }
    }
  } catch (_) { /* Storage can be blocked. The link and redirect still work. */ }
  location.replace(target.href);
})();
`;
