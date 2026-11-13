# CHROMATRON / REBORN — Web Graphics & 3D Asset Guide

## Target

A premium optical laboratory that communicates its puzzle rules at a glance.
High-impact energy VFX must not obscure mirrors, cell boundaries, targets or controls.
Browser-first and compatible with a future Windows wrapper without reauthoring the scene.

## Technology

- Three.js + WebGLRenderer (current engine): physically based mesh materials, an environment map, bloom and animated GPU particles.
- Silvered mirror *front*: actual dynamic planar scene reflection using `Reflector`; *back*: dark nonreflective panel. The beam solver independently enforces one-sided reflection. The visual face normal follows that rule.
- CPU-friendly logic on 15 × 15 cells; static cells are GPU-instanced.
- Selected optic animation uses eased geometry transforms; puzzle logic settles instantly.
- No camera/laser logic is hidden in materials or effects, so switching off effects does not change solutions.

## Quality & smoothness

| Mode | Pixel ratio cap | Planar mirror count | Reflection texture | Bloom |
|---|---:|---:|---:|---:|
| Performance | 1.00 | 0 | — | light |
| Balanced | 1.35 | 1 | 160×160 | moderate |
| Cinematic | 1.80 | 2 | 320×320 | richer |
| Auto | balanced initially | adapts | adapts | adapts |

Auto degrades only after sustained low frame rates, not after one slow frame or background tab. Recovery has deliberately larger hysteresis to prevent GPU resource churn. Every quality switch tears down and rebuilds offscreen mirror targets cleanly; the visual selection stays in the same logical cell.

## Sky composition and distant activity

The four biome palettes (orbital, verdant, polar, nebula) now also vary the
planet position, ring orientation, cloud arrangement, and sky rotation per
level. Variants use a seeded layout: revisiting a level within the same
session restores its composition, while a new session can choose a different
one. The stage and all optical pieces keep their exact 15×15 positions.

Each backdrop has four lightweight, reusable distant drifters with biome-
specific silhouettes (orbital craft, floating spores, ice-like shards, or
crystalline debris). Only 1 / 2 / 4 are visible in Performance / Balanced /
Cinematic, respectively. Their motion is disabled when the OS requests
reduced motion. Their orbital tracks stay far outside the gameplay space,
never participate in optical collision tests, and allocate no new geometry
when changing levels. Starfields and clouds likewise reuse their buffers.

## Structural variation outside the puzzle

A seeded, four-way station layout changes how many distant docking arcs
and external landing decks appear around the floating instrument. Orbital
regions look more industrial; overgrown regions have fewer surviving docks,
and polar/crimson variants sit between them. Docking structures stay at
least 19 world units radially from the board center; rotating the scenery
around the platform does not touch any of the 15×15 optical cells.
Only visibility and orientation change between levels, with zero mesh
creation per level. Returning to the same pack, level and session seed
restores the same composition.


All coordinates are local to a 1.3-unit grid tile, with Y as vertical.

| Asset | Distinct appearance | Suggested geometry and PBR |
|---|---|---|
| Laser emitter | A visible front aperture, barrel and focusing lens | Dark anodized aluminum; ring-shaped emissive accents and a glass lens |
| One-sided mirror | Tall silvered rectangle, obvious dark back, clear orientation | Mirror plane about 0.91×0.68, supported by a chamfered steel holder; real front reflection in high modes |
| Barrier | Heavy, fully opaque blast-block | Dark cast metal with inset panels and non-emissive safety stripes |
| Target | Circular receiver and energized crystal | Glass prism, metal ring, glowing active state; objective color visible even when unlit |
| Prism | Transparent tapered optical wedge | Low-roughness dielectric (IOR ≈1.5), distinct three-sided silhouette |
| Filter | Tinted transparent slab | Color-coded glass; no reflective silver front |
| Splitter | Semitransparent optical slab with two clear beam ports | Thin silver rails and an unmistakable beam-splitting motif |

### Production-ready asset conventions (future .glb files)

- **Format:** glTF 2.0 Binary (`.glb`). Keep source files independent (Blender or other modeler).
- **Origin:** bottom center of the component base. Forward for a mirror is its **reflective front**; include clearly named `reflective_surface`, `dark_back`, and `hit_volume` objects.
- **Materials:** use metallic/roughness PBR; texture sets should be baked and compressed for web. Materials should carry meaning—do not put broad emissive strips on the mirror glass itself.
- **Textures:** suggested max 1024×1024 per game-critical optic; share trim and metal atlases. Always verify actual browser GPU memory.
- **Geometry:** use 2–6k triangles for a device before LOD; the integrated prototype uses procedural meshes but will accept model replacement without changing the physics.
- **Animations:** rotation and movement use the game's existing transform easing. Avoid baked animation of a model's entire world position; it must still snap to exact puzzle cells.
- **Reflection plane:** attach the dynamic Reflector only to the single front face; never render real mirrors on both sides.

## Verification

Automated checks: `npm test`, `npm run build`, and `npm run test:e2e`.
Review in desktop Chromium and at phone widths; compare screenshots from GitHub Actions. A successful GPU software-rendering smoke test does not guarantee 60 FPS on every GPU; test the final quality modes on real Windows machines.

## Original levels

The five included levels are **independently designed demonstration puzzles**, not reproductions. No original Chromatron puzzle layouts are distributed. The intended 4×50 classic level campaigns are a separate fidelity milestone and require verified authorized layout data and rule-by-rule compatibility tests.
