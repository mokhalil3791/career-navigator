// @ts-check
/**
 * Profile, CV and plan additions:
 *  - target roles (up to 3) and work preferences (FR-PRO-1)
 *  - CV import from PDF/DOCX/TXT into "Paste an existing CV" only (FR-PRO-2)
 *  - languages as rows with CEFR level and self-assessed/certified (FR-PRO-4)
 *  - education rows with original title, country, year and IDW evaluation (FR-PRO-5)
 *  - DOCX export (FR-CV-3), milestone dates + .ics (FR-PLAN-3), weekly check-in (FR-PLAN-2)
 *  - interview question packs (FR-INT-3)
 */
import { html, nothing } from 'lit-html';
import { live } from 'lit-html/directives/live.js';
import { button, field } from '../../components/ui.js';
import { icon } from '../../components/icon.js';
import { CEFR_LEVELS } from '../../core/schema.js';
import { buildCvDocx } from '../../core/exports/docx.js';
import { buildICS, planItems } from '../../core/exports/ics.js';
import { checkinItems } from '../../core/applications.js';
import { extractCvText } from '../../core/import/cv-text.js';
import { isoDate } from '../../content/knowledge.js';
import { uid } from '../../lib/uid.js';

/** @param {any} app */
export function profilePlusModule(app) {
  const s = app.services;

  s.profileExtras = (/** @type {any} */ ctx, /** @type {'preferences' | 'languages' | 'education'} */ section) => {
    const { t, state } = ctx;
    const p = state.profile;
    const rowEdit = (/** @type {string} */ path, /** @type {string} */ id, /** @type {string} */ key) => (/** @type {Event} */ e) => ctx.dispatch({ type: 'editRow', path, id, key, value: /** @type {HTMLInputElement} */ (e.target).value });
    if (section === 'preferences') return html`<fieldset class="field full subform"><legend>${t('Target roles (up to 3)')}</legend><div class="fields">${[0, 1, 2].map((i) => html`<div class="field"><label for="target-${i}">${t('Target role {n}', { n: i + 1 })}</label><input id="target-${i}" maxlength="200" .value=${live(p.targetRoles[i] || '')} @input=${(/** @type {Event} */ e) => { const roles = [0, 1, 2].map((k) => (k === i ? /** @type {HTMLInputElement} */ (e.target).value : p.targetRoles[k] || '')); while (roles.length && !roles[roles.length - 1]) roles.pop(); ctx.update('profile.targetRoles', roles); }}></div>`)}</div></fieldset>
<fieldset class="field full subform"><legend>${t('Work preferences')}</legend><div class="fields">${field(ctx, t('Hours per week'), 'profile.workPreferences.hours', { placeholder: t('e.g. 32–40'), max: 80 })}<div class="field"><label for="pref-hybrid">${t('Way of working')}</label><select id="pref-hybrid" @change=${(/** @type {Event} */ e) => ctx.update('profile.workPreferences.hybrid', /** @type {HTMLSelectElement} */ (e.target).value)}>${[['', t('No preference recorded')], ['onsite', t('On site')], ['hybrid', t('Hybrid')], ['remote', t('Remote')], ['any', t('Any')]].map(([v, l]) => html`<option value=${v} ?selected=${p.workPreferences.hybrid === v}>${l}</option>`)}</select></div>${field(ctx, t('Region'), 'profile.workPreferences.region', { placeholder: t('e.g. Utrecht and surroundings'), max: 200 })}</div></fieldset>`;
    if (section === 'languages') return html`<fieldset class="field full subform"><legend>${t('Language levels')}</legend><p class="field-hint">${t('Write a level only if you can show it. Say whether it is certified (for example Staatsexamen NT2) or self-assessed.')}</p>
${p.languageRows.map((r) => html`<div class="row-grid"><div class="field"><label for="lang-${r.id}">${t('Language')}</label><input id="lang-${r.id}" maxlength="80" .value=${live(r.language)} @input=${rowEdit('profile.languageRows', r.id, 'language')}></div><div class="field"><label for="level-${r.id}">${t('Level (CEFR)')}</label><select id="level-${r.id}" @change=${rowEdit('profile.languageRows', r.id, 'level')}><option value="" ?selected=${!r.level}>${t('Not stated')}</option>${CEFR_LEVELS.map((l) => html`<option value=${l} ?selected=${r.level === l}>${l === 'native' ? t('Native') : l}</option>`)}</select></div><div class="field"><label for="basis-${r.id}">${t('Basis')}</label><select id="basis-${r.id}" @change=${rowEdit('profile.languageRows', r.id, 'basis')}>${[['', t('Not stated')], ['self', t('Self-assessed')], ['certified', t('Certified')]].map(([v, l]) => html`<option value=${v} ?selected=${r.basis === v}>${l}</option>`)}</select></div>${r.basis === 'certified' ? html`<div class="field"><label for="cert-${r.id}">${t('Certificate')}</label><input id="cert-${r.id}" maxlength="200" placeholder=${t('e.g. Staatsexamen NT2 programme I')} .value=${live(r.certificate)} @input=${rowEdit('profile.languageRows', r.id, 'certificate')}></div>` : nothing}${button(t('Remove'), () => ctx.dispatch({ type: 'removeRow', path: 'profile.languageRows', id: r.id }), { style: 'ghost small', label: t('Remove language {name}', { name: r.language || '' }) })}</div>`)}
${button(html`${icon('plus', 16)}${t('Add a language')}`, () => { const id = uid('lang'); if (ctx.dispatch({ type: 'addRow', path: 'profile.languageRows', row: { id, language: '', level: '', basis: '', certificate: '' } })) ctx.focusAfterRender('lang-' + id); }, { style: 'secondary small' })}</fieldset>`;
    return html`<fieldset class="field full subform"><legend>${t('Education (original titles)')}</legend><p class="field-hint">${t('Keep the original title. A credential evaluation (IDW) compares it with the Dutch system.')} <a href="https://www.idw.nl/en/" target="_blank" rel="noopener noreferrer">IDW ↗</a></p>
${p.educationRows.map((r) => html`<div class="row-grid">${[['title', t('Original title'), 300], ['institution', t('Institution'), 300], ['country', t('Country'), 100], ['year', t('Year'), 20]].map(([key, label, max]) => html`<div class="field"><label for="edu-${key}-${r.id}">${label}</label><input id="edu-${key}-${r.id}" maxlength=${max} .value=${live(r[key])} @input=${rowEdit('profile.educationRows', r.id, /** @type {string} */ (key))}></div>`)}<div class="field"><label for="edu-idw-${r.id}">${t('IDW evaluation')}</label><select id="edu-idw-${r.id}" @change=${rowEdit('profile.educationRows', r.id, 'idw')}>${[['', t('Not recorded')], ['no', t('No')], ['applied', t('Applied')], ['yes', t('Yes')]].map(([v, l]) => html`<option value=${v} ?selected=${r.idw === v}>${l}</option>`)}</select></div>${button(t('Remove'), () => ctx.dispatch({ type: 'removeRow', path: 'profile.educationRows', id: r.id }), { style: 'ghost small' })}</div>`)}
${button(html`${icon('plus', 16)}${t('Add education')}`, () => { const id = uid('edu'); if (ctx.dispatch({ type: 'addRow', path: 'profile.educationRows', row: { id, title: '', institution: '', country: '', year: '', idw: '' } })) ctx.focusAfterRender('edu-title-' + id); }, { style: 'secondary small' })}</fieldset>`;
  };

  s.cvImport = (/** @type {any} */ ctx) => {
    const { t } = ctx;
    const onFile = async (/** @type {Event} */ e) => {
      const input = /** @type {HTMLInputElement} */ (e.target);
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      ctx.notify(t('Reading {name} on this device…', { name: file.name }));
      try {
        const text = await extractCvText(file);
        const current = ctx.state.profile.cvText.trim();
        if (current && !ctx.confirm(t('Replace the text in “Paste an existing CV” with the text from this file?'))) return;
        if (ctx.update('profile.cvText', text)) ctx.notify(t('CV text added below. It is only source text: check it, then copy facts into your profile fields yourself or use “Suggest structured fields”.'));
      } catch (error) { ctx.notify(t(/** @type {Error} */ (error).message), true); }
    };
    return html`<div class="field full"><label for="cv-file">${t('Import my CV from a file')}<span class="optional">${t('PDF, DOCX or TXT')}</span></label><input id="cv-file" type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" @change=${onFile}><span class="field-hint">${t('The text is read in your browser only. Nothing is uploaded. It goes into “Paste an existing CV”, not into your profile fields.')}</span></div>`;
  };

  s.docxButton = (/** @type {any} */ ctx) => button(html`${icon('download', 16)}${ctx.t('Download Word (DOCX)')}`, () => {
    try {
      const bytes = buildCvDocx(ctx.state);
      ctx.download(ctx.state.demo ? 'fictional-example-cv.docx' : 'my-career-cv.docx', new Blob([/** @type {BlobPart} */ (bytes)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      ctx.ui.cvDownloaded = true; ctx.rerender();
      ctx.notify(ctx.t('Word file downloaded. It opens in Word, LibreOffice and Google Docs.'));
    } catch (error) { ctx.notify(ctx.t(/** @type {Error} */ (error).message), true); }
  }, { style: '', disabled: !ctx.state.cv.reviewed, testid: 'export-docx' });

  s.milestoneDate = (/** @type {any} */ ctx, /** @type {string} */ key) => html`<label for="date-${key}">${ctx.t('Target date')}</label><input id="date-${key}" type="date" .value=${live(ctx.state.plan.milestoneDates[key])} @input=${(/** @type {Event} */ e) => ctx.update('plan.milestoneDates.' + key, /** @type {HTMLInputElement} */ (e.target).value)}>`;

  s.icsButton = (/** @type {any} */ ctx) => button(html`${icon('calendar', 16)}${ctx.t('Add to my calendar (.ics)')}`, () => {
    const items = planItems(ctx.state.plan);
    if (!items.length) { ctx.notify(ctx.t('Add a start date for your next action, or a target date for a milestone, first.'), true); return; }
    ctx.download('career-navigator-plan.ics', buildICS(items, { calendarName: ctx.t('My 90-day plan') }), 'text/calendar;charset=utf-8');
    ctx.notify(ctx.t('Calendar file downloaded. Open it to add the dates to your calendar.'));
  }, { style: 'secondary small', testid: 'plan-ics' });

  s.checkin = (/** @type {any} */ ctx) => {
    const { t, state, ui } = ctx;
    const items = checkinItems(state.plan);
    const draft = ui.checkin || (ui.checkin = { done: [], blocker: '', nextAction: '' });
    const save = () => {
      const row = { id: uid('checkin'), date: isoDate(), done: draft.done.slice(0, 10), blocker: draft.blocker.slice(0, 2000), nextAction: draft.nextAction.slice(0, 2000) };
      if (!ctx.dispatch({ type: 'addRow', path: 'plan.checkins', row })) return;
      if (draft.nextAction.trim()) ctx.update('plan.nextAction', draft.nextAction.trim());
      ui.checkin = { done: [], blocker: '', nextAction: '' };
      ctx.notify(t('Check-in saved. Small steps count.'));
    };
    const last = state.plan.checkins.slice(-3).reverse();
    return html`<section class="card section-space"><h2>${t('Weekly check-in')}</h2><p class="card-sub">${t('Once a week: tick what you did, name one thing that blocked you, and adjust your next action.')}</p>
${items.length ? html`<fieldset class="route-picker mt-15"><legend>${t('What did I do this week?')}</legend>${items.map((i) => html`<label class="check-row"><input type="checkbox" .checked=${draft.done.includes(i.id)} @change=${(/** @type {Event} */ e) => { const on = /** @type {HTMLInputElement} */ (e.target).checked; draft.done = on ? [...draft.done, i.id] : draft.done.filter((/** @type {string} */ d) => d !== i.id); }}><span>${i.label.slice(0, 160)}</span></label>`)}</fieldset>` : html`<p class="field-hint">${t('Add priorities and a next action above to tick them off here.')}</p>`}
<div class="fields mt-15"><div class="field"><label for="checkin-blocker">${t('One blocker')}</label><input id="checkin-blocker" maxlength="2000" placeholder=${t('e.g. No time on weekdays')} .value=${live(draft.blocker)} @input=${(/** @type {Event} */ e) => { draft.blocker = /** @type {HTMLInputElement} */ (e.target).value; }}></div><div class="field"><label for="checkin-next">${t('My next action (adjusted)')}</label><input id="checkin-next" maxlength="2000" .value=${live(draft.nextAction)} @input=${(/** @type {Event} */ e) => { draft.nextAction = /** @type {HTMLInputElement} */ (e.target).value; }}></div></div>
<div class="actions mt-10">${button(t('Save this check-in'), save, { style: '', testid: 'save-checkin' })}</div>
${last.length ? html`<ul class="tip-list mt-15">${last.map((c) => html`<li><strong>${c.date}</strong>: ${t('{n} done', { n: c.done.length })}${c.blocker ? ' · ' + t('blocker: {text}', { text: c.blocker }) : ''}</li>`)}</ul>` : nothing}</section>`;
  };

  s.packPicker = (/** @type {any} */ ctx) => {
    const packs = ctx.content.interviewPacks;
    if (packs.length < 2) return nothing;
    return html`<div class="field section-space pack-picker"><label for="question-pack">${ctx.t('Question set')}</label><select id="question-pack" @change=${(/** @type {Event} */ e) => { ctx.update('interview.packId', /** @type {HTMLSelectElement} */ (e.target).value); ctx.update('interview.questionIndex', 0); }}>${packs.map((/** @type {any} */ p) => html`<option value=${p.id} ?selected=${ctx.state.interview.packId === p.id}>${ctx.t(p.title)}</option>`)}</select></div>`;
  };
}
