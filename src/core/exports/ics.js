// @ts-check
/**
 * Calendar (.ics) files for follow-ups, milestones and the next action
 * (FR-APP-2, FR-PLAN-3). All-day events, so time zones never shift a date.
 * Follows RFC 5545: CRLF line ends, escaped text, lines folded at 75 octets.
 */

/**
 * @typedef {{ uid: string, date: string, title: string, description?: string }} CalendarItem
 * date is YYYY-MM-DD
 */

/** @param {string} text */
function escapeText(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Folds a content line to at most 75 octets per line (continuation lines start with a space). @param {string} line */
function fold(line) {
  const bytes = new TextEncoder();
  const out = [];
  let current = '';
  for (const char of line) {
    if (bytes.encode(current + char).length > (out.length ? 74 : 75)) { out.push(current); current = char; }
    else current += char;
  }
  out.push(current);
  return out.join('\r\n ');
}

/** @param {string} date YYYY-MM-DD */
export function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date + 'T00:00:00Z'));
}

/** @param {string} date */
const compact = (date) => date.replace(/-/g, '');

/** @param {string} date */
function nextDay(date) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * @param {CalendarItem[]} items items without a valid date are skipped
 * @param {{ calendarName?: string, now?: Date }} [opts]
 * @returns {string} the .ics file text
 */
export function buildICS(items, opts = {}) {
  const stamp = (opts.now || new Date()).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Career Navigator//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + escapeText(opts.calendarName || 'Career Navigator')];
  for (const item of items.filter((i) => isValidDate(i.date))) {
    lines.push('BEGIN:VEVENT', 'UID:' + item.uid.replace(/[^\w.-]/g, '') + '@career-navigator', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + compact(item.date), 'DTEND;VALUE=DATE:' + compact(nextDay(item.date)), 'SUMMARY:' + escapeText(item.title));
    if (item.description) lines.push('DESCRIPTION:' + escapeText(item.description));
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + escapeText(item.title), 'TRIGGER:-PT9H', 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/**
 * Calendar items from the plan: the next action and the three milestones (FR-PLAN-3).
 * @param {any} plan
 * @returns {CalendarItem[]}
 */
export function planItems(plan) {
  /** @type {CalendarItem[]} */
  const items = [];
  if (plan.nextDate && plan.nextAction) items.push({ uid: 'next-action', date: plan.nextDate, title: 'Next step: ' + plan.nextAction.slice(0, 120), description: plan.nextAction });
  for (const [key, label] of [['day30', 'Day 30 milestone'], ['day60', 'Day 60 milestone'], ['day90', 'Day 90 milestone']]) {
    const date = plan.milestoneDates?.[key];
    if (date) items.push({ uid: 'milestone-' + key, date, title: label + (plan.targetRole ? ' · ' + plan.targetRole : ''), description: plan[key] || '' });
  }
  return items;
}

/**
 * Follow-up dates from the applications tracker (FR-APP-2).
 * @param {any[]} applications
 * @returns {CalendarItem[]}
 */
export function followUpItems(applications) {
  return applications.filter((a) => a.followUp && !['rejected', 'withdrawn'].includes(a.stage)).map((a) => ({
    uid: 'follow-up-' + a.id, date: a.followUp, title: 'Follow up: ' + (a.title || 'application') + (a.company ? ' — ' + a.company : ''),
    description: [a.contact && 'Contact: ' + a.contact, a.url && 'Advert: ' + a.url, a.notes].filter(Boolean).join('\n'),
  }));
}
