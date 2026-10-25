# Guardrail tests — never delete or weaken

| Test | Principle / requirement |
| --- | --- |
| G1 `g1-no-score` | 2 Evidence, not scores: no score or percentage in any prompt or UI text |
| G2 `g2-safeguards` | 1 Truth: every prompt carries the factuality and injection guards |
| G3 `g3-review-gate` | 1/3: CV export locked until review; any profile, CV or job edit re-locks it (HTML and DOCX) |
| G4 `g4-ai-accept` | 3 The user decides: AI changes apply only after an accept click |
| G5 `tests/e2e/fixtures.js` (auto) | 4 Private: no request leaves the allowed hosts, in every E2E test |
| G6, G7 `g6-g7-import-and-name` | 4: imports never enable saving or keep the review; the name never appears in a prompt |
| G8 `g8-free-forever` | 5 Free forever: no paid-only hosts, paywall wording or paid adapters |
| G9 `g9-dignity` | 6 Dignity: no status, identity, birth-date or photo fields; gaps are never deficits |
| G10 `tests/e2e/parity.spec.js` (independence notice) + studio/AI panel labels | Independence notice fixed in the footer; AI output always labelled "unverified draft" |
| G11 `g11-xss-and-csp-lint` | NFR-SEC-1/3: no raw HTML injection; strict CSP |
| G12 `g12-repo-policy` | NFR-SEC-7, FR-FORK-2: approved runtime dependencies (fewer than 5); AGENTS = CLAUDE; no switch for safety features; no analytics |
| G13 `g13-ai-task-prompts` | 1/2/4: G1, G2 and G7 for every AI task and custom prompt |
| G14 `g14-workspace-urls` | Private: workspace content never enters generated chat URLs; public-only prefill stays separate |
| G15 `g15-neutral-wording` | Dignity: neutral prompts and interface prose; knowledge source material and immutable references are preserved |

The maintainer approved five-part prompt ordering and neutral wording on 2026-10-25. G2/G6/G7/G13
keep their safety assertions with those limited wording/order changes; the G5 fixture and G14 are unchanged.

If a change makes one of these fail, the change is wrong. Adding a new guardrail is always welcome.
