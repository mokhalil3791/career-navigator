// Contract tests: every adapter against recorded/mock responses (no real provider is ever called).
import { describe, expect, it, beforeEach } from 'vitest';
import * as session from '../../src/ai/session.js';
import { resetConfirmations } from '../../src/ai/net.js';
import { isFreeModel } from '../../src/ai/providers/openrouter.js';

/** A fake fetch that records calls and replays canned responses. */
function mockFetch(/** @type {(url: string, init: any) => { status?: number, body: string, type?: string }} */ reply) {
  /** @type {{ url: string, init: any }[]} */
  const calls = [];
  const fn = async (/** @type {string} */ url, /** @type {any} */ init) => {
    calls.push({ url, init });
    const r = reply(url, init);
    return new Response(r.body, { status: r.status || 200, headers: { 'Content-Type': r.type || 'text/event-stream' } });
  };
  return { fn: /** @type {typeof fetch} */ (/** @type {any} */ (fn)), calls };
}

const sse = (/** @type {any[]} */ events) => events.map((e) => 'data: ' + JSON.stringify(e) + '\n\n').join('') ;
const request = { messages: [{ role: /** @type {'user'} */ ('user'), content: 'Hello' }] };

beforeEach(() => { session.clearSession(); resetConfirmations(); });

describe('contract: every API provider in config has an adapter with the full interface', () => {
  for (const config of session.API_PROVIDERS) {
    it(config.id, () => {
      const p = session.providerFor(config.id);
      expect(typeof p.generate).toBe('function');
      expect(typeof p.listModels).toBe('function');
      expect(typeof p.checkConnection).toBe('function');
      expect(p.capabilities).toMatchObject({ streaming: expect.any(Boolean), json: expect.any(Boolean), maxContext: expect.any(Number) });
      expect(config.cost).toBe('free');
    });
  }
});

describe('principle 4: nothing is sent before the user confirms', () => {
  it('send() refuses until confirmSending() for that provider', async () => {
    const { fn, calls } = mockFetch(() => ({ body: '' }));
    await session.setKey('gemini', 'k', { remember: false });
    await expect(session.send('gemini', request, undefined, fn)).rejects.toThrow(/press Send first/);
    expect(calls).toHaveLength(0);
  });
  it('even a direct adapter call is blocked by the network guard', async () => {
    const { fn, calls } = mockFetch(() => ({ body: '' }));
    await session.setKey('gemini', 'k', { remember: false });
    const chunks = session.providerFor('gemini', fn).generate(request);
    await expect(chunks[Symbol.asyncIterator]().next()).rejects.toThrow(/blocked/);
    expect(calls).toHaveLength(0);
  });
});

