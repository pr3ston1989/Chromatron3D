# Rebuilding all 200 Chromatron levels: compatibility and provenance

**Status, November 2026:** Eight authored demonstration puzzles are bundled.
**Zero copyrighted original puzzle layouts are bundled.** The shipped game can
now import classic level data from a player's local files, display it on the
15×15 board, test beam routes, and run a bounded solution search. This is a
structural compatibility milestone, not proof of a faithful 200/200 remake.

## Where to get original games

The creator's site remains the authoritative source:
https://www.silverspaceship.com/chromatron/

All four freeware games contain 50 public-facing levels each. Free to play does
not imply that copyright, artwork, story text, level arrangements and embedded
assets may automatically be republished in a derivative project. Keep original
files and exports on your own computer unless distribution permission is
confirmed with the rights holder, Sean Barrett / Silver Spaceship Software.

## What the current build imports

| Source | Status | Limits |
|---|---|---|
| Chromatron 1.14 Windows EXE | **Known-address PE32 extraction** | Must be decompressed from UPX locally; verified addresses |
| Chromatron 2–4 Windows EXE | **Scan-based PE32 extraction** | Must be decompressed from UPX locally; uses structural pattern matching |
| Chromatron 1–4 extracted-data JSON | **50-level order and piece conversion** | JSON must contain `levels` and `level_order` |
| Four JSON/EXE packs in one selection | **Up to 200 local levels** | Filenames should identify game (chromatron1/2/3/4); otherwise selection order 1–4 |
| Drag-and-drop import | **Supported** | Drop .exe or .json files onto the game board |
| Arbitrary custom `levels` JSON | **Supported** | Uses the game's existing 15×15 schema |

All imports run only inside the user's browser. The original .exe or .json is
never committed to this repository or uploaded to an external server.

### How to try the first original game

1. Download Chromatron 1.14 for Windows from the official page above.
2. Copy its EXE to a separate local folder. The original uses UPX compression.
3. Unpack the **copy** with `upx -d chromatron.exe` on your computer.
4. Run the local web game, open **? Help → Import classic levels**, and select
   the unpacked `chromatron.exe`. The original 50-level table is decoded locally.
5. Verify the resulting boards against the official game; **do not assume all
   specialty interactions match yet**.

For games 2–4, either use JSON exported locally from your original installation
(`{levels:[{text,pieces:[{type,rotation,color,x,y}]}],level_order:[...]}`),
or drag the UPX-decompressed `.exe` files directly onto the game board. The
scan-based extractor searches the PE32 data sections for 5-byte level records
and does not require hardcoded addresses. Scripts and format analysis in
[chromatron-oxide](https://github.com/stared/chromatron-oxide) are useful
*technical references*; that independent project does not grant a license to
redistribute the original data.

## Classic data normalization

- Original record: 5 bytes `[type, rotation, color, x, y]`.
- Original types: `1 wall, 2 laser, 3 reflector, 4 bender, 5 filter,
  6 prism, 7 doppler, 8 splitter, 9 tangler, 10 target, 11 conduit,
  12 teleporter`. Type 0 terminates the list.
- Rotations: `0 N, 1 NE, 2 E, 3 SE, 4 S, 5 SW, 6 W, 7 NW`.
- **Original color bits:** 1=blue, 2=green, 4=red; the current 3D solver
  uses 1=red, 2=green, 4=blue. The converter swaps red and blue bits.
- Original `level_order` records the *playable* 50-level sequence. A packed
  executable can have extra unpublished level records, which must not be
  exposed as extra stages.
- Movable pieces begin in the equipment tray in classic mode. Verify special
  arrangements against the original program before asserting complete parity.

## Truthful progress on 1:1 mechanics

Implemented/partially tested: 15×15 coordinates, 8 directions, beams,
reflector front/back, wall, target additive color matching, bender, filter,
prism, doppler, splitter, conduit and line-of-sight teleporter.

**Not certified:** quantum entanglement/tangler, per-version changes in games
2–4, corner cases involving multiple overlapping rays, and reproduction of
all exact placements/solutions. For an honest "200/200" claim every level must
be compared against its original board and passed through golden-master beam
and victory tests. Avoid assigning unverifiable final hints.

## Solution verification and helpful hints

`src/puzzle-solver.js` validates **every claimed solution with the live
`src/optics.js` engine**. The eight bundled puzzles include verified known
solutions. For an imported puzzle without a known answer, a Web Worker runs
bounded ray-path search (currently supports at most two movable pieces,
20,000 checked arrangements in the UI). When the search cannot prove an
answer it returns `complex`, `budget`, `unsupported` or `unsolved` —
never a fabricated move.

`src/hint-assistant.js` uses the actual beam result and current puzzle state:

1. Diagnose an unlit or wrong-color receiver: **free**.
2. Explain what kind of optic or direction to inspect: **2 credits**.
3. Reveal a precise, in-context next action **only when a solution was
   verified** by the engine: **3 credits**.

Start with 3 credits; gain 5 on the **first** successful completion per
content-fingerprinted puzzle pack and level. Replaying, resetting and moving
the same mirror repeatedly cannot award points again. Credits and purchased
hints persist locally. Credits are not sold and cannot be purchased with
real-world money. Imported packs retain separate progress and wallet-level
solution IDs.

## Remaining engineering milestones

- Extract and verify exact layouts for each original executable individually;
  only incorporate the user's locally selected source data.
- Complete the tangler's entangled-beam simulation and reference-test all
  special optics against the original Windows game.
- Add a scalable constraint solver / SAT/SMT strategy for puzzles with more
  than two movable pieces; compute certified partial plans instead of
  exposing brute-force delays on the main render thread.
- Store validated plans per pack fingerprint, and generate 3-tier semantic
  hints from a real answer and the player's current mistakes.
- Verify all 200 puzzles 1:1 against original solutions, masks, grid orientation,
  moveable tray inventory and target colors before advertising full parity.

The current status is **importer + foundation for verified, useful hints**,
not a claim that all original puzzles are solved or included.
