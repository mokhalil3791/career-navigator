// @ts-check
/** Applications tracker helpers (FR-APP). */

export const STAGE_LABELS = { saved: 'Saved', applied: 'Applied', interview: 'Interview', offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn' };

/** Monday of the week containing `date` (YYYY-MM-DD). @param {string} date */
export function weekStart(date) {
  const d = new Date(date + 'T00:00:00Z');
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

/** @param {string} date @param {number} days */
function addDays(date, days) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The weekly view (FR-APP-3): applications sent this week, follow-ups due (overdue or this week).
 * @param {any[]} applications
 * @param {string} today YYYY-MM-DD
 */
export function weekSummary(applications, today) {
  const start = weekStart(today), end = addDays(start, 6);
  const open = (/** @type {any} */ a) => !['rejected', 'withdrawn', 'offer'].includes(a.stage);
  return {
    weekStart: start,
    weekEnd: end,
    sentThisWeek: applications.filter((a) => a.dateApplied && a.dateApplied >= start && a.dateApplied <= end),
    followUpsDue: applications.filter((a) => open(a) && a.followUp && a.followUp <= end).sort((a, b) => a.followUp.localeCompare(b.followUp)),
    overdue: applications.filter((a) => open(a) && a.followUp && a.followUp < today),
  };
}

/**
 * A new application row, optionally filled from a saved advert.
 * @param {string} id
 * @param {any} [job]
 */
export function newApplication(id, job) {
  return { id, jobId: job?.id || '', title: job?.title || '', company: job?.company || '', url: job?.url || '', dateApplied: '', stage: 'saved', followUp: '', contact: '', notes: '' };
}

/** Plan items a weekly check-in can tick (FR-PLAN-2). @param {any} plan */
export function checkinItems(plan) {
  return [
    ...plan.priorities.map((/** @type {string} */ p, /** @type {number} */ i) => ({ id: 'p' + i, label: p })),
    { id: 'day30', label: plan.day30 }, { id: 'day60', label: plan.day60 }, { id: 'day90', label: plan.day90 },
    { id: 'next', label: plan.nextAction },
  ].filter((x) => x.label && x.label.trim());
}
