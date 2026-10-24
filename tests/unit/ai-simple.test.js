import { describe, it, expect, vi, afterEach } from 'vitest';
import { freeCatalogue } from '../../src/ai/openrouter-catalogue.js';
import { browserAvailability, sendOnComputer } from '../../src/ai/browser-ai.js';
import { normalizeWorkspace, newWorkspace } from '../../src/core/schema.js';
import { parseWorkspace } from '../../src/core/backup.js';
afterEach(() => vi.unstubAllGlobals());
describe('simple AI preferences and local capability', () => {
  it('migrates older settings and keeps the new choice through a backup without enabling saving', () => {
    const old = newWorkspace(); delete old.settings.aiChat; delete old.settings.aiChatUrl;
    expect(normalizeWorkspace(old).settings.aiChat).toBe('');
    old.settings.aiChat = 'claude'; old.settings.aiRoute = 'browser'; old.settings.remember = true;
    const restored = parseWorkspace(JSON.stringify(old));
    expect(restored.settings.aiChat).toBe('claude'); expect(restored.settings.aiRoute).toBe('browser');
    expect(restored.settings.remember).toBe(false);
  });
  it('absence or a rejected availability check stays unavailable without a download', async () => {
    vi.stubGlobal('LanguageModel', undefined); expect(await browserAvailability()).toBe('unavailable');
    const create = vi.fn(); vi.stubGlobal('LanguageModel', { availability: vi.fn().mockRejectedValue(new Error()), create });
    expect(await browserAvailability()).toBe('unavailable'); expect(create).not.toHaveBeenCalled();
  });
  it('sends exact text locally and destroys its context even on failure', async () => {
    const destroy = vi.fn(), prompt = vi.fn().mockResolvedValue('local reply');
    vi.stubGlobal('LanguageModel', { availability: async () => 'available', create: async () => ({ prompt, destroy }) });
    const signal = new AbortController().signal, onText = vi.fn();
    expect(await sendOnComputer('exact private text', signal, onText, vi.fn())).toBe('local reply');
    expect(prompt).toHaveBeenCalledWith('exact private text', { signal }); expect(destroy).toHaveBeenCalledOnce();
    prompt.mockRejectedValue(new Error('Stopped')); await expect(sendOnComputer('text', signal, onText, vi.fn())).rejects.toThrow();
    expect(destroy).toHaveBeenCalledTimes(2);
  });
});
describe('OpenRouter public catalogue', () => {
  it('requests only public metadata and filters strictly by :free suffix', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 'a:free', name: 'Free choice' }, { id: 'paid', pricing: { prompt: '0', completion: '0' } }] })));
    expect(await freeCatalogue(fetch)).toEqual({ fallback: false, models: [{ id: 'a:free', label: 'Free choice' }] });
    expect(fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models', { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
  });
  it('falls back only on a failure, never on a valid empty catalogue', async () => {
    expect((await freeCatalogue(async () => { throw new Error(); })).fallback).toBe(true);
    expect(await freeCatalogue(async () => new Response('{"data":[]}'))).toEqual({ fallback: false, models: [] });
  });
});
