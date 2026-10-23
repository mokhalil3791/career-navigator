import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { extractCvText, MAX_CV_FILE_BYTES } from '../../src/core/import/cv-text.js';
import { estimatePages } from '../../src/core/cv.js';
import { profileText } from '../../src/core/prompts.js';
import { newWorkspace } from '../../src/core/schema.js';

const file = (/** @type {BlobPart} */ data, /** @type {string} */ name, type = '') => new File([data], name, { type });

describe('CV import (FR-PRO-2)', () => {
  it('reads TXT and DOCX files', async () => {
    expect(await extractCvText(file(readFileSync('tests/fixtures/cv/fictional-cv.txt'), 'cv.txt'))).toContain('Planned routes for 15 drivers');
    const docx = await extractCvText(file(readFileSync('tests/fixtures/cv/fictional-cv.docx'), 'cv.docx'));
    expect(docx).toContain('Planned routes for 15 drivers');
    expect(docx).toContain('Logistics coordinator');
  });
  it('refuses unsupported, empty and oversized files with plain messages', async () => {
    await expect(extractCvText(file('x', 'cv.doc'))).rejects.toThrow(/save them as \.docx/);
    await expect(extractCvText(file('   ', 'cv.txt'))).rejects.toThrow(/No text was found/);
    await expect(extractCvText(file(new Uint8Array(MAX_CV_FILE_BYTES + 1), 'cv.pdf'))).rejects.toThrow(/larger than 5 MB/);
    await expect(extractCvText(file('not a zip', 'cv.docx'))).rejects.toThrow(/not a valid DOCX/);
  });
  it('keeps at most 30,000 characters', async () => {
    expect((await extractCvText(file('a'.repeat(40000), 'long.txt'))).length).toBe(30000);
  });
});

describe('CV length warning (FR-CV-5)', () => {
  it('estimates pages from text length and lines', () => {
    expect(estimatePages({ summary: 'Short profile.' })).toBe(1);
    expect(estimatePages({ experience: 'Line\n'.repeat(130) })).toBeGreaterThan(2);
  });
});

describe('profileText includes schema-2 rows only when filled', () => {
  it('adds target roles, preferences, language and education rows', () => {
    const s = newWorkspace();
    expect(profileText(s, true)).toBe('');
    s.profile.targetRoles = ['Data analyst'];
    s.profile.workPreferences = { hours: '32', hybrid: 'hybrid', region: 'Utrecht' };
    s.profile.languageRows = [{ id: 'l', language: 'Dutch', level: 'A2', basis: 'self', certificate: '' }, { id: 'm', language: 'English', level: '', basis: '', certificate: '' }];
    s.profile.educationRows = [{ id: 'e', title: 'BSc', institution: 'Example University', country: 'Syria', year: '2018', idw: 'yes' }];
    const text = profileText(s, true);
    expect(text).toContain('Target roles:\nData analyst');
    expect(text).toContain('Hours: 32\nWay of working: hybrid\nRegion: Utrecht');
    expect(text).toContain('Dutch: A2, self-assessed');
    expect(text).toContain('English: level not stated, basis not stated');
    expect(text).toContain('BSc, Example University, Syria, 2018, IDW evaluation: yes');
  });
});
