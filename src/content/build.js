// @ts-check
/**
 * Turns raw content files into the app's content object. Every file is checked
 * against its JSON Schema; a bad file is SKIPPED with a visible warning instead
 * of breaking the app, so a fork's typo never locks a user out.
 */
import { validate } from './json-schema.js';
import { parseFrontmatter } from './frontmatter.js';
import roleSchema from '../../content/schemas/role.schema.json';
import interviewSchema from '../../content/schemas/interview.schema.json';
import promptSchema from '../../content/schemas/prompt.schema.json';

/**
 * @typedef {object} Content
 * @property {any[]} roles                 sorted by `order`, then name
 * @property {any[]} prompts               improved prompts (frontmatter + task)
 * @property {Record<string, string>} tasks task text by step id (for buildPrompt)
 * @property {any[]} interviewPacks
 * @property {{ id: string, question: string, tip: string }[]} interviewQuestions the default pack
 * @property {any} demo                    the fictional Sam workspace
 * @property {string[]} warnings           one line per skipped file
 */

/** @param {string} path */
const fileName = (path) => path.split('/').pop() || path;

/**
 * @param {{ roles: Record<string, unknown>, prompts: Record<string, string>, interview: Record<string, unknown>, demo: unknown }} files
 *        maps of file path → parsed JSON (or raw Markdown for prompts)
 * @returns {Content}
 */
export function buildContent(files) {
  /** @type {string[]} */
  const warnings = [];
  const roles = [];
  for (const [path, data] of Object.entries(files.roles)) {
    const errors = validate(roleSchema, data);
    if (errors.length) { warnings.push(`Skipped role file ${fileName(path)}: ${errors[0]}`); continue; }
    roles.push(data);
  }
  roles.sort((a, b) => ((/** @type {any} */ (a).order ?? 1000) - (/** @type {any} */ (b).order ?? 1000)) || String(/** @type {any} */ (a).role).localeCompare(/** @type {any} */ (b).role));

  const prompts = [];
  for (const [path, raw] of Object.entries(files.prompts)) {
    try {
      const { data, body } = parseFrontmatter(raw);
      const errors = validate(promptSchema, data);
      if (errors.length || !body) { warnings.push(`Skipped prompt file ${fileName(path)}: ${errors[0] || 'empty task'}`); continue; }
      prompts.push({ ...data, task: body });
    } catch (error) {
      warnings.push(`Skipped prompt file ${fileName(path)}: ${/** @type {Error} */ (error).message}`);
    }
  }
  prompts.sort((a, b) => a.order - b.order);
  /** @type {Record<string, string>} */
  const tasks = {};
  for (const p of prompts) tasks[p.id] = p.task;

  const interviewPacks = [];
  for (const [path, data] of Object.entries(files.interview)) {
    const errors = validate(interviewSchema, data);
    if (errors.length) { warnings.push(`Skipped interview pack ${fileName(path)}: ${errors[0]}`); continue; }
    interviewPacks.push(data);
  }
  const defaultPack = interviewPacks.find((p) => p.id === 'default') || interviewPacks[0] || { questions: [] };
  return { roles, prompts, tasks, interviewPacks, interviewQuestions: defaultPack.questions, demo: files.demo, warnings };
}

/**
 * The question list for the pack the user chose (FR-INT-3), falling back to the default.
 * @param {Content} content
 * @param {string} packId
 */
export function questionsFor(content, packId) {
  const pack = content.interviewPacks.find((p) => p.id === packId);
  return pack ? pack.questions : content.interviewQuestions;
}
