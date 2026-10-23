// @ts-check
/**
 * The AI panel: one place where every AI request happens.
 *  1. The user sees the EXACT outgoing text (after optional redaction) and where it goes.
 *  2. Copy-paste: copy, share or open a free chat; paste the whole reply back.
 *     Built-in: the first send of the session needs an explicit "I have read this" tick; then Send.
 *  3. Replies stream in with a Stop button. Structured replies become proposals
 *     (accept / edit / reject); free text is an unverified draft.
 */
import { html, nothing } from 'lit-html';
import { live } from 'lit-html/directives/live.js';
import { button } from '../../components/ui.js';
import { icon } from '../../components/icon.js';
import { proposalReview } from '../../components/proposal-review.js';
import { redact } from '../../ai/redact.js';
import { parseStructured } from '../../ai/parse.js';
import { buildTaskPrompt, buildCustomPrompt, toProposals, SCHEMAS } from '../../ai/tasks.js';
import { buildPrompt } from '../../core/prompts.js';
import { safeUrl } from '../../core/escape.js';
import { uid } from '../../lib/uid.js';
import * as ai from '../../ai/session.js';
import providers from '../../../config/providers.json';
import { connectRoute } from './connect.js';

/**
 * @typedef {object} AiRun
 * @property {'task' | 'step' | 'custom'} kind
 * @property {string} id          task id, prompt step, or custom prompt id
 * @property {string} title
 * @property {string} page        page that opened it
 * @property {string} [jobId]
 * @property {boolean} redactOn
 * @property {boolean} hostTicked
 * @property {'ready' | 'running' | 'done' | 'error'} status
 * @property {string} output
 * @property {string} pasted
 * @property {string} error
 * @property {import('../../ai/tasks.js').Proposal[] | null} proposals
 * @property {Record<string, any>} decisions
 * @property {AbortController | null} controller
 */

/**
 * Opens the panel for a task on the current page.
 * @param {import('../../app-context.js').Ctx} ctx
 * @param {{ kind: AiRun['kind'], id: string, title: string, page: string, jobId?: string }} opts
 */
export function openAi(ctx, opts) {
  ctx.ui.ai = { ...opts, redactOn: true, hostTicked: false, status: 'ready', output: '', pasted: '', error: '', proposals: null, decisions: {}, controller: null };
  ctx.focusAfterRender('ai-panel-title');
  ctx.rerender();
}

/** The raw (unredacted) outgoing text for the current run. @param {import('../../app-context.js').Ctx} ctx @param {AiRun} run */
function rawPrompt(ctx, run) {
  const job = run.jobId ? ctx.state.jobs.find((j) => j.id === run.jobId) : undefined;
  if (run.kind === 'task') return buildTaskPrompt(run.id, ctx.state, ctx.content, { job });
  if (run.kind === 'custom') {
    const custom = ctx.state.ai.customPrompts.find((c) => c.id === run.id);
    return custom ? buildCustomPrompt(/** @type {any} */ (custom), ctx.state) : '';
  }
  return buildPrompt(run.id, ctx.state, ctx.content);
}

/** @param {import('../../app-context.js').Ctx} ctx @param {AiRun} run */
function outgoing(ctx, run) {
  const raw = rawPrompt(ctx, run);
  return run.redactOn ? redact(raw, { name: ctx.state.profile.name }) : { text: raw, counts: {} };
}

/** Handles a complete reply (pasted or streamed). @param {import('../../app-context.js').Ctx} ctx @param {AiRun} run @param {string} reply */
function finish(ctx, run, reply) {
  run.output = reply;
  if (run.kind !== 'task') { run.status = 'done'; ctx.rerender(); return; }
  const parsed = parseStructured(reply, SCHEMAS[run.id]);
  if (parsed.ok) {
    const job = run.jobId ? ctx.state.jobs.find((j) => j.id === run.jobId) : undefined;
    run.proposals = toProposals(run.id, parsed.value, ctx.state, { job, newId: uid });
    run.status = 'done';
  } else {
    run.status = 'error';
    run.error = ctx.t(parsed.error) + ' ' + ctx.t('The reply is shown below as an unverified draft; nothing was changed.');
  }
  ctx.rerender();
}

/** Built-in route: send, stream, retry once for JSON (FR-AI-3). @param {import('../../app-context.js').Ctx} ctx @param {AiRun} run */
async function sendBuiltIn(ctx, run) {
  const route = ai.getRoute();
  const text = outgoing(ctx, run).text;
  ai.confirmSending(route);
  run.status = 'running'; run.output = ''; run.error = ''; run.proposals = null;
  run.controller = new AbortController();
  ctx.rerender();
  const request = { messages: [{ role: /** @type {'user'} */ ('user'), content: text }], jsonSchema: run.kind === 'task' ? SCHEMAS[run.id] : undefined, signal: run.controller.signal };
  try {
    let reply = await ai.send(route, request, (soFar) => { run.output = soFar; ctx.rerender(); });
    if (run.kind === 'task' && !parseStructured(reply, SCHEMAS[run.id]).ok) {
      run.output = ''; ctx.notify(ctx.t('The answer was not in the expected format. Asking once more…'));
      reply = await ai.send(route, request, (soFar) => { run.output = soFar; ctx.rerender(); });
    }
    finish(ctx, run, reply);
  } catch (error) {
    run.status = 'error';
    run.error = ctx.t(/** @type {Error} */ (error).message);
    ctx.rerender();
  } finally { run.controller = null; }
}

