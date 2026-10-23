// @ts-check
/**
 * Proposal review (principle 3, "The user decides"). AI suggestions are shown
 * as a visible before/after diff. Each one is accepted, edited or rejected
 * individually. THIS IS THE ONLY FILE that may mark an AI action as accepted
 * by the user (guardrail G4 checks this).
 */
import { html, nothing } from 'lit-html';
import { live } from 'lit-html/directives/live.js';
import { diffWords } from '../core/diff.js';
import { button } from './ui.js';

/**
 * @param {import('../app-context.js').Ctx} ctx
 * @param {import('../ai/tasks.js').Proposal[]} proposals
 * @param {Record<string, { status?: 'accepted' | 'rejected', text?: string }>} decisions screen-only state, kept by the caller
 */
export function proposalReview(ctx, proposals, decisions) {
  const { t } = ctx;
  if (!proposals.length) return html`<p class="card-sub">${t('The AI did not suggest any changes.')}</p>`;
  const open = proposals.filter((p) => !decisions[p.id]?.status).length;
  return html`<div class="proposals" role="list" aria-label=${t('AI suggestions to review')}>
<p class="card-sub">${t('Nothing changes until you accept. Check every suggestion against your own facts.')} <strong>${t('{n} left to review.', { n: open })}</strong></p>
${proposals.map((p) => {
    const d = decisions[p.id] || (decisions[p.id] = {});
    const text = d.text ?? p.after;
    if (d.status) return html`<article class="proposal done" role="listitem"><p><strong>${t(p.label)}</strong> — ${d.status === 'accepted' ? t('accepted') : t('rejected')}</p></article>`;
    const accept = () => {
      let ok = true;
      for (const action of p.actions(text)) ok = ctx.dispatch({ ...action, acceptedByUser: true }) && ok;
      if (ok) { d.status = 'accepted'; ctx.notify(t('Suggestion applied. Review it in context.')); ctx.rerender(); }
    };
    return html`<article class="proposal" role="listitem"><h3>${t(p.label)}</h3>
<div class="diff" aria-label=${t('Changes')}>${diffWords(p.before, text).map((part) => part.type === 'same' ? part.text : part.type === 'added' ? html`<ins>${part.text}</ins>` : html`<del>${part.text}</del>`)}</div>
${p.note ? html`<p class="source-note">${p.note}</p>` : nothing}
${p.editable === false ? nothing : html`<details class="details"><summary>${t('Edit before accepting')}</summary><label class="visually-hidden" for="edit-${p.id}">${t('Suggested text')}</label><textarea id="edit-${p.id}" rows="4" .value=${live(text)} @input=${(/** @type {Event} */ e) => { d.text = /** @type {HTMLTextAreaElement} */ (e.target).value; ctx.rerender(); }}></textarea></details>`}
<div class="actions mt-10">${button(t('Accept'), accept, { style: 'small' })}${button(t('Reject'), () => { d.status = 'rejected'; ctx.rerender(); }, { style: 'ghost small' })}</div></article>`;
  })}</div>`;
}
