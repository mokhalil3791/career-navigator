// @ts-check
/**
 * Strict value checkers, ported from v0.1 CareerCore. Each one either returns a
 * safe value or throws an Error whose message starts with the field path, so a
 * user sees exactly which part of a backup is wrong.
 */

/** Keys that could change an object's prototype if we copied them blindly. */
export const DANGEROUS_KEYS = ['__proto__', 'prototype', 'constructor'];

/**
 * @param {string} path
 * @param {string} reason
 * @returns {never}
 */
export function fail(path, reason) {
  throw new Error(path + ': ' + reason);
}

/**
 * A plain object (not an array, not a class instance).
 * @param {unknown} value
 * @param {string} path
 * @param {boolean} [fallback] when true, `undefined` becomes {}
 * @returns {Record<string, any>}
 */
export function record(value, path, fallback) {
  if (value === undefined && fallback) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'expected an object');
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) fail(path, 'expected a plain object');
  return /** @type {Record<string, any>} */ (value);
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {number} max maximum length in characters
 * @param {string} [fallback]
 * @returns {string}
 */
export function string(value, path, max, fallback) {
  if (value === undefined) return fallback === undefined ? '' : fallback;
  if (typeof value !== 'string') fail(path, 'expected text');
  if (value.length > max) fail(path, 'text is too long (maximum ' + max + ' characters)');
  return value;
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {boolean} [fallback]
 * @returns {boolean}
 */
export function boolean(value, path, fallback) {
  if (value === undefined) return fallback || false;
  if (typeof value !== 'boolean') fail(path, 'expected true or false');
  return value;
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @returns {number}
 */
export function integer(value, path, min, max, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) fail(path, 'expected a whole number between ' + min + ' and ' + max);
  return value;
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {number} max maximum number of entries
 * @returns {any[]}
 */
export function list(value, path, max) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail(path, 'expected a list');
  if (value.length > max) fail(path, 'too many entries (maximum ' + max + ')');
  return value;
}

/**
 * Letters, digits, "_" and "-" only, so IDs are safe as object keys and HTML ids.
 * @param {unknown} value
 * @param {string} path
 * @returns {string}
 */
export function identifier(value, path) {
  const id = string(value, path, 64);
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || DANGEROUS_KEYS.indexOf(id) !== -1) fail(path, 'invalid identifier');
  return id;
}

/**
 * An object of short texts keyed by identifiers (interview answers and notes).
 * @param {unknown} value
 * @param {string} path
 * @returns {Record<string, string>}
 */
export function dictionary(value, path) {
  const src = record(value, path, true);
  /** @type {Record<string, string>} */
  const dst = {};
  const keys = Object.keys(src);
  if (keys.length > 32) fail(path, 'too many answers (maximum 32)');
  keys.forEach(function (key) {
    identifier(key, path + ' key');
    dst[key] = string(src[key], path + '.' + key, 12000);
  });
  return dst;
}

/**
 * One option from a fixed list; anything else becomes the fallback.
 * @template {string} T
 * @param {unknown} value
 * @param {string} path
 * @param {readonly T[]} options
 * @param {T} fallback
 * @returns {T}
 */
export function oneOf(value, path, options, fallback) {
  if (value === undefined || value === '') return fallback;
  const text = string(value, path, 64);
  return /** @type {T} */ (options.indexOf(/** @type {T} */ (text)) === -1 ? fallback : text);
}
