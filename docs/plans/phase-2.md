# Phase 2 plan — Free AI

Written 2026-10-23. The maintainer's run rules apply: short plan, then build; stop only for guardrail conflicts, new runtime dependencies, cost, or weakening a test.
Runtime dependency `@mlc-ai/web-llm` was approved on 2026-10-23 (lazy-loaded, bundled, never from a CDN).

**Gate:** E2E journeys 2 and 3 pass with the mock AI; one real Gemini call is verified manually (maintainer, next week).

## The free-AI solution (maintainer: "come up with a solution to use free AI chats")
Three free routes, one prompt builder, one proposal flow:
1. **Copy-paste with structured round trip (default, works for everyone).** Every AI task (extract requirements, suggest evidence, tailor CV, LinkedIn, plan from gaps, profile fields) can be copied to *any* free chat. The prompt asks the chat to end with one JSON block. The user pastes the whole reply back; the app finds the JSON, checks it against a schema, and shows **proposals** to accept or reject. Phones also get **Share to an AI app**, and short prompts get **Open in Claude/ChatGPT** pre-filled.
2. **Built-in, with the user's own free key:** Gemini free tier (Google AI Studio key) and OpenRouter free models. The browser talks straight to the provider; there is no Career Navigator server.
3. **On-device, nothing leaves the device:** WebLLM (WebGPU, one-time model download, with a **large-download warning** pulled into scope) and Ollama on `localhost`.

## Tasks
1. `src/ai/redact.js`: mask emails, phone numbers, BSN-like numbers, IBANs, street addresses and postcodes, and the name (FR-AI-6).
2. `src/core/diff.js`: word-level diff for the visible before/after review (principle 3, FR-CV-2).
3. `src/ai/parse.js` + `src/ai/schemas/*.json`: find and validate JSON in any reply; retry once, then show raw text as an unverified draft (FR-AI-3).
4. `src/ai/tasks.js` + `content/prompts/*.md` (`library: false`): structured tasks built on the same safeguard lines (FR-AI-7). Their outputs become proposals. **Evidence quotes are checked in code**: a quote not found in the profile becomes "Not shown" (FR-JOB-3).
5. `src/ai/provider.js` (contract and registry, FR-AI-1), `src/ai/net.js` (refuses any host the user did not confirm), `src/ai/stream.js` (SSE and NDJSON readers). Plain-language errors for 401, 429 and network failures (FR-AI-4).
6. Adapters, one file each (FR-AI-9): `copy-paste`, `gemini`, `openrouter`, `ollama`, `webllm`. Model IDs, endpoints and sizes live in `config/providers.json` (FR-AI-2).
7. UI:
   - `ai-run` panel: provider, exact outgoing text, destination host, redact toggle, Send, streaming output and Stop (FR-PS-2, FR-AI-4/6).
   - `proposal-review`: diff with Accept, Edit and Reject per item. This is the only place that may mark an AI action as accepted (G4).
   - Connect-AI card: keys kept in memory, with an opt-in device save and a warning, and "Forget key" (FR-AI-5).
8. Features:
   - requirement extraction with hours, location and Dutch demand (FR-JOB-2/4)
   - suggest evidence (FR-JOB-3)
   - suggest structured fields from a CV (FR-PRO-3)
   - CV tailoring diff (FR-CV-2)
   - LinkedIn helper (FR-CV-4)
   - mock interview with feedback after 6 answers (FR-INT-2)
   - plan from gaps (FR-PLAN-4)
   - custom prompt templates (FR-PS-3)
9. Tests:
   - contract tests per adapter against recorded responses
   - redaction, diff and parse unit tests
   - G1, G2 and G7 extended to every task prompt
   - G4 extended to the proposal flow
   - E2E journeys 2 and 3 against a mocked provider (Playwright route mocks; CI never calls a real provider)

## Risks
- **Free model IDs change.** They are in config, `listModels()` fills the picker live, and copy-paste is always available.
- **WebLLM download sizes are approximate** and devices vary. The UI says "about", needs explicit confirmation, and suggests Wi-Fi. Verified manually on a WebGPU laptop.
- **CSP `connect-src` must list provider hosts**, including the WebLLM model hosts. The runtime guard in `net.js` still blocks every host the user has not confirmed in this session.
