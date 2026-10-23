// @ts-check
/**
 * CI content checks (run after the build):
 *  - FR-KNW-4: WARN when a knowledge card's lastReviewed date is older than 12 months.
 *  - NFR-I18N: report translation coverage per interface language.
 *  - NFR-PERF-2: FAIL when the app shell (HTML + JS + CSS loaded at start, gzipped) exceeds 300 KB.
 * Run: node scripts/check-content.mjs
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { ROOT } from './lib/content.mjs';
import { parseFrontmatter } from '../src/content/frontmatter.js';
import { extractStrings } from './lib/i18n-strings.mjs';

let failed = false;
const today = new Date();

// 1. Knowledge card freshness
const knowledge = join(ROOT, 'content', 'knowledge');
if (existsSync(knowledge)) {
  for (const lang of readdirSync(knowledge)) {
    for (const file of readdirSync(join(knowledge, lang)).filter((f) => f.endsWith('.md'))) {
      const { data } = parseFrontmatter(readFileSync(join(knowledge, lang, file), 'utf8'));
      const reviewed = new Date(String(data.lastReviewed));
      const months = (today.getTime() - reviewed.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      if (!(months <= 12)) console.log(`::warning file=content/knowledge/${lang}/${file}::Knowledge card last reviewed ${data.lastReviewed} (older than 12 months). Please re-check its sources.`);
    }
  }
}

// 2. Translation coverage
const english = extractStrings();
for (const file of readdirSync(join(ROOT, 'src', 'i18n')).filter((f) => f.endsWith('.json'))) {
  const { _meta, ...strings } = JSON.parse(readFileSync(join(ROOT, 'src', 'i18n', file), 'utf8'));
  const done = english.filter((s) => strings[s]).length;
  console.log(`Translation ${file}: ${done}/${english.length} strings (${Math.round((done / english.length) * 100)}% coverage)${_meta?.machineTranslated ? ', machine-assisted, awaiting fluent review' : ''}`);
}

// 3. App shell budget
const dist = join(ROOT, 'dist');
if (existsSync(join(dist, 'index.html'))) {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="\.\/(assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]);
  let total = gzipSync(html).length;
  for (const a of assets) total += gzipSync(readFileSync(join(dist, a))).length;
  console.log(`App shell: ${(total / 1024).toFixed(1)} KB gzipped (budget 300 KB; lazy modules and WebLLM excluded)`);
  if (total > 300 * 1024) { console.log('::error::App shell is over the 300 KB budget (NFR-PERF-2)'); failed = true; }
  const lazy = readdirSync(join(dist, 'assets')).filter((f) => !assets.includes('assets/' + f));
  const lazySize = lazy.reduce((n, f) => n + statSync(join(dist, 'assets', f)).size, 0);
  console.log(`Lazy-loaded files: ${lazy.length} (${(lazySize / 1024 / 1024).toFixed(1)} MB uncompressed, loaded only when used)`);
}

if (failed) process.exit(1);
