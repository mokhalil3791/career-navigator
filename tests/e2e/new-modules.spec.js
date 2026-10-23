// @ts-check
// Phase 4: journey 1 (coach round trip), CV import, DOCX export, applications, .ics and check-in.
import { readFileSync } from 'node:fs';
import { test, expect, openApp, navigate, loadDemo, gotoView } from './fixtures.js';

/** @param {import('@playwright/test').Page} page */
async function download(page, /** @type {() => Promise<unknown>} */ trigger, /** @type {string} */ path) {
  const wait = page.waitForEvent('download');
  await trigger();
  const file = await wait;
  await file.saveAs(path);
  return file.suggestedFilename();
}

test('journey 1: example → review adverts → coach pack → coach view → note → import note → delete everything', async ({ page, browser }, info) => {
  await openApp(page);
  await loadDemo(page);
  await navigate(page, 'Compare jobs', 'jobs');
  for (const title of ['Junior Data Analyst — fictional', 'Data Engineer — fictional', 'Platform / Cloud DevOps Engineer — fictional']) {
    await page.locator('.job-select', { hasText: title }).click();
    await expect(page.locator('#job-title')).toHaveValue(title);
  }
  await gotoView(page, 'plan');
  await page.getByTestId('coach-pack').click();
  await expect(page.getByText('This file contains personal details').first()).toBeVisible();
  await page.locator('#coach-pass').fill('workshop-2026');
  await page.locator('#coach-pass2').fill('workshop-2026');
  const packPath = info.outputPath('coach-pack.html');
  expect(await download(page, () => page.getByTestId('download-coach-pack').click(), packPath)).toBe('fictional-example-coach-pack.html');
  expect(readFileSync(packPath, 'utf8')).not.toContain('Operations coordinator'); // protected: no plain personal details

  // The coach: a different browser profile, same public app, nothing uploaded.
  const coachContext = await browser.newContext();
  const coach = await coachContext.newPage();
  coach.on('dialog', (d) => (d.type() === 'prompt' ? d.accept('workshop-2026') : d.accept()));
  await coach.goto('./#/coach');
  await coach.locator('#import-file').setInputFiles(packPath);
  await expect(coach.locator('h1')).toHaveText('Review and add notes.');
  await expect(coach.locator('main')).toContainText('Junior Data Analyst — fictional');
  await coach.locator('#coach-name').fill('Coach R.');
  await coach.locator('#coach-note-cv').fill('Lead with the SQL project; keep the CV to two pages.');
  const notesPath = info.outputPath('coach-notes.json');
  await download(coach, () => coach.getByTestId('download-coach-notes').click(), notesPath);
  await coachContext.close();

  // Back to the job seeker: notes appear beside the CV and change nothing else.
  const before = await page.evaluate(() => document.querySelector('#field-plan-targetRole') && /** @type {HTMLInputElement} */ (document.querySelector('#field-plan-targetRole')).value);
  await page.locator('#import-file').setInputFiles(notesPath);
  await expect(page.locator('#notice')).toContainText('1 coach notes added');
  await gotoView(page, 'cv');
  await expect(page.locator('.coach-notes')).toContainText('Lead with the SQL project');
  await expect(page.locator('.coach-notes')).toContainText('Coach R.');
  await gotoView(page, 'plan');
  expect(await page.locator('#field-plan-targetRole').inputValue()).toBe(before);

  // Delete everything.
  await page.locator('.privacy-drawer summary').click();
  await page.getByTestId('delete-everything').click();
  await expect(page.locator('#notice')).toContainText('Everything this app stored in this browser has been deleted.');
  await expect(page.locator('.banner')).toHaveCount(0);
  expect(await page.evaluate(async () => (await indexedDB.databases?.())?.some((d) => d.name === 'career-navigator') ?? false)).toBe(false);
});

for (const kind of ['pdf', 'docx', 'txt']) {
  test(`CV import from ${kind.toUpperCase()} goes into "Paste an existing CV" only (FR-PRO-2)`, async ({ page }) => {
    await openApp(page, '#/profile');
    await page.locator('#cv-file').setInputFiles(`tests/fixtures/cv/fictional-cv.${kind}`);
    await expect(page.locator('#field-profile-cvText')).toHaveValue(/Planned routes for 15 drivers/);
    await expect(page.locator('#field-profile-experience')).toHaveValue('');
    await expect(page.locator('#field-profile-headline')).toHaveValue('');
  });
}

test('DOCX export is locked until review, then downloads a Word file (FR-CV-3)', async ({ page }, info) => {
  await openApp(page);
  await loadDemo(page);
  await gotoView(page, 'cv');
  await expect(page.getByTestId('export-docx')).toBeDisabled();
  await page.locator('#cv-reviewed').check();
  const path = info.outputPath('cv.docx');
  expect(await download(page, () => page.getByTestId('export-docx').click(), path)).toBe('fictional-example-cv.docx');
  expect(readFileSync(path).subarray(0, 2).toString()).toBe('PK');
});

