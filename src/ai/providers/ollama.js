// @ts-check
/**
 * Ollama: a free model running on the user's own computer (http://localhost:11434).
 * Ollama must allow this website: set OLLAMA_ORIGINS (see README → "Use Ollama").
 */
import { AiError, errorForStatus, registerProvider } from '../provider.js';
import { ndjson } from '../stream.js';

registerProvider('ollama', (config, settings) => {
  const label = 'Ollama';
  const notReachable = new AiError('network', 'Could not reach Ollama on this computer. Start Ollama, and allow this site with OLLAMA_ORIGINS (see the README).');
  return {
    id: 'ollama', label: config.label, config, capabilities: config.capabilities,
    async *generate({ system, messages, jsonSchema, signal, model }) {
      const body = { model: model || settings.getModel() || config.defaultModel, stream: true, messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages], ...(jsonSchema ? { format: 'json' } : {}) };
      let response;
      try { response = await settings.fetch(`${config.endpoint}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }); }
      catch (error) { if (/** @type {any} */ (error).kind === 'stopped' || /** @type {any} */ (error).kind === 'blocked') throw error; throw notReachable; }
      if (!response.ok) throw errorForStatus(response.status, label);
      for await (const event of ndjson(response, signal)) {
        if (event.error) throw new AiError('other', 'Ollama: ' + String(event.error).slice(0, 200));
        if (event.message?.content) yield event.message.content;
      }
    },
    async listModels() {
      let response;
      try { response = await settings.fetch(`${config.endpoint}/api/tags`, {}); } catch (_) { throw notReachable; }
      if (!response.ok) throw errorForStatus(response.status, label);
      const data = await response.json();
      return (data.models || []).map((/** @type {any} */ m) => ({ id: m.name, label: m.name }));
    },
    async checkConnection() {
      try {
        const models = await this.listModels();
        return models.length ? { ok: true, message: `Connected to Ollama. ${models.length} local model(s).` } : { ok: false, message: 'Ollama is running but has no models yet. Run: ollama pull ' + config.defaultModel };
      } catch (error) { return { ok: false, message: /** @type {Error} */ (error).message }; }
    },
  };
});
