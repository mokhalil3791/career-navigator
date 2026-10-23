# Phase 5 plan — Hardening and v1.0

Written 2026-10-23, under the maintainer's run rules.

**Gate (PRD):** all MUSTs green; manual checklist signed off; tag v1.0.0.
**The tag is the maintainer's step:** it needs the manual checklist (`docs/RELEASE-CHECKLIST.md`), so it is not done automatically.

## Tasks
1. **PWA offline:** a hand-written service worker (`src/sw.js`, no Workbox). The precache list is generated at build time. It caches app files only, never user data, and "Delete everything" removes the caches. A manifest and icon make it installable.
2. **Single-file release** (`npm run build:single`): one HTML file with everything except WebLLM, for USB sticks. CSP by SHA-256 hashes, and the pdf.js worker runs from a blob URL. `.github/workflows/release.yml` attaches it to a GitHub Release when a `v*` tag is pushed.
3. **Performance budget:** CI fails above 300 KB gzipped for the shell (currently about 113 KB). Lazy files: WebLLM library and pdf.js.
4. **Accessibility:** axe on every page, English and Dutch, desktop and phones, run with reduced motion to avoid false contrast readings.
5. **Docs:** `CUSTOMISING.md` (7 worked examples, FR-FORK-1), `DEPLOY.md` (no command line, FR-FORK-3), `ARCHITECTURE.md`, `CONTRIBUTING.md`, `starter-prompts/` (FR-FORK-4), the guardrail map, `RELEASE-CHECKLIST.md`, and the README, AGENTS and CLAUDE updates.
6. **Template repository** setting switched on (FR-FORK-3).
7. **PRD updated** with the implementation record and every decision.
8. **Tests:** E2E journey 5 (manifest, service worker, offline reload, phone viewport), a service-worker scope test (same-origin app files only), the single-file build opened from `file://` with the strict CSP, and CV import unit tests.
