// @ts-check
/**
 * Opt-in device saving (principle 4: private by default). Nothing is stored
 * unless the user switches on "Save on this device". Uses IndexedDB, which
 * holds more than localStorage. If the browser blocks storage (private mode,
 * some in-app browsers), saving switches itself off and the app keeps working.
 */
import { migrate } from '../core/migrate.js';
import { normalizeWorkspace } from '../core/schema.js';

const DB_NAME = 'career-navigator';
const STORE = 'kv';
const KEY = 'workspace';
/** The key v0.1 used in localStorage (same origin once Phase 0 is hosted). */
export const LEGACY_KEY = 'career-navigator.workspace.v1';

/** @returns {Promise<IDBDatabase>} */
function open() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('No IndexedDB')); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * @param {'readonly'|'readwrite'} mode
 * @param {(store: IDBObjectStore) => IDBRequest} run
 * @param {string} [storeName]
 */
async function tx(mode, run, storeName = STORE) {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const request = run(transaction.objectStore(storeName));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

/**
 * Loads the saved workspace, if the user had device saving on.
 * Also picks up a v0.1 save from localStorage once, then deletes it.
 * @returns {Promise<{ state: import('../core/schema.js').Workspace | null, message: string }>}
 */
export async function loadSaved() {
  const legacy = readLegacy();
  if (legacy) {
    await save(legacy).catch(() => {});
    return { state: legacy, message: 'Your saved v0.1 workspace was moved to the new version.' };
  }
  const raw = await tx('readonly', (s) => s.get(KEY));
  if (!raw) return { state: null, message: '' };
  const state = normalizeWorkspace(migrate(JSON.parse(raw)));
  if (!state.settings.remember) { await clearSaved(); return { state: null, message: '' }; }
  return { state, message: 'Your saved workspace is open.' };
}

/** v0.1 kept data only when remember was true; otherwise it removed the key (same here). */
function readLegacy() {
  try {
    const stored = globalThis.localStorage?.getItem(LEGACY_KEY);
    if (!stored) return null;
    globalThis.localStorage.removeItem(LEGACY_KEY);
    const state = normalizeWorkspace(migrate(JSON.parse(stored)));
    return state.settings.remember ? state : null;
  } catch (_) {
    return null;
  }
}

/** @param {import('../core/schema.js').Workspace} state */
export async function save(state) {
  if (!state.settings.remember) return;
  await tx('readwrite', (s) => s.put(JSON.stringify(state), KEY));
}

/** Removes the saved workspace. */
export async function clearSaved() {
  try { globalThis.localStorage?.removeItem(LEGACY_KEY); } catch (_) { /* storage blocked */ }
  await tx('readwrite', (s) => s.delete(KEY));
}

/**
 * "Delete everything" (NFR-SEC-5): the database (workspace and any saved API keys),
 * legacy localStorage, and every Cache Storage entry this app created.
 */
export async function deleteEverything() {
  try { globalThis.localStorage?.clear(); globalThis.sessionStorage?.clear(); } catch (_) { /* storage blocked */ }
  await new Promise((resolve) => {
    if (!globalThis.indexedDB) { resolve(null); return; }
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = request.onerror = request.onblocked = () => resolve(null);
  });
  if (globalThis.caches) for (const name of await caches.keys()) await caches.delete(name);
}

/** Small key/value helpers for other opt-in data (e.g. a saved API key). */
export const kv = {
  /** @param {string} key */
  get: (key) => tx('readonly', (s) => s.get(key)),
  /** @param {string} key @param {unknown} value */
  set: (key, value) => tx('readwrite', (s) => s.put(value, key)),
  /** @param {string} key */
  delete: (key) => tx('readwrite', (s) => s.delete(key)),
};
