import { journeyHeading } from '../components/journey.js';
// @ts-check
/** My application: CV + letter with the review gate (FR-CV). Ported from v0.1 renderCV. */
import { html, nothing } from 'lit-html';
import { icon } from '../components/icon.js';
import { navigateTabs, aiButton, button, field, goButton, pageHeading } from '../components/ui.js';
import { buildCVHTML } from '../core/exports/html.js';
import { CV_CONTENT_KEYS, estimatePages } from '../core/cv.js';

/** @param {import('../app-context.js').Ctx} ctx */
export function renderCV(ctx) {
  const { state, t } = ctx;
  const tab = ctx.ui.cvTab || 'cv';
  const j = state.jobs.find((x) => x.id === state.selectedJobId) || state.jobs[0] || null;
  const hasDraft = CV_CONTENT_KEYS.some((k) => k !== 'letter' && state.cv[k].trim());
  const draftCv = () => {
    if (Object.entries(state.cv).some(([k, v]) => !['reviewed', 'letter', 'linkedin', 'autoDrafted'].includes(k) && v) && !ctx.confirm(t('Replace the CV fields with your structured profile? Your motivation letter will be kept.'))) return;
    if (ctx.dispatch({ type: 'draftCv' })) { ctx.focusAfterRender('field-cv-headline'); ctx.notify(t('Profile facts copied into the CV. Edit and review them before downloading.')); }
  };
  const exportCv = () => {
    if (!CV_CONTENT_KEYS.some((k) => state.cv[k].trim())) { ctx.notify(t('Add some CV content before downloading.'), true); return; }
    ctx.download(state.demo ? 'fictional-example-cv.html' : 'my-career-cv.html', buildCVHTML(state));
    ctx.ui.cvDownloaded = true; ctx.rerender();
    ctx.notify(t('CV downloaded. Open it in a browser to print or save as PDF.'));
  };
  const pages = estimatePages(state.cv);
  return html`${ctx.ui.ai?.page === 'cv' ? html`<div class="actions section-space">${button(t('Return to my CV draft'), () => ctx.focusAfterRender('field-cv-headline'), { style: '' })}</div>` : nothing}
${journeyHeading(ctx, 'cv', 'Check every line before you download.')}
${ctx.ui.firstDraft ? html`<section class="banner first-draft" role="status"><p>${t('We made a first draft from your story. Check every line before you download.')}</p>${button(t('Undo: start from empty'), () => { if (ctx.confirm(t('Clear this draft? Your profile facts will stay.'))) { ctx.ui.firstDraft = false; ctx.dispatch({ type: 'startEmptyCv' }); } })}</section>` : nothing}
<div class="tabs" role="tablist" @keydown=${navigateTabs} aria-label=${t('Application sections')}>${[['cv', t('CV')], ['letter', t('Letter')], ['linkedin', t('LinkedIn')]].map(([id, label]) => html`<button type="button" role="tab" aria-selected=${tab === id ? 'true' : 'false'} @click=${() => { ctx.ui.cvTab = id; ctx.rerender(); if (id === 'letter') ctx.focusAfterRender('field-cv-letter'); }}>${label}</button>`)}</div>
<div class="split journey-controls"><div class="grid">
${ctx.ui.tailorPanel ? ctx.ui.tailorPanel(ctx) : nothing}
<section class="card" ?hidden=${tab !== 'cv'}><div class="card-head"><div><h2>${t('My CV draft')}</h2><p class="card-sub">${j ? t('Tailoring for: {title}', { title: j.title || t('Untitled advert') }) : t('You can create a general CV or select a target advert first.')}</p></div>${button(hasDraft ? t('Copy my profile into CV') : t('Create draft from my profile'), draftCv, { style: hasDraft ? 'secondary' : '' })}</div>
${button(t('Start from empty'), () => { if (ctx.confirm(t('Clear this draft? Your profile facts will stay.'))) { ctx.ui.firstDraft = false; ctx.dispatch({ type: 'startEmptyCv' }); } })}
${ctx.services.applicationLanguage ? ctx.services.applicationLanguage(ctx) : nothing}
<div class="actions mt-15">${goButton(ctx, j ? t('Change or check my advert') : t('Add a target advert'), 'jobs', 'secondary')}</div>
${!hasDraft ? html`<p class="field-hint">${t('Write your CV below, or copy your recorded profile facts.')}</p>` : !j?.body.trim() ? html`<p class="field-hint">${t('Add advert text to use tailoring, or edit and export a general CV here.')}</p>` : nothing}
<div class="fields mt-18">${field(ctx, t('Professional headline'), 'cv.headline', { full: true, max: 2000 })}${field(ctx, t('Profile summary'), 'cv.summary', { area: true, full: true, max: 20000 })}${field(ctx, t('Experience & projects'), 'cv.experience', { area: true, full: true, rows: 7, max: 20000, hint: t('Use reverse chronological order. Keep dates, job titles and results accurate.') })}${field(ctx, t('Education & training'), 'cv.education', { area: true, full: true, max: 20000 })}${field(ctx, t('Skills'), 'cv.skills', { area: true, full: true, max: 20000 })}${field(ctx, t('Languages'), 'cv.languages', { area: true, full: true, max: 20000 })}</div>
${pages > 2 ? html`<p class="evidence-warning mt-10" role="status">${t('This CV may be longer than two A4 pages (about {n} pages). Dutch employers usually expect one or two pages.', { n: pages })}</p>` : nothing}
<p class="source-note">${t('The werk.nl CV guide (UWV) lists name, address, email and phone as personal details, with no photo, date of birth, nationality or marital status. Career Navigator has no fields for them, so your downloads never include them.')}</p></section>
${tab === 'letter' ? html`<section class="card"><div class="card-head"><div><h2>${t('Motivation letter')}</h2><p class="card-sub">${t('An optional short letter you can adapt to the selected role.')}</p></div></div>${field(ctx, t('Letter text'), 'cv.letter', { area: true, rows: 7, max: 20000, hint: t('Describe your interest in your own words. Check employer details, motivation and every achievement.') })}</section>` : nothing}
<section class="card" id="cv-review" ?hidden=${tab !== 'cv'}>${state.cv.letter.trim() ? html`<h2>${t('Letter included in your download')}</h2><pre class="original-text">${state.cv.letter}</pre>` : nothing}<h2>${t('Ready to download?')}</h2><p class="card-sub">${t('Your CV download uses your name from My profile and the text above. You can add private contact details after downloading.')}</p><ul class="tip-list"><li>${t('Every skill, qualification, date and result is something I can explain.')}</li><li>${t('I removed placeholder text and checked the selected employer.')}</li><li>${t('I read any AI wording carefully and made it my own.')}</li></ul>
<div class="actions mt-18">${button(ctx.ui.cvPreview ? t('Hide preview') : t('Preview CV text'), () => { ctx.ui.cvPreview = !ctx.ui.cvPreview; ctx.rerender(); }, { style: 'secondary' })}</div>
${ctx.ui.cvPreview ? renderCVPreview(ctx) : nothing}
<div class="review-box mt-20"><label class="check-row"><input id="cv-reviewed" type="checkbox" .checked=${state.cv.reviewed} @change=${(/** @type {Event} */ e) => ctx.dispatch({ type: 'setReviewed', value: /** @type {HTMLInputElement} */ (e.target).checked })}><span>${t('I have checked these CV and letter claims.')}<small>${t('Editing your profile or application makes a new review necessary.')}</small></span></label></div>
<p class="review-status" id="review-status">${state.cv.reviewed ? t('Reviewed by you. Ready to download.') : t('Needs your review before downloading a CV.')}</p>
<div class="actions mt-18">${ctx.services.docxButton ? ctx.services.docxButton(ctx) : nothing}${button(html`${icon('download', 16)}${t('Download HTML')}`, exportCv, { style: '', disabled: !state.cv.reviewed, testid: 'export-cv' })}</div>
<p class="source-note">${t('Downloads an editable, printable HTML document. Open it in a browser, then use Print → Save as PDF. Review the page breaks before sharing.')}</p>${ctx.ui.cvDownloaded && state.cv.reviewed ? html`<div class="success-moment" role="status"><p>${t('Well done. You have a CV you checked yourself.')}</p><div class="actions">${goButton(ctx, t('Next: practise an interview'), 'interview')}${goButton(ctx, t('Plan your next 90 days'), 'plan')}</div></div>` : nothing}</section>
${tab === 'linkedin' && ctx.services.linkedinCard ? ctx.services.linkedinCard(ctx) : nothing}</div>
<aside class="grid">${ctx.services.knowledgeFor ? ctx.services.knowledgeFor(ctx, 'cv') : nothing}</aside></div>`;
}

/** @param {import('../app-context.js').Ctx} ctx */
function renderCVPreview(ctx) {
  const { state, t } = ctx;
  const sections = [[t('Profile'), 'summary'], [t('Experience'), 'experience'], [t('Education'), 'education'], [t('Skills'), 'skills'], [t('Languages'), 'languages']].filter((x) => state.cv[x[1]]);
  return html`<section class="preview-sheet" aria-label=${t('CV text preview')}>${state.demo ? html`<p class="pill sand">${t('Fictional example')}</p>` : nothing}<h2>${state.profile.name || t('Your name')}</h2><p class="cv-headline">${state.cv.headline}</p>${sections.map((x) => html`<h3>${x[0]}</h3><p>${state.cv[x[1]]}</p>`)}</section>`;
}
