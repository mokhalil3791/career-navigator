// @ts-check
/**
 * Minimal static file server for _site/ (used by end-to-end tests and for
 * trying the full Pages site locally). No dependencies.
 * Run: node scripts/serve.mjs [port]   then open http://localhost:4174/
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { ROOT } from './lib/content.mjs';

const SITE = join(ROOT, '_site');
const PORT = Number(process.argv[2] || 4174);
/** @type {Record<string, string>} */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.png': 'image/png', '.txt': 'text/plain', '.ics': 'text/calendar' };

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let path = normalize(join(SITE, decodeURIComponent(url.pathname)));
    if (!path.startsWith(SITE)) { res.writeHead(403).end(); return; }
    // The real site lives under /career-navigator/; tests also use the bare paths.
    path = path.replace(join(SITE, 'career-navigator'), SITE);
    const info = await stat(path).catch(() => null);
    if (info?.isDirectory()) path = join(path, 'index.html');
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch (_) {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}).listen(PORT, () => console.log('Serving _site/ at http://localhost:' + PORT + '/'));
