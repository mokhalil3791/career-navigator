# Sam's example as a best-practice showcase

Paste this whole file into Claude Code at the repo root. Also save it as `docs/plans/sam-showcase.md`.

---

## Goal

When someone presses **Try the example**, Sam's workspace should show every part of the journey done well. That includes all 8 interview answers, one reflection per answer, a chosen interview question set, prompts with good "Anything else to ask" text, example AI replies, and one prompt Sam wrote himself in the five-part format.

Participants learn by seeing a finished, honest example. Then they press **Start my own** and do the same with their own facts.

## Rules

- Guardrail tests G1–G14 stay green. Update expected text only where wording changes; never weaken what a test requires.
- Use no new dependencies.
- **Everything about Sam stays fictional and grounded in `content/demo/sam.json`.** Example answers and example AI replies may use only facts already in Sam's profile, jobs or CV. Where a real detail would be needed and Sam's profile doesn't have it, show a visible `[add …]` placeholder. This teaches the habit; it is not a bug.
- Do not use percentages, scores or status words anywhere.
- Every example is clearly labelled as an example. A participant's own workspace never contains any of this.

## 1. Interview answers: General set (copy exactly)

Fill `interview.answers` and `interview.notes` in `content/demo/sam.json`, using these question IDs from `content/interview/default.json`. The answers target Sam's selected advert, "Junior Data Analyst — fictional".

**q1 — Tell me about your experience and why this role interests you.**

Answer:
> For four years I worked as an operations coordinator in retail. Every week I cleaned our order records in Excel, checked for missing values and duplicates, and prepared a summary for a six-person operations team. I found I enjoy working out what the numbers say and explaining it to colleagues. To move further into data, I started a personal SQL project with 200 practice order records. This role combines the weekly reporting I already know with the SQL I am building, so it is a realistic next step for me.

Note:
> Next time: open with one sentence about what I can do for them, then give the background.

**q2 — Tell me about a problem you helped solve. What did you personally do?**

Answer:
> **Situation:** Our weekly order records sometimes had missing values and duplicate rows, so the team's summary could be wrong.
> **Task:** I prepared that summary every week, so it was my job to make the data reliable first.
> **Action:** Before building the summary, I checked the records in Excel for missing values and duplicates, using filters and pivot tables, and cleaned what I found.
> **Result:** The team worked from a checked summary each week. [Add one real example: an error your check caught and what would have gone wrong without it.]

Note:
> Add one concrete error I caught. A real example is stronger than a general description.

**q3 — Describe a time you worked with another person to complete a task.**

Answer:
> **Situation:** As an administrative assistant, colleagues often came to me with the same internal questions.
> **Task:** I answered those questions, and I wanted the answers to be easy to find again.
> **Action:** I kept the records up to date and wrote down recurring issues so the next person could use them.
> **Result:** Colleagues had a written reference for common questions. [Add what changed, only if you can support it, for example fewer repeated questions.]

Note:
> Say more about how I agreed with colleagues what to write down. That is the collaboration part.

**q4 — How did you learn something new that you needed for a task?**

Answer:
> **Situation:** Most data analyst adverts I read ask for SQL, and I had only used Excel.
> **Task:** I wanted to learn the basics without using any real customer data.
> **Action:** I created 200 invented order records and practised cleaning and summarising them. I wrote and saved six SQL queries using SELECT, GROUP BY and JOIN, with a short explanation of each.
> **Result:** I can now show these six queries and explain what each one does. My next step is to add more complex queries to the same project.

Note:
> Bring the project on a laptop or as a link, so I can show it instead of describing it.

**q5 — How do you check that your work is accurate or complete?**

Answer:
> I check before I report. In my weekly work I looked for missing values and duplicate rows in Excel before preparing the summary. I do the same in my SQL project: I check the records first, then run the queries. When I find an error, I correct it where I can and mention it to the person who uses the result, so they know what changed. [Add one real example of a mistake you found and fixed.]

Note:
> Good structure. Add one specific example to make it believable.

**q6 — Tell me about useful feedback you received and what you changed.**

