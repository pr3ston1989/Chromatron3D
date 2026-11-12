# CHROMATRON / REBORN — Production Plan

## Product direction
- Premium sci-fi optical puzzle game, browser-first, with a potential Windows release.
- Board remains a **15×15** logical grid so optical mechanics and original layouts can be faithfully verified.
- View: cinematic orbitable 3D tactical board, rather than FPS traversal for every interaction.
- Original models, original interface, reactive lighting and restrained atmospheric audio.

## Milestones
1. **Vertical slice** — 3D scene, optics, click-to-move, rotation, camera, save progress, responsive HUD, five clearly labeled demo levels. This is the current phase.
2. **Fidelity engine** — independently validate ALL original interaction rules (reflectors, benders, filters, prisms, dopplers, splitters, entanglers, conduits, teleporters, color mixes, special cases). Add golden trace tests.
3. **Original puzzles** — verify authoritative source data for four 50-level games; design a legally appropriate user-supplied-game-data importer where distribution rights are unclear. Compare every puzzle and each game order against the source.
4. **Presentation pass** — custom PBR optics, emissive material and bloom, contact shadows, particle scattering, subtle camera transitions, level-completion effects, audio, accessibility.
5. **Polish and distribution** — tutorial, controller support, undo, settings, rendering profiles, automated browser tests, desktop packaging.

## Fidelity caveats
The public repository currently does not distribute 200 original puzzle definitions. The demo levels are original placeholders. The experimental renderer and ray engine are not yet feature-complete relative to Chromatron and must not be marketed as a perfect recreation. Do not silently substitute generated puzzles for originals.

## QA standards
- Each imported level has source hash, expected piece count, order, and a verified working solution.
- Bit-exact RGB mixing and 8-direction beam tracing tested against golden baseline.
- Undo / redo and level persistence tested across reload.
- No hard-coded light paths; simulation is recalculated from the board state.
- Desktop 60 FPS target on midrange GPUs; graceful quality reductions and keyboard usability.

## Legal / attribution
Original Chromatron puzzle arrangements are credited to Sean Barrett / Silver Spaceship Software. Source code and artwork in this new game should remain independently authored. Verify rights before redistributing original level data; importing a user's own legally obtained copy is an alternative.
