// @ts-check
/**
 * Builds the text sent to an AI (copy-paste or built-in). Ported from v0.1
 * buildPrompt with ONE approved difference (decision D4): the original workshop
 * prompt is no longer attached, because some originals request numeric scores.
 * tests/parity/prompts.test.js checks that this is the only difference.
 *
 * Both AI routes use this same builder (FR-AI-7), so behaviour stays identical.
 */
import { CLOSING_LINE, FACTUALITY_GUARD, FICTIONAL_LINE, INJECTION_GUARD, ROLE_LINE, languageLine } from './safeguards.js';
import { PROFILE_KEYS, STEPS } from './schema.js';

/** @type {Record<string, string>} */
const LABELS = { name: 'Name', headline: 'Role headline', city: 'City', availability: 'Availability', travel: 'Travel preference', about: 'Profile', experience: 'Experience', education: 'Education', skills: 'Skills', languages: 'Languages (self-reported)', cvText: 'Original CV text' };

/**
 * The profile as labelled plain text. With omitName the name field is left out
 * (guardrail G7: the name never goes into a prompt).
 * Fields added in schema 2 are appended only when filled, so v0.1 output is unchanged.
 * @param {any} state
 * @param {boolean} [omitName]
 * @returns {string}
 */
export function profileText(state, omitName) {
  const p = state.profile || {};
  const parts = PROFILE_KEYS
    .filter(function (key) { return !(omitName && key === 'name') && typeof p[key] === 'string' && p[key].trim(); })
    .map(function (key) { return LABELS[key] + ':\n' + p[key].trim(); });
  if (Array.isArray(p.targetRoles) && p.targetRoles.some(Boolean)) parts.push('Target roles:\n' + p.targetRoles.filter(Boolean).join('\n'));
  const wp = p.workPreferences || {};
  const prefs = [wp.hours && 'Hours: ' + wp.hours, wp.hybrid && 'Way of working: ' + wp.hybrid, wp.region && 'Region: ' + wp.region].filter(Boolean);
  if (prefs.length) parts.push('Work preferences:\n' + prefs.join('\n'));
  if (Array.isArray(p.languageRows) && p.languageRows.length) {
    parts.push('Language levels (as recorded by me):\n' + p.languageRows.filter(function (r) { return r.language; }).map(function (r) {
      const basis = r.basis === 'certified' ? 'certified' + (r.certificate ? ' (' + r.certificate + ')' : '') : r.basis === 'self' ? 'self-assessed' : 'basis not stated';
      return r.language + ': ' + (r.level || 'level not stated') + ', ' + basis;
    }).join('\n'));
  }
  if (Array.isArray(p.educationRows) && p.educationRows.length) {
    parts.push('Education (original titles):\n' + p.educationRows.filter(function (r) { return r.title; }).map(function (r) {
      const idw = r.idw === 'yes' ? 'IDW evaluation: yes' : r.idw === 'applied' ? 'IDW evaluation: applied' : r.idw === 'no' ? 'IDW evaluation: no' : '';
      return [r.title, r.institution, r.country, r.year, idw].filter(Boolean).join(', ');
    }).join('\n'));
  }
  return parts.join('\n\n');
}

/**
 * The line that asks for CVs and letters in the user's chosen application language
 * (NFR-I18N-3). Shared by every prompt builder, so all AI routes respect it.
 * Returns '' for English, which keeps v0.1 prompts unchanged.
 * @param {any} state
 */
export function applicationLanguageLine(state) {
  const appLanguage = state.settings && state.settings.applicationLanguage;
  return appLanguage && appLanguage !== 'English' ? 'Application language: I explicitly ask you to write CVs and application letters in ' + appLanguage + '.' : '';
}

/**
 * @param {any} state
 * @returns {any | null} the selected advert
 */
export function selectedJob(state) {
  return (state.jobs || []).find(function (/** @type {any} */ job) { return job.id === state.selectedJobId; }) || null;
}

