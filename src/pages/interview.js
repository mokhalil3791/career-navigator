import { journeyHeading } from '../components/journey.js';
// @ts-check
/** Interview practice (FR-INT). Ported from v0.1 renderInterview. */
import { html, nothing } from 'lit-html';
import { icon } from '../components/icon.js';
import { aiButton, button, field, pageHeading } from '../components/ui.js';
import { exampleText } from '../components/example.js';
import { questionsFor } from '../content/build.js';

/** @param {import('../app-context.js').Ctx} ctx */
export function renderInterview(ctx) {
  const { state, t } = ctx;
  const questions = questionsFor(ctx.content, state.interview.packId);
  const idx = Math.max(0, Math.min(state.interview.questionIndex, questions.length - 1));
  const q = questions[idx];
  const last = idx === questions.length - 1;
  const move = (/** @type {number} */ direction) => {
    ctx.dispatch({ type: 'question', direction, count: questions.length });
    ctx.focusAfterRender(state.demo ? 'example-answer' : 'field-interview-answers-' + questions[Math.max(0, Math.min(questions.length - 1, idx + direction))].id);
  };
  return html`${journeyHeading(ctx, 'interview', 'Practise an answer using a real example.')}
${ctx.services.packPicker ? ctx.services.packPicker(ctx) : nothing}
<div class="split"><section class="card interview-card"><div class="question-counter"><span class="eyebrow">${t('Question {n} of {total}', { n: idx + 1, total: questions.length })}</span><div class="question-progress" aria-hidden="true">${questions.map((_, i) => html`<span class=${i <= idx ? 'active' : ''}></span>`)}</div></div>
${state.demo ? html`<p class="banner example-answer-note">${t('Example answer written for Sam. Read it, then write your own after you press Start my own.')}</p>` : nothing}
<h2 class="question-text">${t(q.question)}</h2><p class="question-tip">${t(q.tip)}</p>
${state.demo ? html`<div id="example-answer" class="example-answer preserve" tabindex="-1">${exampleText(state.interview.answers[q.id] || '')}</div>
<p class="field-hint example-gap-caption">${t('A good answer needs a real example here. Never invent one.')}</p><details class="details"><summary>${t('Edit this example answer')}</summary>${field(ctx, t('My answer'), 'interview.answers.' + q.id, { area: true, rows: 8, max: 12000, placeholder: t('Write an answer you could say in your own words.') })}</details>` : field(ctx, t('My answer'), 'interview.answers.' + q.id, { area: true, rows: 8, max: 12000, placeholder: t('Write an answer you could say in your own words.') })}
${ctx.services.voiceInput ? ctx.services.voiceInput(ctx, 'interview.answers.' + q.id) : nothing}
<div class="divider"></div><h3>${t('My self-review')}</h3><p class="card-sub">${t('Did I give a specific example? Is my own action clear? Is the result factual? What did I learn?')}</p>
<div class="mt-17">${field(ctx, t('One improvement for my next attempt'), 'interview.notes.' + q.id, { area: true, rows: 3, max: 12000, placeholder: t('e.g. Explain my contribution more clearly, then shorten the background.') })}</div>
<div class="form-footer">${button(t('← Previous'), () => move(-1), { disabled: idx === 0 })}${last ? button(html`${t('Make my learning plan')} ${icon('arrow', 16)}`, () => ctx.go('plan'), { style: '' }) : button(html`${t('Next question')} ${icon('arrow', 16)}`, () => move(1), { style: '' })}</div></section>
<aside class="grid"><section class="card soft"><p class="eyebrow">${t('A simple answer structure')}</p><h3 class="mt-10">${t('Try STAR.')}</h3><div class="star-grid"><div><strong>S</strong><small>${t('Situation')}<br>${t('What was happening?')}</small></div><div><strong>T</strong><small>${t('Task')}<br>${t('What was your goal?')}</small></div><div><strong>A</strong><small>${t('Action')}<br>${t('What did you do?')}</small></div><div><strong>R</strong><small>${t('Result')}<br>${t('What changed?')}</small></div></div></section>
<section class="card"><h3>${t('Practice, without a score.')}</h3><p class="card-sub">${t('This workspace saves your writing and reflections. It does not rate your language, accent or hiring chances.')}</p><p class="card-sub">${t('For feedback, ask a trusted person or use the optional AI interview.')}</p></section>
${state.demo && state.interview.mock.messages.length ? html`<section class="card example-exchange"><h3>${t('Example AI feedback')}</h3><p class="field-hint">${t('Fictional practice exchange. No AI was called.')}</p>${state.interview.mock.messages.map((m) => html`<p><strong>${m.role === 'me' ? t('Example answer') : t('Interviewer')}</strong></p><div class="preserve">${exampleText(m.text)}</div>`)}<div class="review-box preserve">${exampleText(state.interview.mock.feedback)}</div></section>` : nothing}
${ctx.services.knowledgeFor ? ctx.services.knowledgeFor(ctx, 'interview') : nothing}</aside></div>
`;
}
