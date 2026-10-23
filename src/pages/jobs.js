// @ts-check
/** Compare jobs (FR-JOB). Ported from v0.1 renderJobs / renderRequirement / comparisonRows. */
import { html, nothing } from 'lit-html';
import { live } from 'lit-html/directives/live.js';
import { icon } from '../components/icon.js';
import { aiButton, button, goButton, pageHeading } from '../components/ui.js';
import { evidencePills } from '../components/evidence-pills.js';
import { needsEvidence, STATUS_OPTIONS } from '../core/evidence.js';
import { MAX_JOBS, MAX_REQUIREMENTS } from '../core/schema.js';
import { uid } from '../lib/uid.js';

/** @param {import('../app-context.js').Ctx} ctx */
function selectedJob(ctx) {
  return ctx.state.jobs.find((j) => j.id === ctx.state.selectedJobId) || ctx.state.jobs[0] || null;
}

/**
 * @param {import('../app-context.js').Ctx} ctx
 * @param {string} label
 * @param {'title'|'company'|'url'|'body'|'reason'} key
 * @param {any} j
 * @param {{ area?: boolean, rows?: number, max?: number, placeholder?: string, hint?: string, optional?: boolean, full?: boolean }} [opts]
 */
function jobField(ctx, label, key, j, opts = {}) {
  const id = 'job-' + key;
  const onInput = (/** @type {Event} */ e) => ctx.dispatch({ type: 'editJob', id: j.id, key, value: /** @type {HTMLInputElement} */ (e.target).value });
  return html`<div class="field ${opts.full ? 'full' : ''}"><label for=${id}>${label}${opts.optional ? html`<span class="optional">${ctx.t('optional')}</span>` : nothing}</label>${opts.area
    ? html`<textarea id=${id} rows=${opts.rows || 4} maxlength=${opts.max || 40000} placeholder=${opts.placeholder || ''} .value=${live(j[key])} @input=${onInput}></textarea>`
    : html`<input id=${id} type=${key === 'url' ? 'url' : 'text'} maxlength=${key === 'url' ? 3000 : 500} placeholder=${opts.placeholder || ''} .value=${live(j[key])} @input=${onInput}>`}${opts.hint ? html`<span class="field-hint">${opts.hint}</span>` : nothing}</div>`;
}

/**
 * @param {import('../app-context.js').Ctx} ctx
 * @param {any} r
 * @param {number} i
 */
function renderRequirement(ctx, r, i) {
  const { t } = ctx;
  const edit = (/** @type {string} */ key) => (/** @type {Event} */ e) => ctx.dispatch({ type: 'editRequirement', id: r.id, key, value: /** @type {HTMLInputElement} */ (e.target).value });
  const remove = () => {
    if ((r.text || r.evidence) && !ctx.confirm(t('Remove this requirement and its evidence?'))) return;
    ctx.dispatch({ type: 'removeRequirement', id: r.id });
  };
  const base = 'req-' + r.id;
  return html`<section class="requirement" data-requirement=${r.id}><div class="requirement-top"><strong>${t('Requirement {n}', { n: i + 1 })}${r.kind === 'must' ? html` <span class="pill">${t('Must-have')}</span>` : r.kind === 'nice' ? html` <span class="pill gray">${t('Nice to have')}</span>` : nothing}</strong>${button(t('Remove'), remove, { style: 'ghost small' })}</div><div class="fields">
<div class="field full"><label for="${base}-text">${t('What does the advert ask for?')}</label><input type="text" id="${base}-text" maxlength="2000" placeholder=${t('e.g. Basic SQL and data checks')} .value=${live(r.text)} @input=${edit('text')}></div>
<div class="field"><label for="${base}-status">${t('My evidence status')}</label><select id="${base}-status" @change=${edit('status')}>${STATUS_OPTIONS.map(([value, label]) => html`<option value=${value} ?selected=${r.status === value}>${t(label)}</option>`)}</select></div>
<div class="field"><label for="${base}-next">${t('Next step or question')}</label><input type="text" id="${base}-next" maxlength="3000" placeholder=${t('What could I show, learn or ask?')} .value=${live(r.nextStep)} @input=${edit('nextStep')}></div>
<div class="field full"><label for="${base}-evidence">${t('Evidence from my experience')}</label><textarea id="${base}-evidence" rows="2" maxlength="6000" placeholder=${t('Name a real task, project or example you can explain.')} .value=${live(r.evidence)} @input=${edit('evidence')}></textarea>${ctx.services.evidenceHelper ? ctx.services.evidenceHelper(ctx, r) : nothing}<span class="evidence-warning" id="${base}-warning">${needsEvidence(r) ? t('Add evidence. This requirement is counted as unclear until you do.') : ''}</span></div>
</div></section>`;
}

