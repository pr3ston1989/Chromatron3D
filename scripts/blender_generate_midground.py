"""
Chromatron3D — Premium midground set-piece model generator (Blender 4.x / 5.x)

Run headless:
  "C:/Tools/blender-5.3.0-windows-x64/blender.exe" --background --python scripts/blender_generate_midground.py

Produces 8 GLB files in public/models/midground/
"""

import bpy
import bmesh
import math
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
OUTPUT_DIR = os.path.join(PROJECT_DIR, 'public', 'models', 'midground')

TAU = math.pi * 2

# ─── Utilities ──────────────────────────────────────────────────────────────

def hex_to_linear(hex_color):
    """Convert 0xRRGGBB to linear sRGB tuple for Blender."""
    r = ((hex_color >> 16) & 0xFF) / 255.0
    g = ((hex_color >> 8) & 0xFF) / 255.0
    b = (hex_color & 0xFF) / 255.0
    # sRGB to linear approximation
    def to_lin(c): return pow(c, 2.2) if c > 0.04045 else c / 12.92
    return (to_lin(r), to_lin(g), to_lin(b))


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=True)
    for block in list(bpy.data.meshes):
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        if block.users == 0:
            bpy.data.materials.remove(block)
    for block in list(bpy.data.curves):
        if block.users == 0:
            bpy.data.curves.remove(block)
    for col in list(bpy.data.collections):
        if col != bpy.context.scene.collection:
            bpy.data.collections.remove(col)


