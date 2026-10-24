import { describe, expect, it } from 'vitest';
import { CV_KEYS, newWorkspace, normalizeWorkspace } from '../../src/core/schema.js';
import { migrate } from '../../src/core/migrate.js';
import { reduce } from '../../src/core/reducers.js';
import { draftCvFromProfile } from '../../src/core/cv.js';
import { shouldAutoDraft } from '../../src/core/auto-draft.js';
import { parseWorkspace, serializeWorkspace } from '../../src/core/backup.js';
import { buildCVHTML } from '../../src/core/exports/html.js';
import { buildCvDocx } from '../../src/core/exports/docx.js';

const facts = () => { const s = newWorkspace(); s.profile.experience = 'Recorded route planning in Excel.'; return s; };
describe('one-time profile-only first draft', () => {
  it('requires a recorded fact; imported source text alone does not qualify', () => {
    const s = newWorkspace(); expect(shouldAutoDraft(s)).toBe(false);
    s.profile.cvText = 'Source waiting for review'; expect(shouldAutoDraft(s)).toBe(false);
    s.profile.name = 'Fictional name'; expect(shouldAutoDraft(s)).toBe(true);
  });
  for (const key of CV_KEYS) it(`does not overwrite ${key}, even whitespace`, () => {
    const s = facts(); s.cv[key] = ' ';
    expect(shouldAutoDraft(s)).toBe(false);
    expect(reduce(s, { type: 'autoDraftCv' })).toEqual(s);
  });
  for (const key of ['headline', 'about', 'bullets']) it(`does not overwrite LinkedIn ${key}`, () => {
    const s = facts(); s.cv.linkedin[key] = 'Existing work';
    expect(reduce(s, { type: 'autoDraftCv' })).toEqual(s);
  });
  it('uses the existing mapper, locks both formats and changes no source facts', () => {
    const s = facts(); s.cv.reviewed = true;
    s.profile.educationRows = [{ id: 'one', title: 'Recorded course', institution: '', country: '', year: '', idw: '' }];
    const next = reduce(s, { type: 'autoDraftCv' });
    expect(next.cv).toEqual({ ...draftCvFromProfile(s), autoDrafted: true });
    expect(next.profile).toEqual(s.profile);
    expect(next.ai).toEqual(s.ai);
    expect(next.cv.reviewed).toBe(false);
    expect(() => buildCVHTML(next)).toThrow(); expect(() => buildCvDocx(next)).toThrow();
  });
  it('does not refill after clearing or undo, including after reload and backup import', () => {
    let s = reduce(facts(), { type: 'autoDraftCv' });
    s = reduce(s, { type: 'set', path: 'cv.experience', value: '' });
    expect(shouldAutoDraft(s)).toBe(false);
    s = reduce(s, { type: 'startEmptyCv' });
    expect(s.cv.autoDrafted).toBe(true);
    expect(shouldAutoDraft(normalizeWorkspace(migrate(JSON.parse(JSON.stringify(s)))))).toBe(false);
    expect(shouldAutoDraft(parseWorkspace(serializeWorkspace(s)))).toBe(false);
  });
  it('start from empty before any draft also opts out', () => {
    expect(shouldAutoDraft(reduce(facts(), { type: 'startEmptyCv' }))).toBe(false);
  });
  it('backup import resets review after auto-drafting but retains the once-only marker', () => {
    const s = reduce(reduce(facts(), { type: 'autoDraftCv' }), { type: 'setReviewed', value: true });
    const restored = parseWorkspace(serializeWorkspace(s));
    expect(restored.cv.reviewed).toBe(false); expect(restored.cv.autoDrafted).toBe(true);
  });
  it('migrates old schema 1 and 2 without changing their content or the input', () => {
    for (const version of [1, 2]) {
      const s = facts(); s.schemaVersion = version; delete s.cv.autoDrafted;
      const before = structuredClone(s);
      const migrated = normalizeWorkspace(migrate(s));
      expect(migrated.cv.autoDrafted).toBe(false); expect(migrated.profile).toEqual(s.profile); expect(s).toEqual(before);
    }
  });
});
