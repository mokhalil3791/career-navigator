import { describe, expect, it } from 'vitest';
import { v01Backups } from '../helpers/fixtures.js';
import { migrate } from '../../src/core/migrate.js';
import { parseWorkspace, serializeWorkspace } from '../../src/core/backup.js';
import { newWorkspace, normalizeWorkspace, SCHEMA_VERSION } from '../../src/core/schema.js';
import { reduce } from '../../src/core/reducers.js';
import { createStore } from '../../src/store.js';
import { content } from '../../src/content/index.js';

describe('migrate (gate: v0.1 backups import)', () => {
  it('every fictional v0.1 backup migrates to schema 2 without losing a field', () => {
    for (const { name, text } of v01Backups()) {
      const v1 = JSON.parse(text);
      const v2 = parseWorkspace(text);
      expect(v2.schemaVersion, name).toBe(SCHEMA_VERSION);
      const { schemaVersion, settings, ...rest } = v1;
      expect(v2, name).toMatchObject({ ...rest, cv: { ...rest.cv, reviewed: false } });
    }
  });
  it('schema 2 is stable: export → import → export gives the same file', () => {
    const s = parseWorkspace(v01Backups()[0].text);
    expect(serializeWorkspace(parseWorkspace(serializeWorkspace(s)))).toBe(serializeWorkspace(s));
  });
  it('rejects unknown versions with a clear message', () => {
    expect(() => migrate({ schemaVersion: 3 })).toThrow(/accepts schema 1 or 2/);
    expect(() => migrate({})).toThrow(/missing schemaVersion/);
    expect(() => migrate({ schemaVersion: '1' })).toThrow();
  });
  it('schema-2 fields are validated too', () => {
    const base = newWorkspace();
    expect(() => normalizeWorkspace({ ...base, applications: [{ id: 'a' }, { id: 'a' }] })).toThrow(/duplicate/);
    expect(normalizeWorkspace({ ...base, applications: [{ id: 'a', stage: 'hired!!' }] }).applications[0].stage).toBe('saved');
    expect(() => normalizeWorkspace({ ...base, profile: { targetRoles: ['a', 'b', 'c', 'd'] } })).toThrow(/maximum 3/);
    expect(normalizeWorkspace({ ...base, settings: { uiLanguage: '<script>' } }).settings.uiLanguage).toBe('en');
    expect(normalizeWorkspace({ ...base, settings: { uiLanguage: 'ar' } }).settings.uiLanguage).toBe('ar');
  });
});

