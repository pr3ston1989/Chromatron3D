# Chromatron I–IV on the 3D board

In **Mapa poziomów → Wczytaj oryginały**, select the four Windows game executables.
The importer reads the packed NRV2B streams, level tables and playable order
in a local Web Worker. It also accepts previously unpacked files and level
JSON. Each part appears separately in the atlas. The browser keeps the
decoded stages locally so players can switch campaigns and resume after reload.
Clearing site data removes that library and its progress. The source EXEs,
original artwork, stage names and layouts are excluded from the distribution.

## Verification on the four supplied Windows releases

| Game | Playable slots loaded | Initial boards unsolved | Verified winning placements |
|---|---:|---:|---:|
| I | 50 | 50 | 50 |
| II | 50 | 50 | 50 |
| III | 50 | 50 | 50 |
| IV | 50 | 50 | 50 |

Run `node --test tests/classic-retail.test.js` with the four locally owned
files in `original/`. The public CI skips these private-file cases and runs
synthetic decoder and optical regression fixtures. Playable order comes from
each release's own 50-slot table. Published slots can point beyond record 50.
The parser reads only the referenced records on the known builds.

The original records store placements. In part I, slot 16, one stored mirror
does not win in its recorded position. The worker tries single-piece repairs
and keeps the first arrangement that lights all receivers. Exact hints for
all four packs use solutions rechecked by gameplay physics. Ordinary imports
retain their source game for version-dependent prism and splitter rules.
The eight tutorials and generated campaign retain their authored colour rules.

## Optical coverage

The 22 kinds include fixed and mobile portals, both benders, a two-sided mirror,
multi-filter, twister, complementor, starburst, two logic gates and a transparent
occupied square. Paired tangler rays can revisit a cell while their partner
changes colour. Complementors aggregate incoming colours per direction.
The engine repeats gate passes and disables a complementor when its own
feedback contradicts its earlier input.

The independent local remake's simulator notes provide expected initial and
winning outcomes, the first game's anomalous record and specialty-device cases.
Winning placements demonstrate solvability in this engine. Full beam-by-beam
equivalence for arbitrary player moves and pathological feedback loops remains
unverified. The tracer has work limits and withholds victory on truncation.

Original game design and level data belong to Sean Barrett / Silver Spaceship
Software. The player supplies the files. No original layouts are included here.
