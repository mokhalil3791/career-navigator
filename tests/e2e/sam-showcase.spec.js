import { readFile } from 'node:fs/promises';
import { test, expect, openApp } from './fixtures.js';
import { loadDemo, navigate, saveBackup } from './navigation.js';

const sam = JSON.parse(await readFile(new URL('../../content/demo/sam.json', import.meta.url), 'utf8'));
async function backup(page) {
  const downloading = page.waitForEvent('download');
  await saveBackup(page);
  return JSON.parse(await readFile(await (await downloading).path(), 'utf8'));
}

test('Sam shows all sixteen answers, reflections and highlighted missing facts', async ({ page }) => {
  await openApp(page); await loadDemo(page);
  await navigate(page, 'Next steps', 'interview');
  await expect(page.locator('.example-answer-note')).toContainText('Example answer written for Sam.');
  for (const [pack, prefix] of [['default', 'q'], ['data-ai-roles', 'da']]) {
    await page.locator('#question-pack').selectOption(pack);
    for (let n = 1; n <= 8; n++) {
      const id = prefix + n;
      await expect(page.locator('#example-answer')).toContainText(sam.interview.answers[id].replaceAll('**', ''));
      await expect(page.locator('#field-interview-notes-' + id)).toHaveValue(sam.interview.notes[id]);
      if (['q2', 'q3', 'q5', 'q6', 'q7', 'da3', 'da6'].includes(id)) {
        await expect(page.locator('#example-answer .example-gap').filter({ hasText: /\[add/i }).first()).toBeVisible();
        await expect(page.locator('.example-gap-caption')).toContainText('Never invent one.');
      }
      if (n < 8) await page.getByRole('button', { name: 'Next question', exact: true }).click();
    }
  }
  await expect(page.locator('.example-exchange')).toContainText('Example AI feedback');
  await expect(page.locator('.example-exchange')).toContainText('Please check:');
});

test('Sam’s drafts and custom prompt are labelled, and Start my own clears every example', async ({ page }) => {
  await openApp(page); await loadDemo(page);
  await navigate(page, 'Prompt library', 'prompts');
  await expect(page.locator('#field-ai-extra')).toHaveValue(sam.ai.extra);
  for (const [id, title] of [['read', 'Read one advert'], ['fit', 'Where do I stand?'], ['tailor', 'Tailor my CV'], ['interview', 'Practise an interview'], ['letter', 'Write a motivation letter']]) {
    await page.locator('.prompt-tab').filter({ hasText: title }).click();
    await expect(page.getByTestId('example-draft')).toHaveText(sam.ai.drafts[id]);
    await expect(page.locator('.field > .example-prompt-note')).toBeVisible();
  }
  await page.getByText('My own prompts (1)', { exact: true }).click();
  await expect(page.locator('.example-custom')).toHaveText(sam.ai.customPrompts[0].task);
  const demo = await backup(page);
  expect(demo.interview).toEqual(sam.interview);
  expect(demo.ai.customPrompts).toEqual(sam.ai.customPrompts);
  expect(demo.ai.drafts).toEqual(sam.ai.drafts);
  await page.getByRole('button', { name: 'Start my own', exact: true }).click();
  await expect(page).toHaveURL(/#\/profile$/);
  const fresh = await backup(page);
  expect(fresh.demo).toBe(false);
  expect(fresh.interview).toMatchObject({ answers: {}, notes: {}, mock: { messages: [], feedback: '' } });
  expect(fresh.ai.extra).toBe(''); expect(fresh.ai.customPrompts).toEqual([]);
  expect(Object.values(fresh.ai.drafts).every((text) => text === '')).toBe(true);
  await navigate(page, 'Next steps', 'interview');
  await expect(page.locator('.example-answer-note, .example-exchange, .example-gap')).toHaveCount(0);
  await expect(page.locator('#field-interview-answers-q1')).toHaveValue('');
  await navigate(page, 'Prompt library', 'prompts');
  await expect(page.locator('.example-prompt-note, .example-draft, .example-custom')).toHaveCount(0);
});
