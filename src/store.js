// @ts-check
/**
 * The one place that holds the current workspace. Pages call dispatch() or
 * update(); subscribers (the screen and device saving) run after each change.
 * Same simple mental model as v0.1, but every change goes through core/reducers.js.
 */
import { reduce } from './core/reducers.js';
import { byteLength, MAX_WORKSPACE_BYTES } from './core/backup.js';
import { normalizeWorkspace } from './core/schema.js';

/**
 * @param {import('./core/schema.js').Workspace} initial
 */
export function createStore(initial) {
  let state = initial;
  /** @type {Set<(state: any, action: any) => void>} */
  const listeners = new Set();

  /**
   * Applies an action. Returns an error message instead of throwing, so pages
   * can show it in the notice area while the user's work stays as it was.
   * @param {import('./core/reducers.js').Action} action
   * @returns {{ ok: true } | { ok: false, error: string }}
   */
  function dispatch(action) {
    let next;
    try { next = reduce(state, action); } catch (error) { return { ok: false, error: /** @type {Error} */ (error).message }; }
    if (next === state) return { ok: true };
    if (action.type !== 'replace' && byteLength(JSON.stringify(next)) > MAX_WORKSPACE_BYTES) {
      return { ok: false, error: 'This workspace is nearly full. Shorten a long advert or draft, or download a work pack and start a new workspace.' };
    }
    // The workspace must always stay exportable, so every change is checked
    // against the same rules as a backup import (length limits, statuses, ids).
    try { normalizeWorkspace(next); } catch (error) { return { ok: false, error: /** @type {Error} */ (error).message }; }
    state = next;
    listeners.forEach((fn) => fn(state, action));
    return { ok: true };
  }

  return {
    /** @returns {import('./core/schema.js').Workspace} */
    getState: () => state,
    dispatch,
    /** Shortcut for a single field, e.g. update('profile.city', 'Den Haag'). @param {string} path @param {unknown} value */
    update: (path, value) => dispatch({ type: 'set', path, value }),
    /** @param {(state: any, action: any) => void} fn @returns {() => void} unsubscribe */
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

/** @typedef {ReturnType<typeof createStore>} Store */
