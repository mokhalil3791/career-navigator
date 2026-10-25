// Parity: the new core must behave like v0.1 CareerCore (the oracle).
import { describe, expect, it } from 'vitest';
import { loadV01 } from '../helpers/v01-oracle.js';
import { v01Backups } from '../helpers/fixtures.js';
import { newWorkspace, normalizeWorkspace } from '../../src/core/schema.js';
import { parseWorkspace, serializeWorkspace, MAX_BYTES } from '../../src/core/backup.js';
import { migrate } from '../../src/core/migrate.js';
import { requirementsSummary } from '../../src/core/evidence.js';
import { planFromRole } from '../../src/core/plan.js';
import { draftCvFromProfile } from '../../src/core/cv.js';
import { escapeHTML, safeUrl } from '../../src/core/escape.js';
import { content } from '../../src/content/index.js';

const { core: v01, content: v01Content } = loadV01();
const asV2 = (/** @type {any} */ v1) => ({ ...v1, schemaVersion: 2 });

/** Runs fn and returns its error message, or 'OK'. */
function outcome(/** @type {() => unknown} */ fn) {
  try { fn(); return 'OK'; } catch (e) { return /** @type {Error} */ (e).message.replace('accepts schema 1 or 2', 'accepts schema 1'); }
}

describe('newWorkspace', () => {
  it('contains every v0.1 field with the same default (schema 2 only adds fields)', () => {
    expect(newWorkspace()).toMatchObject(asV2(v01.newWorkspace()));
  });
});

describe('normalizeWorkspace / parseWorkspace on fictional v0.1 backups', () => {
  for (const { name, text } of v01Backups()) {
    it(`${name}: imports exactly like v0.1 (plus schema-2 defaults)`, () => {
      expect(parseWorkspace(text)).toMatchObject(asV2(v01.parseWorkspace(text)));
    });
  }
});

describe('validation rejects the same inputs as v0.1, with the same messages', () => {
  const base = () => v01.newWorkspace();
  const job = (/** @type {number} */ i, extra = {}) => ({ id: 'j' + i, title: '', company: '', url: '', body: '', reason: '', requirements: [], ...extra });
  /** @type {[string, any][]} */
  const cases = [
    ['9 adverts', { ...base(), jobs: Array.from({ length: 9 }, (_, i) => job(i)) }],
    ['8 adverts (allowed)', { ...base(), jobs: Array.from({ length: 8 }, (_, i) => job(i)) }],
    ['21 requirements', { ...base(), jobs: [job(1, { requirements: Array.from({ length: 21 }, (_, i) => ({ id: 'r' + i })) })] }],
    ['20 requirements (allowed)', { ...base(), jobs: [job(1, { requirements: Array.from({ length: 20 }, (_, i) => ({ id: 'r' + i })) })] }],
    ['duplicate advert ids', { ...base(), jobs: [job(1), job(1)] }],
    ['duplicate requirement ids', { ...base(), jobs: [job(1, { requirements: [{ id: 'a' }, { id: 'a' }] })] }],
    ['bad identifier', { ...base(), jobs: [job(1, { id: 'has space' })] }],
    ['constructor as identifier', { ...base(), jobs: [job(1, { id: 'constructor' })] }],
    ['unknown status', { ...base(), jobs: [job(1, { requirements: [{ id: 'a', status: 'great' }] })] }],
    ['headline too long', { ...base(), profile: { headline: 'x'.repeat(2001) } }],
    ['cvText at limit', { ...base(), profile: { cvText: 'x'.repeat(40000) } }],
    ['cvText over limit', { ...base(), profile: { cvText: 'x'.repeat(40001) } }],
    ['experience over limit', { ...base(), profile: { experience: 'x'.repeat(16001) } }],
    ['advert body over limit', { ...base(), jobs: [job(1, { body: 'x'.repeat(40001) })] }],
    ['33 interview answers', { ...base(), interview: { answers: Object.fromEntries(Array.from({ length: 33 }, (_, i) => ['q' + i, 'a'])) } }],
    ['bad answer key', { ...base(), interview: { answers: { 'bad key': 'a' } } }],
    ['hours 0', { ...base(), plan: { hours: 0 } }],
    ['hours 41', { ...base(), plan: { hours: 41 } }],
    ['hours 1.5', { ...base(), plan: { hours: 1.5 } }],
    ['text where a list belongs', { ...base(), jobs: 'nope' }],
    ['list where an object belongs', { ...base(), profile: [] }],
    ['number where text belongs', { ...base(), profile: { name: 5 } }],
    ['missing schemaVersion', { profile: {} }],
    ['schemaVersion 3', { ...base(), schemaVersion: 3 }],
    ['unknown AI step falls back', { ...base(), ai: { step: 'hack' } }],
    ['missing selected job is cleared', { ...base(), selectedJobId: 'gone' }],
  ];
  for (const [label, input] of cases) {
    it(label, () => {
      const text = JSON.stringify(input);
      const expected = outcome(() => v01.parseWorkspace(text));
      expect(outcome(() => parseWorkspace(text))).toBe(expected);
      if (expected === 'OK') expect(parseWorkspace(text)).toMatchObject(asV2(v01.parseWorkspace(text)));
    });
  }
});

