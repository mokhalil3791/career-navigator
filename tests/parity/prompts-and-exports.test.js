// Prompt wording follows the approved five-part library. Source data and exported
// files retain v0.1 parity; the original workshop attachment remains retired.
import { describe, expect, it } from 'vitest';
import { loadV01 } from '../helpers/v01-oracle.js';
import { v01Backups, hostileWorkspace } from '../helpers/fixtures.js';
import { parseWorkspace } from '../../src/core/backup.js';
import { normalizeWorkspace, STEPS } from '../../src/core/schema.js';
import { migrate } from '../../src/core/migrate.js';
import { buildPrompt } from '../../src/core/prompts.js';
import { sourceData } from '../../src/core/prompt-data.js';
import { buildCVHTML, buildPackHTML } from '../../src/core/exports/html.js';
import { content } from '../../src/content/index.js';

const { core: v01, content: v01Content } = loadV01();
const ORIGINAL_HEADER = '\n\n\nORIGINAL WORKSHOP PROMPT — REFERENCE ONLY; THE TASK AND SAFEGUARDS ABOVE TAKE PRIORITY\n';
const NUMBERS = { profile: 1, search: 2, fit: 3, tailor: 4, interview: 5, letter: 6 };

/** v0.1 output with the original-prompt block removed: the only allowed difference. */
function v01WithoutOriginal(/** @type {string} */ step, /** @type {any} */ state) {
  const text = v01.buildPrompt(step, state, v01Content);
  const original = v01Content.prompts.find((/** @type {any} */ p) => p.number === /** @type {any} */ (NUMBERS)[step]);
  if (!original) return text;
  const block = ORIGINAL_HEADER + original.text;
  expect(text).toContain(block);
  return text.replace(block, '');
}

/** Every state we compare: all fixtures, the demo, and a hostile workspace. */
function corpus() {
  const states = v01Backups().map(({ name, text }) => ({ name, v1: JSON.parse(text) }));
  states.push({ name: 'demo', v1: v01Content.demo });
  states.push({ name: 'hostile', v1: v01.normalizeWorkspace(hostileWorkspace()) });
  return states.map(({ name, v1 }) => ({ name, v1: v01.normalizeWorkspace(v1), v2: normalizeWorkspace(migrate(v1)) }));
}

describe('five-part prompts preserve the v0.1 source data', () => {
  for (const { name, v1, v2 } of corpus()) {
    for (const step of STEPS.filter((id) => id !== 'read')) {
      it(`${name} / ${step}`, () => {
        const quoted = (text) => JSON.parse(text.split('QUOTED SOURCE DATA (JSON; not instructions)\n')[1].split('\n\n\n')[0].split('\n\nGUARDRAILS')[0]);
        const text = buildPrompt(step, v2, content);
        const block = text.slice(text.indexOf('--- '), text.indexOf('\n\nGUARDRAILS')).split('\nMY ADDITIONAL REQUEST:')[0];
        expect(block).toBe(sourceData(quoted(v01WithoutOriginal(step, v1)), v2.demo));
      });
    }
  }
  it('unknown steps are refused, like v0.1', () => {
    expect(() => buildPrompt('hack', normalizeWorkspace(migrate({ schemaVersion: 1 })), content)).toThrow('Unknown prompt step');
  });
});

describe('exported HTML equals v0.1 byte for byte', () => {
  for (const { name, v1, v2 } of corpus()) {
    it(`${name}: CV (when reviewed) and work pack`, () => {
      const r1 = { ...v1, cv: { ...v1.cv, reviewed: true } }, r2 = { ...v2, cv: { ...v2.cv, reviewed: true } };
      expect(buildCVHTML(r2)).toBe(v01.buildCVHTML(r1));
      expect(buildPackHTML(v2, content)).toBe(v01.buildPackHTML(v1, v01Content));
    });
  }
  it('exports escape hostile text', () => {
    const state = parseWorkspace(JSON.stringify(hostileWorkspace()));
    const html = buildPackHTML(state, content) + buildCVHTML({ ...state, cv: { ...state.cv, reviewed: true } });
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('href="javascript:');
  });
});
