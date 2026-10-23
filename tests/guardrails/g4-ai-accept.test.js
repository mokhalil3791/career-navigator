// GUARDRAIL G4 — AI output never changes the CV, profile or plan without an accept click.
// Never delete or weaken this file.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeWorkspace } from '../../src/core/schema.js';
import { reduce } from '../../src/core/reducers.js';
import { content } from '../../src/content/index.js';
import { ROOT } from '../../scripts/lib/content.mjs';
import { allTextFiles } from '../helpers/files.js';

const demo = () => normalizeWorkspace(content.demo);

describe('G4: the user decides', () => {
  it('an AI-originated action without acceptance is refused', () => {
    for (const action of [
      { type: 'set', path: 'cv.summary', value: 'AI text', origin: 'ai' },
      { type: 'setCv', fields: { summary: 'AI text' }, origin: 'ai' },
      { type: 'set', path: 'profile.skills', value: 'AI text', origin: 'ai', acceptedByUser: false },
      { type: 'set', path: 'plan.day30', value: 'AI text', origin: 'ai', acceptedByUser: 'yes' },
      { type: 'addRequirement', id: 'ai-r', text: 'AI', origin: 'ai' },
    ]) expect(() => reduce(demo(), /** @type {any} */ (action)), action.type).toThrow(/only after you accept/);
  });
  it('an accepted AI action applies', () => {
    expect(reduce(demo(), { type: 'set', path: 'cv.summary', value: 'AI text', origin: 'ai', acceptedByUser: true }).cv.summary).toBe('AI text');
  });
  it('saving an AI draft never touches the profile, CV or plan', () => {
    const before = demo();
    const after = reduce(before, { type: 'set', path: 'ai.drafts.tailor', value: 'A completely rewritten CV from the AI' });
    expect(after.profile).toEqual(before.profile);
    expect(after.cv).toEqual(before.cv);
    expect(after.plan).toEqual(before.plan);
  });
  it('only the proposal-review component may mark an action as accepted by the user', () => {
    const allowed = ['src/components/proposal-review.js'];
    for (const file of allTextFiles(['src'])) {
      const text = readFileSync(join(ROOT, file), 'utf8');
      if (/acceptedByUser:\s*true/.test(text)) expect(allowed, file).toContain(file);
    }
  });
  it('AI provider code never imports the store or reducers (it can only propose)', () => {
    for (const file of allTextFiles(['src/ai'])) {
      const text = readFileSync(join(ROOT, file), 'utf8');
      expect(text, file).not.toMatch(/from ['"][./]*(store|core\/reducers)(\.js)?['"]/);
    }
  });
});
