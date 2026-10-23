# Architecture

A static, client-only web app: plain ES modules with JSDoc types, `lit-html` for safe templates, and Vite at
build time only. There is no server and no account. The only traffic that leaves the device is an AI call the user
has previewed and confirmed, or a model download the user started.

```
 Browser
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ Pages (src/pages, src/modules)  ── templates only, via ctx ──┐           │
 │      │ dispatch(action)                                       │ render    │
 │ Store (src/store.js) ── validates every change ──> reducers (src/core)   │
 │      │ opt-in                                                 ▲           │
 │ Device storage (IndexedDB)            Pure core: schema, migrate, backup, │
 │                                       prompts + safeguards, evidence,     │
 │                                       exports (HTML, DOCX, ICS, coach)    │
 │ AI panel ─ exact text + redaction + confirm ─> src/ai/net.js (allow-list)│
 └──────────────────────────────────────────────┬───────────────────────────┘
                                                │ only after "Send"
            Gemini (free key) · OpenRouter (:free) · Ollama (localhost) · WebLLM (on device)
```

## Principles in code
| Principle | Where it lives | Test |
| --- | --- | --- |
| 1 Truth over polish | `src/core/safeguards.js`, `buildPrompt`, `src/ai/tasks.js` (evidence quotes verified) | G2, G13, `ai-tasks.test.js` |
| 2 Evidence, not scores | evidence statuses, prompt text | G1 |
| 3 The user decides | `reduce()` refuses AI actions unless accepted; `components/proposal-review.js` | G4, G3 |
| 4 Private by default | opt-in IndexedDB, CSP `connect-src`, `src/ai/net.js`, redaction | G5 (every E2E test), G6, G7, G11 |
| 5 Free forever | `config/providers.json` free-only, OpenRouter `:free` only | G8 |
| 6 Dignity | schema has no status or identity fields | G9 |
| 7 Forkable | content as data + JSON Schemas, modules, `docs/CUSTOMISING.md` | G12, schema tests |

## Data flow
- **In:** `normalizeWorkspace(migrate(json))` is the only way outside data enters (backups, device storage, coach packs). Unknown keys are dropped.
- **Change:** `store.dispatch(action)` → `reduce()` (pure) → size and schema check → subscribers (render, device saving).
- **Out:**
  - prompts: `buildPrompt` / `buildTaskPrompt`, both using the safeguard lines
  - files: CV HTML and DOCX (review gate), work pack, coach pack, `.ics`, backup

## Build
- `vite build` → `dist/` with the strict CSP (`scripts/lib/csp-plugin.mjs`) and service worker (`scripts/lib/sw-plugin.mjs`).
- `scripts/build-site.mjs` → `_site/` for Pages: v0.1 at `/`, `/prompts`, `/p/<slug>`, `/qr`, v1 at `/next/`.
- `scripts/build-single.mjs` → one HTML file with CSP hashes (WebLLM excluded) for GitHub Releases.

## Runtime dependencies (approved, fewer than 5)
`lit-html` (templates), `@mlc-ai/web-llm` (lazy, in-browser model), `pdfjs-dist` (lazy, PDF import).
DOCX, ZIP, ICS, Markdown, JSON Schema, frontmatter, redaction and encryption are small in-house modules, so the
dependency count and the attack surface stay small.
