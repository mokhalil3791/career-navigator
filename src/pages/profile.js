// @ts-check
/** My profile. Ported from v0.1 renderProfile. */
import { html } from 'lit-html';
import { icon } from '../components/icon.js';
import { aiButton, button, field, goButton, pageHeading } from '../components/ui.js';

/** @param {import('../app-context.js').Ctx} ctx */
export function renderProfile(ctx) {
  const { t, state } = ctx;
  const p = state.profile;
  return html`${pageHeading(t('01 / Tell your story'), t('Start with your experience.'), t('Import a CV or enter your facts. Check the text before using it.'))}
<section class="card section-space profile-source" aria-labelledby="profile-source-title">
<h2 id="profile-source-title">${t('Start with your CV')}</h2>
${ctx.services.cvImport ? ctx.services.cvImport(ctx) : ''}
<details class="details mt-15" ?open=${Boolean(p.cvText)}><summary>${t('Paste or check CV text')}</summary>
${field(ctx, t('Paste an existing CV'), 'profile.cvText', { optional: true, area: true, full: true, rows: 5, max: 30000, hint: t('Source text only. Check the extracted text, then enter facts below or review AI suggestions. Nothing is filled in automatically. Remove contact details you do not want to share.') })}
</details>
<div class="actions mt-15">${button(t('Enter facts myself'), () => ctx.focusAfterRender('field-profile-headline'))}</div>
${ctx.services.profileAi ? ctx.services.profileAi(ctx) : ''}
</section>
<div class="split"><section class="card"><div class="card-head"><div><h2>${t('My professional profile')}</h2><p class="card-sub">${t('Your starting point for a CV, job comparison and interview.')}</p></div></div>
<div class="fields">
${field(ctx, t('Name for your CV'), 'profile.name', { optional: true, placeholder: t('Your name or a display name'), hint: t('Your name is omitted from AI prompts.') })}
${field(ctx, t('Role or kind of work'), 'profile.headline', { placeholder: t('e.g. Data analyst or operations coordinator') })}
${field(ctx, t('City or region'), 'profile.city', { optional: true, placeholder: t('e.g. Den Haag') })}
${field(ctx, t('Availability'), 'profile.availability', { optional: true, placeholder: t('e.g. 32 hours per week') })}
${field(ctx, t('What you bring'), 'profile.about', { area: true, full: true, placeholder: t('What work do you enjoy? What problems have you helped solve?'), max: 8000 })}
${field(ctx, t('Work experience & projects'), 'profile.experience', { area: true, full: true, rows: 6, placeholder: t('Role, organisation, dates\nWhat you did, the tools you used, and a result you can support.') })}
${field(ctx, t('Skills with examples'), 'profile.skills', { area: true, full: true, placeholder: t('e.g. Excel: cleaned weekly order records and checked duplicates.') })}
${field(ctx, t('Education & training'), 'profile.education', { area: true, full: true, placeholder: t('Original qualification name, institution and year. Include relevant courses.') })}
${profileDetails(ctx, 'education')}
${field(ctx, t('Languages'), 'profile.languages', { area: true, full: true, placeholder: t('e.g. Arabic: fluent; English: B2 (self-assessed); Dutch: A2 (self-assessed)'), max: 2000 })}
${profileDetails(ctx, 'languages')}
<details class="details field full" ?open=${Boolean(p.travel || p.targetRoles.some(Boolean) || Object.values(p.workPreferences).some(Boolean))}>
<summary>${t('Optional: target roles and work preferences')}</summary>
${field(ctx, t('Travel preference'), 'profile.travel', { optional: true, full: true, placeholder: t('e.g. Hybrid; up to 45 minutes each way') })}
${ctx.services.profileExtras ? ctx.services.profileExtras(ctx, 'preferences') : ''}
</details>
<div class="field full">${aiButton(ctx, 'profile')}</div>
</div>
<div class="form-footer"><span class="muted small">${t('Only you decide what belongs in your story.')}</span>${goButton(ctx, html`${t('Next: add a job advert')} ${icon('arrow', 16)}`, 'jobs', '')}</div></section>
<aside class="grid"><section class="card soft"><p class="eyebrow">${t('Make your experience visible')}</p><h3 class="mt-11">${t('Specific beats impressive.')}</h3><ul class="tip-list"><li>${t('Describe an action you took.')}</li><li>${t('Name tools only when you used them.')}</li><li>${t('Use numbers when you can support them.')}</li><li>${t('Include volunteering, study and personal projects if relevant.')}</li></ul></section>
<section class="card"><h3>${t('Your starting point is valid.')}</h3><p class="card-sub">${t('Keep original qualification names. Do not assume a Dutch diploma equivalence or a language level.')}</p><p class="card-sub">${t('A gap in this profile means you have not recorded evidence yet. It is not a judgment about your potential.')}</p></section>
${ctx.services.knowledgeFor ? ctx.services.knowledgeFor(ctx, 'profile') : ''}</aside></div>`;
}

/** Optional rows complement existing prose; opening this section never converts or deletes facts.
 * @param {import('../app-context.js').Ctx} ctx
 * @param {'education' | 'languages'} subject
 */
function profileDetails(ctx, subject) {
  if (!ctx.services.profileExtras) return '';
  const { t, state } = ctx;
  const rows = subject === 'education' ? state.profile.educationRows : state.profile.languageRows;
  return html`<details class="details field full" id="profile-${subject}-details" ?open=${rows.length > 0}>
<summary>${subject === 'education' ? t('Add education details') : t('Add language levels')} · ${t('{n} recorded', { n: rows.length })}</summary>
<p class="field-hint">${t('Optional details. You do not need to repeat facts already written above.')}</p>
${rows.length && state.profile[subject].trim() ? html`<p class="source-note">${t('Your CV combines the text and details. Check for repeated or conflicting wording before exporting.')}</p>` : ''}
${ctx.services.profileExtras(ctx, subject)}
</details>`;
}