Answer:
> [Sam's profile does not record a feedback example yet, so this answer only shows the structure. Do not invent one.]
> **Situation:** [When and where: for example, a weekly summary at Example Retail.]
> **Feedback:** [What someone said, and their role, not their name.]
> **What I changed:** [The concrete change you made.]
> **Result:** [What was better afterwards, only if you can support it.]

Note:
> Find one real moment before the interview. Without one, say honestly that I welcome feedback and give an example of how I would act on it.

**q7 — Which part of this role would you need to develop, and how would you start?**

Answer:
> My SQL is still at a basic level. I have used it in a personal project, not yet in a job. To build on it, I would keep extending my project with more complex queries and ask a colleague to review my first queries at work. My Dutch is at A2. The advert says Dutch is helpful but not required, and I want to keep improving it so I can follow team conversations. [Add your concrete plan, for example a course or how many hours a week.]

Note:
> Name the gap first, then the plan. Don't apologise for it.

**q8 — What would you like to ask us about the role or team?**

Answer:
> - Which reports would I be responsible for in the first three months?
> - Who would review my SQL queries while I am learning?
> - How much Dutch is used in team meetings, and is there support to improve it?
> - What would good work look like after six months?

Note:
> Pick two questions. Ask the Dutch question in a positive way, as interest rather than worry.

## 2. Interview answers: Data & AI roles set

Fill answers and notes for the 8 questions in `content/interview/data-ai-roles.json` (IDs `da1`–`da8`) in the same style. Use the general set above as the quality bar:

- Use STAR where it fits, and 80–130 words per answer.
- Use only Sam's facts. Each `da` answer may reuse facts from the matching general answer.
- Use `[add …]` placeholders wherever Sam's profile lacks the needed detail. This applies at least to **da3** (a time the work was wrong) and **da6** (AI limits, where Sam has no AI experience: answer honestly from general understanding and say so).
- **da7** (keeping personal data safe): use Sam's real practice of using invented records instead of customer data in the project.

Also:

- Set `interview.packId` to `default` and `questionIndex` to 0.
- Prefill `interview.mock` with one short example exchange: interviewer question q2 → Sam's answer → AI feedback. The feedback should show good practice: it is short, praises the STAR structure, points out the missing concrete example, gives no score, and ends with "Please check:". Label it "Example AI feedback".

## 3. Prompts that showcase best practice

- **`ai.extra`** ("Anything else to ask") in the demo: "Use plain English. Keep each answer under 150 words. Ask me before you assume anything."
- **`ai.drafts`** (the pasted-back AI replies). Fill `read`, `fit`, `tailor`, `interview` and `letter` with example replies for the Junior Data Analyst advert. Each one starts with "EXAMPLE AI REPLY (fictional) — this is what a good answer looks like." Each must follow its prompt's five parts exactly:
  - **read:** a 3-sentence job summary; requirements marked Must-have / Nice to have; Dutch "a plus, no level required"; hours and hybrid; what was unclear.
  - **fit:** the table Requirement | Evidence (exact words from Sam's profile) | Status | Next step, using only the four statuses; 3 strengths; 3 gaps, each split into missing skill or missing information; 2 employer questions; one 30-day action.
  - **tailor:** a rewritten profile and skills list, plus the change log table (Change | Why | Supporting line from Sam's CV) and lines to double-check.
  - **interview:** the six-question feedback summary (2 strengths, 2 improvements, 1 example to prepare).
  - **letter:** at most 250 words, followed by questions for missing details. The "why this employer" line is a visible `[add in your own words]`.
  - Every draft ends with "Please check:".
- **`ai.customPrompts`:** add one prompt Sam wrote himself, titled "Explain Dutch words in an advert", in the five-part format:

```
GOAL
Understand the Dutch words in a job advert.

INSTRUCTION
List every Dutch word or phrase in the advert below. For each, give a simple English meaning and one sentence explaining why it matters for my application.

CONTEXT
I read English well and my Dutch is A2.
The advert: [paste]

GUARDRAILS
Only explain words that appear in the advert. If a word has more than one meaning, give both.

EVALUATION
End with the 3 words I should learn first.
```

- In the AI panel and the Prompt library, while the demo is active, show a small label above each prepared prompt: "Example: this is a complete five-part prompt. Notice the Goal, Context and Guardrails."

## 4. How the example is shown

- In Interview practice, while the demo is active, show a small banner above the question: "Example answer written for Sam. Read it, then write your own after you press Start my own." Each `[add …]` placeholder is highlighted, with a tooltip or caption: "A good answer needs a real example here. Never invent one."
- Remove the developer hint "Coaches can add question sets as JSON files in content/interview/." from the page, and move it to `CUSTOMISING.md`. Do the same for "Coaches can add free events in content/events.json."
- Start my own still clears everything, including interview answers, notes, mock, drafts, extra and custom prompts. Add a test for this.

## 5. Tests

1. Loading the example fills all 8 general answers and notes, all 8 Data & AI answers and notes, the mock exchange, the five drafts, `ai.extra` and the custom prompt.
2. **Grounding test:** every quoted evidence string in the `fit` draft appears word for word in Sam's profile or CV.
3. No demo answer or draft contains a percentage or a G14 word; every draft ends with "Please check:".
4. Answers q2, q3, q5, q6 and q7, plus da3 and da6, each contain at least one `[add` placeholder.
5. The custom prompt contains the five labels in order.
6. Start my own leaves no trace of any of it.
7. A backup import of the demo resets the review flag, as before.

Screenshots at 390 px: Interview practice question 2 and question 6, the fit draft, and the custom prompt.

Merge when CI is green.