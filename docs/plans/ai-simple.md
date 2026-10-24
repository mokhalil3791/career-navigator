# AI simplification — 25 October 2026

One branch from main (`ai-simple`), one PR. Existing G1–G13 and the G5 fixture stay unchanged.

The current panel exposes connection vocabulary, occupies space above the journey, and generates workspace
prefill URLs. Replace those links with fixed chat homepages, persist the selected chat in the opt-in workspace,
and move setup behind Settings → Advanced. Copy/open and phone sharing lead back to the existing reply parser
and individual proposal decisions. A modal sheet keeps the journey layout in place; Close/Escape restore focus.

The browser's optional LanguageModel capability is detected locally. Availability alone never creates a session
or downloads anything. Download consent and outgoing-text review gate Send. WebLLM remains in Advanced.
OpenRouter's public catalogue is fetched only after the user selects it in Advanced, with no credentials or
workspace data. Only `:free` IDs are offered; catalogue failure uses configured free IDs. An unavailable choice
refreshes the catalogue and asks the user to choose again, without an automatic resend.

Touchpoints: AI panel/connect/session/adapters, workspace settings normalization, app prompt library, static
library renderer, shell dialog lifecycle, EN/NL strings, documentation and ordinary journey tests.
Add G14 for URL privacy; unit tests for normalization and capability/catalogue behavior; E2E for chooser once,
copy/homepage on each task, focus return/paste/fallback, proposals, Settings connections and mocked catalogue.
Capture chooser, panel, proposals and Advanced at 390 and 1366 px. No real AI call or download is part of testing.

Risks: clipboard permission and popup blocking, phone share cancellation, browser capability changes, missing
catalogue entries, and focus trapping while proposals rerender. Keep explicit fallbacks and never report a
successful copy on failure. Choice persistence follows the existing device-saving opt-in.

Browser integration reference checked: https://developer.chrome.com/docs/ai/prompt-api
and https://developer.chrome.com/docs/ai/inform-users-of-model-download (25 October 2026).
Exact download size is not exposed by the browser; say so and warn that several GB may be required.
