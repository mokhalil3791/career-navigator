// @ts-check
/**
 * Loads the real v0.1 logic from reference/v0.1/Career_Navigator.html into a
 * Node sandbox. Tests compare the new code against this "oracle", so the port
 * is checked by a machine instead of by memory. Never edit the reference file.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const REFERENCE = fileURLToPath(new URL('../../reference/v0.1/Career_Navigator.html', import.meta.url));

/** @returns {string} the raw v0.1 HTML */
export function v01Html() {
  return readFileSync(REFERENCE, 'utf8');
}

/**
 * Runs the first two <script> blocks (CareerCore and CareerContent) of v0.1.
 * The third block is the browser UI and needs a DOM, so it is not loaded here.
 * @returns {{ core: any, content: any }}
 */
export function loadV01() {
  const html = v01Html();
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (scripts.length < 3) throw new Error('v0.1 reference does not have the expected three script blocks');
  /** @type {any} */
  const sandbox = { TextEncoder, URL, Set, JSON, Error, Object, Array, String, Number, Math };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(scripts[0], sandbox);
  vm.runInContext(scripts[1], sandbox);
  // v0.1 checks "plain object" with Object.prototype, which differs per realm.
  // So arguments are copied INTO the sandbox realm, and results copied back OUT.
  const inside = (/** @type {any} */ v) => (v && typeof v === 'object' ? vm.runInContext('JSON.parse', sandbox)(JSON.stringify(v)) : v);
  const outside = (/** @type {any} */ v) => (v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v);
  /** @type {any} */
  const core = {};
  for (const [name, fn] of Object.entries(sandbox.CareerCore)) {
    core[name] = (/** @type {any[]} */ ...args) => {
      try { return outside(/** @type {Function} */ (fn)(...args.map(inside))); }
      catch (error) { throw new Error(String(/** @type {any} */ (error).message)); }
    };
  }
  return { core, content: JSON.parse(JSON.stringify(sandbox.CareerContent)) };
}

/**
 * Returns the TASK text v0.1 uses for a prompt step.
 * @param {string} step
 */
export function v01Task(step) {
  const { core } = loadV01();
  const prompt = core.buildPrompt(step, core.newWorkspace(), { prompts: [] });
  const match = prompt.match(/\nTASK\n([^\n]+)/);
  if (!match) throw new Error('No TASK block for ' + step);
  return match[1];
}
