# v1 status by requirement

Baseline: Phases 0–5 and the review fixes are merged into `main` (`e2f4929`, PR #8). **v1 is a preview at `/next/`. It is not tagged and not at the root.** The table records the baseline checks from 2026-10-23; branch changes are described separately below.

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
| Primary CV journey (import → verify → one advert → tailored draft → export) | ◐ covered by the parts above | — added to both real-phone checks in `RELEASE-CHECKLIST.md` |

## Known issues
See `docs/KNOWN-ISSUES.md`.

## Primary journey PR A (2026-10-24, branch `primary-journey`)

**Implemented on this branch:** import-first profile with paste/manual alternatives; education/language rows grouped under their free-text fields; populated optional sections expanded; plain next-step navigation; Dutch strings. No schema, review-gate, AI acceptance, or network-policy change. Home/navigation, advert/CV order and AI-route simplification remain for PRs B/C after maintainer merges.

**Automated verification:** 342 unit/parity/guardrail tests, type checking, app/site and single-file builds, and all 41 Chromium E2E tests passed. Selected mobile suites (profile journey, new modules, languages/knowledge and accessibility/library) passed 46 tests across mobile-chrome and mobile-safari; two existing desktop-only print tests were skipped. Translation coverage is 727/727 strings; shell size is approximately 118 KB gzipped. New profile E2E cases cover source-only PDF import, whole-fixture extracted text, manual/no-AI entry, optional rows, EN/NL accessibility, backup preservation and locked exports after navigation.

**Agent visual check:** Chromium at 360 × 732, file input at approximately 464 px from the top (44 px target), visible without scrolling. This is not real-device verification or five-user evidence.

**CI finding:** the new Dutch 360 px check exposed header overflow with Linux WebKit system fonts. Header controls now wrap on narrow screens, retaining all actions; the test still requires no horizontal overflow. Final CI results are available on the PR.

**PDF warning investigated, not fixed:** `UnknownErrorException: Ensure that the standardFontDataUrl API parameter is provided.` The importer does not supply standard font data. The fictional PDF extracts correctly; that does not prove all PDFs are unaffected. No remote fonts added and no warning hidden. A fix needs separate packaging scope for hosted/offline/single-file builds.

**Verified by a person:** none for this change. Dutch review, real-phone use, real CV compatibility, the five-user timing target and all manual release checks remain pending. See `docs/plans/primary-journey-observation.md` for the approved pilot procedure.
