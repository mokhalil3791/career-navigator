// @ts-check
/**
 * The workspace: everything a user creates, in one plain object.
 * Schema v2 = the v0.1 (schema 1) shape, unchanged, plus new optional sections
 * that all have safe defaults. normalizeWorkspace() is the only way data from
 * outside (backups, device storage, coach files) gets into the app.
 *
 * Dignity rule (guardrail G9): there are deliberately NO fields for refugee or
 * residence status, nationality, date of birth, BSN, photo, religion or health.
 */
import { boolean, dictionary, fail, identifier, integer, list, oneOf, record, string } from './validate.js';

export const SCHEMA_VERSION = 2;
export const MAX_JOBS = 8;
export const MAX_REQUIREMENTS = 20;
export const MAX_APPLICATIONS = 60;
export const STEPS = /** @type {const} */ (['profile', 'search', 'compare', 'fit', 'tailor', 'interview', 'letter']);
export const STATUSES = /** @type {const} */ (['supported', 'partial', 'missing', 'unknown']);
export const PROFILE_KEYS = ['name', 'headline', 'city', 'availability', 'travel', 'about', 'experience', 'education', 'skills', 'languages', 'cvText'];
export const CV_KEYS = ['headline', 'summary', 'experience', 'education', 'skills', 'languages', 'letter'];
export const PLAN_TEXT_KEYS = ['targetRole', 'project', 'day30', 'day60', 'day90', 'nextAction', 'nextDate'];
export const CEFR_LEVELS = /** @type {const} */ (['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']);
export const STAGES = /** @type {const} */ (['saved', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']);
export const DUTCH_DEMAND = /** @type {const} */ (['', 'required', 'plus', 'not-stated']);

/**
 * A fresh, empty workspace.
 * @returns {Workspace}
 */
export function newWorkspace() {
  return {
    schemaVersion: SCHEMA_VERSION,
    demo: false,
    profile: {
      name: '', headline: '', city: '', availability: '', travel: '', about: '', experience: '', education: '', skills: '', languages: '', cvText: '',
      targetRoles: [], workPreferences: { hours: '', hybrid: '', region: '' }, languageRows: [], educationRows: [],
    },
    jobs: [], selectedJobId: '',
    cv: { headline: '', summary: '', experience: '', education: '', skills: '', languages: '', letter: '', reviewed: false, linkedin: { headline: '', about: '', bullets: '' } },
    interview: { questionIndex: 0, answers: {}, notes: {}, packId: 'default', mock: { messages: [], feedback: '' } },
    plan: { roleId: 'custom', targetRole: '', priorities: ['', '', ''], project: '', day30: '', day60: '', day90: '', nextAction: '', nextDate: '', hours: 6, milestoneDates: { day30: '', day60: '', day90: '' }, checkins: [] },
    applications: [],
    ai: { step: 'profile', language: 'English', extra: '', drafts: { profile: '', search: '', compare: '', fit: '', tailor: '', interview: '', letter: '' }, customPrompts: [] },
    coachNotes: [],
    settings: { remember: false, uiLanguage: 'en', applicationLanguage: 'English', simpleLanguage: false, onboarded: false, aiMode: 'copy' },
  };
}

/** @typedef {ReturnType<typeof blankTypes>} Workspace */
// Helper only for JSDoc: gives Workspace a precise type without a separate .d.ts file.
function blankTypes() {
  return {
    schemaVersion: 2, demo: false,
    profile: /** @type {Record<string, any>} */ ({}),
    jobs: /** @type {Job[]} */ ([]), selectedJobId: '',
    cv: /** @type {Record<string, any>} */ ({}),
    interview: /** @type {Record<string, any>} */ ({}),
    plan: /** @type {Record<string, any>} */ ({}),
    applications: /** @type {Record<string, any>[]} */ ([]),
    ai: /** @type {Record<string, any>} */ ({}),
    coachNotes: /** @type {Record<string, any>[]} */ ([]),
    settings: /** @type {Record<string, any>} */ ({}),
  };
}

/**
 * @typedef {object} Requirement
 * @property {string} id
 * @property {string} text
 * @property {'supported'|'partial'|'missing'|'unknown'} status
 * @property {string} evidence
 * @property {string} nextStep
 * @property {''|'must'|'nice'} [kind]
 */
/**
 * @typedef {object} Job
 * @property {string} id
 * @property {string} title
 * @property {string} company
 * @property {string} url
 * @property {string} body
 * @property {string} reason
 * @property {Requirement[]} requirements
 * @property {{ hours: string, location: string, dutch: string, dutchLevel: string }} [facts]
 */

/**
 * Validates a list of rows that each have an id, keeping ids unique.
 * @param {unknown} value
 * @param {string} path
 * @param {number} max
 * @param {(row: Record<string, any>, id: string) => Record<string, any>} build
 */
function rows(value, path, max, build) {
  const seen = new Set();
  return list(value, path, max).map(function (item, index) {
    const r = record(item, path + ' ' + (index + 1));
    const id = identifier(r.id, path + '.id');
    if (seen.has(id)) fail(path, 'duplicate identifier');
    seen.add(id);
    return build(r, id);
  });
}

/**
 * Checks and copies a schema-2 workspace. Unknown keys are dropped, so nothing
 * unexpected (for example a residence-status field) survives an import.
 * Call migrate() first for older versions.
 * @param {unknown} input
 * @returns {Workspace}
 */
export function normalizeWorkspace(input) {
  const src = record(input, 'Workspace');
  if (src.schemaVersion !== SCHEMA_VERSION) fail('Workspace', 'unsupported or missing schemaVersion; this version accepts schema 1 or 2');
  const out = newWorkspace();
  const p = record(src.profile, 'Profile', true);
  out.demo = boolean(src.demo, 'Demo');
  PROFILE_KEYS.forEach(function (key) {
    out.profile[key] = string(p[key], 'Profile.' + key, key === 'cvText' ? 40000 : (['about', 'experience', 'education', 'skills'].indexOf(key) !== -1 ? 16000 : 2000));
  });
  out.profile.targetRoles = list(p.targetRoles, 'Profile.targetRoles', 3).map(function (r) { return string(r, 'Target role', 200); });
  const wp = record(p.workPreferences, 'Profile.workPreferences', true);
  out.profile.workPreferences = { hours: string(wp.hours, 'Work preferences.hours', 80), hybrid: oneOf(wp.hybrid, 'Work preferences.hybrid', ['', 'onsite', 'hybrid', 'remote', 'any'], ''), region: string(wp.region, 'Work preferences.region', 200) };
  out.profile.languageRows = rows(p.languageRows, 'Profile.languageRows', 12, function (r, id) {
    return { id, language: string(r.language, 'Language', 80), level: oneOf(r.level, 'Language level', ['', ...CEFR_LEVELS], ''), basis: oneOf(r.basis, 'Language basis', ['', 'self', 'certified'], ''), certificate: string(r.certificate, 'Language certificate', 200) };
  });
  out.profile.educationRows = rows(p.educationRows, 'Profile.educationRows', 10, function (r, id) {
    return { id, title: string(r.title, 'Education title', 300), institution: string(r.institution, 'Education institution', 300), country: string(r.country, 'Education country', 100), year: string(r.year, 'Education year', 20), idw: oneOf(r.idw, 'IDW evaluation', ['', 'yes', 'no', 'applied'], '') };
  });

  const seenJobs = new Set();
  out.jobs = list(src.jobs, 'Jobs', MAX_JOBS).map(function (value, index) {
    const j = record(value, 'Job ' + (index + 1));
    const id = identifier(j.id, 'Job.id');
    if (seenJobs.has(id)) fail('Jobs', 'duplicate job identifier');
    seenJobs.add(id);
    const seenRequirements = new Set();
    const requirements = list(j.requirements, 'Job.requirements', MAX_REQUIREMENTS).map(function (value) {
      const r = record(value, 'Requirement'), rid = identifier(r.id, 'Requirement.id');
      if (seenRequirements.has(rid)) fail('Job.requirements', 'duplicate requirement identifier');
      seenRequirements.add(rid);
      const status = string(r.status, 'Requirement.status', 20, 'unknown');
      if (STATUSES.indexOf(/** @type {any} */ (status)) === -1) fail('Requirement.status', 'unknown status');
      /** @type {Requirement} */
      const req = { id: rid, text: string(r.text, 'Requirement.text', 2000), status: /** @type {any} */ (status), evidence: string(r.evidence, 'Requirement.evidence', 6000), nextStep: string(r.nextStep, 'Requirement.nextStep', 3000) };
      if (r.kind !== undefined) req.kind = /** @type {''|'must'|'nice'} */ (oneOf(r.kind, 'Requirement.kind', ['', 'must', 'nice'], ''));
      return req;
    });
    /** @type {Job} */
    const job = { id, title: string(j.title, 'Job.title', 500), company: string(j.company, 'Job.company', 500), url: string(j.url, 'Job.url', 3000), body: string(j.body, 'Job.body', 40000), reason: string(j.reason, 'Job.reason', 8000), requirements };
    if (j.facts !== undefined) {
      const f = record(j.facts, 'Job.facts');
      job.facts = { hours: string(f.hours, 'Job.facts.hours', 200), location: string(f.location, 'Job.facts.location', 200), dutch: oneOf(f.dutch, 'Job.facts.dutch', DUTCH_DEMAND, ''), dutchLevel: oneOf(f.dutchLevel, 'Job.facts.dutchLevel', ['', ...CEFR_LEVELS], '') };
    }
    return job;
  });
  out.selectedJobId = string(src.selectedJobId, 'Selected job', 64);
  if (!seenJobs.has(out.selectedJobId)) out.selectedJobId = '';

  const cv = record(src.cv, 'CV', true);
  CV_KEYS.forEach(function (key) { out.cv[key] = string(cv[key], 'CV.' + key, key === 'headline' ? 2000 : 20000); });
  out.cv.reviewed = boolean(cv.reviewed, 'CV.reviewed');
  const li = record(cv.linkedin, 'CV.linkedin', true);
  out.cv.linkedin = { headline: string(li.headline, 'LinkedIn.headline', 300), about: string(li.about, 'LinkedIn.about', 3000), bullets: string(li.bullets, 'LinkedIn.bullets', 3000) };

  const interview = record(src.interview, 'Interview', true);
  out.interview.questionIndex = integer(interview.questionIndex, 'Interview.questionIndex', 0, 99, 0);
  out.interview.answers = dictionary(interview.answers, 'Interview.answers');
  out.interview.notes = dictionary(interview.notes, 'Interview.notes');
  out.interview.packId = string(interview.packId, 'Interview.packId', 64, 'default') || 'default';
  const mock = record(interview.mock, 'Interview.mock', true);
  out.interview.mock = {
    messages: list(mock.messages, 'Interview.mock.messages', 40).map(function (m) {
      const r = record(m, 'Mock message');
      return { role: oneOf(r.role, 'Mock message.role', ['interviewer', 'me'], 'me'), text: string(r.text, 'Mock message.text', 8000) };
    }),
    feedback: string(mock.feedback, 'Interview.mock.feedback', 20000),
  };

  const plan = record(src.plan, 'Plan', true);
  out.plan.roleId = string(plan.roleId, 'Plan.roleId', 80, 'custom');
  PLAN_TEXT_KEYS.forEach(function (key) { out.plan[key] = string(plan[key], 'Plan.' + key, key === 'nextDate' ? 80 : 8000); });
  const priorities = list(plan.priorities, 'Plan.priorities', 3);
  out.plan.priorities = [0, 1, 2].map(function (i) { return string(priorities[i], 'Plan priority', 4000); });
  out.plan.hours = integer(plan.hours, 'Plan.hours', 1, 40, 6);
  const md = record(plan.milestoneDates, 'Plan.milestoneDates', true);
  out.plan.milestoneDates = { day30: string(md.day30, 'Milestone date', 20), day60: string(md.day60, 'Milestone date', 20), day90: string(md.day90, 'Milestone date', 20) };
  out.plan.checkins = rows(plan.checkins, 'Plan.checkins', 60, function (r, id) {
    return { id, date: string(r.date, 'Check-in date', 20), done: list(r.done, 'Check-in done', 10).map(function (d) { return string(d, 'Check-in done item', 40); }), blocker: string(r.blocker, 'Check-in blocker', 2000), nextAction: string(r.nextAction, 'Check-in next action', 2000) };
  });

  out.applications = rows(src.applications, 'Applications', MAX_APPLICATIONS, function (r, id) {
    return { id, jobId: string(r.jobId, 'Application.jobId', 64), title: string(r.title, 'Application.title', 500), company: string(r.company, 'Application.company', 500), url: string(r.url, 'Application.url', 3000), dateApplied: string(r.dateApplied, 'Application.dateApplied', 20), stage: oneOf(r.stage, 'Application.stage', STAGES, 'saved'), followUp: string(r.followUp, 'Application.followUp', 20), contact: string(r.contact, 'Application.contact', 200), notes: string(r.notes, 'Application.notes', 4000) };
  });

  const ai = record(src.ai, 'AI', true), drafts = record(ai.drafts, 'AI.drafts', true);
  out.ai.step = string(ai.step, 'AI.step', 30, 'profile');
  if (STEPS.indexOf(/** @type {any} */ (out.ai.step)) === -1) out.ai.step = 'profile';
  out.ai.language = string(ai.language, 'AI.language', 100, 'English');
  out.ai.extra = string(ai.extra, 'AI.extra', 6000);
  STEPS.forEach(function (key) { out.ai.drafts[key] = string(drafts[key], 'AI draft.' + key, 40000); });
  out.ai.customPrompts = rows(ai.customPrompts, 'AI.customPrompts', 20, function (r, id) {
    return { id, title: string(r.title, 'Custom prompt title', 200), task: string(r.task, 'Custom prompt task', 8000), dataFrom: oneOf(r.dataFrom, 'Custom prompt data', ['profile', 'job', 'cv'], 'profile') };
  });

  out.coachNotes = rows(src.coachNotes, 'Coach notes', 100, function (r, id) {
    return { id, section: oneOf(r.section, 'Coach note section', ['profile', 'jobs', 'cv', 'interview', 'plan', 'applications', 'general'], 'general'), note: string(r.note, 'Coach note', 4000), coach: string(r.coach, 'Coach name', 100), date: string(r.date, 'Coach note date', 30) };
  });

  const s = record(src.settings, 'Settings', true);
  out.settings = {
    remember: boolean(s.remember, 'Settings.remember'),
    // Any language code, so a fork can add a language without changing code (NFR-I18N-4).
    uiLanguage: /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(string(s.uiLanguage, 'Settings.uiLanguage', 12, 'en')) ? s.uiLanguage || 'en' : 'en',
    applicationLanguage: string(s.applicationLanguage, 'Settings.applicationLanguage', 60, 'English') || 'English',
    simpleLanguage: boolean(s.simpleLanguage, 'Settings.simpleLanguage'),
    onboarded: boolean(s.onboarded, 'Settings.onboarded'),
    aiMode: oneOf(s.aiMode, 'Settings.aiMode', ['none', 'copy', 'builtin'], 'copy'),
  };
  return out;
}
