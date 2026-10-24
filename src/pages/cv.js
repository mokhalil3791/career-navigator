// @ts-check
/** My application: CV + letter with the review gate (FR-CV). Ported from v0.1 renderCV. */
import { html, nothing } from 'lit-html';
import { icon } from '../components/icon.js';
import { aiButton, button, field, goButton, pageHeading } from '../components/ui.js';
import { buildCVHTML } from '../core/exports/html.js';
import { CV_CONTENT_KEYS, estimatePages } from '../core/cv.js';

/** @param {import('../app-context.js').Ctx} ctx */
export function renderCV(ctx) {
  const { state, t } = ctx;
  const j = state.jobs.find((x) => x.id === state.selectedJobId) || state.jobs[0] || null;
  const hasDraft = CV_CONTENT_KEYS.some((k) => k !== 'letter' && state.cv[k].trim());
  const draftCv = () => {
    if (Object.entries(state.cv).some(([k, v]) => !['reviewed', 'letter', 'linkedin'].includes(k) && v) && !ctx.confirm(t('Replace the CV fields with your structured profile? Your motivation letter will be kept.'))) return;
    if (ctx.dispatch({ type: 'draftCv' })) { ctx.focusAfterRender('field-cv-headline'); ctx.notify(t('Profile facts copied into the CV. Edit and review them before downloading.')); }
  };
  const exportCv = () => {
    if (!CV_CONTENT_KEYS.some((k) => state.cv[k].trim())) { ctx.notify(t('Add some CV content before downloading.'), true); return; }
    ctx.download(state.demo ? 'fictional-example-cv.html' : 'my-career-cv.html', buildCVHTML(state));
    ctx.notify(t('CV downloaded. Open it in a browser to print or save as PDF.'));
  };
  const pages = estimatePages(state.cv);
  return html`${ctx.ui.ai?.page === 'cv' ? html`<div class="actions section-space">${button(t('Return to my CV draft'), () => ctx.focusAfterRender('field-cv-headline'), { style: '' })}</div>` : nothing}
${pageHeading(t('03 / Prepare with purpose'), t('An application you can stand behind.'), t('Start with the facts you recorded. Edit the wording and check each claim before you download.'))}
<div class="split journey-controls"><div class="grid">
${ctx.ui.tailorPanel ? ctx.ui.tailorPanel(ctx) : nothing}
<section class="card"><div class="card-head"><div><h2>${t('My CV draft')}</h2><p class="card-sub">${j ? t('Selected target: {title}', { title: j.title || t('Untitled advert') }) : t('You can create a general CV or select a target advert first.')}</p></div>${button(hasDraft ? t('Copy my profile into CV') : t('Create draft from my profile'), draftCv, { style: hasDraft ? 'secondary' : '' })}</div>
${ctx.services.applicationLanguage ? ctx.services.applicationLanguage(ctx) : nothing}
<div class="actions mt-15">${hasDraft && j?.body.trim() && ctx.services.tailorButton ? ctx.services.tailorButton(ctx) : nothing}${goButton(ctx, j ? t('Change or check my advert') : t('Add a target advert'), 'jobs', 'secondary')}</div>
${!hasDraft ? html`<p class="field-hint">${t('Create a draft from your recorded profile facts, or write directly in the fields below. Nothing is copied automatically.')}</p>` : !j?.body.trim() ? html`<p class="field-hint">${t('Add advert text to use tailoring, or edit and export a general CV here.')}</p>` : nothing}
<div class="fields mt-18">${field(ctx, t('Professional headline'), 'cv.headline', { full: true, max: 2000 })}${field(ctx, t('Profile summary'), 'cv.summary', { area: true, full: true, max: 20000 })}${field(ctx, t('Experience & projects'), 'cv.experience', { area: true, full: true, rows: 7, max: 20000, hint: t('Use reverse chronological order. Keep dates, job titles and results accurate.') })}${field(ctx, t('Education & training'), 'cv.education', { area: true, full: true, max: 20000 })}${field(ctx, t('Skills'), 'cv.skills', { area: true, full: true, max: 20000 })}${field(ctx, t('Languages'), 'cv.languages', { area: true, full: true, max: 20000 })}</div>
${pages > 2 ? html`<p class="evidence-warning mt-10" role="status">${t('This CV may be longer than two A4 pages (about {n} pages). Dutch employers usually expect one or two pages.', { n: pages })}</p>` : nothing}
<p class="source-note">${t('The werk.nl CV guide (UWV) lists name, address, email and phone as personal details, with no photo, date of birth, nationality or marital status. Career Navigator has no fields for them, so your downloads never include them.')}</p></section>
${state.cv.letter.trim() || ctx.ui.editLetter ? html`<section class="card"><div class="card-head"><div><h2>${t('Motivation letter')}</h2><p class="card-sub">${t('An optional short letter you can adapt to the selected role.')}</p></div>${aiButton(ctx, 'letter', t('Prepare a letter'))}</div>${field(ctx, t('Letter text'), 'cv.letter', { area: true, rows: 7, max: 20000, hint: t('Describe your interest in your own words. Check employer details, motivation and every achievement.') })}</section>` : nothing}
<section class="card" id="cv-review"><h2>${t('Review, then download')}</h2><p class="card-sub">${t('Your CV download uses your name from My profile and the text above. You can add private contact details after downloading.')}</p><ul class="tip-list"><li>${t('Every skill, qualification, date and result is something I can explain.')}</li><li>${t('I removed placeholder text and checked the selected employer.')}</li><li>${t('I read any AI wording carefully and made it my own.')}</li></ul>
<div class="actions mt-18">${button(ctx.ui.cvPreview ? t('Hide preview') : t('Preview CV text'), () => { ctx.ui.cvPreview = !ctx.ui.cvPreview; ctx.rerender(); }, { style: 'secondary' })}</div>
${ctx.ui.cvPreview ? renderCVPreview(ctx) : nothing}
<div class="review-box mt-20"><label class="check-row"><input id="cv-reviewed" type="checkbox" .checked=${state.cv.reviewed} @change=${(/** @type {Event} */ e) => ctx.dispatch({ type: 'setReviewed', value: /** @type {HTMLInputElement} */ (e.target).checked })}><span>${t('I have checked these CV and letter claims.')}<small>${t('Editing your profile or application makes a new review necessary.')}</small></span></label></div>
<p class="review-status" id="review-status">${state.cv.reviewed ? t('Reviewed by you. Ready to download.') : t('Needs your review before downloading a CV.')}</p>
<div class="actions mt-18">${button(html`${icon('download', 16)}${t('Download HTML')}`, exportCv, { style: '', disabled: !state.cv.reviewed, testid: 'export-cv' })}${ctx.services.docxButton ? ctx.services.docxButton(ctx) : nothing}</div>
<p class="source-note">${t('Downloads an editable, printable HTML document. Open it in a browser, then use Print → Save as PDF. Review the page breaks before sharing.')}</p></section>
<details class="details" id="cv-optional-letter" ?open=${!!ctx.ui.editLetter}><summary>${t('Optional motivation letter')}</summary><p class="field-hint">${t('A letter is included in both downloads. When you add one, its text appears above the review checklist.')}</p>${button(t('Add or edit my letter'), () => { ctx.ui.editLetter = true; ctx.focusAfterRender('field-cv-letter'); ctx.rerender(); })}</details>
${ctx.services.linkedinCard ? html`<details class="details" ?open=${Object.values(state.cv.linkedin || {}).some(Boolean)}><summary>${t('Optional LinkedIn sections')}</summary>${ctx.services.linkedinCard(ctx)}</details>` : nothing}
<details class="details"><summary>${t('Other prompt tools')}</summary>${aiButton(ctx, 'tailor', t('Tailor with AI'))}</details></div>
<aside class="grid"><section class="card soft"><p class="eyebrow">${t('Truthful by design')}</p><h3 class="mt-10">${t('Your profile is the source.')}</h3><p class="card-sub">${t('“Copy my profile into CV” copies the structured fields you wrote. It does not invent achievements or interpret your pasted CV.')}</p><p class="card-sub">${t('AI can help with language and structure. Every AI suggestion is shown as a change you accept or reject; you review it yourself.')}</p></section>
<section class="card"><h3>${t('Ready to practise?')}</h3><p class="card-sub">${t('Turn one example from this CV into a clear interview answer.')}</p><div class="mt-15">${goButton(ctx, t('Practise an interview'), 'interview', 'secondary small')}</div></section>
${ctx.services.knowledgeFor ? ctx.services.knowledgeFor(ctx, 'cv') : nothing}</aside></div>`;
}

/** @param {import('../app-context.js').Ctx} ctx */
function renderCVPreview(ctx) {
  const { state, t } = ctx;
  const sections = [[t('Profile'), 'summary'], [t('Experience'), 'experience'], [t('Education'), 'education'], [t('Skills'), 'skills'], [t('Languages'), 'languages']].filter((x) => state.cv[x[1]]);
  return html`<section class="preview-sheet" aria-label=${t('CV text preview')}>${state.demo ? html`<p class="pill sand">${t('Fictional example')}</p>` : nothing}<h2>${state.profile.name || t('Your name')}</h2><p class="cv-headline">${state.cv.headline}</p>${sections.map((x) => html`<h3>${x[0]}</h3><p>${state.cv[x[1]]}</p>`)}</section>`;
}
