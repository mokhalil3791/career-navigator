// @ts-check
/**
 * Stand-in for the WebLLM library in the single-file release (USB stick / offline
 * sharing). The in-browser model needs the hosted website (WebGPU files and a
 * cached model), so this build offers copy-paste, free keys and Ollama instead.
 */

/** @returns {Promise<never>} */
export async function CreateMLCEngine() {
  throw new Error('The in-browser model is only available on the hosted website. Use copy-paste, a free key or Ollama in this offline file.');
}

/** @returns {Promise<boolean>} */
export async function hasModelInCache() {
  return false;
}
