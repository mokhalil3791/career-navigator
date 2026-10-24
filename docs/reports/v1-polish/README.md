# Phone polish evidence — 2026-10-24

Agent-operated Chromium screenshots at **390 × 844**, with fictional Sam data. These are browser emulation,
not a real-phone check or a human usability study. No manual release-checklist items were completed.

| Screen | Viewport | Full page |
|---|---|---|
| Home, first visit | [Screenshot](home-first-visit.png) | [Full page](home-first-visit-full.png) |
| Home, demo | [Screenshot](home-demo.png) | [Full page](home-demo-full.png) |
| Target job | [Screenshot](target-job.png) | [Full page](target-job-full.png) |
| My CV | [Screenshot](my-cv.png) | [Full page](my-cv-full.png) |

Detail views: [collapsed requirements](target-job-requirements.png), [review and exports](my-cv-exports.png).
The sticky bar appears at the original viewport boundary in full-page captures; use viewport shots to judge it.

Sam's Target job page measures **3,132 px**, below four 844 px screens (3,376 px), with all requirement rows
collapsed and the evidence section open. Opening one row closes the previous row; its text, status, evidence
and next-step values remain unchanged. The automated test checks all values before and after expansion.

`tests/e2e/polish.spec.js` covers Home states, first-edit warning timing, menu/Settings controls, sticky bars
and toast clearance at the top/middle/bottom of every step, collapsed requirements, and Word-first exports.
`tests/unit/journey-status.test.js` checks each qualifying next-step action against each incomplete prior step,
including blank/whitespace answers. Existing journeys retain their export-content, review-lock and backup checks.
