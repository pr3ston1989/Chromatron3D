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

### Asset conventions (optical component GLB integration is a future milestone)

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

## Premium 3D biome monuments (baked GLB)

Unlike the previous scattered primitive debris, the scene now includes four
**original, authored geometry assets** stored as actual glTF 2.0 binary files
under `public/models/biomes/`:

| Biome | GLB asset | Identifiable silhouette |
|---|---|---|
| Orbital shipyard | `orbital.glb` | A large suspended cargo gantry with an industrial bridge, warning lights and hanging reactor |
| Overgrown station | `verdant.glb` | A damaged ancient technical arch overtaken by full-sized sculpted leaves, hanging roots, vines and moss |
| Frozen observatory | `polar.glb` | Tall angular ice spires on a research foundation with a ringed signal array |
| Crimson nebula | `nebula.glb` | A prominent crystal reactor, large suspended ring structures, resonant columns and glowing satellites |

Assets include 6–7 distinct metallic/roughness PBR materials, authored
normals and some emissive accents. All geometry is baked in the GLB
files; the browser no longer builds those large prop meshes with
Three.js geometry constructors. The original authored source is
`scripts/generate-biome-models.mjs` (regenerate using
`node scripts/generate-biome-models.mjs`). The generator is deterministic,
uses no network service and does not require an extra npm dependency.

`GLTFLoader` fetches **only the active biome's asset** and caches its loaded
model. Changing levels within the same biome repositions shared meshes;
switching back does not refetch or recreate GPU resources. Three material/
geometry references are reused among 2 / 3 / 4 visible sculptures for
Performance / Balanced / Cinematic modes, respectively. The rendered
monuments stand on the non-interactive exterior around the 15×15 board.
They never enter the optical collision or raycasting data.

The small previous procedural rim clusters have been cut back dramatically:
12 / 26 / 45 sparse surface stains and 0 / 8 / 18 little rim props
remain at the three graphics settings. Their only purpose now is secondary
weathering—not the main focal point. If a GLB is missing, these lightweight
existing surroundings remain visible and gameplay is unaffected.

The four bundled assets total less than 1 MB and load on demand. The
optical parts and imported source data are untouched. To keep the scene
readable on low-power machines we use no extra real-time shadow map,
fog volume, reflection pass or particle simulation for the monuments.
The real asset geometry and materials are checked in unit tests and loaded
by Playwright in Chromium.

## Patinated board surfaces

The 15×15 **logical** grid is unchanged, but the existing two instanced
rendering layers (tiles and inlaid seams) get independent, seeded colors for
each cell and each level. These are written into per-instance colors on the
already cached meshes, with no new textures, geometry, lights or draw calls.

- **Orbital shipyard:** brushed metallic panels and regular plate joins.
- **Overgrown station:** matte, weathered metal with green patina concentrated
  near the outer two rows, leaving the central laser route comparatively calm.
- **Frozen observatory:** smoother, reflective panels and bright, irregular
  frost-like seams along the edges.
- **Crimson nebula:** deeper metal with subtle diagonal crystalline veins.

The finish also adjusts only the existing board surface and chassis material's
roughness/metalness when the biome changes. Each map is deterministic for the
same pack, level and session seed, and is different for other levels. The tile
collision model, optical solver, hit targets and ray paths remain untouched.

## Biome-linked stage arrival and level atlas

The level map previews each **unlocked** stage's session-selected environment
(orbital shipyard, overgrown station, frozen observatory, or crimson nebula)
using the same palette and deterministic biome shuffle as the live scene.
Locked levels remain unnamed and reveal no puzzle content.

Opening a new level now briefly displays the localized puzzle title, stage
number, actual biome name, and whether it is a **new puzzle**, a **resumed
draft**, or a **replay** of a solved level. The scene gets a matching color-
coded scan/edge frame for about 2.5 seconds. The introduction cannot capture
mouse, touch, or keyboard input, and no new WebGL geometry, shader passes,
textures, or scene rebuilds are involved beyond normal level loading.

A quick reset does not replay the intro: it only resets puzzle state. Players
who request reduced motion see no arrival animation, while the standard mission
panel continues to display the permanent title. The card and opening overlay
follow the currently selected language, and do not store further player data.

## Midground set dressing: phase 1 of the living-scene plan

The four existing hero monuments are now accompanied by **eight additional,
distinct 3D assets** baked into real GLB files. The first pair are industrial
maintenance modules, the second botanical facilities, the third frozen research
equipment, and the last crystalline reactor machinery:

| Biome | Distinct midsize GLB assets |
|---|---|
| Orbital shipyard | `orbital-dock.glb` (cargo dock and stacked containers), `orbital-comms.glb` (lattice signal mast and antennas) |
| Verdant station | `verdant-greenhouse.glb` (reclaimed glasshouse with foliage), `verdant-root-tower.glb` (root-wrapped memory pillar) |
| Polar observatory | `polar-bridge.glb` (frozen relay bridge), `polar-geolab.glb` (arctic research cabin and radar) |
| Crimson nebula | `nebula-resonators.glb` (two harmonically coupled spires), `nebula-wreckage.glb` (levitating broken hull and crystal fragments) |

