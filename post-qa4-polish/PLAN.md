# Narrow-scope visual polish after QA4

Starting HEAD: `0bb829963e6c9bb91b2b813225f4b2938f13816e` (`최종 QA 4차`).
Starting worktree clean. No commit/push. Desktop >=1280 hard lock.

1. Capture HEAD: Shop / Brand / Bespoke / Collection x2 at 1920, 1024, 390.
2. Shop catalogue only: shared two-column slots, image ratio, type and spacing.
3. Brand: generate three high-resolution responsive-only Mood assets; keywords,
   compact gradient, Tablet titles, same-frame Heritage scroll fade.
4. Bespoke: expand existing Mobile button move/hidden sections to Tablet.
5. Collections: hide compact Showcase nav; Tablet As Worn image-only.
6. Review before/after images and refine. Test 10 widths, Desktop baseline,
   controls, boundary/resize lifecycle, reduced-motion and actual overflow.

Do not edit Main, Reservation, Done, Intro, Shop Detail or common components.
Do not change Brand KYJ Tablet image composition, tabs controller, Atelier;
Collection Archive/year/deck; Bespoke Quote/Process/Materials/Begin/Reservation.

Image generation uses the built-in tool, not a CLI/API fallback. Save original
generated PNGs and web-optimized copies in the Brand image folder. Prompts and
provenance will be included in the final report.
