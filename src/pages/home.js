// @ts-check
import { html, nothing } from 'lit-html';
import { button, pageHeading } from '../components/ui.js';
import { JOURNEY, stepStatuses } from '../components/journey.js';
import { icon } from '../components/icon.js';
/** @param {import('../app-context.js').Ctx} ctx */
export function renderHome(ctx) {
  const { state, t } = ctx;
  const statuses = stepStatuses(state);
  const first = Math.max(0, statuses.findIndex(s => s !== 'Done'));
  const started = statuses.some(s => s !== 'Not started');
  return html`${pageHeading('', t('Your next step in the Netherlands starts here.'), t('Build a CV you trust, find what jobs really ask for, and leave with a plan. Free, private, no account.'))}
  ${!state.settings.onboarded ? ctx.services.welcome?.(ctx) : nothing}
  <section class="primary-journey section-space"><div class="actions">${button(started ? t('Continue: {step}', { step: t(JOURNEY[first].label) }) : t('Start'), () => { ctx.update('settings.onboarded', true); ctx.go(JOURNEY[first].id); }, { style: '' })}
  ${button(t('Try with an example person (Sam)'), () => ctx.services.loadDemo(), { testid: 'load-demo' })}</div>
  <div class="grid four section-space">${JOURNEY.map((step, i) => html`<button type="button" class="step-card" @click=${() => ctx.go(step.id)}><h2>${i + 1}. ${t(step.label)}</h2><p class="step-status">${icon(statuses[i] === 'Done' ? 'check' : 'path', 18)}${t(statuses[i])}</p></button>`)}</div>
  <p class="source-note section-space">${t('Your work stays on this device. AI help is optional and free.')}</p></section>
  ${state.cv.reviewed ? html`<section class="card section-space"><h2>${t('Take it home')}</h2><div class="actions mt-15">${ctx.services.docxButton?.(ctx)}${button(t('Download my backup'), () => ctx.services.exportBackup())}</div><p>${t('To restore a backup, open Settings and choose Import backup.')}</p><p>${t('Add Career Navigator to my home screen')}</p>${ctx.services.installButton?.(ctx) || html`<p>${t('On iPhone, use Share, then Add to Home Screen. On Android, open the browser menu and choose Install app or Add to Home screen.')}</p>`}</section>` : nothing}`;
}
