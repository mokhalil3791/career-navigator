# Phase 1 plan — Foundation and parity

Status: **approved 2026-10-23** ("approved as recommended"; D1–D8 accepted). Implemented on branch `phase-1-foundation`. See §9 for changes made during implementation.
Written 2026-10-23 against `docs/PRD.md` (dated 2026-10-23) and `reference/v0.1/Career_Navigator.html` (1,460 lines).

**Gate (from PRD):** all v0.1 behaviours and guardrail tests pass, and v0.1 backups import.

---

## 1. Decisions I need from you before coding

These are blocking. Each one has a recommendation; reply "approve as recommended" or change any of them.

| # | Question | Why it matters | My recommendation |
|---|---|---|---|
| D1 | **Phase 0 is not done yet.** The repo has only a README, and Phase 0 is due 31 Oct, before the 2 Nov workshop. | Phase 0 is the part participants actually see on 2 Nov. Phase 1 will not be finished by then. | Do Phase 0 first (about half a day: licence, README, v0.1 on Pages, `/prompts` page, QR code, issue templates), as its own PR. Then start Phase 1. |
| D2 | **Where v1 is deployed during development.** One repo has one Pages site. | If Phase 1's `pages.yml` deploys to the root, it replaces the workshop link with an unfinished app. | v0.1 stays at `/`. Phase 1 deploys to `/next/`. We move v1 to `/` only after you approve it, and not before 2 Nov. |
| D3 | **Approve `lit-html` as the one runtime dependency.** The PRD names it, but your rule says to ask first. | It is the only code that ships to users. It is about 7 KB gzipped, BSD-3 licensed, and auto-escapes text, which removes v0.1's string-HTML XSS risk. | Approve `lit-html@3`, vendored through the bundle (no CDN). |
| D4 | **The original workshop prompts conflict with principle 2.** v0.1 `buildPrompt` attaches the original prompt as "reference only". Originals #2 and #3 ask for "a match score from 0 to 100" and "ranked from best to worst". | Principle 2 says no scores anywhere in prompts. A guardrail test would fail on v0.1's exact output. | Port `buildPrompt` exactly, **except** that the "ORIGINAL WORKSHOP PROMPT" block is removed from outgoing prompts. The originals stay only in `reference/v0.1/` for history. The "Read the original workshop prompt" panel in the studio is removed too. The safeguard sentence "(including a numeric match score)" is kept, because it is a ban, not a request. |
| D5 | **`anthropic-byok` is listed in the PRD repo layout**, but principle 5 says v1.0 ships no paid adapters. | Principles override the layout. | Do not create it, now or later. I will fix the layout in `docs/PRD.md` with a one-line note, if you agree to that edit. |
| D6 | **What schema v2 contains.** | Later phases add fields. Reshaping fields (for example languages as a list of rows, FR-PRO-4) can't be migrated perfectly from free text. | v2 = the v1 shape unchanged, with `schemaVersion: 2`. Rule: later phases may **add** optional fields with defaults without changing the version. A **reshape** adds a new numbered migration step (v2→v3). Phase 1 builds the migration pipeline and its tests. |
| D7 | **AI chat links in the studio.** v0.1 links ChatGPT and Claude. The PRD lists Claude.ai, Gemini, Le Chat and Copilot. | Keeping v0.1 behaviour vs following the PRD list. | Show all five (each has a free plan). The list lives in `config/providers.json` (copy-paste entry), so we don't hard-code it. |
| D8 | **Persistence backend in Phase 1.** The PRD says IndexedDB. v0.1 uses localStorage. | IndexedDB is async and harder for beginners to read. | Use IndexedDB behind one small `src/storage/` module, as the PRD says. On first load, read the old v0.1 localStorage key once (same origin after Phase 0), migrate it, then delete it. |

---

## 2. Scope

**In Phase 1**

