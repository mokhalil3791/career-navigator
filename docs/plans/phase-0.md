# Phase 0 plan — Workshop release

Approved 2026-10-23 (maintainer: "Phase 0 first: yes"). Deadline: 31 Oct 2026. The workshop is on 2 Nov 2026.

**Gate:** the link opens on iPhone and Android, and the README explains the copy-paste AI flow.

## Tasks
1. Commit `docs/PRD.md` and `reference/v0.1/Career_Navigator.html` (byte-identical; a test pins its SHA-256).
2. Licences: MIT (code) and CC BY 4.0 (content), credited to "Career Navigator contributors" (FR-FORK-5).
3. Extract the 7 v0.1 prompt tasks into `content/prompts/*.md`, using the v0.1 code itself rather than retyping them. Keep the 6 original workshop prompts in `content/prompts/originals/` as attributed, reference-only text (decision D4).
4. Public prompt library `/prompts` (FR-LIB-1..5): generated from `content/prompts/`, one-tap Copy, Share on phones, free chat links, no storage, one-page print handout, QR code, short `/p/<slug>` links.
5. Hosted v0.1 at `/`: a patched copy that drops the original prompts (they request match scores) and the external prompt-site link. The reference file is untouched.
6. Issue templates (bug, wrong fact, feedback), PR template, code of conduct.
7. CI (tests + site build + audit) and the Pages workflow. Enable Pages (build type: workflow).

## Tests
- G1 (no score), G2 (safeguards), G8 (free forever): first versions over the prompts, the library page, the hosted v0.1 and all shipped text.
- Prompt tasks equal v0.1 tasks; the library page has no remote resources or storage, and escapes all content; v0.1 patches match exactly once.

## Risks
- The hosted v0.1 differs from the reference in four documented patches. Mitigation: each patch is named, asserted, and covered by tests.
- iPhone/Android check is manual: the maintainer opens the URL on both.
