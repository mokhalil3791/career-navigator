// @ts-check
/**
 * Generates realistic, FICTIONAL v0.1 backups using the real v0.1 code
 * (reference/v0.1), exactly as v0.1's "Download backup" button writes them.
 * No real person's data is used. Output: tests/fixtures/v0.1/*.json
 * Run: node scripts/dev/generate-v01-fixtures.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadV01 } from '../../tests/helpers/v01-oracle.js';
import { ROOT } from '../lib/content.mjs';

const { core, content } = loadV01();
const OUT = join(ROOT, 'tests', 'fixtures', 'v0.1');
mkdirSync(OUT, { recursive: true });

/** v0.1 export-backup: JSON.stringify({...state, settings:{remember:false}}, null, 2) */
function v01Export(state) {
  return JSON.stringify({ ...state, settings: { remember: false } }, null, 2);
}
function req(id, text, status, evidence = '', nextStep = '') { return { id, text, status, evidence, nextStep }; }
function job(id, title, company, body, reason, requirements, url = '') { return { id, title, company, url, body, reason, requirements }; }

/** @type {Record<string, any>} */
const personas = {};

personas['amina-teaching-assistant'] = (() => {
  const s = core.newWorkspace();
  Object.assign(s.profile, {
    name: 'Amina — fictional',
    headline: 'Primary school teacher moving into education support',
    city: 'Utrecht', availability: '24–32 hours per week', travel: 'Up to 40 minutes by bike or bus',
    about: 'Teacher with eight years of classroom experience with children aged 6–11. I plan lessons, support children who need extra help and talk with parents.',
    experience: '2014–2022 | Primary school teacher | Example Primary School (fictional), Aleppo\nPlanned weekly lessons for classes of up to 30 children. Prepared extra reading material for six children who needed more support.\n\n2023–present | Volunteer homework helper | Example Library (fictional), Utrecht\nHelp four children with homework every Wednesday afternoon.',
    education: 'Bachelor of Education (original title kept), Example University (fictional), 2013. Diploma evaluation not yet requested.',
    skills: 'Lesson planning: prepared weekly plans for eight years.\nClassroom management: groups of up to 30 children.\nParent communication: monthly parent meetings.',
    languages: 'Arabic: native. English: B2 (self-assessed). Dutch: A2 (self-assessed, in an inburgering course).',
    cvText: 'AMINA (fictional)\nTeacher\n2014–2022 Primary school teacher\nSkills: planning, patience, communication',
  });
  s.jobs = [
    job('job-ta-utrecht', 'Onderwijsassistent (teaching assistant) — fictional', 'Example Basisschool (fictional)', 'FICTIONAL ADVERT\nTeaching assistant, 24 hours.\nSupport small groups with reading and maths. Required: experience with children, Dutch B1, a VOG.\nNice to have: an MBO-4 diploma in education.', 'Strong match with my classroom experience. Dutch B1 is required; I am at A2 now.', [
      req('r1', 'Experience with children', 'supported', 'Eight years as a primary school teacher; weekly volunteer homework help.', 'Prepare one STAR example about the reading group.'),
      req('r2', 'Dutch B1', 'missing', 'My Dutch is A2 (self-assessed).', 'Ask if B1 is needed at the start; plan the B1 exam.'),
      req('r3', 'Certificate of conduct (VOG)', 'unknown', '', 'Ask the school how they arrange the VOG.'),
      req('r4', 'MBO-4 diploma in education (nice to have)', 'partial', 'Bachelor of Education from abroad; no Dutch evaluation yet.', 'Look up a diploma evaluation.'),
    ], 'https://example.org/vacatures/onderwijsassistent'),
    job('job-library', 'Library youth programme assistant — fictional', 'Example Library (fictional)', 'FICTIONAL ADVERT\n16 hours. Help run reading activities for children. English and Dutch.', '', []),
  ];
  s.selectedJobId = 'job-ta-utrecht';
  s.cv = core.draftCvFromProfile(s);
  s.interview.answers = { q1: 'I taught primary school for eight years. I like helping children who find reading hard.', q2: 'Six children were behind in reading. I made a small group and extra material. After three months, five of them could read the class book.' };
  s.interview.notes = { q2: 'Say "I" more clearly. Explain how I measured progress.' };
  s.interview.questionIndex = 2;
  s.plan = core.planFromRole(null);
  Object.assign(s.plan, { targetRole: 'Teaching assistant', priorities: ['Dutch to B1', 'Learn how Dutch primary schools work', 'Diploma evaluation'], nextAction: 'Book a Dutch B1 practice test.', nextDate: '2026-11-15', hours: 8 });
  return s;
})();

