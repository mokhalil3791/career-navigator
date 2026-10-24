import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { test, expect, openApp, gotoView, seriousAxe } from './fixtures.js';
import { mockGemini } from './mock-ai.js';
import { readZipEntry } from '../../src/core/exports/zip.js';

test.use({ reducedMotion: 'reduce' });
for (const [width, height] of [[390,844],[1366,900]]) {
  test(`Start and Next journey with fictional CV and mocked Gemini at ${width}px`, async ({ page, offOrigin }, info) => {
    await page.setViewportSize({ width, height });
    const calls = await mockGemini(page, offOrigin);
    await openApp(page);
    await expect(page.getByTestId('load-demo')).toBeVisible();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('#cv-file').setInputFiles('tests/fixtures/cv/fictional-cv.pdf');
    await expect(page.locator('#field-profile-cvText')).toHaveValue(/Planned routes for 15 drivers/);
    await page.getByTestId('journey-ai').click();
    await expect(page.locator('#ai-panel-title')).toHaveText('How do you want to use AI?');
    expect(calls).toHaveLength(0);
    await page.locator('input[name=first-ai-route][value=gemini]').check();
    await page.getByRole('button', { name: 'Use this AI route' }).click();
    await page.locator('#key-gemini').fill('test-free-key');
    await page.getByRole('button', { name: 'Use this key' }).click();
    await expect(page.getByTestId('ai-send')).toBeDisabled();
    await page.locator('#ai-host-tick').check();
    await page.getByTestId('ai-send').click();
    await expect(page.locator('.proposal')).toHaveCount(4);
    await expect(page.locator('#field-profile-experience')).toHaveValue('');
    for (const proposal of await page.locator('.proposal').all()) await proposal.getByRole('button', { name: 'Accept', exact: true }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.locator('.journey-footer').getByRole('button', { name: 'Next: Target job' }).click();
    await page.getByRole('button', { name: 'Paste a job advert' }).click();
    await page.locator('#job-title').fill('Fictional logistics planner');
    await page.locator('#job-body').fill('Plan routes using Excel.');
    await page.locator('.journey-footer').getByRole('button', { name: 'Next: My CV' }).click();
    await expect(page.locator('.first-draft')).toBeVisible();
    await expect(page.getByTestId('export-docx')).toBeDisabled();
    await page.getByTestId('journey-ai').click();
    await page.getByTestId('ai-send').click();
    await expect(page.locator('.proposal')).toHaveCount(1);
    await page.locator('.proposal').getByRole('button', { name: 'Accept', exact: true }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.locator('#cv-reviewed').check();
    const download = page.waitForEvent('download'); await page.getByTestId('export-docx').click();
    const path = info.outputPath('cv.docx'); await (await download).saveAs(path);
    expect(new TextDecoder().decode(await readZipEntry(readFileSync(path), 'word/document.xml'))).toContain('Planned routes for 15 drivers in Excel.');
    await expect(page.locator('.success-moment')).toBeVisible();
    expect(calls).toHaveLength(2);
  });
  test(`step labels, one main AI button, settings and accessibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await openApp(page);
    for (const [i,id,label] of [[1,'profile','My story'],[2,'jobs','Target job'],[3,'cv','My CV'],[4,'interview','Next steps']]) {
      await gotoView(page, id);
      await expect(page.locator('h1')).toHaveText(`${i}. ${label}`);
      await expect(page.locator('.stepper [aria-current=step]')).toHaveText(`${i}. ${label}`);
      await expect(page.locator(`.nav-list [data-route="${id}"]`)).toHaveText(`${i}. ${label}`);
      await expect(page.getByTestId('journey-ai')).toHaveCount(1);
      if (i < 4) await expect(page.locator('.journey-footer button').last()).toHaveText(`Next: ${['My story','Target job','My CV','Next steps'][i]}`);
      expect(seriousAxe(await new AxeBuilder({ page }).analyze())).toEqual([]);
    }
    await gotoView(page,'settings');
    expect(seriousAxe(await new AxeBuilder({ page }).analyze())).toEqual([]);
    await page.setViewportSize({ width:360, height:844 });
    for (const id of ['home','profile','jobs','cv','interview','plan','applications','settings','prompts']) {
      await gotoView(page,id); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}

test('example remains one click away after welcome; comparison and writing tabs are keyboard accessible', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await gotoView(page, 'home');
  await page.getByTestId('load-demo').click();
  await expect(page.locator('.banner')).toContainText("You're exploring Sam's example");
  await expect(page.locator('#notice')).toContainText('Fictional example loaded');
  await gotoView(page, 'jobs');
  await page.getByRole('tab', { name: 'Target job', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Compare my saved adverts' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#comparison-rows')).toBeVisible();
  await gotoView(page, 'cv');
  await page.getByRole('tab', { name: 'CV', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Letter', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#field-cv-letter')).toBeVisible();
});

test('workshop handout has both links, no scripts, passes axe and prints on one A4 page', async ({ page, browserName }) => {
  await page.goto('/handout/');
  await expect(page.locator('.qr-pair img')).toHaveCount(2);
  await expect(page.locator('script')).toHaveCount(0);
  expect(seriousAxe(await new AxeBuilder({ page }).analyze())).toEqual([]);
  if (browserName === 'chromium' && !test.info().project.use.isMobile) {
    const pdf = await page.pdf({ format:'A4' });
    expect((pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length).toBe(1);
  }
});
