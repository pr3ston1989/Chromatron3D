# CHROMATRON / REBORN

A cinematic, browser-based 3D laser-puzzle prototype built with **Three.js + Vite**.

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
- **Ctrl+Z** undo, **Escape** deselect, **?** help.
- Navigate demo puzzles with arrows. Progress saves locally.

## Current status: prototype

**The 200 original puzzles are not included yet.** Five custom demo layouts are supplied solely for testing the renderer and mechanics. The optical simulator currently supports basic mirrors, filters, splitters, walls and color bitmasks; all special optic rules must be verified and implemented before the game can claim full fidelity.

The Chromatron series (4 × 50 original levels) was created by Sean Barrett / Silver Spaceship Software. Official games: https://www.silverspaceship.com/chromatron/

The engine accepts validated JSON via `window.chromatron.loadLevels(levels)` for development. This is not a complete original-game importer. See [roadmap](docs/ROADMAP.md).

## Technical foundation

Three.js, WebGL, 15 × 15 board, 8-direction beam tracing, additive RGB bitmasks and reactive 3D beams. Original source and visuals are independent; no original level packs or artwork are included. License selection is reserved for the repository owner.