personas['yonas-logistics-planner'] = (() => {
  const s = core.newWorkspace();
  Object.assign(s.profile, {
    name: 'Yonas — fictional', headline: 'Warehouse coordinator, aiming for logistics planner', city: 'Tilburg', availability: 'Full time', travel: 'Up to one hour; I have a driving licence',
    about: 'Coordinated stock and deliveries in a busy warehouse. Good with spreadsheets and with planning shifts.',
    experience: '2016–2021 | Warehouse coordinator | Example Trading (fictional), Asmara\nPlanned daily deliveries for 12 drivers. Kept stock lists in Excel.\n\n2024–present | Order picker (temporary contract) | Example Distribution (fictional), Tilburg\nPick and pack orders; trained two new colleagues.',
    education: 'Diploma in Business Management (original title), Example College (fictional), 2015.',
    skills: 'Excel: stock lists, filters, simple formulas.\nPlanning: daily delivery routes for 12 drivers.\nTraining colleagues.',
    languages: 'Tigrinya: native. English: B1. Dutch: A2.',
  });
  s.jobs = [job('job-planner', 'Junior logistics planner — fictional', 'Example Logistics (fictional)', 'FICTIONAL ADVERT\nPlan transport and warehouse capacity. Required: MBO-4 logistics or experience, Excel, Dutch B1, English.', 'Good direction; Dutch is the main gap.', [
    req('p1', 'Planning experience', 'supported', 'Planned daily deliveries for 12 drivers (2016–2021).'),
    req('p2', 'Excel', 'partial', 'Stock lists and filters; no pivot tables yet.', 'Practise pivot tables.'),
    req('p3', 'Dutch B1', 'missing', 'Dutch A2.'),
    req('p4', 'English', 'supported', ''),
  ])];
  s.selectedJobId = 'job-planner';
  s.plan.roleId = 'custom';
  s.plan.targetRole = 'Logistics planner';
  s.ai.step = 'fit';
  s.ai.language = 'Tigrinya';
  s.ai.drafts.fit = 'UNVERIFIED AI DRAFT (pasted back by the user)\nThe advert asks for planning, Excel and Dutch B1...';
  return s;
})();

personas['olena-financial-admin'] = (() => {
  const s = core.newWorkspace();
  Object.assign(s.profile, {
    name: 'Olena — fictional', headline: 'Accountant looking for a financial administration role', city: 'Rotterdam', availability: '32 hours', travel: 'Hybrid preferred',
    about: 'Accountant with 10 years in a medium-sized company. Monthly closing, invoices and VAT returns under local rules.',
    experience: '2012–2022 | Accountant | Example Manufacturing (fictional), Kharkiv\nMonthly closing, accounts payable and receivable for about 400 invoices per month.',
    education: 'Master in Economics (original title), Example National University (fictional), 2011.',
    skills: '1C accounting software; Excel (pivot tables, VLOOKUP); bookkeeping.',
    languages: 'Ukrainian: native. Russian: fluent. English: C1 (certificate). Dutch: B1 (Staatsexamen NT2 programme I, fictional).',
  });
  s.jobs = [job('job-fin', 'Financieel administratief medewerker — fictional', 'Example Accountants (fictional)', 'FICTIONAL ADVERT\nProcess invoices in Exact Online. Dutch B2. HBO level.', '', [
    req('f1', 'Invoice processing', 'supported', 'About 400 invoices per month for 10 years.'),
    req('f2', 'Exact Online', 'missing', 'I used 1C, not Exact.', 'Do the free Exact Online learning modules.'),
    req('f3', 'Dutch B2', 'partial', 'Dutch B1 (fictional exam result).', 'Ask whether B1 is enough to start.'),
  ])];
  s.selectedJobId = 'job-fin';
  s.cv = core.draftCvFromProfile(s);
  s.cv.letter = 'Dear hiring team,\n\nI am applying for the financial administration role...';
  s.plan.hours = 10;
  return s;
})();

