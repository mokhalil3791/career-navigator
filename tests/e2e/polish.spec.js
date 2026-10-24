import { test, expect, openApp, gotoView } from './fixtures.js';
import { loadDemo, navigate, saveBackup } from './navigation.js';
import { STATUS_LABELS, needsEvidence } from '../../src/core/evidence.js';
import { readFileSync } from 'node:fs';

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });

test('Home has one action pair before welcome, after dismissal and in the demo', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('.welcome .actions button')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Start my own', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Try the example', exact: true })).toHaveCount(1);
  await expect(page.locator('.home-actions')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start my own', exact: true }).click();
  await navigate(page, '', 'home');
  await expect(page.locator('.welcome')).toHaveCount(0);
  await expect(page.locator('.home-actions button')).toHaveCount(2);
  await expect(page.getByTestId('load-demo')).toHaveCount(1);
  await loadDemo(page);
  await expect(page.getByTestId('load-demo')).toHaveCount(0);
  await expect(page.locator('.home-actions button')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Start my own', exact: true })).toHaveCount(1);
});

test('phone header keeps tools in the menu and warns only with the first-edit save prompt', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('.topbar')).toBeHidden();
  await expect(page.locator('.mobile-save-status')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Device saving' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Start my own', exact: true }).click();
  await expect(page.locator('.mobile-save-status')).toHaveCount(0);
  await page.locator('#field-profile-headline').fill('Fictional planner');
  await expect(page.locator('.mobile-save-status')).toHaveAccessibleName('Not saved — download a backup');
  await expect(page.getByRole('region', { name: 'Device saving' })).toBeVisible();
  const boxes = await page.locator('.sidebar .brand, .mobile-save-status, .nav-sheet>summary').evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON()));
  expect(Math.max(...boxes.map(b => b.top))).toBeLessThan(Math.min(...boxes.map(b => b.bottom)));
  await page.getByRole('region', { name: 'Device saving' }).getByRole('button', { name: 'Not now' }).click();
  await page.locator('#field-profile-headline').fill('Fictional route planner');
  await expect(page.getByRole('region', { name: 'Device saving' })).toHaveCount(0);
  await page.locator('.nav-sheet summary').click();
  await expect(page.locator('#ui-language-menu')).toBeVisible();
  await expect(page.locator('.menu-tools').getByRole('button', { name: 'Save backup' })).toBeVisible();
  await page.locator('.nav-sheet [data-route=settings]').click();
  await expect(page.locator('#ui-language-settings')).toBeVisible();
  await expect(page.locator('main').getByRole('button', { name: 'Save backup' })).toBeVisible();
});

test('sticky Back/Next stays at the viewport bottom on every step and toasts stay above', async ({ page }) => {
  await openApp(page); await loadDemo(page);
  for (const id of ['profile', 'jobs', 'cv', 'interview', 'plan', 'applications']) {
    await navigate(page, '', id);
    await saveBackup(page);
    await expect(page.locator('#notice')).toHaveClass(/visible/);
    for (const fraction of [0, 0.5, 1]) {
      await page.evaluate(f => scrollTo(0, document.documentElement.scrollHeight * f), fraction);
      const layout = await page.evaluate(() => {
        const bar = document.querySelector('.journey-footer'), toast = document.querySelector('#notice');
        return { position: getComputedStyle(bar).position, bar: bar.getBoundingClientRect().toJSON(), toast: toast.getBoundingClientRect().toJSON(), height: innerHeight };
      });
      expect(layout.position).toBe('sticky');
      expect(layout.bar.bottom).toBeCloseTo(layout.height, 0);
      expect(layout.bar.top).toBeGreaterThan(0);
      expect(layout.toast.bottom).toBeLessThanOrEqual(layout.bar.top - 8);
    }
  }
});

test('Sam requirements collapse below four screens, expand one at a time and retain every field', async ({ page }) => {
  const demo = JSON.parse(readFileSync('content/demo/sam.json', 'utf8'));
  await openApp(page); await loadDemo(page); await navigate(page, '', 'jobs');
  await expect(page.locator('#job-evidence')).toHaveAttribute('open');
  await expect(page.locator('.requirement[open]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(4 * 844);
  const fields = () => page.locator('.requirement input, .requirement textarea, .requirement select').evaluateAll(els => els.map(el => ({ id: el.id, value: el.value })));
  const before = await fields();
  const job = demo.jobs.find(j => j.id === demo.selectedJobId) || demo.jobs[0];
  for (let i = 0; i < job.requirements.length; i++) {
    const row = page.locator('.requirement').nth(i), requirement = job.requirements[i];
    await expect(row.locator('summary')).toContainText(requirement.text);
    await expect(row.locator('summary .pill')).toHaveText(STATUS_LABELS[needsEvidence(requirement) ? 'unknown' : requirement.status]);
    await row.locator('summary').click();
    await expect(page.locator('.requirement[open]')).toHaveCount(1);
    await expect(row.locator('textarea')).toBeVisible();
  }
  expect(await fields()).toEqual(before);
});

test('CV offers Undo without replacement shortcuts and makes Word primary', async ({ page }) => {
  await openApp(page); await loadDemo(page); await navigate(page, '', 'cv');
  await expect(page.getByRole('button', { name: 'Undo: start from empty' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start from empty', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Copy my profile into CV' })).toHaveCount(0);
  await expect(page.getByTestId('export-docx')).not.toHaveClass(/secondary/);
  await expect(page.getByTestId('export-cv')).toHaveClass(/secondary/);
  await expect(page.getByTestId('export-docx')).toBeDisabled();
  await expect(page.getByTestId('export-cv')).toBeDisabled();
  await expect(page.locator('.journey-footer').getByRole('button', { name: 'Next: practise and plan' })).toBeVisible();
});

