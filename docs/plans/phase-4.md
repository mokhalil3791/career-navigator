# Phase 4 plan — New modules

Written 2026-10-23, under the maintainer's run rules. Runtime dependency `pdfjs-dist` was approved on 2026-10-23 (lazy-loaded, PDF import only).

**Gate:** journeys 1, 2 and 6 pass; exports open in Word and LibreOffice (manual check).

## Tasks
1. **Applications tracker (FR-APP-1..3):** a new page with advert link, date applied, stage, next follow-up, optional contact and notes; a weekly view (sent this week, follow-ups due, overdue); follow-ups export to `.ics`.
2. **CV import (FR-PRO-2):** PDF (pdf.js, lazy), DOCX (our own ZIP reader using the browser's `DecompressionStream`) and TXT. Text goes into "Paste an existing CV" only. Nothing is uploaded.
3. **DOCX export (FR-CV-3):** our own minimal DOCX writer (stored ZIP + WordprocessingML), with the same review gate as HTML. No photo, date of birth, nationality or marital status fields. Dutch headings when the CV language is Dutch.
4. **.ics export (FR-PLAN-3):** next action and milestone target dates. Builder follows RFC 5545 (CRLF, escaping, 75-octet folding, all-day events).
5. **Weekly check-in (FR-PLAN-2):** tick done items, one blocker, adjust the next action.
6. **Coach view (FR-COACH-1..4):**
   - The coach pack is one self-contained HTML file (work pack + embedded JSON), with an **optional passphrase** (Web Crypto PBKDF2 + AES-GCM, pulled into scope).
   - The coach opens it in the same public app in a read-only view, adds notes per section, and downloads a small notes file.
   - The job seeker imports the notes; they appear beside the work and never overwrite it.
   - Both sides see the "personal details" warning.
7. **Profile additions:** target roles and work preferences (FR-PRO-1), language rows with CEFR level and self-assessed/certified (FR-PRO-4), education rows with original title, country, year and IDW status with a link (FR-PRO-5). These appear in prompts only when filled, so v0.1 parity holds.
8. **Interview question packs (FR-INT-3):** a pack picker, plus a "Data & AI roles" pack as a JSON example for coaches.
9. **Tests:**
   - unit: ICS, ZIP/CRC, DOCX round-trip, deflated DOCX read, crypto, coach pack (open, protected, script-escape, oversize), coach notes, weekly view
   - E2E: journey 1 (two browser contexts), CV import from all three formats, DOCX, applications + `.ics`, plan + check-in, profile rows

## Decisions
- **Voice answers (FR-INT-4, MAY) are not built.** In Chrome, the Web Speech API sends audio to Google's servers, which breaks principle 4 unless it gets its own preview-and-confirm. Deferred to a later version with an on-device option.
- **No `docx` or `mammoth` runtime dependency.** DOCX read and write use about 150 lines of our own code, so the approved runtime dependencies stay at 3.
- **Test bug found and fixed:** "Try a fictional example" navigates to the overview after an async storage clear, so a test navigating immediately was pulled back. A `loadDemo()` helper now waits for it. This also explains the earlier axe flake. The axe tests now run with reduced motion, so transitions cannot skew contrast readings.
