// @ts-check
/** CV helpers, ported from v0.1. */

/**
 * Copies the structured profile into the CV fields. It never interprets the
 * pasted CV text and never invents anything. The letter is kept; the review resets.
 * @param {import('./schema.js').Workspace} state
 */
export function draftCvFromProfile(state) {
  const p = state.profile || {};
  return Object.assign({}, state.cv, {
    headline: p.headline || '', summary: p.about || '', experience: p.experience || '',
    education: combine(p.education, (p.educationRows || []).map(educationLine)),
    skills: p.skills || '',
    languages: combine(p.languages, (p.languageRows || []).map(languageLine)),
    letter: state.cv && state.cv.letter || '', reviewed: false,
  });
}

/**
 * The one rule for profile → CV when both a text field and structured rows exist:
 * the user's own text comes first, then each row that is not already written there.
 * With no rows (every v0.1 workspace) the result is exactly the text field.
 * @param {string} text
 * @param {string[]} rows
 */
function combine(text, rows) {
  const base = (text || '').trim();
  const lower = base.toLowerCase();
  const extra = rows.filter((r) => r && !lower.includes(r.toLowerCase()));
  if (!extra.length) return text || '';
  return [base, ...extra].filter(Boolean).join('\n');
}

/**
 * A language row as a CV line, e.g. "Dutch: B1 (certified: Staatsexamen NT2 programme I)".
 * @param {{ language: string, level: string, basis: string, certificate: string }} r
 */
export function languageLine(r) {
  if (!r.language.trim()) return '';
  const level = r.level === 'native' ? 'native' : r.level;
  const basis = r.basis === 'certified' ? 'certified' + (r.certificate ? ': ' + r.certificate : '') : r.basis === 'self' ? 'self-assessed' : '';
  return r.language.trim() + (level ? ': ' + level : '') + (basis && level !== 'native' ? ' (' + basis + ')' : '');
}

/**
 * An education row as a CV line, keeping the original title. Only a completed
 * IDW evaluation is mentioned (an application is not yet a result).
 * @param {{ title: string, institution: string, country: string, year: string, idw: string }} r
 */
export function educationLine(r) {
  if (!r.title.trim()) return '';
  return [r.title, r.institution, r.country, r.year].map((x) => (x || '').trim()).filter(Boolean).join(', ') + (r.idw === 'yes' ? ' (IDW credential evaluation available)' : '');
}

/** CV fields that count as "content" for the export check. */
export const CV_CONTENT_KEYS = ['summary', 'experience', 'education', 'skills', 'languages', 'headline'];

/**
 * Rough number of A4 pages the CV fills at print size (FR-CV-5).
 * Assumes about 95 characters per line and 55 lines per page in the print layout.
 * @param {Record<string, any>} cv
 */
export function estimatePages(cv) {
  const text = CV_CONTENT_KEYS.map(function (k) { return cv[k] || ''; }).join('\n\n');
  const lines = text.split('\n').reduce(function (n, line) { return n + Math.max(1, Math.ceil(line.length / 95)); }, 0) + 12;
  return Math.ceil(lines / 55);
}
