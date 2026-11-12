# CHROMATRON / REBORN — visual production bible (v1)

## Principle: readable first, cinematic second

The puzzles stay exactly 15×15 logical cells. Every device must be legible from a 40° perspective at 1440×900, including without bloom, and the user must distinguish which optical face is active. The engine's existing internal units use 1.3 world units per tile. Geometry is centered around the logical cell. Visual effects never alter beam routing in `src/optics.js`.

**Visual language:** precision optical laboratory, not vague futuristic icons. Machined dark titanium, polished silver optics, optically clear cyan glass, narrow ceramic seams, understated amber hazards. RGB emissive colors signify beam wavelengths; cyan UI glow alone never means a red or blue laser.

## Game assets and manufacturing requirements

| Asset | Front/readability | Material & reflection | States | Performance target |
|---|---|---|---|---|
| Laser emitter | Long barrel and unmistakable output aperture following 8 headings | PBR titanium, luminous lens, colored core | Idle/on | 1–2k tris, shared textures |
| **Mirror** | Thin vertical silvered plate, 1.05×0.92, bright front / opaque carbon back | **Actual planar reflector** on high quality; studio PBR fallback | Unselected / selected / moving / reflecting | Modular `src/mirror-asset.js`; one reflector on Balanced, two on Cinematic |
| Bender | Visually different curved optical head, not mistaken for plain mirror | Distinct warm edging and optical profile | Same | 1–3k tris |
| Opaque obstacle | Armored solid block with visible caution band | Brushed metal, rough opaque faces | Static | 1k tris |
| Filter | Thin, colored transmissive plate with a robust frame | Colored transparency, directional channel indicator | Blocking / transmitting | 0.5–1.5k tris |
| Prism | Recognizable triangular optical crystal | Transmission or budget refraction | Scattering channels | 1–2k tris |
| Splitter | Semi-reflective glass and two-output indicator | Brushed chrome, translucent splitting plane | Idle / splitting | 1–2k tris |
| Doppler | Wavelength-shift modulation housing | Warm/cold color coding | Idle / shifted | 1–2k tris |
| Tangler | Two intertwined optical tracks | Metallic coils / luminous channels | Not yet faithful to original physics | TBD |
| Conduit | An obvious straight channel | Metallic guide with emissive rails | Passing / blocked | 0.6–1k tris |
| Teleporter | Ring portals with clear inlet and outlet | Luminescent toroid / event horizon | Inactive / paired / firing | 1–2k tris |
| Resonator | Luminous receiver crystal, visible ring, color target | Polished ceramic, faceted crystal, emissive core | Dark / activated / completed | 1–2k tris |
| Chamber | Raised precision grid, grounded architectural environment | Dark metals + restrained accents | Multiple lab biomes later | Prefer instanced geometry |

All budgets are provisional and should be tested on an actual integrated GPU, not treated as certification.

## Mirror surface contract

- **Optical rule:** mirror front faces its local **–X** normal, plate lies in **YZ** plane; world rotation `–rot*π/4` for the Eight-Direction solver.
- **Reversed side is opaque:** no mirrored look or light reflection from the +X carbon back.
- **True scene reflection:** `src/mirror-reflections.js` mounts a Three.js `Reflector` with an offscreen render target ahead of the PBR silver plate.
- **Modular 3D asset:** `src/mirror-asset.js` provides chamfered rails, machinist screws outside the silvered aperture, rear spine, captive brackets and directional notch. Generated geometry is used immediately by Three.js and can later be replaced with a baked GLB without altering the solver.
- **Rendering tiers:** Performance uses studio PBR fallback; Balanced enables one planar mirror; Cinematic allows two and a higher-resolution reflection.
- **No accidental edits:** selected mirrors rotate only with Q/E or explicit onscreen controls and move only by dragging.

## glTF export plan for production-quality authored models

**Preferred source:** Blender native `.blend` (authored separately); **game format:** `.glb` / glTF 2.0 with PBR materials, UV0 and tangents. Use KTX2/BasisU for compressed textures and Meshopt geometry compression when available.

Naming contract (example mirror):

```text
MIRROR_ROOT
 ├─ OPTIC_PIVOT
 │   ├─ MIRROR_FRAME
 │   ├─ MIRROR_GLASS_FRONT    # local normal -X, transparent marker, covered by runtime Reflector
 │   ├─ MIRROR_BACK          # dark +X, non-reflecting
 │   ├─ HARDWARE
 │   └─ STATUS_LEDS
 └─ BASE
```

Textures per material: `BaseColor`, `Normal`, `ORM` (occlusion, roughness, metallic), optional emissive. Author consistent texel density, no giant 4k texture per small device. Common packed trim sheet is preferable. Aim for 512–1024px per family; cinematic upgrades as needed. Use procedural lights and FX in engine, not physically baked light routes.

## Device interaction standard

Click to select; tray → board click to place; drag an existing placed object to move it; Q/E or wheel to rotate, right-click/Esc to cancel. Never move an existing optic just because an empty tile was clicked. Reveal real incoming/reflected beam directions when a mirror is selected.

Movement and rotation use short ease-out animation. All logical moves and laser solutions remain deterministic and instantly validated; reduced-motion accessibility disables cosmetic interpolation.

## Verification checklist

- Test real gameplay in Chromium at 1440×900 and 390×844.
- Confirm correct front/back reflection directions at rotations 0 through 7.
- Verify the mirror's 3D hardware does not overlap the reflective aperture.
- Confirm browser responsiveness with 0 / 1 / 2 active planar mirrors.
- Check that Performance mode disables planar reflection and keeps PBR.
- Monitor draw calls, FPS, GPU memory and long-play disposal of render targets.
- Ensure different beam colors can be distinguished by RGB labels as well as hue.
- Never claim demonstration layouts are the original 200 puzzles.

## Desktop packaging

Keep the source-of-truth puzzle solver, Three.js rendering, PL/EN UI and `glb` assets browser-first. Later package this same bundle with Tauri (or Electron where browser-engine consistency matters), preserving saves through a migration layer rather than rewriting the whole game.

## Original levels and rights

The five shipped puzzles are **independently designed demonstrations**. The original Chromatron puzzle layouts are not shipped. Porting the 200 historic levels requires verifying the source data, original physics and permission/distribution terms; do not silently substitute these demos for the classics or copy levels from unrelated third-party repositories without checking rights.
