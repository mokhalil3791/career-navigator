// @ts-check
/**
 * Builds the stand-alone prompts shown on the public prompt library page (/prompts).
 * They use the same task text (content/prompts/*.md) and the same safeguard lines
 * as the app, so the page and the app cannot drift apart (FR-LIB-4).
 */
import { safeguardParts } from './safeguards.js';
import { parsePromptParts, formatPromptParts } from './prompt-parts.js';

/**
 * @typedef {object} PromptFile
 * @property {string} id         step id, e.g. "fit"
 * @property {string} slug       short URL name, e.g. "check"
 * @property {number} order
 * @property {string} title
 * @property {string} summary
 * @property {string[]} pasteWith what the user should paste below the prompt
 * @property {string} task       the task text (body of the .md file)
 */

/**
 * Turns one prompt file into ready-to-copy text for any free AI chat.
 * The user pastes their own information at the marked places.
 * @param {PromptFile} prompt
 * @returns {string}
 */
export function buildLibraryPrompt(prompt) {
  const parts = parsePromptParts(prompt.task);
  return formatPromptParts(safeguardParts(parts, { public: true }));
}
