// @ts-check
/**
 * Backup files: strict import (ported from v0.1 parseWorkspace) and export.
 */
import { fail } from './validate.js';
import { normalizeWorkspace } from './schema.js';
import { migrate } from './migrate.js';

/** 1 MiB: the largest backup we accept. */
export const MAX_BYTES = 1048576;
/** The workspace stops growing a little before the backup limit, so it can always be exported. */
export const MAX_WORKSPACE_BYTES = 950000;

/**
 * @param {string} text
 * @returns {number} size in UTF-8 bytes
 */
export function byteLength(text) {
  return new TextEncoder().encode(text).length;
}

/**
 * Reads a backup file. Imports never switch on device saving and never keep
 * the "CV reviewed" tick: a file is not consent, and not a fresh review (guardrail G6).
 * @param {unknown} text the file contents
 * @returns {import('./schema.js').Workspace}
 */
export function parseWorkspace(text) {
  if (typeof text !== 'string') fail('Backup', 'expected JSON text');
  // Check length first to avoid allocating a second huge buffer.
  if (text.length > MAX_BYTES) fail('Backup', 'file exceeds one MiB');
  if (byteLength(text) > MAX_BYTES) fail('Backup', 'file exceeds one MiB');
  let value;
  try { value = JSON.parse(text); } catch (_) { fail('Backup', 'invalid JSON; choose a Career Navigator backup'); }
  const result = normalizeWorkspace(migrate(value));
  result.settings.remember = false;
  result.cv.reviewed = false;
  return result;
}

/**
 * Backup text for download. Device saving is always written as off.
 * The output is checked with parseWorkspace so we never hand out a file we cannot read back.
 * @param {import('./schema.js').Workspace} state
 * @returns {string}
 */
export function serializeWorkspace(state) {
  const text = JSON.stringify(Object.assign({}, state, { settings: Object.assign({}, state.settings, { remember: false }) }), null, 2);
  parseWorkspace(text);
  return text;
}
