# Known issues

## 1. Intermittent axe colour-contrast failure on mobile WebKit (test issue; fixed in PR #7)

**Test:** `languages-knowledge.spec.js › axe: no serious issues on every page in English|Dutch (NFR-A11Y-2)` and
`a11y-and-library.spec.js › axe: no serious issues on any page (empty|demo)`, project **mobile-safari** (iPhone 14 viewport, WebKit).

**Symptom:** `color-contrast` on `.brand > span`, `label[for="mobile-view"]` and `#mobile-view`, always on the **home** step.
axe measured the dark sidebar's text against the *page* background (`#edf7ee on #f7f8f3`, ratio 1.02), as if the sidebar had no background.

**Frequency before the fix:** about 1 in 200–300 runs under heavy parallel load (12 workers, 16-core PC); not seen at normal load (0 of 405).

**Evidence (trace captured 2026-10-23, run 20 of 40):** the screenshot taken just before the failing axe run shows the **welcome card**
and **no demo banner**, although the test had loaded the fictional example. `page.goto('./#/home')` to the URL the page was
already on had **reloaded the page** in WebKit, so the session-only demo was lost and axe ran on a page that had just loaded.

**Cause, as far as it is reproducible:**
- All observed failures (7 of 7) were on the only step that calls `goto()` with the current URL.
- A reload by itself did not reproduce the misreading (0 of 50). The exact WebKit rendering state that axe sampled could not be reproduced on demand.
- Hypotheses tested and rejected:
  - runtime brand colours: the failures still happened with them disabled
  - the sidebar scrolled out of view: deliberate scrolling did not reproduce it, and the failing run had `scrollY 0`

**Fix (the test is not weakened):** in-app navigation in tests now uses `gotoView()`, which changes the hash like the app's own links and
never reloads. The "demo" axe checks now really check the demo state, which is more coverage than before. Axe failures now print the measured
colours and ratio, and the scroll position, so any recurrence is diagnosable.

**Impact on users:** none found. The sidebar is rendered dark in every screenshot, and Lighthouse accessibility is 100.
Same-URL navigation is a test-harness action, not something the app does.

**Found while investigating, fixed in PR #7:** the static "Opening Career Navigator…" placeholder stayed visible above the app for every user,
because lit-html's `render()` adds to the container. It is now cleared before the first render, and an E2E assertion covers it.

## 2. Smaller open points (not blocking the preview)
- **Release file name:** `release.yml` names the single-file build after `package.json` (`1.0.0-alpha.1`). Set the version to `1.0.0` in the same commit you tag.
- **Coach pack passphrase** is entered with the browser's `prompt()` dialog, which shows the text as you type. Replace it with an in-page password field.
- **A few storage notices** (for example "Your saved workspace is open.") are not in the translation catalogue, so they show in English in the Dutch interface.
- **Lighthouse performance** is not measured (CI enforces the 300 KB shell budget instead).
- **Firefox E2E** runs only in CI. The local Windows Firefox install failed (environment issue).
