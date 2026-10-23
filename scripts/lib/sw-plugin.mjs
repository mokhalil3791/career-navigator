// @ts-check
/**
 * Writes dist/sw.js from src/sw.js with the list of files to precache
 * (the app shell: HTML, entry JS/CSS, icon, manifest). Big lazy files
 * (WebLLM library, pdf.js) are not precached; they are cached on first use.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pkg from '../../package.json' with { type: 'json' };

const source = fileURLToPath(new URL('../../src/sw.js', import.meta.url));

/** @returns {import('vite').Plugin} */
export function swPlugin() {
  return {
    name: 'career-navigator-sw',
    apply: 'build',
    generateBundle(_options, bundle) {
      const shell = Object.values(bundle)
        .filter((f) => f.type === 'asset' ? /\.(css|svg|webmanifest)$/.test(f.fileName) : /** @type {any} */ (f).isEntry || /** @type {any} */ (f).isDynamicEntry === false)
        .map((f) => f.fileName)
        .filter((name) => !/lib-|pdf\.worker|pdf-/.test(name));
      const precache = ['./', 'index.html', 'icon.svg', 'manifest.webmanifest', ...shell].filter((v, i, a) => a.indexOf(v) === i);
      const code = readFileSync(source, 'utf8')
        .replace("const VERSION = '__VERSION__';", "const VERSION = '" + pkg.version + '-' + Date.now().toString(36) + "';")
        .replace('const PRECACHE = __PRECACHE__;', 'const PRECACHE = ' + JSON.stringify(precache) + ';');
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: code });
    },
  };
}
