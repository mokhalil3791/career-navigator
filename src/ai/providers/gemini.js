// @ts-check
/**
 * Gemini API, free tier, with the user's own Google AI Studio key.
 * The browser calls Google directly (the API allows browser CORS); there is no
 * Career Navigator server. The key goes in a header, never in the URL.
 */
import { AiError, errorForStatus, registerProvider } from '../provider.js';
import { sseJson } from '../stream.js';

registerProvider('gemini', (config, settings) => {
  const label = 'Gemini';
  const headers = () => ({ 'Content-Type': 'application/json', 'x-goog-api-key': settings.getKey() });
  return {
    id: 'gemini', label: config.label, config, capabilities: config.capabilities,
    async *generate({ system, messages, jsonSchema, signal, model }) {
      if (!settings.getKey()) throw new AiError('auth', 'Add your free Gemini key first.');
      const body = {
        contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        generationConfig: jsonSchema ? { responseMimeType: 'application/json', temperature: 0.2 } : { temperature: 0.4 },
      };
      const url = `${config.endpoint}/models/${encodeURIComponent(model || settings.getModel() || config.defaultModel)}:streamGenerateContent?alt=sse`;
      const response = await settings.fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body), signal });
      if (!response.ok) throw errorForStatus(response.status, label);
      for await (const event of sseJson(response, signal)) {
        if (event.error) throw errorForStatus(event.error.code || 500, label);
        const text = (event.candidates?.[0]?.content?.parts || []).map((/** @type {any} */ p) => p.text || '').join('');
        if (text) yield text;
      }
    },
    async listModels() {
      const response = await settings.fetch(`${config.endpoint}/models?pageSize=100`, { headers: headers() });
      if (!response.ok) throw errorForStatus(response.status, label);
      const data = await response.json();
      return (data.models || [])
        .filter((/** @type {any} */ m) => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/.test(m.name))
        .map((/** @type {any} */ m) => ({ id: m.name.replace(/^models\//, ''), label: m.displayName || m.name }));
    },
    async checkConnection() {
      try { const models = await this.listModels(); return { ok: true, message: `Connected. ${models.length} models available on your free key.` }; }
      catch (error) { return { ok: false, message: /** @type {Error} */ (error).message }; }
    },
  };
});
