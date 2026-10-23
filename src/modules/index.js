// @ts-check
/**
 * Optional modules (built-in AI, applications tracker, knowledge cards, coach view …).
 * Each module is one function that adds pages or services to the app.
 * Turn modules on or off in config/features.json. Core safety features are not modules.
 */
import features from '../../config/features.json';
import { aiModule } from './ai/index.js';
import { knowledgeModule } from './knowledge/index.js';
import { i18nModule } from './i18n/index.js';

/** @param {string} flag */
export function enabled(flag) {
  return /** @type {Record<string, unknown>} */ (features)[flag] !== false;
}

/** @type {((app: any) => void)[]} */
export const extensions = [];
extensions.push(i18nModule);
if (enabled('builtinAi')) extensions.push(aiModule);
if (enabled('knowledge')) extensions.push(knowledgeModule);
