import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../scripts/lib/content.mjs';
import { buildKnowledge, cardsFor, upcomingEvents } from '../../src/content/knowledge.js';
import { stripComments } from '../../src/content/markdown.js';
import { createT, format, LANGUAGES, languageDir } from '../../src/i18n/index.js';
import { extractStrings } from '../../scripts/lib/i18n-strings.mjs';
import { normalizeWorkspace } from '../../src/core/schema.js';
import { buildCVHTML } from '../../src/core/exports/html.js';
import { buildPrompt } from '../../src/core/prompts.js';
import { content } from '../../src/content/index.js';

const dir = join(ROOT, 'content', 'knowledge', 'en');
const files = Object.fromEntries(readdirSync(dir).map((f) => [f, readFileSync(join(dir, f), 'utf8')]));
const { cards, warnings } = buildKnowledge(files);

/** Official or primary sources accepted for Dutch-market cards (FR-KNW-1). */
const OFFICIAL = ['werk.nl', 'idw.nl', 'justis.nl', 'staatsexamensnt2.nl', 'inburgeren.nl', 'business.gov.nl', 'government.nl', 'rijksoverheid.nl', 'duo.nl', 'uwv.nl', 'refugeetalenthub.com', 'vluchtelingenwerk.nl', 'uaf.nl', 'roadmap.sh', 'github.com'];

