import { journeyHeading } from '../../components/journey.js';
// @ts-check
/**
 * Applications tracker (FR-APP): advert link, date applied, stage, next
 * follow-up date, optional contact, notes; follow-ups export to .ics;
 * a weekly view of what was sent and what is due.
 */
import { html, nothing } from 'lit-html';
import { live } from 'lit-html/directives/live.js';
import { button, pageHeading } from '../../components/ui.js';
import { icon } from '../../components/icon.js';
import { STAGES } from '../../core/schema.js';
import { STAGE_LABELS, newApplication, weekSummary } from '../../core/applications.js';
import { buildICS, followUpItems } from '../../core/exports/ics.js';
import { safeUrl } from '../../core/escape.js';
import { isoDate } from '../../content/knowledge.js';
import { uid } from '../../lib/uid.js';

/** @param {import('../../app-context.js').Ctx} ctx */
function renderApplications(ctx) {
  const { t, state } = ctx;
  const today = isoDate();
  const week = weekSummary(state.applications, today);
  const add = (/** @type {any} */ job) => { const id = uid('app'); if (ctx.dispatch({ type: 'addRow', path: 'applications', row: newApplication(id, job) })) ctx.focusAfterRender('app-title-' + id); };
  const edit = (/** @type {string} */ id, /** @type {string} */ key) => (/** @type {Event} */ e) => ctx.dispatch({ type: 'editRow', path: 'applications', id, key, value: /** @type {HTMLInputElement} */ (e.target).value });
  const exportIcs = () => {
    const items = followUpItems(state.applications);
    if (!items.length) { ctx.notify(t('Add a follow-up date to at least one open application first.'), true); return; }
    ctx.download('career-navigator-follow-ups.ics', buildICS(items, { calendarName: t('Job application follow-ups') }), 'text/calendar;charset=utf-8');
    ctx.notify(t('Calendar file downloaded. Open it to add the follow-ups to your phone or computer calendar.'));
  };
  const untracked = state.jobs.filter((j) => !state.applications.some((a) => a.jobId === j.id));
  return html`${journeyHeading(ctx, 'applications', 'Keep track of applications and follow-up dates.')}<div class="actions">${button(t('Export follow-ups (.ics)'), exportIcs)}</div>
<section class="grid three"><div class="card soft"><p class="eyebrow">${t('This week')}</p><h2 class="mt-6">${t('{n} sent', { n: week.sentThisWeek.length })}</h2><p class="card-sub">${t('Week of {date}', { date: week.weekStart })}</p></div>
<div class="card ${week.followUpsDue.length ? 'sand' : ''}"><p class="eyebrow">${t('Follow-ups due')}</p><h2 class="mt-6">${week.followUpsDue.length}</h2><p class="card-sub">${week.overdue.length ? t('{n} overdue', { n: week.overdue.length }) : t('Nothing overdue')}</p></div>
<div class="card"><p class="eyebrow">${t('All applications')}</p><h2 class="mt-6">${state.applications.length}</h2><p class="card-sub">${STAGES.map((s) => `${t(STAGE_LABELS[s])}: ${state.applications.filter((a) => a.stage === s).length}`).filter((x) => !x.endsWith(': 0')).join(' · ') || t('None yet')}</p></div></section>
${week.followUpsDue.length ? html`<section class="card section-space"><h2>${t('Due this week')}</h2><ul class="tip-list">${week.followUpsDue.map((a) => html`<li><strong>${a.followUp}</strong> · ${a.title || t('Untitled application')}${a.company ? ' — ' + a.company : ''}${a.contact ? ' · ' + a.contact : ''}</li>`)}</ul></section>` : nothing}
<div class="actions section-space">${button(html`${icon('plus', 16)}${t('Add an application')}`, () => add(null), { style: '' })}${untracked.map((j) => button(t('Track “{title}”', { title: j.title || t('Untitled advert') }), () => add(j), { style: 'secondary small' }))}</div>
${state.applications.length ? html`<div class="grid section-space">${state.applications.map((a) => html`<article class="card application"><div class="card-head"><h3>${a.title || t('Untitled application')}</h3><span class="pill ${a.stage === 'offer' ? '' : a.stage === 'rejected' || a.stage === 'withdrawn' ? 'gray' : 'sand'}">${t(STAGE_LABELS[/** @type {'saved'} */ (a.stage)])}</span></div>
<div class="fields"><div class="field"><label for="app-title-${a.id}">${t('Job title')}</label><input id="app-title-${a.id}" maxlength="500" .value=${live(a.title)} @input=${edit(a.id, 'title')}></div><div class="field"><label for="app-company-${a.id}">${t('Employer')}</label><input id="app-company-${a.id}" maxlength="500" .value=${live(a.company)} @input=${edit(a.id, 'company')}></div>
<div class="field full"><label for="app-url-${a.id}">${t('Advert link')}<span class="optional">${t('optional')}</span></label><input id="app-url-${a.id}" type="url" maxlength="3000" .value=${live(a.url)} @input=${edit(a.id, 'url')}>${safeUrl(a.url) ? html`<a class="field-hint" href=${safeUrl(a.url)} target="_blank" rel="noopener noreferrer">${t('Open the advert')} ↗</a>` : nothing}</div>
<div class="field"><label for="app-stage-${a.id}">${t('Stage')}</label><select id="app-stage-${a.id}" @change=${edit(a.id, 'stage')}>${STAGES.map((s) => html`<option value=${s} ?selected=${a.stage === s}>${t(STAGE_LABELS[s])}</option>`)}</select></div>
<div class="field"><label for="app-date-${a.id}">${t('Date applied')}</label><input id="app-date-${a.id}" type="date" .value=${live(a.dateApplied)} @input=${edit(a.id, 'dateApplied')}></div>
<div class="field"><label for="app-follow-${a.id}">${t('Next follow-up')}</label><input id="app-follow-${a.id}" type="date" .value=${live(a.followUp)} @input=${edit(a.id, 'followUp')}></div>
<div class="field"><label for="app-contact-${a.id}">${t('Contact name')}<span class="optional">${t('optional')}</span></label><input id="app-contact-${a.id}" maxlength="200" .value=${live(a.contact)} @input=${edit(a.id, 'contact')}></div>
<div class="field full"><label for="app-notes-${a.id}">${t('Notes')}</label><textarea id="app-notes-${a.id}" rows="3" maxlength="4000" .value=${live(a.notes)} @input=${edit(a.id, 'notes')}></textarea></div></div>
<div class="actions mt-10">${button(t('Remove'), () => { if (ctx.confirm(t('Remove this application from the tracker?'))) ctx.dispatch({ type: 'removeRow', path: 'applications', id: a.id }); }, { style: 'ghost small' })}</div></article>`)}</div>`
    : html`<div class="empty section-space">${icon('list', 38)}<h2>${t('No applications yet.')}</h2><p>${t('Add one when you apply, or track an advert you saved in Compare jobs.')}</p></div>`}
${ctx.services.knowledgeFor ? html`<div class="grid two section-space">${ctx.services.knowledgeFor(ctx, 'applications')}</div>` : nothing}`;
}

/** @param {any} app */
export function applicationsModule(app) {
  const jobs = app.pages.findIndex((/** @type {any} */ p) => p.id === 'jobs');
  app.pages.splice(jobs + 1, 0, { id: 'applications', label: 'Applications', icon: 'list', render: renderApplications });
}
