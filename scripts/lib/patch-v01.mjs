// @ts-check
/**
 * Prepares the hosted copy of v0.1 (Phase 0 workshop release).
 * reference/v0.1/Career_Navigator.html is never edited. Only the copy we publish
 * is patched, because the product guardrails override v0.1 behaviour:
 *  - Principle 2: the original workshop prompts ask for "a match score from 0 to 100".
 *    The hosted copy stops shipping that text and never attaches it to prompts.
 *  - Independence: the link to the old external prompt site is replaced by our
 *    own free prompt library at ./prompts/.
 * Each replacement must match exactly once, so a changed reference fails loudly.
 */

/** @type {{ name: string, find: string | RegExp, replace: string }[]} */
export const PATCHES = [
  {
    name: 'remove original workshop prompts (they request match scores)',
    find: /"prompts": \[[\s\S]*?\n  \],\n  "roles": \[/,
    replace: '"prompts": [],\n  "roles": [',
  },
  {
    name: 'neutral label for the prompt explainer',
    find: "'About this comparison helper'",
    replace: "'About this prompt'",
  },
  {
    name: 'explainer text without the originals',
    find: "'This additional prompt asks an AI service to compare your pasted adverts using explicit evidence. It suggests an order for you to consider; it does not make a hiring decision.'",
    replace: "'This prompt adds factuality safeguards and uses evidence categories instead of a score. All prompts are also on the free prompt library page: ./prompts/'",
  },
  {
    name: 'replace external prompt site with our own library',
    find: 'https://nn-job-prompts.netlify.app/',
    replace: './prompts/',
  },
];

/**
 * @param {string} html the reference v0.1 file
 * @returns {string} the copy to publish
 */
export function patchV01(html) {
  let out = html;
  for (const patch of PATCHES) {
    const count = typeof patch.find === 'string' ? out.split(patch.find).length - 1 : (out.match(new RegExp(patch.find.source, 'g')) || []).length;
    if (count !== 1) throw new Error(`v0.1 patch "${patch.name}" matched ${count} times; expected exactly 1`);
    out = out.replace(patch.find, patch.replace);
  }
  return out;
}
