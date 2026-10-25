import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { content } from '../../src/content/index.js';
import { newWorkspace, normalizeWorkspace } from '../../src/core/schema.js';
import { parseWorkspace, serializeWorkspace } from '../../src/core/backup.js';
import { buildCustomPrompt } from '../../src/ai/tasks.js';
import { REQUIRED_LINES } from '../../src/core/safeguards.js';
import { findScoreRequests } from '../helpers/no-score.js';

const demo = () => normalizeWorkspace(content.demo);
const draftIds = ['read', 'fit', 'tailor', 'interview', 'letter'];
const banned = /refugee|asylum|status[\s-]+holder|statushouder|vluchteling|immigration|residence[\s-]+permit|work[\s-]+authorisation/i;

describe('Sam’s fictional teaching examples', () => {
  it('keeps the supplied custom template and reflections word for word', () => {
    const source = readFileSync(new URL('../../docs/plans/sam-showcase.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
    const s = demo();
    expect(s.ai.customPrompts[0].task).toBe(source.match(/```\n(GOAL[\s\S]*?)\n```/)[1]);
    for (const [i, match] of [...source.matchAll(/Note:\n> ([^\n]+)/g)].entries()) expect(s.interview.notes['q' + (i + 1)]).toBe(match[1]);
  });
  it('loads sixteen answers and reflections, the default pack, a short exchange and all prompt examples', () => {
    const s = demo();
    for (const pack of content.interviewPacks) for (const q of pack.questions) {
      expect(s.interview.answers[q.id], q.id).toBeTruthy();
      expect(s.interview.notes[q.id], q.id).toBeTruthy();
      if (q.id.startsWith('da')) {
        const words = s.interview.answers[q.id].split(/\s+/).length;
        expect(words).toBeGreaterThanOrEqual(80);
        expect(words).toBeLessThanOrEqual(130);
      }
    }
    expect(s.interview.packId).toBe('default');
    expect(s.interview.questionIndex).toBe(0);
    expect(s.interview.mock.messages).toEqual([
      { role: 'interviewer', text: content.interviewQuestions[1].question },
      { role: 'me', text: s.interview.answers.q2 },
    ]);
    expect(s.interview.mock.feedback).toMatch(/^Example AI feedback/);
    expect(s.interview.mock.feedback).toMatch(/Please check:$/);
    expect(s.ai.extra).toBe('Use plain English and ask before you assume anything.');
    expect(s.ai.customPrompts).toHaveLength(1);
    for (const id of draftIds) expect(s.ai.drafts[id]).toMatch(/^EXAMPLE AI REPLY \(fictional\) — this is what a good answer looks like\./);
  });
  it('quotes only exact profile or CV text as evidence, with only the four evidence categories', () => {
    const s = demo();
    const sources = [...Object.values(s.profile), ...Object.values(s.cv)].filter((v) => typeof v === 'string');
    const rows = s.ai.drafts.fit.split('\n').filter((line) => / \| "/.test(line));
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      const [, quote, status] = row.split(' | ');
      expect(quote).toMatch(/^".+"$/);
      expect(sources.some((value) => value.includes(quote.slice(1, -1))), quote).toBe(true);
      expect(['Supported', 'Partly supported', 'Not shown', 'Unclear']).toContain(status);
    }
    for (const match of s.ai.drafts.tailor.matchAll(/"([^"]+)"/g)) expect(sources.some((value) => value.includes(match[1])), match[1]).toBe(true);
  });
  it('retains visible gaps rather than inventing examples, including absent AI experience', () => {
    const s = demo();
    for (const id of ['q2', 'q3', 'q5', 'q6', 'q7', 'da3', 'da6']) expect(s.interview.answers[id], id).toMatch(/\[add\b/i);
    expect(s.interview.answers.da6).toContain('general understanding, not a claim of experience');
    expect(s.interview.answers.da7).toContain('200 invented order records');
    expect(s.ai.drafts.letter).toContain('[add in your own words]');
    expect(s.ai.drafts.letter.split(/\s+/).length).toBeLessThanOrEqual(250);
  });
  it('keeps all examples neutral and without scores, and ends each five-part draft with a check', () => {
    const s = demo();
    const texts = [...Object.values(s.interview.answers), ...Object.values(s.interview.notes), s.interview.mock.feedback, ...s.interview.mock.messages.map((m) => m.text), ...Object.values(s.ai.drafts), s.ai.extra, s.ai.customPrompts[0].task];
    for (const text of texts) { expect(text).not.toMatch(banned); expect(text).not.toMatch(/\d+\s*%/); expect(findScoreRequests(text)).toEqual([]); }
    for (const id of draftIds) {
      expect(s.ai.drafts[id]).toMatch(/Please check:$/);
      expect(s.ai.drafts[id].match(/^(GOAL|INSTRUCTION|CONTEXT|GUARDRAILS|EVALUATION)$/gm)).toEqual(['GOAL', 'INSTRUCTION', 'CONTEXT', 'GUARDRAILS', 'EVALUATION']);
    }
  });
  it('builds Sam’s custom template as five parts, fills its context and preserves all safeguards', () => {
    const s = demo(), custom = s.ai.customPrompts[0];
    expect(custom.task.match(/^(GOAL|INSTRUCTION|CONTEXT|GUARDRAILS|EVALUATION)$/gm)).toEqual(['GOAL', 'INSTRUCTION', 'CONTEXT', 'GUARDRAILS', 'EVALUATION']);
    const built = buildCustomPrompt(custom, s);
    expect(built.match(/^(GOAL|INSTRUCTION|CONTEXT|GUARDRAILS|EVALUATION)$/gm)).toEqual(['GOAL', 'INSTRUCTION', 'CONTEXT', 'GUARDRAILS', 'EVALUATION']);
    expect(built).toContain(s.jobs[0].body);
    expect(built).not.toContain('[paste]');
    for (const line of REQUIRED_LINES) expect(built).toContain(line);
  });
  it('new workspaces contain none of the teaching material, and importing a demo still resets review', () => {
    const fresh = newWorkspace(), s = demo();
    expect(fresh.interview).toMatchObject({ answers: {}, notes: {}, mock: { messages: [], feedback: '' } });
    expect(fresh.ai.extra).toBe(''); expect(fresh.ai.customPrompts).toEqual([]);
    expect(Object.values(fresh.ai.drafts).every((text) => text === '')).toBe(true);
    s.cv.reviewed = true;
    const restored = parseWorkspace(serializeWorkspace(s));
    expect(restored.cv.reviewed).toBe(false);
    expect(restored.interview).toEqual(s.interview);
    expect(restored.ai).toEqual(s.ai);
  });
});
