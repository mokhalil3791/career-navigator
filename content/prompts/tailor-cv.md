---
id: tailor-cv
slug: tailor
order: 104
title: "Tailor my CV (with change log)"
summary: "Suggest CV changes for one advert, field by field, each with a reason and the source of the fact."
pasteWith:
  - "Your current CV"
  - "The full text of the job advert"
appearsOn: cv
lang: en
output: json
schema: tailor-cv
library: false
---
## Goal
Tailor my CV (with change log).

## Instruction
Suggest changes to my CV fields so they fit the selected advert better. Keep employment history in reverse chronological order and bring relevant evidence forward within each role. Use the advert keywords only where my CV or profile supports them. Keep dates, titles, language levels and results exactly as recorded. For each changed field give the complete new text in "after", a short "reason", and in "source" the words in my CV or profile that support the change. Do not change fields that do not need changing. Do not add skills, credentials or results that are not recorded.

## Context
Use the quoted source data supplied with this request.

## Guardrails
Use only the supplied facts. Ask about missing information instead of guessing.

## Evaluation
Identify anything I should check before using the answer.
