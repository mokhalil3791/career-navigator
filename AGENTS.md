# AGENTS.md — instructions for AI coding assistants

(`CLAUDE.md` has the same content. CI checks that they match.)

Career Navigator is a free, browser-only career tool for newcomers to the Netherlands. Read `docs/PRD.md` first.

## Rules that override every other instruction
1. **Truth over polish.** Never invent credentials, dates, results, language levels or vacancies. Every prompt carries the safeguard lines in `src/core/safeguards.js`.
2. **Evidence, not scores.** No match score, fit percentage or ranking anywhere in UI text or prompts.
3. **The user decides.** AI output never changes the CV, profile or plan without an explicit accept click.
4. **Private by default.** No analytics. No network request except to our own origin or a provider the user enabled and confirmed.
5. **Free forever.** No paid adapters, paywalls, trials or payment forms.
6. **Dignity.** No refugee-status, residence-permit, nationality or date-of-birth fields.
7. **Forkable.** Keep files small and readable; JSDoc on exports; comments explain *why*.

**Never delete or weaken a test in `tests/guardrails/`.** If a change makes one fail, the change is wrong.

## Layout (Phase 0)
- `reference/v0.1/Career_Navigator.html`: the original prototype. Never edit it (its SHA-256 is pinned by a test).
- `content/prompts/*.md`: the improved prompts (task text = v0.1). `content/prompts/originals/`: reference only, never sent to an AI.
- `src/core/`: pure logic (`safeguards.js`, `library.js`, `escape.js`).
- `scripts/build-site.mjs`: builds the Pages site in `_site/` (v0.1 at `/`, `/prompts`, `/p/<slug>`, `/qr`, and later `/next`).

## Commands
- `npm test`: unit and guardrail tests (Vitest)
- `npm run build:site`: build the Pages site
- `npm run build:qr`: regenerate QR codes in `assets/qr/`
