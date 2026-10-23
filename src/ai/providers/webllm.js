// @ts-check
/**
 * WebLLM: a small model that runs inside the browser with WebGPU. After a
 * one-time download (cached by the browser) nothing leaves the device.
 * The WebLLM library (~6 MB) is loaded only when the user chooses this route,
 * so it never slows down the app shell. Offered only when WebGPU is detected (NFR-PERF-1).
 */
import { AiError, registerProvider } from '../provider.js';

/** @returns {Promise<boolean>} true when this browser can run WebLLM */
export async function hasWebGPU() {
  try {
    const gpu = /** @type {any} */ (navigator).gpu;
    return Boolean(gpu && (await gpu.requestAdapter()));
  } catch (_) { return false; }
}

/** @type {Promise<any> | null} */
let enginePromise = null;
let loadedModel = '';

/**
 * Downloads (first time) and starts the model. Call only after the user confirmed the download.
 * @param {string} model
 * @param {(progress: { progress: number, text: string }) => void} onProgress
 */
export async function loadModel(model, onProgress) {
  if (enginePromise && loadedModel === model) return enginePromise;
  loadedModel = model;
  enginePromise = import('@mlc-ai/web-llm').then((webllm) => webllm.CreateMLCEngine(model, { initProgressCallback: onProgress }));
  try { return await enginePromise; }
  catch (error) {
    enginePromise = null;
    throw new AiError('unsupported', 'The in-browser model could not start on this device (' + String(/** @type {Error} */ (error).message || error).slice(0, 120) + '). Try a smaller model, or use copy-paste.');
  }
}

/** True when a model has been loaded in this page. */
export function isLoaded() {
  return enginePromise !== null;
}

/** Whether the model files are already in the browser cache (no download needed). @param {string} model */
export async function isCached(model) {
  try { const webllm = await import('@mlc-ai/web-llm'); return await webllm.hasModelInCache(model); } catch (_) { return false; }
}

registerProvider('webllm', (config, settings) => ({
  id: 'webllm', label: config.label, config, capabilities: config.capabilities,
  async *generate({ system, messages, jsonSchema, signal }) {
    if (!enginePromise) throw new AiError('other', 'Download and start the in-browser model first.');
    const engine = await enginePromise;
    const onAbort = () => engine.interruptGenerate();
    signal?.addEventListener('abort', onAbort);
    try {
      const chunks = await engine.chat.completions.create({
        stream: true, temperature: jsonSchema ? 0.2 : 0.5,
        messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages],
        ...(jsonSchema ? { response_format: { type: 'json_object' } } : {}),
      });
      for await (const chunk of chunks) {
        if (signal?.aborted) throw new AiError('stopped', 'Stopped.');
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    } finally { signal?.removeEventListener('abort', onAbort); }
  },
  async listModels() { return config.models.map((/** @type {any} */ m) => ({ id: m.id, label: m.label })); },
  async checkConnection() {
    return (await hasWebGPU()) ? { ok: true, message: 'This browser supports WebGPU.' } : { ok: false, message: 'This browser or device does not support WebGPU, so the in-browser model is not available. Use copy-paste or a free key instead.' };
  },
}));
