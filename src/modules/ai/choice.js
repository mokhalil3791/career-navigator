// @ts-check
import { html, nothing } from 'lit-html';
import { button } from '../../components/ui.js';
import { CHATS, chatHomepage, chosenChat } from '../../ai/chats.js';
import { browserAvailability } from '../../ai/browser-ai.js';
import * as ai from '../../ai/session.js';

/** Detection is local and never starts a download. @param {import('../../app-context.js').Ctx} ctx */
export function checkComputer(ctx) {
  if (ctx.ui.browserAvailability !== undefined) return;
  ctx.ui.browserAvailability = 'checking';
  browserAvailability().then(value => { ctx.ui.browserAvailability = value; ctx.rerender(); });
}
/** @param {import('../../app-context.js').Ctx} ctx */
export function chatChoice(ctx) {
  const { t } = ctx;
  checkComputer(ctx);
  const choice = ctx.ui.chatDraft || ctx.state.settings.aiChat || 'chatgpt';
  const save = () => {
    const url = chatHomepage(ctx.ui.chatUrlDraft ?? ctx.state.settings.aiChatUrl);
    if (choice === 'other' && !url) { ctx.notify(t('Enter the https homepage of your free AI chat.'), true); return; }
    ctx.update('settings.aiChatUrl', url); ctx.update('settings.aiChat', choice);
    ai.setRoute('copy'); ctx.update('settings.aiRoute', 'copy'); ctx.update('settings.aiRouteChosen', true);
    ctx.ui.changeChat = false; ctx.focusAfterRender('ai-panel-title'); ctx.rerender();
  };
  return html`<div class="chat-choice"><p>${t('Use my free AI chat')}</p><fieldset class="route-picker"><legend>${t('Which free AI chat do you use?')}</legend>
${CHATS.map(c => html`<label class="check-row"><input type="radio" name="free-chat" value=${c.id} .checked=${choice === c.id} @change=${() => { ctx.ui.chatDraft = c.id; ctx.rerender(); }}><span>${c.id === 'other' ? t('Another one') : c.label}</span></label>`)}</fieldset>
${choice === 'other' ? html`<div class="field"><label for="chat-homepage">${t('Chat homepage')}</label><input id="chat-homepage" type="url" placeholder="https://…" .value=${ctx.ui.chatUrlDraft ?? ctx.state.settings.aiChatUrl} @input=${(/** @type {Event} */ e) => { ctx.ui.chatUrlDraft = /** @type {HTMLInputElement} */ (e.target).value; }}><small>${t('Only the homepage is opened. Your prompt never goes in the address.')}</small></div>` : nothing}
${button(t('Use this chat'), save, { style: '' })}
${['available', 'downloadable', 'downloading'].includes(ctx.ui.browserAvailability) ? html`<div class="section-space">${button(t('Run on this computer — nothing is sent'), () => { ai.setRoute('browser'); ctx.update('settings.aiRoute', 'browser'); ctx.update('settings.aiRouteChosen', true); ctx.ui.changeChat = false; ctx.rerender(); })}</div>` : nothing}
<p class="field-hint">${t('Your choice stays with this workspace. Save on your own device to keep it after closing.')}</p></div>`;
}

/** Technical names stay in Advanced, not in the task panel. @param {import('../../app-context.js').Ctx} ctx */
export function usingLabel(ctx) {
  const route = ai.getRoute();
  return route === 'copy' ? chosenChat(ctx.state.settings).label : route === 'browser' || route === 'webllm' ? ctx.t('This computer') : route === 'gemini' ? 'Gemini' : route === 'openrouter' ? 'OpenRouter' : 'Ollama';
}
