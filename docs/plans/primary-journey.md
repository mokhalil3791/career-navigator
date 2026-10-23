# Primary CV journey

Status: approved by Mo on 2026-10-24; PR A implemented on `primary-journey`, local checks passed; awaiting PR CI. PRs B and C wait for A to be merged by Mo.
Plan date: 2026-10-24; walkthrough performed 2026-10-23 (Europe/Amsterdam).
Branch: `primary-journey`, created from `main` at `e2f4929`.

## Outcome and scope

Make this the obvious first route through the existing workspace:

**Import CV → verify facts → add one advert → review a tailored draft → export HTML and Word.**

This is a reorganisation of existing capabilities, not another feature phase. Other tools remain reachable. No dependency, provider, hosting, schema migration, release tag, root deployment, or GitHub setting change is proposed. No work on KNOWN-ISSUES section 2 or old branch deletion. Manual release checks remain the maintainer's responsibility.

Read before planning: AGENTS.md including Handoff, the full PRD including implementation decisions, STATUS.md, KNOWN-ISSUES.md, RELEASE-CHECKLIST.md, and ARCHITECTURE.md. STATUS.md still describes PR #7 as stacked; correct that historical opening when updating status after implementation.

## Walkthrough evidence: live preview

Agent-operated Chromium, fresh browser session, **360 × 732 CSS pixels**, at https://mokhalil3791.github.io/career-navigator/next/. This is browser emulation, not a real-phone or human usability verification.

I completed onboarding with English, Start my own, and the default copy-paste route. I imported `tests/fixtures/cv/fictional-cv.pdf` (Yara Example), inspected extracted text, opened Suggest structured fields, pasted a fictional JSON response based on that PDF, and accepted each proposed field. I then added a fictional logistics advert, navigated to My application, explicitly copied the profile into the CV, pasted a tailoring response, accepted the summary change, checked the final review box, and downloaded `my-career-cv.html` and `my-career-cv.docx`.

No external AI was called or opened. The responses were prepared examples, not recorded output from a real provider. Requirement extraction was not needed for this walkthrough. The downloads completed; Word/LibreOffice rendering was not checked. The browser reported no console errors and one warning during PDF import. No release-checklist item was marked complete.

Local diagnostic snapshots, a viewport screenshot, and the downloaded fictional files are kept under `test-results/primary-journey-review/` (ignored, not a committed fixture or test report).

PDF warning investigation (2026-10-24): the saved console log says exactly: `Warning: UnknownErrorException: Ensure that the standardFontDataUrl API parameter is provided.` (The parameter name is enclosed in backticks in the original log.) The importer sets `disableFontFace: true` and `useSystemFonts: false`, but supplies no `standardFontDataUrl`. The installed pdf.js source requests standard font data through that parameter. This identifies a missing font-data configuration, not proof of a harmless warning for all PDFs. The fictional PDF's expected text was extracted in this walkthrough; other PDFs remain unverified. In PR A, reproduce and compare extracted text with the fixture, document the result, and assess any correction against hosted, offline and single-file imports. Do not suppress console warnings or add remote font requests. If a fix needs packaging changes beyond the small profile PR, report that scope separately before implementing it.

| Observed friction | Consequence | Proposed response |
| --- | --- | --- |
| Welcome appears alongside the full home hero, progress list, four broad journey cards, and prompt-studio promotion. Mobile navigation offers ten sections equally. | Several competing starting points before importing anything. | One dominant CV route; secondary workspace tools stay available through More tools. Keep required welcome/privacy choices. |
| On the empty profile, file import begins about **3,067 px** down the document, after manual fields, target roles, preferences, and duplicate education/language editors. | Users can reasonably start retyping before discovering import. | Put file import and paste-source options first; keep manual entry explicit. |
| Import adds source text only, correctly; there is no compact source → verify → continue sequence. | The distinction between source text and usable profile facts requires reading scattered explanations. | A source card followed by the fact editor and one clear next action. |
| Every task panel begins with five AI-route choices, even after copy-paste was chosen in onboarding. | Provider setup distracts from the current task. | Show current route and a Change AI route disclosure; keep exact prompt and redaction visible. |
| Free-text education/languages and structured rows are all presented as ordinary inputs. | It is unclear whether both must be filled. | One default editor per subject, optional structured detail below it; see decision below. |
| Jobs starts with comparison terminology, two add-advert actions, list/reordering controls, requirement analysis and notes. | The simplest task—paste one advert and continue—competes with comparison work. | Lead with the first advert's essential fields and a clear next action; disclose optional evidence/comparison tools. |
| The application has both Tailor to selected advert and Tailor with AI, plus a separate Copy my profile into CV action. | The order and difference between the two AI routes are not clear. | Make an explicit draft-from-profile action followed by one primary tailoring action; retain the generic prompt under other options. |
| Final review checkbox starts about **3,239 px** down the application document, below optional letter and LinkedIn sections. | Optional work interrupts the path to export. | CV editor → review → clearly labelled HTML and Word exports; optional writing afterwards. |
| After accepting proposals, the user must Close the panel before continuing; no task-specific continuation is shown. | The next action is easy to miss. | Add an explicit return-to-profile/draft action and focus the relevant section. |

