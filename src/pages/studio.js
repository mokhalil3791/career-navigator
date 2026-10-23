// @ts-check
/**
 * AI prompt studio (FR-PS). Copy-paste is the universal, free fallback: it works
 * with the free plan of any AI chat. Ported from v0.1 renderPrompts, with:
 *  - the original workshop prompt panel removed (decision D4),
 *  - free chat links from config/providers.json (decision D7),
 *  - "Share" for phones (sends the prompt to an installed AI app) and, for short
 *    prompts, "Open in <chat>" which pre-fills the chat box.
 */
import { html, nothing } from 'lit-html';
import { icon } from '../components/icon.js';
import { button, field, goButton, pageHeading } from '../components/ui.js';
import { buildPrompt } from '../core/prompts.js';
import { safeUrl } from '../core/escape.js';
import providers from '../../config/providers.json';

const STEPS = [['profile', '1'], ['search', '2'], ['compare', '+'], ['fit', '3'], ['tailor', '4'], ['interview', '5'], ['letter', '6']];
const LANGUAGES = ['English', 'Dutch', 'Arabic', 'Ukrainian', 'French', 'Turkish', 'Persian', 'Tigrinya', 'Amharic', 'Somali', 'Kurdish', 'Russian', 'Spanish', 'Pashto'];