test('applications tracker with weekly view and .ics follow-ups (FR-APP)', async ({ page }, info) => {
  await openApp(page);
  await loadDemo(page);
  await navigate(page, 'Applications', 'applications');
  await page.getByRole('button', { name: /Track “Junior Data Analyst/ }).click();
  const card = page.locator('article.application').first();
  await expect(card.locator('input[id^=app-title]')).toHaveValue('Junior Data Analyst — fictional');
  await card.locator('select[id^=app-stage]').selectOption('applied');
  const today = new Date().toISOString().slice(0, 10);
  await card.locator('input[id^=app-date]').fill(today);
  await card.locator('input[id^=app-follow]').fill(today);
  await card.locator('input[id^=app-contact]').fill('Recruiter (fictional)');
  await expect(page.locator('.grid.three')).toContainText('1 sent');
  const path = info.outputPath('follow-ups.ics');
  await download(page, () => page.getByRole('button', { name: 'Export follow-ups (.ics)' }).click(), path);
  const ics = readFileSync(path, 'utf8');
  expect(ics).toContain('BEGIN:VCALENDAR');
  expect(ics).toContain('SUMMARY:Follow up: Junior Data Analyst — fictional');
});

test('plan: milestone dates, .ics export and weekly check-in (FR-PLAN-2/3)', async ({ page }, info) => {
  await openApp(page);
  await loadDemo(page);
  await gotoView(page, 'plan');
  await page.locator('#field-plan-nextDate').fill('2026-11-05');
  await page.locator('#date-day30').fill('2026-12-01');
  const path = info.outputPath('plan.ics');
  await download(page, () => page.getByTestId('plan-ics').click(), path);
  expect(readFileSync(path, 'utf8')).toContain('DTSTART;VALUE=DATE:20261201');
  await page.locator('.route-picker input[type=checkbox]').first().check();
  await page.locator('#checkin-blocker').fill('Little time this week');
  await page.locator('#checkin-next').fill('Write ten SQL queries.');
  await page.getByTestId('save-checkin').click();
  await expect(page.locator('#field-plan-nextAction')).toHaveValue('Write ten SQL queries.');
  await expect(page.locator('main')).toContainText('1 done · blocker: Little time this week');
});

test('profile rows: languages with CEFR and basis, education with IDW (FR-PRO-4/5), target roles (FR-PRO-1)', async ({ page }) => {
  await openApp(page, '#/profile');
  await page.locator('#profile-languages-details summary').click();
  await page.getByRole('button', { name: 'Add a language' }).click();
  await page.locator('input[id^=lang-]').fill('Dutch');
  await page.locator('select[id^=level-]').selectOption('B1');
  await page.locator('select[id^=basis-]').selectOption('certified');
  await page.locator('input[id^=cert-]').fill('Staatsexamen NT2 programme I');
  await page.locator('#profile-education-details summary').click();
  await page.getByRole('button', { name: 'Add education', exact: true }).click();
  await page.locator('input[id^=edu-title-]').fill('Bachelor of Accounting');
  await page.locator('select[id^=edu-idw-]').selectOption('applied');
  await page.getByText('Optional: target roles and work preferences', { exact: true }).click();
  await page.locator('#target-0').fill('Financial administrator');
  await gotoView(page, 'prompts');
  await expect(page.locator('#prompt-preview')).toHaveValue(/Dutch: B1, certified \(Staatsexamen NT2 programme I\)/);
  await expect(page.locator('#prompt-preview')).toHaveValue(/Bachelor of Accounting, IDW evaluation: applied/);
  await expect(page.locator('#prompt-preview')).toHaveValue(/Target roles:\\nFinancial administrator|Target roles:\nFinancial administrator/);
});

test('a coach pack larger than 1 MiB (a well-filled workspace) still opens in the coach view', async ({ page }, info) => {
  const { buildCoachPack } = await import('../../src/core/exports/coach-pack.js');
  const { newWorkspace } = await import('../../src/core/schema.js');
  const s = newWorkspace();
  s.profile.headline = 'Large fictional workspace';
  for (let i = 0; i < 8; i++) s.jobs.push({ id: 'j' + i, title: 'Fictional advert ' + i, company: 'Example', url: '', body: 'Advert text. '.repeat(3000), reason: '', requirements: [] });
  for (const k of ['summary', 'experience', 'education', 'skills', 'languages']) s.cv[k] = 'CV text. '.repeat(2000);
  for (const k of ['profile', 'search', 'compare', 'fit', 'tailor', 'interview', 'letter']) s.ai.drafts[k] = 'Draft text. '.repeat(3000);
  const html = await buildCoachPack(s, { interviewQuestions: [] });
  expect(html.length).toBeGreaterThan(1048576);
  const path = info.outputPath('large-coach-pack.html');
  (await import('node:fs')).writeFileSync(path, html);
  await page.goto('./#/coach');
  await page.locator('#import-file').setInputFiles(path);
  await expect(page.locator('h1')).toHaveText('Review and add notes.');
  await expect(page.locator('main')).toContainText('Large fictional workspace');
});
