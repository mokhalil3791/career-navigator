// @ts-check
import { html, nothing } from 'lit-html';
import { inline } from '../content/markdown.js';

/** Demo teaching copy never appears in a participant's own workspace.
 * @param {import('../app-context.js').Ctx} ctx
 */
export function examplePromptNote(ctx) {
  return ctx.state.demo ? html`<p class="example-prompt-note field-hint">${ctx.t('Example: this is a complete five-part prompt. Notice the Goal, Context and Guardrails.')}</p>` : nothing;
}

/** Escaped readable text, with visible placeholders rather than invented details.
 * @param {string} text
 */
export function exampleText(text) {
  return text.split(/(\[[^\]\n]+\])/g).map((part, i) => i % 2 ? html`<mark class="example-gap">${part}</mark>` : inline(part));
}
