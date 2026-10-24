// @ts-check
import { CV_KEYS, PROFILE_KEYS } from './schema.js';

/** Includes the letter and every LinkedIn field: none may be overwritten.
 * @param {import('./schema.js').Workspace} state
 */
export function hasCvWork(state) {
  return CV_KEYS.some(k => state.cv[k].length > 0) || Object.values(state.cv.linkedin).some(v => String(v).length > 0);
}

/** Source CV text is not a recorded profile fact.
 * @param {import('./schema.js').Workspace} state
 */
export function hasProfileFacts(state) {
  const p = state.profile;
  return PROFILE_KEYS.some(k => k !== 'cvText' && p[k].trim()) || p.targetRoles.some((/** @type {string} */ v) => v.trim())
    || Object.values(p.workPreferences).some(v => String(v).trim())
    || p.educationRows.some((/** @type {any} */ r) => r.title.trim()) || p.languageRows.some((/** @type {any} */ r) => r.language.trim());
}

/** @param {import('./schema.js').Workspace} state */
export function shouldAutoDraft(state) { return !state.cv.autoDrafted && !hasCvWork(state) && hasProfileFacts(state); }
