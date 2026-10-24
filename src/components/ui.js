// @ts-check
/**
 * Small building blocks used by every page: buttons, form fields, page headings.
 * lit-html escapes every ${value}, so user text can never become HTML (NFR-SEC-3).
 */
import { html, nothing } from 'lit-html';
import { live } from 'lit-html/directives/live.js';
import { icon } from './icon.js';

/** Arrow/Home/End navigation for the small, automatically activated tab lists.
 * @param {KeyboardEvent} event
 */
export function navigateTabs(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const list = /** @type {HTMLElement} */ (event.currentTarget);
  const tabs = Array.from(list.querySelectorAll('button[role="tab"]'));
  const current = tabs.indexOf(/** @type {Element} */ (event.target));
  if (current < 0) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
    : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  const tab = /** @type {HTMLButtonElement} */ (tabs[next]);
  tab.click(); tab.focus();
}

/**
 * @typedef {import('../app-context.js').Ctx} Ctx
 */

/**
 * A button. `style` is a v0.1 class list such as "secondary small".
 * @param {unknown} label text or template
 * @param {(event: Event) => void} onClick
 * @param {{ style?: string, disabled?: boolean, label?: string, pressed?: boolean, id?: string, testid?: string }} [opts]
 */
export function button(label, onClick, opts = {}) {
  return html`<button type="button" class="btn ${opts.style ?? 'secondary'}" id=${opts.id || nothing} ?disabled=${!!opts.disabled}
    aria-label=${opts.label || nothing} aria-pressed=${opts.pressed === undefined ? nothing : String(opts.pressed)}
    data-testid=${opts.testid || nothing} @click=${onClick}>${label}</button>`;
}

/**
 * Reads a dotted path from the workspace, e.g. "profile.city".
 * @param {any} state
 * @param {string} path
 */
export function getPath(state, path) {
  return path.split('.').reduce((o, k) => (o == null ? '' : o[k]), state);
}

/**
 * A labelled text input or textarea bound to a workspace path. Typing updates
 * the store; if the store refuses (limit reached), the field shows the stored value again.
 * @param {Ctx} ctx
 * @param {string} label
 * @param {string} path
 * @param {{ area?: boolean, rows?: number, max?: number, placeholder?: string, hint?: string, optional?: boolean, full?: boolean, type?: string, list?: string, lang?: string }} [opts]
 */
export function field(ctx, label, path, opts = {}) {
  const id = 'field-' + path.replace(/\./g, '-');
  const value = getPath(ctx.state, path) ?? '';
  const hintId = opts.hint ? id + '-hint' : '';
  const onInput = (/** @type {Event} */ e) => ctx.update(path, /** @type {HTMLInputElement} */ (e.target).value);
  const control = opts.area
    ? html`<textarea id=${id} rows=${opts.rows || 4} maxlength=${opts.max || 16000} placeholder=${opts.placeholder || ''} aria-describedby=${hintId || nothing} lang=${opts.lang || nothing} .value=${live(String(value))} @input=${onInput}></textarea>`
    : html`<input id=${id} type=${opts.type || 'text'} maxlength=${opts.type === 'number' || opts.type === 'date' ? nothing : (opts.max || 500)}
        min=${opts.type === 'number' ? '1' : nothing} max=${opts.type === 'number' ? '40' : nothing} step=${opts.type === 'number' ? '1' : nothing}
        list=${opts.list || nothing} placeholder=${opts.placeholder || ''} aria-describedby=${hintId || nothing} .value=${live(String(value))} @input=${onInput}>`;
  return html`<div class="field ${opts.full ? 'full' : ''}"><label for=${id}>${label}${opts.optional ? html`<span class="optional">${ctx.t('optional')}</span>` : nothing}</label>${control}${opts.hint ? html`<span class="field-hint" id=${hintId}>${opts.hint}</span>` : nothing}</div>`;
}

/**
 * The heading block at the top of each page. The h1 receives focus after navigation.
 * @param {string} eyebrow
 * @param {string} title
 * @param {string} description
 * @param {unknown} [actions]
 */
export function pageHeading(eyebrow, title, description, actions) {
  return html`<div class="page-heading"><div>${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : nothing}<h1 tabindex="-1" class="focus-heading">${title}</h1><p class="lead">${description}</p></div>${actions ? html`<div class="actions">${actions}</div>` : nothing}</div>`;
}

/**
 * A button that opens the prompt studio on a given step (the copy-paste AI route).
 * @param {Ctx} ctx
 * @param {string} step
 * @param {string} [text]
 */
export function aiButton(ctx, step, text) {
  return button(html`${icon('spark', 16)}${text || ctx.t('Use an AI prompt')}`, () => { ctx.update('ai.step', step); ctx.go('prompts'); }, { style: 'secondary small' });
}

/**
 * A navigation button to another page.
 * @param {Ctx} ctx
 * @param {unknown} text
 * @param {string} view
 * @param {string} [style]
 */
export function goButton(ctx, text, view, style = '') {
  return button(text, () => ctx.go(view), { style });
}
