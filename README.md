# CHROMATRON / REBORN

A cinematic, browser-based 3D laser-puzzle prototype built with **Three.js + Vite**.

## Windows 10 / 11 — one-click start

1. Install **Node.js LTS** from https://nodejs.org/ (Node.js 22.12+ recommended).
2. From this GitHub repository choose **Code → Download ZIP**, then unzip the whole project.
3. Double-click **`Uruchom-gre-Windows.bat`** in the folder containing `package.json`.
4. On the first run, the launcher downloads npm dependencies (Internet needed); after that it starts Vite and opens the game in your browser at http://localhost:5173.
5. Stop the server with **Ctrl+C** in the command window.

If the launcher warns that port 5173 is busy, close any previously running copy first. Windows SmartScreen may prompt you about downloaded batch files; you can read the launcher in a text editor before running it. Nothing is installed system-wide apart from Node.js.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. For a production bundle: `npm run build`. No additional ChatGPT plugin is required.

The game opens on the title screen. **Play** starts the selected campaign, and
**Continue** restores the latest board and any saved placements. Use the
**Campaigns** screen to switch worlds or revisit puzzles. A bookmark with
`?play=1` opens the current board directly.

## Controls

- **Click** a movable optic on the board to select it. Clicking the same optic again does not rotate it.
- **Click a tray optic**, then click an empty tile to place it. After placement it remains selected for rotation, but no longer follows empty-board clicks.
- **Q / E** or the visible **↶ / ↷ buttons** rotate the selected optic 45° in opposite directions.
- **G** or the keyboard icon focuses the board. **Arrows** move the tile cursor, **Enter** selects or places an optic, and **Space** starts moving a selected optic.
- **Drag a placed optic** to move it; drag empty board space to orbit. **Mouse wheel** rotates the selected optic; **Shift + wheel** zooms (or just wheel when none selected). **Right-click / Escape** cancels selection.
- On a touch screen, spread or pinch two fingers over the board to zoom. For tap placement, the optic is committed when you lift your finger.
- With a placed optic selected, choose **Move** and then an empty tile to reposition it with two taps. The move can be undone.
- **V** toggles the advanced beam analyzer: exact required/received colors, absorbed rays and RGB channel labels.
- **C** opens a straight overhead view fitted between the controls. Press **C** again to return to the previous angle and zoom. Shift+wheel or a two-finger pinch still zooms in either view.
- The component tray also has a compact **RGB spectrum** inspector, independent from the detailed analyzer.
- **Ctrl+Z** undo, **Ctrl+Y / Ctrl+Shift+Z** redo, **Escape** closes the active dialog or deselects an optic. With the board idle, **Escape** opens the game menu.
- **Reset** restores the starting layout. Use **Undo** to recover the layout before reset during the current session. The draft follows the restored layout.
- **H** opens progressive hints. Three clues per puzzle; skip is offered after the final clue without awarding a solve badge.
- **PL / EN** header button changes interface and level guidance; language preference saves automatically.
- Click a movable optic in the inventory to select it. For classic-style levels, place it on an empty tile, or use **Backspace/Delete** to return to the tray.
- Navigate demo puzzles with arrows. Progress saves locally.

## Campaigns

Run **Uruchom-gre-Windows.bat** with your four Windows EXEs in `original/`.
Chromatron I opens on first launch. The level map contains all four original
50-stage campaigns and eight optional tutorials. Selecting a campaign saves
your choice for the next visit. Retail data stays on the local computer.

The Chromatron series (4 × 50 original levels) was created by Sean Barrett / Silver Spaceship Software. Official games: https://www.silverspaceship.com/chromatron/

The engine accepts validated JSON via `window.chromatron.loadLevels(levels)` for development. See [roadmap](docs/ROADMAP.md).

## Quality assurance

Run `npm run check` to execute simulation/localization/scene-lifecycle tests and build the production bundle.
All eight tutorial solutions run in CI. Local retail tests verify solutions to the 200 original puzzles.
Temporary 3D geometries and non-shared materials are now disposed after moves, reducing long-play GPU memory growth.
GitHub Actions runs the unit suite and Vite build on every push. A passing build is not yet a substitute for manual in-browser usability and GPU visual testing.

