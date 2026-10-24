// @ts-check
/**
 * Languages and onboarding.
 *  - Interface language switch (English first, Dutch second; NFR-I18N-1/2).
 *  - The CV and letter language is a separate setting (NFR-I18N-3).
 *  - "Simple language" hides longer helper text (NFR-A11Y-3).
 *  - A 3-step welcome: language → example or own → AI mode, with privacy
 *    explained in plain words before any data entry (FR-ONB-1, FR-ONB-2).
 */
import { html, nothing } from 'lit-html';
import { button } from '../../components/ui.js';
import { LANGUAGES } from '../../i18n/index.js';
import brand from '../../../config/brand.json';

/** @param {any} app */
export function i18nModule(app) {
  const s = app.services;

  s.languageSwitch = (/** @type {any} */ ctx, suffix = '') => html`<label class="visually-hidden" for=${'ui-language' + suffix}>${ctx.t('Interface language')}</label><select id=${'ui-language' + suffix} class="lang-select" @change=${(/** @type {Event} */ e) => ctx.update('settings.uiLanguage', /** @type {HTMLSelectElement} */ (e.target).value)}>${Object.entries(LANGUAGES).map(([code, l]) => html`<option value=${code} ?selected=${ctx.state.settings.uiLanguage === code} lang=${code}>${l.name}${l.machineTranslated ? ' *' : ''}</option>`)}</select>`;

  s.applicationLanguage = (/** @type {any} */ ctx) => {
    const { t, state } = ctx;
    return html`<div class="field mt-15"><label for="app-language">${t('Language of my CV and letter')}</label><select id="app-language" @change=${(/** @type {Event} */ e) => ctx.update('settings.applicationLanguage', /** @type {HTMLSelectElement} */ (e.target).value)}>${['English', 'Dutch'].map((l) => html`<option value=${l} ?selected=${state.settings.applicationLanguage === l}>${t(l)}</option>`)}</select><span class="field-hint">${t('This is separate from the interface language. AI prompts ask for CVs and letters in this language.')}</span></div>`;
  };

  s.welcome = (/** @type {any} */ ctx) => {
    const { t, state, ui } = ctx;
    if (state.settings.onboarded) return nothing;

    return html`<section class="card welcome section-space" aria-labelledby="welcome-title"><h2 id="welcome-title">${t('Welcome')}</h2>
<ul class="tip-list"><li>${t('Everything you write stays in this browser. There is no account and no analytics.')}</li><li>${t('Nothing is saved after you close the page, unless you switch on “Save on this device”.')}</li><li>${t('Nothing goes to an AI until you see the exact text and choose to send or copy it.')}</li></ul>
<p class="source-note"><a href="${brand.repoUrl}/blob/main/docs/PRIVACY.md" target="_blank" rel="noopener noreferrer">${t('Read the full privacy notice')}</a></p>
<div class="actions mt-15">${button(t('Start my own'), () => { ctx.update('settings.onboarded', true); ctx.go('profile'); }, { style: '' })}${button(t('Try the example'), () => s.loadDemo())}</div></section>`;
  };
}