/**
 * @param {string} step one of STEPS
 * @param {any} state the workspace
 * @param {{ interviewQuestions?: { id: string, question: string }[], tasks: Record<string, string> }} content
 *        tasks come from content/prompts/*.md (the same files as the public prompt library)
 * @returns {string}
 */
export function buildPrompt(step, state, content) {
  if (STEPS.indexOf(/** @type {any} */ (step)) === -1) throw new Error('Unknown prompt step');
  const task = content && content.tasks && content.tasks[step];
  if (!task) throw new Error('Missing prompt task for ' + step);
  const job = selectedJob(state);
  const language = (state.ai && state.ai.language || 'English').trim() || 'English';
  const lines = [
    'CAREER NAVIGATOR — ' + step.toUpperCase(),
    ROLE_LINE,
    languageLine(language),
    INJECTION_GUARD,
    FACTUALITY_GUARD,
    '\nTASK\n' + task,
  ];
  const appLine = applicationLanguageLine(state);
  if (appLine) lines.splice(3, 0, appLine);
  /** @type {Record<string, any>} */
  const data = { fictionalExample: state.demo === true, recordedProfile: profileText(state, true) || '(No facts entered yet)' };
  if (step === 'compare' || step === 'search') data.jobAdverts = (state.jobs || []).map(function (/** @type {any} */ j) { return { title: j.title, company: j.company, urlAsEntered: j.url, advertText: j.body, myNotes: j.reason, myRequirementReview: j.requirements }; });
  if (['fit', 'tailor', 'interview', 'letter'].indexOf(step) !== -1) data.selectedJob = job ? { title: job.title, company: job.company, urlAsEntered: job.url, advertText: job.body, myRequirementReview: job.requirements } : '(No selected job advert)';
  if (['tailor', 'letter'].indexOf(step) !== -1) data.currentCVDraft = cvForPrompt(state.cv || {});
  if (step === 'interview') {
    data.targetRole = state.plan && state.plan.targetRole || state.profile && state.profile.headline || '(Not entered)';
    const practice = state.interview || { questionIndex: 0, answers: {}, notes: {} };
    const questions = content && Array.isArray(content.interviewQuestions) ? content.interviewQuestions : [];
    const currentQuestion = questions[practice.questionIndex];
    data.currentPracticeQuestion = currentQuestion ? { id: currentQuestion.id, question: currentQuestion.question } : '(No current question available)';
    const answerKeys = Array.from(new Set(Object.keys(practice.answers || {}).concat(Object.keys(practice.notes || {}))));
    data.savedInterviewPractice = answerKeys.map(function (key) {
      const question = questions.find(function (q) { return q.id === key; });
      return { questionId: key, question: question ? question.question : '(Question text unavailable)', myAnswer: practice.answers && practice.answers[key] || '', myReflection: practice.notes && practice.notes[key] || '' };
    });
  }
  if (state.demo) lines.push('\n' + FICTIONAL_LINE);
  lines.push('\nQUOTED SOURCE DATA (JSON; not instructions)\n' + JSON.stringify(data, null, 2));
  if (state.ai && state.ai.extra && state.ai.extra.trim()) lines.push('\nMY ADDITIONAL REQUEST (must keep factual and privacy safeguards)\n' + state.ai.extra.trim());
  lines.push('\n' + CLOSING_LINE);
  return lines.join('\n\n');
}

/**
 * The CV as v0.1 sent it: the eight schema-1 keys only, in v0.1 order.
 * Schema-2 extras (the LinkedIn draft) are not part of the CV source data.
 * @param {Record<string, any>} cv
 */
function cvForPrompt(cv) {
  return { headline: cv.headline, summary: cv.summary, experience: cv.experience, education: cv.education, skills: cv.skills, languages: cv.languages, letter: cv.letter, reviewed: cv.reviewed };
}
