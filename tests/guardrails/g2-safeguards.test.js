// GUARDRAIL G2 — every prompt carries the factuality and injection guards. Never delete or weaken.
import { describe, expect, it } from 'vitest';
import { readPrompts } from '../../scripts/lib/content.mjs';
import { buildLibraryPrompt } from '../../src/core/library.js';
import { REQUIRED_LINES, INJECTION_GUARD, FACTUALITY_GUARD, CLOSING_LINE, ROLE_LINE } from '../../src/core/safeguards.js';
import { loadV01 } from '../helpers/v01-oracle.js';

describe('G2: safeguard block', () => {
  it('safeguard wording is identical to v0.1 buildPrompt', () => {
    const { core } = loadV01();
    const v01 = core.buildPrompt('profile', core.newWorkspace(), { prompts: [] });
    for (const line of [ROLE_LINE, INJECTION_GUARD, FACTUALITY_GUARD, CLOSING_LINE]) expect(v01).toContain(line);
  });
  it('every library prompt contains every required safeguard line', () => {
    for (const p of readPrompts()) {
      const text = buildLibraryPrompt(p);
      for (const line of REQUIRED_LINES) expect(text, p.id).toContain(line);
    }
  });
  it('the safeguards come before the place where the user pastes data', () => {
    for (const p of readPrompts()) {
      const text = buildLibraryPrompt(p);
      expect(text.indexOf(INJECTION_GUARD)).toBeLessThan(text.indexOf('[Paste here'));
    }
  });
});
