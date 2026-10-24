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
import { proposalReview } from '../../components/proposal-review.js';
import { redact } from '../../ai/redact.js';
import { parseStructured } from '../../ai/parse.js';
import { buildTaskPrompt, buildCustomPrompt, toProposals, SCHEMAS } from '../../ai/tasks.js';
import { buildPrompt } from '../../core/prompts.js';
import { uid } from '../../lib/uid.js';
import * as ai from '../../ai/session.js';
import { refreshOpenRouter } from './connect.js';
import { chatChoice, checkComputer, usingLabel } from './choice.js';
import { chosenChat } from '../../ai/chats.js';
import { sendOnComputer } from '../../ai/browser-ai.js';

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
 * @property {string} sourceContext
 * @property {boolean} [previewSeen]
 * @property {boolean} [hidden]
 * @property {boolean} [previewOpen]
 * @property {boolean} [downloadAgreed]
 * @property {boolean} [awaitingReturn]
 * @property {boolean} [pasteReady]
 * @property {number} [downloadProgress]
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
  ctx.ui.aiReturnFocus = ctx.ui.lastClickedButton?.isConnected ? ctx.ui.lastClickedButton : document.activeElement;
  checkComputer(ctx);
  const previous = ctx.ui.ai;
  ctx.ui.ai = previous?.id === opts.id && previous?.page === opts.page && previous?.kind === opts.kind && previous?.jobId === opts.jobId && previous.output
    ? { ...previous, hidden: false }
    : { ...opts, sourceContext: reviewContext(ctx, opts), redactOn: true, hostTicked: false, status: 'ready', output: '', pasted: '', error: '', proposals: null, decisions: {}, controller: null };
  ctx.focusAfterRender('ai-panel-title');
  ctx.rerender();
  if (ai.getRoute() === 'copy' && ctx.state.settings.aiChat && ctx.ui.ai.sourceContext === reviewContext(ctx, opts)) handoff(ctx, ctx.ui.ai);
}

/** Detect changed sources when returning to a primary-journey task, without losing pending decisions.
 * CV proposal acceptance changes the draft, not these profile/advert sources.
 * @param {import('../../app-context.js').Ctx} ctx
 * @param {{ id: string }} run
 */
function reviewContext(ctx, run) {
  if (run.id === 'suggest-fields') return ctx.state.profile.cvText;
  if (run.id === 'tailor-cv') return JSON.stringify({ profile: ctx.state.profile, job: ctx.state.jobs.find((j) => j.id === ctx.state.selectedJobId) || ctx.state.jobs[0], language: ctx.state.settings.applicationLanguage });
  return '';
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
  run.decisions = {}; run.proposals = null; run.error = '';
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
    const call = () => route === 'browser' ? sendOnComputer(text, request.signal, value => { run.output = value; ctx.rerender(); }, value => { run.downloadProgress = value; ctx.rerender(); }) : ai.send(route, request, (soFar) => { run.output = soFar; ctx.rerender(); });
    let reply = await call();
    if (route === 'browser') ctx.ui.browserAvailability = 'available';
    if (run.kind === 'task' && !parseStructured(reply, SCHEMAS[run.id]).ok) {
      run.output = ''; ctx.notify(ctx.t('The answer was not in the expected format. Asking once more…'));
      reply = await call();
    }
    finish(ctx, run, reply);
  } catch (error) {
    run.status = 'error';
    if (route === 'openrouter' && /** @type {any} */ (error).kind === 'unsupported') {
      await refreshOpenRouter(ctx); ctx.ui.modelUnavailable = true;
      run.error = ctx.t('This choice is unavailable. Choose another in Settings → Advanced.');
    } else run.error = route === 'browser' ? ctx.t('AI on this computer could not answer. Try your free AI chat.') : ctx.t(/** @type {Error} */ (error).message);
    ctx.rerender();
  } finally { run.controller = null; }
}

