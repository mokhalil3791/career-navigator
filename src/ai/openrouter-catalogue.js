// @ts-check
import { publicOpenRouterModels } from './net.js';
import { isFreeModel } from './providers/openrouter.js';
import config from '../../config/providers.json';
/** Public metadata only. An empty valid list is not a network failure.
 * @param {typeof fetch} [fetchImpl]
 */
export async function freeCatalogue(fetchImpl) {
  try {
    const response = await publicOpenRouterModels(fetchImpl);
    if (!response.ok) throw new Error('Catalogue unavailable');
    const data = await response.json();
    if (!Array.isArray(data.data)) throw new Error('Invalid catalogue');
    return { fallback: false, models: data.data.filter(isFreeModel).map((/** @type {any} */ m) => ({ id: m.id, label: String(m.name || m.id) })) };
  } catch {
    return { fallback: true, models: (config.api.find(p => p.id === 'openrouter')?.models || []).filter(isFreeModel) };
  }
}
