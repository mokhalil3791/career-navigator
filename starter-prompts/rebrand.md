Read AGENTS.md and docs/CUSTOMISING.md (section 6) first.
Rebrand this fork for "<our group name>" by editing config/brand.json only (name, tagline, footer, colours, siteUrl).
Keep text contrast at WCAG AA (4.5:1). Do not remove the independence notice, and do not add any logo we have no written permission for.
Run `npm run build:all` and `npx playwright test --project=chromium -g axe` and show me the result.
