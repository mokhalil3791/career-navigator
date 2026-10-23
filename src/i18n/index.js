// @ts-check
/**
 * Interface languages (NFR-I18N). English is the source of truth: the English
 * sentence itself is the key, so code stays readable — t('Compare jobs').
 * A language file maps English → translation. Anything missing falls back to
 * English, so a half-finished translation never breaks the app.
 *
 * Add a language: create src/i18n/<code>.json with a "_meta" block
 * ({ "name": "...", "dir": "ltr" | "rtl", "machineTranslated": true }). No code change needed.
 */

const files = /** @type {Record<string, any>} */ (import.meta.glob('./*.json', { eager: true, import: 'default' }));

/** @type {Record<string, { name: string, dir: 'ltr'|'rtl', machineTranslated?: boolean, strings: Record<string, string> }>} */
export const LANGUAGES = { en: { name: 'English', dir: 'ltr', strings: {} } };
for (const [path, data] of Object.entries(files)) {
  const code = (path.match(/\.\/([\w-]+)\.json$/) || [])[1];
  if (!code || code === 'en') continue;
  const { _meta, ...strings } = data;
  LANGUAGES[code] = { name: _meta?.name || code, dir: _meta?.dir === 'rtl' ? 'rtl' : 'ltr', machineTranslated: !!_meta?.machineTranslated, strings };
}

/**
 * Fills {placeholders}: format('{n} adverts', { n: 3 }) → '3 adverts'.
 * @param {string} text
 * @param {Record<string, unknown>} [params]
 */
export function format(text, params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, key) => (key in params ? String(params[key]) : m));
}

/**
 * Returns a translate function for one language.
 * @param {string} code e.g. "en" or "nl"
 * @returns {(english: string, params?: Record<string, unknown>) => string}
 */
export function createT(code) {
  const strings = (LANGUAGES[code] || LANGUAGES.en).strings;
  return (english, params) => format(strings[english] || english, params);
}

/** @param {string} code */
export function languageDir(code) {
  return (LANGUAGES[code] || LANGUAGES.en).dir;
}
