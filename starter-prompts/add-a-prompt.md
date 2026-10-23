Read AGENTS.md and docs/CUSTOMISING.md (section 2) first.
Add a prompt "Prepare a coffee conversation" as content/prompts/networking.md (slug "network", order 8).
The task text must ask for questions only, never invent facts about the person or the employer, and never give a score.
Do not repeat the safety rules in the task: code adds them. Run `npm test` and `npm run build:site`, then show me /prompts/.