Coordinates are observations for this viewport and fictional content, not fixed layout requirements. The export area was readable in the inspected screenshot; the main problem is ordering and discoverability.

## Proposed experience

### 1. Start and navigation

- Preserve the three required welcome steps and privacy notice before data entry. Do not repeat the full home dashboard underneath unfinished onboarding; keep a proper page heading and access to the wider workspace.
- After Start my own with copy-paste selected, open the import section of My profile. No AI/key setup detour. No-AI and built-in choices remain available.
- Home leads with Build my CV / Continue my CV and a concise five-step outline. Use neutral labels such as Facts recorded and Needs your review. Never call populated fields verified automatically.
- Primary navigation: Overview, My profile, Compare jobs, My application, **AI prompt studio**. Interview practice, My 90-day plan, Applications, Learn and Coach view remain under a labelled More tools disclosure on desktop; on mobile retain the native section selector with primary and More tools groups. Name AI prompt studio and the 90-day plan in the welcome as workshop tools, with the plan's location explained. Preserve route IDs and direct links, including coach view.
- Retain the broader progress overview below the CV journey in a secondary workspace section, so plans and applications remain available without competing with the first action.
- Use explicit next/back links between existing sections, not a new mandatory wizard. No persisted progress flag is needed. Returning users retain access to every step; existing data is never cleared on entering the journey.

### 2. Import and verify facts

- First profile card: Import my CV (PDF/Word/text), paste text alternative, and Enter facts myself. Keep local-only import explanation and sensitive-data guidance nearby.
- After import, show the extracted source with a reminder to check it. Import must still change only `profile.cvText`.
- Offer Review facts with AI (existing suggest-fields task) and manual entry. AI is optional; no automatic extraction into profile fields and no bulk acceptance.
- Keep source text reachable while reviewing proposed changes on a narrow screen. Show accepted edits in the profile, and make rejected suggestions leave it unchanged.
- Group core profile fields together. Put travel, target roles and work preferences in optional sections; expand sections containing existing values so data is not hidden unexpectedly.
- End with **Next: add a job advert**. This is navigation only: it records no fact-checking attestation. Explain missing core content without requiring dates, credentials, a name, or language levels that the user cannot provide. The actual review gate remains at export.
- Show a short session-only reminder before switching to another AI app, with the existing backup action. Saving stays opt-in; do not introduce another storage mode.

### Decision: education and language inputs

**Keep free text as the default editor; keep structured rows as optional detail within the same subject.**

Rationale: imported CVs, suggest-fields replies and v0.1 backups already use text. Automatically converting prose to structured rows would need inference and risk losing qualifications, dates or level-assessment details. Removing rows would break FR-PRO-4/5 and existing work.

- Show Education & training and Languages text fields in the main fact editor.
- Place Add education details / Add language levels directly underneath the matching subject in a disclosure. Explain that users need not repeat facts already written above.
- If rows already exist, open that subject's disclosure and show its row count. Keep row edit/remove actions and certification/original-title details intact.
- Retain the existing profile-to-CV mapping: text first, then rows not already represented by the current exact formatted-line check. Do not describe this as semantic deduplication.
- If both representations exist, show a neutral reminder to check the combined CV for repeated or conflicting wording. Never silently prefer one conflicting language level or delete original text.
- No automatic merging, destructive conversion, schema change, or new AI task. The final CV editor is where users resolve remaining repetition. Regression coverage must retain text-only v0.1 behavior and row-only/both-format behavior.

### 3. One advert