/** @param {import('../../app-context.js').Ctx} ctx */
function closePanel(ctx) {
  ctx.ui.ai?.controller?.abort(); if (ctx.ui.ai) ctx.ui.ai.hidden = true; ctx.rerender();
  if (ctx.ui.aiReturnFocus?.isConnected) ctx.ui.aiReturnFocus.focus();
}

/** Copy and launch happen in the same user gesture; only a fixed homepage reaches the new tab.
 * @param {import('../../app-context.js').Ctx} ctx @param {AiRun} run @param {boolean} [share]
 */
async function handoff(ctx, run, share = run.page !== 'prompts' && typeof navigator.share === 'function' && matchMedia('(max-width:720px)').matches) {
  const { t } = ctx, text = outgoing(ctx, run).text, chat = chosenChat(ctx.state.settings);
  try {
    if (share) await navigator.share({ text });
    else {
      const copied = navigator.clipboard.writeText(text);
      if (chat.url) window.open(chat.url, '_blank', 'noopener,noreferrer');
      await copied;
      ctx.notify(t('Copied. Paste it in {chat} and send. Come back here when you have the answer.', { chat: chat.label }));
    }
    run.awaitingReturn = true;
  } catch (error) {
    if (/** @type {Error} */ (error).name === 'AbortError') return;
    run.previewOpen = true; ctx.rerender();
    const el = /** @type {HTMLTextAreaElement | null} */ (document.getElementById('ai-outgoing'));
    el?.focus(); el?.select();
    ctx.notify(t('Automatic copying is unavailable. Text is selected: use Copy, Ctrl+C or ⌘C.'));
  }
}

/** Read permission is requested only after a click; typing/pasting always remains possible.
 * @param {import('../../app-context.js').Ctx} ctx @param {AiRun} run
 */
async function pasteAnswer(ctx, run) {
  try {
    const reply = await navigator.clipboard.readText();
    if (!reply.trim()) throw new Error('Empty clipboard');
    run.pasted = reply.slice(0, 40000); finish(ctx, run, run.pasted);
  } catch { ctx.focusAfterRender('ai-pasted'); ctx.notify(ctx.t('Paste your answer in the box below.')); }
}

/** @param {import('../../app-context.js').Ctx} ctx @param {AiRun} run */
function sharedSummary(ctx, run) {
  const { t } = ctx;
  const job = ctx.state.jobs.find(j => j.id === (run.jobId || ctx.state.selectedJobId));
  let summary = t('Shared: your recorded profile facts.');
  if (run.id === 'suggest-fields') summary = t('Shared: the CV text you imported.');
  else if (run.id === 'extract-requirements') summary = t('Shared: the “{job}” advert.', { job: job?.title || t('Untitled advert') });
  else if (run.id === 'suggest-evidence') summary = t('Shared: your profile and the advert’s requirements.');
  else if (run.id === 'plan-from-gaps') summary = t('Shared: your target role, weekly hours and recorded gaps.');
  else if (run.id === 'linkedin') summary = t('Shared: your profile and CV draft.');
  else if (['compare', 'search'].includes(run.id)) summary = t('Shared: your profile and saved adverts.');
  else if (['tailor-cv', 'tailor', 'letter'].includes(run.id)) summary = t('Shared: your profile, CV draft and the “{job}” advert.', { job: job?.title || t('Untitled advert') });
  else if (run.id === 'interview') summary = t('Shared: your profile, target advert and saved interview practice.');
  else if (run.id === 'fit' && job) summary = t('Shared: your profile and the “{job}” advert.', { job: job.title });
  else if (run.kind === 'custom') {
    const from = ctx.state.ai.customPrompts.find(c => c.id === run.id)?.dataFrom;
    if (from === 'cv') summary = t('Shared: your profile and CV draft.');
    if (from === 'job') summary = t('Shared: your profile and the “{job}” advert.', { job: job?.title || t('Untitled advert') });
  }
  return summary + ' ' + (run.redactOn ? t('Your name is hidden.') : t('Redaction is off. Check for personal details.'));
}

