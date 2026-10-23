// @ts-check
/**
 * Evidence statuses for job requirements (principle 2: evidence, not scores).
 * "Supported" or "Partly supported" without written evidence counts as Unclear.
 */
import { STATUSES } from './schema.js';

/** Dropdown options in v0.1 order: [value, label]. */
export const STATUS_OPTIONS = /** @type {const} */ ([['unknown', 'Unclear'], ['supported', 'Supported'], ['partial', 'Partly supported'], ['missing', 'Not shown']]);
/** @type {Record<string, string>} */
export const STATUS_LABELS = { supported: 'Supported', partial: 'Partly supported', missing: 'Not shown', unknown: 'Unclear' };

/**
 * True when a requirement claims support but has no evidence text.
 * @param {{ status: string, evidence?: string }} r
 */
export function needsEvidence(r) {
  return (r.status === 'supported' || r.status === 'partial') && !(r.evidence || '').trim();
}

/**
 * Counts statuses for one advert. Ported from v0.1 requirementsSummary.
 * @param {{ requirements?: { status: string, evidence?: string }[] } | null | undefined} job
 */
export function requirementsSummary(job) {
  const result = { supported: 0, partial: 0, missing: 0, unknown: 0, needsEvidence: 0 };
  ((job && job.requirements) || []).forEach(function (r) {
    const status = STATUSES.indexOf(/** @type {any} */ (r.status)) === -1 ? 'unknown' : /** @type {'supported'|'partial'|'missing'|'unknown'} */ (r.status);
    if (needsEvidence({ status, evidence: r.evidence })) { result.needsEvidence++; result.unknown++; }
    else result[status]++;
  });
  return result;
}
