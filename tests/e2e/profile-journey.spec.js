// PR A: import first, optional details, and navigation without a verification claim.
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { test, expect, openApp, seriousAxe } from './fixtures.js';
import { navigate } from './navigation.js';
import { newWorkspace } from '../../src/core/schema.js';

test.use({ reducedMotion: 'reduce' });

test('phone-sized profile starts with local PDF import and preserves source-only behavior', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 732 });
  const warnings = [];
  page.on('console', (message) => { if (message.type() === 'warning') warnings.push(message.text()); });
  await openApp(page);
  const welcome = page.locator('.welcome');
  await welcome.getByRole('button', { name: 'Next', exact: true }).click();
  await welcome.getByRole('button', { name: /Start my own/ }).click();
  await welcome.locator('input[value=copy]').check();
  await welcome.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.locator('#cv-file')).toBeInViewport({ ratio: 1 });
  expect((await page.locator('#cv-file').boundingBox()).height).toBeGreaterThanOrEqual(44);
  await expect(page.locator('main .card').first()).toContainText('Start with your CV');
  await expect(page.locator('#profile-education-details')).not.toHaveAttribute('open');
  await expect(page.locator('#profile-languages-details')).not.toHaveAttribute('open');
  await page.locator('#cv-file').setInputFiles('tests/fixtures/cv/fictional-cv.pdf');
  const expected = readFileSync('tests/fixtures/cv/fictional-cv.txt', 'utf8').trim();
  await expect(page.locator('#field-profile-cvText')).toHaveValue(expected);
  await expect(page.locator('#field-profile-cvText')).toBeVisible();
  for (const key of ['headline', 'experience', 'education', 'languages']) {
    await expect(page.locator('#field-profile-' + key)).toHaveValue('');
  }
  await expect(page.getByTestId('suggest-fields')).toBeVisible();
  // Record diagnostics without suppressing or requiring a pdf.js warning to persist.
  await info.attach('pdf-import-warnings', { body: JSON.stringify(warnings, null, 2), contentType: 'application/json' });
  await page.getByRole('button', { name: 'Next: add a job advert' }).click();
  await expect(page).toHaveURL(/#\/jobs$/);
  await navigate(page, 'My application', 'cv');
  await expect(page.locator('#cv-reviewed')).not.toBeChecked();
  await expect(page.getByTestId('export-cv')).toBeDisabled();
  await expect(page.getByTestId('export-docx')).toBeDisabled();
});

test('manual and pasted sources remain available without AI or duplicate entry', async ({ page }) => {
  await openApp(page);
  const welcome = page.locator('.welcome');
  await welcome.getByRole('button', { name: 'Next', exact: true }).click();
  await welcome.getByRole('button', { name: /Start my own/ }).click();
  await welcome.locator('input[value=none]').check();
  await welcome.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Enter facts myself' }).click();
  await expect(page.locator('#field-profile-headline')).toBeFocused();
  await page.locator('#field-profile-headline').fill('Fictional planner');
  await page.locator('#field-profile-education').fill('Original diploma, Example college, 2020');
  await page.locator('#field-profile-languages').fill('Dutch A2, self-assessed');
  const source = page.getByText('Paste or check CV text', { exact: true });
  await source.focus();
  await page.keyboard.press('Enter');
  await page.locator('#field-profile-cvText').fill('Fictional source: planned routes in Excel.');
  await expect(page.getByTestId('suggest-fields')).toHaveCount(0);
  await expect(page.locator('#field-profile-experience')).toHaveValue('');
  await expect(page.locator('#profile-languages-details')).not.toHaveAttribute('open');
  await page.getByRole('button', { name: 'Next: add a job advert' }).click();
  await navigate(page, 'My profile', 'profile');
  await expect(page.locator('#field-profile-languages')).toHaveValue('Dutch A2, self-assessed');
  await expect(page.locator('#field-profile-cvText')).toBeVisible();
  await navigate(page, 'My application', 'cv');
  await page.getByRole('button', { name: 'Create draft from my profile' }).click();
  await expect(page.locator('#field-cv-education')).toHaveValue('Original diploma, Example college, 2020');
  await expect(page.locator('#field-cv-languages')).toHaveValue('Dutch A2, self-assessed');
});

for (const language of ['en', 'nl']) {
  test(`existing text and structured details stay discoverable and survive backup (${language})`, async ({ page }, info) => {
    const state = newWorkspace();
    state.settings.onboarded = true;
    state.settings.uiLanguage = language;
    state.profile.education = 'Original diploma, Example college';
    state.profile.languages = 'English B2';
    state.profile.educationRows = [{ id: 'edu-test', title: 'Course', institution: 'Example institute', country: '', year: '2021', idw: '' }];
    state.profile.languageRows = [{ id: 'lang-test', language: 'Dutch', level: 'A2', basis: 'self', certificate: '' }];
    state.profile.targetRoles = ['Planner'];
    await openApp(page);
    await page.locator('#import-file').setInputFiles({ name: 'fictional.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(state)) });
    // Import renders the state before its asynchronous storage cleanup navigates home.
    // Wait for completion, not just the early language change, before navigating away.
    await expect(page.locator('#notice')).toContainText('Backup imported.');
    await expect(page.locator('#ui-language')).toHaveValue(language);
    const openProfile = async () => {
      if (await page.locator('#mobile-view').isVisible()) await page.locator('#mobile-view').selectOption('profile');
      else await page.getByRole('navigation', { name: language === 'en' ? 'Main navigation' : 'Hoofdnavigatie' }).getByRole('button', { name: language === 'en' ? 'My profile' : 'Mijn profiel', exact: true }).click();
    };
    await openProfile();
    for (const subject of ['education', 'languages']) await expect(page.locator('#profile-' + subject + '-details')).toHaveAttribute('open', '');
    await expect(page.locator('#lang-lang-test')).toHaveValue('Dutch');
    await expect(page.locator('#edu-title-edu-test')).toHaveValue('Course');
    await expect(page.locator('#target-0')).toBeVisible();
    await expect(page.locator('#field-profile-languages')).toHaveValue('English B2');
    await page.locator('#lang-lang-test').fill('Nederlands');
    const results = await new AxeBuilder({ page }).analyze();
    expect(seriousAxe(results)).toEqual([]);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: language === 'en' ? 'Save backup' : 'Back-up opslaan', exact: true }).click();
    const file = await download;
    const path = info.outputPath('profile.json');
    await file.saveAs(path);
    const backup = JSON.parse(readFileSync(path, 'utf8'));
    expect(backup.profile).toEqual({ ...state.profile, languageRows: [{ ...state.profile.languageRows[0], language: 'Nederlands' }] });
    await page.locator('#import-file').setInputFiles(path);
    await expect(page).toHaveURL(/#\/home$/);
    await openProfile();
    await expect(page.locator('#lang-lang-test')).toHaveValue('Nederlands');
    await expect(page.locator('#field-profile-education')).toHaveValue(state.profile.education);
    await page.setViewportSize({ width: 360, height: 732 });
    // Firefox can resolve resize before the responsive layout has been painted.
    await expect(page.locator('#mobile-view')).toBeVisible();
    await expect.poll(() => page.evaluate(() => {
      if (document.documentElement.scrollWidth <= innerWidth) return 'No horizontal overflow';
      const overflowing = [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
        .map((el) => ({ tag: el.tagName, id: el.id, class: el.className, right: el.getBoundingClientRect().right }));
      return JSON.stringify({ viewport: innerWidth, width: document.documentElement.scrollWidth, overflowing });
    })).toBe('No horizontal overflow');
  });
}
