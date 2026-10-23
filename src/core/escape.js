// @ts-check
/**
 * Text-safety helpers ported unchanged from v0.1 CareerCore.
 * Used for files we generate as strings (CV, work pack, prompt library page).
 * Live app screens use lit-html, which escapes automatically.
 */

/**
 * Escapes the five HTML-special characters.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHTML(value) {
  return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, function (char) {
    return /** @type {Record<string,string>} */ ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
  });
}

/**
 * Returns a normalised http(s) URL, or '' when the value is unsafe
 * (other protocols, embedded credentials, control characters, too long).
 * @param {unknown} value
 * @returns {string}
 */
export function safeUrl(value) {
  // eslint-disable-next-line no-control-regex
  if (typeof value !== 'string' || value.length > 3000 || /[\u0000-\u001F\u007F]/.test(value)) return '';
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url.href : '';
  } catch (_) {
    return '';
  }
}
