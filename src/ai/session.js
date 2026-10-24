// @ts-check
/**
 * The user's AI choice for this browser session: which free route, which model,
 * and the API key. Keys live in memory only (FR-AI-5). Saving a key on the
 * device is a separate opt-in, and "Forget key" removes it at once.
 * Keys are never part of the workspace, so they never end up in a backup or coach pack.
 */
import providers from '../../config/providers.json';
import { providerFactory, AiError, collect } from './provider.js';
import { confirmHosts, guardedFetch, isConfirmed, resetConfirmations } from './net.js';
import './providers/index.js';

/** @typedef {{ kv: { get: (k: string) => Promise<any>, set: (k: string, v: any) => Promise<any>, delete: (k: string) => Promise<any> } }} Storage */

const KEY_PREFIX = 'ai-key:';

/** @type {{ route: string, model: Record<string, string>, keys: Record<string, string>, savedKeys: Set<string> }} */
const session = { route: 'copy', model: {}, keys: {}, savedKeys: new Set() };

/** Free API providers from config, in display order. */
export const API_PROVIDERS = /** @type {any[]} */ (providers.api);

/** @param {string} id */
export function providerConfig(id) {
  return API_PROVIDERS.find((p) => p.id === id);
}

/** Exact origins (no wildcards) a provider sends user text to. @param {any} config */
export function contentOrigins(config) {
  if (config.kind === 'device') return [];
  return [new URL(config.endpoint).origin];
}

export const getRoute = () => session.route;
/** @param {string} route 'copy' or an api provider id */
export function setRoute(route) { session.route = ['copy', 'browser'].includes(route) || providerConfig(route) ? route : 'copy'; }
/** @param {string} id */
export const getKey = (id) => session.keys[id] || '';
/** @param {string} id */
export const getModel = (id) => session.model[id] ?? providerConfig(id)?.defaultModel ?? '';
/** @param {string} id @param {string} model */
export function setModel(id, model) { session.model[id] = model; }
/** @param {string} id */
export const isKeySaved = (id) => session.savedKeys.has(id);

/**
 * @param {string} id
 * @param {string} key
 * @param {{ remember: boolean, storage?: Storage }} opts
 */
export async function setKey(id, key, opts) {
  session.keys[id] = key.trim();
  if (opts.remember && opts.storage) { await opts.storage.kv.set(KEY_PREFIX + id, session.keys[id]); session.savedKeys.add(id); }
  else if (opts.storage && session.savedKeys.has(id)) { await opts.storage.kv.delete(KEY_PREFIX + id); session.savedKeys.delete(id); }
}

/** "Forget key": removes the key from memory and from the device. @param {string} id @param {Storage} [storage] */
export async function forgetKey(id, storage) {
  delete session.keys[id];
  session.savedKeys.delete(id);
  resetConfirmations();
  await storage?.kv.delete(KEY_PREFIX + id).catch(() => {});
}

/** Loads keys the user chose to save on this device. @param {Storage} storage */
export async function loadSavedKeys(storage) {
  for (const p of API_PROVIDERS.filter((x) => x.kind === 'key')) {
    const key = await storage.kv.get(KEY_PREFIX + p.id).catch(() => undefined);
    if (key) { session.keys[p.id] = key; session.savedKeys.add(p.id); }
  }
}

/** Clears everything (used by "Delete everything"). */
export function clearSession() {
  session.keys = {}; session.model = {}; session.savedKeys.clear(); session.route = 'copy';
  resetConfirmations();
}

/**
 * @param {string} id
 * @param {typeof fetch} [fetchImpl] for tests
 * @returns {import('./provider.js').Provider}
 */
export function providerFor(id, fetchImpl) {
  const config = providerConfig(id);
  const factory = providerFactory(id);
  if (!config || !factory) throw new AiError('unsupported', 'Unknown AI provider: ' + id);
  return factory(config, { getKey: () => getKey(id), getModel: () => getModel(id), fetch: (url, init) => guardedFetch(String(url), init, fetchImpl) });
}

/** Whether the user already confirmed sending to this provider in this session. @param {string} id */
export function needsHostConfirmation(id) {
  const config = providerConfig(id);
  return config ? !isConfirmed(contentOrigins(config)) && contentOrigins(config).length > 0 : false;
}

/**
 * The user pressed Send after reading the exact text (and, first time, the destination).
 * @param {string} id
 */
export function confirmSending(id) {
  const config = providerConfig(id);
  if (config) confirmHosts(contentOrigins(config));
}

/**
 * The user clicked "Check connection" for a provider: only the key is sent, no workspace text.
 * @param {string} id
 * @param {typeof fetch} [fetchImpl]
 */
export async function checkConnection(id, fetchImpl) {
  confirmSending(id);
  return providerFor(id, fetchImpl).checkConnection();
}

/**
 * Sends one request. Refuses unless the user confirmed this provider in this session (principle 4).
 * @param {string} id
 * @param {import('./provider.js').GenerateRequest} request
 * @param {(soFar: string) => void} [onChunk]
 * @param {typeof fetch} [fetchImpl]
 */
export async function send(id, request, onChunk, fetchImpl) {
  const config = providerConfig(id);
  if (!config) throw new AiError('unsupported', 'Unknown AI provider.');
  if (contentOrigins(config).length && !isConfirmed(contentOrigins(config))) throw new AiError('blocked', 'Read the outgoing text and press Send first.');
  return collect(providerFor(id, fetchImpl).generate(request), onChunk);
}
