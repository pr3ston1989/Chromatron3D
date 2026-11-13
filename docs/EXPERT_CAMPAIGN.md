# Expert campaign: 50 machine-verified puzzles

The **expert campaign** is a separate, independently authored 50-level pack
built to extend the eight demonstration puzzles. It is available from **Mapa
poziomów / Level map → EKSPERT · 50**; its progress is stored under its own
pack fingerprint, so it never overwrites the prototype or imported packs.

These layouts are original. They use the Chromatron *piece vocabulary* —
reflectors, benders, filters, prisms, Dopplers, splitters, conduits,
teleporters and tanglers — but no original level arrangement is copied. The
classic 200 layouts remain unshipped.

## Chapters

| # | Chapter (PL / EN) | Focus | Levels |
|---|---|---|---|
| 1 | REFLEKSY / REFLECTIONS | routed mirror chains, tight walls, one baffled launch | 1–10 |
| 2 | ZGIĘCIA / BENDS | benders, mixed mirror/bender optics, twin emitters | 11–20 |
| 3 | ROZDZIELENIA / SPLITS | splitters feeding two targets, constrained arms | 21–30 |
| 4 | WIDMO / SPECTRUM | Doppler shifts, filters and prism dispersion | 31–40 |
| 5 | SPLĄTANIE / ENTANGLEMENT | tanglers, teleporters, additive white/magenta/cyan targets | 41–50 |

Every level moves 3–5 optics from the tray. Boards are 15×15 and carry
between 13 and 30 fixed walls/conduits; later chapters combine more colours
and more simultaneous beams.

## What is guaranteed

Each level ships with `solution: [{index,x,y,rot}, …]`, and CI verifies that
every shipped solution wins under the **same engine used by gameplay**:

- `validateLevels()` accepts all 50 (unique cells, legal types, 0–14 grid).
- `verifyPuzzleSolution()` reports `valid`, `won`, no truncation, no
  unsupported interactions, and the exact target colour.
- The untouched board does **not** already win.
- Every movable optic is used; a solution cannot silently omit one.
- Three bilingual hint tiers (PL/EN) exist for every level. The first two are
  authored; the third names the first move of the verified route, and the live
  hint assistant advances it from the player's current board state.
- No level has a winning layout that omits one optic within a bounded search
  (300,000 solver checks per level, plus wall-hardening during generation).

The bounded search is a strong regression gate, not a mathematical proof of
unique solutions. It is intentionally re-run in the generator, not on every
unit test, because it is expensive.

## Generation pipeline

The campaign is built from routes, never hand-painted boards:

```
scripts/generate-expert-levels.mjs   roster + bilingual titles/hints
scripts/design/core.mjs              seeded RNG, solver, shortcut search, hardening
scripts/design/families.mjs          route-first family builders (turn/twin/splitter/prism/tangler/teleporter/additive)
src/optics.js                        the renderer-independent engine used for every check
```

Regenerate the whole pack with:

```bash
npm run generate:expert
# equivalently: node scripts/generate-expert-levels.mjs
```

It writes `src/expert-levels.js` (`EXPERT_CHAPTERS`, `EXPERT_LEVELS`) and takes
roughly 8–12 minutes on a laptop; each level gets up to 40 seeded attempts.
Useful flags:

```bash
node scripts/generate-expert-levels.mjs --limit=3 --out=/tmp/sample.js
```

Seeds derive from the roster number, so repeated runs are deterministic as
long as the family builders and roster stay unchanged. If you edit a roster
entry, re-run the full generator and then `npm test`; a level is never
accepted because "it looks right" — only because its route, solver and
shortcut gates pass.

## Design notes

- **Route-first.** A laser is placed, a turn/event route is walked, the target
  is dropped at the route's exit, and only then are movable optics assigned.
  That is why every emitted solution is provably playable.
- **Families** enforce different optical events, so the pack cannot collapse
  into 50 mirror mazes. The roster fixes the chapter and mechanic mix, not a
  single template.
- **Hardening** blocks each discovered one-optic-omitting shortcut with a wall
  that is never on the authored path. If hardening cannot block a shortcut,
  the attempt is discarded.
- **Baffled launches.** Many levels place an absorbing wall beside the emitter
  so the first movable optic must sit directly in the beam. A handful of
  levels deliberately route freely instead; variety is part of the roster.

## Adding a level

1. Add a roster entry in `scripts/generate-expert-levels.mjs` with `ch`, `n`,
   `pl`, `en`, `dp`, `de`, `build` and family options.
2. Give it a distinct title and a description that matches the actual
   mechanic and target colour.
3. Run the generator and `npm test`.
4. Play it in the browser with **npm run dev** → Map → EKSPERT. Check that the
   first two hints are true for the untouched board and that the third hint's
   coordinates match the real first solution move.

If a level cannot be generated, do not lower the gates to force it through.
Change the family options (fewer turns, different colour, more walls) or move
the idea to another family.