- On an empty jobs page, one dominant Add my first advert action. Then show title, employer, optional source URL and advert text together.
- Put **Continue to my CV draft** immediately after the advert inputs. Advert text is needed for tailoring; show a clear explanation if it is missing. A general CV remains possible without an advert.
- Show a visible optional **Check this advert's requirements** link beside the continuation action, leading to evidence review on this page, not buried under More tools. Keep extraction, facts, decisions, additional adverts and comparison in labelled secondary sections. Do not mark evidence Supported automatically or force extraction before tailoring.
- Trade-off: the fast path lets someone prepare a first CV without a requirement-by-requirement evidence review. It therefore supplies less explicit evidence analysis, not equivalent assurance. Keep the optional link and a short explanation visible; skipping it never produces Supported statuses or implies suitability. All tailoring safeguards and final claim review still apply.
- Existing multi-advert workspaces retain visible target selection; never silently switch the selected target or add a second blank advert when returning.

### 4. Draft, tailor, review

- If the CV is empty, prominently offer **Create draft from my profile**, using the existing user-triggered reducer. Never auto-copy on navigation or imply a prior verification. Preserve replacement confirmation for an existing draft and keep the letter intact.
- Show the selected advert and application language beside one primary **Tailor this draft** action using the structured task. Keep manual editing and other prompt tools available.
- Default task panel presentation follows the selected route. Provider choices sit behind Change AI route; built-in confirmation and exact outgoing text are preserved.
- Copy-paste panel uses numbered instructions: inspect/copy prompt, paste into chosen chat, paste reply back, review changes. Invalid replies leave the workspace unchanged and remain labelled unverified drafts.
- Keep individual accept/edit/reject and visible diffs. Add an explicit return to the draft; do not silently apply or discard pending proposals. The final checkbox still requires the user's own review regardless of proposal decisions.
- Move optional motivation letter and LinkedIn sections after the main review/export flow into disclosures. When a letter exists, show it before the final review or provide an expanded review section: do not ask users to certify hidden letter claims that the combined export includes.

### 5. Export

- Place the review checklist directly after CV content (and any existing letter). Keep both formats disabled until the existing review gate is satisfied.
- Label actions **Download HTML** and **Download Word (DOCX)**, with a brief explanation that HTML opens in a browser for printing/PDF. Do not claim a PDF download exists.
- Keep preview reachable before the checkbox. Edits to profile, advert or CV must invalidate review exactly as before.
- After download, offer the existing backup and optional next tools without treating a download event as proof that the file was opened or used successfully.

## Delivery: three small, sequential PRs

This replaces the earlier single-PR proposal at Mo's request. Each task gets one branch from current main and one PR into main. **No stacking:** after each PR's CI is green, stop for Mo to merge; only then branch from updated main for the next task. Do not merge PRs. Each PR must be useful and testable on its own and independently revertible.

| PR | Scope and primary files | Its own acceptance tests |
| --- | --- | --- |
| A: Import-first profile | `src/pages/profile.js`, `src/modules/profile-plus/index.js`; minimal styles; `nl.json`; `docs/STATUS.md`; investigate recorded PDF warning. | New `tests/e2e/profile-journey.spec.js`: import-first placement, PDF source only, manual alternative, text/rows preserved and populated disclosures open, plain next-step navigation. Run on Chromium and both mobile projects. Retain/add focused mapping unit cases as needed. |
| B: Advert to reviewed export | `src/pages/jobs.js`, `src/pages/cv.js`; export button label in profile-plus if needed; minimal styles; `nl.json`; STATUS. Keep current AI panel presentation. | New `tests/e2e/cv-journey.spec.js`: one advert and visible evidence-review link; explicit draft creation; pasted tailoring accepted/edited/rejected; review relocks both formats; inspect HTML and DOCX contents; existing letter visible for review; returning draft not overwritten. Run on Chromium and both mobile projects. |
| C: Entry points and AI presentation | `src/pages/home.js`, `src/components/progress.js`, `src/components/shell.js`, `src/modules/i18n/index.js`, AI panel/connect/index; minimal styles; `nl.json`; STATUS. | Navigation and welcome tests keep studio visible and all other tools discoverable, including the workshop plan. Add full `tests/e2e/primary-journey.spec.js` below on Chromium, mobile-chrome and mobile-safari; malformed reply and no-AI coverage. |