describe('reducers', () => {
  const demo = () => normalizeWorkspace(content.demo);
  it('never mutate their input', () => {
    const s = demo();
    const copy = structuredClone(s);
    reduce(s, { type: 'editJob', id: 'demo-analyst', key: 'title', value: 'changed' });
    expect(s).toEqual(copy);
  });
  it('refuse prototype paths and unknown fields', () => {
    for (const path of ['__proto__.x', 'profile.constructor', 'profile.nope', 'settings.remember.x']) {
      expect(() => reduce(demo(), { type: 'set', path, value: 'x' }), path).toThrow();
    }
    expect(() => reduce(demo(), { type: 'set', path: 'plan.hours', value: 'x' })).not.toThrow();
    expect(() => reduce(demo(), { type: 'set', path: 'settings.remember', value: 'yes' })).toThrow(/Wrong value type/);
  });
  it('clamp hours to 1–40 like v0.1', () => {
    expect(reduce(demo(), { type: 'set', path: 'plan.hours', value: '99' }).plan.hours).toBe(40);
    expect(reduce(demo(), { type: 'set', path: 'plan.hours', value: '0' }).plan.hours).toBe(6);
  });
  it('add, move and remove adverts; keep a valid selection', () => {
    let s = reduce(demo(), { type: 'addJob', id: 'j4' });
    expect(s.selectedJobId).toBe('j4');
    s = reduce(s, { type: 'moveJob', id: 'j4', direction: -1 });
    expect(s.jobs.map((j) => j.id)).toEqual(['demo-analyst', 'demo-data-engineer', 'j4', 'demo-platform']);
    s = reduce(s, { type: 'removeJob', id: 'j4' });
    expect(s.selectedJobId).toBe('demo-analyst');
    expect(reduce(s, { type: 'moveJob', id: 'demo-analyst', direction: -1 })).toBe(s);
  });
  it('limit adverts to 8 and requirements to 20', () => {
    let s = newWorkspace();
    for (let i = 0; i < 8; i++) s = reduce(s, { type: 'addJob', id: 'j' + i });
    expect(() => reduce(s, { type: 'addJob', id: 'j9' })).toThrow(/up to 8/);
    for (let i = 0; i < 25; i++) s = reduce(s, { type: 'addRequirement', id: 'r' + i });
    expect(s.jobs.find((j) => j.id === s.selectedJobId)?.requirements.length).toBe(20);
  });
  it('rows: add, edit, remove, with limits', () => {
    let s = reduce(newWorkspace(), { type: 'addRow', path: 'applications', row: { id: 'a1', jobId: '', title: 'T', company: '', url: '', dateApplied: '', stage: 'saved', followUp: '', contact: '', notes: '' } });
    s = reduce(s, { type: 'editRow', path: 'applications', id: 'a1', key: 'stage', value: 'applied' });
    expect(s.applications[0].stage).toBe('applied');
    expect(() => reduce(s, { type: 'editRow', path: 'applications', id: 'a1', key: '__proto__', value: {} })).toThrow();
    expect(() => reduce(s, { type: 'addRow', path: 'jobs', row: {} })).toThrow(/Unknown list/);
    expect(reduce(s, { type: 'removeRow', path: 'applications', id: 'a1' }).applications).toEqual([]);
  });
  it('applyTemplate and interview navigation', () => {
    const role = content.roles[0];
    expect(reduce(newWorkspace(), { type: 'applyTemplate', role }).plan.targetRole).toBe(role.role);
    let s = reduce(newWorkspace(), { type: 'question', direction: 1, count: 8 });
    expect(s.interview.questionIndex).toBe(1);
    s = reduce(s, { type: 'question', direction: -5, count: 8 });
    expect(s.interview.questionIndex).toBe(0);
  });
});

describe('store', () => {
  it('notifies subscribers and reports errors without changing state', () => {
    const store = createStore(newWorkspace());
    const seen = [];
    store.subscribe((s) => seen.push(s.profile.city));
    expect(store.update('profile.city', 'Den Haag').ok).toBe(true);
    expect(seen).toEqual(['Den Haag']);
    const bad = store.update('profile.__proto__', 'x');
    expect(bad.ok).toBe(false);
    expect(store.getState().profile.city).toBe('Den Haag');
  });
  it('refuses to grow past the workspace size cap, like v0.1', () => {
    const store = createStore(newWorkspace());
    for (let i = 0; i < 8; i++) store.dispatch({ type: 'addJob', id: 'j' + i });
    let last;
    for (let i = 0; i < 8; i++) last = store.dispatch({ type: 'editJob', id: 'j' + i, key: 'body', value: 'é'.repeat(40000) });
    for (let i = 0; i < 8; i++) last = store.dispatch({ type: 'editJob', id: 'j' + i, key: 'reason', value: 'y'.repeat(8000) });
    store.update('profile.cvText', 'z'.repeat(40000));
    for (const k of ['experience', 'about', 'skills', 'education']) last = store.update('profile.' + k, 'w'.repeat(16000));
    for (const k of ['summary', 'experience', 'education', 'skills', 'languages', 'letter']) last = store.update('cv.' + k, 'v'.repeat(20000));
    for (const k of ['profile', 'search', 'compare', 'fit', 'tailor', 'interview', 'letter']) last = store.update('ai.drafts.' + k, 'u'.repeat(40000));
    expect(last?.ok).toBe(false);
    expect(/** @type {any} */ (last).error).toMatch(/nearly full/);
  });
  it('refuses text longer than the field limit, so the workspace always stays exportable', () => {
    const store = createStore(newWorkspace());
    expect(store.update('profile.headline', 'x'.repeat(2001)).ok).toBe(false);
    expect(store.getState().profile.headline).toBe('');
  });
});
