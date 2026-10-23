# Contributing

Thank you for helping newcomers find work in the Netherlands. Every contribution must keep the tool **free,
truthful and private**.

## Ways to help
- **Report a wrong fact** (Learn page → "Report a wrong fact", or the issue template). Link the official page.
- **Review the Dutch translation** in `src/i18n/nl.json`. Remove `"machineTranslated": true` from `_meta` once a fluent speaker has reviewed it.
- **Add content:** roles, prompts, interview packs or events. See [docs/CUSTOMISING.md](docs/CUSTOMISING.md).
- **Code:** read [AGENTS.md](AGENTS.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) first.

## Rules
1. Never delete or weaken a test in `tests/guardrails/`.
2. No new runtime dependency without maintainer approval. No paid services, analytics, trackers or remote fonts and scripts.
3. Any Dutch-market fact cites the official page you checked. If you cannot check it, write `<!-- TODO verify: … -->`.
4. Keep files small, with JSDoc on exports and comments that explain *why*.
5. Never put real personal data in issues, tests or fixtures. Use clearly fictional examples.

## Checks before a pull request
```
npm test && npm run typecheck && npm run build:all && npx playwright test --project=chromium
```
Reference requirement IDs (e.g. `FR-JOB-3`) in your pull request description.