/** @param {import('../../app-context.js').Ctx} ctx @param {AiRun} run */
function panelBody(ctx, run) {
  const { t } = ctx, route = ai.getRoute();
  if (route === 'copy' && !ctx.state.settings.aiChat || ctx.ui.changeChat) return chatChoice(ctx);
  if (run.sourceContext !== reviewContext(ctx, run)) return html`<p role="alert">${t('Your source facts or target advert changed. These suggestions belong to the earlier context. Start again before applying more changes.')}</p>
${run.output ? html`<details class="details"><summary>${t('Earlier unverified reply')}</summary><pre class="original-text">${run.output}</pre></details>` : nothing}
${button(t('Start again with current facts'), () => { ctx.ui.ai = null; openAi(ctx, { kind: run.kind, id: run.id, title: run.title, page: run.page, jobId: run.jobId }); }, { style: '' })}`;
  const config = ai.providerConfig(route), local = route === 'browser', direct = local || !!config;
  if (run.id === 'interview' && config && ctx.services.mockInterview) return ctx.services.mockInterview(ctx);
  const chat = chosenChat(ctx.state.settings), { text, counts } = outgoing(ctx, run);
  const host = local || config?.kind === 'device' ? t('this computer') : config ? new URL(config.endpoint).host : '';
  const needsTick = direct && !ctx.ui.aiTextConfirmed?.[route];
  const downloadNeeded = local && ctx.ui.browserAvailability !== 'available';
  const ready = local ? ['available', 'downloadable', 'downloading'].includes(ctx.ui.browserAvailability) && (!downloadNeeded || run.downloadAgreed) : config && (route !== 'openrouter' || !!ai.getModel(route)) && (config.kind !== 'key' || ai.getKey(route)) && (config.kind !== 'device' || ctx.services.webllmReady?.());
  const share = run.page !== 'prompts' && typeof navigator.share === 'function' && matchMedia('(max-width:720px)').matches;
  const send = () => { (ctx.ui.aiTextConfirmed ||= {})[route] = true; sendBuiltIn(ctx, run); };
  return html`<p class="shared-summary">${sharedSummary(ctx, run)}</p>
<p class="field-hint">${t('Using: {chat}', { chat: usingLabel(ctx) })} · ${button(t('change'), () => { closePanel(ctx); ctx.go('settings'); }, { style: 'ghost small' })}</p>
<div class="actions ai-primary">${direct ? run.status === 'running' ? button(t('Stop'), () => run.controller?.abort(), { style: 'danger' }) : button(t('Send'), send, { style: '', testid: 'ai-send', disabled: !ready || !!(needsTick && (!run.hostTicked || !run.previewSeen)) }) : button(share ? t('Share to app') : t('Copy and open {chat}', { chat: chat.label }), () => handoff(ctx, run), { style: '', testid: 'copy-open' })}
${share && !direct ? button(t('Copy and open {chat}', { chat: chat.label }), () => handoff(ctx, run, false)) : nothing}</div>
${direct && !ready && !downloadNeeded ? html`<p>${t('Finish connecting in Settings → Advanced, or use your free AI chat.')}</p>` : nothing}
<details class="details ai-exact" ?open=${!!run.previewOpen}><summary @click=${(/** @type {Event} */ e) => { e.preventDefault(); run.previewOpen = !run.previewOpen; if (run.previewOpen) run.previewSeen = true; ctx.rerender(); }}>${t('See the exact text')}</summary>
<label class="visually-hidden" for="ai-outgoing">${t('Exact outgoing text')}</label><textarea id="ai-outgoing" class="prompt-preview" readonly rows="9" spellcheck="false" .value=${text}></textarea>
<label class="check-row"><input type="checkbox" .checked=${run.redactOn} @change=${(/** @type {Event} */ e) => { run.redactOn = /** @type {HTMLInputElement} */ (e.target).checked; run.hostTicked = false; ctx.rerender(); }}><span>${t('Redact before sending')}</span></label>
<p class="field-hint">${run.redactOn ? t('Redaction catches common patterns only. Read the text before sending.') : t('Redaction is off: the text is sent exactly as shown.')}${Object.keys(counts).length ? ' ' + t('Common contact details were hidden.') : ''}</p></details>
${needsTick ? html`<label class="check-row mt-10"><input id="ai-host-tick" type="checkbox" ?disabled=${!run.previewSeen} .checked=${run.hostTicked} @change=${(/** @type {Event} */ e) => { run.hostTicked = /** @type {HTMLInputElement} */ (e.target).checked; ctx.rerender(); }}><span>${t('I have read the text above and want to send it to {host}.', { host })}</span></label>` : nothing}
${downloadNeeded ? html`<div class="banner mt-10"><p>${t('Large download: this may need several GB. Your browser does not report the exact size. Use Wi-Fi and check that you have enough space. Your text stays on this computer.')}</p><label class="check-row"><input type="checkbox" .checked=${!!run.downloadAgreed} @change=${(/** @type {Event} */ e) => { run.downloadAgreed = /** @type {HTMLInputElement} */ (e.target).checked; ctx.rerender(); }}><span>${t('I understand. I am on Wi-Fi or have enough data.')}</span></label></div>` : nothing}
${run.downloadProgress !== undefined ? html`<label for="browser-download">${t('Preparing AI on this computer…')}</label><progress id="browser-download" max="1" .value=${run.downloadProgress}></progress>` : nothing}
${!direct ? html`<div class="paste-answer mt-18">${button(t('Paste the answer'), () => pasteAnswer(ctx, run), { style: '', testid: 'paste-answer' })}
<div class="field mt-10"><label for="ai-pasted">${t('Or paste the answer here')}</label><textarea id="ai-pasted" rows="4" maxlength="40000" .value=${live(run.pasted)} @input=${(/** @type {Event} */ e) => { run.pasted = /** @type {HTMLTextAreaElement} */ (e.target).value; }}></textarea></div>${button(t('Read the reply'), () => finish(ctx, run, run.pasted))}</div>` : nothing}
${run.status === 'running' || (run.output && run.kind !== 'task') || run.status === 'error' ? html`<div class="ai-output mt-15" aria-live="polite"><p class="pill sand">${t('Unverified draft — needs your review')}</p>${run.error ? html`<p class="evidence-warning" role="alert">${run.error}</p>` : nothing}<pre class="original-text">${run.output}</pre>
${run.status === 'done' && run.kind === 'step' ? button(t('Keep as a draft in the prompt studio'), () => { if (ctx.update('ai.drafts.' + run.id, run.output)) ctx.notify(t('Saved as an unverified draft. It was not applied to your CV.')); }) : nothing}</div>` : nothing}
${run.proposals ? html`<div class="mt-15">${proposalReview(ctx, run.proposals, run.decisions)}</div>` : nothing}
${run.page === 'profile' ? button(t('Return to my profile facts'), () => { closePanel(ctx); ctx.focusAfterRender('field-profile-headline'); }) : nothing}
${run.page === 'cv' ? button(t('Return to my CV draft'), () => { closePanel(ctx); ctx.focusAfterRender('field-cv-headline'); }) : nothing}`;
}

/** Native dialog supplies focus trapping and keeps the underlying step layout unchanged.
 * @param {import('../../app-context.js').Ctx} ctx @param {string} view
 */
export function aiPanel(ctx, view) {
  const run = /** @type {AiRun | undefined} */ (ctx.ui.ai);
  if (!run || run.hidden || run.page !== view) return nothing;
  return html`<dialog class="ai-sheet" aria-labelledby="ai-panel-title" @cancel=${(/** @type {Event} */ e) => { e.preventDefault(); closePanel(ctx); }}><section class="ai-panel"><header class="ai-sheet-header"><h2 id="ai-panel-title" tabindex="-1">${ctx.t(run.title)}</h2>${button(ctx.t('Close'), () => closePanel(ctx), { style: 'secondary' })}</header><div class="ai-sheet-body">${panelBody(ctx, run)}</div></section></dialog>`;
}
