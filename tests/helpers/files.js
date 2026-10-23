// @ts-check
/** Lists repo text files for guardrail scans. */
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from '../../scripts/lib/content.mjs';

const TEXT = /\.(js|mjs|json|md|html|css|txt|svg)$/;

/**
 * @param {string[]} dirs folders relative to the repo root
 * @param {{ exclude?: string[] }} [options] relative path prefixes to skip
 * @returns {string[]} relative paths with forward slashes
 */
export function allTextFiles(dirs, options = {}) {
  const exclude = options.exclude || [];
  /** @type {string[]} */
  const out = [];
  /** @param {string} dir */
  function walk(dir) {
    let names = [];
    try { names = readdirSync(dir); } catch { return; }
    for (const name of names) {
      const full = join(dir, name);
      const rel = relative(ROOT, full).replace(/\\/g, '/');
      if (exclude.some((e) => rel.startsWith(e)) || name === 'node_modules') continue;
      if (statSync(full).isDirectory()) walk(full);
      else if (TEXT.test(name)) out.push(rel);
    }
  }
  for (const d of dirs) walk(join(ROOT, d));
  return out;
}
