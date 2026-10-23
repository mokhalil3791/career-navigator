// GUARDRAIL G8 — principle 5 "Free forever". Permanent; never delete or weaken.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readProviders } from '../../scripts/lib/content.mjs';
import { allTextFiles } from '../helpers/files.js';

/** Hosts of AI APIs that have no free tier for a participant. */
export const PAID_ONLY_HOSTS = ['api.anthropic.com', 'api.openai.com', 'api.cohere.com', 'api.cohere.ai', 'api.x.ai', 'api.perplexity.ai'];

/** Wording that would put a paywall, trial or card form in front of a participant. */
export const PAYWALL_WORDS = /\b(credit card|debit card|card number|payment details|enter your card|free trial|trial period|upgrade to (pro|premium|plus)|paywall|subscribe now|buy (credits|a plan)|pricing plan|billing address|iban)\b/i;

describe('G8: free forever', () => {
  it('no provider in config points at a paid-only AI host', () => {
    const text = JSON.stringify(readProviders());
    for (const host of PAID_ONLY_HOSTS) expect(text, host).not.toContain(host);
  });
  it('no paid adapter file exists (for example anthropic-byok)', () => {
    for (const name of ['anthropic-byok.js', 'anthropic.js', 'openai.js']) expect(existsSync(join(ROOT, 'src', 'ai', 'providers', name)), name).toBe(false);
  });
  it('no shipped text mentions a paid-only AI host or paywall wording', () => {
    for (const file of allTextFiles(['src', 'content', 'config', 'site'])) {
      const text = readFileSync(join(ROOT, file), 'utf8');
      for (const host of PAID_ONLY_HOSTS) expect(text.includes(host), file + ' mentions ' + host).toBe(false);
      expect(text.match(PAYWALL_WORDS)?.[0], file).toBeUndefined();
    }
  });
  it('every API provider in config is marked free', () => {
    for (const p of readProviders().api) expect(p.cost, p.id).toBe('free');
  });
});
