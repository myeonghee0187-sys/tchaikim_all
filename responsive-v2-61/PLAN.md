# Responsive Art Direction V2 — 61 requirements

Starting HEAD: `fbed57a53f2d9205e4c790b15b1258cc97e89485` (`최종 QA 3차`).
Starting worktree: clean. No commit/push. Desktop >=1280 is locked.

1. Before capture: eight pages at 1920 / 1024 / 390, full page and changed sections.
2. Main Tablet: T-M1–6, preserve Mobile and Desktop.
3. Brand: T-B1–10 / M-B1–10. Replace peek Mood with infinite single image;
   mobile KYJ carousel; simple Heritage; cleanup old responsive lifecycle.
4. Bespoke: T-BS1–7 / M-BS1–3. Preserve Process/Materials controllers.
5. Reservation: M-R1–2. Three visible options and aligned select.
6. Shop: T-S1 / M-S1–6 and actual motif section (see mapping note).
7. Collection ×2: T-C1–5 / M-C1–4. Horizontal visual depth matches swipe.
8. Shop Detail: T-SD1 / M-SD1–6. Crop, editorial composition, concise copy.
9. Visual refinement, 13 widths, desktop baseline, 2 resize round trips,
   touch/keyboard/reduced motion, reservation flow, final report.

Selector mapping discovered in repository: `motif_video_media`,
`motif_reference_copy`, `motif_reference_image` exist in Shop only, not either
Collection. T-C4/T-C5 will be applied to that existing Tablet section rather
than creating nonexistent Collection content. Report this explicitly.

Acceptance is pending until browser verification; old 33/33 evidence is not
counted as evidence for the new requirements.