/** @param {import('../app-context.js').Ctx} ctx */
export function renderJobs(ctx) {
  const { state, t } = ctx;
  const j = selectedJob(ctx);
  const addJob = () => {
    if (state.jobs.length >= MAX_JOBS) { ctx.notify(t('You can keep up to 8 adverts in one workspace.'), true); return; }
    if (ctx.dispatch({ type: 'addJob', id: uid('job') })) ctx.focusAfterRender('job-title');
  };
  const cards = state.jobs.map((v, i) => html`<article class="job-card ${j?.id === v.id ? 'active' : ''}"><button type="button" class="job-select" aria-pressed=${String(j?.id === v.id)} @click=${() => { ctx.dispatch({ type: 'selectJob', id: v.id }); ctx.focusAfterRender('job-title'); }}><h3>${v.title || t('Untitled advert')}</h3><p>${v.company || t('Employer not entered')}</p><span class="pill ${j?.id === v.id ? '' : 'gray'} mt-10">${j?.id === v.id ? t('Selected target') : t('Review advert')}</span></button><div class="job-rank"><small>${t('Your order · {n}', { n: i + 1 })}</small><button type="button" aria-label=${t('Move {title} earlier', { title: v.title || t('job') })} ?disabled=${i === 0} @click=${() => { ctx.dispatch({ type: 'moveJob', id: v.id, direction: -1 }); ctx.notify(t('Your advert order was updated.')); }}>↑</button><button type="button" aria-label=${t('Move {title} later', { title: v.title || t('job') })} ?disabled=${i === state.jobs.length - 1} @click=${() => { ctx.dispatch({ type: 'moveJob', id: v.id, direction: 1 }); ctx.notify(t('Your advert order was updated.')); }}>↓</button></div></article>`);
  const detail = !j
    ? html`<div class="empty">${icon('briefcase', 38)}<h2>${t('Bring a real job advert.')}</h2><p>${t('Copy a vacancy you are interested in. This workspace helps you review it; it does not search job sites automatically.')}</p>${button(t('Add my first advert'), addJob, { style: '' })}</div>`
    : html`<section class="card"><div class="card-head"><div><p class="eyebrow">${t('Selected target')}</p><h2 class="mt-6">${t('Review this opportunity')}</h2></div>${button(t('Remove advert'), () => { if (ctx.confirm(t('Remove this advert and its requirement review?'))) ctx.dispatch({ type: 'removeJob', id: j.id }); }, { style: 'ghost small' })}</div>
<div class="fields">${jobField(ctx, t('Job title'), 'title', j, { placeholder: t('e.g. Junior Data Analyst') })}${jobField(ctx, t('Employer'), 'company', j, { placeholder: t('Organisation name') })}${jobField(ctx, t('Original advert link'), 'url', j, { optional: true, full: true, placeholder: 'https://…', hint: t('Use the employer’s original listing when available. Check that the vacancy is still open.') })}${jobField(ctx, t('Paste the job advert'), 'body', j, { area: true, full: true, rows: 5, placeholder: t('Responsibilities, requirements, hours, location and anything else relevant.') })}</div>
${ctx.services.jobFacts ? ctx.services.jobFacts(ctx, j) : nothing}
<div class="divider"></div><div class="card-head"><div><h3>${t('Requirements & my evidence')}</h3><p class="card-sub">${t('Add each requirement separately. You choose the status and supply the evidence.')}</p></div><div class="actions">${ctx.services.extractButton ? ctx.services.extractButton(ctx, j) : nothing}${aiButton(ctx, 'fit', t('Help me review'))}</div></div>
${ctx.ui.proposalPanel ? ctx.ui.proposalPanel(ctx) : nothing}
<div id="evidence-summary">${evidencePills(ctx, j)}</div><div id="requirements">${j.requirements.map((r, i) => renderRequirement(ctx, r, i))}</div>
<div class="actions mt-18">${button(html`${icon('plus', 16)}${t('Add a requirement')}`, () => { const id = uid('req'); if (ctx.dispatch({ type: 'addRequirement', id })) ctx.focusAfterRender('req-' + id + '-text'); }, { disabled: j.requirements.length >= MAX_REQUIREMENTS })}</div>
<p class="source-note">${t('Supported = evidence recorded · Partly supported = some evidence · Not shown = evidence not yet recorded · Unclear = requirement or meaning needs clarification. These are your review notes, not a hiring score.')}</p><div class="divider"></div>
${jobField(ctx, t('My decision, gap & question for the employer'), 'reason', j, { area: true, max: 8000, placeholder: t('Why might I choose this role?\nWhat should I learn or show?\nWhat do I need to ask the employer?') })}
<div class="form-footer"><span class="muted small">${t('You can reorder adverts in the list.')}</span>${goButton(ctx, html`${t('Prepare my application')} ${icon('arrow', 16)}`, 'cv', '')}</div></section>`;
  return html`${pageHeading(t('02 / Explore your options'), t('Compare jobs with evidence.'), t('Choose the requirements that matter. Separate what you can show from what you still need to ask.'), aiButton(ctx, 'search', t('Explore with AI')))}
<div class="job-layout"><aside class="job-list">${cards}${button(html`${icon('plus', 16)}${t('Add an advert')}`, addJob, { disabled: state.jobs.length >= MAX_JOBS })}<p class="source-note">${t('Up to 8 adverts per workspace. No scores or automatic ranking.')}</p></aside><div>${detail}</div></div>
${state.jobs.length > 1 ? (ctx.services.comparison ? ctx.services.comparison(ctx) : comparisonTable(ctx)) : nothing}
${ctx.services.knowledgeFor ? html`<div class="section-space">${ctx.services.knowledgeFor(ctx, 'jobs')}</div>` : nothing}`;
}

/** The v0.1 comparison table (one row per advert). @param {import('../app-context.js').Ctx} ctx */
export function comparisonTable(ctx) {
  const { t } = ctx;
  return html`<section class="section-space"><div class="section-head"><h2>${t('Your comparison at a glance')}</h2>${aiButton(ctx, 'compare', t('Compare with AI'))}</div><div class="table-wrap" tabindex="0" role="region" aria-label=${t('Comparison table')}><table><thead><tr><th>${t('My order')}</th><th>${t('Opportunity')}</th><th>${t('Requirement review')}</th><th>${t('My decision & next question')}</th></tr></thead><tbody id="comparison-rows">${ctx.state.jobs.map((v, i) => html`<tr><td>${i + 1}</td><td><strong>${v.title || t('Untitled advert')}</strong><p>${v.company}</p></td><td>${evidencePills(ctx, v)}</td><td>${v.reason || t('Add a note after reviewing the requirements.')}</td></tr>`)}</tbody></table></div></section>`;
}