- Repo scaffolding: `docs/PRD.md`, `reference/v0.1/`, licence files, package setup, dev tooling.
- Port v0.1 `CareerCore` into small pure modules in `src/core/`, with the v0.1 file as the test oracle.
- Move v0.1 `CareerContent` into `content/` data files with JSON Schemas: 9 roles, 8 interview questions, 6 prompts **rewritten without scores** (as `content/prompts/*.md` with frontmatter) and the Sam demo.
- Store (`getState`, `update(path, value)`, `subscribe`) with pure reducers, including the review-reset rules.
- Schema v2 and the `migrate(1 → 2)` step.
- lit-html pages for all 7 areas, at full v0.1 parity: Overview, My profile, Compare jobs, My application, Interview practice, 90-day plan, AI prompt studio.
- Opt-in device saving (IndexedDB), backup export/import, and the HTML CV and work pack exports.
- Strict meta CSP with **no `unsafe-inline` for scripts** in the hosted build.
- CI (type check, unit tests with coverage, Playwright on three engines, axe-core, `npm audit`, CodeQL, dependency review) and a Pages deploy to `/next/` (see D2).
- `CLAUDE.md` / `AGENTS.md` (same content), first version.

**Not in Phase 1** (later phases): any built-in AI provider, redaction, onboarding wizard (FR-ONB), i18n/Dutch, knowledge cards, applications tracker, CV import, DOCX/.ics export, coach view, PWA/service worker, single-file release build, `CUSTOMISING.md`.

The new profile fields (FR-PRO-1 target roles, work preferences) are additive under D6, so they wait for the phase that builds their UI.

---

## 3. Tasks, in commit order

Each line is about one commit. Tests come before the code they protect.

**A. Scaffolding**
1. `git init`, connect to `origin`, commit the PRD as `docs/PRD.md` and v0.1 as `reference/v0.1/Career_Navigator.html` (unchanged, byte for byte).
2. `package.json`, `.nvmrc` (Node 22 LTS; Node 20 reached end of life in April 2026), `.editorconfig`, `.gitignore`, `jsconfig.json` (`checkJs`, strict) and `LICENSE` (MIT) plus `LICENSE-content` (CC BY 4.0), credited to "Career Navigator contributors".
3. Dev dependencies only: `vite`, `vitest`, `@vitest/coverage-v8`, `@playwright/test`, `@axe-core/playwright`, `typescript` (for `tsc --noEmit` only), `ajv` (schema checks in tests/CI, not shipped). Runtime: `lit-html` (pending D3).

**B. The oracle and guardrail tests (written first, before any port)**
4. `tests/helpers/v01-oracle.js` loads `CareerCore` and `CareerContent` from the reference HTML into a Node `vm` sandbox. Every parity test then compares **new output against real v0.1 output**, so "port, don't re-invent" is checked by a machine, not by memory.
5. Guardrail tests in `tests/guardrails/` (see §5.1). They fail at first (red), and stay in the repo forever.
6. Parity tests in `tests/parity/` (see §5.2), run against the oracle. Also red at first.

**C. Port the core** (each module turns its parity tests green)
7. `src/core/validate.js`: `fail`, `record`, `string`, `boolean`, `integer`, `list`, `identifier`, `dictionary`.
8. `src/core/schema.js`: `newWorkspace`, `normalizeWorkspace`, limits as named constants (`MAX_JOBS = 8`, and so on).
9. `src/core/backup.js`: `parseWorkspace` (1 MiB character and byte checks, JSON parse, forced `remember = false` and `reviewed = false`).
10. `src/core/migrate.js`: `migrate(input)` running the step chain `1 → 2`. `parseWorkspace` calls it before normalising.
11. `src/core/prompts.js`: `profileText`, `selectedJob`, `buildPrompt` (D4 is the only intended difference). `SAFEGUARD_LINES` is exported as a constant, so tests and later prompt templates use the same text.
12. `src/core/evidence.js`: `requirementsSummary`, `STATUSES`, status labels.
13. `src/core/plan.js`: `planFromRole`. `src/core/cv.js`: `draftCvFromProfile`.
14. `src/core/exports/html.js`: `escapeHTML`, `safeUrl`, `documentHTML`, `buildCVHTML`, `buildPackHTML`. These stay string-based because they produce standalone files, not live DOM. Escaping is covered by tests.

