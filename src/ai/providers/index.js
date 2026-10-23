// @ts-check
/**
 * Loads every provider adapter so it registers itself. To add a free provider:
 * create src/ai/providers/<name>.js (copy ollama.js as a model), import it here,
 * and add an entry to config/providers.json → "api". See docs/CUSTOMISING.md.
 * Copy-paste is not an adapter: it is the default route in the prompt studio.
 */
import './gemini.js';
import './openrouter.js';
import './ollama.js';
import './webllm.js';
