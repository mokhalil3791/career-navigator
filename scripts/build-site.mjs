// @ts-check
/**
 * Assembles the GitHub Pages site in _site/:
 *   /            v1 app
 *   /prompts/    public prompt library, generated from content/prompts/
 *   /p/<slug>/   short links for slides, e.g. /p/cv
 *   /qr/         QR codes (SVG) for slides and the printed handout
 *   /next/       old-address redirect only
 * Run: npm run build:site
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readPrompts, readProviders, readAllPrompts } from './lib/content.mjs';
import { legacyRedirect, redirectScript } from './lib/legacy-redirect.mjs';
import { renderPromptsPage, renderShortLink } from './lib/prompts-page.mjs';

const OUT = join(ROOT, '_site');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const dist = join(ROOT, 'dist');
if (!existsSync(join(dist, 'index.html'))) throw new Error('Build the app before assembling the site.');
cpSync(dist, OUT, { recursive: true });

const prompts = readPrompts();
mkdirSync(join(OUT, 'prompts'), { recursive: true });
writeFileSync(join(OUT, 'prompts', 'index.html'), renderPromptsPage(prompts, readProviders(), readAllPrompts().find((p) => p.id === 'template')));
cpSync(join(ROOT, 'site', 'prompts'), join(OUT, 'prompts'), { recursive: true });

for (const p of prompts) {
  mkdirSync(join(OUT, 'p', p.slug), { recursive: true });
  writeFileSync(join(OUT, 'p', p.slug, 'index.html'), renderShortLink(p.slug));
}

cpSync(join(ROOT, 'assets', 'qr'), join(OUT, 'qr'), { recursive: true });
cpSync(join(ROOT, 'site', 'handout'), join(OUT, 'handout'), { recursive: true });
cpSync(join(ROOT, 'site', 'kit'), join(OUT, 'kit'), { recursive: true });
for (const [slug, target] of Object.entries({ kit: '../../kit/', ex2: '../../kit/#example2' })) {
  mkdirSync(join(OUT, 'p', slug), { recursive: true });
  writeFileSync(join(OUT, 'p', slug, 'index.html'), renderShortLink(slug, target));
}
// These static pages are assembled after Vite. Add their files only to the hosted
// worker, so a standalone dist build never tries to cache files it does not have.
const swPath = join(OUT, 'sw.js');
writeFileSync(swPath, readFileSync(swPath, 'utf8').replace(/const PRECACHE = (\[[^;]+\]);/, (_match, list) =>
  'const PRECACHE = ' + JSON.stringify([...JSON.parse(list), 'kit/', 'kit/index.html', 'kit/kit.js', 'kit/kit.css']) + ';'));

mkdirSync(join(OUT, 'next'), { recursive: true });
writeFileSync(join(OUT, 'next', 'index.html'), legacyRedirect());
writeFileSync(join(OUT, 'next', 'move.js'), redirectScript);

// GitHub Pages: serve files starting with "_" and skip Jekyll processing.
writeFileSync(join(OUT, '.nojekyll'), '');
console.log('Site written to _site/ (' + prompts.length + ' prompts, v1 at root)');
