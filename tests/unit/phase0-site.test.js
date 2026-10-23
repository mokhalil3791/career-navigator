import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readPrompts, readProviders } from '../../scripts/lib/content.mjs';
import { renderPromptsPage, renderShortLink } from '../../scripts/lib/prompts-page.mjs';
import { patchV01 } from '../../scripts/lib/patch-v01.mjs';
import { parseFrontmatter } from '../../src/content/frontmatter.js';
import { v01Html, v01Task } from '../helpers/v01-oracle.js';

describe('reference v0.1', () => {
  it('is never edited (pinned SHA-256)', () => {
    expect(createHash('sha256').update(v01Html()).digest('hex')).toBe(REFERENCE_SHA256);
  });
});

describe('improved prompts (FR-LIB-4, FR-PS-1)', () => {
  it('there are seven, one per v0.1 step, in v0.1 order', () => {
    expect(readPrompts().map((p) => p.id)).toEqual(['profile', 'search', 'compare', 'fit', 'tailor', 'interview', 'letter']);
  });
  it('each task text is exactly the v0.1 task', () => {
    for (const p of readPrompts()) expect(p.task, p.id).toBe(v01Task(p.id));
  });
  it('slugs are short and URL-safe', () => {
    for (const p of readPrompts()) expect(p.slug).toMatch(/^[a-z]{2,12}$/);
  });
});

describe('prompt library page (FR-LIB)', () => {
  const html = renderPromptsPage(readPrompts(), readProviders());
  it('has a Copy button and anchor for every prompt', () => {
    for (const p of readPrompts()) {
      expect(html).toContain(`id="${p.slug}"`);
      expect(html).toContain(`data-copy="text-${p.slug}"`);
    }
  });
  it('loads nothing from other hosts and stores nothing', () => {
    expect(html).toContain("script-src 'self'");
    expect(html).not.toMatch(/<script[^>]+src="https?:/);
    expect(html).not.toMatch(/<link[^>]+href="https?:/);
    expect(html).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
  });
  it('links free AI chats and escapes everything', () => {
    for (const c of readProviders().chats) expect(html).toContain(c.label.replace('&', '&amp;'));
    expect(renderPromptsPage([{ id: 'x', slug: 'x', order: 1, title: '<b>', summary: '"', pasteWith: ['<i>'], task: '<script>' }], { chats: [{ id: 'bad', label: 'Bad', url: 'javascript:alert(1)' }] }))
      .not.toMatch(/<script>|<b>|<i>|javascript:/);
  });
  it('short links redirect to the right anchor', () => {
    expect(renderShortLink('cv')).toContain('url=../../prompts/#cv');
  });
});

describe('hosted v0.1 copy', () => {
  const served = patchV01(v01Html());
  it('does not link the old external prompt site', () => {
    expect(served).not.toContain('netlify.app');
    expect(served).toContain('./prompts/');
  });
  it('fails loudly if the reference changes shape', () => {
    expect(() => patchV01('<html></html>')).toThrow(/matched 0 times/);
  });
});

describe('frontmatter reader', () => {
  it('reads scalars, lists and lists of objects', () => {
    const { data, body } = parseFrontmatter('---\nid: a\nn: 3\nok: true\nt: "x: y"\nlist:\n  - one\n  - "two"\nsources:\n  - title: A\n    url: https://a.example\n---\nBody\n');
    expect(data).toEqual({ id: 'a', n: 3, ok: true, t: 'x: y', list: ['one', 'two'], sources: [{ title: 'A', url: 'https://a.example' }] });
    expect(body).toBe('Body');
  });
  it('rejects a file without frontmatter', () => {
    expect(() => parseFrontmatter('no frontmatter')).toThrow(/Missing frontmatter/);
  });
});

const REFERENCE_SHA256 = '5d23d265f52862c7b9cd452c1ae0b9d920431b6bbf098c4580d1254273d52aaa';
