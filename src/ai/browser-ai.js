// @ts-check
/** Optional browser-owned AI. Detection never calls create() or downloads anything. */
const api = () => /** @type {any} */ (globalThis).LanguageModel;
/** @returns {Promise<string>} */
export async function browserAvailability() {
  try { return api() ? await api().availability() : 'unavailable'; }
  catch { return 'unavailable'; }
}
/** Every request gets a fresh context; nothing is carried to the next workspace.
 * @param {string} text @param {AbortSignal} signal @param {(value: string) => void} onText
 * @param {(value: number) => void} onProgress
 */
export async function sendOnComputer(text, signal, onText, onProgress) {
  const session = await api().create({ signal, monitor(/** @type {any} */ m) {
    m.addEventListener('downloadprogress', (/** @type {any} */ e) => onProgress(e.loaded));
  } });
  try { const reply = await session.prompt(text, { signal }); onText(reply); return reply; }
  finally { session.destroy(); }
}
