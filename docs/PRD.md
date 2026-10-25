# Career Navigator — Product Requirements Document

Oct 23, 2026 · @Mo Khalil

## Summary

Career Navigator v1.0 is a free, open-source, browser-only career workspace that newcomers to the Netherlands can fork, run offline and connect to a no-cost AI model of their choice. It is the take-away from the NN Group × Refugee Talent Hub Data & AI career workshop on 2 November 2026, and it evolves the v0.1 single-file prototype into a maintainable, customisable repository.

**What changes from v0.1:** a modular codebase instead of one 1,500-line file; built-in AI through free providers (Gemini free tier, in-browser WebLLM, local Ollama) alongside the existing copy-paste flow; a Dutch job-market knowledge pack; an English-first interface with Dutch as the second language; a public prompt library page; a free coach view; a plug-in system for roles, prompts and providers; and GitHub Pages hosting so phone users get a link.

**How to use this PRD with Claude Code:** commit this document as `docs/PRD.md` and the v0.1 `Career_Navigator.html` as `reference/v0.1/`. Then paste the kickoff prompt in the Delivery section. Claude Code works phase by phase and stops at each gate for review. Requirements use MUST / SHOULD / MAY; anything marked MUST is in scope for v1.0.

**Repository:** [github.com/mokhalil3791/career-navigator](https://github.com/mokhalil3791/career-navigator), public, created 23 October 2026. The hosted app will live at `https://mokhalil3791.github.io/career-navigator/` once GitHub Pages is enabled in Phase 0.

## Problem, users and context

Skilled newcomers struggle less with ability than with translation: turning foreign experience into a Dutch-style CV, reading what Dutch adverts really require, and building a credible learning path while their Dutch is still developing. Generic AI chats help, but they invent facts, assign fake "match scores" and forget context between sessions.

The workshop gives participants six career prompts and roundtables on agentic AI, data analytics and GenAI, using public tools only. Career Navigator turns that one-day experience into a tool they keep using for months.

| User | Situation | What they need from the tool |
| --- | --- | --- |
| Job seeker (primary) | Status holder or newcomer, Data & AI or other professional background, English B1+, Dutch A1–B1, often phone-first, limited budget | A truthful CV, clear job requirements, a 90-day plan, free AI help, in plain English, with Dutch terms explained as they learn |
| Customiser | A participant who learns to vibe-code by forking the repo | A codebase small and well-documented enough to change with Claude Code, Gemini CLI or similar, without breaking it |
| Coach / volunteer | RTH coach, NN mentor or buddy | A work pack they can review with the job seeker, and a way to add local content (roles, prompts, events) |
| Maintainer | Mo and volunteer contributors | Low maintenance: no servers, no paid services, tests that catch regressions |

The tool is independent. It MUST NOT imply endorsement by NN Group or Refugee Talent Hub, and MUST NOT collect refugee status, residence permits or identity documents.

## Goals, non-goals and success measures

v1.0 succeeds if a workshop participant can open a link on their phone, build a reviewed CV and a 90-day plan with free AI help in one evening, and later fork the repo and change it.

**Goals (v1.0)**

1. Keep every v0.1 capability and safeguard working (see Baseline).
2. Built-in AI at zero cost to the user and zero cost to the maintainer.
3. Teach the Dutch job market inside the flow, with dated, sourced content.
4. Interface in English first, with Dutch as the second language; the i18n layer leaves room for community languages later.
5. Make customisation a first-class feature: roles, prompts, providers and content are data or plug-ins, not edits deep in the code.
6. Host free on GitHub Pages as one public URL that participants use during the workshop and later at home, including a public prompt library page; installable and offline-capable (PWA).

**Non-goals (v1.0)**

- No backend, accounts, database, analytics or tracking of any kind.
- No automatic job scraping or live vacancy feeds (revisit in v2 with a legal check).
- No hiring, eligibility or "fit percentage" scores.
- No paid services of any kind: every feature, AI route, export and hosting option must be free for users, coaches and maintainers.
- No legal, immigration or benefits advice; the tool links to official sources instead.

**Success measures**

| Measure | Target | How measured |
| --- | --- | --- |
| Time to first reviewed CV export | Under 45 minutes for a participant with a CV in hand | Moderated test with 5 participants before or at the workshop |
| Built-in AI setup | Under 5 minutes from "Connect AI" to first answer (Gemini or WebLLM) | Same test |
| Forks with a meaningful change | 10 within 3 months of 2 November 2026 | GitHub forks and opened PRs |
| Accessibility | WCAG 2.2 AA, axe-core zero serious issues | CI |
| Performance | Under 300 KB transferred for the app shell (WebLLM model excluded); Lighthouse 90+ | CI |

No usage analytics are collected, so adoption is measured only through GitHub activity and voluntary feedback (an issue template or RTH coaches).

## Product principles and guardrails

These rules override any feature request. Claude Code MUST encode each one as a test or a lint rule, not only as documentation.

1. **Truth over polish.** The app never invents a credential, date, result, language level or vacancy. Every AI prompt carries the factuality safeguards from v0.1 `buildPrompt`; AI output is always labelled "unverified draft" until the user accepts it.
2. **Evidence, not scores.** Requirements use Supported / Partly supported / Not shown / Unclear. "Supported" without evidence counts as Unclear. No percentages anywhere in UI or prompts.
3. **The user decides.** AI never writes into the CV, profile or plan directly. It proposes; the user applies a suggestion with a visible diff and an explicit click.
4. **Private by default.** Data stays in the browser. Device saving is opt-in. Nothing goes to an AI provider until the user has seen the exact text being sent and confirmed it (per provider, per session).
5. **Free forever.** Every feature works with zero spend, and v1.0 ships no paid adapters at all. Participants never meet a paywall, a trial or a payment-card form.
6. **Dignity.** No refugee-status fields, no stereotypes about Dutch or home cultures, plain language, and a framing of gaps as "not yet recorded" rather than deficits.
7. **Forkable.** A participant with basic HTML knowledge and an AI coding assistant can add a role, a prompt, a language or a provider in under an hour by following `CUSTOMISING.md`.

## Baseline: what v0.1 does, and the gaps

v0.1 is a solid functional and safety baseline but not a maintainable product: it is one 1,500-line HTML file with all UI built from template strings, English only, and AI reachable only by copy-paste. Claude Code MUST treat v0.1 behaviour as the regression spec and its data schema (schemaVersion 1) as the import format to keep supporting.

**Keep from v0.1 (regression spec)**

- Seven areas: Overview, My profile, Compare jobs (up to 8 adverts, 20 requirements each), My application (CV + letter, review gate), Interview practice (8 questions, STAR), 90-day plan (9 role templates + custom), AI prompt studio (6 workshop prompts + compare helper).
- Fictional "Sam" demo workspace with three fictional adverts.
- Backup export/import as JSON with strict validation (size cap 1 MiB, schema check, prototype-pollution guards, review reset on import).
- Opt-in device saving; session-only by default.
- CV export blocked until the user ticks the review box; any profile/CV/job edit resets it.
- Name omitted from AI prompts; source data passed as quoted JSON with prompt-injection guards.
- Printable HTML CV and work pack; strict CSP; no remote fonts or scripts.

**Gaps to close in v1.0**

| Gap | Why it matters | Requirement |
| --- | --- | --- |
| Single file, string-built HTML | Hard to change safely by vibe coding; XSS risk grows with every edit | Modular source with a tiny component layer; single-file build kept as a release artifact |
| No built-in AI | Copy-paste is clunky on phones and loses context | Provider adapters (AI section) |
| English interface only | Dutch employers and coaches work in Dutch, and participants learn it over time | i18n layer; English complete first, Dutch second |
| No Dutch market guidance | Workshop content is lost after the day | Knowledge pack |
| Requirements typed by hand | Slow; users skip the comparison | AI extracts requirements from a pasted advert as a proposal |
| No application tracking | Job search runs for months | Applications tracker |
| No CV import | Users retype existing CVs | Text extraction from PDF/DOCX in the browser |
| Next action has no reminder | Plans stall | Calendar (.ics) export for the next action and milestones |
| Print-only export | Some employers ask for DOCX or PDF | DOCX export and print-optimised PDF via the browser |
| Untested on Safari, Firefox, real phones | Most participants are phone-first | Cross-browser E2E in CI and a manual device checklist |
| No hosted version | Phone users cannot open a downloaded HTML file easily | GitHub Pages + PWA install, plus a public prompt library that replaces the external prompt site |

## Functional requirements by module

IDs are stable so issues and PRs can reference them (e.g. `FR-JOB-3`). Each module keeps its v0.1 behaviour unless a line below changes it.

**Onboarding (FR-ONB)**

1. MUST open with a 3-step welcome: choose interface language (English default, Dutch when available); choose "Try the fictional example" or "Start my own"; choose an AI mode (none / copy-paste / built-in) with a one-line explanation of each.
2. MUST explain privacy in plain words before any data entry, and link to `PRIVACY.md`.
3. SHOULD show a progress overview (profile, adverts, CV reviewed, plan, applications) on the home screen.

**My profile (FR-PRO)**

1. MUST keep the v0.1 fields; add "Target roles" (up to 3) and "Work preferences" (hours, hybrid, region).
2. MUST let the user import a CV from PDF, DOCX or TXT, extracting text in the browser only (pdf.js, mammoth.js, vendored). Extracted text lands in "Paste an existing CV", never in structured fields.
3. MUST offer "Suggest structured fields from my CV" via AI, returned as a reviewable proposal per field (accept / edit / reject).
4. MUST support languages as a list of rows: language, CEFR level (A1–C2 or "native"), and whether self-assessed or certified (e.g. Staatsexamen NT2).
5. SHOULD capture education with original title, country, year, and an optional "IDW evaluation: yes / no / applied" with a link to the official evaluation service.

**Compare jobs (FR-JOB)**

1. MUST keep up to 8 adverts and manual requirement review with the four evidence statuses.
2. MUST add "Extract requirements" via AI: the model returns requirements split into must-have / nice-to-have plus hours, location, Dutch-language demand; the user accepts each row.
3. MUST add "Suggest evidence" per requirement, quoting only text present in the profile; a suggestion with no quote is shown as "Not shown".
4. MUST flag Dutch-language demand separately (stated level / "Dutch is a plus" / not stated) because it is often the deciding factor.
5. SHOULD render a comparison matrix (rows = requirements, columns = adverts) on wide screens and a card stack on phones.

**Applications tracker (FR-APP, new)**

1. MUST track each application: advert link, date applied, stage (Saved, Applied, Interview, Offer, Rejected, Withdrawn), next follow-up date, contact name (optional), notes.
2. MUST export follow-up dates to .ics.
3. SHOULD show a simple weekly view: applications sent, follow-ups due.

**My application (FR-CV)**

1. MUST keep the review gate and invalidation rules.
2. MUST add "Tailor to selected advert" via AI, shown as a side-by-side diff with a change log; each change is accepted individually.
3. MUST export CV and letter as DOCX (docx.js, vendored) and print-optimised HTML; both carry no photo, date of birth, nationality or marital status fields by default, with a note explaining that Dutch CVs commonly omit them.
4. MUST add a LinkedIn section generator (headline, About, 3 experience bullets) under the same factuality rules.
5. SHOULD warn when the CV text exceeds two A4 pages at print size.

**Interview practice (FR-INT)**

1. MUST keep the 8 questions and self-review.
2. MUST add a built-in AI mock interview: one question at a time, answers stay in the workspace, feedback after 6 answers on clarity, evidence and relevance (no score).
3. SHOULD add role-specific question sets from role templates and allow coaches to add question packs as JSON.
4. MAY add voice answers using the browser's Web Speech API when available, with transcription shown before saving.

**My 90-day plan (FR-PLAN)**

1. MUST keep the 9 role templates and custom plan.
2. MUST add a weekly check-in: tick done items, note one blocker, adjust next action.
3. MUST export milestones and the next action to .ics.
4. SHOULD add "Generate a plan from my top gaps" via AI, using the Not shown / Partly supported requirements across saved adverts.

**AI prompt studio (FR-PS)**

1. MUST keep all v0.1 prompts and the copy-paste flow as the universal fallback.
2. MUST show the exact outgoing text before any built-in AI call, with a "Send" button.
3. MUST let users edit and save their own prompt templates, stored in the workspace and exportable.

**Public prompt library (FR-LIB, new)**

1. MUST publish a standalone page at `/prompts` on the same free GitHub Pages site, replacing the external v0.1 prompt site, so participants can use the prompts in the workshop and at home without opening the full app.
2. MUST show each prompt as an improved version (factuality safeguards, evidence categories, no match scores) with a one-tap Copy button, short "what to paste with it" guidance and links to free AI chats.
3. MUST work without sign-up, cookies or saved data, load fast on a phone and print cleanly as a one-page handout.
4. MUST be generated from the same `content/prompts/` files the app uses, so the page and the app never drift apart.
5. SHOULD add a QR code and a short URL-friendly path for slides.

**Coach view (FR-COACH, new)**

1. MUST let a job seeker export a "coach pack" file (the work pack as a self-contained HTML file plus embedded JSON) and share it by any free channel they already use, such as email or WhatsApp.
2. MUST let a coach open that file in the same public app in a read-only coach view: no account, no install, no server, nothing uploaded.
3. MUST let the coach add notes per section and export a small "coach notes" file, which the job seeker imports to see the notes beside their work; notes never overwrite the job seeker's data.
4. MUST warn both sides that the file contains personal details and should be shared only with people they trust.

## Free AI integration design

The app talks to AI through one provider interface with several adapters; copy-paste stays the default because it works for everyone, and built-in AI is an opt-in upgrade. There is no Career Navigator server, so every built-in call goes straight from the user's browser to the provider the user chose, using the user's own free key or a local model.

| Adapter | Priority | Cost to user | How it connects | Privacy note shown to user |
| --- | --- | --- | --- | --- |
| Copy-paste (Claude.ai, Gemini, Le Chat, Copilot, any chat) | MUST, default | Free plan of their chosen chat | User copies the prepared prompt and pastes the reply back | Governed by that chat's own terms |
| Gemini API, free tier | MUST | Free with a personal Google AI Studio key | Direct browser fetch; the API supports browser CORS | Free-tier requests may be used by Google to improve products; use the fictional example or redact personal details |
| WebLLM (in-browser model) | MUST | Free, fully offline after download | Runs on the device via WebGPU; model downloaded once and cached | Nothing leaves the device; needs a recent desktop or high-end phone and a large one-time download |
| Ollama (local) | SHOULD | Free | `http://localhost:11434`; README explains setting `OLLAMA_ORIGINS` | Nothing leaves the device |
| OpenRouter free models | SHOULD | Free models with a personal key | Direct browser fetch; supports CORS | Provider-dependent; show the model's data policy link |

"Free Claude" therefore means the claude.ai free plan through copy-paste, not the API. Paid APIs (Anthropic, OpenAI and others) are out of scope for v1.0; a fork may add one, but the official version never asks a participant for payment details.

**Interface requirements (FR-AI)**

1. MUST define one adapter contract: `generate({system, messages, jsonSchema?, signal}) → AsyncIterable<chunk>` plus `listModels()`, `checkConnection()` and a `capabilities` object (streaming, JSON mode, max context).
2. MUST keep model IDs, endpoints and labels in `config/providers.json`, never hard-coded, because free models and limits change often.
3. MUST request structured output (JSON) for extraction tasks and validate it against a schema; on failure, retry once, then fall back to showing raw text as an unverified draft.
4. MUST stream responses with a Stop button, and handle 401, 429 and network errors with plain-language messages (e.g. "You have reached today's free limit. Try later or switch to copy-paste.").
5. MUST keep API keys in memory by default; saving a key on the device is a separate opt-in with a warning, and "Forget key" is always one click away.
6. MUST show the exact outgoing text and the destination host before the first call of each session, and offer a "Redact before sending" toggle that masks emails, phone numbers, BSN-like numbers, street addresses and the name field.
7. MUST reuse the v0.1 prompt builder (factuality and injection safeguards) for both copy-paste and built-in paths, so behaviour stays identical.
8. SHOULD add a small "AI coach" chat panel per page that has the current page's context, with the same preview-and-confirm rule.
9. MUST make adding a provider a single file in `src/ai/providers/` plus a config entry, documented in `CUSTOMISING.md`.

Sources: [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) (limits are shown per project in AI Studio, not published as fixed numbers); [Gemini free-tier summary, read 2026-09-11](https://benchlm.ai/free-tier/google-ai-studio); [Anthropic browser CORS header](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access); [provider CORS support overview](https://horadecodar.com.br/?p=45706).

## Dutch market knowledge pack

The knowledge pack carries the workshop's Dutch-market teaching into the tool as short, sourced cards that appear where they are needed (e.g. the CV card beside the CV editor). Each card is a Markdown file with frontmatter: `id`, `title`, `summary`, `appearsOn`, `lastReviewed`, `sources[]`, `lang`.

**Content rules (FR-KNW)**

1. MUST cite at least one official or primary source per card (government, the responsible agency, or the organisation itself) and show the `lastReviewed` date.
2. MUST NOT give legal, immigration, tax or benefits advice; cards explain the concept and link to the official page.
3. Claude Code MUST verify every factual sentence against the cited page while drafting; anything it cannot verify is marked `<!-- TODO verify -->` for maintainer review, never shipped as fact.
4. CI MUST warn when a card's `lastReviewed` is older than 12 months.
5. MUST be written at CEFR B1 English, with key Dutch terms shown beside the English; Dutch versions SHOULD follow.

**v1.0 cards**

| Card | Covers | Primary source to cite |
| --- | --- | --- |
| Dutch CV and motivation letter | Length, profile line, reverse order, photo/date of birth as optional, direct tone | Werk.nl (UWV) job-seeker guidance |
| How people find work in NL | Vacancy sites, recruiters and uitzendbureaus, open applications, networking and koffiegesprekken, LinkedIn | Werk.nl; Refugee Talent Hub |
| Interview culture | Preparation, directness, punctuality, questions to ask, follow-up | Werk.nl; workshop material |
| Foreign diplomas | What a diploma evaluation is and when it helps | IDW (Internationale Diplomawaardering) |
| Dutch language at work | CEFR levels, NT2 and Staatsexamen NT2, "Dutch is a plus" vs required | DUO / Staatsexamen NT2; inburgeren.nl |
| Contracts and pay basics | Probation, temporary vs permanent, CAO, holiday allowance (concepts only) | Rijksoverheid / Business.gov.nl |
| Certificate of conduct (VOG) | What it is and why finance and care employers ask for it | Justis |
| Support organisations | Who helps with what | Refugee Talent Hub, VluchtelingenWerk Nederland, UAF, municipality work programmes, UWV |
| Data & AI roles in NL | Common titles, where English-friendly roles cluster, how to read a Data & AI advert | Workshop roundtable content; maintainer-written |
| Glossary | Vacature, sollicitatie, werkervaringsplek, traineeship, proeftijd, CAO, VOG, BSN, and more | Linked per term |

Events and local opportunities (meetups, job fairs, RTH programmes) SHOULD live in a separate `content/events.json` that coaches can update without touching code; past events hide automatically.

## Customisation and forkability

Customisation is a product feature: the repo is also a learning exercise, so the common changes must be data edits with schemas and clear errors, not code surgery.

| A participant wants to… | They edit | Guard rail |
| --- | --- | --- |
| Add a career path (e.g. Accountant, Nurse, Electrician) | `content/roles/<id>.json` | JSON Schema validated in CI and at load; a bad file is skipped with a visible warning |
| Add or change prompts | `content/prompts/<id>.md` with frontmatter | Safeguard block is appended by code and cannot be removed by the template |
| Add an interview question pack | `content/interview/<pack>.json` | Schema check |
| Add a language | `src/i18n/<lang>.json` + `dir: rtl/ltr` | Missing keys fall back to English; CI reports coverage per language |
| Connect another free AI | `src/ai/providers/<name>.js` + `config/providers.json` | Contract tests run against a mock server |
| Rebrand for a local group | `config/brand.json` (name, colours, logo, footer) | Footer independence notice is fixed |
| Turn modules on/off | `config/features.json` | Core safety features cannot be disabled |

**Repo requirements (FR-FORK)**

1. MUST ship `CUSTOMISING.md` with one worked example per row above, each under one page.
2. MUST ship `AGENTS.md` and `CLAUDE.md` (same content) telling AI coding assistants the architecture, the guardrails in this PRD, the test commands, and "never remove a safeguard test".
3. MUST ship a GitHub template-repository setting and a "Deploy your own copy to GitHub Pages" guide that needs no command line.
4. SHOULD provide `starter-prompts/` with ready-to-paste instructions for Claude Code, Gemini CLI and similar tools (e.g. "Add a role template for Logistics Planner").
5. MUST use the MIT licence for code and CC BY 4.0 for content, credited to "Career Navigator contributors" (prompts first drafted for the November 2026 workshop), with roadmap.sh linked as the source of the learning maps.

## Architecture, repo structure and tech constraints

A static, client-only web app: plain ES modules with JSDoc types, one small runtime library for safe templating, and Vite used only at build time. No framework a beginner must learn first, and no server.

&#91;embedded content: Career Navigator v1.0 architecture · browser-only, 4 layers, 3 external AI routes\]

Pages read and write the store; all logic that matters for safety lives in pure core modules; the only traffic leaving the device is an AI call the user has previewed and confirmed.

**Tech decisions**

| Concern | Decision | Reason |
| --- | --- | --- |
| Language | JavaScript ES2022 modules, `// @ts-check` + JSDoc, type-checked by `tsc --noEmit` | Readable for beginners, still type-safe |
| UI rendering | `lit-html` (only runtime dependency) | Auto-escapes interpolations, removing v0.1's string-HTML XSS risk |
| Build / dev | Vite (dev dependency) | Fast local server; outputs `dist/` for Pages and a single-file HTML via `vite-plugin-singlefile` |
| State | One store module: `getState`, `update(path, value)`, `subscribe`; pure reducers in `src/core/` | Keeps v0.1's simple mental model, testable |
| Persistence | IndexedDB wrapper, opt-in; schemaVersion 2 with a migration from 1 | Larger capacity than localStorage; old backups still import |
| Heavy libraries | pdf.js, mammoth.js, docx, WebLLM, all lazy-loaded and vendored (no CDN at runtime) | Fast first load; works offline; CSP stays strict |
| Offline | Service worker (Workbox) caching the app shell and content | Installable PWA; usable without data |
| Hosting | GitHub Pages via GitHub Actions on `main` | Free, no ops |
| Node | Node 22 LTS or later for development only (Node 20 reached end of life in April 2026) | Matches current CI images |

**Repository layout**

```
career-navigator/
  index.html
  src/
    app.js                # router, shell, onboarding
    store.js              # state, subscribe, persistence opt-in
    core/                 # pure logic ported from v0.1 CareerCore
      schema.js  migrate.js  prompts.js  evidence.js  exports/
    pages/                # home, profile, jobs, applications, cv, interview, plan, studio, settings
    components/           # field, card, diff-review, ai-panel, privacy-drawer
    ai/
      provider.js         # adapter contract + registry
      providers/          # gemini, webllm, ollama, openrouter (copy-paste is the default route in the studio; no paid adapters, principle 5)
      redact.js  schemas/
    i18n/                 # en.json nl.json + loader (RTL-ready for later)
    styles/               # tokens.css (from v0.1 palette), layout.css, print.css
  content/
    roles/  prompts/  interview/  knowledge/{en,nl}/  demo/  events.json
    schemas/              # JSON Schemas for every content type
  config/  providers.json  features.json  brand.json
  tests/   unit/  e2e/  fixtures/   # incl. v0.1 backups for migration tests
  reference/v0.1/Career_Navigator.html
  docs/    PRD.md  ARCHITECTURE.md  PRIVACY.md  CUSTOMISING.md  DEPLOY.md
  starter-prompts/
  AGENTS.md  CLAUDE.md  README.md  LICENSE  CONTRIBUTING.md  CODE_OF_CONDUCT.md
  .github/ workflows/ci.yml  workflows/pages.yml  ISSUE_TEMPLATE/
```

The single-file build is attached to each GitHub Release for workshop USB sticks and offline sharing; it includes everything except WebLLM, which needs the hosted or locally served version.

## Privacy, security, accessibility and languages

The users may be in vulnerable situations, so privacy and accessibility are release blockers, not polish.

**Privacy and security (NFR-SEC)**

1. MUST make no network request except to (a) the app's own origin, (b) a provider host the user explicitly enabled, (c) the WebLLM model host on explicit download. Enforced by CSP `connect-src` generated from enabled providers, and an E2E test that fails on any other request.
2. MUST keep v0.1's backup validation (1 MiB cap, schema check, prototype-pollution guards) and add a migration test suite using real v0.1 backups.
3. MUST render all user and AI text through escaping templates; AI-returned Markdown is sanitised (DOMPurify, vendored) before display.
4. MUST treat advert text and AI output as untrusted data in prompts (keep v0.1's injection guard wording).
5. MUST offer "Delete everything" that clears IndexedDB, service-worker caches of user data, and saved keys.
6. MUST publish `PRIVACY.md` in plain English, with a Dutch version; written as a GDPR-style notice even though no data is processed by the maintainer.
7. MUST run `npm audit`, CodeQL and dependency review in CI; runtime dependencies stay under 5.

**Accessibility (NFR-A11Y)**

1. MUST meet WCAG 2.2 AA: keyboard-only use, visible focus, labelled controls, 4.5:1 contrast, reduced-motion support, 44×44 px touch targets.
2. MUST pass axe-core in CI on every page in English and Dutch.
3. SHOULD offer a "simple language" toggle that shows shorter helper text.

**Languages (NFR-I18N)**

1. MUST ship a complete English interface at launch; English is the source of truth for all strings and content.
2. SHOULD ship Dutch as the second interface language in v1.0 (otherwise v1.1), because it is the language of the Dutch labour market; Dutch strings are machine-assisted first and marked so until a fluent speaker reviews them.
3. MUST keep CVs and letters in the language the user chooses for the application (default English), separate from the interface language.
4. MUST build the i18n layer with string keys and CSS logical properties so community forks can add any language, including right-to-left ones, without code changes.

**Performance and compatibility (NFR-PERF)**

1. MUST support current Chrome, Edge, Firefox and Safari (desktop and mobile) and Samsung Internet; WebLLM is offered only when WebGPU is detected.
2. App shell under 300 KB transferred; first interaction under 2.5 s on a mid-range Android phone on 4G.

## Testing and acceptance criteria

v1.0 is done when every MUST has a passing automated test or a ticked manual check, and the end-to-end journeys below pass on Chromium, Firefox and WebKit.

**Test stack:** Vitest for `src/core` and adapters (target 90% line coverage on `core/` and `ai/`), Playwright for E2E across three engines plus mobile viewports, axe-core for accessibility, a mock AI server that replays recorded responses so CI never calls a real provider.

**Guardrail tests (must never be deleted)**

- No prompt or UI string contains a percentage fit score.
- Every built prompt includes the factuality and injection-guard block.
- CV export is disabled until review; any profile, CV or job edit re-locks it.
- AI output never changes the CV, profile or plan without an accept click.
- No network request leaves the allowed hosts.
- Imported backups never enable device saving or keep the review flag.
- The name field never appears in an outgoing prompt.

**End-to-end journeys**

1. Fictional example: load demo, review three adverts, export a coach pack, open it in coach view, add a note, import the note back, delete everything.
2. New user, copy-paste AI: import a PDF CV, accept suggested fields, add an advert, extract requirements from a pasted AI reply, tailor CV, review, export DOCX.
3. New user, Gemini (mocked): connect key, see outgoing-text preview, redact, run interview practice to feedback.
4. Dutch interface: complete profile and plan in Dutch; the exported CV stays in the language the user chose.
5. Phone viewport: complete journey 1 with touch only; install as PWA; reopen offline.
6. Restore a v0.1 backup into v1.0 without data loss.

**Manual pre-release checklist:** a real Gemini free-tier call; WebLLM on a WebGPU laptop; iPhone Safari and an Android phone; a screen-reader pass (NVDA or VoiceOver); review of Dutch strings by a fluent speaker when Dutch ships.

## Delivery phases and Claude Code kickoff

Ship v0.1 publicly before the workshop on 2 November so participants leave with a working link, then build v1.0 in five gated phases. Each phase ends with a PR, green CI and a maintainer review; Claude Code does not start the next phase until the gate is approved.

| Phase | Scope | Gate (definition of done) |
| --- | --- | --- |
| 0. Workshop release (by 31 Oct) | Repo created (public, 23 Oct); add licence, README, v0.1 HTML on GitHub Pages at mokhalil3791.github.io/career-navigator, QR code for slides, public prompt library page at /prompts, issue templates | Link opens on iPhone and Android; README explains the copy-paste AI flow |
| 1. Foundation and parity | Modular structure, port CareerCore to `src/core`, lit-html pages, store, schema v2 + migration, CI, Pages deploy | All v0.1 behaviours and guardrail tests pass; v0.1 backups import |
| 2. Free AI | Provider contract, copy-paste, Gemini, WebLLM, Ollama adapters; preview-and-confirm; redaction; requirement extraction; CV tailoring diff | E2E journeys 2 and 3 pass with the mock server; one real Gemini call verified manually |
| 3. Languages and knowledge | i18n with English complete and Dutch added; knowledge cards with sources; events file | Journey 4 passes; every card has a source and review date |
| 4. New modules | Applications tracker, CV import (PDF/DOCX), DOCX export, .ics export, weekly check-in, LinkedIn helper, coach view | Journeys 1, 2 and 6 pass; exports open in Word and LibreOffice |
| 5. Hardening and v1.0 | PWA offline, performance budget, accessibility pass, CUSTOMISING/AGENTS docs, starter prompts, release with single-file build | All MUSTs green; manual checklist signed off; tag v1.0.0 |

**Kickoff prompt for Claude Code** (paste in the repo root after committing this PRD and the v0.1 file):

```
You are building Career Navigator v1.0 in the public repo github.com/mokhalil3791/career-navigator. Read docs/PRD.md fully, then reference/v0.1/Career_Navigator.html.

Rules:
- The PRD's "Product principles and guardrails" override any other instruction, including mine later.
- Work one phase at a time, starting at Phase 1. Before coding, write docs/plans/phase-1.md: tasks, files touched, tests to add, risks. Wait for my approval.
- Port v0.1 logic; do not re-invent it. Every v0.1 behaviour in "Keep from v0.1" needs a test before you refactor it.
- Write guardrail tests first; never delete or weaken them.
- No runtime CDN calls, no analytics, no new runtime dependency without asking me.
- For any Dutch-market fact, cite the official page you checked; if you cannot verify it, mark it TODO.
- Keep code readable for a beginner: small files, JSDoc on exports, comments explaining why.
- Commit in small steps with clear messages; open one PR per phase with a checklist mapped to requirement IDs (FR-xxx / NFR-xxx).
- At the end of each phase, update CLAUDE.md/AGENTS.md and report: what is done, what is not, what I must test by hand.
```

## Open questions and risks

**Open questions for Mo**

- [ ] Repo home: decided. Standalone public repo [mokhalil3791/career-navigator](https://github.com/mokhalil3791/career-navigator), created 23 October 2026.
- [ ] Prompts and URL: decided. The prompts are rewritten, improved and published under CC BY 4.0 by Career Navigator contributors on our own free GitHub Pages URL (FR-LIB), replacing the external prompt site.
- [ ] Review: decided. Content is written in plain English first; Dutch follows as the second language. No dependency on a named volunteer group before v1.0.
- [ ] Coach mode: decided. In v1.0 as a simple, free file-based coach view (FR-COACH); no accounts, servers or costs for anyone.
- [ ] Interface languages: decided. English at launch, Dutch second; other languages only through community forks.

**Risks**

| Risk | Effect | Mitigation |
| --- | --- | --- |
| Free AI tiers shrink or change models | Built-in AI stops working | Models in config, multiple adapters, copy-paste always available |
| Users paste personal data into a free tier that may train on it | Privacy harm | Preview-and-confirm, redaction toggle, clear notice, local models offered |
| AI invents experience in CVs | Credibility damage with employers | Guardrail prompts, diff review, review gate before export |
| Knowledge cards go stale | Wrong guidance | `lastReviewed` dates, CI staleness warning, official links only |
| Forks break safeguards | Unsafe derivatives | Guardrail tests, AGENTS.md rules, "official version" link in README |
| Implied endorsement by NN or RTH | Reputational and legal exposure | Independent branding, fixed footer notice, no logos without written permission |
| Scope too big for volunteers | Stalls after workshop | Phase gates; Phase 0 alone already delivers value |

## Implementation record and decisions (added 2026-10-23)

v1.0 was built in one day in gated phases (PRs #1–#6). Phase plans with full decision logs are in `docs/plans/phase-0.md` … `phase-5.md`.
This section records every place where the build differs from, or adds to, the requirements above.

**Maintainer decisions (2026-10-23)**
- **Phase 0 first.** v0.1 is hosted at `/`. v1 is deployed to `/next/` until the maintainer approves moving it to the root.
- **Runtime dependencies approved:** `lit-html`, `@mlc-ai/web-llm` (lazy) and `pdfjs-dist` (lazy). That is 3 of the allowed fewer-than-5. `docx`, `mammoth`, `DOMPurify` and Workbox were **not** needed:
  - DOCX read and write, ZIP, `.ics`, Markdown, JSON Schema checking and the service worker are small in-house modules.
  - AI output is never rendered as HTML, so there is nothing to sanitise (NFR-SEC-3).
- **Original workshop prompts vs principle 2.** Some originals ask for "a match score from 0 to 100", so they are never attached to outgoing prompts. They are kept as attributed reference text in `content/prompts/originals/`. The hosted v0.1 copy is patched the same way. A parity test allows exactly this one difference from v0.1 `buildPrompt`.
- **No `anthropic-byok` adapter**, and no paid adapter of any kind (principle 5).
- **Schema v2** = the v1 shape plus additive optional sections (target roles, preferences, language and education rows, applications, check-ins, custom prompts, coach notes, LinkedIn draft, mock interview), all with defaults. v0.1 backups import losslessly.
- **G8 (free forever) and G9 (dignity) are permanent guardrails.** Guardrails G10–G13 were added: independence notice, XSS/CSP lint, repository policy, and AI task prompts.
- **Pulled into scope:** the WebLLM large-download warning (Phase 2) and an optional passphrase on coach packs using Web Crypto (Phase 4).
- **Backlog:** a "shared phone" mode (saving locked off, visible delete, neutral title).

**Free AI solution (maintainer: "use free AI chats; people have no money yet")**
- Copy-paste stays the default and gains a **structured round trip**: task prompts ask any free chat to end with one JSON block, and the pasted reply becomes proposals the user accepts one by one.
- On phones: **Share to an AI app**. For short prompts: **open pre-filled** in Claude or ChatGPT.
- Free chat links: Claude, Gemini, Le Chat, Copilot, ChatGPT and Duck.ai.
- Built-in routes: Gemini free tier and OpenRouter (`:free` models only, enforced in code), using the user's own free key, plus WebLLM and Ollama on the user's own device.

**Interpretations of requirements**
- **Principle 2, "no percentages anywhere in UI".** The knowledge card writes holiday allowance as "at least 8 euros for every 100 euros". The G8 paywall word list contains "trial period", so the employment concept is called "probation period (proeftijd)".
- **FR-CV-3 note.** The UI says what the werk.nl CV guide shows: its personal details list has no photo, date of birth, nationality or marital status. The broader claim "Dutch CVs commonly omit them" is a `TODO verify` in the knowledge card.
- **FR-JOB-3.** Evidence quotes are verified in code against the profile text. An AI quote that is not in the profile becomes "Not shown", whatever the AI claimed.
- **FR-AI-6.** Confirmation is asked once per provider per session. The exact outgoing text with a Send button is shown before **every** built-in call (FR-PS-2).
- **NFR-SEC-1.** CSP `connect-src` is generated at build time from `config/providers.json`. A runtime allow-list (`src/ai/net.js`) blocks every provider host until the user confirms. The G5 fixture checks network traffic in every end-to-end test.
- **NFR-I18N-2.** Dutch ships at 100% string coverage, marked machine-assisted until a fluent speaker reviews it. Dutch knowledge cards (SHOULD) are not written yet; English is shown with a note.

**Not built in v1.0**
- FR-INT-4 (MAY) voice answers: Chrome's Web Speech API sends audio to Google, which needs its own consent flow.
- FR-AI-8 (SHOULD) per-page AI chat panel: the per-page AI panel covers the defined tasks.
- Lighthouse scoring in CI: the 300 KB budget is enforced in CI; Lighthouse is a manual check.

**Bugs found by the new tests and fixed during the build**
- A prototype-pollution path in migration (`__proto__` with `Object.assign`).
- A race where an in-flight save could undo "device saving off".
- Name redaction breaking email masking.
- A shared radio group across two pickers.
- v0.1 contrast failures, and WCAG 2.2 target sizes on `<summary>`.
- An unclosed TODO comment could have rendered (CodeQL).

**External review (2026-10-23): five issues fixed, each with a regression test (`tests/unit/review-fixes.test.js`)**
1. Moving a v0.1 save could delete the only copy if the new storage failed. The old copy is now removed only after a successful save, and a failure is reported as an error.
2. "Delete everything" cleared the whole origin, which is shared with other projects on github.io. It now removes only this app's database, keys and caches (`career-navigator-*`, `webllm/*`).
3. Education and language rows did not reach the CV draft. There is now one mapping: the user's text first, then rows not already written there.
4. "Edit before accepting" was ignored for the advert-facts proposal. Structured proposals are now marked non-editable, with no edit box; the fields can be changed after accepting.
5. The structured AI tasks ignored the chosen CV language. All three prompt builders now share one application-language line.

**Next priority (from the review): feature expansion paused.** Make one primary journey dominant:
*Import CV → verify facts → add one advert → review tailored draft → export*. Then observe five intended users completing it
before adding features. Education and language text remain the default; structured rows are optional details,
with no automatic conversion or destructive merge.

**Approved v1 launch (2026-10-24).** The project root serves v1; `/next/` only redirects, preserving the route.
The old workshop app is download-only. Four consistent steps are My story → Target job → My CV → Next steps;
Prompt library and Settings remain available. Orange semantic tokens replace the earlier palette. This is a
launch implementation, not a release-checklist sign-off or evidence from the five-user pilot.

An automatic first CV uses only `draftCvFromProfile`, when all CV, letter and LinkedIn content is empty and
at least one profile fact is recorded. Source CV text alone does not qualify. The additive `cv.autoDrafted`
migration preserves a once-per-workspace decision across saves and backups. Undo and Start from empty consume
that decision; revisiting never refills it. Review remains false, both exports stay locked, and importing a
backup always resets review. Sam uses the same path. AI proposals still require individual acceptance.

**AI simplification (2026-10-25).** The default is a remembered free-chat choice with copy/open to a plain
homepage, or phone sharing. Returning users paste replies into the unchanged structured parser and individual
proposal review. Workspace prompts never appear in URLs; prefilled links are confined to public `/prompts/`
content. This supersedes earlier workspace-prefill and inline route-selection decisions. Connection setup is
under Settings → Advanced. The AI panel is a modal sheet, with exact text always available and first direct
send gated by viewing and confirming it. Optional browser-owned local AI is offered only after a local
availability check and requires consent before downloading. OpenRouter's public catalogue is fetched at
connection time, restricted to `:free` IDs; configuration is a failure fallback, not an extra source of choices.
No provider call, native download, physical-device use or Dutch-language review is claimed from mocked tests.


**Prompt library v2 (2026-10-25, maintainer-approved).** Eight public prompts and the Write your own
example are preserved verbatim in `docs/prompts/library-v2.md` and in content bodies (with Markdown
headings). Builders output Goal → Instruction → Context → Guardrails → Evaluation. The maintainer approved
adding missing standalone protections to published prompts and moving injection guards after quoted Context;
the safeguards' meaning, user agency, verification duty and individual proposal acceptance remain intact.
Public prompts have no app-specific verification claim; app prompts retain it in Evaluation. JSON output
schemas/parser are unchanged. The new Read one advert step adds an empty draft slot during normalization;
existing saved drafts and step IDs are preserved.

The wording scan covers prompts and interface prose, not knowledge source material or immutable original
workshop references. Official organisation names and source URLs are preserved. G14 was already assigned
to workspace URL privacy, so the new wording check is G15. This work changes no workshop/demo fixtures,
AI network hosts, runtime dependencies, release settings or human-verification checklist entries.

**Sam showcase (2026-10-25, maintainer-approved).** The fictional workspace now contains sixteen
interview answers/reflections, one labelled mock exchange, five labelled example replies and a complete
custom prompt. Existing profile, advert and CV facts are unchanged. The maintainer approved replacing
unsupported claims in the supplied answers with visible placeholders; the verbatim brief and deviations
are saved in `docs/plans/sam-showcase.md` and `sam-showcase-decisions.md`. Evidence categories remain
Supported / Partly supported / Not shown / Unclear; the prohibition on personal-status wording remains.
Complete five-part custom templates retain their sections when prepared, with the same mandatory
safeguards and quoted workspace data. Examples are visible only in demo workspaces; Start my own clears
all of them. No AI call, automatic acceptance or review approval is implied by a teaching example.
