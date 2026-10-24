# v1 status by requirement

## Phone polish (2026-10-24, branch `v1-polish`)

**Implemented:** one welcome action pair, no duplicate example action during demo use; a single-row phone
header with language and backup controls in Menu and Settings; unsaved status appears with the first content
edit's save prompt. Back/Next is sticky at the viewport bottom and toast clearance follows its actual height.
Requirements expand one at a time without changing stored evidence. My CV keeps banner Undo, removes the
two replacement shortcuts, makes Word primary and labels the continuation “Next: practise and plan”.
Step 4 is Done only after steps 1–3 are Done and a nonblank interview answer, plan next action or application exists.

**Automatically tested:** 400 unit/parity/guardrail tests; coverage passes its 90% line gate; typecheck,
hosted/single-file builds and content checks. Focused browser checks cover Home states, first-edit warning,
menu controls, sticky placement and toast clearance at three scroll positions on every step, requirement
value preservation and Word-first locked exports. All four locally installed browser projects are exercised;
final suite and CI results are recorded on the PR. Dutch coverage: 713/713 strings; shell: 119.9 KB gzip.
G1–G13, the G5 fixture, dependency manifests and AGENTS/CLAUDE remain unchanged.

**Agent visual check:** [390 px screenshots](reports/v1-polish/README.md). Sam's collapsed Target job page
is 3,132 px high at 390 × 844, below four screens (3,376 px).

**Verified by a person:** none. Real phones, fluent Dutch review, Word/LibreOffice rendering and the five-user
pilot remain pending. No release-checklist items were ticked, and no release tag or repository setting changed.

## Approved launch implementation (2026-10-24)

- FR-ONB / FR-PRO / FR-JOB / FR-CV / FR-INT / FR-PLAN / FR-APP: four numbered steps, import-first profile,
  optional structured details, visible advert evidence review, CV/Letter/LinkedIn tabs, and Next steps tabs.
- FR-CV-1/2/3: a first draft copies recorded facts only through the existing mapper. Every CV content field,
  including letter and LinkedIn, must be empty. The additive `cv.autoDrafted` migration records the once-only
  decision. Undo/Start from empty never refills on a later visit. Review stays false and both exports stay locked.
  Sam follows the same path; backup import resets review even after an auto-draft.
- FR-AI / FR-PS / NFR-SEC: one main AI action per step, first-use route choice, provider preview/redaction and
  individual proposal acceptance retained. Saving remains opt-in; first-edit prompt and Settings make it visible.
- FR-LIB / FR-FORK / NFR-A11Y / NFR-I18N: orange role tokens, contrast tests, public prompt library styling,
  printable A4 handout, Dutch string coverage, root deployment and route-preserving old-link redirect.

**Automated locally:** 395 unit/parity/guardrail tests; typecheck; hosted and single-file builds; 68 Chromium
E2E tests. Coverage command passes its 90% line gate. Desktop WebKit and both mobile suites passed 189 tests with nine existing browser-specific skips; the final focused launch/auto-draft suite passed 44 cases across the four local projects. Screenshots and scope are in `docs/reports/v1-launch/README.md`. G1–G13 and `tests/e2e/fixtures.js` are unchanged.

**Verified by a person:** none. All provider replies in tests are mocked. No model download, real Gemini call,
real-device upgrade, fluent Dutch review, physical print, Word/LibreOffice rendering or five-user pilot has
been performed. The existing PDF standard-font warning remains unresolved. No manual checklist item is ticked.

## Historical implementation records

Baseline: Phases 0–5, review fixes and primary-journey PRs #9–#11 are merged into `main`. The approved `v1-launch` branch serves v1 at the project root, with `/next/` as a redirect only. No release tag. The table records baseline checks; launch verification is recorded separately below.

Column meanings:
- **Implemented:** code is in the baseline (✔), partly (◐), or not built (✘).
- **Automatically tested:** a test in CI checks it. *Unit* = Vitest, *E2E* = Playwright on Chromium, Firefox (CI only), WebKit, Pixel 7 and iPhone 14 viewports, with mocked AI. "—" = no automated test.
- **Manually verified:** a person checked it on real hardware or software. **Nothing has been verified by the maintainer yet.** "Agent" marks checks the coding agent ran by hand on this Windows PC (not a substitute for the release checklist).