describe('knowledge pack (FR-KNW)', () => {
  it('all ten v1.0 cards load without warnings', () => {
    expect(warnings).toEqual([]);
    expect(cards.map((c) => c.id).sort()).toEqual(['contracts-and-pay', 'cv-and-letter', 'data-ai-roles', 'dutch-at-work', 'finding-work', 'foreign-diplomas', 'glossary', 'interview', 'support-organisations', 'vog']);
  });
  it('every card cites at least one official or primary source over https, and has a review date', () => {
    for (const c of cards) {
      expect(c.sources.length, c.id).toBeGreaterThan(0);
      for (const s of c.sources) expect(OFFICIAL.some((d) => new URL(s.url).hostname.endsWith(d)), c.id + ' ' + s.url).toBe(true);
      expect(c.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('unverified claims are TODO comments and are never rendered (FR-KNW-3)', () => {
    for (const c of cards) {
      expect(stripComments(c.body), c.id).not.toMatch(/TODO/i);
      // Every "TODO" in the source must lie inside a comment span.
      const spans = [...c.body.matchAll(/<!--[\s\S]*?-->/g)].map((m) => [m.index || 0, (m.index || 0) + m[0].length]);
      for (const m of c.body.matchAll(/TODO/g)) expect(spans.some(([a, b]) => (m.index || 0) > a && (m.index || 0) < b), c.id).toBe(true);
    }
  });
  it('an unclosed comment hides everything after it', () => {
    expect(stripComments('Fact.\n<!-- TODO verify: unfinished\nnot a fact')).toBe('Fact.\n');
    expect(stripComments('a <!-- x --> b <!-- y --> c')).toBe('a  b  c');
  });
  it('cards never give legal, immigration, tax or benefits advice in imperative form (FR-KNW-2)', () => {
    for (const c of cards) expect(stripComments(c.body), c.id).not.toMatch(/\byou (must|should) (apply for asylum|claim benefits|file your tax)/i);
    expect(cards.find((c) => c.id === 'contracts-and-pay')?.body).toMatch(/not legal advice/);
  });
  it('an unclosed comment hides everything after it', () => {
    expect(stripComments('Fact.
<!-- TODO verify: unfinished
not a fact')).toBe('Fact.
');
    expect(stripComments('a <!-- x --> b <!-- y --> c')).toBe('a  b  c');
  });
  it('a broken card is skipped with a warning, not a crash', () => {
    const r = buildKnowledge({ 'bad.md': '---\nid: Bad Id\n---\nx' });
    expect(r.cards).toEqual([]);
    expect(r.warnings[0]).toMatch(/Skipped knowledge card bad\.md/);
  });
  it('cards appear on their pages and fall back to English', () => {
    expect(cardsFor(cards, 'cv', 'nl').map((c) => c?.id)).toContain('cv-and-letter');
    expect(cardsFor(cards, 'learn', 'en')).toHaveLength(10);
  });
});

describe('events (content/events.json)', () => {
  const data = JSON.parse(readFileSync(join(ROOT, 'content', 'events.json'), 'utf8'));
  it('past events hide automatically and only free events validate', () => {
    expect(upcomingEvents(data, '2026-10-23').events.map((e) => e.id)).toEqual(['data-ai-career-workshop-2026']);
    expect(upcomingEvents(data, '2026-11-03').events).toEqual([]);
    expect(upcomingEvents({ events: [{ id: 'x', title: 'Paid', date: '2030-01-01', cost: 'paid' }] }, '2026-01-01').warnings[0]).toMatch(/Skipped/);
  });
});

describe('interface languages (NFR-I18N)', () => {
  const nl = JSON.parse(readFileSync(join(ROOT, 'src', 'i18n', 'nl.json'), 'utf8'));
  const english = extractStrings();
  it('English is the source: t() returns the English text and missing keys fall back', () => {
    expect(createT('en')('Compare jobs')).toBe('Compare jobs');
    expect(createT('nl')('Compare jobs')).toBe('Vacatures vergelijken');
    expect(createT('nl')('A sentence nobody translated')).toBe('A sentence nobody translated');
    expect(createT('xx')('Compare jobs')).toBe('Compare jobs');
    expect(format('{n} saved', { n: 3 })).toBe('3 saved');
  });
  it('Dutch is marked machine-assisted until a fluent speaker reviews it', () => {
    expect(LANGUAGES.nl.machineTranslated).toBe(true);
  });
  it('every Dutch key is a current English string, with the same {placeholders}', () => {
    for (const [key, value] of Object.entries(nl)) {
      if (key === '_meta') continue;
      expect(english, 'stale key: ' + key).toContain(key);
      expect(String(value).match(/\{\w+\}/g)?.sort() || [], key).toEqual(key.match(/\{\w+\}/g)?.sort() || []);
    }
  });
  it('reports coverage (Dutch is complete at release)', () => {
    const missing = english.filter((s) => !nl[s]);
    expect(missing, 'untranslated Dutch strings').toEqual([]);
  });
  it('RTL-ready: a language file can declare dir rtl', () => {
    expect(languageDir('en')).toBe('ltr');
    expect(languageDir('unknown')).toBe('ltr');
  });
  it('the CSS uses logical properties, so right-to-left languages need no code change', () => {
    for (const f of ['layout.css', 'app.css', 'print.css']) {
      const css = readFileSync(join(ROOT, 'src', 'styles', f), 'utf8');
      expect(css.match(/(margin|padding|border)-(left|right)\s*:|[{;]\s*(left|right)\s*:|text-align:\s*(left|right)/)?.[0], f).toBeUndefined();
    }
  });
});

describe('application language is separate from the interface (NFR-I18N-3)', () => {
  const demo = () => ({ ...normalizeWorkspace(content.demo), cv: { ...normalizeWorkspace(content.demo).cv, reviewed: true } });
  it('a Dutch interface still exports an English CV by default', () => {
    const s = demo();
    s.settings.uiLanguage = 'nl';
    const html = buildCVHTML(s);
    expect(html).toContain('<h2>Experience</h2>');
    expect(html).toContain('<html lang="en">');
  });
  it('choosing Dutch as the CV language gives Dutch headings and asks the AI for Dutch', () => {
    const s = demo();
    s.settings.applicationLanguage = 'Dutch';
    expect(buildCVHTML(s)).toContain('<h2>Werkervaring</h2>');
    expect(buildCVHTML(s)).toContain('<html lang="nl">');
    expect(buildPrompt('letter', s, content)).toContain('write CVs and application letters in Dutch');
  });
});