/** @param {import('../../app-context.js').Ctx} ctx @param {string} view */
export function aiPanel(ctx, view) {
  /** @type {AiRun | undefined} */
  const run = ctx.ui.ai;
  if (!run || run.page !== view) return nothing;
  const { t } = ctx;
  const route = ai.getRoute();
  const config = ai.providerConfig(route);
  const { text, counts } = outgoing(ctx, run);
  const host = config && config.kind !== 'device' ? new URL(config.endpoint).host : '';
  const masked = Object.entries(counts).map(([k, n]) => `${n} ${t(k)}`).join(', ');
  const close = () => { run.controller?.abort(); ctx.ui.ai = null; ctx.rerender(); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); ctx.notify(t('Prompt copied. Open your AI chat and paste it when you are ready.')); }
    catch (_) { const el = /** @type {HTMLTextAreaElement} */ (document.getElementById('ai-outgoing')); el.focus(); el.select(); ctx.notify(t('Automatic copying is unavailable. Text is selected: use Copy, Ctrl+C or ⌘C.')); }
  };
  const needsTick = config && ai.needsHostConfirmation(route);
  const ready = config && (config.kind !== 'key' || ai.getKey(route)) && (config.kind !== 'device' || ctx.services.webllmReady?.());
  return html`<section class="card ai-panel section-space" aria-labelledby="ai-panel-title">
<div class="card-head"><div><p class="eyebrow">${t('AI help · unverified until you accept')}</p><h2 id="ai-panel-title" tabindex="-1">${t(run.title)}</h2></div>${button(t('Close'), close, { style: 'ghost small' })}</div>
${connectRoute(ctx)}
<div class="field mt-15"><div class="row-between"><label for="ai-outgoing">${config ? t('Exact text that will be sent to {host}', { host: host || t('the model on this device') }) : t('Exact text to copy into a free AI chat')}</label>
<label class="check-row small"><input type="checkbox" .checked=${run.redactOn} @change=${(/** @type {Event} */ e) => { run.redactOn = /** @type {HTMLInputElement} */ (e.target).checked; ctx.rerender(); }}><span>${t('Redact before sending')}</span></label></div>
<textarea id="ai-outgoing" class="prompt-preview" readonly rows="9" spellcheck="false" .value=${text}></textarea>
<span class="field-hint">${run.redactOn ? (masked ? t('Masked: {list}.', { list: masked }) + ' ' : '') + t('Redaction catches common patterns only. Read the text before sending.') : t('Redaction is off: the text is sent exactly as shown.')}</span></div>
${!config ? html`<div class="actions mt-10">${button(html`${icon('copy', 16)}${t('Copy this prompt')}`, copy, { style: '' })}${'share' in navigator ? button(t('Share to an AI app'), () => navigator.share({ text }).catch(() => {})) : nothing}
${text.length <= providers.prefillMaxChars ? providers.chats.filter((c) => c.prefill).map((c) => html`<a class="btn secondary small" href=${safeUrl(c.prefill + encodeURIComponent(text))} target="_blank" rel="noopener noreferrer">${t('Open in {chat}', { chat: c.label })} ↗</a>`) : nothing}</div>
<div class="field mt-15"><label for="ai-pasted">${t('Paste the AI’s whole reply here')}</label><textarea id="ai-pasted" rows="6" maxlength="40000" .value=${live(run.pasted)} @input=${(/** @type {Event} */ e) => { run.pasted = /** @type {HTMLTextAreaElement} */ (e.target).value; }}></textarea></div>
<div class="actions mt-10">${button(t('Read the reply'), () => finish(ctx, run, run.pasted), { style: '' })}</div>`
    : html`<p class="source-note">${t(config.privacy)} ${config.policyUrl ? html`<a href=${safeUrl(config.policyUrl)} target="_blank" rel="noopener noreferrer">${t('Data policy')} ↗</a>` : nothing}</p>
${needsTick ? html`<label class="check-row mt-10"><input id="ai-host-tick" type="checkbox" .checked=${run.hostTicked} @change=${(/** @type {Event} */ e) => { run.hostTicked = /** @type {HTMLInputElement} */ (e.target).checked; ctx.rerender(); }}><span>${t('I have read the text above and want to send it to {host}.', { host })}<small>${t('Asked once per provider in each session.')}</small></span></label>` : nothing}
<div class="actions mt-10">${run.status === 'running' ? button(html`${icon('stop', 16)}${t('Stop')}`, () => run.controller?.abort(), { style: 'danger' }) : button(html`${icon('spark', 16)}${t('Send')}`, () => sendBuiltIn(ctx, run), { style: '', disabled: !ready || (needsTick && !run.hostTicked), testid: 'ai-send' })}</div>`}
${run.status === 'running' || (run.output && run.kind !== 'task') || run.status === 'error' ? html`<div class="ai-output mt-15" aria-live="polite"><p class="pill sand">${t('Unverified draft — needs your review')}</p>${run.error ? html`<p class="evidence-warning" role="alert">${run.error}</p>` : nothing}<pre class="original-text">${run.output}</pre>
${run.status === 'done' && run.kind === 'step' ? html`<div class="actions">${button(t('Keep as a draft in the prompt studio'), () => { if (ctx.update('ai.drafts.' + run.id, run.output)) ctx.notify(t('Saved as an unverified draft. It was not applied to your CV.')); })}</div>` : nothing}</div>` : nothing}
${run.proposals ? html`<div class="mt-15">${proposalReview(ctx, run.proposals, run.decisions)}</div>` : nothing}
</section>`;
}