personas['karim-backend-developer'] = (() => {
  const s = core.newWorkspace();
  Object.assign(s.profile, {
    name: 'Karim — fictional', headline: 'Software developer (PHP) moving to Python backend work', city: 'Eindhoven',
    about: 'Five years building web shops in PHP. Learning Python and SQL.',
    experience: '2017–2022 | Web developer | Example Web Agency (fictional), Damascus\nBuilt and maintained six web shops in PHP and MySQL.',
    skills: 'PHP, MySQL, Git, HTML/CSS. Python: personal project (fictional).',
    languages: 'Arabic: native. English: B2. Dutch: A1.',
  });
  s.plan = core.planFromRole(content.roles.find((r) => r.id === 'ai_engineer'));
  s.ai.step = 'interview';
  s.ai.extra = 'Please use simple English.';
  s.interview.answers = { q4: 'I learned Python with free online courses and built a small API.' };
  return s;
})();

personas['empty'] = core.newWorkspace();

personas['demo-edited-reviewed'] = (() => {
  const s = core.normalizeWorkspace(JSON.parse(JSON.stringify(content.demo)));
  s.profile.about += ' I also helped plan the annual stock count.';
  s.cv = core.draftCvFromProfile(s);
  s.cv.reviewed = true; // v0.1 writes the review tick into backups; import must reset it (guardrail G6)
  return s;
})();

personas['unicode-rtl'] = (() => {
  const s = core.newWorkspace();
  Object.assign(s.profile, { name: 'نور — fictional', headline: 'Data analyst / تحليل البيانات', about: 'Ik werk graag met data. أحب العمل مع البيانات. Я люблю дані. 🙂', languages: 'العربية: native; فارسی: B2; Nederlands: A2' });
  s.jobs = [job('job-u', 'Analist — fictional ✓', 'Ëxample BV (fictional)', 'Ádvert with “quotes” & <tags> and emoji 🚀', '', [req('u1', 'SQL & “joins”', 'unknown')])];
  return s;
})();

personas['maximal-counts'] = (() => {
  const s = core.newWorkspace();
  s.profile.name = 'Max — fictional';
  for (let j = 0; j < 8; j++) {
    const requirements = [];
    for (let r = 0; r < 20; r++) requirements.push(req(`m${j}-${r}`, 'Requirement ' + (r + 1) + ' '.repeat(0) + 'x'.repeat(60), core.newWorkspace && ['supported', 'partial', 'missing', 'unknown'][r % 4], r % 3 ? 'Evidence ' + 'y'.repeat(200) : '', 'Next ' + 'z'.repeat(80)));
    s.jobs.push(job(`job-m${j}`, 'Fictional advert ' + (j + 1), 'Example ' + (j + 1) + ' (fictional)', 'Body '.repeat(2000), 'Reason', requirements));
  }
  s.selectedJobId = 'job-m7';
  for (let q = 1; q <= 8; q++) { s.interview.answers['q' + q] = 'Answer ' + q; s.interview.notes['q' + q] = 'Note ' + q; }
  s.interview.questionIndex = 7;
  s.plan.hours = 40;
  return s;
})();

for (const [name, state] of Object.entries(personas)) {
  const normalised = core.normalizeWorkspace(state);
  const text = v01Export(normalised);
  core.parseWorkspace(text); // the real v0.1 must accept every fixture
  writeFileSync(join(OUT, name + '.json'), text + '\n');
}

// What v0.1 "Save on this device" stores in localStorage (remember: true), for the legacy pickup test.
const stored = core.normalizeWorkspace(personas['yonas-logistics-planner']);
stored.settings.remember = true;
writeFileSync(join(OUT, 'localstorage-remember-true.json'), JSON.stringify(stored) + '\n');
console.log('Wrote', Object.keys(personas).length + 1, 'fixtures to tests/fixtures/v0.1/');