**D. Content as data**
15. `content/schemas/*.schema.json` for role, interview question, prompt frontmatter and workspace (v2).
16. `content/roles/<id>.json` ×9, `content/interview/default.json`, `content/demo/sam.json` (converted to v2) and `content/prompts/<step>.md` ×7. The prompt text is the v0.1 `tasks[step]`. The safeguard block is added by code, never by the template.
17. `src/content/load.js`: validates at load time. A bad role file is skipped with a visible warning, not a crash (as the customisation table in the PRD requires).

**E. Store and storage**
18. `src/store.js`: `getState`, `update(path, value)`, `subscribe`. It blocks `__proto__`, `prototype` and `constructor` paths. It enforces the 950,000-byte workspace cap from v0.1.
19. `src/core/reducers.js`: pure actions (add/select/remove/move job, add/remove requirement, apply template, draft CV, review CV, load demo, start own, reset). It contains **one** `invalidatesReview(action)` rule, ported from v0.1 `updateField` and the click handlers.
20. `src/storage/idb.js` (opt-in save/load/clear), plus a one-time v0.1 localStorage pickup (D8).

**F. UI (lit-html)**
21. `src/styles/tokens.css` (v0.1 palette and spacing), `layout.css`, `print.css`, ported as-is from v0.1's `<style>` and split by purpose.
22. `src/components/`: `field.js`, `button.js`, `icon.js`, `page-heading.js`, `privacy-drawer.js`, `notice.js`, `evidence-pills.js`.
23. `src/app.js` (shell, hash router, sidebar/mobile nav, demo banner, footer with the fixed independence notice).
24. `src/pages/`: `home.js`, `profile.js`, `jobs.js` (+ `requirement.js`), `cv.js`, `interview.js`, `plan.js`, `studio.js`. Each page is a direct port of the matching `render*()` from v0.1, with the same text, labels, limits and confirm dialogs.

**G. CI, deploy, docs**
25. `.github/workflows/ci.yml`: `tsc --noEmit`, `vitest --coverage` (fails below 90% lines on `src/core/`), Playwright (Chromium, Firefox, WebKit, plus Pixel 7 and iPhone 14 viewports), axe, `npm audit --omit=dev --audit-level=high`, and a runtime-dependency count check (fails at 5 or more).
26. `.github/workflows/codeql.yml`, `.github/workflows/dependency-review.yml`.
27. `.github/workflows/pages.yml`: builds v1 into `/next/` and keeps v0.1/Phase 0 at `/` (D2).
28. `CLAUDE.md` = `AGENTS.md`: architecture, guardrails, commands, "never delete or weaken a guardrail test". A CI check confirms both files are identical.
29. Open the Phase 1 PR with a requirement checklist (§7).

---

## 4. Files touched

```
new   docs/PRD.md                      (moved from root, content unchanged)
new   reference/v0.1/Career_Navigator.html (moved from root, unchanged)
new   docs/plans/phase-1.md            (this file)
new   package.json  package-lock.json  .nvmrc  .editorconfig  .gitignore  jsconfig.json
new   vite.config.js  vitest.config.js  playwright.config.js
new   LICENSE  LICENSE-content
new   index.html                       (meta CSP, skip link, #app, noscript; ported from v0.1)
new   src/app.js  src/store.js
new   src/core/{validate,schema,backup,migrate,prompts,evidence,plan,cv,reducers}.js
new   src/core/exports/html.js
new   src/content/load.js
new   src/storage/idb.js
new   src/components/{field,button,icon,page-heading,privacy-drawer,notice,evidence-pills}.js
new   src/pages/{home,profile,jobs,requirement,cv,interview,plan,studio}.js
new   src/styles/{tokens,layout,print}.css
new   content/schemas/{role,interview,prompt,workspace-v2}.schema.json
new   content/roles/*.json (9)  content/interview/default.json  content/demo/sam.json
new   content/prompts/{profile,search,compare,fit,tailor,interview,letter}.md
new   config/providers.json            (copy-paste chat links only, D7)
new   config/features.json  config/brand.json   (minimal; locked safety keys)
new   tests/helpers/v01-oracle.js
new   tests/guardrails/*.test.js
new   tests/parity/*.test.js
new   tests/unit/*.test.js
new   tests/e2e/*.spec.js
new   tests/fixtures/v0.1/*.json       (backups produced by the real v0.1 file, see §5.3)
new   .github/workflows/{ci,codeql,dependency-review,pages}.yml
new   CLAUDE.md  AGENTS.md
edit  README.md                        (dev commands; the Phase 0 README text stays)
```

