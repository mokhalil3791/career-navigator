// @ts-check
/**
 * Every change to the workspace is an "action" handled here. reduce() never
 * changes its input; it returns a new workspace. Ported from the v0.1 click
 * and input handlers.
 *
 * Two safety rules live here, in one place each:
 *  - invalidatesReview(): any profile, CV or job edit re-locks the CV export (G3).
 *  - AI-originated actions are refused unless acceptedByUser is set to true (G4, principle 3).
 */
import { DANGEROUS_KEYS } from './validate.js';
import { MAX_JOBS, MAX_REQUIREMENTS } from './schema.js';
import { draftCvFromProfile } from './cv.js';
import { planFromRole } from './plan.js';

/** Row lists that can be edited with addRow / editRow / removeRow. */
export const ROW_PATHS = ['profile.languageRows', 'profile.educationRows', 'applications', 'plan.checkins', 'ai.customPrompts', 'coachNotes'];

/** Row limits, matching normalizeWorkspace. */
/** @type {Record<string, number>} */
const ROW_LIMITS = { 'profile.languageRows': 12, 'profile.educationRows': 10, applications: 60, 'plan.checkins': 60, 'ai.customPrompts': 20, coachNotes: 100 };

/**
 * @typedef {{ type: string, origin?: 'ai', acceptedByUser?: boolean, [key: string]: any }} Action
 */

/**
 * True when this action changes something the CV review covers.
 * @param {Action} action
 */
export function invalidatesReview(action) {
  switch (action.type) {
    case 'set':
      return action.path.startsWith('profile.') || (action.path.startsWith('cv.') && action.path !== 'cv.reviewed' && !action.path.startsWith('cv.linkedin.'));
    case 'addRow': case 'editRow': case 'removeRow':
      return action.path.startsWith('profile.');
    case 'addJob': case 'selectJob': case 'removeJob': case 'editJob': case 'setJobFacts':
    case 'addRequirement': case 'removeRequirement': case 'editRequirement':
    case 'draftCv': case 'setCv':
      return true;
    default:
      return false;
  }
}

/**
 * Splits "a.b.0" into keys and refuses prototype-changing keys.
 * @param {string} path
 */
function keysOf(path) {
  const parts = String(path).split('.');
  if (parts.some((k) => DANGEROUS_KEYS.includes(k) || k === '')) throw new Error('Invalid field path');
  return parts;
}

/**
 * Sets a value at an existing path; the new value must have the same type as the old one.
 * @param {any} state
 * @param {string} path
 * @param {unknown} value
 */
function setAt(state, path, value) {
  const parts = keysOf(path);
  const leaf = /** @type {string} */ (parts.pop());
  let obj = state;
  for (const k of parts) {
    if (obj === null || typeof obj !== 'object' || !Object.prototype.hasOwnProperty.call(obj, k)) throw new Error('Unknown field: ' + path);
    obj = obj[k];
  }
  const isDictionary = path.startsWith('interview.answers.') || path.startsWith('interview.notes.') || path.startsWith('profile.targetRoles.');
  if (!isDictionary && !Object.prototype.hasOwnProperty.call(obj, leaf)) throw new Error('Unknown field: ' + path);
  if (Object.prototype.hasOwnProperty.call(obj, leaf) && typeof obj[leaf] !== typeof value) throw new Error('Wrong value type for ' + path);
  obj[leaf] = value;
}

/** @param {any} state @param {string} path */
function getAt(state, path) {
  return keysOf(path).reduce((o, k) => (o == null ? undefined : o[k]), state);
}

/** @param {any} state */
function selected(state) {
  return state.jobs.find((/** @type {any} */ j) => j.id === state.selectedJobId) || state.jobs[0] || null;
}

/**
 * @param {import('./schema.js').Workspace} state
 * @param {Action} action
 * @returns {import('./schema.js').Workspace}
 */
