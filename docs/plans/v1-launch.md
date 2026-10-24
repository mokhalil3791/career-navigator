# Career Navigator — v1 launch: one URL, one clear journey, orange brand

Paste this whole file into Claude Code at the root of `mokhalil3791/career-navigator`. Also commit it as `docs/plans/v1-launch.md`.

---

## Why we are doing this

Career Navigator is the take-home tool for the NN Group × Refugee Talent Hub Data & AI career workshop on **Monday 2 November 2026**. Participants are newcomers to the Netherlands. Many will open it on a phone, in a room, during a short hands-on session, with free AI tools only. Afterwards they keep using it at home for months, and some will fork the repo to learn to build with AI.

So the experience must feel **warm, simple and encouraging**, and in **one sitting** someone must leave with something real: a reviewed CV they can download, plus a next step.

Today the tool is confusing:

- There are two live sites: v0.1 at `/` and v1 at `/next/`.
- Home, the sidebar and the page headings use three different names and numbering schemes for the same steps.
- Importing a CV leaves the profile form empty.
- The profile and CV pages ask for the same facts twice.
- AI help appears in five different forms.
- Key actions (the fictional example, the letter, LinkedIn) are hidden in collapsed sections.
- Work is lost on refresh unless the user finds a checkbox.

This task fixes all of that and ships **one** site.

## Non-negotiable rules

- The PRD (`docs/PRD.md`) principles and guardrail tests G1–G10 stay green and **unchanged**. Never delete or weaken a test. If a change here conflicts with a guardrail, the guardrail wins: stop and tell me.
- Everything stays free: no paid service, no account, no analytics, no tracking, no new network host.
- No new runtime dependency.
- No percentage or fit score anywhere. Keep the review gate before CV export, preview-before-send for AI, and the evidence statuses.
- Plain English at CEFR B1. Short sentences. Dutch interface strings keep their "machine-assisted" label.
- WCAG 2.2 AA, 44×44 px touch targets, works at 360 px wide.

## Part 1 — One URL

The final state: `https://mokhalil3791.github.io/career-navigator/` serves the v1 app. Nothing else serves an app.

1. **Change `scripts/build-site.mjs`** so `dist/` (v1) is copied to the site root (`_site/`). It must no longer copy v0.1 to `/` or v1 to `/next/`. Keep `/prompts/`, `/p/<slug>/` short links and `/qr/` exactly as they are. Update the header comment.
2. **Set the Vite `base` and all absolute links for the root path.** Search for `/next` across the repo, including:
   - `vite.config.js`
   - `public/manifest.webmanifest` (`start_url`, `scope`, icons)
   - the service worker scope and registration
   - the CSP plugin
   - `config/brand.json`
   - the prompts page
   - the QR generator
   - README, `docs/DEPLOY.md`, AGENTS/CLAUDE.md
   - the tests
   
   Afterwards, nothing should reference `/next` except the redirect below.
3. **Keep `/next/` as a redirect page only.** It should:
   - unregister any service worker whose scope is `/career-navigator/next/`
   - delete that scope's caches
   - then `location.replace` to the root, keeping the `#/…` hash
   
   Show a one-line "Moving you to the new address…" with a plain link as fallback. Use no external script, and keep it CSP-compatible.
4. **Don't lose anyone's work.**
   - Both sites share the same origin, so IndexedDB data saved from `/next/` stays readable at `/`. Add an E2E test proving that a workspace saved under the old `/next/` path opens at `/`.
   - v0.1 stored device-saved work in `localStorage` under `career-navigator.workspace.v1`. On first load, if that key exists and holds a valid v0.1 workspace with `settings.remember === true`, show a banner: "We found work saved by the earlier version. Bring it in?" with the buttons **Bring it in** and **Not now**. **Bring it in** migrates it through the existing schema-1 importer, with device saving off and the review flag reset, exactly like importing a backup. Then it asks whether to keep saving on this device. **Not now** leaves the key alone. Add a test.