## Classic 200-level compatibility and hint credits

The localhost development and preview servers read the original files at
startup of the game page. No file picker is needed. Restart the server after
replacing the files. On a static host, **Mapa poziomów → Wczytaj oryginały**
can add privately owned games to that browser. [Compatibility and verification](docs/CLASSIC_COMPATIBILITY.md).

All 22 instruments have Blender models. The speaker button enables the
original synthesized score and interaction cues. To rebuild the instruments,
run Blender in background mode with `--python scripts/blender_optical_bench.py`.

A fair, completely offline hint wallet has been added:

- Start with **3 credits**, win **5 credits once** per genuinely solved level
  (no earning points by repeatedly resetting/replaying).
- **First hint free**, second costs **2**, third costs **3** credits.
- The four supported 50-puzzle campaigns include a hand-written opening
  observation in Polish and English. In Polish, each original opening also
  has a technique to try and a way to recognize the expected light path.
- The Polish technique leaves the tile for the player to find. The last
  clue gives a verified tile and rotation. After the opening move or a
  different player layout, the live analyzer selects the next useful step.
- Custom puzzles without a known solution use live diagnostics and bounded
  search in a Web Worker.

Textures and edges are improved with deterministic offline **PBR micro-maps**
for brushed and polished metal. The composer now includes **FXAA** in
Performance mode and **SMAA** in Balanced/Cinematic mode, ahead of tone mapping.
No texture downloads or user-paid purchases are required.

The bottom console brings equipment, move history, hints and camera controls into
one strip. Equipment portraits come from the Blender instruments on the board.
Swipe the equipment strip to see more instruments, or drag a portrait to place it.
The **Campaign** button opens an illustrated level map. Each classic campaign
shows its two worlds as separate routes through 25 puzzles.

With the four Windows executables in `original/`, run
`node tools/full-regression.mjs` to replay all 200 boards in Chromium and
export the Polish clues to `data/hints.pl.json` locally. The report and demo
screenshots go to `test-results/full-regression/`. These outputs stay local.

## Better rendering without sacrificing laptop FPS

- **GPU laser batching:** each wavelength is assembled into shared shader
  ribbons and instanced inner/outer tubes. A long route no longer makes a
  separate draw call for every tiny section of every beam layer.
- **Grounded optical hardware:** one instanced soft-contact-shadow layer
  grounds all pieces visually without expensive per-object shadow maps.
- **Adaptive optical light budgets:** the Performance, Balanced and Cinematic
  presets now scale real dynamic point lights as well as pixel ratio, bloom
  and genuine planar mirror reflections.
- **Campaigns:** four original games, 50 puzzles per game, and eight tutorials.

## Board focus and smoother camera

On desktop or laptop, use the **▣ board-focus button** or press **B**.
The puzzle information and equipment panel tuck into slim side tabs. Open either
tab with a click when needed; selecting an optic from the tray automatically
closes the tools drawer so the board is unobstructed. You can still rotate the
selected optic with **Q/E or the wheel**. Press B again to restore both panels.

When the drawers are closed the 3D board automatically grows slightly, with
a height-aware zoom limit so short laptop viewports retain the whole puzzle.
Shift+wheel zooming now uses damped motion rather than abrupt camera jumps;
reduced-motion preference disables the interpolation.

## Compact laptop and fullscreen mode

The UI now adapts to common smaller Windows laptop viewport sizes, including
1366×768, 1280×720, and the reduced CSS viewport produced by 125% display
scaling. Side panels keep their buttons in independently scrollable regions
instead of overflowing the browser. The laser board remains in view.

Use the **⛶ icon in the upper-right corner** or press **F** for fullscreen.
Use **F** again or **Esc** to exit. Fullscreen is optional: important controls
are designed to remain accessible in a normal browser window. Dedicated
Chromium UI screenshots cover compact laptops, scaled desktops, and fullscreen.

## Smoother selection and mouse-wheel rotation

