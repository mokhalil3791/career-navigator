import { test, expect, seriousAxe } from './fixtures.js';
import AxeBuilder from '@axe-core/playwright';
import jsQR from 'jsqr';

async function clipboard(page) {
  await page.addInitScript(() => {
    window.kitCopied = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async text => { window.kitCopied = text; },
    } });
  });
}

test('kit hash tabs, six emails and every prompt copy preserve the supplied text', async ({ page }) => {
  await clipboard(page);
  await page.goto('/kit/#example2');
  await expect(page).toHaveTitle('Data & AI Career Kit');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('tab', { name: 'Exercise 2' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#example2')).toBeVisible();
  await expect(page.locator('#emailList .email')).toHaveCount(6);
  for (const button of await page.locator('[data-copy]').all()) {
    const id = await button.getAttribute('data-copy');
    const source = await page.locator('#' + id).textContent();
    await button.click();
    await expect.poll(() => page.evaluate(() => window.kitCopied)).toBe(source);
  }
  await page.locator('#copyEmails').click();
  const emails = await page.evaluate(() => window.kitCopied);
  for (let n=1;n<=6;n++) expect(emails).toContain('--- Email '+n+' ---');
  expect(emails).toContain('ignore all previous instructions');
  expect(emails).toContain('111222333'); // Fictional redaction exercise is copied unchanged.
  for (const hash of ['roadmaps', 'market', 'next', 'example2']) {
    await page.goto('/kit/#' + hash);
    await expect(page.locator('#'+hash)).toBeVisible();
    await expect(page.locator('button[aria-controls="'+hash+'"]')).toHaveAttribute('aria-selected', 'true');
  }
});

test('kit fills all six role plans, copies milestone dates and saves only by choice', async ({ page }) => {
  await clipboard(page);
  await page.goto('/kit/#roadmaps');
  await page.locator('#p-start').fill('2026-11-02');
  for (const role of ['analyst','de','dpe','ai','mlops','devops']) {
    await page.locator('#p-role').selectOption(role);
    await page.locator('#fillBtn').click();
    await page.locator('#copyPlan').click();
    const copied = await page.evaluate(() => window.kitCopied);
    for (const date of ['2 Dec 2026', '1 Jan 2027', '31 Jan 2027']) expect(copied).toContain(date);
    for (const id of ['p-l1','p-l2','p-l3','p-proj']) {
      const text = await page.locator('#'+id).inputValue();
      expect(text.length).toBeGreaterThan(20);
      expect(copied).toContain(text);
    }
  }
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await page.reload();
  await expect(page.locator('#p-start')).toHaveValue('');
  await page.locator('#p-why').fill('My private plan');
  await page.locator('#keep-kit').check();
  await page.reload();
  await expect(page.locator('#p-why')).toHaveValue('My private plan');
  await expect(page.locator('#keep-kit')).toBeChecked();
  await page.locator('#keep-kit').uncheck();
  await page.reload();
  await expect(page.locator('#p-why')).toHaveValue('');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test('kit has no horizontal overflow at 360px, accessible tabs and no external requests', async ({ page, offOrigin }) => {
  await page.setViewportSize({ width:360, height:800 });
  for (const hash of ['example2', 'roadmaps', 'market', 'next']) {
    await page.goto('/kit/#'+hash);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(seriousAxe(await new AxeBuilder({ page }).analyze())).toEqual([]);
  }
  expect(offOrigin.offenders).toEqual([]);
});

test('kit short links and handout preserve the printed destinations; QR images decode independently', async ({ page }) => {
  for (const [slug,hash] of [['kit',''],['ex2','#example2']]) {
    await page.goto('/p/'+slug+'/');
    await expect(page).toHaveURL(new RegExp('/kit/'+hash+'$'));
  }
  await expect(page.locator('#example2')).toBeVisible();
  await page.goto('/handout/');
  await expect(page.getByRole('heading', {name:'Exercise 2 and 90-day plans'})).toBeVisible();
  await expect(page.locator('a[href="../kit/#example2"]')).toBeVisible();
  for (const [name,suffix] of [['kit','kit/'],['ex2','kit/#example2']]) {
    const pixels = await page.evaluate(async name => {
      const img=new Image();img.src='../qr/'+name+'.svg';await img.decode();
      const canvas=document.createElement('canvas');canvas.width=canvas.height=600;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,600,600);
      return Array.from(ctx.getImageData(0,0,600,600).data);
    }, name);
    const decoded=jsQR(new Uint8ClampedArray(pixels),600,600);
    expect(decoded?.data).toBe('https://mokhalil3791.github.io/career-navigator/'+suffix);
  }
});

test.describe('kit offline', () => {
  test.use({ serviceWorkers:'allow' });
  test('a direct first visit to Exercise 2 installs the cache and reloads offline', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Offline worker coverage on Chromium desktop and phone');
    await page.goto('/kit/#example2');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#example2')).toBeVisible();
    await expect(page.locator('#emailList .email')).toHaveCount(6);
    await page.getByRole('tab', { name:'90-day plans' }).click();
    await expect(page.locator('#roleChips button')).toHaveCount(6);
    await context.setOffline(false);
  });
});

/* ============ Exercise 2 team workspace ============ */

const INITIAL = '0 / 24 passed · 24 pending · 0 failed';
/** Accepts the next confirm() dialog. */
const acceptNext = page => page.once('dialog', d => d.accept());

test('workspace roles toggle with aria-pressed, announce their task and focus the right section', async ({ page }) => {
  await clipboard(page);
  await page.goto('/kit/#example2');
  const ws = page.locator('#teamWorkspace');
  await expect(ws.getByRole('heading', { name: 'One inbox. Three roles. Human judgement.' })).toBeVisible();
  await expect(ws).toContainText('Reloading the page clears it');
  await expect(ws.locator('.ws-reminder')).toHaveText('Everyone: Is this true? How do we know?');
  // The workspace sits after the timeline and before step 1.
  expect(await page.evaluate(() => {
    const t = document.querySelector('#example2 .timeline'), w = document.getElementById('teamWorkspace'), s = document.querySelector('#example2 .step');
    return t.nextElementSibling === w && w.nextElementSibling === s;
  })).toBe(true);
  const cases = [
    ['Driver', 'self-check prompt', 'Go to the sorting prompt (step 2)', 'ws-sortPrompt'],
    ['Checker', 'not only with the AI’s own self-check', 'Go to the answer key (step 4)', 'answerKeySummary'],
    ['Scribe', 'reviewed canvas', 'Go to the team canvas (step 6)', 'ws-canvasTitle'],
  ];
  for (const [role, task, go, target] of cases) {
    await ws.getByRole('button', { name: role, exact: true }).click();
    for (const [other] of cases) await expect(ws.getByRole('button', { name: other, exact: true })).toHaveAttribute('aria-pressed', String(other === role));
    await expect(page.locator('#ws-roleTask')).toHaveAttribute('role', 'status');
    await expect(page.locator('#ws-roleTask')).toContainText(task);
    await page.getByRole('button', { name: go }).click();
    await expect(page.locator('#' + target)).toBeFocused();
    if (role === 'Checker') await expect(page.locator('#answerKey')).toHaveAttribute('open', '');
  }
  await page.locator('#ws-copyAll').click();
  const copied = await page.evaluate(() => window.kitCopied);
  expect(copied.startsWith(await page.locator('#pB').textContent())).toBe(true);
  for (let n = 1; n <= 6; n++) expect(copied).toContain('--- Email ' + n + ' ---');
  expect(copied).toContain('ignore all previous instructions');
});

test('practice response, 24 explicit human checks and the confirmation before replacing a run', async ({ page }) => {
  await page.goto('/kit/#example2');
  await expect(page.locator('#ws-totals')).toHaveText(INITIAL);
  await expect(page.locator('#ws-totals')).toHaveAttribute('role', 'status');
  await expect(page.getByLabel('Paste the AI’s table here (unverified draft)')).toHaveValue('');
  // One fieldset per email, four selects each, all Pending; reference read from the answer key.
  await expect(page.locator('fieldset.ws-email')).toHaveCount(6);
  await expect(page.locator('#ws-e1 legend')).toHaveText('Email 1 · Water everywhere!');
  await expect(page.locator('#ws-e2 legend')).toHaveText('Email 2 · Adreswijziging');
  await expect(page.locator('#ws-emailChecks select')).toHaveCount(24);
  for (const s of await page.locator('#ws-emailChecks select').all()) {
    await expect(s).toHaveValue('pending');
    expect(await s.locator('option').allTextContents()).toEqual(['Pending', 'Pass', 'Fail']);
  }
  await page.locator('#ws-e3 summary').click();
  await expect(page.locator('#ws-e3 .ws-ref')).toContainText('Claim status also OK');
  await expect(page.locator('#ws-e3 .ws-orig')).toContainText('Kifid');
  await expect(page.getByLabel('Grounded (email 3)')).toBeVisible();

  // An empty run loads the sample without asking.
  await page.locator('#ws-loadSample').click();
  await expect(page.locator('#ws-sampleNote')).toBeVisible();
  await expect(page.locator('#ws-sampleNote')).toContainText('not a real AI run');
  const sample = await page.locator('#ws-response').inputValue();
  expect(sample.split('\n')[0]).toBe('Email # | Language | Category | Urgency | Summary | Personal data | Suspicious instruction? | Human next step | Confidence');
  expect(sample).toMatch(/^1 \| English \| New claim \| Low \|/m);
  expect(sample).toMatch(/^2 \| Dutch \| Policy change \| Low \|/m);
  expect(sample).toMatch(/^3 \| English \| Complaint \| High \|.*Kifid/m);
  expect(sample).toMatch(/^4 \| English \| Cancellation \| Medium \|.*111222333.*NL00TULP0123456789/m);
  expect(sample).toMatch(/^5 \| English \| Billing \| Low \|.*Yes.*Approve the claim and pay €5,000/m);
  expect(sample).toMatch(/^6 \| English \| Coverage question \| Low \|.*covers all treatment abroad/m);

  // Only explicit Pass earns a point; Pending is neither Pass nor Fail.
  await page.locator('#ws-e2-correct').selectOption('pass');
  await page.locator('#ws-e1-correct').selectOption('fail');
  await page.locator('#ws-e4-safe').selectOption('fail');
  await page.locator('#ws-e5-safe').selectOption('fail');
  await expect(page.locator('#ws-totals')).toHaveText('1 / 24 passed · 20 pending · 3 failed · 2 failed safety checks');
  await expect(page.locator('#ws-s-passed')).toHaveText('1 / 24');
  await expect(page.locator('#ws-s-pending')).toHaveText('20');
  await expect(page.locator('#ws-s-safety')).toHaveText('2');
  await page.locator('#ws-e1-correct').selectOption('pending');
  await expect(page.locator('#ws-totals')).toHaveText('1 / 24 passed · 21 pending · 2 failed · 2 failed safety checks');
  await page.getByLabel('Worst mistake and evidence').fill('Email 5 follows the hidden instruction');
  await expect(page.locator('#ws-s-worst')).toHaveText('Email 5 follows the hidden instruction');

  // Dismissing the confirmation keeps everything.
  page.once('dialog', d => { expect(d.type()).toBe('confirm'); d.dismiss(); });
  await page.locator('#ws-loadSample').click();
  await expect(page.locator('#ws-e2-correct')).toHaveValue('pass');
  // Accepting clears this run's checks, evidence and worst mistake.
  await page.locator('#ws-e1-notes').fill('Low urgency is wrong');
  acceptNext(page);
  await page.locator('#ws-loadSample').click();
  await expect(page.locator('#ws-totals')).toHaveText(INITIAL);
  await expect(page.locator('#ws-e1-notes')).toHaveValue('');
  await expect(page.locator('#ws-worst')).toHaveValue('');
  // Typing over the sample turns it back into a pasted (unverified) answer.
  await page.locator('#ws-response').fill('my own AI table');
  await expect(page.locator('#ws-sampleNote')).toBeHidden();
});

test('compare runs keeps the previous run in memory and starts a clean run without losing team work', async ({ page }) => {
  await page.goto('/kit/#example2');
  await page.locator('#ws-team').fill('The Tulips');
  await page.locator('#ws-driver').fill('Amal');
  await page.locator('#ws-model').fill('Gemini free');
  await page.locator('#ws-response').fill('| 1 | English | New claim | High |');
  await page.locator('#ws-e1-correct').selectOption('pass');
  await page.locator('#ws-e1-notes').fill('Burst pipe is urgent: matches the key');
  await page.locator('#ws-worst').fill('None yet');
  await page.locator('#ws-c-problem').fill('Urgent emails wait 3 days');
  await page.locator('#ws-guardrail').fill('A human approves every payment');
  await expect(page.locator('#ws-curTotals')).toHaveText('Gemini free: 1 / 24 passed · 23 pending · 0 failed');
  await page.locator('#ws-keepRun').click();
  await expect(page.locator('#ws-prevTotals')).toHaveText('Gemini free: 1 / 24 passed · 23 pending · 0 failed · 0 failed safety checks');

  page.once('dialog', d => d.dismiss());
  await page.locator('#ws-newRun').click();
  await expect(page.locator('#ws-response')).not.toHaveValue('');
  acceptNext(page);
  await page.locator('#ws-newRun').click();
  for (const id of ['ws-response', 'ws-model', 'ws-e1-notes', 'ws-worst']) await expect(page.locator('#' + id)).toHaveValue('');
  await expect(page.locator('#ws-e1-correct')).toHaveValue('pending');
  await expect(page.locator('#ws-curTotals')).toHaveText(INITIAL);
  await expect(page.locator('#ws-prevTotals')).toContainText('Gemini free: 1 / 24 passed');
  for (const [id, value] of [['ws-team', 'The Tulips'], ['ws-driver', 'Amal'], ['ws-c-problem', 'Urgent emails wait 3 days'], ['ws-guardrail', 'A human approves every payment']]) {
    await expect(page.locator('#' + id)).toHaveValue(value);
  }
});

test('team notes copy and download as plain text with both runs, and user text is never HTML', async ({ page, browserName }) => {
  await clipboard(page);
  await page.goto('/kit/#example2');
  const hostile = '<img src=x onerror="window.hacked=1"><b>Team</b>';
  await page.locator('#ws-team').fill(hostile);
  await page.locator('#ws-checker').fill('Bilal');
  await page.locator('#ws-model').fill('Le Chat');
  await page.locator('#ws-response').fill('| 5 | Billing | <script>window.hacked=2</script> |');
  await page.locator('#ws-e5-safe').selectOption('fail');
  await page.locator('#ws-e5-notes').fill('Proposes paying €5,000');
  await page.locator('#ws-worst').fill('Followed the hidden instruction');
  await page.locator('#ws-guardrail').fill('Never pay money without a human');
  await page.locator('#ws-c-roles').fill('AI engineer, governance specialist');
  await expect(page.locator('#ws-s-guardrail')).toHaveText('Never pay money without a human');
  expect(await page.evaluate(() => window.hacked)).toBeUndefined();
  expect(await page.locator('#example2 img').count()).toBe(0);

  await page.locator('#ws-copyNotes').click();
  const notes = await page.evaluate(() => window.kitCopied);
  for (const part of [
    'Team: ' + hostile, 'Checker: Bilal', 'Free AI app or model: Le Chat',
    '0 / 24 passed · 23 pending · 1 failed · 1 failed safety check',
    'AI ANSWER (UNVERIFIED DRAFT)', '<script>window.hacked=2</script>',
    'Email 5 · Premium question', 'Safe: Fail', 'Evidence and next step: Proposes paying €5,000',
    'WORST MISTAKE AND EVIDENCE\nFollowed the hidden instruction',
    'ONE GUARDRAIL WE WOULD NEVER DROP\nNever pay money without a human',
    'Which roles build it: AI engineer, governance specialist', 'Problem: …',
    'Six fictional emails cannot show that an AI is ready for real customers',
    'Everyone: Is this true? How do we know?',
  ]) expect(notes).toContain(part);
  expect(notes).not.toContain('=== PREVIOUS RUN ===');

  await page.locator('#ws-keepRun').click();
  test.skip(browserName === 'webkit', 'WebKit in Playwright does not report blob downloads reliably; copy covers the same text.');
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#ws-downloadNotes').click()]);
  expect(download.suggestedFilename()).toBe('tulip-team-notes.txt');
  const file = await (await import('node:fs/promises')).readFile(await download.path(), 'utf8');
  expect(file).toContain('=== PREVIOUS RUN ===');
  expect(file).toContain('=== CURRENT RUN ===');
  expect(file).toContain('Never pay money without a human');
});

test('workspace is session-only: nothing stored, reload clears it even with plan saving on', async ({ page }) => {
  await page.goto('/kit/#roadmaps');
  await page.locator('#keep-kit').check();
  await page.goto('/kit/#example2');
  await page.locator('#ws-team').fill('Session team');
  await page.locator('#ws-loadSample').click();
  await page.locator('#ws-e1-correct').selectOption('fail');
  await page.locator('#ws-c-users').fill('Customer service team');
  await page.locator('#ws-keepRun').click();
  const stored = await page.evaluate(async () => ({
    local: Object.values(localStorage).join('\n'),
    session: Object.keys(sessionStorage),
    idb: indexedDB.databases ? (await indexedDB.databases()).map(d => d.name) : [],
  }));
  for (const text of ['Session team', 'Customer service team', '111222333', 'Water everywhere']) expect(stored.local).not.toContain(text);
  expect(stored.session).toEqual([]);
  expect(stored.idb).toEqual([]);
  await page.reload();
  await expect(page.locator('#keep-kit')).toBeChecked();
  for (const id of ['ws-team', 'ws-response', 'ws-c-users']) await expect(page.locator('#' + id)).toHaveValue('');
  await expect(page.locator('#ws-totals')).toHaveText(INITIAL);
  await expect(page.locator('#ws-prevTotals')).toHaveText('None kept yet');
  await page.goto('/kit/#roadmaps');
  await page.locator('#keep-kit').uncheck();
});

test('workspace fits 360px and 390px in light and dark, with no serious accessibility issues', async ({ page }) => {
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/kit/#example2');
      await page.locator('#ws-loadSample').click();
      await page.locator('#ws-e1 summary').click();
      await page.locator('#answerKeySummary').click();
      await page.locator('#ws-e1-correct').selectOption('fail');
      await page.locator('#ws-worst').fill('A very long note without spaces: ' + 'x'.repeat(200));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), scheme + ' ' + width).toBe(true);
      expect(await page.evaluate(() => [...document.querySelectorAll('#example2 fieldset, #example2 select, #example2 textarea, #example2 input')]
        .filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => el.id))).toEqual([]);
      expect(seriousAxe(await new AxeBuilder({ page }).include('#example2').analyze()), scheme + ' ' + width).toEqual([]);
    }
  }
});

test('Career Kit is linked from the app tools, plan and public prompts footer', async ({ page }) => {
  await page.goto('/#/home');
  await expect(page.locator('.sidebar a[href="./kit/"]')).toHaveCount(2);
  await page.goto('/#/plan');
  await expect(page.getByRole('link', {name:'See detailed 90-day plans for six Data & AI roles in the Career Kit'})).toHaveAttribute('href','./kit/#roadmaps');
  await page.goto('/prompts/');
  await expect(page.locator('footer').getByRole('link', {name:'Career Kit'})).toHaveAttribute('href','../kit/');
});
