# Customising Career Navigator

Each example below takes under an hour. You can do it in the GitHub website editor (press `.` on your fork)
or with an AI coding assistant. Ready-made instructions are in [`starter-prompts/`](../starter-prompts/).

**Before you start:** never remove or weaken a test in `tests/guardrails/`. They keep the tool truthful, free
and private. If a change makes one fail, the change needs fixing, not the test.

---

## 1. Add a career path (for example Logistics Planner)
**Edit:** `content/roles/<id>.json`

1. Copy `content/roles/data_analyst.json` to `content/roles/logistics_planner.json`.
2. Change `"id"` to `"logistics_planner"` (lowercase letters, digits and `_` only) and `"role"` to `"Logistics Planner"`.
3. Fill in `priorities` (exactly 3), `phase_1` to `phase_3` (`label`, `slide`, `actions`, `output`), `portfolio`, `tools`, `acceptance`, `first_step` and `beginner_adjustment`.
4. Link free learning maps in `roadmaps` (each `url` must start with `https://`).
5. Set `"order": 100` to put it after the Data & AI roles.

**Guard rail:** the file is checked against `content/schemas/role.schema.json` in CI and when the app loads.
A broken file is skipped with a visible warning; the app keeps working.

## 2. Add or change a prompt
**Edit:** `content/prompts/<id>.md`

The text under the `---` frontmatter is the **task** only. The safety block (truthful facts, quoted data, no
scores) is **added by code** (`src/core/safeguards.js`) and a template cannot remove it.

```markdown
---
id: networking
slug: network
order: 8
title: "Prepare a coffee conversation"
summary: "Questions to ask someone who works in a job you want."
pasteWith:
  - "Your target role"
appearsOn: prompts
lang: en
---
Suggest five open questions I can ask a professional in my target role during a short coffee conversation…
```

New library prompts appear on the public `/prompts` page automatically. A prompt that only the app uses (with
a JSON answer) also sets `output: json`, `schema: <name>` and `library: false`, and needs a schema in `src/ai/schemas/`.

**Guard rails:** G1 (no scores), G2 (safeguards always present) and G7 (the name never appears) run on every prompt.

## 3. Add an interview question pack

Coaches can add question sets as JSON files in `content/interview/`.
**Edit:** `content/interview/<pack>.json`

```json
{ "id": "care-work", "title": "Care work", "roles": [], "questions": [
  { "id": "cw1", "question": "Tell me about a time you supported someone who was upset.", "tip": "Describe what you did and how you kept them safe." }
] }
```
Question ids: letters, digits, `_` and `-`. The pack appears in **Interview practice → Question set**.
**Guard rail:** `content/schemas/interview.schema.json`.

## 4. Add an interface language (for example Arabic)
**Edit:** `src/i18n/ar.json`

```json
{ "_meta": { "name": "العربية", "dir": "rtl", "machineTranslated": true },
  "Compare jobs": "مقارنة الوظائف" }
```
- The key is the English text exactly as it appears in the code (`t('Compare jobs')`).
- Anything missing falls back to English, so you can translate step by step.
- `"dir": "rtl"` switches the whole layout to right-to-left. The CSS uses logical properties, so no code change is needed.
- Run `node scripts/check-content.mjs` to see your coverage.

**Guard rail:** CI reports coverage per language, and a test checks that every key exists and keeps its `{placeholders}`.

## 5. Connect another free AI
**Edit:** `src/ai/providers/<name>.js` + `config/providers.json` + one import line in `src/ai/providers/index.js`

1. Copy `src/ai/providers/ollama.js`. Implement `generate` (yield text chunks), `listModels` and `checkConnection`.
2. Use `settings.fetch` (never `fetch` directly). It refuses any host the user has not confirmed.
3. Add an entry to `config/providers.json → api` with `"cost": "free"`, an `endpoint`, `connect` origins (these go into the CSP), `models` and a `privacy` note.

**Guard rails:** contract tests run every provider against mock responses; G8 refuses paid-only hosts; G4
refuses any provider code that imports the store.

## 6. Rebrand for a local group
**Edit:** `config/brand.json`

```json
{ "name": "Werk Wijzer Utrecht", "tagline": "Je volgende stap", "footer": "Werk Wijzer · een initiatief van vrijwilligers",
  "colors": { "deep": "#1d3557", "teal": "#2a6f97", "lime": "#cdeac0" } }
```
**Guard rail:** the footer independence notice ("Independent tool. No employer or partner endorsement implied.")
is fixed in code and cannot be removed. Only use another organisation's name or logo with written permission.

## 7. Turn modules on or off
**Edit:** `config/features.json`

```json
{ "applications": true, "knowledge": true, "coach": false, "builtinAi": true, "cvImport": true, "voiceAnswers": false }
```
**Guard rail:** safety features (review gate, prompt safeguards, name omission, import reset, network guard,
preview-and-confirm) have no switch. A test fails if one is added to this file.

---

### Check your change
```
npm install
npm test          # must stay green, including tests/guardrails
npm run build:all # then: npm run serve  →  http://localhost:4174/next/
```
To publish your fork for free, follow [DEPLOY.md](DEPLOY.md).


## Add free events

Coaches can add free events in `content/events.json`. Keep dates, locations and links current, and verify that participation is free.