def make_material(name, color_hex, metallic=0.5, roughness=0.5,
                  emission_hex=0, emission_strength=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    if not mat.use_nodes:
        mat.use_nodes = True
    mat.use_backface_culling = False
    nodes = mat.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    col = hex_to_linear(color_hex)
    bsdf.inputs['Base Color'].default_value = (*col, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if emission_hex and emission_strength > 0:
        ecol = hex_to_linear(emission_hex)
        bsdf.inputs['Emission Color'].default_value = (*ecol, 1.0)
        bsdf.inputs['Emission Strength'].default_value = emission_strength
    if alpha < 1.0:
        mat.blend_method = 'BLEND'
        bsdf.inputs['Alpha'].default_value = alpha
    return mat


def apply_smooth(obj, auto_angle_deg=35):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    obj.select_set(False)
    mesh = obj.data
    if hasattr(mesh, 'use_auto_smooth'):
        mesh.use_auto_smooth = True
        mesh.auto_smooth_angle = math.radians(auto_angle_deg)


def add_bevel(obj, width=0.015, segments=2, limit_method='ANGLE', angle_limit=60):
    mod = obj.modifiers.new('Bevel', 'BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = limit_method
    if limit_method == 'ANGLE':
        mod.angle_limit = math.radians(angle_limit)
    return mod


def add_subsurf(obj, levels=2, render_levels=2):
    mod = obj.modifiers.new('SubSurf', 'SUBSURF')
    mod.levels = levels
    mod.render_levels = render_levels
    return mod


def apply_all_modifiers(obj):
    bpy.context.view_layer.objects.active = obj
    for mod in list(obj.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except Exception:
            pass


def join_objects(objects):
    if not objects:
        return None
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    return bpy.context.active_object


def add_box(name, location, dimensions, material, bevel_width=0.015):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (dimensions[0], dimensions[2], dimensions[1])  # Blender: X, Y(depth), Z(height)
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(material)
    if bevel_width > 0:
        add_bevel(obj, width=bevel_width, segments=2)
    apply_smooth(obj)
    return obj


def add_cylinder(name, location, radius, depth, material, vertices=16):
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius, depth=depth, vertices=vertices, location=location
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(material)
    apply_smooth(obj, auto_angle_deg=50)
    return obj


def add_sphere(name, location, radius, material, segments=16, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius, segments=segments, ring_count=rings, location=location
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(material)
    apply_smooth(obj)
    return obj


def add_cone(name, location, radius1, radius2, depth, material, vertices=12):
    bpy.ops.mesh.primitive_cone_add(
        radius1=radius1, radius2=radius2, depth=depth,
        vertices=vertices, location=location
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(material)
    apply_smooth(obj, auto_angle_deg=55)
    return obj


def add_torus(name, location, major_radius, minor_radius, material,
              major_segments=32, minor_segments=10, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius, minor_radius=minor_radius,
        major_segments=major_segments, minor_segments=minor_segments,
        location=location, rotation=rotation
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(material)
    apply_smooth(obj)
    return obj


def make_crystal(name, location, height, radius, material, sides=6, taper=0.3,
                 lean_x=0, lean_z=0):
    """Hexagonal crystal prism that tapers to a point."""
    bm = bmesh.new()
    # Bottom ring
    bottom_verts = []
    for i in range(sides):
        angle = i * TAU / sides
        x = math.cos(angle) * radius
        y = math.sin(angle) * radius
        bottom_verts.append(bm.verts.new((x + location[0], y + location[1],
                                          location[2])))
    # Middle ring (widest)
    mid_verts = []
    mid_h = height * 0.3
    for i in range(sides):
        angle = i * TAU / sides + TAU / sides / 2 * 0.15
        x = math.cos(angle) * radius * 1.05
        y = math.sin(angle) * radius * 1.05
        mid_verts.append(bm.verts.new((x + location[0] + lean_x * 0.3,
                                       y + location[1] + lean_z * 0.3,
                                       location[2] + mid_h)))
    # Shoulder ring
    shoulder_verts = []
    shoulder_h = height * 0.7
    for i in range(sides):
        angle = i * TAU / sides
        x = math.cos(angle) * radius * taper
        y = math.sin(angle) * radius * taper
        shoulder_verts.append(bm.verts.new((x + location[0] + lean_x * 0.7,
                                            y + location[1] + lean_z * 0.7,
                                            location[2] + shoulder_h)))
    # Tip
    tip = bm.verts.new((location[0] + lean_x, location[1] + lean_z,
                         location[2] + height))
    # Bottom cap
    bottom_center = bm.verts.new(location)
    for i in range(sides):
        bm.faces.new([bottom_center, bottom_verts[i],
                       bottom_verts[(i + 1) % sides]])
    # Walls
    for ring_a, ring_b in [(bottom_verts, mid_verts),
                            (mid_verts, shoulder_verts)]:
        for i in range(sides):
            j = (i + 1) % sides
            bm.faces.new([ring_a[i], ring_a[j], ring_b[j], ring_b[i]])
    # Top cone
    for i in range(sides):
        bm.faces.new([shoulder_verts[i], shoulder_verts[(i + 1) % sides], tip])

    bm.normal_update()
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    add_subsurf(obj, levels=1, render_levels=1)
    apply_smooth(obj, auto_angle_deg=40)
    return obj


def make_beam(name, start, end, width, depth, material):
    """Rectangular beam between two 3D points."""
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    dz = end[2] - start[2]
    length = math.sqrt(dx * dx + dy * dy + dz * dz)
    if length < 0.001:
        return None
    mid = ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2,
           (start[2] + end[2]) / 2)
    bpy.ops.mesh.primitive_cube_add(size=1, location=mid)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (width, depth, length)
    # Point Z-axis along beam direction
    direction = (dx / length, dy / length, dz / length)
    up = (0, 0, 1)
    # Rotation to align Z to direction
    dot = up[0] * direction[0] + up[1] * direction[1] + up[2] * direction[2]
    if abs(dot - 1.0) < 0.0001:
        pass  # Already aligned
    elif abs(dot + 1.0) < 0.0001:
        obj.rotation_euler = (math.pi, 0, 0)
    else:
        cross = (up[1] * direction[2] - up[2] * direction[1],
                 up[2] * direction[0] - up[0] * direction[2],
                 up[0] * direction[1] - up[1] * direction[0])
        angle = math.acos(max(-1, min(1, dot)))
        cl = math.sqrt(cross[0]**2 + cross[1]**2 + cross[2]**2)
        if cl > 0.0001:
            axis = (cross[0] / cl, cross[1] / cl, cross[2] / cl)
            from mathutils import Matrix, Vector
            rot_mat = Matrix.Rotation(angle, 4, Vector(axis))
            obj.matrix_world = rot_mat @ obj.matrix_world
            obj.location = mid
    bpy.ops.object.transform_apply(rotation=True, scale=True)
    obj.data.materials.append(material)
    add_bevel(obj, width=min(width, depth) * 0.15, segments=2)
    apply_smooth(obj)
    return obj


def make_pipe(name, points, radius, material, resolution=8):
    """Create a pipe mesh following a path of points."""
    curve_data = bpy.data.curves.new(name + '_curve', 'CURVE')
    curve_data.dimensions = '3D'
    spline = curve_data.splines.new('NURBS')
    spline.points.add(len(points) - 1)
    for i, pt in enumerate(points):
        spline.points[i].co = (*pt, 1)
    spline.use_endpoint_u = True
    spline.order_u = min(4, len(points))
    curve_data.bevel_depth = radius
    curve_data.bevel_resolution = resolution
    curve_obj = bpy.data.objects.new(name + '_curve_obj', curve_data)
    bpy.context.collection.objects.link(curve_obj)
    bpy.context.view_layer.objects.active = curve_obj
    curve_obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(material)
    apply_smooth(obj, auto_angle_deg=60)
    return obj


def make_leaf(name, base, tip, width, material):
    """A simple diamond-shaped leaf."""
    bm = bmesh.new()
    dx = tip[0] - base[0]
    dy = tip[1] - base[1]
    dz = tip[2] - base[2]
    length = math.sqrt(dx * dx + dy * dy + dz * dz)
    if length < 0.001:
        bm.free()
        return None
    # Side direction
    fwd = (dx / length, dy / length, dz / length)
    up = (0, 0, 1) if abs(fwd[2]) < 0.9 else (1, 0, 0)
    side = (fwd[1] * up[2] - fwd[2] * up[1],
            fwd[2] * up[0] - fwd[0] * up[2],
            fwd[0] * up[1] - fwd[1] * up[0])
    sl = math.sqrt(side[0]**2 + side[1]**2 + side[2]**2)
    if sl < 0.001:
        bm.free()
        return None
    side = (side[0] / sl * width, side[1] / sl * width, side[2] / sl * width)
    mid = ((base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2,
           (base[2] + tip[2]) / 2)
    ridge = (mid[0] + fwd[2] * 0.06, mid[1] - fwd[0] * 0.06,
             mid[2] + 0.05)
    v_base = bm.verts.new(base)
    v_tip = bm.verts.new(tip)
    v_left = bm.verts.new((mid[0] + side[0], mid[1] + side[1],
                            mid[2] + side[2]))
    v_right = bm.verts.new((mid[0] - side[0], mid[1] - side[1],
                             mid[2] - side[2]))
    v_ridge = bm.verts.new(ridge)
    bm.faces.new([v_base, v_left, v_ridge])
    bm.faces.new([v_base, v_ridge, v_right])
    bm.faces.new([v_ridge, v_left, v_tip])
    bm.faces.new([v_ridge, v_tip, v_right])
    bm.normal_update()
    mesh_data = bpy.data.meshes.new(name)
    bm.to_mesh(mesh_data)
    bm.free()
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    apply_smooth(obj, auto_angle_deg=70)
    return obj


def make_snow_drift(name, location, radius_x, radius_y, height, material):
    """Smooth snow mound — half UV sphere, subdivided."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=1, segments=12, ring_count=8, location=location
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (radius_x, radius_y, height)
    bpy.ops.object.transform_apply(scale=True)
    # Delete bottom half
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    bm = bmesh.from_edit_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    for v in bm.verts:
        if v.co.z < -0.01:
            v.select = True
    bm.select_flush(True)
    # Delete selected geometry
    selected_faces = [f for f in bm.faces if all(v.select for v in f.verts)]
    bmesh.ops.delete(bm, geom=selected_faces, context='FACES')
    bmesh.update_edit_mesh(obj.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.data.materials.append(material)
    add_subsurf(obj, levels=1, render_levels=1)
    apply_smooth(obj)
    return obj


def export_glb(filepath, objects):
    """Select given objects and export as GLB."""
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        if obj:
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_normals=True,
        export_materials='EXPORT',
    )
    size = os.path.getsize(filepath)
    print(f"  Exported: {os.path.basename(filepath)} ({size:,} bytes)")


# ═══════════════════════════════════════════════════════════════════════════
# ORBITAL BIOME — Industrial set pieces
# ═══════════════════════════════════════════════════════════════════════════

def build_orbital_dock():
    """Orbital Maintenance Dock and Cargo Bay — industrial platform with containers."""
    steel = make_material('dock_steel', 0x3b5364, metallic=0.70, roughness=0.50)
    silver = make_material('dock_silver', 0xa2b4b6, metallic=0.50, roughness=0.41)
    amber = make_material('dock_amber', 0xf3b96d, metallic=0.26, roughness=0.47,
                          emission_hex=0x713b15, emission_strength=0.6)
    cyan = make_material('dock_cyan', 0x60cde5, metallic=0.20, roughness=0.28,
                         emission_hex=0x177e9a, emission_strength=0.5)

    parts = []

    # Main platform
    parts.append(add_box('dock_platform', (0, 0, 0.15), (6.0, 0.30, 3.0),
                         steel, bevel_width=0.025))

    # Vertical pylons
    for sign in [-1, 1]:
        parts.append(add_box(f'dock_pylon_{sign}', (sign * 2.7, 0, 0.95),
                             (0.25, 1.6, 0.25), steel, bevel_width=0.02))
        # Cross braces
        parts.append(add_box(f'dock_brace_{sign}', (sign * 2.7, 0, 0.50),
                             (0.22, 0.08, 0.65), silver, bevel_width=0.008))

    # Crane rail at top
    parts.append(add_box('dock_crane_rail', (0, 0, 1.85),
                         (5.6, 0.14, 0.20), silver, bevel_width=0.012))
    # Rail supports
    for x in [-1.8, 0, 1.8]:
        parts.append(add_box(f'dock_rail_support_{x}', (x, 0, 1.72),
                             (0.08, 0.22, 0.12), steel, bevel_width=0.006))

    # Cargo containers — stacked with slight variation
    container_data = [
        (-0.9, 0.3, 0.58, 1.05, 0.55, 1.15),
        (-0.9, 0.3, 1.18, 1.0, 0.50, 1.10),
        (0.7, -0.2, 0.55, 0.90, 0.50, 1.0),
        (0.7, 0.5, 0.55, 0.85, 0.50, 0.80),
    ]
    for i, (x, y, z, w, h, d) in enumerate(container_data):
        parts.append(add_box(f'dock_container_{i}', (x, y, z),
                             (w, h, d), silver if i % 2 else steel,
                             bevel_width=0.012))
        # Panel line inset
        parts.append(add_box(f'dock_panel_{i}', (x, y + d * 0.51, z),
                             (w * 0.75, h * 0.6, 0.01), amber if i == 1 else cyan,
                             bevel_width=0.004))

    # Walkway grating
    parts.append(add_box('dock_walkway', (0, -1.25, 0.35),
                         (4.5, 0.06, 0.90), silver, bevel_width=0.005))

    # Pipe runs
    for i, z_off in enumerate([0.08, 0.14]):
        parts.append(make_pipe(f'dock_pipe_{i}',
                               [(-2.8, 1.3, z_off), (-1.5, 1.3, z_off),
                                (1.5, 1.3, z_off), (2.8, 1.3, z_off)],
                               0.04, steel))

    # Warning lights at pylon tops
    for sign in [-1, 1]:
        parts.append(add_sphere(f'dock_light_{sign}', (sign * 2.7, 0, 1.88),
                                0.07, amber, segments=10, rings=8))

    # Status strip on platform edge
    parts.append(add_box('dock_status_strip', (0, 1.48, 0.31),
                         (5.2, 0.03, 0.05), cyan, bevel_width=0.003))

    return [p for p in parts if p]


def build_orbital_comms():
    """Orbital Signal Transmission Mast — lattice tower with antenna dishes."""
    steel = make_material('comms_steel', 0x3b5364, metallic=0.70, roughness=0.50)
    silver = make_material('comms_silver', 0xa2b4b6, metallic=0.50, roughness=0.41)
    amber = make_material('comms_amber', 0xf3b96d, metallic=0.26, roughness=0.47,
                          emission_hex=0x713b15, emission_strength=0.6)
    cyan = make_material('comms_cyan', 0x60cde5, metallic=0.20, roughness=0.28,
                         emission_hex=0x177e9a, emission_strength=0.8)

    parts = []

    # Base platform (octagonal feel via cylinder with 8 sides)
    parts.append(add_cylinder('comms_base', (0, 0, 0.12), 1.8, 0.24, steel, vertices=8))
    parts.append(add_cylinder('comms_base_ring', (0, 0, 0.26), 1.6, 0.06, silver, vertices=8))

    # Four converging lattice pylons
    offsets = [(0.6, 0.6), (-0.6, 0.6), (-0.6, -0.6), (0.6, -0.6)]
    top_offsets = [(0.12, 0.12), (-0.12, 0.12), (-0.12, -0.12), (0.12, -0.12)]
    for i, ((bx, by), (tx, ty)) in enumerate(zip(offsets, top_offsets)):
        parts.append(make_beam(f'comms_pylon_{i}',
                               (bx, by, 0.30), (tx, ty, 5.0), 0.10, 0.10, steel))

    # Cross bracing at multiple heights
    for h in [1.2, 2.4, 3.6]:
        t = h / 5.0
        for i in range(4):
            j = (i + 1) % 4
            bx1, by1 = offsets[i]
            bx2, by2 = offsets[j]
            tx1, ty1 = top_offsets[i]
            tx2, ty2 = top_offsets[j]
            x1 = bx1 + (tx1 - bx1) * t
            y1 = by1 + (ty1 - by1) * t
            x2 = bx2 + (tx2 - bx2) * t
            y2 = by2 + (ty2 - by2) * t
            parts.append(make_beam(f'comms_brace_{h}_{i}',
                                   (x1, y1, h), (x2, y2, h), 0.05, 0.05, silver))

    # Central mast above convergence
    parts.append(add_cylinder('comms_mast', (0, 0, 5.7), 0.07, 1.8, silver, vertices=8))

    # Main antenna dish at top — half sphere
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.65, segments=16, ring_count=12,
                                          location=(0, 0, 6.4))
    dish = bpy.context.active_object
    dish.name = 'comms_main_dish'
    # Cut to hemisphere
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    bm = bmesh.from_edit_mesh(dish.data)
    bm.verts.ensure_lookup_table()
    for v in bm.verts:
        if v.co.z > 0.05:
            v.select = True
    bm.select_flush(True)
    selected = [f for f in bm.faces if all(v.select for v in f.verts)]
    bmesh.ops.delete(bm, geom=selected, context='FACES')
    bmesh.update_edit_mesh(dish.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    dish.rotation_euler = (math.pi, 0, 0.3)
    dish.data.materials.append(silver)
    add_subsurf(dish, 1, 1)
    apply_smooth(dish)
    parts.append(dish)

    # Dish support strut
    parts.append(add_cylinder('comms_dish_strut', (0, 0, 6.15), 0.04, 0.5,
                              steel, vertices=6))

    # Secondary smaller dish at 60% height
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.35, segments=12, ring_count=8,
                                          location=(0.4, 0.2, 3.8))
    dish2 = bpy.context.active_object
    dish2.name = 'comms_secondary_dish'
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    bm = bmesh.from_edit_mesh(dish2.data)
    bm.verts.ensure_lookup_table()
    for v in bm.verts:
        if v.co.z > 0.05:
            v.select = True
    bm.select_flush(True)
    selected = [f for f in bm.faces if all(v.select for v in f.verts)]
    bmesh.ops.delete(bm, geom=selected, context='FACES')
    bmesh.update_edit_mesh(dish2.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    dish2.rotation_euler = (math.pi * 0.85, 0.3, 0.5)
    dish2.data.materials.append(steel)
    apply_smooth(dish2)
    parts.append(dish2)

    # Ring antenna element
    parts.append(add_torus('comms_ring_antenna', (0, 0, 4.8),
                           0.55, 0.04, cyan, major_segments=24, minor_segments=8))

    # Signal light at apex
    parts.append(add_sphere('comms_apex_light', (0, 0, 6.75), 0.09, cyan,
                            segments=10, rings=8))

    # Equipment box at base
    parts.append(add_box('comms_equipment', (1.2, 0.3, 0.38), (0.6, 0.40, 0.45),
                         steel, bevel_width=0.012))
    parts.append(add_box('comms_equip_panel', (1.2, 0.3 + 0.23, 0.38),
                         (0.4, 0.25, 0.015), amber, bevel_width=0.003))

    return [p for p in parts if p]


# ═══════════════════════════════════════════════════════════════════════════
# VERDANT BIOME — Organic overgrown set pieces
# ═══════════════════════════════════════════════════════════════════════════

def build_verdant_greenhouse():
    """Reclaimed Botanical Glasshouse — quonset structure with vegetation."""
    alloy = make_material('gh_alloy', 0x4f6d62, metallic=0.30, roughness=0.71)
    glass = make_material('gh_glass', 0x82aea0, metallic=0.05, roughness=0.20, alpha=0.55)
    vine = make_material('gh_vine', 0x426c47, metallic=0.0, roughness=0.94)
    foliage = make_material('gh_foliage', 0x65b978, metallic=0.0, roughness=0.93)
    spore = make_material('gh_spore', 0x85e5b4, metallic=0.0, roughness=0.32,
                          emission_hex=0x248e69, emission_strength=0.8)

    parts = []

    # Base platform
    parts.append(add_box('gh_base', (0, 0, 0.10), (5.8, 0.20, 3.15), alloy,
                         bevel_width=0.018))

    # 5 arch ribs forming greenhouse frame
    for i, x in enumerate([-2.4, -1.2, 0, 1.2, 2.4]):
        rib_pts = []
        for j in range(17):
            angle = j * math.pi / 16
            rib_pts.append((x, -math.cos(angle) * 1.4, 0.22 + math.sin(angle) * 1.8))
        parts.append(make_pipe(f'gh_rib_{i}', rib_pts, 0.06, alloy, resolution=4))

    # Glass panels between ribs (thin curved planes via ribs)
    for i in range(4):
        x_mid = -1.8 + i * 1.2
        # Simplified: use a box-like pane
        if i != 2:  # One panel is broken/missing
            parts.append(add_box(f'gh_glass_{i}', (x_mid, 0, 1.3),
                                 (1.0, 0.015, 1.4), glass, bevel_width=0.003))

    # Roof ridge panels (with gaps)
    parts.append(add_box('gh_roof_left', (-0.6, -0.6, 1.9),
                         (4.0, 0.015, 0.8), glass, bevel_width=0.003))
    parts.append(add_box('gh_roof_right', (0.4, 0.6, 1.9),
                         (3.6, 0.015, 0.8), glass, bevel_width=0.003))

    # Ground-level planting beds
    for sign in [-1, 1]:
        parts.append(add_box(f'gh_bed_{sign}', (0, sign * 0.8, 0.35),
                             (4.5, 0.25, 0.5), alloy, bevel_width=0.010))
        # Green fill inside
        parts.append(add_box(f'gh_soil_{sign}', (0, sign * 0.8, 0.50),
                             (4.3, 0.08, 0.42), foliage, bevel_width=0.0))

    # Vegetation overflowing from broken panel gap
    for j in range(8):
        bx = 0.6 + j * 0.3
        by = (j % 3 - 1) * 0.4
        bz = 0.4 + j * 0.12
        tip = (bx + 0.15, by + 0.3, bz + 0.55 + (j % 2) * 0.2)
        leaf = make_leaf(f'gh_leaf_{j}', (bx, by, bz), tip,
                         0.15 + (j % 3) * 0.05,
                         foliage if j % 2 else vine)
        if leaf:
            parts.append(leaf)

    # Vine tendrils on exterior
    vine_paths = [
        [(-2.0, -1.35, 0.3), (-2.2, -1.3, 0.8), (-2.1, -1.1, 1.3),
         (-1.9, -0.8, 1.7)],
        [(1.5, 1.3, 0.25), (1.7, 1.2, 0.7), (1.6, 0.9, 1.2),
         (1.4, 0.7, 1.6)],
    ]
    for i, pts in enumerate(vine_paths):
        parts.append(make_pipe(f'gh_vine_{i}', pts, 0.035, vine, resolution=4))
        # Leaves along vine
        for j in range(1, len(pts)):
            p = pts[j]
            tip = (p[0] + 0.25, p[1] + 0.15, p[2] + 0.2)
            leaf = make_leaf(f'gh_vine_leaf_{i}_{j}', p, tip, 0.12, foliage)
            if leaf:
                parts.append(leaf)

    # Spore lamp inside (glowing accent)
    parts.append(add_sphere('gh_spore_lamp', (0, 0, 1.0), 0.12, spore,
                            segments=10, rings=8))

    return [p for p in parts if p]


def build_verdant_root_tower():
    """Root-Wrapped Memory Pillar — tech pillar consumed by vegetation."""
    alloy = make_material('rt_alloy', 0x4f6d62, metallic=0.30, roughness=0.71)
    glass = make_material('rt_glass', 0x82aea0, metallic=0.10, roughness=0.64)
    vine = make_material('rt_vine', 0x426c47, metallic=0.0, roughness=0.94)
    foliage = make_material('rt_foliage', 0x65b978, metallic=0.0, roughness=0.93)
    glow = make_material('rt_glow', 0x85e5b4, metallic=0.0, roughness=0.32,
                         emission_hex=0x248e69, emission_strength=0.8)

    parts = []

    # Base platform
    parts.append(add_box('rt_base', (0, 0, 0.10), (3.8, 0.20, 3.0), alloy,
                         bevel_width=0.015))

    # Central pillar
    p = add_box('rt_pillar', (0, 0, 2.15), (1.3, 3.5, 0.9), alloy,
                bevel_width=0.025)
    parts.append(p)

    # Pillar cap
    parts.append(add_box('rt_cap', (0, 0, 4.0), (1.5, 0.14, 1.1), alloy,
                         bevel_width=0.012))

    # 7 wrapping root tendrils
    for j in range(7):
        angle_start = j * TAU / 7
        pts = []
        for k in range(12):
            t = k / 11.0
            angle = angle_start + t * math.pi * 1.8
            dist = 0.75 + 0.15 * math.sin(k * 2.1)
            x = math.cos(angle) * dist
            y = math.sin(angle) * dist
            z = 0.25 + t * 3.8
            pts.append((x, y, z))
        r = 0.07 + (j % 3) * 0.02
        parts.append(make_pipe(f'rt_root_{j}', pts, r, vine, resolution=4))

        # Leaves at root nodes
        for k in [3, 6, 9]:
            if k < len(pts):
                p_leaf = pts[k]
                side = 0.4 if j % 2 else -0.4
                tip = (p_leaf[0] + side, p_leaf[1] + 0.2, p_leaf[2] + 0.3)
                leaf = make_leaf(f'rt_leaf_{j}_{k}', p_leaf, tip, 0.16,
                                foliage if k % 2 else vine)
                if leaf:
                    parts.append(leaf)

    # Tech panel visible between roots
    parts.append(add_box('rt_tech_panel', (0.68, 0, 1.6), (0.015, 0.7, 0.4),
                         glass, bevel_width=0.003))

    # Glowing circuit accent
    parts.append(add_box('rt_circuit', (0.69, 0, 1.6), (0.005, 0.5, 0.03),
                         glow, bevel_width=0.0))

    # Crown foliage at top
    for k in range(10):
        angle = k * TAU / 10
        bx = math.cos(angle) * 0.5
        by = math.sin(angle) * 0.5
        bz = 4.1
        tip = (bx + math.cos(angle) * 0.35, by + math.sin(angle) * 0.35,
               bz + 0.5 + (k % 3) * 0.15)
        leaf = make_leaf(f'rt_crown_{k}', (bx, by, bz), tip, 0.18,
                        foliage if k % 2 else vine)
        if leaf:
            parts.append(leaf)

    # Moss patches on pillar (small flattened spheres)
    moss_spots = [(0.62, 0.2, 1.0), (-0.62, -0.15, 1.5), (0.3, 0.43, 2.5),
                  (-0.4, -0.43, 0.8)]
    for i, (mx, my, mz) in enumerate(moss_spots):
        s = add_sphere(f'rt_moss_{i}', (mx, my, mz), 0.10, vine,
                       segments=8, rings=6)
        s.scale = (1.3, 1.3, 0.3)
        bpy.context.view_layer.objects.active = s
        bpy.ops.object.transform_apply(scale=True)
        parts.append(s)

    # Glowing ring at crown base
    parts.append(add_torus('rt_glow_ring', (0, 0, 4.05), 0.65, 0.03, glow,
                           major_segments=20, minor_segments=6))

    return [p for p in parts if p]


# ═══════════════════════════════════════════════════════════════════════════
# POLAR BIOME — Frozen research set pieces
# ═══════════════════════════════════════════════════════════════════════════

def build_polar_bridge():
    """Frozen Relay Bridge — ice-encrusted bridge with crystal growths."""
    steel = make_material('pb_steel', 0x425a76, metallic=0.55, roughness=0.52)
    ice_blue = make_material('pb_ice_blue', 0x87c6e3, metallic=0.05, roughness=0.22)
    ice_white = make_material('pb_ice_white', 0xc7e7f0, metallic=0.03, roughness=0.25)
    relay = make_material('pb_relay', 0x79d9f2, metallic=0.10, roughness=0.28,
                          emission_hex=0x168bbd, emission_strength=0.7)

    parts = []

    # Two support pillars
    for sign in [-1, 1]:
        parts.append(add_box(f'pb_pillar_{sign}', (sign * 2.2, 0, 0.90),
                             (0.60, 1.60, 0.55), steel, bevel_width=0.020))
        # Pillar base plate
        parts.append(add_box(f'pb_pillar_base_{sign}', (sign * 2.2, 0, 0.15),
                             (0.85, 0.12, 0.75), steel, bevel_width=0.012))

    # Bridge span
    parts.append(add_box('pb_span', (0, 0, 1.75), (4.6, 0.25, 1.0),
                         steel, bevel_width=0.018))

    # Railings
    for sign_z in [-1, 1]:
        parts.append(add_box(f'pb_railing_{sign_z}', (0, sign_z * 0.45, 2.05),
                             (4.6, 0.10, 0.08), steel, bevel_width=0.006))

    # Railing posts
    for x in [-2.0, -1.0, 0, 1.0, 2.0]:
        for sign_z in [-1, 1]:
            parts.append(add_cylinder(f'pb_post_{x}_{sign_z}',
                                      (x, sign_z * 0.45, 1.95), 0.025, 0.25,
                                      steel, vertices=6))

    # Ice crystal formations
    crystal_data = [
        (-1.5, 0.5, 0.0, 1.8, 0.22, 0.15, 0),
        (0.3, -0.6, 0.0, 2.4, 0.28, -0.1, 0.1),
        (1.8, 0.3, 0.0, 1.5, 0.18, 0.08, 0),
        (-0.8, -0.4, 0.0, 1.2, 0.15, 0.12, -0.05),
        (0.9, 0.6, 1.75, 0.8, 0.12, 0.0, 0.08),  # Growing on bridge
    ]
    for i, (cx, cy, cz, ch, cr, lx, lz) in enumerate(crystal_data):
        parts.append(make_crystal(f'pb_crystal_{i}', (cx, cy, cz), ch, cr,
                                  ice_blue if i % 2 else ice_white, sides=6,
                                  lean_x=lx, lean_z=lz))

    # Tall spire at one end
    parts.append(make_crystal('pb_tall_spire', (-2.5, -0.3, 0.0), 3.2, 0.35,
                              ice_blue, sides=6, taper=0.25, lean_x=-0.15))

    # Icicles hanging from bridge
    for i in range(7):
        x = -2.0 + i * 0.6
        parts.append(add_cone(f'pb_icicle_{i}', (x, 0, 1.45),
                              0.04, 0.01, 0.3 + (i % 3) * 0.15,
                              ice_white, vertices=6))

    # Snow drifts
    drift_data = [(-1.5, 0.8, 0.05), (1.0, -0.7, 0.05), (2.5, 0.4, 0.05)]
    for i, (dx, dy, dz) in enumerate(drift_data):
        parts.append(make_snow_drift(f'pb_drift_{i}', (dx, dy, dz),
                                     0.5 + i * 0.1, 0.4, 0.18 + i * 0.04,
                                     ice_white))

    # Signal relay light
    parts.append(add_sphere('pb_relay_light', (-2.2, 0, 1.82), 0.07, relay,
                            segments=10, rings=8))

    return [p for p in parts if p]


def build_polar_geolab():
    """Arctic Research Cabin — outpost with ice formations."""
    steel = make_material('gl_steel', 0x425a76, metallic=0.55, roughness=0.52)
    ice_blue = make_material('gl_ice_blue', 0x87c6e3, metallic=0.05, roughness=0.22)
    ice_white = make_material('gl_ice_white', 0xc7e7f0, metallic=0.03, roughness=0.25)
    relay = make_material('gl_relay', 0x79d9f2, metallic=0.10, roughness=0.28,
                          emission_hex=0x168bbd, emission_strength=0.7)

    parts = []

    # Foundation
    parts.append(add_box('gl_foundation', (0, 0, 0.15), (4.8, 0.30, 2.75),
                         steel, bevel_width=0.020))

    # Main cabin body
    parts.append(add_box('gl_cabin', (0, 0, 1.45), (3.6, 2.0, 2.15),
                         steel, bevel_width=0.030))

    # Sloped roof — wedge shape
    bm = bmesh.new()
    # Bottom quad
    v1 = bm.verts.new((-1.95, -1.20, 2.45))
    v2 = bm.verts.new((1.95, -1.20, 2.45))
    v3 = bm.verts.new((1.95, 1.20, 2.45))
    v4 = bm.verts.new((-1.95, 1.20, 2.45))
    # Top ridge
    v5 = bm.verts.new((-1.95, 0, 3.0))
    v6 = bm.verts.new((1.95, 0, 3.0))
    bm.faces.new([v1, v2, v3, v4])  # bottom
    bm.faces.new([v1, v2, v6, v5])  # front slope
    bm.faces.new([v4, v3, v6, v5])  # back slope (reversed)
    bm.faces.new([v1, v4, v5])  # left end
    bm.faces.new([v2, v3, v6])  # right end
    bm.normal_update()
    roof_mesh = bpy.data.meshes.new('gl_roof')
    bm.to_mesh(roof_mesh)
    bm.free()
    roof_obj = bpy.data.objects.new('gl_roof', roof_mesh)
    bpy.context.collection.objects.link(roof_obj)
    roof_obj.data.materials.append(steel)
    add_bevel(roof_obj, width=0.02, segments=2)
    apply_smooth(roof_obj)
    parts.append(roof_obj)

    # Windows (emissive from inside)
    for sign_y in [-1, 1]:
        parts.append(add_box(f'gl_window_{sign_y}',
                             (-0.5, sign_y * 1.08, 1.5),
                             (0.8, 0.02, 0.55), relay, bevel_width=0.004))
    # Front window
    parts.append(add_box('gl_window_front', (1.81, 0, 1.5),
                         (0.02, 0.6, 0.5), relay, bevel_width=0.004))

    # Ice formations on walls
    ice_data = [
        (1.2, -1.15, 0.3, 0.8, 0.15, 0.06, 0),
        (-1.0, 1.15, 0.3, 1.0, 0.18, 0, 0.08),
        (-1.8, -0.5, 0.3, 0.65, 0.12, -0.05, 0),
        (0.5, 1.15, 0.3, 0.55, 0.10, 0, 0.04),
        (1.8, 0.6, 0.3, 0.75, 0.14, 0.06, 0),
    ]
    for i, (cx, cy, cz, ch, cr, lx, lz) in enumerate(ice_data):
        parts.append(make_crystal(f'gl_ice_{i}', (cx, cy, cz), ch, cr,
                                  ice_blue if i % 2 else ice_white,
                                  lean_x=lx, lean_z=lz))

    # Radar mast on roof
    parts.append(add_cylinder('gl_mast', (0.8, 0, 3.45), 0.05, 1.0,
                              steel, vertices=6))
    parts.append(add_torus('gl_radar_ring', (0.8, 0, 3.85), 0.35, 0.03,
                           steel, major_segments=18, minor_segments=6))

    # Snow drifts piled against walls
    drift_spots = [(-0.8, -1.25, 0.05), (1.5, 1.2, 0.05), (-1.8, 0, 0.05)]
    for i, (dx, dy, dz) in enumerate(drift_spots):
        parts.append(make_snow_drift(f'gl_drift_{i}', (dx, dy, dz),
                                     0.6 + i * 0.1, 0.5, 0.22, ice_white))

    # Equipment crate outside
    parts.append(add_box('gl_crate', (2.1, -0.5, 0.42), (0.55, 0.40, 0.50),
                         steel, bevel_width=0.012))

    # Mast light
    parts.append(add_sphere('gl_mast_light', (0.8, 0, 3.98), 0.06, relay,
                            segments=8, rings=6))

    return [p for p in parts if p]


# ═══════════════════════════════════════════════════════════════════════════
# NEBULA BIOME — Crystalline energy set pieces
# ═══════════════════════════════════════════════════════════════════════════

def build_nebula_resonators():
    """Paired Resonance Spires — two crystal towers with energy conduits."""
    graphite = make_material('nr_graphite', 0x343047, metallic=0.70, roughness=0.46)
    amethyst = make_material('nr_amethyst', 0x9470b8, metallic=0.08, roughness=0.28)
    magenta = make_material('nr_magenta', 0xea8ac8, metallic=0.05, roughness=0.25,
                            emission_hex=0xa43e97, emission_strength=1.0)
    copper = make_material('nr_copper', 0x967978, metallic=0.55, roughness=0.41)

    parts = []

    # Base platform (cylindrical with steps)
    parts.append(add_cylinder('nr_base_wide', (0, 0, 0.10), 2.7, 0.20,
                              graphite, vertices=12))
    parts.append(add_cylinder('nr_base_mid', (0, 0, 0.25), 2.3, 0.12,
                              copper, vertices=12))
    parts.append(add_cylinder('nr_base_top', (0, 0, 0.35), 1.9, 0.08,
                              graphite, vertices=12))

    # Two crystal spires
    for sign, height, lean in [(-1, 3.8, -0.15), (1, 4.2, 0.12)]:
        x = sign * 1.4
        parts.append(make_crystal(f'nr_spire_{sign}', (x, 0, 0.40),
                                  height, 0.50, amethyst, sides=8,
                                  taper=0.2, lean_x=lean, lean_z=sign * 0.08))

        # Orbital rings around each spire
        for j, ring_h in enumerate([0.4, 0.55, 0.75]):
            h = 0.40 + height * ring_h
            r = 0.65 - j * 0.08
            parts.append(add_torus(f'nr_ring_{sign}_{j}',
                                   (x + lean * ring_h, 0, h),
                                   r, 0.035 if j == 1 else 0.025,
                                   magenta if j == 1 else copper,
                                   major_segments=20, minor_segments=6,
                                   rotation=(0.1 * j, 0.15 * sign, 0)))

    # Energy conduit connecting spires
    conduit_pts = [(-1.0, 0, 2.2), (-0.3, 0.1, 2.5), (0.3, -0.1, 2.5),
                   (1.0, 0, 2.4)]
    parts.append(make_pipe('nr_conduit', conduit_pts, 0.06, magenta, resolution=6))

    # Crystal debris at base
    debris_data = [
        (-0.5, 1.2, 0.15, 0.65, 0.12),
        (0.8, -1.0, 0.15, 0.55, 0.10),
        (-1.8, -0.7, 0.15, 0.45, 0.09),
        (1.5, 0.8, 0.15, 0.50, 0.11),
        (0.2, -1.5, 0.15, 0.40, 0.08),
        (-0.3, 1.6, 0.15, 0.35, 0.08),
    ]
    for i, (dx, dy, dz, dh, dr) in enumerate(debris_data):
        parts.append(make_crystal(f'nr_debris_{i}', (dx, dy, dz), dh, dr,
                                  amethyst if i % 2 else graphite, sides=6,
                                  lean_x=(i % 3 - 1) * 0.05))

    # Emissive core hints inside spires (small glowing spheres)
    for sign in [-1, 1]:
        parts.append(add_sphere(f'nr_core_{sign}', (sign * 1.4, 0, 1.5),
                                0.12, magenta, segments=10, rings=8))

    # Copper stator segments at base
    for i in range(6):
        angle = i * TAU / 6
        x = math.cos(angle) * 2.1
        y = math.sin(angle) * 2.1
        parts.append(add_box(f'nr_stator_{i}', (x, y, 0.38),
                             (0.35, 0.18, 0.25), copper, bevel_width=0.008))

    return [p for p in parts if p]


def build_nebula_wreckage():
    """Drifting Crystal Wreckage — broken hull with crystal growths."""
    graphite = make_material('nw_graphite', 0x343047, metallic=0.70, roughness=0.46)
    amethyst = make_material('nw_amethyst', 0x9470b8, metallic=0.08, roughness=0.28)
    magenta = make_material('nw_magenta', 0xea8ac8, metallic=0.05, roughness=0.25,
                            emission_hex=0xa43e97, emission_strength=1.0)
    copper = make_material('nw_copper', 0x967978, metallic=0.55, roughness=0.41)

    parts = []

    # Broken hull plates at various angles
    plate_data = [
        (-1.5, 0.3, 0.9, 1.6, 0.12, 1.1, 0.15, 0.0, 0.0),
        (0.0, -0.5, 0.5, 1.3, 0.10, 0.9, 0.0, 0.12, 0.0),
        (1.4, 0.0, 1.2, 1.7, 0.14, 1.2, -0.08, 0.0, 0.10),
        (-0.6, 0.4, 2.2, 1.2, 0.10, 0.7, 0.0, -0.15, 0.08),
        (0.8, -0.3, 2.7, 1.0, 0.12, 0.8, 0.10, 0.05, -0.05),
    ]
    for i, (x, y, z, w, h, d, rx, ry, rz) in enumerate(plate_data):
        plate = add_box(f'nw_plate_{i}', (x, y, z), (w, h, d),
                        graphite, bevel_width=0.015)
        plate.rotation_euler = (rx, ry, rz)
        bpy.context.view_layer.objects.active = plate
        bpy.ops.object.transform_apply(rotation=True)
        parts.append(plate)

        # Crystal vein accent on plate
        parts.append(add_box(f'nw_vein_{i}', (x, y + d * 0.52, z),
                             (w * 0.4, h * 0.5, 0.015),
                             magenta, bevel_width=0.002))

    # Crystal growths from broken seams
    crystal_data = [
        (-1.0, 0.5, 0.5, 1.3, 0.20, 0.1, 0.0),
        (0.5, -0.3, 0.3, 1.6, 0.25, -0.08, 0.12),
        (1.5, 0.2, 0.8, 1.1, 0.18, 0.05, -0.06),
        (-0.3, 0.8, 1.5, 0.9, 0.15, 0.0, 0.08),
        (0.8, -0.6, 1.8, 0.7, 0.12, -0.05, 0.0),
        (-1.2, -0.2, 2.0, 0.85, 0.14, 0.06, 0.04),
        (0.2, 0.5, 2.4, 0.60, 0.10, 0.0, -0.05),
        (1.0, 0.1, 2.9, 0.50, 0.09, 0.04, 0.03),
        (-0.7, -0.5, 0.2, 0.75, 0.13, -0.06, 0.0),
    ]
    for i, (cx, cy, cz, ch, cr, lx, lz) in enumerate(crystal_data):
        parts.append(make_crystal(f'nw_crystal_{i}', (cx, cy, cz), ch, cr,
                                  amethyst if i % 3 != 0 else magenta,
                                  sides=6, lean_x=lx, lean_z=lz))

    # Orbital ring fragments (torus arcs)
    for i, (rx, ry, rz, rot_x, rot_z) in enumerate([
        (0, 0, 1.8, 0.25, 0.15),
        (0.2, 0.1, 2.1, -0.3, 0.4)
    ]):
        # Use a full torus and we'll rely on the natural look
        parts.append(add_torus(f'nw_ring_{i}', (rx, ry, rz),
                               2.2 - i * 0.4, 0.06,
                               copper, major_segments=18, minor_segments=6,
                               rotation=(rot_x, 0, rot_z)))

    # Energy conduit stub (broken glowing tube)
    parts.append(make_pipe('nw_conduit_stub',
                           [(-0.8, 0.2, 1.5), (-0.3, 0.1, 1.7), (0.2, 0, 1.6)],
                           0.05, magenta, resolution=4))

    # Floating fragments
    for i in range(5):
        angle = i * TAU / 5 + 0.5
        r = 1.8 + (i % 3) * 0.3
        x = math.cos(angle) * r
        y = math.sin(angle) * r
        z = 0.3 + i * 0.3
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.12 + (i % 3) * 0.04,
                                               subdivisions=1,
                                               location=(x, y, z))
        frag = bpy.context.active_object
        frag.name = f'nw_fragment_{i}'
        frag.scale = (1, 0.6, 1.4)
        bpy.ops.object.transform_apply(scale=True)
        frag.data.materials.append(amethyst if i % 2 else graphite)
        apply_smooth(frag, auto_angle_deg=25)
        parts.append(frag)

    return [p for p in parts if p]


# ═══════════════════════════════════════════════════════════════════════════
# Main — generate all 8 midground models
# ═══════════════════════════════════════════════════════════════════════════

MODELS = [
    ('orbital-dock', build_orbital_dock),
    ('orbital-comms', build_orbital_comms),
    ('verdant-greenhouse', build_verdant_greenhouse),
    ('verdant-root-tower', build_verdant_root_tower),
    ('polar-bridge', build_polar_bridge),
    ('polar-geolab', build_polar_geolab),
    ('nebula-resonators', build_nebula_resonators),
    ('nebula-wreckage', build_nebula_wreckage),
]

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"\n{'='*60}")
    print("Chromatron3D — Premium Midground Model Generator (Blender)")
    print(f"Output: {OUTPUT_DIR}")
    print(f"{'='*60}\n")

    for model_name, build_fn in MODELS:
        print(f"Building: {model_name}...")
        clear_scene()
        parts = build_fn()

        # Apply all modifiers before export
        for obj in parts:
            if obj:
                apply_all_modifiers(obj)

        output_path = os.path.join(OUTPUT_DIR, model_name + '.glb')
        export_glb(output_path, parts)

    print(f"\n{'='*60}")
    print(f"Done — {len(MODELS)} midground GLB models generated.")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
