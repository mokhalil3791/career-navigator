// @ts-check
/**
 * Reads structured answers from any AI: a built-in provider in JSON mode, or a
 * whole chat reply the user pasted back (copy-paste route). It finds the JSON,
 * checks it against the task's schema, and reports problems in plain words.
 */
import { validate } from '../content/json-schema.js';

/**
 * Finds the first JSON object in a reply: a ```json fenced block, or the
 * outermost {...} in the text.
 * @param {string} text
 * @returns {unknown | undefined}
 */
export function findJson(text) {
  const candidates = [];
  for (const m of String(text).matchAll(/```(?:json)?\s*\n?([\s\S]*?)```/gi)) candidates.push(m[1]);
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start !== -1 && end > start) candidates.push(text.slice(start, end + 1));
  for (const c of candidates) {
    try { return JSON.parse(c.trim()); } catch (_) { /* try the next candidate */ }
  }
  return undefined;
}

/**
 * @param {string} text the AI reply
 * @param {any} schema JSON Schema for this task
 * @returns {{ ok: true, value: any } | { ok: false, error: string }}
 */
export function parseStructured(text, schema) {
  const value = findJson(text);
  if (value === undefined) return { ok: false, error: 'The reply did not contain the JSON block the prompt asked for.' };
  const errors = validate(schema, value);
  if (errors.length) return { ok: false, error: 'The reply did not match the expected shape (' + errors.slice(0, 2).join('; ') + ').' };
  return { ok: true, value };
}

/**
 * FR-AI-3: request JSON, validate, retry once on failure, then fall back to raw text.
 * @param {() => Promise<string>} run produces one complete AI reply
 * @param {any} schema
 * @returns {Promise<{ ok: true, value: any, raw: string } | { ok: false, raw: string, error: string }>}
 */
export async function withRetry(run, schema) {
  let raw = await run();
  let result = parseStructured(raw, schema);
  if (result.ok) return { ok: true, value: result.value, raw };
  raw = await run();
  result = parseStructured(raw, schema);
  if (result.ok) return { ok: true, value: result.value, raw };
  return { ok: false, raw, error: result.error };
}
