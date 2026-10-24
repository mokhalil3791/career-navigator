// @ts-check
/**
 * "Connect free AI": choose a route and set it up (FR-AI-5, FR-ONB-1).
 * Copy-paste is the default and needs nothing. Keys stay in memory unless the
 * user ticks "Save key on this device". WebLLM shows a large-download warning
 * and downloads only after an explicit confirmation.
 */
import { html, nothing } from 'lit-html';
import { button } from '../../components/ui.js';
import { safeUrl } from '../../core/escape.js';
import * as ai from '../../ai/session.js';
import { hasWebGPU, isLoaded, loadModel } from '../../ai/providers/webllm.js';
import { kv } from '../../storage/device.js';

/** Screen-only setup state (never saved). */
const setup = { keyDraft: /** @type {Record<string, string>} */ ({}), remember: /** @type {Record<string, boolean>} */ ({}), status: /** @type {Record<string, string>} */ ({}), models: /** @type {Record<string, {id:string,label:string}[]>} */ ({}), webgpu: /** @type {boolean | null} */ (null), download: { agreed: false, progress: -1, text: '' } };

/** @param {number} mb */
const gb = (mb) => (mb / 1024).toFixed(1).replace('.0', '');

/** First-use choice. No provider is contacted here.
 * @param {import('../../app-context.js').Ctx} ctx
 */
export function firstRoute(ctx) {
  const { t } = ctx;
  if (setup.webgpu === null) hasWebGPU().then(ok => { setup.webgpu = ok; ctx.rerender(); });
  const choice = ctx.ui.firstAiRoute || 'copy';
  const options = [['copy', t('Copy and paste into a free AI chat (recommended)')], ['gemini', t('Connect a free Gemini key')], ...(setup.webgpu ? [['webllm', t('Run AI on this device')]] : [])];
  return html`<fieldset class="route-picker"><legend>${t('AI help is optional')}</legend>${options.map(([id, label]) => html`<label class="check-row"><input type="radio" name="first-ai-route" value=${id} .checked=${choice === id} @change=${() => { ctx.ui.firstAiRoute = id; ctx.rerender(); }}><span>${label}</span></label>`)}</fieldset>
  ${button(t('Use this AI route'), () => { ai.setRoute(choice); ctx.update('settings.aiRoute', choice); ctx.update('settings.aiRouteChosen', true); ctx.focusAfterRender('ai-panel-title'); }, { style: '' })}`;
}

/**
 * Compact route picker shown inside the AI panel.
 * @param {import('../../app-context.js').Ctx} ctx
 * @param {string} [where] keeps radio groups separate when two pickers are on one page
 */
export function connectRoute(ctx, where = 'panel') {
  const { t } = ctx;
  const route = ai.getRoute();
  return html`<fieldset class="route-picker"><legend>${t('How should the AI run?')}</legend>
<label class="check-row"><input type="radio" name="ai-route-${where}" value="copy" .checked=${route === 'copy'} @change=${() => { ai.setRoute('copy'); ctx.update('settings.aiRoute', 'copy'); ctx.update('settings.aiRouteChosen', true); ctx.rerender(); }}><span><strong>${t('Copy-paste into any free AI chat')}</strong><small>${t('Works for everyone. Nothing is sent by this app.')}</small></span></label>
${ai.API_PROVIDERS.map((p) => html`<label class="check-row"><input type="radio" name="ai-route-${where}" value=${p.id} .checked=${route === p.id} @change=${() => { ai.setRoute(p.id); ctx.update('settings.aiRoute', p.id); ctx.update('settings.aiRouteChosen', true); ctx.rerender(); }}><span><strong>${t(p.label)}</strong><small>${statusLine(ctx, p)}</small></span></label>`)}
</fieldset>${route !== 'copy' ? providerSetup(ctx, ai.providerConfig(route)) : nothing}`;
}

/** @param {import('../../app-context.js').Ctx} ctx @param {any} p */
function statusLine(ctx, p) {
  const { t } = ctx;
  if (p.kind === 'key') return ai.getKey(p.id) ? t('Key added for this session') + (ai.isKeySaved(p.id) ? ' · ' + t('saved on this device') : '') : t('Needs your own free key');
  if (p.kind === 'device') return isLoaded() ? t('Model ready on this device') : t('One-time large download; needs WebGPU');
  return t('Needs Ollama running on this computer');
}

