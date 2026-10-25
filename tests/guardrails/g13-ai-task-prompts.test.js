// GUARDRAILS G1, G2, G7 extended to every structured AI task prompt and custom prompt.
// Never delete or weaken this file.
import { describe, expect, it } from 'vitest';
import { v01Backups, hostileWorkspace } from '../helpers/fixtures.js';
import { findScoreRequests } from '../helpers/no-score.js';
import { parseWorkspace } from '../../src/core/backup.js';
import { normalizeWorkspace } from '../../src/core/schema.js';
import { buildTaskPrompt, buildCustomPrompt, SCHEMAS } from '../../src/ai/tasks.js';
import { REQUIRED_LINES, INJECTION_GUARD } from '../../src/core/safeguards.js';
import { content } from '../../src/content/index.js';

const states = () => [
  ...v01Backups().map(({ name, text }) => ({ name, state: parseWorkspace(text) })),
  { name: 'demo', state: normalizeWorkspace(content.demo) },
  { name: 'hostile', state: parseWorkspace(JSON.stringify(hostileWorkspace())) },
];

describe('G1/G2/G7 for structured tasks', () => {
  for (const { name, state } of states()) {
    it(name, () => {
      const s = { ...state, profile: { ...state.profile, name: 'Zq7-Name-Sentinel' } };
      const prompts = [...Object.keys(SCHEMAS).map((id) => buildTaskPrompt(id, s, content)), buildCustomPrompt({ title: 'Mine', task: 'Help me', dataFrom: 'cv' }, s)];
      for (const text of prompts) {
        for (const line of REQUIRED_LINES) expect(text).toContain(line);
        expect(text.indexOf(INJECTION_GUARD)).toBeGreaterThan(text.indexOf('QUOTED SOURCE DATA'));
        expect(text.indexOf(INJECTION_GUARD)).toBeLessThan(text.indexOf('\n\nEVALUATION\n'));
        expect(text).not.toContain('Zq7-Name-Sentinel');
        if (name !== 'hostile') expect(findScoreRequests(text)).toEqual([]);
      }
    });
  }
});