5. **Keep v0.1 only as a download, not a live page.** It stays in `reference/v0.1/` and is attached to GitHub Releases. v1's "Import backup" must still accept v0.1 JSON backups (already tested; keep that test).
6. **Deploy and check after merging to `main`:**
   - `/` loads v1.
   - `/next/` and `/next/#/cv` land on `/` and `/#/cv`.
   - `/prompts/` and every `/p/<slug>/` work.
   - The QR SVGs in `/qr/` encode the root URL and `/prompts/`.
   - Regenerate the QR codes with `npm run build:qr`.

## Part 2 — Orange brand

Change the colour system from teal/green to a warm orange. Do it through the tokens only: `src/styles/tokens.css`, the `colors` in `config/brand.json`, `theme_color` in the manifest, the favicon/icon SVG and the prompts page styles. **No hard-coded colours in components.** Grep for hex values outside tokens and replace them with variables.

Start from this palette. You may adjust shades to pass contrast, but stay orange.

| Token | Value | Use |
| --- | --- | --- |
| `--deep` | `#7C2D12` | Sidebar, mobile header, dark surfaces (white text on it) |
| `--primary` | `#C2410C` | Primary buttons, links, active nav, focus accents (white text on buttons) |
| `--primary-hover` | `#9A3412` | Button hover and pressed states |
| `--accent` | `#FB923C` | Decorative only: illustrations, progress fill, step markers. **Never** as a text colour or as text on a white background |
| `--soft` | `#FFEDD5` | Selected nav item, soft cards, tips |
| `--soft-2` | `#FFF7ED` | Banners, review box |
| `--paper` | `#FFFBF7` | Page background |
| `--ink` | `#2B1A12` | Body text |
| `--muted` | `#6B5548` | Secondary text |
| `--line` | `#EADBCF` | Borders |
| `--success` | `#15803D` | "Done" status only, always with an icon and a word, never colour alone |
| `--danger` | `#B91C1C` | Destructive actions and errors |
| focus outline | `#1D4ED8`, 3 px | Must be clearly different from the orange buttons |

- Rename the old token names (`--teal`, `--mint`, `--lime`, `--orange`, `--sand`) to the roles above. Update every use.
- Add a contrast test: a unit test that computes WCAG contrast for each text/background pair the UI uses and fails below 4.5:1, or 3:1 for large text and UI borders.
- Axe must stay at zero serious issues.
- The brand mark gets the compass icon on `--accent`, with the icon in `--deep`.

## Part 3 — One clear journey

### Information architecture

Use exactly **four steps**, with the same label and number everywhere: sidebar, home, a stepper at the top of each step page, the page heading and the "Next" button at the bottom.

1. **My story**: the profile
2. **Target job**: adverts and requirements
3. **My CV**: draft, review and export, with **Letter** and **LinkedIn** as tabs on the same page
4. **Next steps**: **Interview practice**, **90-day plan** and **Applications** as tabs

Below the steps, the sidebar has a small **Tools** group:

- **Prompt library**: the current AI prompt studio, renamed
- **Settings**: data and saving, language, AI connection, coach notes, delete everything

Remove:

- "Overview" (call it **Home**)
- "More tools"
- the `01 / 02 / 03` eyebrows
- any text that explains the navigation (e.g. "Workshop tools: AI prompt studio is in the main navigation…")

On phones, replace the "Go to section" dropdown with:

- a top bar: brand, "Step 2 of 4 · Target job", and a menu button that opens the full nav as a sheet
- a sticky bottom bar with **Back** and **Next: My CV**

### Home

- A warm, short header: **"Your next step in the Netherlands starts here."** One sentence under it: "Build a CV you trust, find what jobs really ask for, and leave with a plan. Free, private, no account."
- Four step cards, each showing a status computed from state, with an icon and a word: **Not started / In progress / Done**. No percentages and no scores.
- One primary button: **Start** for a new user, otherwise **Continue: <first unfinished step>**.
- A visible secondary button: **Try with an example person (Sam)**. It is never hidden in a collapse.
- One small reassurance line: "Your work stays on this device. AI help is optional and free."

