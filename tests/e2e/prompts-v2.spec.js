import { test, expect, openApp } from './fixtures.js';
import { navigate, loadDemo } from './navigation.js';
import { readAllPrompts, readPrompts } from '../../scripts/lib/content.mjs';
import { buildLibraryPrompt } from '../../src/core/library.js';
import { parsePromptParts } from '../../src/core/prompt-parts.js';

async function clipboardMock(page) {
  await page.addInitScript(() => {
    window.copiedPrompt = '';
    window.open = () => null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { window.copiedPrompt = text; } } });
  });
}

test('all public cards copy the shared source exactly, with five styled parts and static chat links', async ({ page }) => {
  await clipboardMock(page);
  await page.goto('/prompts/');
  const prompts = readAllPrompts().filter((p) => p.library !== false || p.id === 'template');
  await expect(page.locator('article.prompt')).toHaveCount(9);
  for (const prompt of prompts) {
    const card = page.locator(`#${prompt.slug}`);
    await expect(card.locator('h2')).toHaveText(prompt.title);
    await expect(card.locator('.prompt-label')).toHaveText(['GOAL', 'INSTRUCTION', 'CONTEXT', 'GUARDRAILS', 'EVALUATION']);
    await expect(card.locator('[data-copy]')).toHaveCount(1);
    await card.locator('[data-copy]').click();
    const expected = buildLibraryPrompt(prompt);
    expect(await page.evaluate(() => window.copiedPrompt)).toBe(expected);
    expect(await card.locator('pre').textContent()).toBe(expected);
    const chat = new URL(await card.locator('[data-open-chat=chatgpt]').getAttribute('href'));
    expect(chat.searchParams.get('q')).toBe(expected);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('app uses the same eight numbered titles and instructions with personal context filled in', async ({ page }) => {
  await clipboardMock(page);
  await openApp(page);
  await loadDemo(page);
  await navigate(page, '', 'prompts');
  const prompts = readPrompts();
  await expect(page.locator('.prompt-tab')).toHaveCount(8);
  for (const [i, prompt] of prompts.entries()) {
    const tab = page.locator('.prompt-tab').nth(i);
    await expect(tab).toHaveText(`${i + 1}${prompt.title}`);
    await tab.click();
    const text = await page.locator('#prompt-preview').inputValue();
    const parts = parsePromptParts(prompt.task);
    expect(text).toContain(parts.Instruction);
    expect(text).toContain('QUOTED SOURCE DATA');
    expect(text).not.toMatch(/\[paste|\[target role\]/i);
    await expect(page.locator('section.card .prompt-five-parts strong')).toHaveText(['GOAL', 'INSTRUCTION', 'CONTEXT', 'GUARDRAILS', 'EVALUATION']);
    await page.getByTestId('studio-copy-open').click();
    if (i === 0) {
      await page.locator('input[name=free-chat][value=chatgpt]').check();
      await page.getByRole('button', { name: 'Use this chat', exact: true }).click();
      await page.getByTestId('copy-open').click();
    }
    expect(await page.evaluate(() => window.copiedPrompt)).toBe(text);
    if (prompt.id === 'read') await expect(page.locator('.shared-summary')).toContainText(/profile and the .* advert/);
    await page.locator('.ai-sheet').getByRole('button', { name: 'Close', exact: true }).click();
  }
});