describe('gemini', () => {
  it('streams text, sends the key in a header (never the URL), asks for JSON when needed', async () => {
    const { fn, calls } = mockFetch(() => ({ body: sse([{ candidates: [{ content: { parts: [{ text: 'Hel' }] } }] }, { candidates: [{ content: { parts: [{ text: 'lo' }] } }] }]) }));
    await session.setKey('gemini', 'secret-key', { remember: false });
    session.confirmSending('gemini');
    const chunks = [];
    const text = await session.send('gemini', { ...request, jsonSchema: {} }, (t) => chunks.push(t), fn);
    expect(text).toBe('Hello');
    expect(chunks).toEqual(['Hel', 'Hello']);
    expect(calls[0].url).toMatch(/^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-2\.5-flash:streamGenerateContent\?alt=sse$/);
    expect(calls[0].url).not.toContain('secret-key');
    expect(calls[0].init.headers['x-goog-api-key']).toBe('secret-key');
    expect(calls[0].init.credentials).toBe('omit');
    expect(JSON.parse(calls[0].init.body).generationConfig.responseMimeType).toBe('application/json');
  });
  for (const [status, message] of [[401, /did not accept the key/], [403, /did not accept the key/], [429, /reached today’s free limit/], [503, /having problems/]]) {
    it(`maps HTTP ${status} to a plain-language message (FR-AI-4)`, async () => {
      const { fn } = mockFetch(() => ({ status: /** @type {number} */ (status), body: '{}' }));
      await session.setKey('gemini', 'k', { remember: false });
      session.confirmSending('gemini');
      await expect(session.send('gemini', request, undefined, fn)).rejects.toThrow(/** @type {RegExp} */ (message));
    });
  }
  it('maps a network failure to a plain-language message', async () => {
    const fn = /** @type {typeof fetch} */ (async () => { throw new TypeError('Failed to fetch'); });
    await session.setKey('gemini', 'k', { remember: false });
    session.confirmSending('gemini');
    await expect(session.send('gemini', request, undefined, fn)).rejects.toThrow(/Could not reach generativelanguage\.googleapis\.com/);
  });
  it('lists only Gemini text models', async () => {
    const { fn } = mockFetch(() => ({ type: 'application/json', body: JSON.stringify({ models: [{ name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', supportedGenerationMethods: ['generateContent'] }, { name: 'models/embedding-001', supportedGenerationMethods: ['embedContent'] }] }) }));
    await session.setKey('gemini', 'k', { remember: false });
    const result = await session.checkConnection('gemini', fn);
    expect(result.ok).toBe(true);
    expect(result.message).toContain('1 models');
  });
});

describe('openrouter', () => {
  it('streams OpenAI-style deltas and refuses non-free models (principle 5)', async () => {
    const { fn, calls } = mockFetch(() => ({ body: sse([{ choices: [{ delta: { content: 'Hi' } }] }]) + 'data: [DONE]\n\n' }));
    await session.setKey('openrouter', 'or-key', { remember: false });
    session.confirmSending('openrouter');
    expect(await session.send('openrouter', request, undefined, fn)).toBe('Hi');
    expect(calls[0].init.headers.Authorization).toBe('Bearer or-key');
    session.setModel('openrouter', 'openai/gpt-paid');
    await expect(session.send('openrouter', request, undefined, fn)).rejects.toThrow(/Only free models/);
  });
  it('isFreeModel', () => {
    expect(isFreeModel({ id: 'x/y:free' })).toBe(true);
    expect(isFreeModel({ id: 'x/y', pricing: { prompt: '0', completion: '0' } })).toBe(false);
    expect(isFreeModel({ id: 'x/y', pricing: { prompt: '0.000001', completion: '0' } })).toBe(false);
  });
});

describe('ollama', () => {
  it('streams NDJSON from localhost and explains OLLAMA_ORIGINS when unreachable', async () => {
    const { fn, calls } = mockFetch(() => ({ type: 'application/x-ndjson', body: '{"message":{"content":"Hal"}}\n{"message":{"content":"lo"},"done":true}\n' }));
    session.confirmSending('ollama');
    expect(await session.send('ollama', request, undefined, fn)).toBe('Hallo');
    expect(calls[0].url).toBe('http://localhost:11434/api/chat');
    const down = /** @type {typeof fetch} */ (async () => { throw new TypeError('Failed'); });
    await expect(session.send('ollama', request, undefined, down)).rejects.toThrow(/OLLAMA_ORIGINS/);
  });
});

describe('keys (FR-AI-5)', () => {
  it('are in memory by default, saved only on opt-in, and forgotten in one call', async () => {
    /** @type {Map<string, any>} */
    const store = new Map();
    const storage = { kv: { get: async (/** @type {string} */ k) => store.get(k), set: async (/** @type {string} */ k, /** @type {any} */ v) => store.set(k, v), delete: async (/** @type {string} */ k) => store.delete(k) } };
    await session.setKey('gemini', 'abc', { remember: false, storage });
    expect(store.size).toBe(0);
    await session.setKey('gemini', 'abc', { remember: true, storage });
    expect(store.get('ai-key:gemini')).toBe('abc');
    await session.forgetKey('gemini', storage);
    expect(store.size).toBe(0);
    expect(session.getKey('gemini')).toBe('');
  });
});
