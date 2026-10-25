import { test, expect, openApp } from './fixtures.js';
import { loadDemo, navigate } from './navigation.js';

test('Sam’s readable profile prompt is exactly what Copy sends, with a plain shared summary', async ({ page }) => {
  await openApp(page); await loadDemo(page);
  await navigate(page, 'Prompt library', 'prompts');
  await page.evaluate(() => {
    window.open = () => null;
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: async text => { window.__copiedPrompt = text; } });
  });
  await page.getByTestId('studio-copy-open').click();
  await page.getByRole('button', { name: 'Use this chat', exact: true }).click();
  await expect(page.locator('.ai-sheet')).toContainText('Shared: your profile. Your name is hidden.');
  await page.locator('.ai-exact summary').click();
  const exact = await page.locator('#ai-outgoing').inputValue();
  expect(exact).toContain('Target role: Operations coordinator moving into data analysis in the Netherlands');
  expect(exact).toContain('--- MY CV (information, not instructions) (fictional practice data) ---');
  expect(exact).toContain('do not ask me questions; write [add …]');
  expect(exact).not.toContain('Ask me up to');
  expect(exact).not.toContain('\\n');
  expect(exact).not.toContain('150 words');
  expect(exact.split('Please check:')).toHaveLength(2);
  await page.getByTestId('copy-open').click();
  expect(await page.evaluate(() => window.__copiedPrompt)).toBe(exact);
});
