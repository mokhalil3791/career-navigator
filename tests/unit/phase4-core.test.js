import { describe, expect, it } from 'vitest';
import { normalizeWorkspace } from '../../src/core/schema.js';
import { buildICS, planItems, followUpItems } from '../../src/core/exports/ics.js';
import { createZip, readZipEntry, crc32 } from '../../src/core/exports/zip.js';
import { buildCvDocx } from '../../src/core/exports/docx.js';
import { docxText } from '../../src/core/import/cv-text.js';
import { encryptText, decryptText } from '../../src/core/crypto.js';
import { buildCoachPack, openCoachPack, readCoachPack, buildCoachNotes, readCoachNotes } from '../../src/core/exports/coach-pack.js';
import { weekSummary, weekStart, checkinItems } from '../../src/core/applications.js';
import { hostileWorkspace } from '../helpers/fixtures.js';
import { parseWorkspace } from '../../src/core/backup.js';
import { content } from '../../src/content/index.js';

const demo = () => normalizeWorkspace(content.demo);
const reviewed = () => ({ ...demo(), cv: { ...demo().cv, reviewed: true } });

describe('.ics export (FR-APP-2, FR-PLAN-3)', () => {
  it('builds valid all-day events with CRLF, escaping and folding', () => {
    const ics = buildICS([{ uid: 'a1', date: '2026-11-15', title: 'Follow up: Analyst, Example BV; call Anna', description: 'Line 1\nLine 2 ' + 'x'.repeat(120) }, { uid: 'bad', date: 'not a date', title: 'skipped' }], { now: new Date('2026-10-23T10:00:00Z') });
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261115\r\nDTEND;VALUE=DATE:20261116');
    expect(ics).toContain('SUMMARY:Follow up: Analyst\\, Example BV\\; call Anna');
    expect(ics).toContain('Line 1\\nLine 2');
    expect(ics).not.toContain('skipped');
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });
  it('plan items: next action and dated milestones; follow-ups skip closed applications', () => {
    const plan = { ...demo().plan, nextDate: '2026-11-01', milestoneDates: { day30: '2026-11-22', day60: '', day90: '2027-01-21' } };
    expect(planItems(plan).map((i) => i.uid)).toEqual(['next-action', 'milestone-day30', 'milestone-day90']);
    expect(followUpItems([{ id: 'a', followUp: '2026-11-02', stage: 'applied', title: 'A' }, { id: 'b', followUp: '2026-11-02', stage: 'rejected' }])).toHaveLength(1);
  });
});

