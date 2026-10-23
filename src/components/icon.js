// @ts-check
/** Line icons from v0.1, as lit-html SVG templates (no icon font, no remote files). */
import { html, svg } from 'lit-html';

/** @type {Record<string, import('lit-html').SVGTemplateResult>} */
const ICONS = {
  home: svg`<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1Z"/>`,
  person: svg`<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>`,
  briefcase: svg`<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12a26 26 0 0 0 18 0M10 13h4"/>`,
  document: svg`<path d="M14 3H5v18h14V8Z M14 3v5h5 M8 12h8 M8 16h6"/>`,
  chat: svg`<path d="M4 4h16v12H9l-5 5Z M8 8h8 M8 12h5"/>`,
  path: svg`<circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 5h7a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h7"/>`,
  spark: svg`<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z M20 2v4 M18 4h4"/>`,
  arrow: svg`<path d="M4 12h16m-6-6 6 6-6 6"/>`,
  download: svg`<path d="M12 3v12m-5-5 5 5 5-5 M4 16v5h16v-5"/>`,
  shield: svg`<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z M8 12l3 3 5-6"/>`,
  check: svg`<path d="m4 12 5 5L20 6"/>`,
  plus: svg`<path d="M12 4v16M4 12h16"/>`,
  copy: svg`<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>`,
  compass: svg`<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>`,
  chevron: svg`<path d="m8 4 8 8-8 8"/>`,
  list: svg`<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>`,
  calendar: svg`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>`,
  book: svg`<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4Z M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7Z"/>`,
  settings: svg`<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>`,
  users: svg`<circle cx="9" cy="8" r="3.5"/><path d="M2 21v-2a6 6 0 0 1 12 0v2 M16 4a3.5 3.5 0 0 1 0 7 M18 21v-2a6 6 0 0 0-3-5"/>`,
  stop: svg`<rect x="6" y="6" width="12" height="12" rx="2"/>`,
  upload: svg`<path d="M12 21V9m-5 5 5-5 5 5 M4 8V3h16v5"/>`,
};

/**
 * @param {string} name icon name, e.g. "briefcase"
 * @param {number} [size] pixels
 */
export function icon(name, size = 20) {
  return html`<svg aria-hidden="true" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.path}</svg>`;
}
