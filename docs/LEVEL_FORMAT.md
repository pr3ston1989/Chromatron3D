# Level interchange schema

Chromatron / Reborn uses a JSON representation of a 15×15 grid.

```json
[
  {
    "title": "MY LEVEL",
    "description": "Aim the beam at the exact color target.",
    "pieces": [
      ["laser", 2, 7, 2, 4],
      ["mirror", 7, 9, 0, 0],
      ["target", 7, 3, 0, 4]
    ]
  }
]
```

Each piece is `[type, x, y, rotation, color]`. Positions range 0–14. Directions are 0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW. Colors use additive RGB masks: 1=red, 2=green, 4=blue, 3=yellow, 5=magenta, 6=cyan, 7=white.

Allowed types: laser, target, mirror, wall, filter, splitter, prism, bender, doppler, conduit, teleporter. The latter four are **not yet accurately simulated**. The original game has additional features (including entanglers) to be introduced alongside verified interaction rules.

Import in the browser developer console with `window.chromatron.loadLevels(yourLevelArray)`.

## Fidelity requirements

The official games have 200 total puzzles across four titles; source layouts, progression, component inventories and rules need separate verification. The initial prototype only supports placing existing optics. Later versions must support the original toolboxes and piece counts. Do not treat this interchange format as a verified original-game data format.

## Localization, guided hints and classic toolbox

A level may use localized text objects in `title`, `description` and `hints`:

```json
{
  "title": {"pl": "Pierwsze światło", "en": "First Light"},
  "description": {"pl": "Skieruj światło do rezonatora.", "en": "Send light to the resonator."},
  "hints": [
    {"pl": "Spójrz na kierunek lasera.", "en": "Look at the emitter direction."},
    {"pl": "Poszukaj miejsca na lustro.", "en": "Find a spot for the reflector."},
    {"pl": "Ustaw lustro na przecięciu.", "en": "Place the mirror at the crossing."}
  ],
  "hintFocus": {"x": 7, "y": 7},
  "startMovablesInTray": true,
  "pieces": [
    ["laser", 2, 7, 2, 4], ["mirror", 7, 9, 0, 0], ["target", 7, 3, 0, 4]
  ]
}
```

`startMovablesInTray: true` places all movable devices into the optical toolbox when the level starts. Click their toolbox row to select, click an empty board tile to place and use **Backspace/Delete** or the **Return to tray** button to put the selected device away. Demonstration levels currently leave movables on the board so the authored hints refer to a consistent starting configuration.

The 3-stage guidance is optional, saved per puzzle, non-punitive and allows skipping at stage 3. Skipping a level does not mark it solved. Original 200 puzzle integration requires exact source verification and user-data rights review; no original layouts ship yet.

**Color encoding warning:** the browser prototype uses red=1, green=2, blue=4. The original Chromatron data format documented in reverse-engineered sources uses blue=1, green=2, red=4. An original-data importer must convert the masks to preserve the intended beam and target colors.
