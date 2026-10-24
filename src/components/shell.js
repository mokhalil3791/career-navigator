// @ts-check
/** App frame: sidebar, top bar, demo banner, privacy drawer, footer. Ported from v0.1 render(). */
import { html, nothing } from 'lit-html';
import { icon } from './icon.js';
import { button } from './ui.js';
import { JOURNEY, stepIndex, stepper, journeyFooter } from './journey.js';
import brand from '../../config/brand.json';

/**
 * Fixed by code (FR-FORK table: "Footer independence notice is fixed").
 * A fork can change config/brand.json but not this sentence; guardrail G10 checks it.
 */
export const INDEPENDENCE_NOTICE = 'Independent tool. No employer or partner endorsement implied.';

/**
 * @param {import('../app-context.js').Ctx} ctx
 * @param {{ id: string, label: string, icon: string }[]} nav
 * @param {string} view
 * @param {unknown} page
 */
export function shell(ctx, nav, view, page) {
  const { state, t } = ctx;
  const current = nav.find((n) => n.id === view) || nav[0];
  const primaryIds = ['home', 'profile', 'jobs', 'cv', 'interview', 'prompts', 'settings'];
  const primary = primaryIds.map(id => nav.find(n => n.id === id)).filter(n => n !== undefined);
  const currentStep = stepIndex(view);
  const navButton = (/** @type {{ id: string, label: string, icon: string }} */ n) => html`<button type="button" class="nav-button" data-route=${n.id} aria-current=${(view === n.id || n.id === 'interview' && currentStep === 3) ? 'page' : nothing} @click=${() => { document.querySelector('.nav-sheet')?.removeAttribute('open'); ctx.go(n.id); }}>${icon(n.icon, 18)}<span>${stepIndex(n.id) >= 0 ? String(stepIndex(n.id) + 1) + '. ' : ''}${t(n.label)}</span></button>`;
  const status = ctx.ui.storageError || (state.settings.remember ? t('Saved on this device') : ctx.ui.sessionEdited ? t('Not saved — download a backup') : '');
  return html`<div class="app-shell"><aside class="sidebar"><a class="brand" href="#/home" @click=${(/** @type {Event} */ e) => { e.preventDefault(); ctx.go('home'); }}><span class="brand-mark">${icon('compass', 26)}</span><span>${brand.name}<small>${t(brand.tagline)}</small></span></a>
${status ? html`<button class="mobile-save-status" type="button" aria-label=${status} title=${status} @click=${() => ctx.go('settings')}>${icon(state.settings.remember ? 'check' : 'download')}</button>` : nothing}
<div><p class="nav-label">${t('Your workspace')}</p><nav class="nav-list" aria-label=${t('Main navigation')}>
${primary.map(n => html`${n.id === 'prompts' ? html`<p class="tools-label">${t('Tools')}</p>` : nothing}${navButton(n)}`)}</nav><details class="mobile-navigation nav-sheet"><summary>${t('Menu')}</summary><div class="menu-panel"><nav aria-label=${t('Mobile navigation')}>${primary.map(navButton)}</nav><div class="menu-tools">${ctx.services.languageSwitch?.(ctx, '-menu')}${button(html`${icon('download', 15)}${t('Save backup')}`, () => ctx.services.exportBackup(), { style: 'secondary small' })}</div></div></details></div></aside>
<div class="main-wrap"><header class="topbar"><p class="crumb">${t('My journey')} <span class="crumb-sep">/</span><strong>${currentStep >= 0 ? t('Step {n} of 4 · {step}', { n: currentStep + 1, step: t(JOURNEY[currentStep].label) }) : t(current.label)}</strong></p><div class="top-actions">${ctx.services.languageSwitch ? ctx.services.languageSwitch(ctx) : nothing}${status ? html`<span class="storage-status"><span class="dot"></span>${status}</span>` : nothing}${button(html`${icon('download', 15)}${t('Save backup')}`, () => ctx.services.exportBackup(), { style: 'secondary small' })}</div></header>
<main id="main" class="content" tabindex="-1">${state.demo ? html`<div class="banner"><span><strong>${t('You\'re exploring Sam\'s example. Nothing here is real.')}</strong></span>${button(t('Start my own'), () => ctx.services.startOwn(), { style: 'small' })}</div>` : nothing}
${ctx.content.warnings.length ? html`<div class="banner" role="status"><span><strong>${t('Some content files were skipped:')}</strong> ${ctx.content.warnings.join(' · ')}</span></div>` : nothing}
${ctx.ui.legacyOffer ? html`<section class="banner" aria-label=${t('Earlier saved work')}><p>${t('We found work saved by the earlier version. Bring it in?')}</p>${button(t('Bring it in'), () => ctx.services.bringLegacy())}${button(t('Not now'), () => { ctx.ui.legacyOffer = false; ctx.rerender(); })}</section>` : nothing}
${ctx.ui.askToSave ? html`<section class="banner" aria-label=${t('Device saving')}><p>${t('Keep your work on this device? Only say yes on your own phone or computer.')}</p>${button(t('Yes, keep it'), () => { ctx.ui.askToSave = false; ctx.services.setRemember(true); })}${button(t('Not now'), () => { ctx.ui.askToSave = false; ctx.rerender(); })}</section>` : nothing}

${ctx.services.aiPanel ? ctx.services.aiPanel(ctx, view) : nothing}
${currentStep >= 0 ? stepper(ctx, view) : nothing}${page}</main>
<footer class="footer"><span>${t(brand.footer)}</span><span class="independence">${t(INDEPENDENCE_NOTICE)}</span><span><a href="${brand.repoUrl}/blob/main/docs/PRIVACY.md" target="_blank" rel="noopener noreferrer">${t('Privacy')}</a> · <a href=${brand.repoUrl} target="_blank" rel="noopener noreferrer">${t('Open source')}</a></span></footer>${currentStep >= 0 ? journeyFooter(ctx, view) : nothing}</div></div>`;
}

/** "Your data & saved work" drawer. Ported from v0.1 privacy(). @param {import('../app-context.js').Ctx} ctx */
export function privacyDrawer(ctx) {
  const { state, t, services } = ctx;
  return html`<details class="card privacy-drawer" open><summary>${t('Your data & saved work')}</summary><div class="privacy-grid"><div><label class="check-row"><input id="remember" type="checkbox" .checked=${state.settings.remember} @change=${(/** @type {Event} */ e) => services.setRemember(/** @type {HTMLInputElement} */ (e.target).checked)}><span><strong>${t('Save on this device')}</strong><small>${t('Only use this on a device you trust. Anyone using this browser may be able to open your saved work.')}</small></span></label><p class="mt-15">${t('With saving off, closing or reloading this page can lose your work. A backup is a readable JSON file containing your profile, jobs, drafts and plan. Keep it somewhere private.')}</p></div>
<div><p>${t('No account, analytics or automatic AI requests. Use a display name if you prefer. Leave out identity documents, BSN, health information and other details you do not need for this task.')}</p><div class="actions">${button(t('Save backup'), () => services.exportBackup(), { style: 'secondary small' })}${button(t('Import backup'), () => services.importBackup(), { style: 'secondary small' })}${button(t('Clear my workspace'), () => services.reset(), { style: 'danger small' })}${button(t('Delete everything'), () => services.deleteEverything(), { style: 'danger small', testid: 'delete-everything' })}</div><p class="mt-13">${t('Clearing removes this app’s saved workspace. “Delete everything” also removes saved connections and offline files. Copies you downloaded or shared with an AI service are separate.')}</p></div></div></details>`;
}
