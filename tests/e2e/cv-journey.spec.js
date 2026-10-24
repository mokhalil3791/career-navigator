import { chooseLanguage, navigate, loadDemo, openTask } from './navigation.js';
// PR B: one advert through reviewed HTML/Word exports; no real provider calls.
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { test, expect, openApp, seriousAxe } from './fixtures.js';

import { readZipEntry } from '../../src/core/exports/zip.js';

test.use({ reducedMotion: 'reduce' });

async function exportsLocked(page) {
  await expect(page.getByTestId('export-cv')).toBeDisabled();
  await expect(page.getByTestId('export-docx')).toBeDisabled();
}

async function before(page, first, second) {
  expect(await page.locator(first).evaluate((el, selector) => !!(el.compareDocumentPosition(document.querySelector(selector)) & Node.DOCUMENT_POSITION_FOLLOWING), second)).toBe(true);
}

test('one advert, explicit draft, accept/edit/reject, review and inspect both exports', async ({ page }, info) => {
  await openApp(page, '#/profile');
  await page.locator('#field-profile-headline').fill('Fictional reporting assistant');
  await page.locator('#field-profile-about').fill('I checked weekly records.');
  await page.locator('#field-profile-skills').fill('Excel filters and SQL practice.');
  await page.locator('#field-profile-education').fill('Example college, 2020');
  await page.getByRole('button', { name: 'Next: Target job' }).click();
  await expect(page.getByRole('button', { name: 'Add an advert', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Paste a job advert' }).click();
  await page.locator('#job-title').fill('Fictional reporting role');
  await page.locator('#job-company').fill('Example employer');
  await expect(page.getByText('Paste advert text to tailor your CV to this role. You can still continue with a general CV.')).toBeVisible();
  await page.locator('#job-body').fill('Maintain weekly records using Excel and SQL.');
  await expect(page.locator('.job-card')).toHaveCount(1);
  await expect(page.locator('.job-select[aria-pressed=true]')).toContainText('Fictional reporting role');
  const evidence = page.getByRole('link', { name: "Check this advert's requirements" });
  await expect(evidence).toBeVisible();
  expect((await evidence.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await expect(page.locator('#job-evidence')).not.toHaveAttribute('open');
  await evidence.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#job-evidence')).toHaveAttribute('open');
  await expect(page.locator('#job-evidence-title')).toBeFocused();
  await expect(page.getByTestId('journey-ai')).toBeVisible();
  await expect(page.locator('.requirement')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue to my CV draft' }).click();
  await expect(page.locator('h1')).toBeFocused();
  await expect(page.locator('#field-cv-summary')).toHaveValue('I checked weekly records.');
  await exportsLocked(page);
  await expect(page.locator('.first-draft')).toBeVisible();
  await expect(page.locator('h1')).toBeFocused();
  await expect(page.locator('#field-cv-summary')).toHaveValue('I checked weekly records.');
  await expect(page.locator('#field-cv-education')).toHaveValue('Example college, 2020');
  await openTask(page);
  await expect(page.locator('#ai-outgoing')).toHaveValue(/Fictional reporting role/);
  const changes = [
    { field: 'summary', after: 'I checked weekly records using Excel.', source: 'I checked weekly records.', reason: 'Lead with recorded work' },
    { field: 'skills', after: 'SQL and Excel reporting.', source: 'Excel filters and SQL practice.', reason: 'Order for this advert' },
    { field: 'headline', after: 'REJECTED fictional director', source: 'Fictional reporting assistant', reason: 'Test rejection' },
  ];
  await page.locator('#ai-pasted').fill(JSON.stringify({ changes }));
  await page.getByRole('button', { name: 'Read the reply' }).click();
  await expect(page.locator('.proposal')).toHaveCount(3);
  await expect(page.locator('.proposal .diff ins')).not.toHaveCount(0);
  await expect(page.locator('#field-cv-summary')).toHaveValue('I checked weekly records.');
  await page.getByRole('button', { name: 'Return to my CV draft' }).click();
  await expect(page.locator('#field-cv-headline')).toBeFocused();
  await openTask(page);
  await expect(page.locator('.proposal:not(.done)')).toHaveCount(3);
  await page.locator('.proposal').nth(0).getByRole('button', { name: 'Accept', exact: true }).click();
  const edited = page.locator('.proposal').nth(1);
  await edited.getByText('Edit before accepting', { exact: true }).click();
  await edited.getByRole('textbox').fill('Excel filters; SQL practice in my own project.');
  await edited.getByRole('button', { name: 'Accept', exact: true }).click();
  await page.locator('.proposal').nth(2).getByRole('button', { name: 'Reject', exact: true }).click();
  await page.locator('.ai-panel').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('#field-cv-headline')).toHaveValue('Fictional reporting assistant');
  await expect(page.locator('#field-cv-skills')).toHaveValue('Excel filters; SQL practice in my own project.');
  await expect(page.getByRole('tab', { name: 'Letter', exact: true })).toBeVisible();
  await expect(page.locator('#field-cv-letter')).toHaveCount(0);
  await page.getByRole('button', { name: 'Preview CV text' }).click();
  await expect(page.getByRole('region', { name: 'CV text preview' })).toContainText('I checked weekly records using Excel.');
  await before(page, '.preview-sheet', '#cv-reviewed');
  await exportsLocked(page);
  await page.locator('#cv-reviewed').check();
  await expect(page.getByTestId('export-docx')).toBeEnabled();
  await page.locator('#field-cv-education').fill('Example college, 2020; checked by me');
  await exportsLocked(page);
  await page.locator('#cv-reviewed').check();
  for (const format of ['cv', 'docx']) {
    const downloading = page.waitForEvent('download');
    await page.getByTestId('export-' + format).click();
    const file = await downloading;
    const path = info.outputPath(file.suggestedFilename());
    await file.saveAs(path);
    const bytes = readFileSync(path);
    const text = format === 'docx' ? new TextDecoder().decode(await readZipEntry(bytes, 'word/document.xml')) : bytes.toString('utf8');
    expect(text).toContain('I checked weekly records using Excel.');
    expect(text).toContain('Excel filters; SQL practice in my own project.');
    expect(text).toContain('Example college, 2020; checked by me');
    expect(text).not.toContain('REJECTED fictional director');
    expect(text).not.toContain('SQL and Excel reporting.');
  }
  await page.getByRole('button', { name: 'Change or check my advert' }).click();
  await expect(page.locator('.job-card')).toHaveCount(1);
  await page.locator('#job-body').fill('Updated advert: maintain weekly records.');
  await page.getByRole('button', { name: 'Continue to my CV draft' }).click();
  await exportsLocked(page);
  await page.locator('#cv-reviewed').check();
  await navigate(page, 'My profile', 'profile');
  await page.locator('#field-profile-about').fill('Changed profile fact.');
  await navigate(page, 'My application', 'cv');
  await exportsLocked(page);
  await expect(page.locator('#field-cv-summary')).toHaveValue('I checked weekly records using Excel.');
});

test('returning CV and letter stay visible without a profile replacement shortcut', async ({ page }, info) => {
  await openApp(page, '#/cv');
  await page.locator('#field-cv-summary').fill('My returning draft.');
  await page.getByRole('tab', { name: 'Letter', exact: true }).click();
  await expect(page.locator('#field-cv-letter')).toBeFocused();
  await page.locator('#field-cv-letter').fill('My existing letter has claims to check.');
  await page.getByRole('tab', { name: /^(CV|Cv)$/ }).click();
  await page.locator('#cv-reviewed').check();
  await navigate(page, 'My profile', 'profile');
  await page.locator('#field-profile-about').fill('Replacement profile.');
  await navigate(page, 'My application', 'cv');
  await expect(page.locator('#field-cv-summary')).toHaveValue('My returning draft.');
  await expect(page.locator('#cv-review')).toContainText('My existing letter has claims to check.');
  await before(page, '#cv-review pre', '#cv-reviewed');
  await exportsLocked(page);
  await expect(page.getByRole('button', { name: 'Copy my profile into CV' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start from empty', exact: true })).toHaveCount(0);
  await expect(page.locator('#field-cv-summary')).toHaveValue('My returning draft.');
  await expect(page.locator('#cv-review')).toContainText('My existing letter has claims to check.');
  await expect(page.locator('#cv-review pre')).toBeVisible();
  await page.locator('#cv-reviewed').check();
  await page.getByRole('tab', { name: 'Letter', exact: true }).click();
  await page.locator('#field-cv-letter').fill('My reviewed letter, with a checked example.');
  await page.getByRole('tab', { name: /^(CV|Cv)$/ }).click();
  await exportsLocked(page);
  await page.locator('#cv-reviewed').check();
  for (const format of ['cv', 'docx']) {
    const downloading = page.waitForEvent('download');
    await page.getByTestId('export-' + format).click();
    const file = await downloading;
    const path = info.outputPath(file.suggestedFilename());
    await file.saveAs(path);
    const bytes = readFileSync(path);
    const text = format === 'docx' ? new TextDecoder().decode(await readZipEntry(bytes, 'word/document.xml')) : bytes.toString('utf8');
    expect(text).toContain('My reviewed letter, with a checked example.');
  }
  expect(seriousAxe(await new AxeBuilder({ page }).analyze())).toEqual([]);
});

test('general CV without AI or advert remains exportable, optional tools follow review', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 732 });
  await openApp(page);
  const welcome = page.locator('.welcome');
    await welcome.getByRole('button', { name: /Start my own/ }).click();
      await page.locator('#field-profile-about').fill('My manual general CV.');
  await navigate(page, 'My application', 'cv');
  await expect(page.locator('.first-draft')).toBeVisible();
  await expect(page.getByTestId('tailor')).toHaveCount(0);
  await expect(page.locator('#field-cv-summary')).toHaveValue('My manual general CV.');
  await exportsLocked(page);
  await page.locator('#cv-reviewed').check();
  await expect(page.getByTestId('export-cv')).toBeEnabled();
  await expect(page.getByTestId('export-docx')).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(seriousAxe(await new AxeBuilder({ page }).analyze())).toEqual([]);
});


test('Dutch narrow layout keeps evidence review and letter review accessible', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 732 });
  await openApp(page, '#/jobs');
  await chooseLanguage(page, 'nl');
  await page.getByRole('button', { name: 'Plak een vacature' }).click();
  await page.locator('#job-title').fill('Fictieve vacature');
  await page.locator('#job-body').fill('Excel gebruiken voor wekelijkse rapporten.');
  await page.getByRole('link', { name: 'De eisen van deze vacature bekijken' }).click();
  expect(seriousAxe(await new AxeBuilder({ page }).analyze())).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Verder naar mijn concept-cv' }).click();
  await page.locator('#field-cv-summary').fill('Fictieve werkervaring.');
  await page.getByRole('tab', { name: 'Brief', exact: true }).click();
  await page.locator('#field-cv-letter').fill('Mijn eigen motivatie.');
  await page.getByRole('tab', { name: /^(CV|Cv)$/ }).click();
  await before(page, '#cv-review pre', '#cv-reviewed');
  await exportsLocked(page);
  expect(seriousAxe(await new AxeBuilder({ page }).analyze())).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
