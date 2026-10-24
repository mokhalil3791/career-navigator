// UI navigation adapters. G5 and all original fixture safety checks stay unchanged.
import { expect } from './fixtures.js';
export async function navigate(page, label, id) {
  const destination = ['plan', 'applications'].includes(id) ? 'interview' : ['coach', 'learn'].includes(id) ? 'settings' : id;
  const desktop = page.locator(`.nav-list [data-route="${destination}"]`);
  if (await desktop.isVisible()) await desktop.click();
  else {
    await page.locator('.nav-sheet summary').click();
    await page.locator(`.nav-sheet [data-route="${destination}"]`).click();
  }
  if (['plan', 'applications'].includes(id)) await page.getByRole('tab').filter({ hasText: id === 'plan' ? /90/ : /Applications|Sollicitaties/ }).click();
  if (id === 'coach') await page.getByRole('button', { name: /Share with my coach|Delen met mijn coach/ }).click();
  if (id === 'learn') await page.getByRole('button', { name: /Learn|Leren/, exact: true }).click();
  await expect(page).toHaveURL(new RegExp('#/' + id + '$'));
}
export async function loadDemo(page) {
  await page.getByTestId('load-demo').click();
  await expect(page.locator('.banner').first()).toBeVisible();
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.locator('#notice')).toHaveClass(/visible/);
}
export async function openTask(page) {
  await page.getByTestId('journey-ai').click();
  const choice = page.getByRole('button', { name: 'Use this AI route', exact: true });
  if (await choice.isVisible()) await choice.click();
}
