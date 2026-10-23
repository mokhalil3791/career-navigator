// @ts-check
/**
 * Shared E2E fixtures.
 * GUARDRAIL G5 — no network request leaves the allowed hosts. This fixture runs
 * automatically in EVERY end-to-end test. Never delete or weaken it.
 */
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  /** Requests to hosts other than the app's own origin (or an explicitly allowed mock). */
  offOrigin: [async ({ page, baseURL }, use) => {
    const origin = new URL(baseURL || 'http://localhost:4174').origin;
    /** @type {string[]} */
    const offenders = [];
    /** @type {string[]} */
    const allowed = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) return;
      const host = new URL(url).origin;
      if (host !== origin && !allowed.includes(host)) offenders.push(url);
    });
    await use({ offenders, allow: (/** @type {string} */ o) => allowed.push(o) });
    expect(offenders, 'requests left the allowed hosts (guardrail G5)').toEqual([]);
  }, { auto: true }],
  /** Fails a test on any uncaught page error or CSP violation. */
  pageErrors: [async ({ page, browserName }, use) => {
    /** @type {string[]} */
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() !== 'error' || !/Content Security Policy|Refused to/i.test(m.text())) return;
      // WebKit reports its OWN built-in <select> styling as a style-src violation, even for a
      // static <select> on a plain page (verified 2026-10-23). The select still works, and our
      // CSP stays strict. Only this exact WebKit message is ignored; everything else fails.
      if (browserName === 'webkit' && m.text().startsWith("Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive")) return;
      errors.push(m.text());
    });
    await use(errors);
    expect(errors, 'page errors or CSP violations').toEqual([]);
  }, { auto: true }],
});

export { expect };

/**
 * Opens the app with a clean slate and dismisses confirm() dialogs with "OK".
 * @param {import('@playwright/test').Page} page
 * @param {string} [hash]
 */
export async function openApp(page, hash = '#/home') {
  page.on('dialog', (d) => d.accept());
  await page.goto('./' + hash);
  await expect(page.locator('h1')).toBeVisible();
}

/**
 * Navigates using the sidebar on desktop or the select menu on phones.
 * @param {import('@playwright/test').Page} page
 * @param {string} label
 * @param {string} id
 */
export async function navigate(page, label, id) {
  const select = page.locator('#mobile-view');
  if (await select.isVisible()) await select.selectOption(id);
  else await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: label }).click();
}

/**
 * Loads the fictional example and waits until the app has finished (it clears
 * saved data, then returns to the overview), so the next navigation is not undone.
 * @param {import('@playwright/test').Page} page
 * @param {string} [label] button text (differs per interface language)
 */
export async function loadDemo(page, label = 'Try a fictional example') {
  await page.getByRole('button', { name: label }).first().click();
  await expect(page.locator('.banner').first()).toBeVisible();
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.locator('#notice')).toHaveClass(/visible/);
}

/**
 * Serious/critical axe violations as readable lines. For colour-contrast it adds the
 * measured colours and ratio, so an intermittent failure can be diagnosed from the report.
 * @param {import('axe-core').AxeResults} results
 */
export function seriousAxe(results) {
  return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id + ': ' + v.nodes.slice(0, 3).map((n) => {
    const d = /** @type {any} */ (n.any?.[0]?.data);
    return n.target.join(' ') + (d && d.contrastRatio !== undefined ? ` [fg ${d.fgColor} on bg ${d.bgColor}, ratio ${d.contrastRatio}${d.messageKey ? ', ' + d.messageKey : ''}]` : '');
  }).join(', '));
}

/**
 * In-app navigation by changing the hash, like the app's own links. Unlike page.goto,
 * this never reloads the page. A reload loses session-only work, and mobile WebKit
 * reloaded when goto() targeted the URL the page was already on (see docs/KNOWN-ISSUES.md).
 * @param {import('@playwright/test').Page} page
 * @param {string} id page id, e.g. "cv"
 */
export async function gotoView(page, id) {
  await page.evaluate((hash) => { if (location.hash !== hash) location.hash = hash; }, '#/' + id);
  await expect(page).toHaveURL(new RegExp('#/' + id + '$'));
  await expect(page.locator('h1')).toBeVisible();
}
