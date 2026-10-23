// @ts-check
// Phase 5: installable PWA and offline (journey 5), and the single-file release build.
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test, expect, openApp, loadDemo, navigate, gotoView } from './fixtures.js';

// These tests need the real service worker (they never call an AI provider).
test.use({ serviceWorkers: 'allow' });

test('journey 5: installable (manifest + service worker), works offline after the first visit', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Service-worker offline test runs on Chromium (desktop and Pixel 7)');
  await openApp(page);
  const manifest = await page.evaluate(async () => {
    const link = /** @type {HTMLLinkElement} */ (document.querySelector('link[rel=manifest]'));
    return (await fetch(link.href)).json();
  });
  expect(manifest).toMatchObject({ name: 'Career Navigator', display: 'standalone', start_url: './' });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  // Use the app with touch-style steps: example, compare jobs, CV.
  await loadDemo(page);
  await navigate(page, 'Compare jobs', 'jobs');
  await expect(page.locator('.job-card')).toHaveCount(3);
  // Offline: reload and keep working.
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('h1')).toBeVisible();
  await navigate(page, 'AI prompt studio', 'prompts');
  await expect(page.locator('#prompt-preview')).toHaveValue(/CAREER NAVIGATOR/);
  await context.setOffline(false);
});

test('the service worker caches only app files, never other websites', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium only');
  await openApp(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  const cached = await page.evaluate(async () => {
    const urls = [];
    for (const name of await caches.keys()) for (const req of await (await caches.open(name)).keys()) urls.push(req.url);
    return urls;
  });
  expect(cached.length).toBeGreaterThan(3);
  for (const url of cached) expect(new URL(url).origin).toBe(new URL(page.url()).origin);
  expect(cached.some((u) => u.endsWith('.json'))).toBe(false); // no user data files
});

const releaseDir = resolve('release');
const single = existsSync(releaseDir) ? readdirSync(releaseDir).find((f) => f.endsWith('.html')) : undefined;

test('single-file release opens from the file system with a strict CSP and works', async ({ page, browserName, offOrigin }) => {
  test.skip(!single, 'Run `npm run build:single` first');
  test.skip(browserName !== 'chromium', 'file:// test on Chromium only');
  offOrigin.allow('null'); // file:// pages have the origin "null"; nothing else may load
  page.on('dialog', (d) => d.accept());
  await page.goto(pathToFileURL(join(releaseDir, /** @type {string} */ (single))).href + '#/home');
  await expect(page.locator('h1')).toBeVisible();
  const csp = await page.locator('meta[http-equiv=Content-Security-Policy]').getAttribute('content');
  expect(csp).toMatch(/script-src 'sha256-/);
  expect(csp).not.toContain('unsafe-inline');
  await loadDemo(page);
  await gotoView(page, 'cv');
  await page.locator('#cv-reviewed').check();
  const download = page.waitForEvent('download');
  await page.getByTestId('export-cv').click();
  expect((await download).suggestedFilename()).toBe('fictional-example-cv.html');
});
