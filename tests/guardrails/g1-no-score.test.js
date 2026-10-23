// GUARDRAIL G1 — principle 2 "Evidence, not scores". Never delete or weaken this file.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findScoreRequests } from '../helpers/no-score.js';
import { ROOT, readPrompts, readProviders } from '../../scripts/lib/content.mjs';
import { buildLibraryPrompt } from '../../src/core/library.js';
import { renderPromptsPage } from '../../scripts/lib/prompts-page.mjs';
import { patchV01 } from '../../scripts/lib/patch-v01.mjs';
import { v01Html } from '../helpers/v01-oracle.js';
import { allTextFiles } from '../helpers/files.js';

describe('G1 checker itself', () => {
  it('catches the score requests found in the original workshop prompts', () => {
    expect(findScoreRequests('Give me a match score from 0 to 100, with a short reason.')).not.toEqual([]);
    expect(findScoreRequests('Give me the 5 best matches, ranked from best to worst.')).not.toEqual([]);
    expect(findScoreRequests('You are a 85% fit for this job')).not.toEqual([]);
    expect(findScoreRequests('Show the fit percentage')).not.toEqual([]);
  });
  it('allows only the exact sentences that ban scores', () => {
    expect(findScoreRequests('Do not assign a fit percentage or make a hiring decision.')).toEqual([]);
    expect(findScoreRequests('(including a numeric match score)')).toEqual([]);
    expect(findScoreRequests('<style>.a{width:100%}</style><div style="width:50%">x</div>')).toEqual([]);
  });
});

describe('G1: no score in any prompt or UI text', () => {
  it('library prompts contain no score request', () => {
    for (const p of readPrompts()) expect(findScoreRequests(buildLibraryPrompt(p)), p.id).toEqual([]);
  });
  it('the public prompt library page contains no score request', () => {
    expect(findScoreRequests(renderPromptsPage(readPrompts(), readProviders()))).toEqual([]);
  });
  it('the hosted v0.1 copy contains no score request', () => {
    expect(findScoreRequests(patchV01(v01Html()))).toEqual([]);
  });
  it('no shipped text file (src, content, config, site) contains a score request', () => {
    for (const file of allTextFiles(['src', 'content', 'config', 'site'], { exclude: ['content/prompts/originals'] })) {
      expect(findScoreRequests(readFileSync(join(ROOT, file), 'utf8')), file).toEqual([]);
    }
  });
});
