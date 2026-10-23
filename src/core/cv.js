// @ts-check
/** CV helpers, ported from v0.1. */

/**
 * Copies the structured profile into the CV fields. It never interprets the
 * pasted CV text and never invents anything. The letter is kept; the review resets.
 * @param {import('./schema.js').Workspace} state
 */
export function draftCvFromProfile(state) {
  const p = state.profile || {};
  return Object.assign({}, state.cv, { headline: p.headline || '', summary: p.about || '', experience: p.experience || '', education: p.education || '', skills: p.skills || '', languages: p.languages || '', letter: state.cv && state.cv.letter || '', reviewed: false });
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
