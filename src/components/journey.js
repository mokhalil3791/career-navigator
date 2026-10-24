// @ts-check
import { html } from 'lit-html';
import { navigateTabs, button, pageHeading } from './ui.js';
import { hasProfileFacts, hasCvWork } from '../core/auto-draft.js';

export const JOURNEY = [
  { id: 'profile', label: 'My story', icon: 'person' },
  { id: 'jobs', label: 'Target job', icon: 'briefcase' },
  { id: 'cv', label: 'My CV', icon: 'document' },
  { id: 'interview', label: 'Next steps', icon: 'path' },
];
/** @param {string} view */
export function stepIndex(view) { return ['plan', 'applications'].includes(view) ? 3 : JOURNEY.findIndex(s => s.id === view); }

/** Recorded progress only; Done never means the app verified someone's facts.
 * @param {import('../core/schema.js').Workspace} state
 */
export function stepStatuses(state) {
  const facts = hasProfileFacts(state);
  return [facts ? 'Done' : state.profile.cvText ? 'In progress' : 'Not started',
    state.jobs.some(j => j.body.trim() && j.requirements.length) ? 'Done' : state.jobs.length ? 'In progress' : 'Not started',
    state.cv.reviewed ? 'Done' : hasCvWork(state) ? 'In progress' : 'Not started',
    state.plan.nextAction.trim() ? 'Done' : state.applications.length || Object.keys(state.interview.answers).length ? 'In progress' : 'Not started'];
}

/** @param {import('../app-context.js').Ctx} ctx @param {string} view */
export function stepper(ctx, view) {
  const i = stepIndex(view);
  return html`<ol class="stepper" aria-label=${ctx.t('Four steps')}>${JOURNEY.map((s, n) => html`<li><button type="button" aria-current=${i === n ? 'step' : 'false'} @click=${() => ctx.go(s.id)}>${n + 1}. ${ctx.t(s.label)}</button></li>`)}</ol>`;
}

/** @param {import('../app-context.js').Ctx} ctx @param {string} view */
export function journeyFooter(ctx, view) {
  const i = stepIndex(view), next = JOURNEY[i + 1];
  return html`<div class="journey-footer">${button(ctx.t('Back'), () => ctx.go(i > 0 ? JOURNEY[i - 1].id : 'home'))}${next ? button(ctx.t('Next: {step}', { step: ctx.t(next.label) }), () => ctx.go(next.id), { style: '' }) : button(ctx.t('Home'), () => ctx.go('home'))}</div>`;
}

/** @param {import('../app-context.js').Ctx} ctx @param {string} view @param {string} lead */
export function journeyHeading(ctx, view, lead) {
  const i = stepIndex(view);
  return html`${pageHeading('', `${i + 1}. ${ctx.t(JOURNEY[i].label)}`, ctx.t(lead), ctx.services.journeyAi?.(ctx, view))}
  ${i === 3 ? html`<div class="tabs" role="tablist" @keydown=${navigateTabs} aria-label=${ctx.t('Next steps')}>${[['interview', 'Interview practice'], ['plan', '90-day plan'], ...(ctx.services.features?.applications !== false ? [['applications', 'Applications']] : [])].map(([id, label]) => html`<button type="button" role="tab" aria-selected=${id === view ? 'true' : 'false'} @click=${() => ctx.go(id)}>${ctx.t(label)}</button>`)}</div>` : ''}`;
}
