// @ts-check
/**
 * The only door from the app to an AI provider (principle 4, NFR-SEC-1).
 * A request goes out ONLY if the user enabled that provider and confirmed,
 * in this session, that they saw the exact outgoing text and the destination.
 * Everything else is refused before the browser makes a request.
 */
import { AiError } from './provider.js';

/** Origins the user confirmed in this session (cleared on reload). @type {Set<string>} */
const confirmed = new Set();

/** Explicit Advanced → OpenRouter selection may fetch this public catalogue only.
 * It grants no permission to send prompts and sends no credentials or workspace data.
 * @param {typeof fetch} [fetchImpl]
 */
export function publicOpenRouterModels(fetchImpl = fetch) {
  return fetchImpl('https://openrouter.ai/api/v1/models', { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
}

/**
 * Records that the user saw the outgoing text and the destination host, and pressed Send.
 * @param {string[]} origins
 */
export function confirmHosts(origins) {
  for (const o of origins) confirmed.add(o);
}

/** @param {string[]} origins */
export function isConfirmed(origins) {
  return origins.length > 0 && origins.every((o) => confirmed.has(o));
}

/** Forget every confirmation (e.g. after "Forget key" or "Delete everything"). */
export function resetConfirmations() {
  confirmed.clear();
}

/**
 * @param {string} url
 * @param {RequestInit} [init]
 * @param {typeof fetch} [fetchImpl]
 */
export async function guardedFetch(url, init, fetchImpl = fetch) {
  const origin = new URL(url).origin;
  if (!confirmed.has(origin)) throw new AiError('blocked', 'This AI request was blocked because you have not confirmed sending to ' + new URL(url).host + ' in this session.');
  try {
    return await fetchImpl(url, { ...init, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
  } catch (error) {
    if (/** @type {any} */ (error)?.name === 'AbortError') throw new AiError('stopped', 'Stopped.');
    throw new AiError('network', 'Could not reach ' + new URL(url).host + '. Check your internet connection, or switch to copy-paste.');
  }
}
