// @ts-check
/**
 * Knowledge cards (content/knowledge/<lang>/*.md) and events (content/events.json).
 * Loaded at build time, checked against their schemas, and skipped with a
 * warning when invalid, like every other content file.
 */
import { parseFrontmatter } from './frontmatter.js';
import { validate } from './json-schema.js';
import knowledgeSchema from '../../content/schemas/knowledge.schema.json';
import eventsSchema from '../../content/schemas/events.schema.json';

/**
 * @typedef {{ id: string, title: string, summary: string, appearsOn: string[], lastReviewed: string, sources: { title: string, url: string }[], lang: string, body: string }} Card
 */

/**
 * @param {Record<string, string>} files path → raw Markdown
 * @returns {{ cards: Card[], warnings: string[] }}
 */
export function buildKnowledge(files) {
  /** @type {Card[]} */
  const cards = [];
  /** @type {string[]} */
  const warnings = [];
  for (const [path, raw] of Object.entries(files)) {
    try {
      const { data, body } = parseFrontmatter(raw);
      const errors = validate(knowledgeSchema, data);
      if (errors.length) { warnings.push(`Skipped knowledge card ${path.split('/').pop()}: ${errors[0]}`); continue; }
      cards.push(/** @type {Card} */ ({ ...data, body }));
    } catch (error) {
      warnings.push(`Skipped knowledge card ${path.split('/').pop()}: ${/** @type {Error} */ (error).message}`);
    }
  }
  return { cards, warnings };
}

/**
 * Cards for one page in the user's interface language, falling back to English.
 * @param {Card[]} cards
 * @param {string} page
 * @param {string} lang
 */
export function cardsFor(cards, page, lang) {
  const ids = [...new Set(cards.filter((c) => page === 'learn' || c.appearsOn.includes(page)).map((c) => c.id))];
  return ids.map((id) => cards.find((c) => c.id === id && c.lang === lang) || cards.find((c) => c.id === id && c.lang === 'en')).filter(Boolean);
}

/**
 * Events that have not ended yet, soonest first. Only free events are listed.
 * @param {any} data content/events.json
 * @param {string} today YYYY-MM-DD
 * @returns {{ events: any[], warnings: string[] }}
 */
export function upcomingEvents(data, today) {
  const errors = validate(eventsSchema, data);
  if (errors.length) return { events: [], warnings: ['Skipped content/events.json: ' + errors[0]] };
  const events = data.events.filter((/** @type {any} */ e) => (e.endDate || e.date) >= today).sort((/** @type {any} */ a, /** @type {any} */ b) => a.date.localeCompare(b.date));
  return { events, warnings: [] };
}

/** @param {Date} [d] @returns {string} YYYY-MM-DD in local time */
export function isoDate(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