### Welcome (first visit)

Make the welcome **one screen**, not three steps:

- three privacy bullets
- the buttons **Start my own** and **Try the example**

The language choice stays in the top bar. Do not ask about AI here. Ask the first time the person presses an AI button (see AI help below).

### Step 1, My story

1. **"Add your CV"**: a large drop zone / file button for PDF, DOCX or TXT, with "or paste text" and "or type it yourself" as secondary options.
2. After a file is read, show the extracted text **visibly**, in an editable box, with a primary button **"Turn this into my profile"**. It runs the existing suggest-fields task through the person's AI route (copy-paste by default) and shows the existing accept / edit / reject proposals per field. Nothing is filled in without an accept click. That is an existing guardrail, so keep it.
3. The form shows only the essentials by default:
   - name (optional)
   - target role
   - what you bring
   - experience
   - skills
   - education
   - languages
   
   City, availability, travel, work preferences, education rows and language levels go under one **"More details (optional)"** section. Keep the existing data model. This is layout only.
4. Remove the duplicate "Use an AI prompt" button; AI help lives in one place (see below).

### Step 2, Target job

- Show the empty state with **one** action: "Paste a job advert". It opens an inline form with title, employer, link and advert text.
- After pasting, the primary action is **"Find the requirements"** (the extract-requirements task) → proposals → accepted rows become requirements.
- Then each requirement shows its evidence status (existing four statuses) and a small "Suggest evidence" action.
- The list of adverts is a simple vertical list with the selected one highlighted; the comparison table appears only when there are two or more adverts, under a tab "Compare adverts".
- Knowledge cards: show **at most one** relevant card per step, as a compact "Good to know in the Netherlands" box with a "Read more" toggle. Stop rendering several full-width cards under the empty state.

### Step 3, My CV

- On the first visit, if profile facts exist and the CV fields are empty, **create the draft from the profile automatically** and show a banner: "We made a first draft from your story. Check every line before you download." The review gate and its invalidation rules stay exactly as they are.
- Show the target advert at the top ("Tailoring for: Junior Data Analyst — change") with **"Tailor to this job"**. This runs the existing diff/change-log review.
- Fix the stale side-card text, which still says "Copy my profile into CV".
- Tabs: **CV · Letter · LinkedIn**.
- Put the review box and the downloads (Word first, then HTML/PDF) in one clearly separated "Ready to download?" card at the end, with the three check statements as real checkboxes or one combined tick. Do not change the gate logic.
- After a successful download, show a short, warm moment of success, e.g. "Well done. You have a CV you checked yourself." Offer "Next: practise an interview" and "Plan your next 90 days". No confetti library; a simple CSS animation that respects `prefers-reduced-motion`.

### Step 4, Next steps

Use three tabs:

- **Interview practice**: the existing questions plus the AI mock interview
- **90-day plan**: the existing templates, check-in and .ics export
- **Applications**: the existing tracker

Each tab opens with one sentence of purpose. No more.

### AI help: one pattern everywhere

- **One "AI help" button per step**, always in the same place: top right of the step header on desktop, and in the bottom bar on phones. It is labelled after the task:
  - "AI: fill my profile"
  - "AI: find the requirements"
  - "AI: tailor my CV"
  - "AI: practise an interview"
  
  Every button opens the **same** panel.
- **The first time any AI button is pressed**, the panel asks once: "How do you want to use AI?" There are three choices:
  - **Copy and paste into a free AI chat** (default, recommended)
  - **Connect a free Gemini key**
  - **Run AI on this device** (only shown when WebGPU is available, with the existing large-download warning)
  
  The choice is remembered and can be changed in Settings.
- Remove all other AI entry points from the step pages.
- The Prompt library keeps the full list of prompts for people who want them.
- Keep preview-before-send, redaction and the "unverified draft" labels exactly as they are.

