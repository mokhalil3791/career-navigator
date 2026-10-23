// @ts-check
/** Node-side readers for content files, shared by build scripts and tests. */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseFrontmatter } from '../../src/content/frontmatter.js';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/**
 * Reads the public library prompts in content/prompts/*.md, sorted by `order`.
 * Structured app tasks (`library: false`, e.g. extract-requirements) are left out.
 * @returns {import('../../src/core/library.js').PromptFile[]}
 */
export function readPrompts() {
  return readAllPrompts().filter((p) => /** @type {any} */ (p).library !== false);
}

/**
 * Every prompt file, including structured app tasks.
 * @returns {import('../../src/core/library.js').PromptFile[]}
 */
export function readAllPrompts() {
  const dir = join(ROOT, 'content', 'prompts');
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const { data, body } = parseFrontmatter(readFileSync(join(dir, name), 'utf8'));
      return /** @type {any} */ ({ ...data, task: body });
    })
    .sort((a, b) => a.order - b.order);
}

/** @returns {any} config/providers.json */
export function readProviders() {
  return JSON.parse(readFileSync(join(ROOT, 'config', 'providers.json'), 'utf8'));
}
