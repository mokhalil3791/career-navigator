// Regression tests for the external review of 2026-10-23 (five issues). Each test fails on the old code.
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { normalizeWorkspace, newWorkspace } from '../../src/core/schema.js';
import { reduce } from '../../src/core/reducers.js';
import { draftCvFromProfile } from '../../src/core/cv.js';
import { buildPrompt } from '../../src/core/prompts.js';
import { buildTaskPrompt, buildCustomPrompt, toProposals, SCHEMAS } from '../../src/ai/tasks.js';
import { loadSaved, deleteEverything, LEGACY_KEY, isOwnCache } from '../../src/storage/device.js';
import { content } from '../../src/content/index.js';
import { readFileSync } from 'node:fs';

/** A Map-backed Web Storage stand-in. */
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  const api = {
    getItem: (/** @type {string} */ k) => (map.has(k) ? map.get(k) : null),
    setItem: (/** @type {string} */ k, /** @type {string} */ v) => map.set(k, String(v)),
    removeItem: (/** @type {string} */ k) => map.delete(k),
    clear: () => map.clear(),
    map,
  };
  return new Proxy(api, { ownKeys: () => [...map.keys()], getOwnPropertyDescriptor: (_, k) => (map.has(String(k)) ? { enumerable: true, configurable: true, value: map.get(String(k)) } : undefined) });
}

const saved = { ...globalThis };
afterEach(() => { for (const k of ['localStorage', 'sessionStorage', 'caches', 'indexedDB']) /** @type {any} */ (globalThis)[k] = /** @type {any} */ (saved)[k]; });

describe('1. migrating a v0.1 save never destroys the only copy', () => {
  const v01 = readFileSync('tests/fixtures/v0.1/localstorage-remember-true.json', 'utf8');
  beforeEach(() => { /** @type {any} */ (globalThis).indexedDB = undefined; });
  it('when the new storage is unavailable, the old copy stays and the result says so', async () => {
    const ls = fakeStorage({ [LEGACY_KEY]: v01 });
    /** @type {any} */ (globalThis).localStorage = ls;
    const result = await loadSaved();
    expect(result.error).toBe(true);
    expect(result.message).toMatch(/original saved copy has been kept/);
    expect(result.state?.profile.name).toBe('Yonas — fictional');
    expect(result.state?.settings.remember).toBe(false); // this session must not pretend to save
    expect(ls.getItem(LEGACY_KEY)).toBe(v01);
  });
  it('an unreadable old copy is left alone', async () => {
    const ls = fakeStorage({ [LEGACY_KEY]: '{broken' });
    /** @type {any} */ (globalThis).localStorage = ls;
    await expect(loadSaved()).rejects.toThrow(); // IndexedDB unavailable → startup shows its error
    expect(ls.getItem(LEGACY_KEY)).toBe('{broken');
  });
});

describe('2. "Delete everything" removes only what this app owns', () => {
  it('keeps other projects’ storage and caches on the same github.io origin', async () => {
    /** @type {any} */ (globalThis).indexedDB = undefined;
    const ls = fakeStorage({ [LEGACY_KEY]: 'x', 'other-app.settings': 'keep me' });
    const ss = fakeStorage({ 'career-navigator.tmp': 'x', 'other-app.session': 'keep me' });
    /** @type {any} */ (globalThis).localStorage = ls;
    /** @type {any} */ (globalThis).sessionStorage = ss;
    const names = new Set(['career-navigator-app-1.0.0', 'webllm/model', 'webllm/wasm', 'other-app-v3', 'workbox-precache']);
    /** @type {any} */ (globalThis).caches = { keys: async () => [...names], delete: async (/** @type {string} */ n) => names.delete(n) };
    await deleteEverything();
    expect(ls.getItem('other-app.settings')).toBe('keep me');
    expect(ls.getItem(LEGACY_KEY)).toBeNull();
    expect(ss.getItem('other-app.session')).toBe('keep me');
    expect(ss.getItem('career-navigator.tmp')).toBeNull();
    expect([...names].sort()).toEqual(['other-app-v3', 'workbox-precache']);
    expect(isOwnCache('career-navigator-app-x')).toBe(true);
    expect(isOwnCache('someone-else')).toBe(false);
  });
});

