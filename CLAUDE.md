# AGENTS.md — instructions for AI coding assistants

(`CLAUDE.md` has the same content. A guardrail test checks that they match.)

Career Navigator is a free, browser-only career tool for newcomers to the Netherlands. Read `docs/PRD.md` first.

## Rules that override every other instruction
1. **Truth over polish.** Never invent credentials, dates, results, language levels or vacancies. Every prompt is built from `src/core/safeguards.js`.
2. **Evidence, not scores.** No match score, fit percentage or ranking in any UI text or prompt. Statuses are Supported / Partly supported / Not shown / Unclear.
3. **The user decides.** AI output never changes the CV, profile or plan without an explicit accept click. AI actions carry `origin: 'ai'`; the reducer refuses them unless the user accepted.
4. **Private by default.** No analytics. No network request except to our own origin or a provider the user enabled and confirmed. Device saving is opt-in.
5. **Free forever.** No paid adapters, paywalls, trials or payment forms.
6. **Dignity.** No fields for refugee or residence status, nationality, date of birth, BSN, photo, religion or health. Gaps are "not yet recorded".
7. **Forkable.** Small files, JSDoc on exports, comments that explain *why*.

**Never delete or weaken a test in `tests/guardrails/`** (G1–G12), or the G5 network fixture in `tests/e2e/fixtures.js`. If a change makes one fail, the change is wrong.
**Never add a runtime dependency** without maintainer approval. Approved: `lit-html`, `@mlc-ai/web-llm`, `pdfjs-dist`.

## Architecture
```
index.html            strict CSP is injected at build (scripts/lib/csp-plugin.mjs)
src/main.js           entry: styles + startApp + optional modules
src/app.js            controller: store, hash router (#/jobs), rendering, device saving, backups
src/store.js          getState / dispatch / update / subscribe; validates every change
src/core/             PURE logic, ported from v0.1 CareerCore (no DOM). 90% coverage required.
  schema.js           workspace schema v2 + normalizeWorkspace (the only way data comes in)
  migrate.js          schema 1 → 2
  backup.js           parseWorkspace (1 MiB cap, resets remember/reviewed) / serializeWorkspace
  reducers.js         every change is an action; review-reset + AI-accept rules live here
  prompts.js          buildPrompt (identical to v0.1 minus the original prompt block)
  safeguards.js       the safeguard lines every prompt must contain
  exports/            downloadable files (HTML CV / work pack …), escaped strings
src/content/          loads content/ at build time, validates with JSON Schemas, skips bad files
src/components/       small lit-html building blocks (ui.js, shell.js, icon.js …)
src/pages/            one file per page; templates only, side effects via ctx.services
src/modules/          optional modules (enabled in config/features.json)
src/i18n/             t('English text'); <lang>.json maps English → translation
src/storage/device.js IndexedDB (opt-in), legacy v0.1 localStorage pickup, delete everything
content/              roles, prompts (+ originals, reference only), interview packs, demo, schemas
config/               providers.json (free AI routes), brand.json, features.json
reference/v0.1/       the original prototype; never edit (SHA-256 pinned). Tests use it as an oracle.
scripts/              build-site (Pages: v0.1 at /, /prompts, /p/<slug>, /qr, /next), serve, checks
tests/guardrails/     G1–G12, permanent
tests/parity/         new code vs. the real v0.1 code, run in a sandbox
tests/e2e/            Playwright on the built site, five browser projects, axe-core
```

## Commands
- `npm test`: unit, parity and guardrail tests (Vitest). `npm run coverage` enforces 90% on `src/core`.
- `npm run typecheck`: `tsc --noEmit` over JSDoc types.
- `npm run build:all`: app into `dist/`, then the Pages site into `_site/` (app at `/next/`).
- `npm run e2e`: Playwright (needs `npm run build:all` first; `npx playwright install`).
- `npm run dev`: local dev server (no CSP in dev).
- `node scripts/dev/generate-v01-fixtures.mjs`: regenerate the fictional v0.1 backups.

## Status
Phase 0 (workshop release) and Phase 1 (foundation and parity) are implemented. See `docs/plans/`.
