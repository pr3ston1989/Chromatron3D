# Modernization without diluting the original Chromatron

## Core promise
Preserve the complete original 4 × 50 puzzle sequence, exact optical interactions, piece inventories, and win conditions where rights/source permit. The surrounding presentation, progression, quality of life and accessibility should feel like a new premium game—not an unfaithful remake.

## Immediate improvements (now / next)

| Feature | Benefit | Priority | Status |
| --- | --- | --- | --- |
| Polish + English | Full interface and authored level guidance in both languages | P0 | Prototype implemented |
| Three-tier hints | Gentle clue → geometric direction → actionable move; optional skip | P0 | Implemented; local retail levels advance the third tier from a verified trajectory |
| Undo / redo | Experiment fearlessly; keyboard shortcuts and HUD | P0 | Prototype implemented |
| Hint focus highlight | Clear in-world marker for the suggested cell | P0 | Prototype implemented |
| Puzzle validation | Each shipped puzzle has at least one tested winning configuration | P0 | 8 tutorials in public CI, 200 original puzzles in local retail tests |
| Correct original toolbox behavior | All movable pieces start in the tray; place/return/rotate | P0 | Pending |
| Original 200 puzzles | Legal source verification, importer, exact order and gold solution tests | P0 | Pending |

## Premium game-feel (next production milestones)

### 1. Optical laboratory
- PBR models for each optic, a distinct silhouette and material for each class.
- Dynamic laser glow, additive color overlays and bloom, subtle refractive prism shader.
- Cinematic board transitions and immediate visual feedback on every successful reflection.
- Responsive zoom/orbit camera, preset tactical/top-down and cinematic angles, reset camera.
- Clearly visible laser intersection colors; never alter the physical rules for prettier visuals.

### 2. Spectral Inspector
A deliberate *educational HUD overlay* can identify a selected beam's RGB components, direction and any transformations. Proposed controls: hold **Tab** to show beam labels, click a resonator to show required versus received spectrum. Especially useful for color blindness.

### 3. Progression without dead ends
- World/episode selection for four 50-level sets with level preview and completion status.
- Solved / skipped / solved without hints (no hard gates behind achievements).
- Optional bookmarks, save-and-resume, and instant retry.
- Once the original rules and levels are integrated: **automated hint solver**, or curated per-level paths, so hints refer to the current *board state*, not only the untouched initial setup.
- Optional complete solution replay; only from a verified solution, clearly marked as a reveal.
- Automatic save and optional undo across levels.

### 4. Accessibility first
- High-contrast palette and a color-blind overlay using shapes and text labels, **not color alone**.
- Remappable keys, large-text UI, full keyboard navigation and screen reader labels.
- Reduced motion, disable flashing, audio on/off and separate mixer sliders.
- Graphics presets (Battery/Performance/Balanced/Ultra) with adaptive pixel ratio.
- Polish and English narration/subtitles if voice assets are later added.

### 5. Optional extras, never blocking main campaign
- A photo mode, elegant replay of the final solution and shareable board snapshots.
- A sandbox lab for experimenting with optical parts beyond the campaign.
- After the complete 200-original campaign: bonus, independently authored puzzles.
- Native Windows distribution via a desktop shell using the same Three.js game.

## Product boundaries
- **No forced FPS walking** for basic board manipulation; the puzzle remains in focus.
- No energy system, microtransactions, pay-to-skip, timers that gate progress, or endless grind.
- Hints do not change the physical board or mark a puzzle solved.
- Skipping must not falsely grant a solution badge.
- Experimental features have no impact on original levels without player opt-in.
- Do not present demonstration levels as any of the 200 classics.

## QA gates
1. CI tests and Vite build passing.
2. Browser smoke-test (desktop and mobile layout), no console errors.
3. Baseline trace/solution parity with a legally obtained original game.
4. Rendering performance on entry-level laptop and high-end desktop.
5. Accessibility audit and bilingual copy review.
