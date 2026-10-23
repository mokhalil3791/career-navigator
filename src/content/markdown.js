// @ts-check
/**
 * A tiny Markdown renderer for knowledge cards, producing lit-html templates.
 * It never creates raw HTML: every piece of text goes through lit's escaping,
 * and links pass safeUrl (https/http only). This is why the app does not need
 * DOMPurify: we never render HTML from content or AI (NFR-SEC-3).
 *
 * Supported: paragraphs, "- " and "1. " lists, **bold**, *italic*, [text](url).
 * <!-- comments --> (used for "TODO verify" notes) are removed and never shown (FR-KNW-3).
 */
import { html, nothing } from 'lit-html';
import { safeUrl } from '../core/escape.js';

/** Removes HTML comments, including "TODO verify" notes. @param {string} text */
export function stripComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Inline formatting for one line.
 * @param {string} text
 * @returns {unknown[]}
 */
export function inline(text) {
  /** @type {unknown[]} */
  const out = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if ((m.index || 0) > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(html`<strong>${m[1]}</strong>`);
    else if (m[2]) out.push(html`<em>${m[2]}</em>`);
    else {
      const url = safeUrl(m[4]);
      out.push(url ? html`<a href=${url} target="_blank" rel="noopener noreferrer">${m[3]}</a>` : m[3]);
    }
    last = (m.index || 0) + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * @param {string} markdown
 * @returns {unknown} a lit-html template
 */
export function renderMarkdown(markdown) {
  const blocks = stripComments(markdown).replace(/\r\n/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.every((l) => /^\s*-\s+/.test(l))) return html`<ul class="tip-list">${lines.map((l) => html`<li>${inline(l.replace(/^\s*-\s+/, ''))}</li>`)}</ul>`;
    if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) return html`<ol class="tip-list">${lines.map((l) => html`<li>${inline(l.replace(/^\s*\d+\.\s+/, ''))}</li>`)}</ol>`;
    if (!lines.length) return nothing;
    return html`<p class="card-sub">${inline(lines.join(' '))}</p>`;
  });
}