Shared helper changes are limited to what each PR needs, not an advance refactor. Avoid changing proposal-review if continuation can be implemented by its caller. Update STATUS in each PR with actual checks and pending human verification. New Dutch strings accompany each PR. If any slice grows substantially, narrow it before coding rather than moving unfinished behavior into main.

## Overall file map (not a single PR)

| Files | Purpose |
| --- | --- |
| `src/pages/home.js`, `src/components/progress.js` | Primary route, secondary workspace overview. |
| `src/components/shell.js`, `src/modules/i18n/index.js` | Navigation grouping and welcome presentation. |
| `src/pages/profile.js`, `src/modules/profile-plus/index.js` | Import-first layout, optional fields, education/language grouping. |
| `src/pages/jobs.js`, `src/pages/cv.js` | First-advert path, draft creation order, review/export placement. |
| `src/modules/ai/panel.js`, `connect.js`, `index.js` in the same directory | Current-route disclosure, task instructions and return actions. |
| `src/components/proposal-review.js` only if necessary | Preserve per-proposal decisions while exposing completion/return context. No acceptance bypass. |
| `src/components/ui.js`, `src/styles/app.css`, `src/styles/layout.css` as needed | Reusable section navigation, responsive ordering and focus styles. |
| `src/i18n/nl.json` | Matching Dutch strings; retain machine-assisted status. |
| `tests/e2e/primary-journey.spec.js` (new), relevant existing non-guardrail specs | Full journey and navigation/layout regression coverage. |
| `tests/unit/review-fixes.test.js` if mapping cases need expansion | Preserve text/rows combinations, without weakening assertions. |
| `docs/STATUS.md`, this plan | Record actual implementation and test results after approval. |

No anticipated changes to core schemas, reducers, exporters, provider APIs, reference/v0.1, deployment scripts, guardrail tests or G5 fixture. Keep AGENTS.md and CLAUDE.md unchanged and identical. If implementation reveals a need to broaden scope, explain it before proceeding.

## Tests and acceptance

Add one continuous E2E journey using the shared fixtures (including G5), executed on **mobile-chrome and mobile-safari**, and also Chromium:

1. Fresh workspace → welcome → own CV → copy-paste. Reach visible import without completing optional fields or entering provider settings.
2. Import fictional PDF through the file input; confirm source text exists and profile fields remain untouched.
3. Inspect outgoing prompt; paste fixture reply; confirm nothing changes until acceptance. Edit one suggestion, accept it, reject another, and verify resulting facts. No real chat/provider navigation or calls.
4. Use the visible next action to add one fictional advert. Assert exactly one advert and correct selected target. Proceed to CV using UI controls, not injected application state or direct hash shortcuts.
5. Explicitly create the draft from facts. Confirm recorded education/languages reach it. Open structured tailoring, paste a sample reply, verify unchanged draft before acceptance, then accept/edit/reject and inspect the resulting draft.
6. Verify both exports are locked before final review. Check review, make a material edit, verify both relock, then review again.
7. Download both HTML and Word. Inspect HTML text and DOCX `word/document.xml` for accepted content and absence of rejected content; a download event alone is insufficient.

Additional focused checks:
- No-AI manual path, paste-only path, malformed reply recovery, returning user with existing CV, and no silent overwrite when revisiting a step.
- Existing text-only, rows-only and both-format education/language data survive UI navigation and backup round trip; populated optional sections remain discoverable.
- All existing destinations remain reachable on narrow and wide layouts. Test keyboard disclosure operation, focus after step transitions, no horizontal overflow at 360 px, and labelled 44 px touch targets for new controls.
- Existing English/Dutch axe suites remain intact. Apply the same checks to new expanded/collapsed journey states; do not exclude any axe rule or element to hide the documented WebKit flake.
- Optional modules disabled via feature flags still leave a usable manual CV path; no links to unavailable services.

Before every commit and push run the required sequence successfully:

```text
npm test
npm run typecheck
npm run build:all
npx playwright test --project=chromium
```

Also run each slice's tests on mobile-chrome and mobile-safari, relevant existing mobile suites, and content/translation checks. Build the single-file artifact when required by existing Chromium tests. Diagnose failures; report the known WebKit issue honestly without weakening tests. Open each PR into main in the sequence above, wait for CI, report its result, and leave merging to Mo.

## How we will know it worked