export function reduce(state, action) {
  if (action.origin === 'ai' && action.acceptedByUser !== true) {
    throw new Error('AI suggestions are applied only after you accept them.');
  }
  if (action.type === 'replace') return structuredClone(action.state);
  /** @type {any} */
  const next = structuredClone(state);
  switch (action.type) {
    case 'set': {
      let value = action.value;
      if (action.path === 'plan.hours') value = Math.min(40, Math.max(1, Math.round(Number(value) || 6)));
      setAt(next, action.path, value);
      break;
    }
    case 'addJob': {
      if (next.jobs.length >= MAX_JOBS) throw new Error('You can keep up to 8 adverts in one workspace.');
      next.jobs.push({ id: action.id, title: action.title || '', company: action.company || '', url: action.url || '', body: action.body || '', reason: '', requirements: [] });
      next.selectedJobId = action.id;
      break;
    }
    case 'selectJob': next.selectedJobId = action.id; break;
    case 'removeJob':
      next.jobs = next.jobs.filter((/** @type {any} */ j) => j.id !== action.id);
      if (next.selectedJobId === action.id) next.selectedJobId = next.jobs[0]?.id || '';
      break;
    case 'moveJob': {
      const i = next.jobs.findIndex((/** @type {any} */ j) => j.id === action.id);
      const n = i + Number(action.direction);
      if (i < 0 || n < 0 || n >= next.jobs.length) return state;
      [next.jobs[i], next.jobs[n]] = [next.jobs[n], next.jobs[i]];
      break;
    }
    case 'editJob': {
      const j = next.jobs.find((/** @type {any} */ x) => x.id === action.id);
      if (!j || !['title', 'company', 'url', 'body', 'reason'].includes(action.key)) throw new Error('Unknown advert field');
      j[action.key] = String(action.value);
      break;
    }
    case 'setJobFacts': {
      const j = next.jobs.find((/** @type {any} */ x) => x.id === action.id);
      if (!j) throw new Error('Unknown advert');
      j.facts = Object.assign({ hours: '', location: '', dutch: '', dutchLevel: '' }, j.facts, action.facts);
      break;
    }
    case 'addRequirement': {
      const j = action.jobId ? next.jobs.find((/** @type {any} */ x) => x.id === action.jobId) : selected(next);
      if (!j || j.requirements.length >= MAX_REQUIREMENTS) return state;
      /** @type {any} */
      const r = { id: action.id, text: action.text || '', status: action.status || 'unknown', evidence: action.evidence || '', nextStep: action.nextStep || '' };
      if (action.kind) r.kind = action.kind;
      j.requirements.push(r);
      break;
    }
    case 'removeRequirement': {
      const j = selected(next);
      if (!j) return state;
      j.requirements = j.requirements.filter((/** @type {any} */ r) => r.id !== action.id);
      break;
    }
    case 'editRequirement': {
      const j = action.jobId ? next.jobs.find((/** @type {any} */ x) => x.id === action.jobId) : selected(next);
      const r = j?.requirements.find((/** @type {any} */ x) => x.id === action.id);
      if (!r || !['text', 'status', 'evidence', 'nextStep', 'kind'].includes(action.key)) throw new Error('Unknown requirement field');
      r[action.key] = String(action.value);
      break;
    }
    case 'draftCv': next.cv = draftCvFromProfile(next); break;
    case 'setCv': Object.assign(next.cv, action.fields); break;
    case 'setReviewed': next.cv.reviewed = action.value === true; break;
    case 'applyTemplate': {
      const plan = planFromRole(action.role);
      // Keep the user's own dates and check-ins when switching template.
      plan.checkins = next.plan.checkins;
      next.plan = plan;
      break;
    }
    case 'question': {
      const count = Math.max(1, Number(action.count) || 1);
      next.interview.questionIndex = Math.max(0, Math.min(count - 1, next.interview.questionIndex + Number(action.direction)));
      break;
    }
    case 'addRow': {
      if (!ROW_PATHS.includes(action.path)) throw new Error('Unknown list');
      const rows = getAt(next, action.path);
      if (rows.length >= ROW_LIMITS[action.path]) throw new Error('This list is full.');
      rows.push(action.row);
      break;
    }
    case 'editRow': {
      if (!ROW_PATHS.includes(action.path)) throw new Error('Unknown list');
      const row = getAt(next, action.path).find((/** @type {any} */ r) => r.id === action.id);
      if (!row || DANGEROUS_KEYS.includes(action.key) || !(action.key in row) || action.key === 'id') throw new Error('Unknown field');
      row[action.key] = action.value;
      break;
    }
    case 'removeRow': {
      if (!ROW_PATHS.includes(action.path)) throw new Error('Unknown list');
      setAt(next, action.path, getAt(next, action.path).filter((/** @type {any} */ r) => r.id !== action.id));
      break;
    }
    default:
      throw new Error('Unknown action: ' + action.type);
  }
  if (invalidatesReview(action)) next.cv.reviewed = false;
  if (!next.jobs.some((/** @type {any} */ j) => j.id === next.selectedJobId)) next.selectedJobId = next.jobs[0]?.id || '';
  return next;
}
