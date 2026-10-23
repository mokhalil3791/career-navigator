// @ts-check
/** Readers for streamed HTTP responses: Server-Sent Events and newline-delimited JSON. */

/**
 * Yields each complete line of a streamed response body.
 * @param {Response} response
 * @param {AbortSignal} [signal]
 * @returns {AsyncGenerator<string>}
 */
export async function* lines(response, signal) {
  if (!response.body) { yield* (await response.text()).split('\n'); return; }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      if (signal?.aborted) return;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buffer.indexOf('\n')) !== -1) { yield buffer.slice(0, nl).replace(/\r$/, ''); buffer = buffer.slice(nl + 1); }
    }
    if (buffer) yield buffer;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parsed JSON payloads of an SSE stream ("data: {...}" lines; "[DONE]" ends it).
 * @param {Response} response
 * @param {AbortSignal} [signal]
 * @returns {AsyncGenerator<any>}
 */
export async function* sseJson(response, signal) {
  for await (const line of lines(response, signal)) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    try { yield JSON.parse(data); } catch (_) { /* skip keep-alive or partial lines */ }
  }
}

/**
 * Parsed objects of an NDJSON stream (one JSON object per line; used by Ollama).
 * @param {Response} response
 * @param {AbortSignal} [signal]
 * @returns {AsyncGenerator<any>}
 */
export async function* ndjson(response, signal) {
  for await (const line of lines(response, signal)) {
    if (!line.trim()) continue;
    try { yield JSON.parse(line); } catch (_) { /* skip */ }
  }
}