---

## 5. Tests to add

### 5.1 Guardrail tests: `tests/guardrails/`, never deleted

The PRD lists seven of these. Principles 5 and 6 are missing from that list, but the PRD says *every* principle must be a test, so I added G8 to G10.

| ID | Test | How |
|---|---|---|
| G1 | No percentage or fit score in any prompt or UI string | Builds every prompt (7 steps × empty, demo and maximal states) and scans every string in `content/`, `config/` and `src/`. Banned patterns: `\d+\s?%` in text (CSS excluded), "match score", "score from/out of N", "fit percentage", "rank(ed)? .* best". Only a short, exact list of ban sentences is allowed (for example "do not assign a fit percentage"), so the safeguard text itself passes. |
| G2 | Every built prompt includes the factuality and injection-guard block | Asserts that each line of `SAFEGUARD_LINES` and the closing "verify yourself" line appear in every prompt, including when `ai.extra` contains "ignore all previous instructions" and when advert text contains fake system headers. |
| G3 | CV export is locked until review; any profile, CV or job edit re-locks it | Unit: `buildCVHTML` throws unless `reviewed === true`. Reducer: every action and every `profile.*`, `cv.*` (except `reviewed`), `jobs[*].*` and requirement path sets `reviewed = false`. Also add, select and remove job, as v0.1 does. E2E: tick the box, edit a field, and the button is disabled again. |
| G4 | AI output never changes the CV, profile or plan without an accept click | Phase 1 (copy-paste only): writing to `ai.drafts.*` leaves `profile`, `cv` and `plan` deeply equal. A static check confirms that no module under `src/ai/` imports a reducer that writes to them. Phase 2 extends this to the diff-accept flow. |
| G5 | No network request leaves allowed hosts | E2E: Playwright records every request across a full click-through of all 7 pages. Anything not on the app's origin fails. Static: the built `index.html` CSP has `connect-src 'self'` and no remote `script-src` or `style-src`. A scan of `dist/` finds no `http(s)://` in `<script src>`, `<link href>` or `fetch(`. |
| G6 | Imported backups never enable device saving or keep the review flag | v1 and v2 backups with `remember: true` and `reviewed: true` both import as `false`. |
| G7 | The name field never appears in an outgoing prompt | A unique sentinel name (`Zq7-Name-Sentinel`) that appears only in `profile.name`, checked across all 7 steps. The demo is excluded on purpose, because its other fields say "Sam". |
| G8 | Free forever (principle 5) | No paid provider host (`api.anthropic.com`, `api.openai.com`, …) in `config/` or `src/`. No paywall wording ("trial", "upgrade", "credit card", "payment", "subscribe") in UI strings. No `anthropic-byok` adapter file. |
| G9 | Dignity (principle 6) | The workspace schema has no keys like refugee status, residence permit, nationality, date of birth, BSN, photo, marital status, religion or health. `normalizeWorkspace` drops unknown keys, so an import carrying such a key does not keep it. |
| G10 | AI text is labelled unverified, and the independence notice is fixed | Component test: the studio draft area shows "Needs human review". The footer contains the independence notice even when `brand.json` overrides the footer text. |

