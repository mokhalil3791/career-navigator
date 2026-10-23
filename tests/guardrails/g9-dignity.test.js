// GUARDRAIL G9 — principle 6 "Dignity". Permanent; never delete or weaken.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { newWorkspace, normalizeWorkspace } from '../../src/core/schema.js';
import { parseWorkspace } from '../../src/core/backup.js';
import { content } from '../../src/content/index.js';
import { ROOT } from '../../scripts/lib/content.mjs';
import { allTextFiles } from '../helpers/files.js';

/** Field names the app must never have. */
export const FORBIDDEN_FIELDS = /^(refugee|asylum|status_?holder|statushouder|residence|residencePermit|permit|verblijf|nationality|citizenship|dateOfBirth|dob|birth|age|bsn|passport|idNumber|photo|picture|maritalStatus|religion|ethnicity|health|disability|gender|sex)/i;

/** @param {unknown} value @param {string[]} [path] @returns {string[]} */
function allKeys(value, path = []) {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([k, v]) => [[...path, k].join('.'), ...allKeys(v, [...path, k])]);
}

describe('G9: dignity', () => {
  it('the workspace has no status, identity, birth-date, photo or similar fields', () => {
    const sample = normalizeWorkspace(content.demo);
    for (const key of allKeys(newWorkspace()).concat(allKeys(sample))) {
      const leaf = key.split('.').pop() || '';
      expect(FORBIDDEN_FIELDS.test(leaf), key).toBe(false);
    }
  });
  it('an import carrying such fields drops them', () => {
    const raw = { schemaVersion: 1, refugeeStatus: 'x', profile: { name: 'A', nationality: 'x', dateOfBirth: '1990-01-01', bsn: '123', photo: 'data:' }, jobs: [{ id: 'j', residencePermit: 'x', requirements: [] }] };
    const imported = parseWorkspace(JSON.stringify(raw));
    for (const key of allKeys(imported)) expect(FORBIDDEN_FIELDS.test(key.split('.').pop() || ''), key).toBe(false);
  });
  it('no form field in the UI binds to such a field', () => {
    for (const file of allTextFiles(['src/pages', 'src/components'])) {
      const text = readFileSync(join(ROOT, file), 'utf8');
      for (const m of text.matchAll(/['"`](profile|cv|plan)\.([A-Za-z]+)/g)) expect(FORBIDDEN_FIELDS.test(m[2]), file + ': ' + m[0]).toBe(false);
    }
  });
  it('gaps are framed as "not yet recorded", never as deficits', () => {
    const banned = /\b(you lack|you are missing|deficit|unqualified|not good enough|weakness(es)? of refugees)\b/i;
    for (const file of allTextFiles(['src', 'content', 'site'], { exclude: ['content/prompts/originals'] })) {
      expect(readFileSync(join(ROOT, file), 'utf8').match(banned)?.[0], file).toBeUndefined();
    }
  });
});
