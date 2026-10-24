import { navigate, loadDemo, openTask } from './navigation.js';
// @ts-check
// Phase 3: journey 4 (Dutch interface), onboarding, knowledge cards, axe in English and Dutch.
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { test, expect, openApp, seriousAxe, gotoView, sidebarDiagnostics } from './fixtures.js';
// Axe measures colours; transitions (toast, hover lift) can give false contrast results mid-animation.
test.use({ reducedMotion: 'reduce' });

test('one-screen welcome explains privacy before data entry and keeps language choice', async ({ page }) => {
 await openApp(page); const welcome = page.locator('.welcome');
 await expect(welcome.locator('li')).toHaveCount(3);
 await expect(welcome.getByRole('link')).toHaveAttribute('href', /PRIVACY\.md$/);
 await page.locator('#ui-language').selectOption('nl');
 await expect(welcome.getByRole('heading')).toHaveText('Welkom');
 await expect(page.locator('html')).toHaveAttribute('lang','nl');
 await welcome.getByRole('button', { name: /Begin met mijn eigen|Begin met een lege/ }).click();
 await expect(page.locator('h1')).toHaveText('1. Mijn verhaal');
 await expect(page.locator('.welcome')).toHaveCount(0);
});

test('journey 4: Dutch interface, profile and plan in Dutch, CV stays in the chosen application language', async ({ page }, info) => {
  await openApp(page);
  await page.locator('#ui-language').selectOption('nl');
  await gotoView(page, 'profile');
  await expect(page.locator('h1')).toHaveText('1. Mijn verhaal');
  await page.locator('#field-profile-headline').fill('Data-analist in opleiding');
  await page.locator('#field-profile-experience').fill('2020–2024 | Operationeel coördinator | Voorbeeld BV (fictief)');
  await gotoView(page, 'plan');
  await expect(page.locator('h1')).toHaveText('4. Volgende stappen');
  await page.locator('#role-template').selectOption('data_analyst');
  await page.getByRole('button', { name: 'Deze sjabloon gebruiken' }).click();
  await page.locator('#field-plan-nextAction').fill('Eén vacature kiezen en de vraag voor mijn portfolio opschrijven.');
  await gotoView(page, 'cv');
  await expect(page.locator('.first-draft')).toBeVisible();
  await page.locator('#cv-reviewed').check();
  const english = page.waitForEvent('download');
  await page.getByTestId('export-cv').click();
  const path = info.outputPath('cv-en.html');
  await (await english).saveAs(path);
  const html = readFileSync(path, 'utf8');
  expect(html).toContain('<html lang="en">');
  expect(html).toContain('<h2>Experience</h2>');
  // Choosing Dutch as the CV language changes the CV, not because of the interface.
  await page.locator('#app-language').selectOption('Dutch');
  await page.locator('#cv-reviewed').check();
  const dutch = page.waitForEvent('download');
  await page.getByTestId('export-cv').click();
  const path2 = info.outputPath('cv-nl.html');
  await (await dutch).saveAs(path2);
  expect(readFileSync(path2, 'utf8')).toContain('<h2>Werkervaring</h2>');
});

test('knowledge cards show sources and review dates, never TODO notes; past events are hidden', async ({ page }) => {
  await openApp(page, '#/learn');
  await expect(page.locator('h1')).toHaveText('Know how it works here.');
  const cards = page.locator('details.knowledge');
  await expect(cards).toHaveCount(10);
  for (let i = 0; i < 10; i++) await cards.nth(i).locator('summary').click();
  await expect(page.locator('main')).not.toContainText('TODO');
  await expect(cards.first()).toContainText('Last reviewed: 2026-10-23');
  await expect(page.getByText('Example past event')).toHaveCount(0);
  await expect(page.locator('.event-list')).toContainText('Data & AI career workshop');
  await gotoView(page, 'cv');
  await expect(page.locator('details.knowledge summary').first()).toContainText('Dutch CV and motivation letter');
});

for (const lang of ['en', 'nl']) {
  test(`axe: no serious issues on every page in ${lang === 'en' ? 'English' : 'Dutch'} (NFR-A11Y-2)`, async ({ page }) => {
    await openApp(page);
    await page.locator('#ui-language').selectOption(lang);
    await loadDemo(page, lang === 'en' ? 'Try a fictional example' : 'Probeer een fictief voorbeeld');
    for (const id of ['home', 'profile', 'jobs', 'cv', 'interview', 'plan', 'prompts', 'learn']) {
      await gotoView(page, id);
      await expect(page.locator('h1')).toBeVisible();
      await page.locator('details').evaluateAll((els) => els.forEach((d) => { /** @type {HTMLDetailsElement} */ (d).open = true; }));
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const found = seriousAxe(results);
      expect(found, `${lang}/${id} (scrollY ${await page.evaluate(() => window.scrollY)}) ${found.length ? await sidebarDiagnostics(page) : ''}`).toEqual([]);
    }
  });
}
