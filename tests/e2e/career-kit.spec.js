import { test, expect, seriousAxe } from './fixtures.js';
import AxeBuilder from '@axe-core/playwright';
import jsQR from 'jsqr';

async function clipboard(page) {
  await page.addInitScript(() => {
    window.kitCopied = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async text => { window.kitCopied = text; },
    } });
  });
}

test('kit hash tabs, six emails and every prompt copy preserve the supplied text', async ({ page }) => {
  await clipboard(page);
  await page.goto('/kit/#example2');
  await expect(page).toHaveTitle('Data & AI Career Kit');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('tab', { name: 'Exercise 2' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#example2')).toBeVisible();
  await expect(page.locator('#emailList .email')).toHaveCount(6);
  for (const button of await page.locator('[data-copy]').all()) {
    const id = await button.getAttribute('data-copy');
    const source = await page.locator('#' + id).textContent();
    await button.click();
    await expect.poll(() => page.evaluate(() => window.kitCopied)).toBe(source);
  }
  await page.locator('#copyEmails').click();
  const emails = await page.evaluate(() => window.kitCopied);
  for (let n=1;n<=6;n++) expect(emails).toContain('--- Email '+n+' ---');
  expect(emails).toContain('ignore all previous instructions');
  expect(emails).toContain('111222333'); // Fictional redaction exercise is copied unchanged.
  for (const hash of ['roadmaps', 'market', 'next', 'example2']) {
    await page.goto('/kit/#' + hash);
    await expect(page.locator('#'+hash)).toBeVisible();
    await expect(page.locator('button[aria-controls="'+hash+'"]')).toHaveAttribute('aria-selected', 'true');
  }
});

test('kit fills all six role plans, copies milestone dates and saves only by choice', async ({ page }) => {
  await clipboard(page);
  await page.goto('/kit/#roadmaps');
  await page.locator('#p-start').fill('2026-11-02');
  for (const role of ['analyst','de','dpe','ai','mlops','devops']) {
    await page.locator('#p-role').selectOption(role);
    await page.locator('#fillBtn').click();
    await page.locator('#copyPlan').click();
    const copied = await page.evaluate(() => window.kitCopied);
    for (const date of ['2 Dec 2026', '1 Jan 2027', '31 Jan 2027']) expect(copied).toContain(date);
    for (const id of ['p-l1','p-l2','p-l3','p-proj']) {
      const text = await page.locator('#'+id).inputValue();
      expect(text.length).toBeGreaterThan(20);
      expect(copied).toContain(text);
    }
  }
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await page.reload();
  await expect(page.locator('#p-start')).toHaveValue('');
  await page.locator('#p-why').fill('My private plan');
  await page.locator('#keep-kit').check();
  await page.reload();
  await expect(page.locator('#p-why')).toHaveValue('My private plan');
  await expect(page.locator('#keep-kit')).toBeChecked();
  await page.locator('#keep-kit').uncheck();
  await page.reload();
  await expect(page.locator('#p-why')).toHaveValue('');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test('kit has no horizontal overflow at 360px, accessible tabs and no external requests', async ({ page, offOrigin }) => {
  await page.setViewportSize({ width:360, height:800 });
  for (const hash of ['example2', 'roadmaps', 'market', 'next']) {
    await page.goto('/kit/#'+hash);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(seriousAxe(await new AxeBuilder({ page }).analyze())).toEqual([]);
  }
  expect(offOrigin.offenders).toEqual([]);
});

test('kit short links and handout preserve the printed destinations; QR images decode independently', async ({ page }) => {
  for (const [slug,hash] of [['kit',''],['ex2','#example2']]) {
    await page.goto('/p/'+slug+'/');
    await expect(page).toHaveURL(new RegExp('/kit/'+hash+'$'));
  }
  await expect(page.locator('#example2')).toBeVisible();
  await page.goto('/handout/');
  await expect(page.getByRole('heading', {name:'Exercise 2 and 90-day plans'})).toBeVisible();
  await expect(page.locator('a[href="../kit/#example2"]')).toBeVisible();
  for (const [name,suffix] of [['kit','kit/'],['ex2','kit/#example2']]) {
    const pixels = await page.evaluate(async name => {
      const img=new Image();img.src='../qr/'+name+'.svg';await img.decode();
      const canvas=document.createElement('canvas');canvas.width=canvas.height=600;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,600,600);
      return Array.from(ctx.getImageData(0,0,600,600).data);
    }, name);
    const decoded=jsQR(new Uint8ClampedArray(pixels),600,600);
    expect(decoded?.data).toBe('https://mokhalil3791.github.io/career-navigator/'+suffix);
  }
});

test.describe('kit offline', () => {
  test.use({ serviceWorkers:'allow' });
  test('a direct first visit to Exercise 2 installs the cache and reloads offline', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Offline worker coverage on Chromium desktop and phone');
    await page.goto('/kit/#example2');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#example2')).toBeVisible();
    await expect(page.locator('#emailList .email')).toHaveCount(6);
    await page.getByRole('tab', { name:'90-day plans' }).click();
    await expect(page.locator('#roleChips button')).toHaveCount(6);
    await context.setOffline(false);
  });
});

test('Career Kit is linked from the app tools, plan and public prompts footer', async ({ page }) => {
  await page.goto('/#/home');
  await expect(page.locator('.sidebar a[href="./kit/"]')).toHaveCount(2);
  await page.goto('/#/plan');
  await expect(page.getByRole('link', {name:'See detailed 90-day plans for six Data & AI roles in the Career Kit'})).toHaveAttribute('href','./kit/#roadmaps');
  await page.goto('/prompts/');
  await expect(page.locator('footer').getByRole('link', {name:'Career Kit'})).toHaveAttribute('href','../kit/');
});