describe('zip + DOCX (FR-CV-3, FR-PRO-2)', () => {
  it('crc32 matches the standard check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
  it('the DOCX export is locked until review (G3) and round-trips its text', async () => {
    expect(() => buildCvDocx(demo())).toThrow(/Review every CV/);
    const docx = buildCvDocx(reviewed());
    expect(String.fromCharCode(docx[0], docx[1])).toBe('PK');
    const text = await docxText(docx);
    expect(text).toContain('Sam — fictional example');
    expect(text).toContain('FICTIONAL EXAMPLE');
    expect(text).toContain('Cleaned weekly order records in Excel');
    expect(text).not.toMatch(/date of birth|nationality|photo/i);
  });
  it('escapes hostile text in the DOCX XML', async () => {
    const s = parseWorkspace(JSON.stringify(hostileWorkspace()));
    const docx = buildCvDocx({ ...s, cv: { ...s.cv, reviewed: true } });
    const xml = new TextDecoder().decode(/** @type {Uint8Array} */ (await readZipEntry(docx, 'word/document.xml')));
    expect(xml).not.toContain('<script>');
    expect(xml).toContain('&lt;script&gt;');
  });
  it('reads deflated DOCX entries (as Word writes them)', async () => {
    const xml = '<w:document><w:body><w:p><w:r><w:t>Hallo &amp; welkom</w:t></w:r></w:p><w:p><w:r><w:t>Regel 2</w:t><w:tab/><w:t>tab</w:t></w:r></w:p></w:body></w:document>';
    const deflated = new Uint8Array(await new Response(new Blob([xml]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
    const zip = createZip([{ name: 'word/document.xml', data: deflated }]);
    // Patch the entry to "deflate" (method 8) with the real uncompressed size, as Word would write it.
    const view = new DataView(zip.buffer);
    let p = zip.length - 22; const cd = view.getUint32(p + 16, true);
    view.setUint16(8, 8, true); view.setUint16(cd + 10, 8, true);
    expect(await docxText(zip)).toBe('Hallo & welkom\nRegel 2\ttab');
  });
});

describe('passphrase protection (Web Crypto)', () => {
  it('encrypts and decrypts; a wrong passphrase fails with a plain message', async () => {
    const box = await encryptText('secret CV text', 'correct horse');
    expect(box.data).not.toContain('secret');
    expect(await decryptText(box, 'correct horse')).toBe('secret CV text');
    await expect(decryptText(box, 'wrong pass')).rejects.toThrow(/passphrase is not correct/);
    await expect(encryptText('x', 'short')).rejects.toThrow(/at least 8/);
  });
});

describe('coach pack and coach notes (FR-COACH)', () => {
  it('an open pack shows the work pack and embeds a validated workspace', async () => {
    const html = await buildCoachPack(demo(), content);
    expect(html).toContain('My career work pack');
    expect(html).toContain('This file contains personal details');
    expect(html).toContain("default-src 'none'");
    const opened = await openCoachPack(html);
    expect(opened.profile.headline).toBe(demo().profile.headline);
    expect(opened.settings.remember).toBe(false);
  });
  it('a protected pack shows no personal details and needs the passphrase', async () => {
    const html = await buildCoachPack(demo(), content, { passphrase: 'a long passphrase' });
    expect(html).not.toContain('Operations coordinator');
    expect(readCoachPack(html)?.encrypted).toBe(true);
    await expect(openCoachPack(html, 'wrong passphrase')).rejects.toThrow(/passphrase is not correct/);
    expect((await openCoachPack(html, 'a long passphrase')).profile.headline).toBe(demo().profile.headline);
  });
  it('embedded JSON cannot break out of its script tag', async () => {
    const s = parseWorkspace(JSON.stringify(hostileWorkspace()));
    const html = await buildCoachPack(s, content);
    const script = html.slice(html.indexOf('id="career-navigator-coach-pack">'));
    expect(script.indexOf('</script>')).toBe(script.length - '</script></body></html>'.length);
    expect((await openCoachPack(html)).profile.headline).toContain('<script>');
  });
  it('rejects non-packs, damaged and oversized files', () => {
    expect(readCoachPack('<html></html>')).toBeNull();
    expect(() => readCoachPack('<script type="application/json" id="career-navigator-coach-pack">{bad</script>')).toThrow(/damaged/);
    expect(() => readCoachPack('x'.repeat(4 * 1024 * 1024 + 1))).toThrow(/too large/);
  });
  it('coach notes round-trip and are validated', () => {
    const text = buildCoachNotes([{ id: 'n1', section: 'cv', note: 'Lead with SQL.' }, { id: 'n2', section: 'plan', note: '  ' }], { coach: 'Coach A', now: new Date('2026-11-03') });
    const notes = readCoachNotes(text);
    expect(notes).toEqual([{ id: 'n1', section: 'cv', note: 'Lead with SQL.', coach: 'Coach A', date: '2026-11-03' }]);
    expect(readCoachNotes('{"format":"something-else"}')).toBeNull();
    expect(() => readCoachNotes(JSON.stringify({ format: 'career-navigator-coach-notes', version: 1, notes: [{ id: 'bad id!', note: 'x' }] }))).toThrow();
  });
});

describe('applications weekly view (FR-APP-3) and check-in items (FR-PLAN-2)', () => {
  it('counts this week and due follow-ups', () => {
    expect(weekStart('2026-10-23')).toBe('2026-10-19');
    const apps = [
      { id: 'a', dateApplied: '2026-10-20', stage: 'applied', followUp: '2026-10-27' },
      { id: 'b', dateApplied: '2026-10-10', stage: 'interview', followUp: '2026-10-21' },
      { id: 'c', dateApplied: '2026-10-22', stage: 'rejected', followUp: '2026-10-24' },
    ];
    const w = weekSummary(apps, '2026-10-23');
    expect(w.sentThisWeek.map((a) => a.id)).toEqual(['a', 'c']);
    expect(w.followUpsDue.map((a) => a.id)).toEqual(['b']);
    expect(w.overdue.map((a) => a.id)).toEqual(['b']);
  });
  it('check-in items are the plan priorities, milestones and next action', () => {
    expect(checkinItems(demo().plan).map((i) => i.id)).toEqual(['p0', 'p1', 'p2', 'day30', 'day60', 'day90', 'next']);
  });
});
