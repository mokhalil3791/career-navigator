# Known issues

## 1. Intermittent axe colour-contrast failure on mobile WebKit (WebKit computed-style defect; no user impact; not fixed)

**Tests:** `a11y-and-library.spec.js › axe: no serious issues on any page (empty|demo)` and
`languages-knowledge.spec.js › axe: no serious issues on every page in English|Dutch (NFR-A11Y-2)`.
Project **mobile-safari** (WebKit, iPhone 14 viewport) only.

**Symptom:** `color-contrast` on `.brand > span`, `label[for="mobile-view"]` and `#mobile-view`. Always on the **home** step, which is the
first axe run after the app starts. Axe reports the dark sidebar's text against the page background (`#edf7ee on #f7f8f3`, ratio 1.02).

**Frequency (measured 2026-10-23, 16-core Windows PC, 12 workers):**
- not seen at normal load (0 in 405 runs)
- about 0.3% at moderate load (1 in 290)
- about 2% at heavy load (4–5 in 200 per batch; 13 in 750 over three batches)

**Cause (shown by the diagnostics the tests now print on every failure):**
- WebKit's `getComputedStyle(.sidebar).backgroundColor` returns `rgba(0, 0, 0, 0)`, and still does **one second later**, while `--deep` resolves to `#123e3c`.
- `elementsFromPoint` correctly finds the sidebar.
- A screenshot taken at the same moment shows the sidebar **painted correctly** (dark green, readable text).

So WebKit's CSSOM reports stale values for properties that use `var(--…)`, while rendering is correct. Axe reads the CSSOM, so it is accurately reporting what the browser says.

**Ruled out by experiment:**
- runtime brand colours: failures continued with them disabled
- scroll position: `scrollY 0` in every failure, and deliberate scrolling did not reproduce it
- page reloads: 0 in 50 immediate post-reload axe runs, and failures also happen in tests without reloads
- rewriting `<html lang/dir/class>` on every render: now written only when changed, and failures continued

**Impact:**
- **Users:** none observed. Pixels are correct in every captured screenshot, and Lighthouse accessibility is 100.
- **CI:** an occasional retry of one mobile-safari axe test (CI retries once). A real contrast regression would fail both attempts, and on every other browser project.

**Not done, on purpose:** the axe tests are not loosened, the rule is not excluded, and the sidebar is not excluded.

**Possible next step:** report it to WebKit with the trace, or replace `var()` in the sidebar colours with literal colours generated at build time from `config/brand.json`.

**Evidence kept locally:** a trace of the failing run and screenshots, in the agent scratchpad (`pw-flake`, `pw-persist`).

**Found while investigating, fixed in PR #7:**
- The static "Opening Career Navigator…" placeholder stayed visible above the app for every user. It is now cleared before the first render, with an E2E assertion.
- In-app navigation in tests now uses `gotoView()` (a hash change, never a reload). A `page.goto()` to the current URL had reloaded the page in WebKit and silently turned the "demo" axe check into an empty-state check.

## 2. Smaller open points (not blocking the preview)
- **Release file name:** `release.yml` names the single-file build after `package.json` (`1.0.0-alpha.1`). Set the version to `1.0.0` in the same commit you tag.
- **Coach pack passphrase** is entered with the browser's `prompt()` dialog, which shows the text as you type. Replace it with an in-page password field.
- **A few storage notices** (for example "Your saved workspace is open.") are not in the translation catalogue, so they show in English in the Dutch interface.
- **Lighthouse performance** is not measured; CI enforces the 300 KB shell budget instead.
- **Firefox E2E** runs only in CI. The local Windows Firefox install failed (an environment issue).