| Requirement | Implemented | Automatically tested | Manually verified |
|---|---|---|---|
| Keep-from-v0.1 (7 areas, demo, backup validation, opt-in saving, review gate, name omitted, printable HTML, strict CSP) | ✔ | Unit (parity against the real v0.1 code, byte-identical prompts and exports); E2E | — |
| Principles 1–7 / guardrails G1–G13 | ✔ | Unit + E2E (G5 runs in every E2E test) | — |
| FR-ONB-1/2/3 onboarding, privacy, progress | ✔ | E2E | — |
| FR-PRO-1 target roles, preferences | ✔ | E2E (prompt content) | — |
| FR-PRO-2 CV import PDF/DOCX/TXT | ✔ | Unit (DOCX, TXT, errors); E2E (all three fictional files) | — real CVs |
| FR-PRO-3 suggest fields | ✔ | Unit (proposals) | — |
| FR-PRO-4/5 language and education rows (incl. into CV draft) | ✔ | Unit + E2E | — |
| FR-JOB-1..4 adverts, extraction, evidence quotes, Dutch demand | ✔ (FR-JOB-5 matrix: ◐ table, not card stack) | Unit + E2E (copy-paste round trip) | — |
| FR-APP-1..3 tracker, .ics, weekly view | ✔ | Unit + E2E | — calendar import |
| FR-CV-1 review gate | ✔ | Unit (G3) + E2E | — |
| FR-CV-2 tailoring diff | ✔ | Unit + E2E (pasted reply) | — |
| FR-CV-3 DOCX + print HTML | ✔ | Unit (DOCX round trip, escaping) + E2E (download) | — **Word / LibreOffice not opened** |
| FR-CV-4 LinkedIn; FR-CV-5 two-page warning | ✔ | Unit | — |
| FR-INT-1/2/3 questions, mock interview, packs | ✔ | E2E (mock interview with mocked Gemini) | — |
| FR-INT-4 voice (MAY) | ✘ (privacy: Chrome sends audio to Google) | — | — |
| FR-PLAN-1..4 templates, check-in, .ics, plan from gaps | ✔ | Unit + E2E | — |
| FR-PS-1..3 studio, preview + Send, custom prompts | ✔ | Unit + E2E | — |
| FR-LIB-1..5 public `/prompts`, QR, short links, one-page print | ✔ | Unit + E2E (incl. PDF page count) | — QR not scanned with a phone |
| FR-COACH-1..4 coach pack, read-only view, notes, warning, passphrase | ✔ | Unit + E2E (two browser contexts; >1 MiB pack) | — WhatsApp round trip |
| FR-AI-1..7, 9 provider contract, adapters, redaction, confirm | ✔ | Unit (contract tests on mock responses) + E2E (mocked Gemini) | — **no real provider call yet** |
| FR-AI-8 per-page AI chat (SHOULD) | ✘ (task panel instead) | — | — |
| WebLLM | ✔ | E2E: download gate only | — **never downloaded** |
| Ollama | ✔ | Unit (mock NDJSON) | — |
| FR-KNW-1..5 knowledge cards (EN), sources, hidden TODOs, age warning | ✔ (Dutch cards ✘) | Unit + E2E | Agent: facts checked against the cited official pages on 2026-10-23; TODOs await the maintainer |
| FR-FORK-1..5 docs, AGENTS = CLAUDE, template repo, starter prompts, licences | ✔ | Unit (G12) | Agent: template setting switched on via the API |
| NFR-SEC-1..7 | ✔ | Unit + E2E + CodeQL + dependency review + npm audit | — |
| NFR-A11Y-1/2/3 | ✔ | E2E axe on every page, EN + NL, desktop + phone sizes | Agent: Lighthouse (mobile) 100 accessibility / best practices / SEO; **no screen-reader pass** |
| NFR-I18N-1..4 | ✔ (Dutch machine-assisted) | Unit (coverage 100%, placeholders, logical CSS) + E2E journey 4 | — **no fluent-speaker review** |
| NFR-PERF-1 browsers; NFR-PERF-2 budget | ✔ | E2E on 5 projects; CI budget (shell ~117 KB gzipped of 300) | — **no real phones**, Lighthouse performance not measured |
| PWA install + offline | ✔ | E2E (service worker, offline reload, Chromium) | — not installed on a phone |
| Single-file release | ✔ | E2E (opened from `file://`, strict CSP) | — not tagged (maintainer step) |

## End-to-end journeys
| Journey | Automated | Manual |
|---|---|---|
| 1 Example → coach pack → coach view → note → import → delete everything | ✔ E2E | — |
| 2 PDF import → fields → advert → extract → tailor → review → DOCX | ✔ in parts (import, extraction and tailoring by copy-paste, HTML + DOCX export) | — |
| 3 Gemini (mocked): key, preview, redact, mock interview to feedback | ✔ E2E with mock | — real Gemini call |
| 4 Dutch interface, CV stays in chosen language | ✔ E2E | — fluent review |
| 5 Phone: journey 1 by touch, install, offline | ◐ E2E on phone viewports + offline reload; touch-only and install are manual | — |
| 6 v0.1 backup → v1 without loss | ✔ Unit (9 fictional backups) + E2E | — |
| Primary CV journey (import → verify → one advert → tailored draft → export) | ✔ continuous E2E added in PR C, including both file contents; copy-paste replies are fictional | — added to both real-phone checks in `RELEASE-CHECKLIST.md` |

## Known issues
See `docs/KNOWN-ISSUES.md`.

## Primary journey PR A (2026-10-24, branch `primary-journey`)

