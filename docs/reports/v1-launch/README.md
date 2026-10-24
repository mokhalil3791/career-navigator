# v1 launch verification report

The approved launch puts v1 at the project root, with an orange four-step journey and a one-time CV draft from recorded profile facts. No release tag or manual-checklist sign-off is included.

## Changes mapped to the PRD

| Requirements | Change |
|---|---|
| FR-ONB-1/2/3, NFR-A11Y | One-screen privacy welcome; visible Sam example; consistent numbered navigation, stepper, headings and Back/Next; keyboard-accessible tabs and mobile menu. |
| FR-PRO-1–5 | Import first, editable source, explicit AI proposal review; essentials first, optional structured education/language rows retained without conversion. |
| FR-JOB-1–5 | One advert first; visible optional evidence check, per-requirement evidence helper, comparison tab with two or more adverts. |
| FR-CV-1–5 | CV/Letter/LinkedIn tabs, profile-only automatic first draft, visible first-draft warning and undo, unchanged review gate, Word and HTML exports, download success. Letter claims appear at review. |
| FR-INT, FR-PLAN, FR-APP | Interview, 90-day plan and applications under Next steps; all existing tools remain reachable. |
| FR-AI, FR-PS, NFR-SEC | One main AI action per step; copy-paste default, first-use route choice, exact preview and redaction, per-suggestion accept/edit/reject. Opt-in saving prompt and clear status; data controls and coach notes in Settings. |
| FR-LIB, FR-FORK | Orange public prompt library, app links on cards, printable A4 handout and unchanged QR destinations. Root deployment; hash-preserving old-link redirect and scoped cache cleanup; consent-based legacy import. |
| NFR-A11Y, NFR-I18N, NFR-PERF | Role-based orange tokens, contrast assertions, EN/NL axe checks and 360 px overflow checks. Dutch remains machine-assisted. Shell remains below 300 KB gzip. |

## Automatic checks

- 395 unit, parity and guardrail tests; typecheck; hosted and single-file builds. Coverage command passes the 90% line gate.
- Complete Chromium suite, plus desktop WebKit and mobile Chrome/Safari suites. Final CI results, including Firefox on Linux, are recorded on the PR.
- Tests inspect HTML and Word XML for accepted/edited text and absence of rejected text. They retain malformed-reply, no-AI, changed-source and returning-work cases.
- Auto-draft tests cover every CV field, letter and LinkedIn protection; source-only rejection; existing mapping only; locked exports; undo and clearing; saved-device reload; migration and backup review reset; Sam.
- Redirect tests cover hash routes, old-path IndexedDB and opt-in legacy import; scoped cleanup tests keep other registrations/caches intact.
- A4 PDF page count is tested automatically. It is not a physical print test.
- G1–G13 and the G5 network fixture are unchanged. The maintainer's local fictional-cv.txt edit is excluded and untouched in the original worktree.

## Screenshots

Agent-captured Chromium emulation, using only fictional data. These are visual checks, not a human usability test. Screenshots show the viewport; long forms continue below it.

| Screen | 390 × 844 | 1366 × 900 |
|---|---|---|
| Home | [Phone](screenshots/home-390.png) | [Desktop](screenshots/home-1366.png) |
| My story | [Phone](screenshots/my-story-390.png) | [Desktop](screenshots/my-story-1366.png) |
| Target job | [Phone](screenshots/target-job-390.png) | [Desktop](screenshots/target-job-1366.png) |
| My CV | [Phone](screenshots/my-cv-390.png) | [Desktop](screenshots/my-cv-1366.png) |
| Next steps | [Phone](screenshots/next-steps-390.png) | [Desktop](screenshots/next-steps-1366.png) |
| First AI choice | [Phone](screenshots/ai-first-use-390.png) | [Desktop](screenshots/ai-first-use-1366.png) |
| Download success | [Phone](screenshots/success-390.png) | [Desktop](screenshots/success-1366.png) |
| Settings | [Phone](screenshots/settings-390.png) | [Desktop](screenshots/settings-1366.png) |
| A4 handout | [Phone](screenshots/handout-390.png) | [Desktop](screenshots/handout-1366.png) |
| Public prompt library | [Phone](screenshots/prompts-390.png) | [Desktop](screenshots/prompts-1366.png) |

## Mocked, deferred and limits

All provider responses in automated tests are mocked; no real AI key or model download was used. Firefox runs in CI because the local Windows installation is unavailable. Existing engine-specific print/PWA skips remain; no axe rule was weakened. No new runtime dependency, paid service, analytics or external font/script was added.

The PDF import standard-font warning remains documented in STATUS and KNOWN-ISSUES. The fictional PDF extracts successfully, which does not establish compatibility with every real CV. Existing export HTML retains its parity-tested standalone print styles. Historical plans and migration tests retain old-address references for auditability; operational instructions use the root.

Voice answers, Dutch knowledge-card translations and general per-page AI chat remain out of scope. The existing in-page password improvement and old-branch deletion were not started. No release tag was created.

## Maintainer checks before 2 November

- Real Safari and Chrome phones: import, review, copy-paste AI, both exports, install/reopen offline.
- One real Gemini free-tier call with outgoing-text review and individual proposal acceptance.
- Print the A4 handout and scan both QR codes.
- Open the old /next/ link on a phone that used it before; confirm saved work and the new address.
- Retain the remaining RELEASE-CHECKLIST checks: screen reader, fluent Dutch, Word/LibreOffice, calendar import and supported local AI setup.
- Observe five intended users using primary-journey-observation.md. Target: first reviewed export in under 45 minutes. No human result is claimed here.