/** @param {import('../../app-context.js').Ctx} ctx @param {any} p */
function providerSetup(ctx, p) {
  const { t } = ctx;
  const status = setup.status[p.id] ? html`<p class="field-hint" role="status">${setup.status[p.id]}</p>` : nothing;
  const check = async () => {
    setup.status[p.id] = t('Checking…'); ctx.rerender();
    const result = await ai.checkConnection(p.id).catch((/** @type {Error} */ e) => ({ ok: false, message: e.message }));
    setup.status[p.id] = t(result.message);
    if (result.ok) setup.models[p.id] = await ai.providerFor(p.id).listModels().catch(() => []);
    ctx.rerender();
  };
  const modelPicker = () => {
    const models = setup.models[p.id]?.length ? setup.models[p.id] : p.models || [];
    if (!models.length) return nothing;
    return html`<div class="field mt-10"><label for="model-${p.id}">${t('Model')}</label><select id="model-${p.id}" @change=${(/** @type {Event} */ e) => { ai.setModel(p.id, /** @type {HTMLSelectElement} */ (e.target).value); ctx.rerender(); }}>${models.map((m) => html`<option value=${m.id} ?selected=${ai.getModel(p.id) === m.id}>${m.label}${p.kind === 'device' && /** @type {any} */ (m).memoryMB ? ' — ' + t('up to about {size} GB', { size: gb(/** @type {any} */ (m).memoryMB) }) : ''}</option>`)}</select></div>`;
  };
  if (p.kind === 'key') {
    const save = async () => {
      await ai.setKey(p.id, setup.keyDraft[p.id] || '', { remember: !!setup.remember[p.id], storage: { kv } }).catch(() => ctx.notify(t('The key could not be saved on this device; it is kept for this session only.'), true));
      setup.keyDraft[p.id] = '';
      ctx.notify(t('Key added. It stays in this browser and is sent only to {host}.', { host: new URL(p.endpoint).host }));
      ctx.rerender();
    };
    return html`<div class="provider-setup">
<ol class="tip-list"><li>${t('Open the free key page (a Google or OpenRouter account is free):')} <a href=${safeUrl(p.keyUrl)} target="_blank" rel="noopener noreferrer">${new URL(p.keyUrl).host} ↗</a></li><li>${t('Create a key and copy it.')}</li><li>${t('Paste it here. Never share your key with anyone.')}</li></ol>
${ai.getKey(p.id) ? html`<div class="actions mt-10">${button(t('Check connection'), check, { style: 'secondary small' })}${button(t('Forget key'), async () => { await ai.forgetKey(p.id, { kv }); ctx.notify(t('Key removed from this browser.')); ctx.rerender(); }, { style: 'danger small' })}</div>`
      : html`<div class="field mt-10"><label for="key-${p.id}">${t('Your free API key')}</label><input id="key-${p.id}" type="password" autocomplete="off" spellcheck="false" .value=${setup.keyDraft[p.id] || ''} @input=${(/** @type {Event} */ e) => { setup.keyDraft[p.id] = /** @type {HTMLInputElement} */ (e.target).value; }}></div>
<label class="check-row mt-10"><input type="checkbox" .checked=${!!setup.remember[p.id]} @change=${(/** @type {Event} */ e) => { setup.remember[p.id] = /** @type {HTMLInputElement} */ (e.target).checked; }}><span>${t('Save key on this device')}<small>${t('Only on your own device. Anyone using this browser could use your key. You can forget it at any time.')}</small></span></label>
<div class="actions mt-10">${button(t('Use this key'), save, { style: 'small' })}</div>`}
${modelPicker()}${status}${p.limitsUrl ? html`<p class="source-note">${t('Free limits are set by the provider and can change.')} <a href=${safeUrl(p.limitsUrl)} target="_blank" rel="noopener noreferrer">${t('Current limits')} ↗</a></p>` : nothing}</div>`;
  }
  if (p.kind === 'local') {
    return html`<div class="provider-setup"><p class="card-sub">${t('Install Ollama (free), run "ollama pull {model}", and allow this site by setting OLLAMA_ORIGINS. The README has step-by-step instructions.', { model: p.defaultModel })} <a href=${safeUrl(p.setupUrl)} target="_blank" rel="noopener noreferrer">${t('Ollama help')} ↗</a></p><div class="actions mt-10">${button(t('Check connection'), check, { style: 'secondary small' })}</div>${modelPicker()}${status}</div>`;
  }
  // WebLLM (on device)
  if (setup.webgpu === null) { hasWebGPU().then((ok) => { setup.webgpu = ok; ctx.rerender(); }); return html`<p class="field-hint">${t('Checking whether this device supports WebGPU…')}</p>`; }
  if (!setup.webgpu) return html`<p class="evidence-warning">${t('This browser or device does not support WebGPU, so the in-browser model is not available. Use copy-paste or a free key instead.')}</p>`;
  if (isLoaded() && setup.download.progress >= 1) return html`<p class="field-hint" role="status">${t('The model is ready. It runs on this device; nothing leaves it.')}</p>`;
  const model = (p.models || []).find((/** @type {any} */ m) => m.id === ai.getModel(p.id)) || p.models[0];
  const start = async () => {
    setup.download.progress = 0; ctx.rerender();
    try {
      await loadModel(model.id, (r) => { setup.download.progress = r.progress; setup.download.text = r.text; ctx.rerender(); });
      setup.download.progress = 1; ctx.notify(t('The in-browser model is ready.'));
    } catch (error) { setup.download.progress = -1; ctx.notify(t(/** @type {Error} */ (error).message), true); }
    ctx.rerender();
  };
  return html`<div class="provider-setup">${modelPicker()}
<div class="banner mt-10" role="note"><span><strong>${t('Large download: up to about {size} GB.', { size: gb(model.memoryMB) })}</strong> ${t('Use Wi-Fi. On mobile data this can use a large part of your data bundle. The download happens once and is stored in this browser; “Delete everything” removes it. It needs a recent browser and enough free memory, and may be slow on older phones.')}</span></div>
<label class="check-row mt-10"><input type="checkbox" .checked=${setup.download.agreed} @change=${(/** @type {Event} */ e) => { setup.download.agreed = /** @type {HTMLInputElement} */ (e.target).checked; ctx.rerender(); }}><span>${t('I understand. I am on Wi-Fi or have enough data.')}</span></label>
<div class="actions mt-10">${button(t('Download and start the model'), start, { style: 'small', disabled: !setup.download.agreed || setup.download.progress >= 0, testid: 'webllm-download' })}</div>
${setup.download.progress >= 0 ? html`<label class="field-hint" for="webllm-progress">${setup.download.text || t('Starting…')}</label><progress id="webllm-progress" max="1" .value=${setup.download.progress}></progress>` : nothing}</div>`;
}