/** @param {import('../app-context.js').Ctx} ctx */
export function renderStudio(ctx) {
  const { state, t, content } = ctx;
  const step = state.ai.step;
  const meta = content.prompts.find((p) => p.id === step) || content.prompts[0];
  const prompt = buildPrompt(step, state, content);
  const preview = () => /** @type {HTMLTextAreaElement} */ (document.getElementById('prompt-preview'));
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(prompt);
      ctx.notify(t('Prompt copied. Open your AI chat and paste it when you are ready.'));
    } catch (_) {
      preview().focus(); preview().select();
      ctx.notify(t('Automatic copying is unavailable. Text is selected: use Copy, Ctrl+C or ⌘C.'));
    }
  };
  const share = () => navigator.share({ text: prompt }).catch(() => { /* the user closed the share sheet */ });
  const canPrefill = prompt.length <= providers.prefillMaxChars;
  const context = ['compare', 'search'].includes(step) ? t('Your profile and saved adverts') : ['fit', 'tailor', 'interview', 'letter'].includes(step) ? t('Your profile and selected advert') : t('Your profile');
  const back = step === 'compare' || step === 'fit' || step === 'search' ? ['jobs', t('Review my job evidence')] : step === 'interview' ? ['interview', t('Return to interview practice')] : ['cv', t('Edit my application')];
  return html`${pageHeading(t('Optional / AI prompt studio'), t('Better context. More useful help.'), t('Prepare a prompt here, run it in a free AI chat, then bring back a draft to review.'))}
${ctx.services.aiConnect ? ctx.services.aiConnect(ctx) : nothing}
<div class="prompt-layout"><aside><div class="prompt-tabs" aria-label=${t('Choose a prompt')}>${STEPS.map(([id, n]) => { const p = content.prompts.find((x) => x.id === id); return html`<button type="button" class="prompt-tab" aria-pressed=${String(id === step)} @click=${() => { ctx.update('ai.step', id); ctx.focusAfterRender('h1'); }}><span>${n}</span>${t(p?.title || id)}</button>`; })}</div>
<p class="source-note">${t('Seven career prompts. The app prepares the text; your chosen AI service runs it. The same prompts are on the public prompt library page.')}</p>${ctx.services.customPrompts ? ctx.services.customPrompts(ctx) : nothing}</aside>
<div class="grid"><section class="card"><div class="prompt-steps"><span><b>1</b> ${t('Preview')}</span><span>→</span><span><b>2</b> ${t('Copy & run in AI')}</span><span>→</span><span><b>3</b> ${t('Review the result')}</span></div><h2>${t(meta.title)}</h2><p class="card-sub">${t(meta.summary)}</p>
<div class="fields mt-23"><div class="field"><label for="ai-language">${t('Ask AI to explain in')}</label><input id="ai-language" type="text" list="languages" maxlength="100" placeholder="English" .value=${state.ai.language} @input=${(/** @type {Event} */ e) => ctx.update('ai.language', /** @type {HTMLInputElement} */ (e.target).value)}><datalist id="languages">${LANGUAGES.map((l) => html`<option value=${l}></option>`)}</datalist><span class="field-hint">${t('This changes the AI request only. The app interface stays in your chosen interface language.')}</span></div>
<div class="field"><label>${t('Context included')}</label><p class="field-hint py-10">${context}. ${t('Review the exact text below. The name field is omitted; free text may still include personal details.')}</p></div>
${field(ctx, t('Anything else to ask'), 'ai.extra', { optional: true, area: true, rows: 2, full: true, max: 6000, placeholder: t('e.g. Use plain language. Help me explain a career change.') })}</div>
<div class="field mt-20"><label for="prompt-preview">${t('Exact prompt to copy')}</label><textarea id="prompt-preview" class="prompt-preview" readonly rows="13" spellcheck="false" .value=${prompt}></textarea><span class="field-hint">${t('Read this before sharing. Remove private details from your source fields if needed. Nothing is sent to an AI until you copy it yourself or confirm a built-in AI request.')}</span></div>
<div class="actions mt-15">${button(html`${icon('copy', 16)}${t('Copy this prompt')}`, copy, { style: '' })}${'share' in navigator ? button(t('Share to an AI app'), share) : nothing}${button(t('Select text manually'), () => { preview().focus(); preview().select(); ctx.notify(t('Text selected. Use your browser’s Copy command, Ctrl+C or ⌘C.')); })}${ctx.services.sendButton ? ctx.services.sendButton(ctx, prompt) : nothing}</div>
<div class="provider-links"><span class="muted">${t('Then open a free AI chat:')}</span>${providers.chats.map((c) => { const url = safeUrl(c.url); return url ? html`<a href=${url} target="_blank" rel="noopener noreferrer">${c.label} ↗</a>` : nothing; })}</div>
${canPrefill ? html`<p class="field-hint mt-10">${t('Short prompt: you can also open it pre-filled in')} ${providers.chats.filter((c) => c.prefill).map((c) => html`<a class="prefill-link" href=${safeUrl(c.prefill + encodeURIComponent(prompt))} target="_blank" rel="noopener noreferrer">${c.label} ↗</a> `)} ${t('(the text travels in the web address, so it can appear in your browser history).')}</p>` : nothing}
<p class="source-note">${t('Each AI service has its own terms, privacy controls and free usage limits. Career Navigator itself never needs an account, a subscription or an API key.')}</p>
<details class="details"><summary>${t('About this prompt')}</summary><div class="original-text">${t('This prompt adds factuality safeguards and uses evidence categories instead of a score. It treats your profile and adverts as quoted data, so instructions hidden inside an advert are ignored.')}</div><p class="source-note"><a href="../prompts/" target="_blank" rel="noopener">${t('Open the public prompt library')}</a></p></details></section>
${ctx.ui.aiResponse ? ctx.ui.aiResponse(ctx) : nothing}
<section class="card"><div class="card-head"><div><h2>${t('Bring back a draft')}</h2><p class="card-sub">${t('Paste a response from your AI chat. Treat it as unverified working text.')}</p></div><span class="pill sand">${t('Unverified draft — needs your review')}</span></div>
${field(ctx, t('AI response or working notes'), 'ai.drafts.' + step, { area: true, rows: 8, max: 40000, placeholder: t('Paste the response here. Check facts, missing evidence, assumptions and tone.') })}
${ctx.services.pastedReply ? ctx.services.pastedReply(ctx, step) : nothing}
<div class="review-box mt-18"><h3>${t('Before you use the response')}</h3><p class="card-sub">${t('Can you point to evidence for every claim? Are vacancies real and current? Are unknowns labelled? Keep only wording you understand and can support.')}</p></div>
<div class="actions mt-18">${goButton(ctx, back[1], back[0], 'secondary')}</div><p class="source-note">${t('Drafts are saved with your workspace when you choose to save or export. They are never applied to your CV automatically.')}</p></section></div></div>`;
}