- Selection uses four restrained **corner brackets** around the occupied cell, not a glow ring hiding the actual optical hardware. An on-screen angle indicator shows the selected optic's current orientation, in 45° steps.
- The program no longer rebuilds every mesh and planar mirror when selecting a piece. It updates the reticle and, when needed, moves the limited reflection render targets to whichever mirror is being inspected.
- **Mouse wheel** rotates selected optics; **Shift + wheel** zooms. Trackpad sub-detents accumulate to one step, while ordinary ~100px wheel detents remain exactly one 45° step (no unintentional extra fourth-step rotation).
- Physical mirror models smoothly continue from their current angular pose when several steps arrive together or direction reverses. The deterministic optical solver still resolves instantly.
- Lens flare sprites reuse one cached GPU texture, reducing stutter during repeated turns.
- `tests/wheel-rotation.test.js`, `tests/selection-reticle.test.js` and Chromium browser tests protect these behaviors.

## Precision 3D asset production

The project now has reusable code-generated 3D hardware:

- `src/mirror-asset.js`: machined mirror and bender frames, metal fasteners, rear carbon shield and optical direction indicator. The actual scene reflection remains separate in `src/mirror-reflections.js`.
- `src/optical-assets.js`: directional laser cooling jackets, optical collar, wavelength lens and eight-vane resonator. Parts stay aligned with the solver's eight directions.
- `docs/ASSET_BIBLE.md`: source-of-truth technical art specification, material requirements and future glTF/GLB delivery pipeline.

These are **real mesh assets generated at runtime**, not just image concepts. They work in the browser now and can later be replaced or backed with artist-produced GLB models without rewriting puzzle physics. Quality settings continue to limit expensive live reflections. The new code has unit coverage for geometry composition and orientation.

## Visual and interaction overhaul

The prototype now uses multi-layer additive shader beams with soft volumetric-style ribbons, collision flares, colored point lighting and an adjustable bloom pass. Mirror geometry is aligned with the one-sided classic optical rule: bright reflective face vs dark absorbing back. Barriers have armoured geometry and hazard marks. The interaction model explicitly separates choosing a tray optic, placing it, selecting a placed piece, dragging, and rotating — preventing accidental mirror relocation. Quality is still under active art-direction review.

## True mirrors and performance profiles

A limited number of optical reflectors now render **real planar reflections of the scene** on the silvered front face via Three.js `Reflector`; the dark back remains opaque. The reflective view is a separate GPU render target, not a photo texture. Each selected mirror is prioritized.

Use **GRAFIKA / GRAPHICS** at the bottom of the game screen:
- **AUTO** (default): balanced reflections and bloom initially, with a sustained low-FPS fallback
- **PŁYNNOŚĆ / PERFORMANCE**: no realtime mirror reflection; reduced resolution and postprocessing
- **ZRÓWNOWAŻONA / BALANCED**: one realtime reflective mirror at reduced render-target resolution
- **FILMOWA / CINEMATIC**: up to two reflective mirrors, sharper targets, higher pixel ratio

Live frame rate is displayed next to the selector. These choices affect *rendering only*, never the puzzle simulation. Placement and turning now have short ease-out 3D animations (suppressed for reduced-motion users).

More realistic appearance remains a balance of model geometry, PBR reflection, environment lighting and beam VFX. These are web-friendly render techniques, not GPU-accelerated path tracing. See [graphics notes](docs/GRAPHICS.md).

## Technical foundation

Three.js, WebGL, 15 × 15 board, 8-direction beam tracing, additive RGB bitmasks and reactive 3D beams. Original source and visuals are independent; no original level packs or artwork are included. License selection is reserved for the repository owner.

## Modernization design

See [modernization plan](docs/MODERNIZATION.md) for the spectral inspector, colorblind/accessible rendering, chapter map, visual polish, replay mode, quality presets and eventual Windows build.

Modele 22 przyrządów można obejrzeć i edytować w [katalogu Blendera](art/Instruments.blend). Zasobnik pokazuje miniatury tych samych modeli. Przeciągnij przyrząd na pole lub wybierz go kliknięciem i wskaż pole na planszy. Stałe elementy znajdziesz w rozwijanej sekcji zasobnika.

Gdy przyrządy zajmują więcej miejsca, zasobnik pokazuje strzałki przewijania. Na ekranie dotykowym przesuń palcem w bok, aby przejrzeć przyrządy, lub zacznij przeciąganie w górę, aby podnieść wybrany przyrząd.
