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

  s.languageSwitch = (/** @type {any} */ ctx) => html`<label class="visually-hidden" for="ui-language">${ctx.t('Interface language')}</label><select id="ui-language" class="lang-select" @change=${(/** @type {Event} */ e) => ctx.update('settings.uiLanguage', /** @type {HTMLSelectElement} */ (e.target).value)}>${Object.entries(LANGUAGES).map(([code, l]) => html`<option value=${code} ?selected=${ctx.state.settings.uiLanguage === code} lang=${code}>${l.name}${l.machineTranslated ? ' *' : ''}</option>`)}</select>`;

  s.applicationLanguage = (/** @type {any} */ ctx) => {
    const { t, state } = ctx;
    return html`<div class="field mt-15"><label for="app-language">${t('Language of my CV and letter')}</label><select id="app-language" @change=${(/** @type {Event} */ e) => ctx.update('settings.applicationLanguage', /** @type {HTMLSelectElement} */ (e.target).value)}>${['English', 'Dutch'].map((l) => html`<option value=${l} ?selected=${state.settings.applicationLanguage === l}>${t(l)}</option>`)}</select><span class="field-hint">${t('This is separate from the interface language. AI prompts ask for CVs and letters in this language.')}</span></div>`;
  };

  s.welcome = (/** @type {any} */ ctx) => {
    const { t, state, ui } = ctx;
    if (state.settings.onboarded) return nothing;
    const step = ui.welcomeStep || 1;
    const go = (/** @type {number} */ n) => { ui.welcomeStep = n; ctx.focusAfterRender('welcome-title'); ctx.rerender(); };
    const finish = () => { ctx.update('settings.onboarded', true); ui.welcomeStep = 1; ctx.focusAfterRender('h1'); };
    const lang = state.settings.uiLanguage;
    const steps = [t('Language'), t('Example or my own'), t('AI help')];
    return html`<section class="card welcome section-space" aria-labelledby="welcome-title"><ol class="welcome-steps" aria-label=${t('Welcome steps')}>${steps.map((label, i) => html`<li aria-current=${step === i + 1 ? 'step' : nothing} class=${step > i + 1 ? 'done' : ''}>${i + 1}. ${label}</li>`)}</ol>
<p class="field-hint">${t('Workshop tools: AI prompt studio is in the main navigation. Find My 90-day plan under More tools.')}</p>
${step === 1 ? html`<h2 id="welcome-title" tabindex="-1">${t('Welcome. Which language do you prefer?')}</h2>
<fieldset class="route-picker mt-15"><legend>${t('Interface language')}</legend>${Object.entries(LANGUAGES).map(([code, l]) => html`<label class="check-row"><input type="radio" name="welcome-lang" value=${code} .checked=${lang === code} @change=${() => ctx.update('settings.uiLanguage', code)}><span lang=${code}><strong>${l.name}</strong>${l.machineTranslated ? html`<small>${t('Machine-assisted translation, not yet reviewed by a fluent speaker.')}</small>` : nothing}</span></label>`)}</fieldset>
<label class="check-row mt-15"><input type="checkbox" .checked=${state.settings.simpleLanguage} @change=${(/** @type {Event} */ e) => ctx.update('settings.simpleLanguage', /** @type {HTMLInputElement} */ (e.target).checked)}><span>${t('Simple language: show less helper text')}</span></label>
<div class="privacy-note mt-15"><h3>${t('Your privacy, in plain words')}</h3><ul class="tip-list"><li>${t('Everything you write stays in this browser. There is no account and no analytics.')}</li><li>${t('Nothing is saved after you close the page, unless you switch on “Save on this device”.')}</li><li>${t('Nothing goes to an AI until you see the exact text and choose to send or copy it.')}</li><li>${t('Never enter your BSN, passport, residence permit or health details. The app does not ask for them.')}</li></ul><p class="source-note"><a href="${brand.repoUrl}/blob/main/docs/PRIVACY.md" target="_blank" rel="noopener noreferrer">${t('Read the full privacy notice')}</a></p></div>
<div class="actions mt-15">${button(t('Next'), () => go(2), { style: '' })}${button(t('Skip the welcome'), finish, { style: 'ghost small' })}</div>` : nothing}
${step === 2 ? html`<h2 id="welcome-title" tabindex="-1">${t('Try the example first, or start with your own story?')}</h2><div class="grid two mt-15"><button type="button" class="step-card" @click=${() => { s.loadDemo(); }}><h3>${t('Try the fictional example')}</h3><p>${t('Explore with Sam, an invented person, and three invented adverts. Nothing here is real.')}</p></button><button type="button" class="step-card" @click=${() => go(3)}><h3>${t('Start my own')}</h3><p>${t('Begin with an empty workspace and your own facts.')}</p></button></div><div class="actions mt-15">${button(t('Back'), () => go(1), { style: 'ghost small' })}</div>` : nothing}
${step === 3 ? html`<h2 id="welcome-title" tabindex="-1">${t('How would you like AI to help?')}</h2>
<fieldset class="route-picker mt-15"><legend>${t('AI help')}</legend>${[['none', t('No AI'), t('Use the workspace on its own. You can change this later.')], ['copy', t('Copy-paste (recommended to start)'), t('The app prepares a prompt; you paste it into any free AI chat and bring the answer back.')], ['builtin', t('Built-in free AI'), t('Connect a free Gemini or OpenRouter key, Ollama, or an in-browser model in the AI prompt studio.')]].map(([value, label, help]) => html`<label class="check-row"><input type="radio" name="welcome-ai" value=${value} .checked=${state.settings.aiMode === value} @change=${() => ctx.update('settings.aiMode', value)}><span><strong>${label}</strong><small>${help}</small></span></label>`)}</fieldset>
<div class="actions mt-15">${button(t('Back'), () => go(2), { style: 'ghost small' })}${button(t('Start'), () => { finish(); ctx.go(state.settings.aiMode === 'builtin' ? 'prompts' : 'profile'); }, { style: '' })}</div>` : nothing}
</section>`;
  };
}
