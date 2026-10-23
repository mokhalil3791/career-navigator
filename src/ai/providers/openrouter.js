// @ts-check
/**
 * OpenRouter free models with the user's own key. Only models priced at zero
 * are offered (config freeOnly), so a participant can never run up a bill.
 */
import { AiError, errorForStatus, registerProvider } from '../provider.js';
import { sseJson } from '../stream.js';

/** @param {any} m an OpenRouter model entry */
export function isFreeModel(m) {
  return String(m.id || '').endsWith(':free') || (m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0);
}

registerProvider('openrouter', (config, settings) => {
  const label = 'OpenRouter';
  return {
    id: 'openrouter', label: config.label, config, capabilities: config.capabilities,
    async *generate({ system, messages, jsonSchema, signal, model }) {
      if (!settings.getKey()) throw new AiError('auth', 'Add your free OpenRouter key first.');
      const chosen = model || settings.getModel() || config.defaultModel;
      // Free forever: refuse any model that is not explicitly free.
      if (config.freeOnly && !chosen.endsWith(':free')) throw new AiError('other', 'Only free models (ending in ":free") can be used here.');
      const body = {
        model: chosen, stream: true,
        messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages],
        ...(jsonSchema ? { response_format: { type: 'json_object' } } : {}),
      };
      const response = await settings.fetch(`${config.endpoint}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + settings.getKey(), 'X-Title': 'Career Navigator' }, body: JSON.stringify(body), signal });
      if (!response.ok) throw errorForStatus(response.status, label);
      for await (const event of sseJson(response, signal)) {
        if (event.error) throw errorForStatus(event.error.code || 500, label);
        const text = event.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    },
    async listModels() {
      const response = await settings.fetch(`${config.endpoint}/models`, {});
      if (!response.ok) throw errorForStatus(response.status, label);
      const data = await response.json();
      return (data.data || []).filter(isFreeModel).map((/** @type {any} */ m) => ({ id: m.id, label: m.name || m.id }));
    },
    async checkConnection() {
      try {
        const response = await settings.fetch(`${config.endpoint}/key`, { headers: { Authorization: 'Bearer ' + settings.getKey() } });
        if (!response.ok) throw errorForStatus(response.status, label);
        return { ok: true, message: 'Connected. Only free models are listed.' };
      } catch (error) { return { ok: false, message: /** @type {Error} */ (error).message }; }
    },
  };
});
