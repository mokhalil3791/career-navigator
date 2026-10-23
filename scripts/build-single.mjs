// @ts-check
/**
 * Builds the single-file release: one HTML file with everything inside (except
 * WebLLM), for workshop USB sticks and offline sharing. It opens straight from
 * the file system. The CSP stays strict: inline code is allowed only by its
 * SHA-256 hash, never with 'unsafe-inline'.
 * Run: node scripts/build-single.mjs  →  release/career-navigator-<version>.html
 */
import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/content.mjs';
import { connectSources } from './lib/csp-plugin.mjs';

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const OUT = join(ROOT, 'dist-single');

process.env.VITE_SINGLE_FILE = '1';
await build({
  root: ROOT,
  configFile: false,
  base: './',
  logLevel: 'warn',
  define: { 'import.meta.env.VITE_SINGLE_FILE': JSON.stringify('1') },
  resolve: { alias: { '@mlc-ai/web-llm': join(ROOT, 'src', 'ai', 'providers', 'webllm-unavailable.js') } },
  plugins: [viteSingleFile({ removeViteModuleLoader: true })],
  build: { outDir: OUT, emptyOutDir: true, target: 'es2022', assetsInlineLimit: 100_000_000, cssCodeSplit: false, modulePreload: false },
});

let html = readFileSync(join(OUT, 'index.html'), 'utf8');
/** @param {string} s */
const hash = (s) => "'sha256-" + createHash('sha256').update(s, 'utf8').digest('base64') + "'";
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => hash(m[1]));
const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => hash(m[1]));
const csp = [
  "default-src 'none'",
  `script-src ${scripts.join(' ')}`,
  `style-src ${styles.join(' ')}`,
  "img-src 'self' data: blob:",
  'connect-src ' + connectSources().filter((s) => s !== "'self'" && !s.includes('huggingface') && !s.includes('hf.co') && !s.includes('githubusercontent')).join(' '),
  "worker-src blob:",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');
html = html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${csp}">`)
  .replace(/<link rel="manifest"[^>]*>/, '')
  .replace(/<link rel="icon"[^>]*>/, '');
mkdirSync(join(ROOT, 'release'), { recursive: true });
const file = join(ROOT, 'release', `career-navigator-${pkg.version}.html`);
writeFileSync(file, html);
console.log(`Single-file build: ${file} (${(html.length / 1024 / 1024).toFixed(1)} MB, ${scripts.length} inline script(s) hashed)`);
