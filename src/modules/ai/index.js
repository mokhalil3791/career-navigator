// @ts-check
/**
 * Built-in AI module: adds AI buttons to pages and the AI panel. Every AI
 * route ends in either an unverified draft or proposals the user reviews.
 */
import { examplePromptNote, exampleText } from '../../components/example.js';
import { html, nothing } from 'lit-html';
import { button } from '../../components/ui.js';
import { icon } from '../../components/icon.js';
import { field } from '../../components/ui.js';
import { openAi, aiPanel } from './panel.js';
import { connectCard, webllmReady } from './connect.js';
import { mockInterview } from './mock-interview.js';
import { gapsFrom } from '../../ai/tasks.js';
import { DUTCH_DEMAND, CEFR_LEVELS } from '../../core/schema.js';
import { uid } from '../../lib/uid.js';
import * as aiSession from '../../ai/session.js';
import { kv } from '../../storage/device.js';

/** @param {any} app */
export function aiModule(app) {
  const s = app.services;
  /** AI buttons are hidden when the user chose "no AI" in onboarding. @param {any} ctx */
  const on = (ctx) => ctx.state.settings.aiMode !== 'none';
  const aiBtn = (/** @type {any} */ ctx, /** @type {string} */ label, /** @type {() => void} */ run, testid = '') => on(ctx) ? button(html`${icon('spark', 16)}${label}`, run, { style: 'secondary small', testid }) : nothing;

  s.aiPanel = aiPanel;
  s.openPrompt = (/** @type {any} */ ctx, /** @type {string} */ id) => openAi(ctx, { kind: 'step', id, title: ctx.content.prompts.find((/** @type {any} */ p) => p.id === id)?.title || 'AI help', page: location.hash.replace('#/', '') || 'home' });
  s.evidenceHelper = (/** @type {any} */ ctx) => button(ctx.t('Suggest evidence'), () => openAi(ctx, { kind: 'task', id: 'suggest-evidence', title: 'Suggest evidence from my profile', page: 'jobs', jobId: ctx.state.selectedJobId }), { style: 'secondary small' });
  s.journeyAi = (/** @type {any} */ ctx, /** @type {string} */ view) => {
    const t = ctx.t;
    const task = view === 'profile' ? ['suggest-fields', t('AI: fill my profile')] : view === 'jobs' ? ['extract-requirements', t('AI: find the requirements')] : view === 'cv' ? [ctx.ui.cvTab === 'linkedin' ? 'linkedin' : ctx.ui.cvTab === 'letter' ? 'letter' : 'tailor-cv', t('AI: tailor my CV')] : ['interview', t('AI: practise an interview')];
    const action = view === 'profile' && ctx.state.profile.cvText.trim() ? t('Turn this into my profile') : view === 'jobs' && ctx.state.jobs.some((j) => j.body.trim()) ? t('Find the requirements') : view === 'cv' ? t('Tailor to this job') : task[1];
    return html`<span class="journey-ai">${button(html`<span>${action}${action !== task[1] ? html`<small class="ai-task-label">${task[1]}</small>` : nothing}</span>`, () => openAi(ctx, { kind: ['interview', 'letter'].includes(task[0]) ? 'step' : 'task', id: task[0], title: task[1], page: view, jobId: ctx.state.selectedJobId }), { style: '', testid: 'journey-ai' })}</span>`;
  };
  s.aiConnect = connectCard;
  s.webllmReady = webllmReady;
  s.beforeDeleteEverything = async () => { aiSession.clearSession(); };
  s.afterStart = async () => { aiSession.setRoute(app.store.getState().settings.aiRoute); await aiSession.loadSavedKeys({ kv }).catch(() => {}); app.rerender(); };

  s.extractButton = (/** @type {any} */ ctx, /** @type {any} */ job) => html`${aiBtn(ctx, ctx.t('Extract requirements'), () => openAi(ctx, { kind: 'task', id: 'extract-requirements', title: 'Extract requirements from this advert', page: 'jobs', jobId: job.id }), 'extract')}${job.requirements.length ? aiBtn(ctx, ctx.t('Suggest evidence'), () => openAi(ctx, { kind: 'task', id: 'suggest-evidence', title: 'Suggest evidence from my profile', page: 'jobs', jobId: job.id })) : nothing}`;

  // FR-JOB-4: Dutch-language demand is flagged separately; the user can set it by hand too.
  s.jobFacts = (/** @type {any} */ ctx, /** @type {any} */ job) => {
    const { t } = ctx;
    const f = job.facts || { hours: '', location: '', dutch: '', dutchLevel: '' };
    const set = (/** @type {string} */ key) => (/** @type {Event} */ e) => ctx.dispatch({ type: 'setJobFacts', id: job.id, facts: { [key]: /** @type {HTMLInputElement} */ (e.target).value } });
    const labels = { '': t('Not checked yet'), required: t('Dutch required'), plus: t('Dutch is a plus'), 'not-stated': t('Dutch not stated') };
    return html`<div class="facts-row mt-15"><div class="field"><label for="facts-dutch">${t('Dutch-language demand')}</label><select id="facts-dutch" @change=${set('dutch')}>${DUTCH_DEMAND.map((d) => html`<option value=${d} ?selected=${f.dutch === d}>${labels[/** @type {''} */ (d)]}</option>`)}</select></div>
${f.dutch === 'required' ? html`<div class="field"><label for="facts-level">${t('Stated level')}</label><select id="facts-level" @change=${set('dutchLevel')}>${['', ...CEFR_LEVELS].map((l) => html`<option value=${l} ?selected=${f.dutchLevel === l}>${l || t('Not stated')}</option>`)}</select></div>` : nothing}
<div class="field"><label for="facts-hours">${t('Hours')}</label><input id="facts-hours" maxlength="200" .value=${f.hours} @change=${set('hours')}></div><div class="field"><label for="facts-location">${t('Location')}</label><input id="facts-location" maxlength="200" .value=${f.location} @change=${set('location')}></div></div>
${f.dutch ? html`<p class="pill ${f.dutch === 'required' ? 'alert' : f.dutch === 'plus' ? 'sand' : 'gray'} mt-10">${labels[/** @type {''} */ (f.dutch)]}${f.dutchLevel ? ' · ' + f.dutchLevel : ''}</p>` : nothing}`;
  };

  s.profileAi = (/** @type {any} */ ctx) => ctx.state.profile.cvText.trim() ? html`<div class="field full">${aiBtn(ctx, ctx.t('Suggest structured fields from my CV'), () => openAi(ctx, { kind: 'task', id: 'suggest-fields', title: 'Suggest profile fields from my pasted CV', page: 'profile' }), 'suggest-fields')}<span class="field-hint">${ctx.t('You review each field: accept, edit or reject. Nothing is filled in automatically.')}</span></div>` : nothing;

  s.tailorButton = (/** @type {any} */ ctx) => aiBtn(ctx, ctx.t('Tailor to selected advert'), () => openAi(ctx, { kind: 'task', id: 'tailor-cv', title: 'Tailor my CV to the selected advert', page: 'cv' }), 'tailor');

  s.linkedinCard = (/** @type {any} */ ctx) => {
    const { t } = ctx;
    return html`<section class="card"><div class="card-head"><div><h2>${t('LinkedIn sections')}</h2><p class="card-sub">${t('A headline, an About section and three experience bullets, from your recorded facts only.')}</p></div></div>
<div class="fields">${field(ctx, t('LinkedIn headline'), 'cv.linkedin.headline', { full: true, max: 300 })}${field(ctx, t('About'), 'cv.linkedin.about', { area: true, full: true, rows: 5, max: 3000 })}${field(ctx, t('Three experience bullets'), 'cv.linkedin.bullets', { area: true, full: true, rows: 4, max: 3000 })}</div></section>`;
  };

  s.planFromGaps = (/** @type {any} */ ctx) => {
    const gaps = gapsFrom(ctx.state);
    if (!gaps.length || !on(ctx)) return nothing;
    return html`<section class="card section-space"><div class="card-head"><div><h2>${ctx.t('Generate a plan from my top gaps')}</h2><p class="card-sub">${ctx.t('{n} requirements across your adverts are Not shown or Partly supported. AI can suggest priorities; you accept each one.', { n: gaps.length })}</p></div>${aiBtn(ctx, ctx.t('Suggest a plan'), () => openAi(ctx, { kind: 'task', id: 'plan-from-gaps', title: 'Plan from my top gaps', page: 'plan' }))}</div></section>`;
  };

  s.sendButton = (/** @type {any} */ ctx) => on(ctx) ? button(ctx.t('Send'), () => s.openPrompt(ctx, ctx.state.ai.step), { style: '', testid: 'run-builtin' }) : nothing;

  // FR-PS-3: the user's own prompt templates, stored in the workspace and exported with it.
  s.customPrompts = (/** @type {any} */ ctx) => {
    const { t, state } = ctx;
    const add = () => { const id = uid('prompt'); if (ctx.dispatch({ type: 'addRow', path: 'ai.customPrompts', row: { id, title: t('My prompt'), task: '', dataFrom: 'profile' } })) ctx.focusAfterRender('cp-title-' + id); };
    const edit = (/** @type {string} */ id, /** @type {string} */ key) => (/** @type {Event} */ e) => ctx.dispatch({ type: 'editRow', path: 'ai.customPrompts', id, key, value: /** @type {HTMLInputElement} */ (e.target).value });
    return html`<details class="details mt-15"><summary>${t('My own prompts ({n})', { n: state.ai.customPrompts.length })}</summary>
${state.ai.customPrompts.map((/** @type {any} */ c) => html`<div class="custom-prompt"><div class="field"><label for="cp-title-${c.id}">${t('Name')}</label><input id="cp-title-${c.id}" maxlength="200" .value=${c.title} @input=${edit(c.id, 'title')}></div>${state.demo ? html`${examplePromptNote(ctx)}<div class="example-custom preserve">${exampleText(c.task)}</div>` : nothing}<div class="field"><label for="cp-task-${c.id}">${t('What should the AI do?')}</label><textarea id="cp-task-${c.id}" rows="3" maxlength="8000" .value=${c.task} @input=${edit(c.id, 'task')}></textarea></div>
<div class="field"><label for="cp-data-${c.id}">${t('Include')}</label><select id="cp-data-${c.id}" @change=${edit(c.id, 'dataFrom')}><option value="profile" ?selected=${c.dataFrom === 'profile'}>${t('My profile')}</option><option value="job" ?selected=${c.dataFrom === 'job'}>${t('My profile and selected advert')}</option><option value="cv" ?selected=${c.dataFrom === 'cv'}>${t('My profile and CV draft')}</option></select></div>
<div class="actions">${button(t('Use'), () => openAi(ctx, { kind: 'custom', id: c.id, title: c.title, page: 'prompts' }), { style: 'small' })}${button(t('Remove'), () => ctx.dispatch({ type: 'removeRow', path: 'ai.customPrompts', id: c.id }), { style: 'ghost small' })}</div></div>`)}
${button(t('Add my own prompt'), add, { style: 'secondary small' })}<p class="source-note">${t('The safety rules are always included in your prompt and cannot be removed.')}</p></details>`;
  };

  s.mockInterview = mockInterview;
}