describe('3. education and language rows reach the ordinary (no-AI) CV draft', () => {
  const withRows = () => {
    const s = newWorkspace();
    s.profile.languageRows = [{ id: 'a', language: 'Dutch', level: 'B1', basis: 'certified', certificate: 'Staatsexamen NT2 programme I' }, { id: 'b', language: 'Arabic', level: 'native', basis: '', certificate: '' }, { id: 'c', language: 'English', level: 'B2', basis: 'self', certificate: '' }];
    s.profile.educationRows = [{ id: 'e', title: 'Bachelor of Accounting', institution: 'Example University', country: 'Syria', year: '2015', idw: 'yes' }, { id: 'f', title: 'Excel course', institution: '', country: '', year: '2024', idw: 'applied' }];
    return s;
  };
  it('rows alone fill the CV sections', () => {
    const cv = draftCvFromProfile(withRows());
    expect(cv.languages).toBe('Dutch: B1 (certified: Staatsexamen NT2 programme I)\nArabic: native\nEnglish: B2 (self-assessed)');
    expect(cv.education).toBe('Bachelor of Accounting, Example University, Syria, 2015 (IDW credential evaluation available)\nExcel course, 2024');
  });
  it('text and rows combine without duplicates: the user’s own text first', () => {
    const s = withRows();
    s.profile.languages = 'Arabic: native';
    s.profile.education = 'Bachelor of Accounting, Example University, Syria, 2015 (IDW credential evaluation available)';
    const cv = draftCvFromProfile(s);
    expect(cv.languages).toBe('Arabic: native\nDutch: B1 (certified: Staatsexamen NT2 programme I)\nEnglish: B2 (self-assessed)');
    expect(cv.education).toBe(s.profile.education + '\nExcel course, 2024');
  });
  it('without rows the result is exactly the v0.1 behaviour', () => {
    const s = normalizeWorkspace(content.demo);
    expect(draftCvFromProfile(s).languages).toBe(s.profile.languages);
    expect(draftCvFromProfile(s).education).toBe(s.profile.education);
  });
});

describe('4. every editable proposal applies the user’s edited text', () => {
  const s = normalizeWorkspace(content.demo);
  const answers = {
    'extract-requirements': { requirements: [{ text: 'Power BI', kind: 'nice' }], hours: '36', location: 'Utrecht', dutch: { demand: 'plus', level: '' } },
    'suggest-evidence': { suggestions: [{ id: 'da-excel', status: 'supported', quote: 'Excel: filters, pivot tables and lookup formulas.' }] },
    'suggest-fields': { fields: { headline: 'Analyst' } },
    'tailor-cv': { changes: [{ field: 'skills', after: 'New skills', reason: 'x' }] },
    linkedin: { headline: 'H', about: 'A', bullets: ['B'] },
    'plan-from-gaps': { priorities: ['P'], nextAction: 'N' },
  };
  for (const [id, value] of Object.entries(answers)) {
    it(id, () => {
      let n = 0;
      for (const p of toProposals(id, value, s, { newId: (x) => x + '-' + ++n })) {
        if (p.editable === false) continue; // the review shows no edit box for these
        const next = p.actions('EDITED BY USER').reduce((st, a) => reduce(st, { ...a, acceptedByUser: true }), s);
        expect(JSON.stringify(next), p.label).toContain('EDITED BY USER');
      }
    });
  }
  it('the advert-facts proposal is marked non-editable, because its values are structured', () => {
    const facts = toProposals('extract-requirements', answers['extract-requirements'], s, { newId: (x) => x }).find((p) => p.id === 'facts');
    expect(facts?.editable).toBe(false);
  });
  it('the review component hides the edit box for non-editable proposals', () => {
    expect(readFileSync('src/components/proposal-review.js', 'utf8')).toContain('p.editable === false ? nothing');
  });
});

describe('5. every prompt builder respects the chosen application language', () => {
  const s = { ...normalizeWorkspace(content.demo), settings: { ...normalizeWorkspace(content.demo).settings, applicationLanguage: 'Dutch' } };
  const line = 'Application language: I explicitly ask you to write CVs and application letters in Dutch.';
  it('structured tasks and custom prompts include it, like buildPrompt', () => {
    for (const id of Object.keys(SCHEMAS)) expect(buildTaskPrompt(id, s, content), id).toContain(line);
    expect(buildCustomPrompt({ title: 'x', task: 'y', dataFrom: 'cv' }, s)).toContain(line);
    expect(buildPrompt('tailor', s, content)).toContain(line);
  });
  it('English adds nothing, so v0.1 parity holds', () => {
    const en = normalizeWorkspace(content.demo);
    expect(buildTaskPrompt('tailor-cv', en, content)).not.toContain('Application language:');
  });
});
