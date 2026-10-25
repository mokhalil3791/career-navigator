// @ts-check
/**
 * Dutch-market knowledge pack: short, sourced cards shown where they help
 * (e.g. the CV card beside the CV editor), plus a "Learn" page with all cards
 * and upcoming free events. "Report a wrong fact" opens a pre-filled GitHub
 * issue: there is no analytics, so this is how mistakes reach the maintainers.
 */
import { html, nothing } from 'lit-html';
import { pageHeading } from '../../components/ui.js';
import { renderMarkdown } from '../../content/markdown.js';
import { buildKnowledge, cardsFor, upcomingEvents, isoDate } from '../../content/knowledge.js';
import { safeUrl } from '../../core/escape.js';
import brand from '../../../config/brand.json';
import eventsFile from '../../../content/events.json';

const knowledge = buildKnowledge(/** @type {Record<string, string>} */ (import.meta.glob('../../../content/knowledge/*/*.md', { eager: true, query: '?raw', import: 'default' })));

/** @param {import('../../app-context.js').Ctx} ctx @param {import('../../content/knowledge.js').Card} card @param {boolean} [open] */
function cardView(ctx, card, open = false) {
  const { t } = ctx;
  const report = `${brand.repoUrl}/issues/new?template=wrong-fact.yml&title=${encodeURIComponent('Wrong or outdated fact: ' + card.title)}`;
  return html`<details class="card knowledge" ?open=${open}><summary><span class="eyebrow">${t('Good to know')}</span><strong>${card.title}</strong><small>${card.summary}</small><span>${t('Read more')}</span></summary>
<div class="knowledge-body">${renderMarkdown(card.body)}</div>
<p class="source-note"><strong>${t('Sources:')}</strong> ${card.sources.map((s, i) => html`${i ? ' · ' : ''}<a href=${safeUrl(s.url)} target="_blank" rel="noopener noreferrer">${s.title}</a>`)}<br>${t('Last reviewed: {date}', { date: card.lastReviewed })}${card.lang !== ctx.state.settings.uiLanguage ? ' · ' + t('Shown in English until a translation is reviewed.') : ''}</p>
<p class="source-note">${t('This is general information, not legal, tax or benefits advice.')} <a href=${safeUrl(report)} target="_blank" rel="noopener noreferrer">${t('Report a wrong fact')}</a></p></details>`;
}

/** @param {import('../../app-context.js').Ctx} ctx */
function renderLearn(ctx) {
  const { t } = ctx;
  const { events } = upcomingEvents(eventsFile, isoDate());
  return html`${pageHeading(t('Learn / Dutch job market'), t('Know how it works here.'), t('Short cards about CVs, interviews, diplomas, language, contracts and support. Each one links to the official source and shows when it was last checked.'))}
<div class="grid">${cardsFor(knowledge.cards, 'learn', ctx.state.settings.uiLanguage).map((c) => cardView(ctx, /** @type {any} */ (c)))}</div>
<section class="card section-space"><h2>${t('Upcoming free events')}</h2>${events.length ? html`<ul class="event-list">${events.map((e) => html`<li><strong>${e.title}</strong><span class="muted small"> · ${e.date}${e.endDate ? ' – ' + e.endDate : ''}${e.place ? ' · ' + e.place : ''}${e.online ? ' · ' + t('online') : ''}</span>${e.description ? html`<p class="card-sub">${e.description}</p>` : nothing}${e.url && safeUrl(e.url) ? html`<a href=${safeUrl(e.url)} target="_blank" rel="noopener noreferrer">${t('More information')} ↗</a>` : nothing}</li>`)}</ul>` : html`<p class="card-sub">${t('No upcoming events listed. Coaches can add free events in content/events.json.')}</p>`}</section>`;
}

/** @param {any} app */
export function knowledgeModule(app) {
  app.services.knowledgeFor = (/** @type {any} */ ctx, /** @type {string} */ page) => {
    const cards = cardsFor(knowledge.cards, page, ctx.state.settings.uiLanguage).slice(0, 1);
    return cards.length ? html`${cards.map((c) => cardView(ctx, /** @type {any} */ (c)))}` : nothing;
  };
  const warnings = [...knowledge.warnings, ...upcomingEvents(eventsFile, isoDate()).warnings];
  if (warnings.length) app.ctx().content.warnings.push(...warnings);
  const plan = app.pages.findIndex((/** @type {any} */ p) => p.id === 'prompts');
  app.pages.splice(plan + 1, 0, { id: 'learn', label: 'Learn: Dutch job market', icon: 'book', render: renderLearn });
}

export { knowledge };
