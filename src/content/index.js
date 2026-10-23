// @ts-check
/**
 * Loads all content files at build time (Vite bundles them, so nothing is
 * fetched at runtime and the app works offline). To add a role, prompt or
 * interview pack, just add a file in content/; no code change is needed.
 */
import { buildContent } from './build.js';
import demo from '../../content/demo/sam.json';

/** @type {import('./build.js').Content} */
export const content = buildContent({
  roles: import.meta.glob('../../content/roles/*.json', { eager: true, import: 'default' }),
  prompts: import.meta.glob('../../content/prompts/*.md', { eager: true, query: '?raw', import: 'default' }),
  interview: import.meta.glob('../../content/interview/*.json', { eager: true, import: 'default' }),
  demo,
});
