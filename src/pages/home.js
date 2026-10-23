// @ts-check
/** Overview page. Ported from v0.1 renderHome. */
import { html } from 'lit-html';
import { icon } from '../components/icon.js';
import { button, goButton } from '../components/ui.js';
import { progressOverview } from '../components/progress.js';

/** @param {import('../app-context.js').Ctx} ctx */
export function renderHome(ctx) {
  const { state, t } = ctx;
  const profileStarted = Boolean(state.profile.experience || state.profile.about || state.profile.skills);
  const steps = [
    ['profile', 'person', '01', t('Tell your story'), t('Bring your skills, experience and goals together.'), profileStarted ? t('Profile started') : t('Start with what you know')],
    ['jobs', 'briefcase', '02', t('Explore your options'), t('Compare real job requirements with your evidence.'), state.jobs.length ? (state.jobs.length === 1 ? t('1 advert in your workspace') : t('{n} adverts in your workspace', { n: state.jobs.length })) : t('Add your first advert')],
    ['cv', 'document', '03', t('Prepare with purpose'), t('Build your application and practise your interview.'), state.cv.reviewed ? t('CV reviewed') : state.cv.summary ? t('CV draft started') : t('Create a truthful draft')],
    ['plan', 'path', '04', t('Make your next move'), t('Turn one learning gap into a 90-day plan.'), state.plan.nextAction ? t('Next action recorded') : t('Choose one small step')],
  ];
  return html`
<section class="hero"><div class="hero-copy"><p class="eyebrow">${t('A fresh start, on your terms')}</p><h1 tabindex="-1" class="focus-heading">${t('Your experience.')}<br><em>${t('Your next step.')}</em></h1><p class="lead">${t('Build a clear profile, explore jobs in the Netherlands and prepare an application you can stand behind.')}</p><div class="actions">${goButton(ctx, profileStarted ? t('Continue my profile') : t('Start my journey'), 'profile', '')}${button(t('Try a fictional example'), () => ctx.services.loadDemo(), { style: 'secondary' })}</div></div>${heroVisual(t)}</section>
${progressOverview(ctx)}
<section class="section-space"><div class="section-head"><h2>${t('Your journey, made practical')}</h2><span class="muted">${t('Start anywhere. Come back anytime.')}</span></div><div class="grid four">${steps.map((s) => html`<button type="button" class="step-card" @click=${() => ctx.go(s[0])}><div class="step-top"><span class="step-icon">${icon(s[1], 20)}</span><span class="step-num">${s[2]}</span></div><h3>${s[3]}</h3><p>${s[4]}</p><span class="step-status"><span class="dot"></span>${s[5]}</span></button>`)}</div></section>
<section class="strip section-space"><div class="inline"><span class="icon-badge">${icon('spark', 24)}</span><div><h3>${t('A little help from AI. You stay in control.')}</h3><p>${t('Six career prompts, ready for your preferred AI chat. Review what you share and what comes back.')}</p></div></div>${goButton(ctx, html`${t('Open prompt studio')} ${icon('arrow', 16)}`, 'prompts', 'secondary')}</section>
<div class="home-mini section-space">${icon('shield', 18)}<span><strong>${t('No sign-up or payment.')}</strong> ${t('The app works on your device. AI help is optional and free.')}</span></div>`;
}

/** @param {(s: string) => string} t */
function heroVisual(t) {
  return html`<div class="hero-visual" aria-hidden="true"><svg viewBox="0 0 260 280" fill="none"><path d="M40 251c0-87 176-45 176-126 0-35-38-49-65-30-35 25-10 68-51 68-26 0-38-21-29-38" stroke="#a9bda0" stroke-width="25"/><path d="M40 251c0-87 176-45 176-126 0-35-38-49-65-30-35 25-10 68-51 68-26 0-38-21-29-38" stroke="#e9f0e1" stroke-width="2" stroke-dasharray="5 7"/><circle cx="72" cy="120" r="16" fill="#123e3c"/><path d="m66 120 4 4 8-9" stroke="#d7eea6" stroke-width="2"/><circle cx="170" cy="57" r="43" fill="#f7f8f3"/><circle cx="170" cy="57" r="34" stroke="#c8d3c2"/><path d="m186 38-10 25-22 15 10-25Z" fill="#b85d2d"/><path d="m170 57-16 21 10-25Z" fill="#123e3c"/><circle cx="40" cy="249" r="7" fill="#b85d2d"/></svg><p class="hero-caption">${t('One useful step at a time')}</p></div>`;
}
