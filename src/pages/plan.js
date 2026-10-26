import { journeyHeading } from '../components/journey.js';
// @ts-check
/** My 90-day plan (FR-PLAN). Ported from v0.1 renderPlan. */
import { html, nothing } from 'lit-html';
import { live } from 'lit-html/directives/live.js';
import { icon } from '../components/icon.js';
import { button, field, pageHeading } from '../components/ui.js';
import { buildPackHTML, safeUrl } from '../core/exports/html.js';
import { planHasContent } from '../core/plan.js';

/** @param {import('../app-context.js').Ctx} ctx */
export function renderPlan(ctx) {
  const { state, t, content } = ctx;
  const role = content.roles.find((r) => r.id === state.plan.roleId);
  const exportPack = () => {
    ctx.download(state.demo ? 'fictional-example-work-pack.html' : 'my-career-work-pack.html', buildPackHTML(state, content));
    ctx.notify(t('Work pack downloaded. Open it in a browser to print or save as PDF.'));
  };
  const applyTemplate = () => {
    const select = /** @type {HTMLSelectElement} */ (document.getElementById('role-template'));
    const id = select.value;
    const chosen = content.roles.find((r) => r.id === id);
    if (planHasContent(state.plan) && !ctx.confirm(t('Replace this learning plan with the selected starting template? Your profile, jobs and CV will be kept.'))) return;
    if (ctx.dispatch({ type: 'applyTemplate', role: chosen || { id: 'custom' } })) ctx.notify(id === 'custom' ? t('A blank plan is ready for any career direction.') : t('Template loaded. Adjust the priorities, scope and pace to fit you.'));
  };
  const phases = [['day30', '01–30', t('Build a foundation'), t('Learn the essentials and produce something small.'), 'phase_1'], ['day60', '31–60', t('Build something useful'), t('Apply the skills to your project. Keep the scope manageable.'), 'phase_2'], ['day90', '61–90', t('Test, explain & share'), t('Ask for feedback, improve the work and explain your choices.'), 'phase_3']];
  return html`${journeyHeading(ctx, 'plan', 'Choose one useful next step for your next 90 days.')}<div class="actions">${button(t('Download my work pack'), exportPack)}</div>
<p class="source-note"><a href="./kit/#roadmaps" target="_blank" rel="noopener noreferrer">${t('See detailed 90-day plans for six Data & AI roles in the Career Kit')}</a></p>
<section class="card soft"><div class="template-row"><div class="field"><label for="role-template">${t('Start from a role template')}</label><select id="role-template"><option value="custom" ?selected=${state.plan.roleId === 'custom'}>${t('Custom career — make my own plan')}</option>${content.roles.map((r) => html`<option value=${r.id} ?selected=${r.id === state.plan.roleId}>${t(r.role)}</option>`)}</select></div>${button(t('Use this template'), applyTemplate, { style: '' })}</div>
<p class="source-note">${t('Nine Data & AI starting points, or choose any other career. These are workshop adaptations of public learning maps, not official 90-day programmes or hiring requirements.')}</p>
${role ? html`<div class="divider"></div><h3>${t('{role}: a starting point', { role: role.role })}</h3><p class="card-sub">${role.starting_point}</p><div class="roadmap-links">${role.roadmaps.map((/** @type {any} */ r) => { const url = safeUrl(r.url); return url ? html`<a href=${url} target="_blank" rel="noopener noreferrer">${t('{title} roadmap ↗', { title: r.title })}</a>` : nothing; })}</div>${role.mapping_note ? html`<p class="source-note">${role.mapping_note}</p>` : nothing}` : nothing}</section>

<section class="card section-space"><h2>${t('My direction')}</h2><div class="fields mt-20">${field(ctx, t('My target role'), 'plan.targetRole', { full: true, placeholder: t('The kind of work I want to move towards') })}${field(ctx, t('Priority 1'), 'plan.priorities.0', { full: true, max: 4000, placeholder: t('The first skill or capability to develop') })}${field(ctx, t('Priority 2'), 'plan.priorities.1', { full: true, max: 4000 })}${field(ctx, t('Priority 3'), 'plan.priorities.2', { full: true, max: 4000 })}${field(ctx, t('One portfolio project'), 'plan.project', { area: true, full: true, max: 8000, placeholder: t('A small project that shows what I can do, using public or invented data.') })}</div></section>
<section class="phase-grid" aria-label=${t('My 90-day milestones')}>${phases.map((p) => html`<section class="phase"><span class="phase-number">${t('DAYS {range}', { range: p[1] })}</span><h3>${role ? role[p[4]].label : p[2]}</h3><p>${role ? role[p[4]].slide : p[3]}</p>${role ? html`<details class="details"><summary>${t('Suggested activities')}</summary><ul class="tip-list">${role[p[4]].actions.map((/** @type {string} */ a) => html`<li>${a}</li>`)}</ul></details>` : nothing}<label for="plan-${p[0]}">${t('What I will be able to show')}</label><textarea id="plan-${p[0]}" maxlength="8000" rows="5" placeholder=${t('Name an observable output, not just a course to finish.')} .value=${live(state.plan[p[0]])} @input=${(/** @type {Event} */ e) => ctx.update('plan.' + p[0], /** @type {HTMLTextAreaElement} */ (e.target).value)}></textarea>${ctx.services.milestoneDate ? ctx.services.milestoneDate(ctx, p[0]) : nothing}</section>`)}</section>
<div class="grid two section-space"><section class="card"><h2>${t('Make the first step concrete.')}</h2><div class="mt-20">${field(ctx, t('My next action'), 'plan.nextAction', { area: true, max: 8000, rows: 3, placeholder: t('A small action I can start within the next 48 hours.') })}<div class="fields mt-18">${field(ctx, t('When I will start'), 'plan.nextDate', { type: 'date' })}${field(ctx, t('Hours per week'), 'plan.hours', { type: 'number', hint: t('Choose a realistic whole number from 1 to 40.') })}</div>${ctx.services.icsButton ? ctx.services.icsButton(ctx) : nothing}</div></section>
<section class="card ${role ? 'sand' : 'soft'}"><p class="eyebrow">${t('A plan you can adapt')}</p><h3 class="mt-11">${role ? t('If you are starting from the beginning') : t('Progress needs evidence, not perfection.')}</h3><p class="card-sub">${role ? role.beginner_adjustment : t('Reduce the scope when you need to. A small project you can explain is a useful starting point for a conversation.')}</p>${role ? html`<p class="card-sub"><strong>${t('Suggested tools:')}</strong> ${role.tools}</p><details class="details"><summary>${t('How to check the project')}</summary><ul class="tip-list">${role.acceptance.map((/** @type {string} */ a) => html`<li>${a}</li>`)}</ul></details>` : nothing}<p class="source-note">${t('Learning plans do not guarantee a job. Adapt the sequence to your experience, time and the requirements of real roles.')}</p></section></div>
${ctx.services.checkin ? ctx.services.checkin(ctx) : nothing}
<div class="form-footer"><p class="muted small">${t('Include your profile, evidence, practice and plan in one printable work pack.')}</p><div class="actions">${ctx.services.coachPackButton ? ctx.services.coachPackButton(ctx) : nothing}${button(html`${icon('download', 16)}${t('Download my work pack')}`, exportPack, { style: '' })}</div></div>`;
}
