// @ts-check
/**
 * Coach view (FR-COACH), free and file-based: no account, no install, no server.
 *  Job seeker → "Download coach pack" (optional passphrase) → shares it by any channel.
 *  Coach → opens the same public app → "Open a coach pack" → read-only view → adds
 *  notes per section → "Download coach notes".
 *  Job seeker → imports the notes file → notes appear beside their work; nothing is overwritten.
 */
import { html, nothing } from 'lit-html';
import { live } from 'lit-html/directives/live.js';
import { button, pageHeading } from '../../components/ui.js';
import { icon } from '../../components/icon.js';
import { buildCoachPack, buildCoachNotes, openCoachPack, readCoachNotes, readCoachPack, SHARING_WARNING } from '../../core/exports/coach-pack.js';
import { profileText } from '../../core/prompts.js';
import { STATUS_LABELS } from '../../core/evidence.js';
import { STAGE_LABELS } from '../../core/applications.js';
import { uid } from '../../lib/uid.js';

const SECTIONS = [['profile', 'Profile'], ['jobs', 'Job comparisons'], ['cv', 'CV and letter'], ['interview', 'Interview practice'], ['plan', '90-day plan'], ['applications', 'Applications'], ['general', 'General']];

/** Read-only view of the job seeker's work, with a note box per section. @param {import('../../app-context.js').Ctx} ctx */
function renderCoach(ctx) {
  const { t, ui } = ctx;
  const coach = ui.coach;
  if (!coach) {
    return html`${pageHeading(t('Coach view'), t('Open a coach pack.'), t('A job seeker can send you a coach pack file. Open it here to read their work and add notes. Nothing is uploaded; the file stays on this device.'))}
<section class="card"><p class="card-sub">${t(SHARING_WARNING)}</p><div class="actions mt-15">${button(html`${icon('upload', 16)}${t('Open a coach pack')}`, () => ctx.services.importBackup(), { style: '', testid: 'open-coach-pack' })}</div></section>`;
  }
  const w = coach.workspace;
  const note = (/** @type {string} */ section) => html`<div class="field coach-note"><label for="coach-note-${section}">${t('My note for this section')}</label><textarea id="coach-note-${section}" rows="3" maxlength="4000" .value=${live(coach.notes[section] || '')} @input=${(/** @type {Event} */ e) => { coach.notes[section] = /** @type {HTMLTextAreaElement} */ (e.target).value; }}></textarea></div>`;
  const download = () => {
    const notes = Object.entries(coach.notes).map(([section, text]) => ({ id: uid('note'), section, note: String(text) }));
    if (!notes.some((n) => n.note.trim())) { ctx.notify(t('Write at least one note first.'), true); return; }
    try {
      ctx.download('coach-notes.json', buildCoachNotes(notes, { coach: coach.coachName }), 'application/json');
      ctx.notify(t('Coach notes downloaded. Send this small file back to the job seeker.'));
    } catch (error) { ctx.notify(/** @type {Error} */ (error).message, true); }
  };
  const p = (/** @type {string} */ text) => html`<p class="preserve card-sub">${text || t('Not yet recorded')}</p>`;
  return html`${pageHeading(t('Coach view · read only'), t('Review and add notes.'), t('You are viewing a copy. You cannot change the job seeker’s work; your notes go into a separate file.'))}
<div class="banner" role="note"><span>${t(SHARING_WARNING)}${w.demo ? ' ' + t('This is the fictional example.') : ''}</span>${button(t('Close the coach pack'), () => { ui.coach = null; ctx.rerender(); }, { style: 'small' })}</div>
<div class="field"><label for="coach-name">${t('Your name as coach')}<span class="optional">${t('optional')}</span></label><input id="coach-name" maxlength="100" .value=${live(coach.coachName)} @input=${(/** @type {Event} */ e) => { coach.coachName = /** @type {HTMLInputElement} */ (e.target).value; }}></div>
<section class="card section-space"><h2>${t('Profile')}</h2>${p(profileText(w))}${note('profile')}</section>
<section class="card section-space"><h2>${t('Job comparisons')}</h2>${w.jobs.length ? w.jobs.map((j) => html`<h3 class="mt-15">${j.title || t('Untitled advert')}${j.company ? ' — ' + j.company : ''}</h3><ul class="tip-list">${j.requirements.map((r) => html`<li><strong>${r.text}</strong>: ${t(STATUS_LABELS[r.status])}${r.evidence ? ' — ' + r.evidence : ''}</li>`)}</ul>`) : p('')}${note('jobs')}</section>
<section class="card section-space"><h2>${t('CV and letter')}</h2>${p([w.cv.headline, w.cv.summary, w.cv.experience, w.cv.education, w.cv.skills, w.cv.languages].filter(Boolean).join('\n\n'))}${w.cv.letter ? html`<h3>${t('Motivation letter')}</h3>${p(w.cv.letter)}` : nothing}${note('cv')}</section>
<section class="card section-space"><h2>${t('Interview practice')}</h2>${Object.entries(w.interview.answers).length ? Object.entries(w.interview.answers).map(([k, v]) => html`<h3 class="mt-10">${ctx.content.interviewQuestions.find((q) => q.id === k)?.question || k}</h3>${p(v)}`) : p('')}${note('interview')}</section>
<section class="card section-space"><h2>${t('90-day plan')}</h2>${p([w.plan.targetRole, ...w.plan.priorities, w.plan.project, w.plan.day30, w.plan.day60, w.plan.day90, w.plan.nextAction && t('Next action: {text}', { text: w.plan.nextAction })].filter(Boolean).join('\n'))}${note('plan')}</section>
<section class="card section-space"><h2>${t('Applications')}</h2>${w.applications.length ? html`<ul class="tip-list">${w.applications.map((a) => html`<li>${a.title || t('Untitled application')}${a.company ? ' — ' + a.company : ''} · ${t(STAGE_LABELS[/** @type {'saved'} */ (a.stage)])}</li>`)}</ul>` : p('')}${note('applications')}</section>
<section class="card section-space"><h2>${t('General')}</h2>${note('general')}<div class="actions mt-15">${button(html`${icon('download', 16)}${t('Download coach notes')}`, download, { style: '', testid: 'download-coach-notes' })}</div></section>`;
}

