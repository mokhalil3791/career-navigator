# Phase 3 plan — Languages and knowledge

Written 2026-10-23, under the maintainer's run rules (short plan, then build).

**Gate:** journey 4 passes, and every card has a source and a review date.

## Tasks
1. Interface languages: English is the source (`t('English text')`). `src/i18n/nl.json` holds Dutch, marked machine-assisted until a fluent speaker reviews it. There is a topbar language switch, the CV and letter language is a separate setting (NFR-I18N-3), and the CSS uses logical properties for RTL (NFR-I18N-4).
2. Onboarding (FR-ONB-1/2): three steps (language → example or own → AI mode), with privacy explained before any data entry and a link to `docs/PRIVACY.md`.
3. Simple-language toggle (NFR-A11Y-3).
4. Knowledge pack (FR-KNW): 10 cards in `content/knowledge/en/`. Every factual sentence was checked against the cited official page, and anything not checked is a `<!-- TODO verify -->` comment that is never rendered. Cards appear beside the pages they help, and a **Learn** page lists them all. "Report a wrong fact" opens a pre-filled GitHub issue.
5. `content/events.json` + schema; past events hide automatically; only free events are listed.
6. `docs/PRIVACY.md` + `docs/PRIVACY.nl.md` (NFR-SEC-6).
7. Tests: knowledge, events and i18n unit tests; E2E journey 4, onboarding and knowledge; axe on every page in English and Dutch.

## Sources checked on 2026-10-23
werk.nl (CV, letter, interview, networking), idw.nl (credential evaluation, fee €148.83), justis.nl (VOG, fee €41.35),
staatsexamensnt2.nl (Programme I = B1, II = B2), inburgeren.nl, business.gov.nl (contract types, chain rule, probation period, holiday allowance), refugeetalenthub.com, vluchtelingenwerk.nl, uaf.nl.

**Not verifiable today, so marked TODO:**
- the claim that Dutch CVs "commonly omit" a photo and date of birth
- a two-page CV length
- recruitment agencies and open applications (the werk.nl page returned 404)
- municipal work programmes
- the VOG route for people registered in a municipality, and which sectors require a VOG
- minimum wage amounts
- where English-friendly roles cluster
- official definitions for koffiegesprek and similar terms, and an official BSN page

## Decisions made during the phase
- **The UI note on photo and date of birth (FR-CV-3)** was reworded to what the werk.nl CV guide actually shows: its list of personal details has no photo, date of birth, nationality or marital status. The broader "commonly omitted" claim stays as a TODO.
- **Principle 2 says "no percentages anywhere in UI".** Holiday allowance is written as "at least 8 euros for every 100 euros of gross annual salary". The fact is kept, and the G1 guardrail is unchanged.
- **"Trial period" is a word on the G8 paywall list.** The employment concept is written as "probation period (proeftijd)". G8 is unchanged.
- **Dutch versions of the knowledge cards (SHOULD)** are not written yet. Cards show in English with a note until a reviewed translation exists.
- **WCAG 2.2 target size:** every `<summary>` is now at least 44 px tall (found by axe).
