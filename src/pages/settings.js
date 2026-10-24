// @ts-check
import { html } from 'lit-html';
import { pageHeading, goButton } from '../components/ui.js';
import { privacyDrawer } from '../components/shell.js';
/** @param {import('../app-context.js').Ctx} ctx */
export function renderSettings(ctx) {
  const { t } = ctx;
  return html`${pageHeading('', t('Settings'), t('Choose how you save your work and use AI.'))}
  ${privacyDrawer(ctx)}
  <section class="card section-space"><h2>${t('Language')}</h2>${ctx.services.languageSwitch?.(ctx, '-settings')}<p>${t('Machine-assisted translation, not yet reviewed by a fluent speaker.')}</p></section>
  ${ctx.services.aiConnect?.(ctx)}
  <section class="card section-space coach-notes"><h2>${t('Coach notes')}</h2>${ctx.state.coachNotes.map(note => html`<blockquote><p>${note.note}</p><small>${note.coach} · ${note.date}</small></blockquote>`)}${goButton(ctx, t('Share with my coach'), 'coach')}${goButton(ctx, t('Learn'), 'learn')}</section>`;
}
