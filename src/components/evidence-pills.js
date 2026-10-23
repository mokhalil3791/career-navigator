// @ts-check
/** Counts of evidence statuses for one advert: plain counts, no scores. */
import { html, nothing } from 'lit-html';
import { requirementsSummary } from '../core/evidence.js';

/**
 * @param {import('../app-context.js').Ctx} ctx
 * @param {any} job
 */
export function evidencePills(ctx, job) {
  const { t } = ctx;
  const s = requirementsSummary(job);
  return html`<div class="metrics"><span class="pill">${t('{n} supported', { n: s.supported })}</span><span class="pill sand">${t('{n} partial', { n: s.partial })}</span><span class="pill gray">${t('{n} not shown', { n: s.missing })}</span><span class="pill gray">${t('{n} unclear', { n: s.unknown })}</span>${s.needsEvidence ? html`<span class="pill alert">${t('{n} need evidence', { n: s.needsEvidence })}</span>` : nothing}</div>`;
}
