import { readFileSync } from 'node:fs';
import { test, expect } from './fixtures.js';
import { newWorkspace } from '../../src/core/schema.js';

for (const hash of ['', '#/jobs', '#/cv']) {
  test(`old address redirects and preserves ${hash || 'home'}`, async ({ page }) => {
    await page.goto('/next/' + hash);
    await expect(page).toHaveURL(new RegExp('/' + hash.replace('/', '\\/') + '$'));
    await expect(page.locator('h1')).toBeVisible();
  });
}

test('workspace saved at the old path opens at root without losing data', async ({ page }) => {
  // Stand in for the previously deployed document, on the actual old origin/path.
  await page.route('**/next/old-workspace.html', route => route.fulfill({ contentType: 'text/html', body: '<title>Earlier version</title>' }));
  await page.goto('/next/old-workspace.html');
  const state = newWorkspace();
  state.settings.remember = true;
  state.settings.onboarded = true;
  state.profile.experience = 'Saved from the old address';
  await page.evaluate(state => new Promise((resolve, reject) => {
    const request = indexedDB.open('career-navigator', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('kv');
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(JSON.stringify(state), 'workspace');
      tx.oncomplete = () => { db.close(); resolve(null); };
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  }), state);
  await page.goto('/next/#/profile');
  await expect(page).toHaveURL(/\/#\/profile$/);
  await expect(page.locator('#field-profile-experience')).toHaveValue(state.profile.experience);
  await expect(page.locator('.storage-status')).toContainText('Saved on this device');
});

test('legacy import needs consent, preserves the original and resets review and saving', async ({ page }) => {
  const legacy = JSON.parse(readFileSync('tests/fixtures/v0.1/localstorage-remember-true.json', 'utf8'));
  legacy.cv.reviewed = true;
  await page.addInitScript(legacy => localStorage.setItem('career-navigator.workspace.v1', JSON.stringify(legacy)), legacy);
  await page.goto('/');
  await page.getByRole('button', { name: 'Not now', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('career-navigator.workspace.v1')).cv.reviewed)).toBe(true);
  await page.reload();
  await page.getByRole('button', { name: 'Bring it in', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Device saving' })).toBeVisible();
  await page.getByRole('button', { name: 'Not now', exact: true }).click();
  await page.evaluate(() => { location.hash = '#/cv'; });
  await expect(page.locator('#cv-reviewed')).not.toBeChecked();
  await expect(page.getByTestId('export-cv')).toBeDisabled();
  await expect(page.getByTestId('export-docx')).toBeDisabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('career-navigator.workspace.v1')).settings.remember)).toBe(true);
  await expect(page.locator('.storage-status')).toContainText('Session only');
});
