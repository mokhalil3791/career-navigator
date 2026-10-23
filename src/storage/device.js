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
 * Also picks up a v0.1 save from localStorage. The old copy is deleted ONLY after
 * the new copy was saved successfully, so a failed move never loses the user's work.
 * @returns {Promise<{ state: import('../core/schema.js').Workspace | null, message: string, error?: boolean }>}
 */
export async function loadSaved() {
  const legacy = readLegacy();
  if (legacy) {
    try {
      await save(legacy);
    } catch (_) {
      // Keep the v0.1 copy where it is; this session works without device saving.
      legacy.settings.remember = false;
      return { state: legacy, error: true, message: 'Your saved v0.1 workspace is open, but this browser did not let it be moved to the new storage. Your original saved copy has been kept. Download a backup to be safe.' };
    }
    removeLegacy();
    return { state: legacy, message: 'Your saved v0.1 workspace was moved to the new version.' };
  }
  const raw = await tx('readonly', (s) => s.get(KEY));
  if (!raw) return { state: null, message: '' };
  const state = normalizeWorkspace(migrate(JSON.parse(raw)));
  if (!state.settings.remember) { await clearSaved(); return { state: null, message: '' }; }
  return { state, message: 'Your saved workspace is open.' };
}

/**
 * Reads the v0.1 save without deleting it. A v0.1 copy without "remember" was not
 * meant to be kept, so it is removed (the same rule v0.1 used). An unreadable copy is left alone.
 */
function readLegacy() {
  let stored;
  try { stored = globalThis.localStorage?.getItem(LEGACY_KEY); } catch (_) { return null; }
  if (!stored) return null;
  try {
    const state = normalizeWorkspace(migrate(JSON.parse(stored)));
    if (!state.settings.remember) { removeLegacy(); return null; }
    return state;
  } catch (_) {
    return null;
  }
}

function removeLegacy() {
  try { globalThis.localStorage?.removeItem(LEGACY_KEY); } catch (_) { /* storage blocked */ }
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
 * Cache Storage names this app owns: our app-shell caches (src/sw.js) and the
 * caches the in-browser model library creates for downloaded models ("webllm/…").
 * @param {string} name
 */
export function isOwnCache(name) {
  return name.startsWith('career-navigator-') || name.startsWith('webllm/');
}

/**
 * "Delete everything" (NFR-SEC-5): our database (workspace and any saved API keys),
 * our legacy localStorage key and our caches. ONLY what this app owns: on GitHub
 * Pages other projects share the same origin, and their data must not be touched.
 */
export async function deleteEverything() {
  removeLegacy();
  try {
    const session = globalThis.sessionStorage;
    if (session) for (const key of Object.keys(session)) if (key.startsWith('career-navigator')) session.removeItem(key);
  } catch (_) { /* storage blocked */ }
  await new Promise((resolve) => {
    if (!globalThis.indexedDB) { resolve(null); return; }
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = request.onerror = request.onblocked = () => resolve(null);
  });
  if (globalThis.caches) for (const name of await caches.keys()) if (isOwnCache(name)) await caches.delete(name);
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