Automated acceptance establishes behavior, not usability:
- At 360 × 732 after onboarding, the import control is in the first profile card and visible in the initial viewport without scrolling; no optional profile fields precede it.
- On the CV page, review/export follows CV content and any existing letter, before empty optional letter and LinkedIn sections. Do not target an absolute review Y-coordinate: a long CV must remain fully reviewable.
- The continuous journey uses visible UI actions, no provider setup, no route shortcuts, and produces both exports containing accepted edits. Every safety assertion remains in place.
- AI prompt studio stays in primary navigation; the advert evidence link is visible without opening More tools; the 90-day plan remains reachable through labelled navigation.

Human success criteria (proposed, measured with five intended users after PR C):
- PRD target: **first reviewed CV export in under 45 minutes**. Record each user's time from opening the fresh preview through reading/checking claims and completing their first HTML or Word download. Record both-format completion separately. Include AI waiting and switching time in total elapsed time, and note it separately.
- Pilot pass criterion: at least four of five complete that first reviewed export under 45 minutes without facilitator navigation hints. Report every result, not only the median; five users cannot establish population-wide success.
- All five are invited to produce and locate both formats, explain that AI text needs their review, and find the optional evidence link, prompt studio and 90-day plan. Record assistance and failures rather than silently redefining completion.
- Any observed silent data loss, unaccepted AI change, bypassed review gate, or unintended disclosure blocks rollout regardless of speed. A comprehension failure requires design review and a repeat check.
- Use the same task script and fixture for a before/after comparison if a baseline cohort is available. The original agent's pixel measurements are not a human timing baseline. With only a post-change cohort, report target attainment, not a proven time improvement.

Use [the one-page observation script](primary-journey-observation.md). No analytics are added, no participant CV or AI transcript is committed, and no release-checklist item is ticked by the agent.

## Risks and boundaries

- Hiding optional fields can hide existing work: expand populated sections and retain clear labels/counts.
- A progress indicator can imply verified truth: derive only recorded-state hints and reserve Reviewed by you for explicit user review. Do not persist an inferred verification state.
- Changing target/profile while reviewing old proposals can make a diff stale: keep task target explicit, close/invalidate stale panels when moving between journey contexts, and cover navigation without applying pending proposals.
- Multiple formats can still contain semantic duplicates: preserve all source data, explain the combined output, and let the user correct the CV. Smarter deduplication is outside this task.
- Mobile app switching may discard a session-only tab: make the existing backup choice visible without silently enabling saving.
- Moving optional letter content must not hide text included in the reviewed export.
- Navigation/labels can break tests or screen-reader flow: update only relevant non-guardrail expectations, retain routes and keyboard access, and test both languages.
- Real chat output, clipboard/share behavior, mobile file pickers, Word rendering, and actual usability remain unverified until person-led checks. This agent walkthrough does not replace the release checklist or five-user observation.

## Approval checkpoint

Mo approved the revised three-PR sequence and success criteria on 2026-10-24. PR A covers the profile slice only. Subsequent branches start from updated main after Mo merges the preceding PR.

## PR A implementation record

- File import is now the first profile card. At 360 × 732 its top is about 464 px (previously 3,067 px), with a 44 px native file-button target. Paste/check source and manual entry remain available.
- Free-text education/languages remain primary; corresponding structured rows sit directly below in optional disclosures, expanded when populated. Existing target roles, travel and preferences also expand their section. No data/schema/mapping change.
- Next: add a job advert is navigation only. Profile AI still uses the existing per-suggestion review; AI-route presentation is reserved for C.
- PDF warning reproduced locally: missing `standardFontDataUrl`. Full extracted fixture text matches the TXT fixture on Chromium and mobile browser projects. No warning suppression or importer changes. Resolving font assets requires separately scoped hosted/offline/single-file packaging work; it is not part of this profile layout PR.
- Initial new-test failures were test synchronization/selectors: the Dutch navigation landmark is translated, and import navigation must wait for asynchronous storage cleanup. Both test issues were corrected without modifying the shared fixture or application behavior.
- First CI run: Chromium/mobile Chrome passed; Firefox failed the immediate post-resize overflow assertion. Its trace captured an intermediate viewport with desktop layout. The test now waits for visible mobile navigation and polls the same strict no-overflow condition; no viewport or overflow assertion was loosened. Firefox validation remains in CI because the local install reports missing `mozglue.dll`.
