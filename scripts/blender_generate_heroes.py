"""
Chromatron3D — Premium Hero Biome Model Generator (Blender 4.x / 5.x)
======================================================================
Run headless:
  blender --background --python scripts/blender_generate_heroes.py

Generates four GLB files under public/models/biomes/:
  orbital.glb   — Titan Cargo Gantry
  verdant.glb   — Forgotten Hanging Garden Arch
  polar.glb     — Frozen Signal Spire Observatory
  nebula.glb    — Astral Resonance Reactor

Each model uses subdivision surfaces, bevel modifiers, smooth shading
and multiple PBR materials for a premium look.
"""

import bpy
import bmesh
import math
import os
import sys
from mathutils import Vector, Matrix, Euler

# ── paths ────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
OUTPUT_DIR = os.path.join(PROJECT_DIR, 'public', 'models', 'biomes')
os.makedirs(OUTPUT_DIR, exist_ok=True)

PI = math.pi
TAU = math.pi * 2


# ══════════════════════════════════════════════════════════════════════════
#  UTILITIES
# ══════════════════════════════════════════════════════════════════════════

def hex_to_rgba(h, alpha=1.0):
    """0xRRGGBB → (r, g, b, a) in linear-ish sRGB [0-1]."""
    return (((h >> 16) & 0xFF) / 255.0,
            ((h >> 8) & 0xFF) / 255.0,
            (h & 0xFF) / 255.0,
            alpha)


def clear_scene():
    """Remove every object, mesh, material, curve from the file."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=True)
    for block_type in (bpy.data.meshes, bpy.data.materials,
                       bpy.data.curves, bpy.data.lights,
                       bpy.data.cameras):
        for block in list(block_type):
            block_type.remove(block)


def make_material(name, color_hex, metallic=0.5, roughness=0.5,
                  emission_hex=0, emission_strength=0.0, alpha=1.0):
    """Create a Principled-BSDF material ready for glTF export."""
    mat = bpy.data.materials.new(name=name)
    if not mat.use_nodes:
        mat.use_nodes = True
    tree = mat.node_tree
    bsdf = tree.nodes.get('Principled BSDF')
    if bsdf is None:
        bsdf = tree.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = hex_to_rgba(color_hex, alpha)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if emission_hex and emission_strength > 0:
        try:
            bsdf.inputs['Emission Color'].default_value = hex_to_rgba(emission_hex)
            bsdf.inputs['Emission Strength'].default_value = emission_strength
        except KeyError:
            # Blender < 4.0 used 'Emission'
            try:
                bsdf.inputs['Emission'].default_value = hex_to_rgba(emission_hex)
            except KeyError:
                pass
    if alpha < 1.0:
        mat.blend_method = 'BLEND'  # for viewport; glTF picks up alpha
        bsdf.inputs['Alpha'].default_value = alpha
    return mat


def assign_material(obj, mat):
    """Assign a material to an object (append if needed)."""
    if mat.name not in [s.name for s in obj.data.materials]:
        obj.data.materials.append(mat)
    idx = list(obj.data.materials).index(mat)
    obj.active_material_index = idx
    if obj.mode != 'EDIT':
        # assign all faces
        for poly in obj.data.polygons:
            poly.material_index = idx


def set_active(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)


def smooth(obj):
    """Shade smooth — compatible across Blender 3.x–5.x."""
    set_active(obj)
    try:
        bpy.ops.object.shade_smooth()
    except RuntimeError:
        for poly in obj.data.polygons:
            poly.use_smooth = True
    obj.select_set(False)


def add_subsurf(obj, levels=2):
    mod = obj.modifiers.new('SubSurf', 'SUBSURF')
    mod.levels = levels
    mod.render_levels = levels
    return mod


def add_bevel(obj, width=0.02, segments=2, limit_method='ANGLE',
              angle_limit=math.radians(30)):
    mod = obj.modifiers.new('Bevel', 'BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = limit_method
    if limit_method == 'ANGLE':
        mod.angle_limit = angle_limit
    return mod


def join_objects(objects, name='joined'):
    """Join a list of objects into one and return it."""
    if not objects:
        return None
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    result = bpy.context.active_object
    result.name = name
    return result


def parent_objects(children, parent):
    """Set parent without transform (keep visual position)."""
    for child in children:
        child.parent = parent
        child.matrix_parent_inverse = parent.matrix_world.inverted()


# ── Primitive helpers ────────────────────────────────────────────────────

def add_box(name, size, location, material, bevel_w=0.015, bevel_seg=2):
    """Beveled box with smooth shading."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size[0], size[1], size[2])
    bpy.ops.object.transform_apply(scale=True)
    assign_material(obj, material)
    add_bevel(obj, width=bevel_w, segments=bevel_seg)
    smooth(obj)
    return obj


def add_cylinder(name, radius, depth, location, material, vertices=24,
                 subsurf=0, bevel_w=0):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.active_object
    obj.name = name
    assign_material(obj, material)
    if subsurf:
        add_subsurf(obj, subsurf)
    if bevel_w > 0:
        add_bevel(obj, width=bevel_w, segments=2)
    smooth(obj)
    return obj


def add_sphere(name, radius, location, material, segments=16, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments, ring_count=rings, radius=radius, location=location)
    obj = bpy.context.active_object
    obj.name = name
    assign_material(obj, material)
    smooth(obj)
    return obj


def add_icosphere(name, radius, location, material, subdivisions=2):
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=subdivisions, radius=radius, location=location)
    obj = bpy.context.active_object
    obj.name = name
    assign_material(obj, material)
    smooth(obj)
    return obj


def add_cone(name, radius1, radius2, depth, location, material,
             vertices=12, subsurf=0):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices, radius1=radius1, radius2=radius2,
        depth=depth, location=location)
    obj = bpy.context.active_object
    obj.name = name
    assign_material(obj, material)
    if subsurf:
        add_subsurf(obj, subsurf)
    smooth(obj)
    return obj


