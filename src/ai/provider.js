// @ts-check
/**
 * The AI provider contract (FR-AI-1) and registry. Every route (Gemini,
 * OpenRouter, Ollama, WebLLM) implements the same small interface, so pages
 * never care which one the user picked. Adding a provider = one file in
 * src/ai/providers/ + one entry in config/providers.json (FR-AI-9).
 *
 * @typedef {{ role: 'user' | 'assistant', content: string }} Message
 * @typedef {object} GenerateRequest
 * @property {string} [system]
 * @property {Message[]} messages
 * @property {any} [jsonSchema]   ask for JSON output (validated afterwards in parse.js)
 * @property {AbortSignal} [signal] the Stop button
 * @property {string} [model]
 *
 * @typedef {object} Provider
 * @property {string} id
 * @property {string} label
 * @property {{ streaming: boolean, json: boolean, maxContext: number }} capabilities
 * @property {any} config            its entry from config/providers.json
 * @property {(req: GenerateRequest) => AsyncIterable<string>} generate  yields text chunks
 * @property {() => Promise<{ id: string, label: string }[]>} listModels
 * @property {() => Promise<{ ok: boolean, message: string }>} checkConnection
 *
 * @typedef {(config: any, settings: { getKey: () => string, getModel: () => string, fetch: typeof fetch }) => Provider} ProviderFactory
 */

/** @type {Map<string, ProviderFactory>} */
const factories = new Map();

/**
 * @param {string} id must match an "id" in config/providers.json → api
 * @param {ProviderFactory} factory
 */
export function registerProvider(id, factory) {
  factories.set(id, factory);
}

/** @param {string} id */
export function providerFactory(id) {
  return factories.get(id);
}

/**
 * An error with a message a user can act on (FR-AI-4).
 */
export class AiError extends Error {
  /**
   * @param {'auth' | 'limit' | 'network' | 'blocked' | 'unsupported' | 'stopped' | 'other'} kind
   * @param {string} message
   */
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

/**
 * Plain-language message for an HTTP status from a provider.
 * @param {number} status
 * @param {string} label provider name for the message
 */
export function errorForStatus(status, label) {
  if (status === 401 || status === 403) return new AiError('auth', `${label} did not accept the key. Check that you copied the whole key, or create a new free key.`);
  if (status === 429) return new AiError('limit', 'You have reached today’s free limit. Try again later or switch to copy-paste.');
  if (status === 404) return new AiError('other', `${label} does not know this model. Choose another model in the list.`);
  if (status >= 500) return new AiError('network', `${label} is having problems right now. Try again in a few minutes, or switch to copy-paste.`);
  return new AiError('other', `${label} returned an error (${status}). Try again, or switch to copy-paste.`);
}

/**
 * Collects a whole streamed reply into one string.
 * @param {AsyncIterable<string>} chunks
 * @param {(soFar: string) => void} [onChunk]
 */
export async function collect(chunks, onChunk) {
  let text = '';
  for await (const chunk of chunks) { text += chunk; onChunk?.(text); }
  return text;
}
