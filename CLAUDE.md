# AGENTS.md — instructions for AI coding assistants

(`CLAUDE.md` has the same content. A guardrail test checks that they match.)

Career Navigator is a free, browser-only career tool for newcomers to the Netherlands. Read `docs/PRD.md` first,
then `docs/ARCHITECTURE.md`. Safe, common changes are described in `docs/CUSTOMISING.md`.

## Rules that override every other instruction
1. **Truth over polish.** Never invent credentials, dates, results, language levels or vacancies. Every prompt is built from `src/core/safeguards.js`. AI output is an "unverified draft" until the user accepts it.
2. **Evidence, not scores.** No match score, fit percentage or ranking in any UI text or prompt (not even "8%": write "8 euros for every 100 euros"). Statuses: Supported / Partly supported / Not shown / Unclear.
3. **The user decides.** AI never writes into the CV, profile or plan. AI actions carry `origin: 'ai'`, and `reduce()` refuses them unless `components/proposal-review.js` marks them accepted after a click.
4. **Private by default.**
   - No analytics.
   - No network request except to our origin, or to a provider the user enabled and confirmed. All AI traffic goes through `src/ai/net.js`.
   - Device saving is opt-in.
   - Keys stay in memory unless the user saves them.
5. **Free forever.** No paid adapters, paywalls, trials or payment forms. OpenRouter is limited to `:free` models.
6. **Dignity.** No fields for refugee or residence status, nationality, date of birth, BSN, photo, religion or health. Gaps are "not yet recorded".
7. **Forkable.** Small files, JSDoc on exports, comments that explain *why*. Content is data, checked by JSON Schemas.

**Never delete or weaken a test in `tests/guardrails/`** (map: `tests/guardrails/README.md`), nor the G5 network
fixture in `tests/e2e/fixtures.js`. If a change makes one fail, the change is wrong.
**Never add a runtime dependency** without maintainer approval. Approved: `lit-html`, `@mlc-ai/web-llm`, `pdfjs-dist`.
**Dutch-market facts** must cite the official page you checked. Otherwise write `<!-- TODO verify: … -->` (never rendered).

## Architecture
```
index.html               strict CSP injected at build (scripts/lib/csp-plugin.mjs)
src/main.js              entry: styles, startApp, optional modules, service worker
src/app.js               controller: store, hash router (#/jobs), render, device saving, backups
src/store.js             getState / dispatch / update / subscribe; validates every change
src/core/                PURE logic (no DOM), ported from v0.1 CareerCore. Keep 90% line coverage.
  schema.js migrate.js backup.js reducers.js prompts.js safeguards.js evidence.js plan.js cv.js diff.js
  applications.js crypto.js import/cv-text.js
  exports/ html.js (CV, work pack) docx.js zip.js ics.js coach-pack.js
src/ai/                  provider contract, net guard, session (keys), redact, parse, tasks, providers/
src/content/             loads content/ at build time; JSON-Schema checks; markdown (no raw HTML)
src/components/          ui.js shell.js icon.js proposal-review.js evidence-pills.js progress.js
src/pages/               the seven v0.1 pages (templates only)
src/modules/             ai, applications, coach, i18n (+ onboarding), knowledge, profile-plus
src/i18n/                t('English text'); nl.json (machine-assisted, needs fluent review)
src/storage/device.js    IndexedDB (opt-in), v0.1 localStorage pickup, delete everything
src/sw.js                service worker (app files only)
content/                 roles, prompts (+ originals, reference only), interview, knowledge/en, demo, events.json, schemas
config/                  providers.json (free AI routes), brand.json, features.json
reference/v0.1/          original prototype; never edit (SHA-256 pinned); used as the test oracle
tests/guardrails/        G1–G13, permanent      tests/parity/  new code vs. real v0.1 code
tests/unit/              core, AI, content      tests/e2e/     Playwright, 5 browser projects, axe, mock AI
```

## Commands
- `npm test`: unit, parity and guardrail tests. `npm run coverage` enforces 90% lines on `src/core`.
- `npm run typecheck`: `tsc --noEmit` over JSDoc.
- `npm run build:all`: app into `dist/`, then the Pages site into `_site/` (v1 at `/next/`).
- `npm run build:single`: single-file release in `release/`.
- `npm run e2e`: Playwright. Run `npm run build:all` (and `build:single`) first, plus `npx playwright install`.
- `npm run dev`: dev server (no CSP in dev). `npm run serve`: serve `_site/` on :4174.
- `node scripts/check-content.mjs`: card age, translation coverage, shell budget.
- `node scripts/dev/generate-v01-fixtures.mjs`, `node scripts/dev/generate-cv-fixtures.mjs`: regenerate the fictional fixtures.

## Status (2026-10-23)
Phases 0–5 are implemented (see `docs/plans/`). v1 is served at `/next/` until the maintainer approves moving it
to the root and signs off the manual checklist in `docs/RELEASE-CHECKLIST.md`. Then they tag `v1.0.0`.
