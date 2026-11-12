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

## Controls

- **Click** a movable optic on the board to select it. Clicking the same optic again does not rotate it.
- **Click a tray optic**, then click an empty tile to place it. After placement it remains selected for rotation, but no longer follows empty-board clicks.
- **Q / E** or the visible **↶ / ↷ buttons** rotate the selected optic 45° in opposite directions.
- **Drag a placed optic** to move it; drag empty board space to orbit. **Mouse wheel** rotates the selected optic; **Shift + wheel** zooms (or just wheel when none selected). **Right-click / Escape** cancels selection.
- **V** toggles the advanced beam analyzer: exact required/received colors, absorbed rays and RGB channel labels.
- **C** switches between isometric and top-down camera presets with a smooth transition (respecting reduced-motion preferences).
- The component tray also has a compact **RGB spectrum** inspector, independent from the detailed analyzer.
- **Ctrl+Z** undo, **Ctrl+Y / Ctrl+Shift+Z** redo, **Escape** deselect, **?** help.
- **H** opens progressive hints. Three clues per puzzle; skip is offered after the final clue without awarding a solve badge.
- **PL / EN** header button changes interface and level guidance; language preference saves automatically.
- Click a movable optic in the inventory to select it. For classic-style levels, place it on an empty tile, or use **Backspace/Delete** to return to the tray.
- Navigate demo puzzles with arrows. Progress saves locally.

## Current status: prototype

**The 200 original puzzles are not included yet.** Five custom demo layouts are supplied solely for testing the renderer and mechanics. The optical simulator now supports angle-gated mirrors, benders, filters, prisms, dopplers, splitters, conduits and teleporters; entanglement and exact original fidelity still need verification and implementation.

The Chromatron series (4 × 50 original levels) was created by Sean Barrett / Silver Spaceship Software. Official games: https://www.silverspaceship.com/chromatron/

The engine accepts validated JSON via `window.chromatron.loadLevels(levels)` for development. This is not a complete original-game importer. See [roadmap](docs/ROADMAP.md).

## Quality assurance

Run `npm run check` to execute simulation/localization/scene-lifecycle tests and build the production bundle.
The five independently authored demo levels have automated **golden solution tests** that confirm their authored third-tier hints can lead to a win.
Temporary 3D geometries and non-shared materials are now disposed after moves, reducing long-play GPU memory growth.
GitHub Actions runs the unit suite and Vite build on every push. A passing build is not yet a substitute for manual in-browser usability and GPU visual testing.

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
