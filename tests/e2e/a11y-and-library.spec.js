// @ts-check
// NFR-A11Y-2: axe-core on every page (empty and demo). FR-LIB: prompt library page.
import AxeBuilder from '@axe-core/playwright';
import { test, expect, openApp, loadDemo, seriousAxe, gotoView, sidebarDiagnostics } from './fixtures.js';
// Axe measures colours; transitions (toast, hover lift) can give false contrast results mid-animation.
test.use({ reducedMotion: 'reduce' });

const PAGES = ['home', 'profile', 'jobs', 'cv', 'interview', 'plan', 'prompts'];

/** @param {import('@playwright/test').Page} page */
async function seriousViolations(page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return seriousAxe(results);
}

for (const demo of [false, true]) {
  test(`axe: no serious issues on any page (${demo ? 'demo' : 'empty'})`, async ({ page }) => {
    await openApp(page);
    if (demo) await loadDemo(page);
    for (const id of PAGES) {
      await gotoView(page, id);
      await expect(page.locator('h1')).toBeVisible();
      const found = await seriousViolations(page);
      expect(found, `${id} (scrollY ${await page.evaluate(() => window.scrollY)}) ${found.length ? await sidebarDiagnostics(page) : ''}`).toEqual([]);
    }
  });
}

test.describe('public prompt library', () => {
  test('loads without the app, copies a prompt, and passes axe', async ({ page }) => {
    await page.goto('/prompts/');
    await expect(page.locator('h1')).toHaveText('Free AI career prompts');
    await expect(page.locator('article.prompt')).toHaveCount(7);
    await page.locator('#check [data-copy]').click();
    await expect(page.locator('.status')).toContainText(/copied|selected/);
    expect(await seriousViolations(page)).toEqual([]);
    expect(await page.evaluate(() => document.cookie + localStorage.length + sessionStorage.length)).toBe('00');
  });
  test('short links jump to the prompt', async ({ page }) => {
    await page.goto('/p/tailor/');
    await expect(page).toHaveURL(/\/prompts\/#tailor$/);
  });
  test('hosted v0.1 at the root still works, without score-requesting originals', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    const select = page.locator('#mobile-view');
    if (await select.isVisible()) await select.selectOption('prompts');
    else await page.getByRole('button', { name: 'AI prompt studio' }).first().click();
    await expect(page.locator('#prompt-preview')).not.toHaveValue(/match score from 0 to 100/);
  });
});

test('the printed prompt handout fits on one A4 page', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium' || !!test.info().project.use.isMobile, 'PDF printing is Chromium desktop only');
  await page.goto('/prompts/');
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  expect(pages).toBe(1);
});
