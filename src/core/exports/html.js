// @ts-check
/**
 * Printable, self-contained HTML files: the CV and the personal work pack.
 * Ported unchanged from v0.1 (tests/parity/exports.test.js compares byte for byte).
 * These are built as strings because they are downloaded files, not live screens;
 * every value goes through escapeHTML.
 */
import { escapeHTML, safeUrl } from '../escape.js';
import { profileText } from '../prompts.js';
import { STEPS } from '../schema.js';

export { escapeHTML, safeUrl };

/** @param {unknown} value @param {string} [cls] */
function paragraph(value, cls) { return value && String(value).trim() ? '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + escapeHTML(value) + '</p>' : ''; }
/** @param {string} title @param {unknown} value */
function section(title, value) { return value && String(value).trim() ? '<section><h2>' + escapeHTML(title) + '</h2>' + paragraph(value, 'preserve') + '</section>' : ''; }

/**
 * Wraps a body in a standalone document with its own strict CSP and print styles.
 * @param {string} title
 * @param {string} body already-escaped HTML
 * @param {string} [lang] document language, e.g. "en" or "nl"
 */
export function documentHTML(title, body, lang = 'en') {
  return '<!doctype html>\n<html lang="' + escapeHTML(lang) + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><title>' + escapeHTML(title) + '</title><style>body{font:15px/1.55 Arial,sans-serif;color:#172c35;max-width:800px;margin:36px auto;padding:0 28px}h1{font-size:32px;line-height:1.15;margin-bottom:8px}h2{font-size:19px;border-bottom:1px solid #b8c5ca;padding-bottom:5px;margin-top:26px}h3{font-size:16px;margin:20px 0 6px}p{margin:8px 0}.preserve{white-space:pre-wrap;overflow-wrap:anywhere}.muted{color:#52646b}.banner{background:#fff3d6;border:1px solid #bd8500;padding:12px}.meta{color:#52646b}.letter{break-before:page}table{width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed}th,td{text-align:left;vertical-align:top;border:1px solid #b8c5ca;padding:8px;overflow-wrap:anywhere;white-space:pre-wrap}th{background:#edf2f2}a{color:#145a6a;overflow-wrap:anywhere}section{break-inside:auto}li{margin:6px 0}footer{border-top:1px solid #b8c5ca;margin-top:30px;padding-top:12px;color:#52646b;font-size:12px}@page{size:A4;margin:18mm}@media print{body{max-width:none;margin:0;padding:0;font-size:10.5pt}h1{font-size:24pt}h2{font-size:14pt}h2,h3{break-after:avoid}tr{break-inside:avoid}.banner{background:none}}</style></head><body>' + body + '</body></html>';
}

/** CV section headings per application language (NFR-I18N-3). English is the v0.1 text. */
export const CV_HEADINGS = {
  English: { cv: 'My CV', profile: 'Profile', experience: 'Experience', education: 'Education', skills: 'Skills', languages: 'Languages', letter: 'Motivation letter' },
  Dutch: { cv: 'Mijn cv', profile: 'Profiel', experience: 'Werkervaring', education: 'Opleidingen', skills: 'Vaardigheden', languages: 'Talen', letter: 'Motivatiebrief' },
};

/** @param {any} state */
export function cvLanguage(state) {
  return state.settings && state.settings.applicationLanguage === 'Dutch' ? 'Dutch' : 'English';
}

/**
 * @param {any} state
 * @param {boolean} includeReview
 */
export function cvBody(state, includeReview) {
  const cv = state.cv, p = state.profile;
  const h = CV_HEADINGS[cvLanguage(state)];
  let body = state.demo ? '<p class="banner"><strong>FICTIONAL EXAMPLE — practice data, not a real application.</strong></p>' : '';
  body += '<h1>' + escapeHTML(p.name || h.cv) + '</h1>' + paragraph(cv.headline, 'meta');
  body += paragraph([p.city, p.availability].filter(Boolean).join(' · '), 'meta');
  if (includeReview) body += '<p class="banner">CV status: ' + (cv.reviewed === true ? 'marked reviewed by the user' : 'not yet reviewed — check every claim before sharing') + '.</p>';
  body += section(h.profile, cv.summary) + section(h.experience, cv.experience) + section(h.education, cv.education) + section(h.skills, cv.skills) + section(h.languages, cv.languages);
  if (cv.letter && cv.letter.trim()) body += '<section class="letter"><h2>' + escapeHTML(h.letter) + '</h2>' + paragraph(cv.letter, 'preserve') + '</section>';
  return body;
}

/**
 * The CV download. Throws unless the user ticked the review box (guardrail G3).
 * @param {any} state
 */
export function buildCVHTML(state) {
  if (!state || !state.cv || state.cv.reviewed !== true) throw new Error('Review every CV and letter claim, then mark the draft reviewed before exporting.');
  return documentHTML((state.profile.name || 'My') + ' — CV', cvBody(state, false), cvLanguage(state) === 'Dutch' ? 'nl' : 'en');
}

/**
 * The body of the personal work pack (also embedded in the coach pack).
 * @param {any} state
 * @param {{ interviewQuestions?: { id: string, question: string }[] }} content
 */
export function packBody(state, content) {
  let body = '<h1>My career work pack</h1><p class="muted">Personal preparation notes. This pack is not a recruitment submission. Keep it private: it may contain personal details and unverified AI drafts.</p>';
  if (state.demo) body += '<p class="banner"><strong>FICTIONAL EXAMPLE — all sample people and adverts are invented for practice.</strong></p>';
  body += section('1. Recorded profile facts', profileText(state));
  body += '<section><h2>2. Job comparisons</h2><p>Requirements and ordering reflect the user’s own review. No automated fit score is used. “Not shown” means evidence is missing, not that a skill is absent.</p>';
  if (!(state.jobs || []).length) body += '<p>No adverts saved.</p>';
  /** @type {Record<string, string>} */
  const statusLabels = { supported: 'Supported', partial: 'Partly supported', missing: 'Not shown', unknown: 'Unclear' };
  (state.jobs || []).forEach(function (/** @type {any} */ job, /** @type {number} */ i) {
    body += '<h3>' + (i + 1) + '. ' + escapeHTML(job.title || 'Untitled job') + (job.company ? ' — ' + escapeHTML(job.company) : '') + '</h3>';
    const url = safeUrl(job.url);
    if (url) body += '<p><a href="' + escapeHTML(url) + '" rel="noreferrer noopener">' + escapeHTML(url) + '</a></p>';
    body += paragraph(job.reason, 'preserve');
    if ((job.requirements || []).length) {
      body += '<table><thead><tr><th>Requirement</th><th>My review</th><th>Evidence</th><th>Next step</th></tr></thead><tbody>';
      job.requirements.forEach(function (/** @type {any} */ r) {
        const noEvidence = (r.status === 'supported' || r.status === 'partial') && !(r.evidence || '').trim();
        body += '<tr><td>' + escapeHTML(r.text) + '</td><td>' + escapeHTML(statusLabels[r.status] || 'Unclear') + (noEvidence ? ' — evidence needed; not counted as supported' : '') + '</td><td>' + escapeHTML(r.evidence) + '</td><td>' + escapeHTML(r.nextStep) + '</td></tr>';
      });
      body += '</tbody></table>';
    }
    body += section('Saved advert text', job.body);
  });
  body += '</section><section><h2>3. CV draft and letter</h2>' + cvBody(state, true) + '</section>';
  body += '<section><h2>4. Interview practice</h2>';
  const keys = Array.from(new Set(Object.keys(state.interview.answers || {}).concat(Object.keys(state.interview.notes || {}))));
  if (!keys.length) body += '<p>No answers saved.</p>';
  keys.forEach(function (key) {
    const question = content && Array.isArray(content.interviewQuestions) && content.interviewQuestions.find(function (q) { return q.id === key; });
    const label = question ? question.question : 'Question ' + key.replace(/^q(?=\d)/, '');
    body += '<h3>' + escapeHTML(label) + '</h3>' + section('My answer', state.interview.answers[key]) + section('My reflection', state.interview.notes[key]);
  });
  body += '</section><section><h2>5. My 90-day plan</h2>';
  const plan = state.plan;
  body += paragraph('Target role: ' + (plan.targetRole || 'Not selected')) + paragraph('Study time: ' + plan.hours + ' hours per week');
  body += '<h3>Three learning priorities</h3><ol>' + plan.priorities.map(function (/** @type {string} */ priority) { return '<li>' + escapeHTML(priority || 'Not yet chosen') + '</li>'; }).join('') + '</ol>';
  body += section('Portfolio project', plan.project) + section('By day 30', plan.day30) + section('By day 60', plan.day60) + section('By day 90', plan.day90) + section('My next action', plan.nextAction) + section('Next action date', plan.nextDate);
  body += '<p class="muted">This is a personal learning plan, not a guarantee of employment or an official employer requirement.</p></section>';
  const draftKeys = STEPS.filter(function (key) { return state.ai.drafts[key] && state.ai.drafts[key].trim(); });
  if (draftKeys.length) {
    body += '<section><h2>6. Saved AI drafts — unverified</h2><p>AI can make mistakes. Check source facts and every claim before use.</p>';
    draftKeys.forEach(function (key) { body += section(key, state.ai.drafts[key]); });
    body += '</section>';
  }
  body += '<footer>Prepared with Career Navigator. Independent open-source career preparation tool; no employer endorsement or hiring decision is implied.</footer>';
  return body;
}

/**
 * The work pack download. Ported from v0.1 buildPackHTML.
 * @param {any} state
 * @param {{ interviewQuestions?: { id: string, question: string }[] }} content
 */
export function buildPackHTML(state, content) {
  return documentHTML('Career Navigator — personal work pack', packBody(state, content));
}