/** WebLLM can answer now. */
export const webllmReady = () => isLoaded() && setup.download.progress >= 1;

/**
 * Full card for the prompt studio.
 * @param {import('../../app-context.js').Ctx} ctx
 */
export function connectCard(ctx) {
  const { t } = ctx;
  return html`<details class="card section-space connect-card" ?open=${ai.getRoute() !== 'copy'}><summary><strong>${t('Free AI routes')}</strong> — ${ai.getRoute() === 'copy' ? t('copy-paste (default)') : t(ai.providerConfig(ai.getRoute())?.label || '')}</summary><div class="mt-15">${connectRoute(ctx, 'studio')}</div>
<p class="source-note">${t('Every route is free. Career Navigator has no server and never asks you to pay. Copy-paste always works as a fallback.')}</p></details>`;
}


/** Current route stays visible; alternative providers and their setup are optional.
 * @param {import('../../app-context.js').Ctx} ctx
 */
export function currentRoute(ctx) {
  const { t } = ctx;
  const route = ai.getRoute();
  const provider = ai.providerConfig(route);
  return html`<div class="current-route"><p><strong>${t('Current AI route: {route}', { route: provider ? t(provider.label) : t('Copy-paste into any free AI chat') })}</strong></p>
${provider ? html`<p class="field-hint">${statusLine(ctx, provider)}</p>` : nothing}
<details class="details ai-route-options" ?open=${!!provider && ((provider.kind === 'key' && !ai.getKey(route)) || (provider.kind === 'device' && !webllmReady()))}><summary>${t('Change AI route')}</summary>${connectRoute(ctx)}</details></div>`;
}