def add_torus(name, major_r, minor_r, location, material,
              major_seg=48, minor_seg=12, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_r, minor_radius=minor_r,
        major_segments=major_seg, minor_segments=minor_seg,
        location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    assign_material(obj, material)
    smooth(obj)
    return obj


def add_pipe(name, points, radius, material, resolution=12, bevel_res=4):
    """Create a tube along a sequence of Vector points."""
    curve = bpy.data.curves.new(name + '_curve', type='CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = bevel_res
    curve.fill_mode = 'FULL'
    curve.resolution_u = resolution
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for i, pt in enumerate(points):
        bp = spline.bezier_points[i]
        bp.co = pt
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    # Assign material
    curve.materials.append(material)
    # Convert to mesh for glTF export
    set_active(obj)
    bpy.ops.object.convert(target='MESH')
    smooth(obj)
    return obj


def add_crystal_bmesh(name, radius, height, location, material, sides=6,
                      lean_x=0, lean_z=0, taper_mid=1.0, taper_top=0.0):
    """Procedural crystal with base, middle bulge, shoulder and tip."""
    bm = bmesh.new()
    layers = [
        (0.0,      radius * 0.7,   0, 0),
        (height * 0.22, radius * taper_mid, lean_x * 0.15, lean_z * 0.12),
        (height * 0.55, radius * 0.75, lean_x * 0.45, lean_z * 0.4),
        (height * 0.80, radius * 0.35, lean_x * 0.75, lean_z * 0.65),
    ]
    rings = []
    for ly, lr, lx, lz in layers:
        ring = []
        for i in range(sides):
            angle = i * TAU / sides
            warp = 1.0 + 0.12 * math.sin(i * 5 + height * 2)
            x = lx + math.cos(angle) * lr * warp
            z = lz + math.sin(angle) * lr * warp
            ring.append(bm.verts.new((x, ly, z)))
        rings.append(ring)
    # tip
    tip = bm.verts.new((lean_x, height, lean_z))
    # bottom center
    bottom = bm.verts.new((0, 0, 0))
    bm.verts.ensure_lookup_table()
    # Side faces between rings
    for ri in range(len(rings) - 1):
        for i in range(sides):
            j = (i + 1) % sides
            bm.faces.new([rings[ri][i], rings[ri][j],
                           rings[ri + 1][j], rings[ri + 1][i]])
    # Top cone
    top_ring = rings[-1]
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new([top_ring[i], top_ring[j], tip])
    # Bottom cap
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new([bottom, rings[0][j], rings[0][i]])

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    bpy.context.collection.objects.link(obj)
    assign_material(obj, material)
    smooth(obj)
    return obj


def add_leaf_bmesh(name, stem, tip, width, material):
    """Sculpted leaf with midrib ridge — four triangular faces."""
    s = Vector(stem)
    t = Vector(tip)
    direction = t - s
    mid = s + direction * 0.52
    ridge = mid + Vector((0, 0.10, 0))
    side = direction.cross(Vector((0, 0, 1)))
    if side.length < 0.001:
        side = direction.cross(Vector((1, 0, 0)))
    side.normalize()
    left = mid + side * width
    right = mid - side * width
    base = s + direction * 0.10

    bm = bmesh.new()
    v_base = bm.verts.new(base)
    v_left = bm.verts.new(left)
    v_right = bm.verts.new(right)
    v_ridge = bm.verts.new(ridge)
    v_tip = bm.verts.new(t)
    bm.verts.ensure_lookup_table()
    bm.faces.new([v_base, v_left, v_ridge])
    bm.faces.new([v_base, v_ridge, v_right])
    bm.faces.new([v_ridge, v_left, v_tip])
    bm.faces.new([v_ridge, v_tip, v_right])

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    assign_material(obj, material)
    add_subsurf(obj, levels=1)
    smooth(obj)
    return obj


def add_boulder(name, radius, location, material, seed=0):
    """Deformed icosphere boulder."""
    obj = add_icosphere(name, radius, location, material, subdivisions=2)
    # Deform vertices for organic shape
    mesh = obj.data
    import random
    rng = random.Random(seed)
    for v in mesh.vertices:
        factor = 0.75 + rng.random() * 0.5
        v.co.x *= factor
        v.co.z *= factor * (0.85 + rng.random() * 0.3)
        v.co.y *= 0.5 + rng.random() * 0.6  # flatten a bit
    mesh.update()
    return obj


def add_mushroom(name, location, cap_radius, stem_height, material_cap,
                 material_stem):
    """Small mushroom growth: thin stem + domed cap."""
    parts = []
    stem = add_cylinder(name + '_stem', cap_radius * 0.2, stem_height,
                        (location[0], location[1] + stem_height / 2,
                         location[2]),
                        material_stem, vertices=8)
    parts.append(stem)
    # cap — flattened sphere
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=12, ring_count=8, radius=cap_radius,
        location=(location[0], location[1] + stem_height + cap_radius * 0.3,
                  location[2]))
    cap = bpy.context.active_object
    cap.name = name + '_cap'
    cap.scale.y = 0.45
    bpy.ops.object.transform_apply(scale=True)
    assign_material(cap, material_cap)
    add_subsurf(cap, 1)
    smooth(cap)
    parts.append(cap)
    return parts


# ══════════════════════════════════════════════════════════════════════════
#  1. ORBITAL — Titan Cargo Gantry
# ══════════════════════════════════════════════════════════════════════════

def build_orbital():
    parts = []
    # Materials
    steel = make_material('OB_graphite_steel', 0x344957,
                          metallic=0.85, roughness=0.32)
    titanium = make_material('OB_titanium_ribbing', 0x829ba4,
                             metallic=0.75, roughness=0.30)
    alloy = make_material('OB_machined_alloy', 0x536b6d,
                          metallic=0.70, roughness=0.49)
    amber = make_material('OB_amber_hazard', 0xe7a650,
                          metallic=0.55, roughness=0.36)
    cyan = make_material('OB_cyan_energy', 0x2cb4d2,
                         metallic=0.30, roughness=0.21,
                         emission_hex=0x28b7dc, emission_strength=2.5)
    black = make_material('OB_industrial_core', 0x1b2b35,
                          metallic=0.90, roughness=0.36)

    # ── Two tall pylons ──────────────────────────────────────────────────
    for sign in (-1, 1):
        x = sign * 2.9
        # Main pylon body
        pylon = add_box('pylon_' + ('L' if sign < 0 else 'R'),
                        (0.85, 2.5, 0.95), (x, 2.7, 0), steel,
                        bevel_w=0.025, bevel_seg=3)
        parts.append(pylon)
        # Pylon base flare
        base = add_box('pylon_base', (1.1, 0.22, 1.15),
                       (x, 0.22, 0), alloy, bevel_w=0.02)
        parts.append(base)
        # Pylon cap plate
        cap = add_box('pylon_cap', (0.95, 0.12, 1.05),
                      (x, 4.98, 0), titanium, bevel_w=0.018)
        parts.append(cap)
        # Panel line insets on pylon face
        for k in range(4):
            iy = 1.2 + k * 1.0
            inset = add_box('panel_line', (0.05, 0.65, 0.75),
                            (x + sign * 0.44, iy, 0), black,
                            bevel_w=0.008)
            parts.append(inset)
        # Pipe runs on outer face
        for k in range(2):
            pz = -0.28 + k * 0.56
            pipe = add_cylinder('pipe', 0.05, 4.2,
                                (x + sign * 0.48, 2.5, pz),
                                alloy, vertices=8, bevel_w=0.006)
            parts.append(pipe)
        # Diagonal cross-bracing (inside)
            cross1 = add_pipe('cross_brace',
                              [Vector((x - sign * 0.3, 0.6, 0.35)),
                               Vector((x - sign * 0.3, 4.0, -0.35))],
                              0.04, titanium, bevel_res=2)
            parts.append(cross1)
        cross2 = add_pipe('cross_brace_2',
                          [Vector((x - sign * 0.3, 0.6, -0.35)),
                           Vector((x - sign * 0.3, 4.0, 0.35))],
                          0.04, titanium, bevel_res=2)
        parts.append(cross2)
        # Warning lights on pylon top corners
        for sz in (-1, 1):
            light = add_sphere('warn_light', 0.06,
                               (x + sign * 0.35, 5.08, sz * 0.38),
                               amber, segments=10, rings=8)
            parts.append(light)

    # ── Bridge beam connecting pylons ────────────────────────────────────
    bridge_main = add_box('bridge_main', (3.0, 0.38, 0.80),
                          (0, 5.14, 0), steel, bevel_w=0.022, bevel_seg=3)
    parts.append(bridge_main)
    bridge_top = add_box('bridge_top', (2.8, 0.12, 0.65),
                         (0, 5.42, 0), titanium, bevel_w=0.015)
    parts.append(bridge_top)
    # Bridge walkway rails
    for sz in (-1, 1):
        rail = add_box('bridge_rail', (2.7, 0.25, 0.04),
                       (0, 5.62, sz * 0.28), alloy, bevel_w=0.008)
        parts.append(rail)
    # Bridge struts (vertical between rails)
    for k in range(7):
        bx = -2.4 + k * 0.8
        strut = add_box('bridge_strut', (0.03, 0.20, 0.52),
                        (bx, 5.52, 0), alloy, bevel_w=0.005)
        parts.append(strut)
    # Bridge grating detail
    for k in range(6):
        bx = -2.1 + k * 0.78
        grate = add_box('grate_slat', (0.55, 0.02, 0.40),
                        (bx, 5.35, 0), black, bevel_w=0.004)
        parts.append(grate)

    # ── Suspended cargo/reactor pod ──────────────────────────────────────
    pod = add_cylinder('cargo_pod', 0.65, 1.8, (0, 3.45, 0.08),
                       black, vertices=16, bevel_w=0.012)
    parts.append(pod)
    # Pod dome caps
    for sy in (-1, 1):
        dome = add_sphere('pod_dome', 0.65,
                          (0, 3.45 + sy * 0.9, 0.08),
                          steel, segments=14, rings=10)
        dome.scale.y = 0.35
        bpy.ops.object.transform_apply(scale=True)
        parts.append(dome)
    # Pod ribs
    for k in range(5):
        rib_y = 2.82 + k * 0.35
        rib = add_torus('pod_rib', 0.68, 0.03,
                        (0, rib_y, 0.08), alloy,
                        major_seg=20, minor_seg=6)
        rib.rotation_euler = (PI / 2, 0, 0)
        parts.append(rib)
    # Suspension cables from bridge to pod
    for sx in (-0.8, 0, 0.8):
        cable = add_pipe('suspension_cable',
                         [Vector((sx, 4.92, 0)),
                          Vector((sx, 4.4, 0.04)),
                          Vector((sx * 0.3, 4.0, 0.06))],
                         0.025, titanium, bevel_res=2)
        parts.append(cable)

    # ── Antenna dish on bridge top ───────────────────────────────────────
    mast = add_cylinder('antenna_mast', 0.04, 1.2, (1.8, 6.2, 0),
                        titanium, vertices=8)
    parts.append(mast)
    dish = add_sphere('antenna_dish', 0.35,
                      (1.8, 6.85, 0), alloy, segments=16, rings=10)
    # Cut dish in half (scale + clip)
    dish.scale.y = 0.35
    bpy.ops.object.transform_apply(scale=True)
    parts.append(dish)
    # Small feed horn
    feed = add_cylinder('feed_horn', 0.04, 0.15,
                        (1.8, 7.0, 0), cyan, vertices=6)
    parts.append(feed)

    # ── Cargo containers at base ─────────────────────────────────────────
    container_colors = [steel, alloy, steel, amber]
    for i in range(4):
        cx = -1.4 + (i % 2) * 0.95
        cz = -0.4 + (i // 2) * 0.72
        cy = 0.25 + (i % 3) * 0.02
        container = add_box('container_' + str(i),
                            (0.42, 0.35, 0.30),
                            (cx, cy, cz),
                            container_colors[i],
                            bevel_w=0.012, bevel_seg=2)
        parts.append(container)
        # Container lid line
        lid = add_box('lid_' + str(i), (0.38, 0.015, 0.26),
                      (cx, cy + 0.18, cz), titanium, bevel_w=0.004)
        parts.append(lid)

    # ── Conduit runs connecting elements ─────────────────────────────────
    conduit = add_pipe('conduit_1',
                       [Vector((-2.5, 0.5, 0.5)),
                        Vector((-1.5, 0.8, 0.5)),
                        Vector((-0.5, 0.55, 0.45))],
                       0.035, alloy, bevel_res=3)
    parts.append(conduit)
    conduit2 = add_pipe('conduit_2',
                        [Vector((2.5, 0.5, -0.5)),
                         Vector((1.5, 0.65, -0.5)),
                         Vector((0.5, 0.4, -0.4))],
                        0.035, alloy, bevel_res=3)
    parts.append(conduit2)

    # ── Status lights (emissive cyan) ────────────────────────────────────
    for pos in [(0, 5.7, 0.32), (0, 5.7, -0.32),
                (-2.9, 0.55, 0.55), (2.9, 0.55, -0.55),
                (1.8, 7.1, 0)]:
        light = add_sphere('status_light', 0.04, pos, cyan,
                           segments=8, rings=6)
        parts.append(light)

    # ── Base platform ────────────────────────────────────────────────────
    base_plate = add_box('base_plate', (3.5, 0.15, 2.3),
                         (0, 0.08, 0), alloy, bevel_w=0.018, bevel_seg=2)
    parts.append(base_plate)

    return parts


# ══════════════════════════════════════════════════════════════════════════
#  2. VERDANT — Forgotten Hanging Garden Arch
# ══════════════════════════════════════════════════════════════════════════

def build_verdant():
    parts = []
    # Materials
    stone = make_material('VD_jade_stone', 0x455b54,
                          metallic=0.05, roughness=0.73)
    silver = make_material('VD_exposed_silver', 0x708883,
                           metallic=0.55, roughness=0.51)
    fern = make_material('VD_fern_leaf', 0x408d55,
                         metallic=0.0, roughness=0.92)
    emerald = make_material('VD_emerald_foliage', 0x7ac879,
                            metallic=0.0, roughness=0.93)
    roots = make_material('VD_ancient_roots', 0x345b37,
                          metallic=0.0, roughness=0.94)
    glow = make_material('VD_circuit_glow', 0x50a788,
                         metallic=0.15, roughness=0.30,
                         emission_hex=0x33a77a, emission_strength=2.0)
    moss_stone = make_material('VD_mossy_stone', 0x546c50,
                               metallic=0.0, roughness=0.98)

    # ── Main arch (torus segment ~130°) ──────────────────────────────────
    # Full torus, then delete faces outside the arch range
    bpy.ops.mesh.primitive_torus_add(
        major_radius=3.2, minor_radius=0.55,
        major_segments=48, minor_segments=12,
        location=(0, 3.2, 0))
    arch = bpy.context.active_object
    arch.name = 'main_arch'
    # Delete lower portion (keep top ~130°)
    bm = bmesh.new()
    bm.from_mesh(arch.data)
    bm.faces.ensure_lookup_table()
    remove_faces = []
    for face in bm.faces:
        center = face.calc_center_median()
        angle = math.atan2(center.z, center.x)
        # Keep roughly the top arc
        if center.y < 1.5:
            remove_faces.append(face)
    bmesh.ops.delete(bm, geom=remove_faces, context='FACES')
    bm.to_mesh(arch.data)
    bm.free()
    assign_material(arch, stone)
    add_subsurf(arch, 1)
    smooth(arch)
    parts.append(arch)

    # ── Support pillars ──────────────────────────────────────────────────
    for sign in (-1, 1):
        x = sign * 2.85
        pillar = add_cylinder('pillar_' + ('L' if sign < 0 else 'R'),
                              0.52, 3.8, (x, 1.9, 0), stone,
                              vertices=12, subsurf=1, bevel_w=0.015)
        # Slight taper
        pillar.scale = (1.0, 1.0, 1.0)
        parts.append(pillar)
        # Pillar base
        base = add_cylinder('pillar_base', 0.68, 0.25,
                            (x, 0.13, 0), stone, vertices=12,
                            bevel_w=0.012)
        parts.append(base)
        # Moss on pillar (flattened spheres clinging to surface)
        for k in range(3):
            angle = k * 1.5 + sign * 0.7
            mx = x + math.cos(angle) * 0.48
            mz = math.sin(angle) * 0.48
            my = 0.8 + k * 0.9
            moss = add_icosphere('pillar_moss', 0.18,
                                 (mx, my, mz), moss_stone, subdivisions=2)
            moss.scale = (1.3, 0.5, 1.3)
            bpy.ops.object.transform_apply(scale=True)
            parts.append(moss)

    # ── Vines climbing pillars and draping from arch ─────────────────────
    vine_paths = [
        # Left pillar vine
        [Vector((-2.9, 0.2, 0.3)), Vector((-2.7, 1.5, 0.5)),
         Vector((-2.5, 3.0, 0.4)), Vector((-1.8, 4.5, 0.3)),
         Vector((-0.5, 5.2, 0.2))],
        # Right pillar vine
        [Vector((2.9, 0.3, -0.3)), Vector((2.6, 1.8, -0.5)),
         Vector((2.3, 3.2, -0.3)), Vector((1.5, 4.3, -0.2)),
         Vector((0.4, 5.0, 0.1))],
        # Hanging vine 1
        [Vector((-1.5, 5.0, 0.4)), Vector((-1.8, 4.0, 0.9)),
         Vector((-2.0, 3.0, 1.1)), Vector((-1.8, 2.0, 1.3))],
        # Hanging vine 2
        [Vector((0.0, 5.3, 0.3)), Vector((-0.3, 4.2, 0.8)),
         Vector((-0.2, 3.1, 1.0)), Vector((-0.4, 2.2, 1.2))],
        # Hanging vine 3
        [Vector((1.6, 4.6, 0.3)), Vector((1.4, 3.6, 0.7)),
         Vector((1.5, 2.8, 0.9)), Vector((1.2, 1.8, 1.1))],
        # Hanging vine 4
        [Vector((2.6, 2.5, 0.5)), Vector((3.0, 1.8, 0.7)),
         Vector((3.1, 1.0, 1.0)), Vector((3.2, 0.3, 1.2))],
        # Cross vine on arch face
        [Vector((-2.5, 4.5, -0.3)), Vector((-1.0, 5.2, -0.2)),
         Vector((0.5, 5.4, -0.1)), Vector((2.0, 4.8, 0.0))],
        # Extra climbing vine
        [Vector((-3.0, 0.5, -0.3)), Vector((-2.8, 2.0, -0.5)),
         Vector((-2.3, 3.5, -0.6)), Vector((-1.2, 4.8, -0.4))],
    ]
    for vi, path in enumerate(vine_paths):
        vine = add_pipe('vine_' + str(vi), path, 0.055 + (vi % 3) * 0.015,
                        roots, bevel_res=3)
        parts.append(vine)
        # Add leaves at vine nodes
        for pi in range(1, len(path)):
            pt = path[pi]
            direction = 1 if pi % 2 == 0 else -1
            tip = Vector((pt.x + direction * 0.5,
                          pt.y + 0.2,
                          pt.z + 0.3))
            leaf = add_leaf_bmesh('leaf_%d_%d' % (vi, pi),
                                 tuple(pt), tuple(tip), 0.22,
                                 fern if pi % 2 else emerald)
            parts.append(leaf)
            # Second leaf opposite side
            tip2 = Vector((pt.x - direction * 0.4,
                           pt.y - 0.15,
                           pt.z + 0.2))
            leaf2 = add_leaf_bmesh('leaf2_%d_%d' % (vi, pi),
                                  tuple(pt), tuple(tip2), 0.18,
                                  emerald if pi % 2 else fern)
            parts.append(leaf2)

    # ── Moss-covered boulders at base ────────────────────────────────────
    boulder_positions = [
        (-3.2, 0.0, -0.9), (-2.4, 0.0, 1.0), (3.0, 0.0, 0.8),
        (2.5, 0.0, -1.1), (-0.8, 0.0, 1.2), (0.6, 0.0, -1.0),
        (-3.5, 0.0, 0.3), (3.4, 0.0, -0.4),
    ]
    for bi, pos in enumerate(boulder_positions):
        radius = 0.35 + (bi % 3) * 0.15
        boulder = add_boulder('boulder_' + str(bi), radius, pos,
                              moss_stone, seed=bi * 17 + 42)
        parts.append(boulder)

    # ── Mushroom growths ─────────────────────────────────────────────────
    mushroom_spots = [
        (-2.6, 0.4, 0.5), (2.7, 0.5, -0.4),
        (-1.0, 0.0, 1.1), (1.2, 0.0, -0.9),
        (-3.0, 0.8, -0.5), (0.0, 0.0, 1.3),
    ]
    for mi, pos in enumerate(mushroom_spots):
        m_parts = add_mushroom('mushroom_' + str(mi), pos,
                               0.12 + (mi % 2) * 0.06,
                               0.20 + (mi % 3) * 0.08,
                               fern, roots)
        parts.extend(m_parts)

    # ── Broken tech panels ───────────────────────────────────────────────
    for i, (px, py, pz, ry) in enumerate([
        (-1.5, 0.3, -0.8, 0.4), (1.8, 0.5, 0.9, -0.6),
        (0.2, 0.2, -1.1, 0.1),
    ]):
        panel = add_box('tech_panel_' + str(i),
                        (0.6, 0.04, 0.35), (px, py, pz),
                        silver, bevel_w=0.008)
        panel.rotation_euler = (0.15 + i * 0.1, ry, 0.05)
        parts.append(panel)
        # Circuit line on panel
        circ = add_box('circuit_' + str(i),
                       (0.4, 0.008, 0.02),
                       (px, py + 0.025, pz), glow, bevel_w=0.003)
        circ.rotation_euler = panel.rotation_euler
        parts.append(circ)

    # ── Hanging root tendrils from arch underside ────────────────────────
    for ri in range(6):
        rx = -2.0 + ri * 0.8
        root_base = Vector((rx, 4.2 + abs(rx) * 0.15, -0.3))
        root_tip = Vector((rx + (ri % 2 - 0.5) * 0.3,
                           2.5 - ri * 0.12, -0.2))
        root = add_pipe('root_tendril_' + str(ri),
                        [root_base,
                         Vector((rx, 3.5, -0.25)),
                         root_tip],
                        0.035 + (ri % 3) * 0.01, roots, bevel_res=2)
        parts.append(root)

    # ── Glowing flower buds at vine tips ─────────────────────────────────
    for vi in range(len(vine_paths)):
        tip = vine_paths[vi][-1]
        bud = add_sphere('glow_bud_' + str(vi), 0.06,
                         (tip.x, tip.y + 0.08, tip.z),
                         glow, segments=8, rings=6)
        parts.append(bud)

    # ── Side ferns growing from base ─────────────────────────────────────
    for sign in (-1, 1):
        for fi in range(5):
            fx = sign * (2.5 + 0.4 * math.sin(fi * 3))
            fz = -0.7 + fi * 0.35
            stem_pt = Vector((fx, 0.3, fz))
            tip_pt = Vector((fx + sign * 0.5,
                             0.9 + 0.25 * (fi % 3), fz + 0.3))
            fern_leaf = add_leaf_bmesh('side_fern_%d_%d' % (sign, fi),
                                      tuple(stem_pt), tuple(tip_pt), 0.20,
                                      emerald if fi % 2 else fern)
            parts.append(fern_leaf)

    # ── Arch crown foliage mounds ────────────────────────────────────────
    for ci in range(7):
        cx = -2.2 + ci * 0.73
        cy = 5.0 - 0.3 * abs(cx) / 3
        clump = add_icosphere('crown_moss_' + str(ci), 0.22,
                              (cx, cy, 0.25), moss_stone, subdivisions=1)
        clump.scale = (1.4, 0.5, 1.2)
        bpy.ops.object.transform_apply(scale=True)
        parts.append(clump)

    return parts


# ══════════════════════════════════════════════════════════════════════════
#  3. POLAR — Frozen Signal Spire Observatory
# ══════════════════════════════════════════════════════════════════════════

def build_polar():
    parts = []
    # Materials
    basalt = make_material('PL_glacial_basalt', 0x334963,
                           metallic=0.55, roughness=0.47)
    ice_blue = make_material('PL_ice_blue', 0x7fcce9,
                             metallic=0.05, roughness=0.15)
    sapphire = make_material('PL_frosted_sapphire', 0x3e91c2,
                             metallic=0.05, roughness=0.28)
    ice_white = make_material('PL_ice_white', 0xd4f4f2,
                              metallic=0.03, roughness=0.15)
    snow = make_material('PL_snow_foundation', 0xaec4d4,
                         metallic=0.05, roughness=0.79)
    conduit = make_material('PL_polar_conduit', 0x3aa5d9,
                            metallic=0.15, roughness=0.20,
                            emission_hex=0x42a8e0, emission_strength=2.0)

    # ── Research foundation platform ─────────────────────────────────────
    platform = add_box('foundation', (3.5, 0.22, 1.6),
                       (0, 0.22, 0), basalt, bevel_w=0.025, bevel_seg=3)
    parts.append(platform)
    # Raised inner deck
    deck = add_box('inner_deck', (3.2, 0.12, 1.3),
                   (0, 0.42, -0.15), basalt, bevel_w=0.015)
    parts.append(deck)
    # Equipment housings on platform
    for sign in (-1, 1):
        housing = add_box('equipment_' + ('L' if sign < 0 else 'R'),
                          (0.55, 0.85, 0.55),
                          (sign * 2.6, 0.85, -0.3), basalt,
                          bevel_w=0.018, bevel_seg=2)
        parts.append(housing)
        # Window/panel detail
        window = add_box('window', (0.35, 0.5, 0.02),
                         (sign * 2.6, 0.95, -0.02), sapphire,
                         bevel_w=0.005)
        parts.append(window)
        # Antenna on housing
        ant = add_cylinder('housing_antenna', 0.03, 0.5,
                           (sign * 2.6, 1.55, -0.3), basalt, vertices=6)
        parts.append(ant)

    # ── Ice crystal spires ───────────────────────────────────────────────
    spire_configs = [
        # (x, z, base_y, height, radius, lean_x, lean_z, material, sides)
        (-1.0, 0.35, -0.05, 5.8, 0.55, -0.35, -0.2, ice_blue, 7),
        (0.0, 0.25, 0.15, 6.5, 0.70, 0.12, -0.25, sapphire, 8),
        (1.2, 0.30, -0.1, 5.2, 0.50, 0.30, -0.15, ice_blue, 7),
        (2.4, 0.35, 0.10, 3.6, 0.40, 0.35, 0.08, ice_white, 6),
        (-2.3, 0.30, -0.1, 3.2, 0.38, -0.20, 0.10, sapphire, 6),
        (-0.5, -0.05, 0.0, 2.0, 0.28, -0.10, 0.12, ice_white, 6),
        (0.8, -0.12, 0.0, 1.6, 0.22, 0.08, 0.10, ice_blue, 5),
    ]
    for si, cfg in enumerate(spire_configs):
        x, z, by, h, r, lx, lz, mat, sides = cfg
        crystal = add_crystal_bmesh(
            'ice_spire_' + str(si), r, h,
            (x, by, z), mat, sides=sides,
            lean_x=lx, lean_z=lz, taper_mid=1.1, taper_top=0.0)
        add_subsurf(crystal, 1)
        parts.append(crystal)

    # ── Observatory signal ring ──────────────────────────────────────────
    ring = add_torus('obs_ring', 2.15, 0.10, (0, 3.5, -0.8),
                     basalt, major_seg=48, minor_seg=8,
                     rotation=(0.25, 0, 0))
    add_bevel(ring, width=0.008, segments=1)
    parts.append(ring)
    # Inner ring
    inner_ring = add_torus('obs_inner_ring', 1.6, 0.05, (0, 3.5, -0.8),
                           conduit, major_seg=36, minor_seg=6,
                           rotation=(0.25, 0, 0))
    parts.append(inner_ring)
    # Ring spokes
    for k in range(12):
        angle = k * TAU / 12
        spoke_start = Vector((math.cos(angle) * 1.65,
                              3.5 + math.sin(angle) * 0.04,
                              -0.8 + math.sin(angle) * 0.08))
        spoke_end = Vector((math.cos(angle) * 2.1,
                            3.5 + math.sin(angle) * 0.05,
                            -0.8 + math.sin(angle) * 0.10))
        spoke = add_pipe('ring_spoke_' + str(k),
                         [spoke_start, spoke_end],
                         0.025, basalt, bevel_res=2)
        parts.append(spoke)

    # ── Signal mast ──────────────────────────────────────────────────────
    mast = add_cylinder('signal_mast', 0.06, 2.5,
                        (0.0, 5.5, -0.9), basalt, vertices=8, bevel_w=0.008)
    parts.append(mast)
    # Dish at top
    dish = add_sphere('signal_dish', 0.25, (0.0, 6.85, -0.9),
                      basalt, segments=14, rings=10)
    dish.scale.y = 0.3
    bpy.ops.object.transform_apply(scale=True)
    parts.append(dish)
    # Beacon
    beacon = add_sphere('beacon', 0.06, (0.0, 7.0, -0.9),
                        conduit, segments=8, rings=6)
    parts.append(beacon)

    # ── Icicle formations ────────────────────────────────────────────────
    icicle_spots = [
        (1.5, 3.2, -0.7), (-1.4, 3.4, -0.9), (0.5, 3.6, -0.6),
        (2.0, 3.0, -0.8), (-2.0, 3.1, -0.75), (-0.5, 3.5, -0.85),
        (0.8, 2.0, 0.3), (-0.8, 2.2, 0.4), (1.5, 1.5, 0.2),
        (-1.5, 1.8, 0.3),
    ]
    for ii, pos in enumerate(icicle_spots):
        length = 0.3 + (ii % 4) * 0.15
        icicle = add_cone('icicle_' + str(ii),
                          0.04 + (ii % 3) * 0.015, 0.005, length,
                          (pos[0], pos[1] - length / 2, pos[2]),
                          ice_white, vertices=6, subsurf=1)
        parts.append(icicle)

    # ── Snow drift mounds ────────────────────────────────────────────────
    drift_spots = [
        (-2.8, 0.0, 0.6, 0.55), (2.9, 0.0, -0.5, 0.45),
        (-1.5, 0.0, 1.0, 0.40), (1.5, 0.0, 0.9, 0.50),
        (0.0, 0.0, 1.1, 0.35), (-3.2, 0.0, -0.3, 0.38),
        (3.1, 0.0, 0.4, 0.42),
    ]
    for di, (dx, dy, dz, dr) in enumerate(drift_spots):
        drift = add_icosphere('snow_drift_' + str(di), dr,
                              (dx, dy + dr * 0.3, dz), snow,
                              subdivisions=2)
        drift.scale = (1.5, 0.35, 1.3)
        bpy.ops.object.transform_apply(scale=True)
        add_subsurf(drift, 1)
        parts.append(drift)

    # ── Frozen waterfall shapes ──────────────────────────────────────────
    for fi, (fx, fz) in enumerate([(-1.8, 0.3), (1.5, 0.2)]):
        waterfall = add_pipe('frozen_fall_' + str(fi),
                             [Vector((fx, 3.5, fz)),
                              Vector((fx + 0.2, 2.5, fz + 0.1)),
                              Vector((fx + 0.1, 1.5, fz + 0.15)),
                              Vector((fx - 0.1, 0.5, fz + 0.2))],
                             0.12, ice_white, bevel_res=4)
        add_subsurf(waterfall, 1)
        parts.append(waterfall)

    # ── Ice bridge between formations ────────────────────────────────────
    bridge = add_pipe('ice_bridge',
                      [Vector((-1.5, 2.8, 0.3)),
                       Vector((-0.5, 3.2, 0.2)),
                       Vector((0.5, 3.0, 0.25)),
                       Vector((1.5, 2.6, 0.2))],
                      0.08, sapphire, bevel_res=3)
    add_subsurf(bridge, 1)
    parts.append(bridge)

    return parts


# ══════════════════════════════════════════════════════════════════════════
#  4. NEBULA — Astral Resonance Reactor
# ══════════════════════════════════════════════════════════════════════════

def build_nebula():
    parts = []
    # Materials
    shell = make_material('NB_reactor_shell', 0x292c44,
                          metallic=0.78, roughness=0.31)
    violet = make_material('NB_violet_crystal', 0x9863b8,
                           metallic=0.10, roughness=0.20)
    magenta = make_material('NB_magenta_core', 0xea75c4,
                            metallic=0.05, roughness=0.22,
                            emission_hex=0xa13a9c, emission_strength=3.0)
    bronze = make_material('NB_bronze_frame', 0x92706f,
                           metallic=0.77, roughness=0.38)
    energy = make_material('NB_energy_glow', 0xffa5d2,
                           metallic=0.05, roughness=0.20,
                           emission_hex=0xd855aa, emission_strength=4.0)
    shards = make_material('NB_crystal_shards', 0x745ca7,
                           metallic=0.08, roughness=0.28)

    # ── Base platform (stepped cylinders) ────────────────────────────────
    base1 = add_cylinder('base_1', 2.5, 0.35, (0, 0.18, 0),
                         shell, vertices=16, bevel_w=0.018)
    parts.append(base1)
    base2 = add_cylinder('base_2', 2.1, 0.22, (0, 0.47, 0),
                         bronze, vertices=16, bevel_w=0.012)
    parts.append(base2)
    base3 = add_cylinder('base_3', 1.7, 0.14, (0, 0.67, 0),
                         shell, vertices=16, bevel_w=0.010)
    parts.append(base3)
    # Base detail ring
    base_ring = add_torus('base_ring', 2.3, 0.04, (0, 0.36, 0),
                          energy, major_seg=32, minor_seg=6,
                          rotation=(PI / 2, 0, 0))
    parts.append(base_ring)

    # ── Central dramatic crystal ─────────────────────────────────────────
    core = add_crystal_bmesh('core_crystal', 1.05, 5.0,
                             (0, 0.5, 0), violet, sides=9,
                             lean_x=0.2, lean_z=0.3,
                             taper_mid=1.15, taper_top=0.0)
    add_subsurf(core, 1)
    parts.append(core)
    # Secondary inner crystal
    inner = add_crystal_bmesh('inner_crystal', 0.65, 4.5,
                              (0.15, 0.3, 0.1), magenta, sides=7,
                              lean_x=-0.15, lean_z=0.18,
                              taper_mid=1.05)
    add_subsurf(inner, 1)
    parts.append(inner)

    # ── Three orbital rings ──────────────────────────────────────────────
    ring_configs = [
        (2.6, 0.10, (0, 2.5, 0), bronze, (0.55, 0.14, 0)),
        (2.1, 0.08, (0, 2.8, 0), shell, (1.12, 0.65, 0)),
        (1.7, 0.06, (0, 3.2, 0), energy, (-0.40, 0.96, 0)),
        (3.0, 0.05, (0, 1.8, 0), shell, (0.30, -0.25, 0.4)),
    ]
    for ri, (major, minor, loc, mat, rot) in enumerate(ring_configs):
        ring = add_torus('orbital_ring_' + str(ri), major, minor,
                         loc, mat, major_seg=48, minor_seg=8,
                         rotation=rot)
        parts.append(ring)

    # ── Support columns (4 octagonal pillars) ────────────────────────────
    for ci in range(4):
        angle = ci * TAU / 4 + PI / 4
        cx = math.cos(angle) * 2.45
        cz = math.sin(angle) * 2.45
        col = add_cylinder('support_col_' + str(ci),
                           0.20, 3.8, (cx, 2.3, cz),
                           bronze, vertices=8, bevel_w=0.012)
        parts.append(col)
        # Column base and cap
        for (by, bh) in [(0.3, 0.15), (4.1, 0.12)]:
            ring = add_cylinder('col_ring_' + str(ci),
                                0.28, bh, (cx, by, cz),
                                shell, vertices=8, bevel_w=0.008)
            parts.append(ring)
        # Energy conduit from column to center
        conduit = add_pipe('energy_conduit_' + str(ci),
                           [Vector((cx, 2.0, cz)),
                            Vector((cx * 0.5, 2.3, cz * 0.5)),
                            Vector((0.1, 2.5, 0.1))],
                           0.03, energy, bevel_res=3)
        parts.append(conduit)

    # ── Floating crystal shards ──────────────────────────────────────────
    shard_configs = [
        (2.5, 2.2, 0.4, 1.2, 0.28), (-2.3, 1.8, -0.5, 1.0, 0.24),
        (0.8, 4.0, 1.8, 0.9, 0.22), (-1.0, 3.5, -1.5, 1.1, 0.25),
        (1.5, 0.8, -2.0, 0.8, 0.20), (-1.8, 1.2, 1.6, 0.95, 0.23),
        (0.3, 4.5, -0.8, 0.7, 0.18), (-0.5, 0.5, 2.2, 0.85, 0.21),
    ]
    for si, (sx, sy, sz, sh, sr) in enumerate(shard_configs):
        shard = add_crystal_bmesh('floating_shard_' + str(si),
                                  sr, sh, (sx, sy, sz),
                                  shards if si % 2 else violet,
                                  sides=5 + si % 3,
                                  lean_x=(si % 3 - 1) * 0.15,
                                  lean_z=(si % 2 - 0.5) * 0.12)
        # Slight random rotation for variety
        obj = bpy.data.objects[shard.name]
        obj.rotation_euler = (
            (si * 0.4) % 1.0 - 0.5,
            (si * 0.7) % 1.2,
            (si * 0.3) % 0.8 - 0.4,
        )
        parts.append(shard)

    # ── Resonance pillars ────────────────────────────────────────────────
    for pi in range(4):
        angle = pi * TAU / 4
        px = math.cos(angle) * 3.0
        pz = math.sin(angle) * 3.0
        pillar = add_crystal_bmesh('resonance_pillar_' + str(pi),
                                   0.18, 3.5 + (pi % 2) * 0.8,
                                   (px, 0.0, pz), violet,
                                   sides=6, lean_x=0.1 * math.cos(angle),
                                   lean_z=0.1 * math.sin(angle))
        parts.append(pillar)
        # Glow at pillar top
        glow_sphere = add_sphere('pillar_glow_' + str(pi), 0.08,
                                 (px + 0.1 * math.cos(angle),
                                  3.5 + (pi % 2) * 0.8,
                                  pz + 0.1 * math.sin(angle)),
                                 energy, segments=8, rings=6)
        parts.append(glow_sphere)

    # ── Crystal debris around base ───────────────────────────────────────
    for di in range(10):
        angle = di * TAU / 10
        dr = 2.7 + (di % 3) * 0.35
        dx = math.cos(angle) * dr
        dz = math.sin(angle) * dr
        debris = add_crystal_bmesh('crystal_debris_' + str(di),
                                   0.12 + (di % 3) * 0.06,
                                   0.4 + (di % 4) * 0.15,
                                   (dx, 0.1, dz),
                                   shards if di % 2 else violet,
                                   sides=5, lean_x=0.05, lean_z=0.05)
        debris.rotation_euler = (
            (di * 0.5) % 0.8,
            di * 0.63,
            (di * 0.35) % 0.6 - 0.3,
        )
        parts.append(debris)

    # ── Status energy spheres ────────────────────────────────────────────
    for ei in range(6):
        angle = ei * TAU / 6
        ex = math.cos(angle) * 2.3
        ey = 1.2 + (ei % 3) * 0.6
        ez = math.sin(angle) * 2.3
        glow = add_sphere('energy_node_' + str(ei), 0.055,
                          (ex, ey, ez), energy, segments=8, rings=6)
        parts.append(glow)

    return parts


# ══════════════════════════════════════════════════════════════════════════
#  EXPORT
# ══════════════════════════════════════════════════════════════════════════

def export_model(parts, name):
    """Apply all modifiers, select parts, export as GLB."""
    # First apply modifiers on each part
    for obj in parts:
        if obj is None:
            continue
        set_active(obj)
        for mod in list(obj.modifiers):
            try:
                bpy.ops.object.modifier_apply(modifier=mod.name)
            except RuntimeError:
                # Some modifiers may fail to apply; skip gracefully
                try:
                    bpy.ops.object.modifier_remove(modifier=mod.name)
                except Exception:
                    pass
        obj.select_set(False)

    # Select all valid parts
    bpy.ops.object.select_all(action='DESELECT')
    valid = [o for o in parts if o is not None and o.name in bpy.data.objects]
    for obj in valid:
        obj.select_set(True)
    if valid:
        bpy.context.view_layer.objects.active = valid[0]

    filepath = os.path.join(OUTPUT_DIR, name + '.glb')
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=True,
        export_apply=False,  # already applied
        export_normals=True,
        export_materials='EXPORT',
        export_yup=True,
    )
    size = os.path.getsize(filepath)
    tri_count = sum(len(o.data.polygons) for o in valid
                    if hasattr(o, 'data') and hasattr(o.data, 'polygons'))
    print(f"  {name}.glb  {size:,} bytes  ~{tri_count} faces")


# ══════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("  Chromatron3D — Premium Hero Model Generator")
    print("=" * 60)
    builders = [
        ('orbital', build_orbital),
        ('verdant', build_verdant),
        ('polar',   build_polar),
        ('nebula',  build_nebula),
    ]
    for name, builder in builders:
        print(f"\n  Building {name}...")
        clear_scene()
        parts = builder()
        print(f"    {len(parts)} objects created")
        export_model(parts, name)
    print("\n  All hero biome models generated.\n")


if __name__ == '__main__':
    main()