There is also an XSS lint test (no dependency): `src/` must not contain `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `unsafeHTML`, `eval` or `new Function`. The exports module is allowed because it builds escaped file content, not live DOM.

### 5.2 Parity tests: `tests/parity/`, against the v0.1 oracle

Each "Keep from v0.1" bullet is mapped to tests:

- **Seven areas.** E2E: each nav item routes, the `h1` gets focus, and the mobile `<select>` nav works at 390 px.
- **Limits.** `normalizeWorkspace` matches v0.1 on accept/reject and on error messages for: 8 jobs, 20 requirements, every string length cap, identifier regex, duplicate job and requirement IDs, 32-key dictionaries, hours 1–40, unknown status, unknown AI step falling back to `profile`, and `selectedJobId` pointing at a missing job.
- **Demo.** `normalizeWorkspace(demo)` equals the v0.1 result (field by field, apart from the version number). It has 3 fictional adverts, and the banner and "Start my own" work.
- **Backup.** 1 MiB by characters and by bytes (multibyte text just under and just over the limit), invalid JSON, a `__proto__` key in JSON, `constructor` as an ID, a non-plain object, and a round trip export → import.
- **Opt-in saving.** E2E: off by default, so a reload loses the data. Switched on, a reload restores it. Switched off, the stored data is removed. A failed write switches saving off and shows the v0.1 message.
- **Review gate.** As G3.
- **Name omitted, quoted JSON.** As G7, plus: for every step and state in the corpus, the new `buildPrompt` output equals v0.1 output **with the original-prompt block removed** (D4). That difference is the only one allowed, and it is written into the test.
- **Printable HTML.** `buildCVHTML` and `buildPackHTML` equal v0.1 byte for byte (except the version label). Each has its own CSP meta. Hostile text in every field comes out escaped.
- **Other functions.** `requirementsSummary`, `planFromRole` (all 9 roles plus custom), `draftCvFromProfile`, `safeUrl` (javascript:, data:, credentials, control characters, 3000+ characters) and `escapeHTML`.

### 5.3 Migration tests: `tests/unit/migrate.test.js`

- **Fixtures** are produced by driving the **real v0.1 file** in Playwright: empty, demo, demo edited, maximal (every limit at the maximum), and with Unicode/RTL text. They are committed under `tests/fixtures/v0.1/`.
- v1 → v2 keeps every field. A v2 file re-exports and re-imports unchanged. v3 or a missing version is rejected with a clear message.
- **Ask for you:** if workshop testers have real v0.1 backups they agree to share, anonymised, I'd add them as fixtures. They are not required.

### 5.4 Accessibility

axe-core runs on each of the 7 pages, in empty and demo state, on desktop and mobile. It fails on serious or critical issues. This is English only in Phase 1; Dutch arrives in Phase 3.

---

## 6. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Phase 1 deploy replaces the workshop link | Participants hit an unfinished app | D2: v1 lives at `/next/` until you approve the switch |
| Hidden behaviour in v0.1's 1,460 lines is lost in the port | Silent regressions | Real v0.1 code in a `vm` sandbox serves as the oracle. Each `render*()` is ported 1:1 with the same strings. A manual side-by-side checklist goes in the PR. |
| v0.1 does some things on purpose that look like bugs | "Fixing" them breaks parity | Not fixed in Phase 1. Each one is listed in the PR as a follow-up issue instead (for example: selecting a different advert resets the review, which is strict but intended). |
| Strict CSP vs. Vite output | Inline scripts are blocked | Vite emits external module files, so `script-src 'self'` works. lit-html needs no `eval`. The single-file build (Phase 5) will need a hash-based CSP. Noted for later. |
| IndexedDB is unavailable (Firefox private mode, some in-app browsers such as WhatsApp's) | Saving fails | Same graceful path as v0.1: saving switches off, a notice suggests a backup, and the app keeps working with session data |
| Shared origin: `mokhalil3791.github.io` is shared by all of your Pages repos | Another repo of yours on that origin could read saved data | Low risk (same owner). Documented in `PRIVACY.md` later. A fork gets its own origin. Fully fixing it would need a custom domain, which costs money, so it is out of scope. |
| WebKit on Windows is not real Safari | E2E passes on WebKit but iPhone may differ | Manual iPhone check stays in the release checklist |
| Scope is large for one PR | Hard to review | Small commits in the order above. The PR description groups them A–G. |

---

## 7. PR checklist (draft, mapped to requirement IDs)

- [ ] Keep-from-v0.1: seven areas, demo, backup validation, opt-in saving, review gate, name omitted and quoted JSON, printable HTML, strict CSP
- [ ] Principles 1–7: guardrail tests G1–G10 green
- [ ] FR-PS-1: v0.1 prompts and the copy-paste flow kept (D4 change noted)
- [ ] FR-JOB-1: 8 adverts, manual review, four statuses
- [ ] FR-CV-1: review gate and invalidation
- [ ] FR-INT-1: 8 questions and self-review
- [ ] FR-PLAN-1: 9 templates and custom
- [ ] FR-FORK-2: `AGENTS.md` = `CLAUDE.md`
- [ ] FR-FORK-5: MIT + CC BY 4.0, roadmap.sh credited
- [ ] NFR-SEC-1: network guard E2E and CSP
- [ ] NFR-SEC-2: backup validation and v0.1 migration suite
- [ ] NFR-SEC-3 (partial): all UI through lit-html escaping. DOMPurify waits for Phase 2, when AI Markdown is rendered.
- [ ] NFR-SEC-4: injection-guard wording kept
- [ ] NFR-SEC-7: `npm audit`, CodeQL, dependency review; runtime dependencies below 5
- [ ] NFR-A11Y-1/2 (English): axe green on all pages
- [ ] NFR-PERF-1: Chromium, Firefox and WebKit E2E plus mobile viewports
- [ ] Gate: v0.1 backups import with no data loss

---

## 8. Gaps I'd suggest for later phases (not in Phase 1; for you to accept or drop)

You asked me to point out gaps. Each of these keeps the tool free and needs no server.

1. **Shared-phone safety.** Many participants share a phone. Add a "Shared device" choice in onboarding (FR-ONB-1): saving can't be switched on, there is a visible "Delete everything" button, and the browser tab title stays neutral. Phase 2 or 4.
2. **Optional passphrase on coach packs and backups** (WebCrypto, built into browsers, no dependency). The files travel over WhatsApp and email, so a passphrase protects the personal details in them. Phase 4, next to FR-COACH.
3. **Low-data mode.** Show the WebLLM download size and require Wi-Fi confirmation before any large download. Many participants rely on prepaid mobile data. Phase 2.
4. **Explanation language ≠ interface language.** v0.1 already lets AI explain in Arabic, Ukrainian, Tigrinya and more. Keep this visible on every AI panel, because it helps people long before the Dutch UI ships. Phase 2.
5. **"Report a wrong fact" link on each knowledge card**, which opens a prefilled GitHub issue (no analytics). Content stays correct without tracking anyone. Phase 3.
6. **Guardrail coverage report in CI**, mapping each principle to its tests, so a fork that deletes one is visible in the PR. Phase 5.

---

## 9. Changes made during implementation (decision log)

- **Schema v2 is defined once, with every additive field the later phases need**: target roles, work preferences, language and education rows, applications, check-ins, custom prompts, coach notes, the LinkedIn draft and the mock interview. All phases ship today, so this avoids a v3 migration. Each new field has a safe default, and v1 data migrates losslessly (tested on 9 fictional v0.1 backups).
- **The i18n layer is built in Phase 1** (the English sentence is the key: `t('…')`), so pages are not rewritten in Phase 3.
- **The store validates every change against the backup schema**, so the workspace can always be exported. v0.1 relied on HTML `maxlength` only.
- **Requirement edits now also re-lock the CV review.** v0.1 did not do this, but guardrail G3 says "any job edit". This is stricter, not weaker.
- **Bugs found by tests and fixed:**
  - `Object.assign` in the migration would run the `__proto__` setter for a JSON key named `__proto__` (parity test).
  - Switching device saving off could race with a save still in flight and write the data back (E2E test on mobile). Saves and clears now share one queue, and each save re-checks the setting.
- **Accessibility fixes found by axe:**
  - v0.1 `.step-num`, `.hero-caption` and footer text were below 4.5:1 contrast.
  - Scrollable regions (the prompt library `<pre>`, the comparison table on phones) are now keyboard-focusable.
- **WebKit false positive:** WebKit logs a style-src CSP report for its own built-in `<select>` styling, even on a static page. The CSP stays strict. Only that exact WebKit message is ignored in the E2E page-error check (see `tests/e2e/fixtures.js`).
- **New guardrail G12 (repo policy):** runtime dependencies must be on the approved list (lit-html, web-llm, pdfjs-dist) and fewer than 5. AGENTS.md must equal CLAUDE.md. Safety features have no on/off switch. No analytics code.
- **Fictional v0.1 backup fixtures** are generated by the v0.1 code itself (`scripts/dev/generate-v01-fixtures.mjs`), as the maintainer asked.
- **Firefox E2E** runs in CI (Ubuntu). The local Windows Firefox install failed, which is an environment problem, not an app failure.
