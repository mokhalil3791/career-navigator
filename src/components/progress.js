// @ts-check
/**
 * Home-screen progress overview (FR-ONB-3): profile, adverts, CV reviewed, plan, applications.
 * Shows what is recorded, never a score.
 */
import { html } from 'lit-html';
import { icon } from './icon.js';

/** @param {import('../app-context.js').Ctx} ctx */
export function progressOverview(ctx) {
  const { state, t } = ctx;
  const items = [
    ['profile', t('Profile'), Boolean(state.profile.experience || state.profile.skills), state.profile.experience ? t('Facts recorded') : t('Not yet recorded')],
    ['jobs', t('Adverts'), state.jobs.length > 0, state.jobs.length ? t('{n} saved', { n: state.jobs.length }) : t('None yet')],
    ['cv', t('CV reviewed'), state.cv.reviewed, state.cv.reviewed ? t('Reviewed by you') : t('Not yet reviewed')],
    ['plan', t('90-day plan'), Boolean(state.plan.nextAction), state.plan.nextAction ? t('Next action set') : t('No next action yet')],
    ['applications', t('Applications'), state.applications.length > 0, state.applications.length ? t('{n} tracked', { n: state.applications.length }) : t('None yet')],
  ];
  return html`<section class="section-space progress" aria-label=${t('Your progress')}><ul class="progress-list">${items.filter(([view]) => view !== 'applications' || ctx.services.features?.applications !== false).map(([view, label, done, detail]) => html`<li><button type="button" class="progress-item ${done ? 'done' : ''}" @click=${() => ctx.go(/** @type {string} */ (view))}><span class="progress-mark" aria-hidden="true">${done ? icon('check', 14) : ''}</span><span><strong>${label}</strong><small>${detail}</small></span></button></li>`)}</ul></section>`;
}
