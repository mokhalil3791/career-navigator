import { saveBackup, loadDemo, navigate } from './navigation.js';
import { readFileSync } from 'node:fs';
import { test, expect, openApp, gotoView } from './fixtures.js';
import { newWorkspace } from '../../src/core/schema.js';
import { draftCvFromProfile } from '../../src/core/cv.js';

async function restore(page, state) {
  await page.locator('#import-file').setInputFiles({ name: 'fictional.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(state)) });
  await expect(page.locator('#notice')).toContainText('Backup imported');
  await expect(page).toHaveURL(/#\/home$/);
}
async function backup(page, info) {
  const pending = page.waitForEvent('download');
  await saveBackup(page);
  const file = await pending, path = info.outputPath('auto-draft.json'); await file.saveAs(path);
  return JSON.parse(readFileSync(path, 'utf8'));
}
for (const width of [390, 1366]) test(`first draft, undo, persistence and backup review reset at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await openApp(page);
  const s = newWorkspace(); s.settings.onboarded = true;
  s.profile.experience = 'Fictional planner: planned routes using Excel.';
  s.profile.languages = 'English B2';
  s.profile.educationRows = [{ id: 'course', title: 'Recorded Excel course', institution: '', country: '', year: '', idw: '' }];
  await restore(page, s);
  const requests = []; page.on('request', r => requests.push(r.url()));
  await navigate(page, '', 'cv');
  await expect(page.locator('.first-draft')).toContainText('Check every line before you download.');
  for (const key of ['headline','summary','experience','education','skills','languages']) await expect(page.locator('#field-cv-' + key)).toHaveValue(draftCvFromProfile(s)[key]);
  await expect(page.getByTestId('export-cv')).toBeDisabled(); await expect(page.getByTestId('export-docx')).toBeDisabled();
  expect(requests).toEqual([]);
  await page.locator('#cv-reviewed').check();
  let saved = await backup(page, info); expect(saved.cv.autoDrafted).toBe(true);
  await restore(page, saved); await navigate(page, '', 'cv');
  await expect(page.locator('#cv-reviewed')).not.toBeChecked();
  await expect(page.getByTestId('export-cv')).toBeDisabled(); await expect(page.getByTestId('export-docx')).toBeDisabled();
  for (const key of ['headline','summary','experience','education','skills','languages']) await page.locator('#field-cv-' + key).fill('');
  await navigate(page, '', 'profile'); await navigate(page, '', 'cv');
  await expect(page.locator('#field-cv-experience')).toHaveValue('');
  saved = await backup(page, info); expect(saved.cv.autoDrafted).toBe(true);
  await restore(page, saved); await navigate(page, '', 'cv');
  await expect(page.locator('#field-cv-experience')).toHaveValue('');
});

test('source-only import does not draft; letter and LinkedIn each protect existing work', async ({ page }) => {
  await openApp(page);
  for (const field of ['source', 'letter', 'linkedin']) {
    const s = newWorkspace(); s.settings.onboarded = true;
    if (field === 'source') s.profile.cvText = 'Unaccepted source facts';
    else { s.profile.about = 'Recorded summary'; if (field === 'letter') s.cv.letter = 'Existing letter'; else s.cv.linkedin.about = 'Existing LinkedIn'; }
    await restore(page, s); await navigate(page, '', 'cv');
    await expect(page.locator('.first-draft')).toHaveCount(0);
    await expect(page.locator('#field-cv-summary')).toHaveValue('');
    if (field === 'letter') { await page.getByRole('tab', { name: 'Letter', exact: true }).click(); await expect(page.locator('#field-cv-letter')).toHaveValue('Existing letter'); }
    if (field === 'linkedin') { await page.getByRole('tab', { name: 'LinkedIn', exact: true }).click(); await expect(page.locator('#field-cv-linkedin-about')).toHaveValue('Existing LinkedIn'); }
  }
});

test('Sam follows the same automatic first-draft and undo path', async ({ page }) => {
  await openApp(page); await loadDemo(page); await navigate(page, '', 'cv');
  await expect(page.locator('.first-draft')).toBeVisible();
  await expect(page.locator('#field-cv-experience')).not.toHaveValue('');
  await expect(page.getByTestId('export-docx')).toBeDisabled();
  await page.getByRole('button', { name: 'Undo: start from empty' }).click();
  await gotoView(page, 'home'); await gotoView(page, 'cv');
  await expect(page.locator('#field-cv-experience')).toHaveValue('');
  await expect(page.getByTestId('export-docx')).toBeDisabled();
});

test('device reload preserves the cleared once-only decision', async ({ page }) => {
  await openApp(page, '#/profile');
  await page.locator('#field-profile-experience').fill('Recorded fictional planning work.');
  await page.getByRole('button', { name: 'Yes, keep it' }).click();
  await expect(page.locator('#notice')).toContainText('Workspace saved');
  await navigate(page, '', 'cv');
  await expect(page.locator('.first-draft')).toBeVisible();
  await page.getByRole('button', { name: 'Undo: start from empty' }).click();
  await expect.poll(() => page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('career-navigator'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    return await new Promise(resolve => { const r = db.transaction('kv').objectStore('kv').get('workspace'); r.onsuccess = () => { db.close(); const saved = JSON.parse(r.result || '{}'); resolve(saved.cv?.autoDrafted === true && saved.cv?.experience === ''); }; });
  })).toBe(true);
  await page.reload();
  await expect(page.locator('#notice')).toContainText('Your saved workspace is open');
  await expect(page.locator('#field-cv-experience')).toHaveValue('');
  await expect(page.locator('.first-draft')).toHaveCount(0);
  await expect(page.getByTestId('export-docx')).toBeDisabled();
  await expect(page.getByTestId('export-cv')).toBeDisabled();
});
