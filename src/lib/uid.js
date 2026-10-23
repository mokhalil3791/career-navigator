// @ts-check
/**
 * A unique id such as "job-3f2a…". Ported from v0.1. Only letters, digits and "-",
 * so it always passes the identifier check in core/validate.js.
 * @param {string} prefix
 */
export function uid(prefix) {
  const random = globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  return (prefix + '-' + random).slice(0, 64);
}
