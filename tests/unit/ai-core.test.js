import { describe, expect, it } from 'vitest';
import { redact } from '../../src/ai/redact.js';
import { diffWords, hasChanges } from '../../src/core/diff.js';
import { findJson, parseStructured, withRetry } from '../../src/ai/parse.js';
import { SCHEMAS } from '../../src/ai/tasks.js';

describe('redact (FR-AI-6)', () => {
  it('masks emails, phones, BSN-like numbers, IBANs, postcodes, addresses and the name', () => {
    const text = 'Amina Haddad, amina.h@example.org, +31 6 12345678, 06-12345678, (020) 123 4567, BSN 123456782, 123.456.782, NL91ABNA0417164300, Kerkstraat 12a, 2514 AB Den Haag. Amina worked 2014–2022.';
    const { text: out, counts } = redact(text, { name: 'Amina Haddad' });
    for (const secret of ['amina.h@example.org', '12345678', '123 4567', '123456782', '123.456.782', 'NL91ABNA0417164300', 'Kerkstraat 12a', '2514 AB', 'Amina', 'Haddad']) expect(out, secret).not.toContain(secret);
    expect(out).toContain('2014–2022');
    expect(out).toContain('Den Haag');
    expect(counts.name).toBeGreaterThanOrEqual(2);
    expect(counts['email addresses']).toBe(1);
  });
  it('leaves ordinary career text alone', () => {
    const text = 'Prepared weekly reports for 30 colleagues. SQL: 6 queries. 32–40 hours per week. B2 English.';
    expect(redact(text).text).toBe(text);
  });
  it('ignores "fictional" and "example" as name parts', () => {
    expect(redact('Sam — fictional example: an example advert', { name: 'Sam — fictional example' }).text).toBe('[name]: an example advert');
  });
});

describe('diffWords', () => {
  it('marks added and removed words', () => {
    const parts = diffWords('Excel and SQL basics', 'Excel, SQL and Python basics');
    expect(parts.filter((p) => p.type === 'added').map((p) => p.text).join('')).toContain('Python');
    expect(hasChanges(parts)).toBe(true);
    expect(hasChanges(diffWords('same text', 'same text'))).toBe(false);
    expect(diffWords('', 'new').map((p) => p.type)).toEqual(['added']);
  });
});

describe('parse (FR-AI-3)', () => {
  const schema = SCHEMAS['extract-requirements'];
  it('finds JSON in a fenced block, or bare, inside a chatty reply', () => {
    expect(findJson('Sure! Here it is:\n```json\n{"a":1}\n```\nHope this helps')).toEqual({ a: 1 });
    expect(findJson('Answer: {"a": {"b": 2}} done')).toEqual({ a: { b: 2 } });
    expect(findJson('no json here')).toBeUndefined();
  });
  it('validates against the task schema', () => {
    expect(parseStructured('{"requirements":[{"text":"SQL","kind":"must"}]}', schema).ok).toBe(true);
    expect(parseStructured('{"requirements":[{"text":"SQL","kind":"maybe"}]}', schema)).toMatchObject({ ok: false });
    expect(parseStructured('{"requirements":[{"text":"SQL","kind":"must","score":95}],"match":"95%"}', schema).ok).toBe(true); // extra keys are ignored, never shown
  });
  it('retries once, then falls back to raw text', async () => {
    let calls = 0;
    const ok = await withRetry(async () => (++calls === 1 ? 'oops' : '{"requirements":[]}'), schema);
    expect(ok.ok).toBe(true);
    expect(calls).toBe(2);
    calls = 0;
    const bad = await withRetry(async () => { calls++; return 'still not json'; }, schema);
    expect(bad).toMatchObject({ ok: false, raw: 'still not json' });
    expect(calls).toBe(2);
  });
});
