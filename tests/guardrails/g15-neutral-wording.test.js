// G15: neutral prompts and interface prose. G14 continues to protect workspace URLs.
// Official organisation names and source URLs in knowledge cards are preserved.
import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { extractStrings } from '../../scripts/lib/i18n-strings.mjs';
import { readAllPrompts, readProviders } from '../../scripts/lib/content.mjs';
import { renderPromptsPage } from '../../scripts/lib/prompts-page.mjs';
import { buildLibraryPrompt } from '../../src/core/library.js';
import { buildPrompt } from '../../src/core/prompts.js';
import { buildTaskPrompt, SCHEMAS } from '../../src/ai/tasks.js';
import { content } from '../../src/content/index.js';
import { newWorkspace } from '../../src/core/schema.js';
import { allTextFiles } from '../helpers/files.js';
import { ROOT } from '../../scripts/lib/content.mjs';
import { join } from 'node:path';

const banned = /refugee|asylum|status[\s-]+holder|statushouder|vluchteling|immigration|residence[\s-]+permit|work[\s-]+authorisation/i;
it('G15: every prompt and English/Dutch interface string uses neutral wording', () => {
  const prompts = readAllPrompts();
  const publicPrompts = prompts.filter((p) => p.library !== false);
  const prose = [
    ...extractStrings(),
    ...Object.values(JSON.parse(readFileSync(new URL('../../src/i18n/nl.json', import.meta.url), 'utf8'))).filter((v) => typeof v === 'string'),
    ...prompts.flatMap((p) => [p.title, p.summary, p.task, buildLibraryPrompt(p)]),
    ...publicPrompts.map((p) => buildPrompt(p.id, newWorkspace(), content)),
    ...Object.keys(SCHEMAS).map((id) => buildTaskPrompt(id, newWorkspace(), content)),
    renderPromptsPage(publicPrompts, readProviders()),
  ];
  for (const text of prose) expect(text).not.toMatch(banned);
  // Scan untranslated/static prose too. Knowledge source material and the immutable
  // original workshop references are outside the approved prompts/interface scope.
  for (const file of allTextFiles(['src', 'site', 'config', 'content/prompts'], { exclude: ['content/prompts/originals'] })) {
    const text = readFileSync(join(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(text, file).not.toMatch(banned);
  }
});

it('G15 detects every prohibited term, including hyphenated variants', () => {
  for (const text of ['refugee', 'asylum', 'status holder', 'statushouder', 'vluchteling', 'immigration', 'residence permit', 'work authorisation', 'residence-permit']) expect(text).toMatch(banned);
});
