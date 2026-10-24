// @ts-check
import { navigate as navigateBase } from './fixtures.js';
/** Open secondary desktop navigation before using the original UI navigation helper.
 * @param {import('@playwright/test').Page} page
 * @param {string} label
 * @param {string} id
 */
export async function navigate(page, label, id) {
  if (!(await page.locator('#mobile-view').isVisible()) && !['home', 'profile', 'jobs', 'cv', 'prompts'].includes(id)) {
    const more = page.locator('.nav-more');
    if (await more.getAttribute('open') === null) await more.locator('summary').click();
  }
  await navigateBase(page, label, id);
}
