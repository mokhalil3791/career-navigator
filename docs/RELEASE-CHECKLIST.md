# Manual pre-release checklist (v1.0.0)

Sign each line with your initials and the date. Tag `v1.0.0` only when all lines are ticked.

| # | Check | How | Done |
|---|---|---|---|
| 1 | Real Gemini free-tier call | `/next/` → AI prompt studio → Free AI routes → Gemini → your free AI Studio key → "Run with built-in AI" on the fictional example. Expect a streamed answer; then try "Extract requirements" and accept one proposal. | |
| 2 | WebLLM on a WebGPU laptop | Chrome or Edge on a laptop with WebGPU → In-browser model → tick the data warning → Download (on Wi-Fi). Expect progress, then an answer. Reload and check it starts without a new download. | |
| 3 | iPhone (Safari) | Open `/next/` and `/prompts/`. Complete journey 1 by touch (example → compare jobs → share with my coach → download). Add to Home Screen; switch on flight mode; reopen. | |
| 4 | Android (Chrome) | Same as 3, plus "Install app". Try **Share to an AI app** on `/prompts/`. Import a PDF CV from Downloads. | |
| 5 | Screen reader | NVDA (Windows) or VoiceOver (Mac or iPhone): navigate all pages by headings and landmarks; complete the CV review and download; use the welcome steps. | |
| 6 | Dutch strings | A fluent Dutch speaker reviews `src/i18n/nl.json` and `docs/PRIVACY.nl.md`. Then remove `"machineTranslated": true`. | |
| 7 | Exports open | The `.docx` opens in Word **and** LibreOffice; the `.ics` imports into Google Calendar or Outlook; the HTML CV prints to two A4 pages or fewer. | |
| 8 | Knowledge TODOs | Each `<!-- TODO verify -->` in `content/knowledge/en/` is resolved or left hidden on purpose. | |
| 9 | Ollama | Set `OLLAMA_ORIGINS` (README), then "Check connection" and run one prompt. | |
| 10 | Move v1 to the root | When approved, change `scripts/build-site.mjs` to put `dist/` at `/` and v0.1 at `/v0.1/`. | |
