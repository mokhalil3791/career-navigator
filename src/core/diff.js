// @ts-check
/**
 * A small word-level diff, so the user sees exactly what an AI suggestion
 * would change before accepting it (principle 3, FR-CV-2).
 * Classic longest-common-subsequence over word tokens; fine for CV-sized text.
 */

/**
 * @typedef {{ type: 'same' | 'added' | 'removed', text: string }} DiffPart
 */

/** Splits into words and the spaces/newlines between them, keeping both. @param {string} text */
function tokens(text) {
  return String(text || '').match(/\s+|[^\s]+/g) || [];
}

/**
 * @param {string} before
 * @param {string} after
 * @returns {DiffPart[]} merged runs of same / removed / added text
 */
export function diffWords(before, after) {
  const a = tokens(before), b = tokens(after);
  // Very long texts: fall back to "all removed, all added" to keep the page responsive.
  if (a.length * b.length > 4_000_000) return /** @type {DiffPart[]} */ ([{ type: 'removed', text: before }, { type: 'added', text: after }]).filter((p) => p.text);
  const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  /** @type {DiffPart[]} */
  const parts = [];
  const push = (/** @type {DiffPart['type']} */ type, /** @type {string} */ text) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.text += text; else parts.push({ type, text });
  };
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { push('same', a[i]); i++; j++; }
    else if (table[i + 1][j] >= table[i][j + 1]) push('removed', a[i++]);
    else push('added', b[j++]);
  }
  while (i < a.length) push('removed', a[i++]);
  while (j < b.length) push('added', b[j++]);
  return parts;
}

/** @param {DiffPart[]} parts @returns {boolean} */
export function hasChanges(parts) {
  return parts.some((p) => p.type !== 'same');
}
