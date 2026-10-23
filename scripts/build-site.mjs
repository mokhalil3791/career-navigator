// @ts-check
/**
 * Assembles the GitHub Pages site in _site/:
 *   /            hosted v0.1 (patched copy, see scripts/lib/patch-v01.mjs)
 *   /prompts/    public prompt library, generated from content/prompts/
 *   /p/<slug>/   short links for slides, e.g. /p/cv
 *   /qr/         QR codes (SVG) for slides and the printed handout
 *   /next/       v1 app, when dist/ exists (Phase 1+; moved to / only after approval)
 * Run: npm run build:site
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readPrompts, readProviders } from './lib/content.mjs';
import { patchV01 } from './lib/patch-v01.mjs';
import { renderPromptsPage, renderShortLink } from './lib/prompts-page.mjs';

const OUT = join(ROOT, '_site');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const v01 = readFileSync(join(ROOT, 'reference', 'v0.1', 'Career_Navigator.html'), 'utf8');
writeFileSync(join(OUT, 'index.html'), patchV01(v01));

const prompts = readPrompts();
mkdirSync(join(OUT, 'prompts'), { recursive: true });
writeFileSync(join(OUT, 'prompts', 'index.html'), renderPromptsPage(prompts, readProviders()));
cpSync(join(ROOT, 'site', 'prompts'), join(OUT, 'prompts'), { recursive: true });

for (const p of prompts) {
  mkdirSync(join(OUT, 'p', p.slug), { recursive: true });
  writeFileSync(join(OUT, 'p', p.slug, 'index.html'), renderShortLink(p.slug));
}

cpSync(join(ROOT, 'assets', 'qr'), join(OUT, 'qr'), { recursive: true });

const dist = join(ROOT, 'dist');
if (existsSync(join(dist, 'index.html'))) cpSync(dist, join(OUT, 'next'), { recursive: true });

// GitHub Pages: serve files starting with "_" and skip Jekyll processing.
writeFileSync(join(OUT, '.nojekyll'), '');
console.log('Site written to _site/ (' + prompts.length + ' prompts' + (existsSync(join(OUT, 'next')) ? ', v1 at /next/' : '') + ')');
