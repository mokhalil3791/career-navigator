import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { readAllPrompts, readPrompts } from '../../scripts/lib/content.mjs';
import { parsePromptParts, formatPromptParts, PARTS } from '../../src/core/prompt-parts.js';
import { buildLibraryPrompt } from '../../src/core/library.js';
import { buildPrompt } from '../../src/core/prompts.js';
import { buildTaskPrompt, buildCustomPrompt, SCHEMAS } from '../../src/ai/tasks.js';
import { PUBLIC_REQUIRED_LINES } from '../../src/core/safeguards.js';
import { content } from '../../src/content/index.js';
import { newWorkspace } from '../../src/core/schema.js';
import { findScoreRequests } from '../helpers/no-score.js';

const source = readFileSync(new URL('../../docs/prompts/library-v2.md', import.meta.url), 'utf8');
const originals = [...source.matchAll(/```text\n([\s\S]*?)\n```/g)].map((m) => m[1]);
const ids = ['profile', 'search', 'read', 'fit', 'compare', 'tailor', 'interview', 'letter', 'template'];
const headings = (text) => [...text.matchAll(/^(GOAL|INSTRUCTION|CONTEXT|GUARDRAILS|EVALUATION)(?=\n| \()/gm)].map((m) => m[1]);

describe('five-part source and display parity', () => {
  it('stores all eight prompts and the template word for word, with only Markdown heading syntax changed', () => {
    expect(originals).toHaveLength(9);
    for (const [i, id] of ids.entries()) {
      const file = readAllPrompts().find((p) => p.id === id);
      expect(formatPromptParts(parsePromptParts(file.task)), id).toBe(originals[i]);
      expect(content.tasks[id], id).toBe(file.task);
    }
  });
  it('publishes all five parts, source instructions and safeguards without app jargon', () => {
    for (const p of readAllPrompts().filter((p) => ids.includes(p.id))) {
      const text = buildLibraryPrompt(p);
      const parts = parsePromptParts(p.task);
      expect(headings(text)).toEqual(PARTS.map((p) => p.toUpperCase()));
      for (const part of Object.values(parts)) expect(text).toContain(part);
      for (const line of PUBLIC_REQUIRED_LINES) expect(text).toContain(line);
      expect(text).not.toMatch(/Career Navigator|recorded facts|selected advert/i);
    }
  });
  it('validates every shipped prompt, including JSON tasks and the template', () => {
    expect(content.warnings).toEqual([]);
    for (const p of readAllPrompts()) expect(Object.keys(parsePromptParts(p.task))).toEqual(PARTS);
  });
  it('rejects missing, duplicated, reordered, empty and unlabelled parts', () => {
    const valid = readPrompts()[0].task;
    for (const invalid of [valid.replace('## Goal', '## Other'), valid + '\n## Goal\nExtra', valid.replace('## Context', '## Evaluation'), valid.replace(/## Goal[\s\S]*?## Instruction/, '## Goal\n\n## Instruction'), 'Unlabelled\n' + valid, '']) {
      expect(() => parsePromptParts(invalid)).toThrow();
    }
  });
  it('recognises only the approved score prohibition, not a request for scores', () => {
    expect(findScoreRequests('No percentage or "match" scores.')).toEqual([]);
    expect(findScoreRequests('Give a percentage or "match" score.')).not.toEqual([]);
  });
  it('fills app context with quoted data and the explanation language in every builder', () => {
    const state = newWorkspace();
    state.profile.skills = 'Private Excel fact';
    state.ai.language = 'Arabic';
    const texts = [
      ...readPrompts().map((p) => buildPrompt(p.id, state, content)),
      ...Object.keys(SCHEMAS).map((id) => buildTaskPrompt(id, state, content)),
      buildCustomPrompt({ title: 'My task', task: 'Help me', dataFrom: 'profile' }, state),
    ];
    for (const text of texts) {
      expect(headings(text)).toEqual(PARTS.map((p) => p.toUpperCase()));
      const context = text.split('\n\nCONTEXT\n')[1].split('\n\nGUARDRAILS')[0];
      expect(context).toContain('Explain things in: Arabic');
      expect(context).toContain('QUOTED SOURCE DATA');
      expect(context).not.toMatch(/\[paste|\[target role\]/i);
    }
    expect(buildPrompt('read', state, content)).toContain('Private Excel fact');
  });
});
