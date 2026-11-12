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
