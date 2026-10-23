// GUARDRAIL G3 — CV export is locked until review; any profile, CV or job edit re-locks it.
// Never delete or weaken this file.
import { describe, expect, it } from 'vitest';
import { newWorkspace, normalizeWorkspace, PROFILE_KEYS, CV_KEYS } from '../../src/core/schema.js';
import { reduce, invalidatesReview } from '../../src/core/reducers.js';
import { buildCVHTML } from '../../src/core/exports/html.js';
import { content } from '../../src/content/index.js';

function reviewedDemo() {
  const s = normalizeWorkspace(content.demo);
  s.cv.reviewed = true;
  return s;
}

describe('G3: review gate', () => {
  it('buildCVHTML refuses to export an unreviewed CV', () => {
    expect(() => buildCVHTML(newWorkspace())).toThrow(/Review every CV/);
    expect(() => buildCVHTML({ ...reviewedDemo(), cv: { ...reviewedDemo().cv, reviewed: /** @type {any} */ ('true') } })).toThrow();
    expect(() => buildCVHTML(reviewedDemo())).not.toThrow();
  });

  const edits = [
    ...PROFILE_KEYS.map((k) => ({ type: 'set', path: 'profile.' + k, value: 'changed' })),
    ...CV_KEYS.map((k) => ({ type: 'set', path: 'cv.' + k, value: 'changed' })),
    { type: 'set', path: 'profile.workPreferences.region', value: 'Noord-Holland' },
    { type: 'set', path: 'profile.targetRoles.0', value: 'Analyst' },
    { type: 'addRow', path: 'profile.languageRows', row: { id: 'l1', language: 'Dutch', level: 'A2', basis: 'self', certificate: '' } },
    { type: 'editJob', id: 'demo-analyst', key: 'title', value: 'x' },
    { type: 'editJob', id: 'demo-analyst', key: 'body', value: 'x' },
    { type: 'editJob', id: 'demo-analyst', key: 'url', value: 'https://x.example' },
    { type: 'editJob', id: 'demo-analyst', key: 'company', value: 'x' },
    { type: 'editJob', id: 'demo-analyst', key: 'reason', value: 'x' },
    { type: 'setJobFacts', id: 'demo-analyst', facts: { dutch: 'required' } },
    { type: 'addJob', id: 'new-job' },
    { type: 'selectJob', id: 'demo-data-engineer' },
    { type: 'removeJob', id: 'demo-platform' },
    { type: 'addRequirement', id: 'new-req' },
    { type: 'editRequirement', id: 'da-excel', key: 'evidence', value: 'x' },
    { type: 'editRequirement', id: 'da-excel', key: 'status', value: 'missing' },
    { type: 'removeRequirement', id: 'da-excel' },
    { type: 'draftCv' },
    { type: 'setCv', fields: { summary: 'tailored' }, origin: 'ai', acceptedByUser: true },
  ];
  for (const action of edits) {
    it(`re-locks after ${action.type} ${action.path || action.key || ''}`, () => {
      expect(invalidatesReview(/** @type {any} */ (action))).toBe(true);
      const next = reduce(reviewedDemo(), /** @type {any} */ (action));
      expect(next.cv.reviewed).toBe(false);
      expect(() => buildCVHTML(next)).toThrow();
    });
  }

  it('only an explicit review action unlocks the export', () => {
    const next = reduce(newWorkspace(), { type: 'setReviewed', value: true });
    expect(next.cv.reviewed).toBe(true);
    expect(reduce(newWorkspace(), { type: 'setReviewed', value: 'yes' }).cv.reviewed).toBe(false);
    expect(reduce(newWorkspace(), { type: 'set', path: 'cv.reviewed', value: true }).cv.reviewed).toBe(true);
  });
});