All are authored offline and generated from
`scripts/generate-midground-models.mjs`. Run
`node scripts/generate-midground-models.mjs` to rebuild exact binary assets.
Like the hero assets, the modules contain baked normal vectors and several
distinct PBR materials. The browser fetches only the current biome's two GLBs;
both remain cached when switching levels. Up to ten scene sockets are arranged
by `src/scenic-composition.js` in deterministic, non-random-looking groups
between hero monuments, far outside the 15×15 board.

Performance / Balanced / Cinematic show 3 / 6 / 10 midsize modules respectively
on top of the existing 2 / 3 / 4 hero sculptures. The layout changes by
pack, level and environment seed, while mesh buffers and materials are shared.
When one GLB is unavailable, the other compatible biome asset temporarily
fills those sockets; raycasts, puzzles and solver are never affected.

The full staged plan, including larger distant structures, layered nebula
depth, animated ambient world activity and screenshot review criteria, is
recorded in [LIVING_SCENERY_PLAN.md](LIVING_SCENERY_PLAN.md). Stage 1 ships
the new asset vocabulary and compositions. The far-field and animation
chapters require separate testing and visual review: their completion should
not be inferred from the midground PR.

## Physical laser absorber walls

Previously, beams that reached the last cell simply disappeared. The optical
solver still computes the exact same puzzle outcomes, but now additionally
reports a list of `boundaryHits` at the outer surface of the 15×15 grid
(half a cell beyond the final cell centre). The laser renderer extends its
cached ribbons and photons to these points and shows a small impact flare.

A new biome-tinted **continuous perimeter absorber** gives this ending a
physical cause: sixty overlapping armored wall panels with inset black
collector lips, sixty low-power guide strips, robust corners and support ribs.
The wall is a reusable instanced asset parented to the floating stage, outside
the selectable optics geometry. All four side walls remain visible across
levels. They consume no additional dynamic lights and cannot alter mirror
behavior, target activation, rewards or level imports.

## The world has a real ground layer — four curated biomes

`src/terrain-biomes.js` supplies four **broad surface courtyards** around
the floating optical board (the ground starts outside the structural rim at
approximately 13 world units). Unlike the former disconnected dust particles,
these surfaces give each environment an actual visual foundation.

Each biome has a distinct, repeatable CPU-authored **128×128 RGBA texture**,
cached as a WebGL `DataTexture`. This includes multi-frequency weathering and
large-scale material patterns, not downloaded stock assets:

| Biome | Surface treatment | Three instanced 3D set-dressing layers |
|---|---|---|
| Orbital | Painted, scratched plate joins | Large rubble, maintenance crates, strips of deck hardware |
| Verdant | Mossy stone and broad living growth | Rock boulders, rounded moss mounds, tall grass |
| Polar | Frosted, blue-white ice and snow | Icy boulders, tall faceted shards, small frost clumps |
| Nebula | Dark volcanic mineral and brighter glowing seams | Broken stone, large purple crystals, energy growth |

Substantial courtyards and foundation slabs wrap around the board without
touching the puzzle 15×15 grid or changing the optics. Placement is clustered
around meaningful scene hubs, not uniformly randomized. The entire biome
terrain is cached once and the existing shuffle orbits it with the biome.

The 3D set dressing uses just **three instanced draw calls** per active
biome, irrespective of the number of rocks, crystals, or grass tufts:
`Performance` 14/24/35, `Balanced` 30/52/80, `Cinematic` 48/90/135
major rocks / biome features / vegetation details. Ground stays visible
in every mode; optional details thin out with quality to preserve framerate.

No user-uploaded textures are accessed. The stage, imported puzzle files,
save data, laser solver and raycaster are unchanged.

## Radiant binary stars and a recognizable asteroid belt

The old nearly empty sky is supplemented with an independent, cached
`src/celestial-vista.js` layer. Every biome has **strongly luminous suns**,
often a colorful binary star pair, with a sharp hot photosphere, white-hot
inner flare, and large soft corona built from a small authored procedural
`DataTexture`. Solar palettes are intentionally distinct:

| Biome | Stellar palette |
|---|---|
| Orbital shipyard | Warm yellow/orange + cold electric blue |
| Overgrown station | Bright amber/gold + turquoise green |
| Frozen observatory | White-blue + orange-red companion |
| Crimson nebula | Magenta-red + bright cyan |

Some orbital/polar level configurations feature one sun, others two; verdant
and nebula scenes emphasize two colorful stars. Variation follows the level's
seed and remains repeatable. Core and corona materials use
`toneMapped:false`, additive glow and `fog:false`, so their light is
clearly visible even against deep space; they do not create additional
high-cost realtime lights or shadows.

The orbital debris scatter is complemented by a **large, coherent 3D
asteroid arc** crossing the visible sky. It mixes big angular rocks and
smaller fragments, with two GPU-instanced draw calls and noticeable depth.
There are 46 / 125 / 260 primary asteroids and 22 / 66 / 120 fragments in
Performance / Balanced / Cinematic modes. The band is placed in
camera-visible background sockets, well behind the playable board, and drifts
only slightly. The near-stellar system stays in a consistent composition even
when the rest of the sky is randomized, rather than leaving the most important
visual focal points offscreen.

Finally the pre-existing huge station silhouettes have lighter, moderately
self-lit hulls and stronger edge/navigation lights. This specifically addresses
the previous issue that they were present in the scene graph but too dark
to see in screenshots.

None of these objects participate in puzzle raycasts, laser tracing, level
imports, saved progress or achievements. The original sun texture and rocks
are built once per biome; motion is disabled with
`prefers-reduced-motion`.
