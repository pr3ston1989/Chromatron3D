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

- **Click** a movable optic to select.
- **Click** an empty tile to move it.
- **Q / E** rotate by 45 degrees; click the selected optic again to rotate.
- **Drag** to orbit; **mouse wheel** to zoom.
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
The five original demo levels have automated **golden solution tests** that confirm their authored third-tier hints can lead to a win.
Temporary 3D geometries and non-shared materials are now disposed after moves, reducing long-play GPU memory growth.
GitHub Actions runs the unit suite and Vite build on every push. A passing build is not yet a substitute for manual in-browser usability and GPU visual testing.

## Technical foundation

Three.js, WebGL, 15 × 15 board, 8-direction beam tracing, additive RGB bitmasks and reactive 3D beams. Original source and visuals are independent; no original level packs or artwork are included. License selection is reserved for the repository owner.

## Modernization design

See [modernization plan](docs/MODERNIZATION.md) for the spectral inspector, colorblind/accessible rendering, chapter map, visual polish, replay mode, quality presets and eventual Windows build.
