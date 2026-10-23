// @ts-check
/**
 * Upgrades saved workspaces from older schema versions, one step at a time.
 * v0.1 backups are schema 1. Schema 2 keeps every schema-1 field unchanged and
 * adds optional sections with defaults, so the 1 → 2 step only changes the number.
 * A future reshape (for example splitting a text field into rows) adds a new step
 * here, with its own test in tests/unit/migrate.test.js.
 */
import { DANGEROUS_KEYS, fail, record } from './validate.js';
import { SCHEMA_VERSION } from './schema.js';

/**
 * Copies own keys, skipping "__proto__" and friends. (Object.assign would run the
 * __proto__ setter for a JSON key named "__proto__" and change the prototype.)
 * @param {Record<string, any>} input
 */
function safeCopy(input) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const key of Object.keys(input)) if (!DANGEROUS_KEYS.includes(key)) out[key] = input[key];
  return out;
}

/** @type {Record<number, (input: Record<string, any>) => Record<string, any>>} */
const STEPS = {
  1: function (input) { const out = safeCopy(input); out.schemaVersion = 2; return out; },
};

/**
 * @param {unknown} input parsed JSON of any supported version
 * @returns {Record<string, any>} the same data at the current schema version (not yet normalised)
 */
export function migrate(input) {
  let data = record(input, 'Workspace');
  if (typeof data.schemaVersion !== 'number' || !(data.schemaVersion in STEPS || data.schemaVersion === SCHEMA_VERSION)) {
    fail('Workspace', 'unsupported or missing schemaVersion; this version accepts schema 1 or 2');
  }
  while (data.schemaVersion < SCHEMA_VERSION) data = STEPS[data.schemaVersion](data);
  return data;
}
