# Chromatron 3D — autonomous iteration guide

The project owner has authorized incremental improvements without requiring
individual approval for ordinary code edits. This applies to every agent working
in this repository when explicitly tasked to continue work. It does **not**
authorize perpetual background execution, paid services, external
communications, redistribution of someone else's protected game data or
destructive repository operations.

## Mission

Build a beautiful, fast, browser-first 3D optical puzzle game in Polish and
English with faithful Chromatron-like physics. Prioritize laptop usability,
accessible controls, readable optics, trustworthy hints and ultimately verified
support for 50×4 original game puzzles loaded from user-owned local files.

## Continue autonomously

1. Read recent commits, workflow results and failure logs.
2. Identify the most important visible or gameplay flaw, then work on one
   cohesive improvement. Prefer measurable improvements over speculative
   rewrites.
3. Add or refine automated tests for the change, including small laptop
   viewports (1366×768, 1280×720, and CSS 1093×614 scaled).
4. Implement, run local tests/build when available; push/commit to main only
   with a clearly named, reversible change.
5. Check CI; fix regressions and test assumptions. Avoid stacking unrelated
   features while the build is red.
6. Keep documentation updated. Report completed work honestly, including
   limitations and any tests still in progress.

Do not pause for routine sign-off between safe, incremental improvements. Ask
the owner only when there is a product decision requiring a preference, a
license or rights question, expenditure, credential, destructive operation,
security-sensitive change or truly irreversible architectural decision.

## Graphics guardrails

- The 15×15 logical beam board must remain unobstructed by scenic decoration.
- Premium sci-fi optical instruments; soft reflections, detailed PBR metal
  and glass, mood through fog, space backgrounds and efficient instanced VFX.
- Reuse procedural geometry and shared materials, never allocate new GPU
  textures per wheel notch. Remove / dispose per-level buffers when needed.
- Respect reduced motion. Render Performance / Balanced / Cinematic modes and
  avoid heavyweight cinematic effects on integrated GPUs.
- Keep side panels accessible in laptop focus mode and hover help accessible
  through keyboard focus / a persistent selected-optic information panel.

## Solver and original-level guardrails

- Bundled demo puzzles are independently authored; never mislabel as original.
- The source original Chromatron games contain 4×50=200 levels. Original
  arrangements and executables are not bundled; import user-owned local files
  and keep them private.
- Verification must compare physics against original reference behavior
  before a 200/200 parity claim. Tangler, Doppler, teleporter, colors and
  multi-source additive effects need golden-master cases.
- Only display exact coordinates and rotation in hints if verified by the
  current optical solver. The solver must yield honest incomplete/budget
  statuses instead of guessing. Never freeze gameplay while searching.
- Local hint wallet costs 0/2/3 credits for stages 1/2/3, starts with 3
  and awards 5 exactly once per finished puzzle. Keep per-pack progress.

## Safety and review boundaries

Small scoped commits should preserve a green CI workflow. Do not rewrite
history or delete levels/branch/user work. Do not add analytics, telemetry,
monetization or collect user-uploaded game data. No commercial redistribution
of original Chromatron content without rights clearance.

Current roadmap and detailed original-data compatibility status:
[docs/CLASSIC_COMPATIBILITY.md](docs/CLASSIC_COMPATIBILITY.md).