**Merged in PR #9 (green CI):** import-first profile with paste/manual alternatives; education/language rows grouped under their free-text fields; populated optional sections expanded; plain next-step navigation; Dutch strings. No schema, review-gate, AI acceptance, or network-policy change. Home/navigation, advert/CV order and AI-route simplification remain for PRs B/C after maintainer merges.

**Automated verification:** 342 unit/parity/guardrail tests, type checking, app/site and single-file builds, and all 41 Chromium E2E tests passed. Selected mobile suites (profile journey, new modules, languages/knowledge and accessibility/library) passed 46 tests across mobile-chrome and mobile-safari; two existing desktop-only print tests were skipped. Translation coverage is 727/727 strings; shell size is approximately 118 KB gzipped. New profile E2E cases cover source-only PDF import, whole-fixture extracted text, manual/no-AI entry, optional rows, EN/NL accessibility, backup preservation and locked exports after navigation.

**Agent visual check:** Chromium at 360 × 732, file input at approximately 464 px from the top (44 px target), visible without scrolling. This is not real-device verification or five-user evidence.

**CI finding:** the new Dutch 360 px check exposed header overflow with Linux WebKit system fonts. Header controls now wrap on narrow screens, retaining all actions; the test still requires no horizontal overflow. Final CI results are available on the PR.

**PDF warning investigated, not fixed:** `UnknownErrorException: Ensure that the standardFontDataUrl API parameter is provided.` The importer does not supply standard font data. The fictional PDF extracts correctly; that does not prove all PDFs are unaffected. No remote fonts added and no warning hidden. A fix needs separate packaging scope for hosted/offline/single-file builds.

**Verified by a person:** none for this change. Dutch review, real-phone use, real CV compatibility, the five-user timing target and all manual release checks remain pending. See `docs/plans/primary-journey-observation.md` for the approved pilot procedure.


## Primary journey PR B (2026-10-24, branch `primary-journey-cv`)

**Merged in PR #10 (green CI):** one-advert continuation with visible optional evidence review; explicit draft creation and unchanged replacement confirmation; language/structured tailoring together; review and preview before empty optional writing tools; existing letter visible before review; clearly labelled HTML and Word exports. AI panel presentation is reserved for C. No schema, reducer, export implementation, review-gate or network-policy changes.

**Automated verification:** new E2E tests walk advert → draft → pasted AI proposals → review → both downloads, reading HTML and DOCX `word/document.xml` to check accepted/edited content and exclude rejected content. They check both formats re-lock after profile, advert, CV or letter edits, letter inclusion, returning draft preservation and replacement cancellation, a general CV without AI or an advert, and expanded English/Dutch accessibility at phone sizes. Required local checks and mobile suites are recorded on the PR; CI must pass before merge. Translation coverage: 744/744 strings; shell approximately 119 KB gzip.

**Agent visual check:** review and exports inspected in Chromium at 360 × 732. Empty optional writing no longer precedes the review gate. This verifies presentation in emulation, not usability or human timing.

**Verified by a person:** none for B. No release-checklist items completed; real devices, Dutch review, Word/LibreOffice rendering and the five-user test remain pending. PR C adds the continuous import-to-export test and simplifies entry points/AI-route display; see the branch record below.


## Primary journey PR C (2026-10-24, branch `primary-journey-entry`)

**Merged in PR #11 (green CI):** a primary five-step CV route and recorded-state continuation; simpler welcome; primary AI prompt studio navigation and secondary More tools; grouped mobile selector; current AI route with optional provider setup; four copy-paste instructions and session-only backup reminder. Existing CV/profile content is never filled or verified by navigation. Changed source/advert context blocks previous primary-task proposals until an explicit restart. No schema, core reducer, exporter, provider or guardrail changes.

**Automated verification:** full PDF-to-reviewed-export journey and focused cases passed on Chromium/mobile-chrome/mobile-safari; both HTML and DOCX XML are inspected for accepted/edited text and absence of rejected text. The malformed reply, no-AI path, returning draft, EN/NL navigation/axe, mocked provider confirmation/fallback and changed-context behavior are checked. The broader mobile suites passed 52 tests. Unit/parity/guardrail count remains 342. Exact final Chromium and CI results are recorded on the PR. Translation coverage: 743/743; shell approximately 120 KB gzip.

**Optional modules:** a temporary local build with built-in AI, applications, knowledge and coach modules disabled passed the manual journey and both exports on all three local browser projects. Configuration was restored; this alternate build is not a CI matrix entry.

**Agent visual check:** at 360 × 732, the home CV action begins around 409 px with a 44 px target; desktop expanded More tools was also inspected. No real provider was used. The prior pdf.js standard-font warning remains documented and unresolved.

**Verified by a person:** none for C. Human timing, comprehension, real devices, fluent Dutch and Word/LibreOffice rendering remain pending. After merge, use `docs/plans/primary-journey-observation.md` with five intended users; report each result against the under-45-minute target. No manual release item was ticked and v1 remains at `/next/` without a release tag.
