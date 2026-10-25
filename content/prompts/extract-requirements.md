---
id: extract-requirements
slug: extract
order: 101
title: "Extract requirements"
summary: "Split one advert into must-have and nice-to-have requirements, plus hours, location and the Dutch-language demand."
pasteWith:
  - "The full text of one job advert"
appearsOn: jobs
lang: en
output: json
schema: extract-requirements
library: false
---
## Goal
Extract requirements.

## Instruction
Read the job advert below. List each requirement exactly as the advert states it, one per item, and mark it must-have ("must") or nice-to-have ("nice"). Use "nice" only when the advert says so (for example "is a plus", "preferred", "pré"). Also report the hours and the location as written. Report the Dutch-language demand separately: "required" when Dutch is required (give the stated CEFR level if one is written), "plus" when Dutch is only an advantage, "not-stated" when the advert does not mention Dutch. Do not infer a Dutch requirement from the language the advert is written in. Do not add requirements the advert does not state.

## Context
Use the quoted source data supplied with this request.

## Guardrails
Use only the supplied facts. Ask about missing information instead of guessing.

## Evaluation
Identify anything I should check before using the answer.
