# Progress: case-study panel simplify + gallery

Plan: docs/superpowers/plans/2026-07-06-case-study-panel-simplify.md
Branch: feat/case-study-gallery
Base commit: ad4eb6572258395526565727fbd665986c23fb0e

- Task 1: complete (commit 4d91029, review clean)
- Task 2: complete (commit 287766c, review clean)
- Task 3: complete (commit dd87d0e, review clean)

## Post-review refinement (2026-07-06)
User wanted the gallery to match a specific reference (tlb.betteroff.studio 99¢ gallery)
more closely. Measured actual geometry from that site and reworked case-study.css/js/
content.js directly (small, well-specified value/shape change on already-reviewed code —
no new subagent pipeline). Commit: 3051a1c. Verified via screenshot: desktop 5/7 images,
mobile 390px, dark mode, glide+carousel regression — all clean.

# Progress: whisper-fade text-motion standardization

Plan: docs/superpowers/plans/2026-07-07-whisper-fade-text-motion.md
Branch: feat/case-study-gallery
Base commit: a65ccbe

- Task 1: complete (commits a65ccbe..abd3244, review clean)
  - Minor: test/motion.order.test.js has unused `execSync` import (plan-authored); exit() gates cascade on els[0].animate
- Task 2: complete (commits abd3244..ea71cd0, review clean; fix ea71cd0 hardened FOUC gate + doc-path comment)
- Task 3: complete (commits ea71cd0..204ddc7, review clean; fix 204ddc7 realized per-line headline fade + removed dead CSS)
- Task 4: complete (commits 204ddc7..fc7fe9e, review clean)
  - Minor (Task1): unused execSync import in test; Minor (Task4): redundant reduced-motion guards (non-bug)

- Final whole-branch review: READY TO MERGE (opus). No Critical/Important. execSync minor fixed. Other minors optional/harmless.
