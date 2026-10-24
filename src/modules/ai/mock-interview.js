// @ts-check
/**
 * Mock interview with built-in AI (FR-INT-2): one question at a time, the
 * answers stay in the workspace, and feedback comes after six answers on
 * clarity, evidence and relevance. No score. The first request shows the
 * exact text and needs the same confirmation as every other AI call.
 */
import { html, nothing } from 'lit-html';
import { live } from 'lit-html/directives/live.js';
import { button } from '../../components/ui.js';
import { icon } from '../../components/icon.js';
import { buildPrompt } from '../../core/prompts.js';
import { redact } from '../../ai/redact.js';
import * as ai from '../../ai/session.js';

export const ANSWERS_BEFORE_FEEDBACK = 6;
const START = 'Start the practice interview now: ask me your first question only.';

/** Screen-only state. */
const ui = { previewSeen: false, answer: '', redactOn: true, ticked: false, busy: false, error: '', streaming: '', controller: /** @type {AbortController | null} */ (null) };

/** @param {import('../../app-context.js').Ctx} ctx */
function opening(ctx) {
  const text = buildPrompt('interview', ctx.state, ctx.content) + '\n\n' + START;
  return ui.redactOn ? redact(text, { name: ctx.state.profile.name }).text : text;
}

/** @param {import('../../app-context.js').Ctx} ctx */
export function mockInterview(ctx) {
  const { t, state } = ctx;
  if (state.settings.aiMode === 'none') return nothing;
  const route = ai.getRoute();
  const config = ai.providerConfig(route);
  const mock = state.interview.mock;
  const answers = mock.messages.filter((m) => m.role === 'me').length;
  const finished = Boolean(mock.feedback);
  if (!config) {
    return html`<section class="card section-space"><h2>${t('Mock interview with AI')}</h2><p class="card-sub">${t('Use your free AI chat to practise an interview, then bring the answer back here.')}</p><div class="actions mt-10">${button(t('Open AI prompt studio'), () => { ctx.update('ai.step', 'interview'); ctx.go('prompts'); })}</div></section>`;
  }
  const host = config.kind === 'device' ? t('this computer') : new URL(config.endpoint).host;
  const needsTick = !ctx.ui.aiTextConfirmed?.[route];

  const call = async (/** @type {any[]} */ messages) => {
    ui.busy = true; ui.error = ''; ui.streaming = ''; ui.controller = new AbortController(); ctx.rerender();
    try {
      (ctx.ui.aiTextConfirmed ||= {})[route] = true; ai.confirmSending(route);
      const request = [{ role: 'user', content: opening(ctx) }, ...messages.map((m) => ({ role: m.role === 'interviewer' ? 'assistant' : 'user', content: ui.redactOn ? redact(m.text, { name: ctx.state.profile.name }).text : m.text }))];
      const reply = await ai.send(route, { messages: /** @type {any} */ (request), signal: ui.controller.signal }, (soFar) => { ui.streaming = soFar; ctx.rerender(); });
      const myAnswers = messages.filter((m) => m.role === 'me').length;
      if (myAnswers >= ANSWERS_BEFORE_FEEDBACK) ctx.update('interview.mock.feedback', reply.slice(0, 20000));
      else ctx.update('interview.mock.messages', [...messages, { role: 'interviewer', text: reply.slice(0, 8000) }]);
    } catch (error) { ui.error = t(/** @type {Error} */ (error).message); }
    ui.busy = false; ui.streaming = ''; ui.controller = null; ctx.rerender();
  };
  const start = () => call([]);
  const sendAnswer = () => {
    const text = ui.answer.trim();
    if (!text) return;
    const messages = [...mock.messages, { role: 'me', text }];
    if (!ctx.update('interview.mock.messages', messages)) return;
    ui.answer = '';
    call(messages);
  };
  const reset = () => { if (ctx.confirm(t('Start a new mock interview? The current conversation and feedback are removed.'))) { ctx.update('interview.mock.messages', []); ctx.update('interview.mock.feedback', ''); } };

  return html`<section class="card section-space mock-interview" aria-labelledby="mock-title"><div class="card-head"><div><p class="eyebrow">${t('Built-in AI · {host}', { host })}</p><h2 id="mock-title">${t('Mock interview with AI')}</h2><p class="card-sub">${t('One question at a time. After {n} answers you get feedback on clarity, evidence and relevance. No score.', { n: ANSWERS_BEFORE_FEEDBACK })}</p></div>${mock.messages.length ? button(t('Start again'), reset, { style: 'ghost small' }) : nothing}</div>
${!mock.messages.length ? html`<label class="check-row"><input type="checkbox" .checked=${ui.redactOn} @change=${(/** @type {Event} */ e) => { ui.redactOn = /** @type {HTMLInputElement} */ (e.target).checked; ctx.rerender(); }}><span>${t('Redact before sending')}</span></label>
<details class="details"><summary @click=${() => { ui.previewSeen = true; ctx.rerender(); }}>${t('Show the exact text that will be sent to {host}', { host })}</summary><textarea class="prompt-preview" readonly rows="8" aria-label=${t('Exact outgoing text')} .value=${opening(ctx)}></textarea></details>
${needsTick ? html`<label class="check-row mt-10"><input type="checkbox" .checked=${ui.ticked} @change=${(/** @type {Event} */ e) => { ui.ticked = /** @type {HTMLInputElement} */ (e.target).checked; ctx.rerender(); }}><span>${t('I have read the text above and want to send it to {host}.', { host })}</span></label>` : nothing}
<div class="actions mt-10">${button(html`${icon('spark', 16)}${t('Start the mock interview')}`, start, { style: '', disabled: ui.busy || (needsTick && (!ui.ticked || !ui.previewSeen)), testid: 'mock-start' })}</div>` : nothing}
<ol class="transcript">${mock.messages.map((m) => html`<li class=${m.role}><strong>${m.role === 'me' ? t('Me') : t('Interviewer')}</strong><p>${m.text}</p></li>`)}${ui.streaming ? html`<li class="interviewer"><strong>${t('Interviewer')}</strong><p>${ui.streaming}</p></li>` : nothing}</ol>
${ui.error ? html`<p class="evidence-warning" role="alert">${ui.error}</p>` : nothing}
${mock.messages.length && !finished ? html`<p class="field-hint">${t('Answer {n} of {total}', { n: Math.min(answers + 1, ANSWERS_BEFORE_FEEDBACK), total: ANSWERS_BEFORE_FEEDBACK })}</p><div class="field"><label for="mock-answer">${t('My answer')}</label><textarea id="mock-answer" rows="4" maxlength="8000" .value=${live(ui.answer)} @input=${(/** @type {Event} */ e) => { ui.answer = /** @type {HTMLTextAreaElement} */ (e.target).value; }}></textarea><span class="field-hint">${t('Your answer is sent to {host} together with the conversation so far.', { host })}</span></div>
<div class="actions mt-10">${ui.busy ? button(html`${icon('stop', 16)}${t('Stop')}`, () => ui.controller?.abort(), { style: 'danger' }) : button(t('Send my answer'), sendAnswer, { style: '', testid: 'mock-send' })}</div>` : nothing}
${finished ? html`<div class="review-box mt-15"><p class="pill sand">${t('Unverified feedback — AI can make mistakes')}</p><h3 class="mt-10">${t('Feedback')}</h3><p class="preserve">${mock.feedback}</p></div>` : nothing}
</section>`;
}