/** @param {any} app */
export function coachModule(app) {
  const s = app.services;
  app.pages.push({ id: 'coach', label: 'Coach view', icon: 'users', render: renderCoach });

  s.coachPackButton = (/** @type {any} */ ctx) => button(html`${icon('users', 16)}${ctx.t('Share with my coach')}`, () => { ctx.ui.coachShare = { passphrase: '', repeat: '' }; ctx.focusAfterRender('coach-share-title'); ctx.rerender(); }, { style: 'secondary', testid: 'coach-pack' });

  // The sharing dialog appears on the plan page.
  const renderPlan = app.pages.find((/** @type {any} */ p) => p.id === 'plan').render;
  app.pages.find((/** @type {any} */ p) => p.id === 'plan').render = (/** @type {any} */ ctx) => html`${renderPlan(ctx)}${ctx.ui.coachShare ? shareDialog(ctx) : nothing}`;

  /** @param {any} ctx */
  function shareDialog(ctx) {
    const { t, ui } = ctx;
    const d = ui.coachShare;
    const make = async () => {
      if (d.passphrase && d.passphrase !== d.repeat) { ctx.notify(t('The two passphrases are not the same.'), true); return; }
      try {
        const html = await buildCoachPack(ctx.state, ctx.content, { passphrase: d.passphrase || undefined });
        ctx.download(ctx.state.demo ? 'fictional-example-coach-pack.html' : 'my-coach-pack.html', html);
        ctx.notify(d.passphrase ? t('Protected coach pack downloaded. Send the passphrase in a different way than the file (for example by phone).') : t('Coach pack downloaded. Share it only with someone you trust.'));
        ui.coachShare = null; ctx.rerender();
      } catch (error) { ctx.notify(t(/** @type {Error} */ (error).message), true); }
    };
    return html`<section class="card section-space ai-panel" aria-labelledby="coach-share-title"><h2 id="coach-share-title" tabindex="-1">${t('Share with my coach')}</h2>
<p class="card-sub">${t('A coach pack is one file with your work pack inside. Your coach opens it in Career Navigator, adds notes and sends a small notes file back. Nothing is uploaded anywhere.')}</p>
<p class="evidence-warning mt-10" role="note">${t(SHARING_WARNING)}</p>
<div class="fields mt-15"><div class="field"><label for="coach-pass">${t('Passphrase (optional, at least 8 characters)')}</label><input id="coach-pass" type="password" autocomplete="new-password" .value=${live(d.passphrase)} @input=${(/** @type {Event} */ e) => { d.passphrase = /** @type {HTMLInputElement} */ (e.target).value; }}></div><div class="field"><label for="coach-pass2">${t('Repeat the passphrase')}</label><input id="coach-pass2" type="password" autocomplete="new-password" .value=${live(d.repeat)} @input=${(/** @type {Event} */ e) => { d.repeat = /** @type {HTMLInputElement} */ (e.target).value; }}></div></div>
<p class="field-hint">${t('With a passphrase, the file can only be opened by someone who knows it. Tell your coach the passphrase by phone or in person, not in the same message as the file.')}</p>
<div class="actions mt-15">${button(html`${icon('download', 16)}${t('Download coach pack')}`, make, { style: '', testid: 'download-coach-pack' })}${button(t('Cancel'), () => { ui.coachShare = null; ctx.rerender(); }, { style: 'ghost small' })}</div></section>`;
  }

  // Imports: a coach pack (opens the coach view) or coach notes (adds notes). Backups continue as before.
  s.importOther = async (/** @type {File} */ file, /** @type {string} */ text) => {
    const ctx = app.ctx();
    const { t } = ctx;
    if (/\.html?$/i.test(file.name) || text.trimStart().startsWith('<!doctype')) {
      const pack = readCoachPack(text);
      if (!pack) throw new Error(t('This HTML file is not a Career Navigator coach pack.'));
      const passphrase = pack.encrypted ? window.prompt(t('This coach pack is protected. Enter the passphrase:')) || '' : undefined;
      const workspace = await openCoachPack(text, passphrase);
      app.ui.coach = { workspace, notes: {}, coachName: '' };
      app.go('coach');
      app.notify(t('Coach pack opened read-only. Your own workspace was not changed.'));
      return true;
    }
    const notes = readCoachNotes(text);
    if (notes) {
      const existing = new Set(ctx.state.coachNotes.map((n) => n.id));
      let added = 0;
      for (const n of notes) if (!existing.has(n.id) && ctx.dispatch({ type: 'addRow', path: 'coachNotes', row: n })) added++;
      app.notify(t('{n} coach notes added beside your work. Nothing else was changed.', { n: added }));
      return true;
    }
    return false;
  };

  // Notes appear at the top of the matching page; general notes on the overview.
  s.coachNotesFor = (/** @type {any} */ ctx, /** @type {string} */ view) => {
    const section = view === 'home' ? 'general' : view;
    const notes = ctx.state.coachNotes.filter((/** @type {any} */ n) => n.section === section);
    if (!notes.length || view === 'coach') return nothing;
    return html`<aside class="card soft coach-notes section-space" aria-label=${ctx.t('Notes from my coach')}><h2>${ctx.t('Notes from my coach')}</h2>${notes.map((/** @type {any} */ n) => html`<blockquote><p class="preserve">${n.note}</p><footer class="small muted">${n.coach || ctx.t('Coach')} · ${n.date}</footer></blockquote>`)}${button(ctx.t('Remove these notes'), () => { for (const n of notes) ctx.dispatch({ type: 'removeRow', path: 'coachNotes', id: n.id }); }, { style: 'ghost small' })}</aside>`;
  };
  void SECTIONS;
}
