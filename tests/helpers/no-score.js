// @ts-check
/**
 * Guardrail helper for principle 2 ("Evidence, not scores").
 * Finds text that ASKS for or SHOWS a fit/match score, percentage or ranking.
 * Sentences that BAN scores are allowed, but only through the exact phrases below,
 * so nobody can sneak a score in by writing "not" somewhere nearby.
 * Adding a phrase here needs a maintainer review. Never remove a pattern.
 */

/** Exact phrases that ban scores. They are removed before scanning. */
export const ALLOWED_BAN_PHRASES = [
  'including a numeric match score',
  'rather than percentages',
  'do not assign a fit percentage',
  'do not use a percentage score',
  'no automated fit score is used',
  'not a hiring score',
  'no fit percentage',
  'no scores or automatic ranking',
  'no percentages',
  'no match scores',
  'no match score',
  'instead of a score',
];

/** Patterns that indicate a score request or display. */
export const SCORE_PATTERNS = [
  /match score/i,
  /fit score/i,
  /fit percentage/i,
  /\bscore (from|of|out of|between) \d/i,
  /\b\d{1,3}\s?(%|percent\b)/i,
  /\bpercentage\b/i,
  /\brank(ed|ing)?\b[^.\n]{0,40}\b(best|worst)\b/i,
  /\bmatch(ing)? (rate|level) of\b/i,
];

/**
 * Removes CSS so "width:100%" does not count as a score.
 * @param {string} text
 */
function stripCss(text) {
  return text
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/\sstyle="[^"]*"/gi, ' ')
    .replace(/\{[^{}]*:[^{}]*%[^{}]*\}/g, ' ');
}

/**
 * @param {string} text any prompt, UI string file or page
 * @returns {string[]} the offending snippets; empty when clean
 */
export function findScoreRequests(text) {
  let clean = stripCss(text);
  for (const phrase of ALLOWED_BAN_PHRASES) clean = clean.split(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')).join(' ');
  const hits = [];
  for (const pattern of SCORE_PATTERNS) {
    const global = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    for (const m of clean.matchAll(global)) hits.push(clean.slice(Math.max(0, (m.index || 0) - 40), (m.index || 0) + m[0].length + 40).replace(/\s+/g, ' '));
  }
  return hits;
}
