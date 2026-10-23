Read AGENTS.md and docs/CUSTOMISING.md (section 4) first.
Create src/i18n/ar.json for Arabic with "_meta": { "name": "العربية", "dir": "rtl", "machineTranslated": true }.
Translate the strings listed by `node scripts/check-content.mjs`, keeping every {placeholder} exactly. Do not translate role titles or product names.
Then run `npm test`, start `npm run dev`, and check that the layout switches to right-to-left. Do not change tests/guardrails/.