### Saving

- Keep "session only" as the technical default, as the PRD requires. After the person's **first edit** in a session, show one friendly banner: "Keep your work on this device? Only say yes on your own phone or computer." with **Yes, keep it** and **Not now**. **Not now** hides the banner for this session.
- The top bar shows a clear status chip: "Saved on this device" or "Not saved — download a backup".
- The Save backup button stays in the top bar.
- Move the "Your data & saved work" card off every page into **Settings**.

### Copy and tone

- Every page has one heading, one sentence of lead text, then the work. Delete repeated hints and the sidebar slogan block.
- Be encouraging and plain: "You can change this later", "This is a draft", "Good start". Never say a person lacks something; say evidence is "not shown yet".
- The demo banner says: "You're exploring Sam's example. Nothing here is real." with the button **Start my own**.

## Part 4 — Workshop-ready touches (all free, no server)

- **Prompt library (`/prompts/`)**: restyle it in orange and make it match the app. Add a clear "Open Career Navigator" button at the top, and on every prompt card a line saying "Works best inside Career Navigator, which adds your facts for you".
- **Take-home card** on Home, shown once the CV is reviewed: "Take it home". It offers:
  - **Download my CV (Word)**
  - **Download my backup** (with one line explaining how to restore it)
  - **Add Career Navigator to my home screen** (the PWA install prompt where supported; otherwise short iPhone/Android instructions)
- **Handout**: add `site/handout/index.html` (served at `/handout/`). It is a printable one-page A4 sheet:
  - the app URL and its QR code
  - the prompts URL and its QR code
  - the four steps in one line each
  - the three privacy points
  - "Free forever, no account"
  
  It uses the orange palette and print CSS, and has no personal data.
- **Offline**: confirm the service worker caches the app shell at the root scope. This lets a participant reopen the app on a weak Wi-Fi connection.

## Part 5 — Tests and proof

Add or update Playwright tests at **390×844** and **1366×900**, across Chromium, Firefox and WebKit:

1. A new user goes from Home to a reviewed CV download using **only** the "Start/Continue" and "Next" buttons plus the necessary inputs (use the fixture CV and the mock AI server).
2. "Try with an example person" is reachable from Home in one click, both before and after the welcome.
3. The step label and number match in the sidebar, the stepper, the page heading and the "Next" button on every step.
4. Every step page has exactly one AI help button.
5. `/next/` and `/next/#/jobs` redirect to `/` and `/#/jobs`; a workspace saved from `/next/` opens at `/`.
6. The v0.1 localStorage workspace is offered for import, and imports with saving off and the review flag reset.
7. No horizontal scroll at 360 px on any page.
8. The contrast unit test passes, and axe reports zero serious issues on every page.

## Delivery

- Work on a branch `v1-launch`, in this order, with small commits:
  1. one URL
  2. orange tokens
  3. information architecture and navigation
  4. step pages
  5. AI pattern
  6. saving
  7. workshop touches
  8. tests
- Open **one PR**. CI must be green, including every guardrail test. Then merge to `main` and verify the live site using the checklist in Part 1, step 6.
- Update `README.md`, `docs/DEPLOY.md`, `AGENTS.md`/`CLAUDE.md` and the PRD status section to describe the single URL, the four-step journey and the orange tokens.
- Finish with one report that includes:
  - **Screenshots** of Home, each of the four steps, the AI panel's first-use choice, the success moment, Settings, the handout and `/prompts/`, each at 390 px and 1366 px
  - **The list of what changed**, mapped to PRD requirement IDs
  - **Anything mocked or not done**
  - **Manual checks for me before 2 November:**
    - a real phone on Safari and Chrome
    - one real Gemini free-tier call
    - printing the handout
    - opening the old `/next/` link on a phone that used it before

Stop and ask me only if a guardrail conflicts with this plan, if something would cost money, or if you need a new runtime dependency.