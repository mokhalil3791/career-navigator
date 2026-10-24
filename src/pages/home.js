// @ts-check
/** The primary CV journey, with the wider workspace kept within reach. */
import { html, nothing } from 'lit-html';
import { button, goButton, pageHeading } from '../components/ui.js';
import { progressOverview } from '../components/progress.js';
import { CV_CONTENT_KEYS } from '../core/cv.js';

/** @param {import('../app-context.js').Ctx} ctx */
export function renderHome(ctx) {
  const { state, t } = ctx;
  const heading = pageHeading(t('Your workspace'), t('Build a CV you have reviewed.'), t('Import your CV, check the facts, add one advert, review a draft and export. AI is optional.'));
  const example = button(t('Try a fictional example'), () => ctx.services.loadDemo(), { style: 'secondary' });
  // The welcome keeps privacy before entry without a second dashboard competing beneath it.
  if (!state.settings.onboarded && ctx.services.welcome) return html`${heading}${ctx.services.welcome(ctx)}<div class="actions section-space">${example}</div>`;
  const facts = Boolean(state.profile.headline || state.profile.about || state.profile.experience || state.profile.skills || state.profile.education || state.profile.languages || state.profile.educationRows.length || state.profile.languageRows.length);
  const draft = CV_CONTENT_KEYS.some((key) => state.cv[key].trim());
  const started = facts || state.profile.cvText || state.jobs.length || draft;
  const next = draft ? 'cv' : facts ? (state.jobs.length ? 'cv' : 'jobs') : 'profile';
  const steps = [
    ['profile', t('Import or enter your CV')],
    ['profile', t('Check your profile facts')],
    ['jobs', t('Add one job advert')],
    ['cv', t('Review a tailored draft')],
    ['cv', t('Export HTML and Word')],
  ];
  return html`${heading}<section class="card primary-journey" aria-label=${t('Your CV journey')}>
<div class="actions">${goButton(ctx, started ? t('Continue my CV') : t('Build my CV'), next, '')}</div>
<p class="card-sub mt-15">${state.cv.reviewed ? t('Reviewed by you') : draft ? t('Needs your review') : facts ? t('Facts recorded') : t('Start with a file, pasted text or your own words.')}</p>
<ol class="journey-steps">${steps.map(([view, label]) => html`<li>${goButton(ctx, label, view, 'ghost')}</li>`)}</ol>
<p class="field-hint">${t('These steps show where to work. Recorded facts still need your own check.')}</p></section>
<p class="source-note section-space">${t('Workshop tools: AI prompt studio is in the main navigation. Find My 90-day plan under More tools.')}</p>
<details class="details card section-space"><summary>${t('My wider workspace')}</summary>${progressOverview(ctx)}
<div class="actions mt-18">${goButton(ctx, t('Open prompt studio'), 'prompts', 'secondary')}${example}</div>
${ctx.services.knowledgeFor ? html`<div class="section-space">${ctx.services.knowledgeFor(ctx, 'home')}</div>` : nothing}</details>
<p class="source-note section-space">${t('No sign-up or payment.')} ${t('The app works on your device. AI help is optional and free.')}</p>`;
}
