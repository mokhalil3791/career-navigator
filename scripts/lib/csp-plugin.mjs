// @ts-check
/**
 * Adds the Content-Security-Policy to the BUILT index.html (NFR-SEC-1).
 * Not added in `vite dev`, because the dev server injects inline styles.
 *
 * connect-src is generated from config/providers.json: the app's own origin plus
 * the hosts of the free AI providers it supports. The browser therefore cannot
 * contact anything else. In addition, src/ai/net.js refuses any provider the
 * user has not enabled and confirmed in this session.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const providersPath = fileURLToPath(new URL('../../config/providers.json', import.meta.url));

/** @returns {string[]} origins the app may connect to */
export function connectSources() {
  const config = JSON.parse(readFileSync(providersPath, 'utf8'));
  const hosts = new Set(["'self'"]);
  for (const p of config.api || []) for (const origin of p.connect || []) hosts.add(origin);
  return [...hosts];
}

/** @returns {string} the full policy */
export function contentSecurityPolicy() {
  return [
    "default-src 'none'",
    // 'wasm-unsafe-eval' lets the in-browser model (WebLLM) run WebAssembly. It does not allow JavaScript eval.
    "script-src 'self' 'wasm-unsafe-eval'",
    "style-src 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    'connect-src ' + connectSources().join(' '),
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
  ].join('; ');
}

/** @returns {import('vite').Plugin} */
export function cspPlugin() {
  return {
    name: 'career-navigator-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy()}">`);
    },
  };
}
