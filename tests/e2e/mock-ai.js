// @ts-check
/**
 * Mock AI "server" for end-to-end tests: Playwright intercepts requests to the
 * provider and replays recorded-style responses, so CI never calls a real AI.
 */

const GEMINI = 'https://generativelanguage.googleapis.com';

/** @param {string} text */
const geminiSse = (text) => text.match(/.{1,40}/gs)?.map((part) => 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: part }] } }] }) + '\n\n').join('') || '';

/**
 * Installs the Gemini mock. The reply depends on what is asked, like a real model would.
 * @param {import('@playwright/test').Page} page
 * @param {{ allow: (origin: string) => void }} offOrigin the G5 fixture (the mock host is allowed explicitly)
 */
export async function mockGemini(page, offOrigin) {
  offOrigin.allow(GEMINI);
  /** @type {{ url: string, body: any, key: string | null }[]} */
  const calls = [];
  await page.route(GEMINI + '/**', async (route) => {
    const request = route.request();
    const body = request.postDataJSON?.() ?? null;
    calls.push({ url: request.url(), body, key: request.headers()['x-goog-api-key'] || null });
    if (request.url().includes('/models?')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ models: [{ name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', supportedGenerationMethods: ['generateContent'] }] }) });
      return;
    }
    if (request.headers()['x-goog-api-key'] !== 'test-free-key') { await route.fulfill({ status: 401, body: '{}' }); return; }
    const first = body?.contents?.[0]?.parts?.[0]?.text || '';
    const userTurns = (body?.contents || []).filter((/** @type {any} */ c) => c.role === 'user').length;
    let reply = 'OK';
    if (first.startsWith('CAREER NAVIGATOR — INTERVIEW')) {
      reply = userTurns >= 7
        ? 'Feedback: your answers were clear. Evidence: name your own action more often. Relevance: link each example to the advert. Interview styles vary by employer.'
        : `Question ${userTurns}: Tell me about a time you checked data for errors.`;
    } else if (first.startsWith('CAREER NAVIGATOR — EXTRACT-REQUIREMENTS')) {
      reply = 'Sure.\n```json\n{"requirements":[{"text":"Python","kind":"must"},{"text":"Dutch B1","kind":"nice"}],"hours":"36 hours","location":"Utrecht","dutch":{"demand":"plus","level":""}}\n```';
    } else {
      reply = 'This is a mocked answer. Check every claim yourself.';
    }
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: geminiSse(reply) });
  });
  return calls;
}

/** A copy-paste reply as a free chat would give it, for the extract task. */
export const PASTED_EXTRACT_REPLY = `Here are the requirements I found in the advert.

\`\`\`json
{"requirements":[{"text":"SQL for reporting","kind":"must"},{"text":"Power BI dashboards","kind":"nice"}],"hours":"32 hours","location":"Rotterdam, hybrid","dutch":{"demand":"required","level":"B1"}}
\`\`\`
Please verify these against the original advert.`;

/** A copy-paste reply for CV tailoring. */
export const PASTED_TAILOR_REPLY = '```json\n{"changes":[{"field":"skills","after":"SQL: basic SELECT, GROUP BY and JOIN from a personal project.\\nExcel: filters, pivot tables and lookup formulas.","reason":"The advert asks for SQL first","source":"SQL: basic SELECT, GROUP BY and JOIN from a personal project."}]}\n```';
