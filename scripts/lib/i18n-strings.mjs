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
    // Navigation labels and AI panel titles are translated through a variable: t(page.label), t(run.title).
    if (/src[\\/](app|modules)/.test(file)) for (const m of text.matchAll(/\b(?:label|title): '((?:[^'\\]|\\.)*)'/g)) seen.add(unquote(m[1]));
  }
  for (const p of readPrompts()) { seen.add(p.title); seen.add(p.summary); }
  const interview = JSON.parse(readFileSync(join(ROOT, 'content', 'interview', 'default.json'), 'utf8'));
  for (const q of interview.questions) { seen.add(q.question); seen.add(q.tip); }
  for (const f of readdirSync(join(ROOT, 'content', 'roles'))) seen.add(JSON.parse(readFileSync(join(ROOT, 'content', 'roles', f), 'utf8')).role);
  // Shell strings defined as constants
  seen.add('Independent tool. No employer or partner endorsement implied.');
  // Application-language options, translated through t(l).
  seen.add('English'); seen.add('Dutch');
  // Constants translated through t(constant): stage labels, the coach-file warning, question-pack titles.
  for (const s of ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn']) seen.add(s);
  seen.add('This file contains personal details. Share it only with people you trust, and delete it when you no longer need it.');
  for (const f of readdirSync(join(ROOT, 'content', 'interview'))) seen.add(JSON.parse(readFileSync(join(ROOT, 'content', 'interview', f), 'utf8')).title);
  for (const text of ['Not started', 'In progress', 'Done', '90-day plan', 'Import a CV or enter your facts. Check the text before using it.', 'Find the requirements and connect them to your own evidence.', 'Check every line before you download.', 'Practise an answer using a real example.', 'Choose one useful next step for your next 90 days.', 'Keep track of applications and follow-up dates.']) seen.add(text);
  seen.delete('');
  return [...seen];
}
