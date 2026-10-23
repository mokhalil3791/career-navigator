// @ts-check
/**
 * Finds every English UI string: the literal text inside t('…') calls in src/,
 * plus content strings that the UI translates (role names, prompt titles,
 * interview questions). Used for translation coverage and tests.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readPrompts } from './content.mjs';

/** @param {string} dir @returns {string[]} */
function jsFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? jsFiles(full) : name.endsWith('.js') ? [full] : [];
  });
}

/** Unescapes a JS single-quoted literal body. @param {string} s */
function unquote(s) {
  return s.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

/** @returns {string[]} unique English strings, in first-seen order */
export function extractStrings() {
  const seen = new Set();
  for (const file of jsFiles(join(ROOT, 'src'))) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) seen.add(unquote(m[1]));
  }
  for (const p of readPrompts()) { seen.add(p.title); seen.add(p.summary); }
  const interview = JSON.parse(readFileSync(join(ROOT, 'content', 'interview', 'default.json'), 'utf8'));
  for (const q of interview.questions) { seen.add(q.question); seen.add(q.tip); }
  for (const f of readdirSync(join(ROOT, 'content', 'roles'))) seen.add(JSON.parse(readFileSync(join(ROOT, 'content', 'roles', f), 'utf8')).role);
  // Shell strings defined as constants
  seen.add('Independent tool. No employer or partner endorsement implied.');
  return [...seen];
}