describe('backup safety (NFR-SEC-2)', () => {
  it('rejects files over 1 MiB, counted in characters and in bytes, like v0.1', () => {
    const big = JSON.stringify({ schemaVersion: 1, profile: { cvText: 'a'.repeat(MAX_BYTES) } });
    const multibyte = JSON.stringify({ schemaVersion: 1, ai: { extra: 'é'.repeat(600000) } }); // < 1 MiB chars, > 1 MiB bytes
    for (const text of [big, multibyte]) {
      expect(outcome(() => parseWorkspace(text))).toBe(outcome(() => v01.parseWorkspace(text)));
      expect(outcome(() => parseWorkspace(text))).toMatch(/exceeds one MiB/);
    }
  });
  it('rejects invalid JSON and non-text', () => {
    expect(outcome(() => parseWorkspace('{nope'))).toBe(outcome(() => v01.parseWorkspace('{nope')));
    expect(outcome(() => parseWorkspace(/** @type {any} */ (42)))).toMatch(/expected JSON text/);
  });
  it('a "__proto__" key in a backup cannot pollute prototypes', () => {
    const text = '{"schemaVersion":1,"__proto__":{"polluted":true},"profile":{"__proto__":{"polluted":true},"name":"x"}}';
    expect(outcome(() => parseWorkspace(text))).toBe(outcome(() => v01.parseWorkspace(text)));
    const result = parseWorkspace(text);
    expect(/** @type {any} */ ({}).polluted).toBeUndefined();
    expect(/** @type {any} */ (result).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(result.profile)).toBe(Object.prototype);
  });
  it('export → import round-trips without loss', () => {
    for (const { text } of v01Backups()) {
      const once = parseWorkspace(text);
      expect(parseWorkspace(serializeWorkspace(once))).toEqual(once);
    }
  });
  it('migrate refuses non-objects', () => {
    expect(outcome(() => migrate(null))).toMatch(/expected an object/);
  });
});

describe('helpers match v0.1', () => {
  it('requirementsSummary counts "supported without evidence" as unclear', () => {
    for (const job of [...v01Content.demo.jobs, { requirements: [{ status: 'supported', evidence: ' ' }, { status: 'partial', evidence: '' }, { status: 'weird' }] }, null]) {
      expect(requirementsSummary(job)).toEqual(v01.requirementsSummary(job));
    }
  });
  it('planFromRole for all nine roles and custom', () => {
    expect(content.roles.map((r) => r.id)).toEqual(v01Content.roles.map((/** @type {any} */ r) => r.id));
    for (const role of [...content.roles, { id: 'custom' }, null]) {
      const v01Role = role && v01Content.roles.find((/** @type {any} */ r) => r.id === role.id);
      expect(planFromRole(role)).toMatchObject(v01.planFromRole(v01Role || role));
    }
  });
  it('role files are the v0.1 roles, unchanged apart from "order"', () => {
    for (const role of content.roles) {
      const { order, ...rest } = role;
      expect(rest).toEqual(v01Content.roles.find((/** @type {any} */ r) => r.id === role.id));
    }
  });
  it('interview questions and demo facts retain v0.1 parity; only teaching examples are enriched', () => {
    expect(content.interviewQuestions).toEqual(v01Content.interviewQuestions);
    const legacy = asV2(v01.normalizeWorkspace(v01Content.demo));
    const showcase = normalizeWorkspace(content.demo);
    expect({ ...showcase,
      interview: { ...showcase.interview, answers: {}, notes: {}, mock: legacy.interview.mock },
      ai: { ...showcase.ai, extra: '', drafts: legacy.ai.drafts, customPrompts: [] },
    }).toMatchObject(legacy);
  });
  it('draftCvFromProfile', () => {
    for (const { text } of v01Backups()) {
      const state = parseWorkspace(text);
      expect(draftCvFromProfile(state)).toMatchObject(v01.draftCvFromProfile(v01.parseWorkspace(text)));
    }
  });
  it('safeUrl and escapeHTML', () => {
    const urls = ['https://example.org/a?b=1', 'http://x.example', 'javascript:alert(1)', 'data:text/html,hi', 'https://user:pw@x.example', 'https://x.example/\u0000', 'ftp://x', ' https://trim.example ', 'not a url', 'https://' + 'a'.repeat(3000), 42];
    for (const u of urls) expect(safeUrl(u)).toBe(v01.safeUrl(u));
    for (const s of ['<a href="x">&\'</a>', null, undefined, 5]) expect(escapeHTML(s)).toBe(v01.escapeHTML(s));
  });
});
