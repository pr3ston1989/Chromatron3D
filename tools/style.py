"""Palette, mesh finishing, GLB export and studio renders for Chromatron3D."""
from math import cos, sin
from pathlib import Path
import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from blender_sculpt import Sculpture, export

PALETTE = {
    "ink": "#14202B", "graphite": "#283844", "indigo": "#222949",
    "steel": "#4E6874", "ocean": "#306875", "titanium": "#82999E",
    "ceramic": "#D4DFDA", "cream": "#F2E9D4",
    "copper": "#BD6A47", "brass": "#D3A15F", "amber": "#FFBE5E",
    "cyan": "#54CBCC", "ice": "#92D5F5", "fern": "#66A578",
    "orchid": "#B18BD8", "signal": "#E47C6E",
}


def shade_hex(hex_color, shade):
    amount = abs(shade) * (.20 if shade > 0 else .19)
    target = 255 if shade > 0 else 0
    channels = [int(hex_color[i:i+2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(c+(target-c)*amount):02X}" for c in channels)


PALETTE_STEPS = {name: {step: shade_hex(value, step) for step in range(-2, 3)}
                 for name, value in PALETTE.items()}

# Match the game's default yaw and elevation. Three +Z is Blender -Y.
GAME_CAMERA = (sin(-.80) * cos(.86), -cos(-.80) * cos(.86), sin(.86))


def make_material(name, color, metallic=0.0, roughness=0.45, emission=0.0, *, shade=0):
    """Make a flat-colour PBR finish; palette HEX values are sRGB."""
    hex_color = PALETTE_STEPS[color][shade].lstrip("#")
    channels = [int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4)]
    linear = tuple(c / 12.92 if c <= 0.04045 else ((c + .055) / 1.055) ** 2.4 for c in channels)
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*linear, 1)
    material.use_nodes = True
    shader = material.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = material.diffuse_color
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Emission Color"].default_value = material.diffuse_color
    shader.inputs["Emission Strength"].default_value = emission
    return material


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def clipped_rectangle(x, y, corner):
    """CCW footprint with eight machined corners."""
    return [(-x+corner, -y), (x-corner, -y), (x, -y+corner), (x, y-corner),
            (x-corner, y), (-x+corner, y), (-x, y-corner), (-x, -y+corner)]


def plate(sculpture, profile, material, bands=None, center=(0, 0)):
    """Build a faceted plate from (half-width, half-depth, corner, elevation)."""
    cx, cy = center
    rings = [[(u+cx, v+cy, z) for u,v in clipped_rectangle(x,y,c)] for x,y,c,z in profile]
    sculpture.loft(rings, material, bands)


def render_preview(model, path, camera_direction):
    scene = bpy.context.scene
    bounds = [model.matrix_world @ Vector(v) for v in model.bound_box]
    low = Vector(tuple(min(v[i] for v in bounds) for i in range(3)))
    high = Vector(tuple(max(v[i] for v in bounds) for i in range(3)))
    center = (low + high) / 2
    size = (high - low).length
    bpy.ops.object.camera_add(location=center + Vector(camera_direction).normalized() * size * 2)
    camera = bpy.context.object
    camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.clip_end = max(100, size * 8)
    inv_rotation = camera.rotation_euler.to_quaternion().inverted()
    projected = [inv_rotation @ (point - center) for point in bounds]
    camera.data.ortho_scale = max(max(abs(v.x), abs(v.y)) for v in projected) * 2.26
    scene.camera = camera
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 16
    scene.cycles.use_denoising = True
    scene.world.use_nodes = True
    world_light = scene.world.node_tree.nodes["Background"]
    world_light.inputs["Color"].default_value = (.035,.058,.083,1)
    world_light.inputs["Strength"].default_value = .60
    scene.view_settings.view_transform = "AgX"
    key = bpy.data.lights.new("Warm directional key", "SUN")
    key.energy = 2.0
    key.color = (1.0,.875,.714)
    key.angle = .19
    key_light = bpy.data.objects.new(key.name, key)
    scene.collection.objects.link(key_light)
    key_light.rotation_euler = Vector((-.48,.72,-1)).to_track_quat("-Z","Y").to_euler()
    fill = bpy.data.lights.new("Cool fill", "AREA")
    fill.energy = (135 if camera_direction[2] < 0 else 60) * size**2
    fill.color = (.57,.78,1.0)
    fill.shape = "DISK"
    fill.size = size * 1.4
    fill_light = bpy.data.objects.new(fill.name, fill)
    scene.collection.objects.link(fill_light)
    fill_light.location = center + Vector((-1,.43,-.62 if camera_direction[2] < 0 else .48)) * size
    fill_light.rotation_euler = (center-fill_light.location).to_track_quat("-Z","Y").to_euler()
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    scene.render.resolution_x = scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    for light in (camera,key_light,fill_light):
        bpy.data.objects.remove(light,do_unlink=True)


def save_asset(name, model, triangle_budget, camera_direction=(1.2, -1.6, 1.1)):
    bpy.context.view_layer.update()
    for face in model.data.polygons:
        face.use_smooth = False
    model.data.calc_loop_triangles()
    triangles = len(model.data.loop_triangles)
    if triangles > triangle_budget:
        raise ValueError(f"{name}: {triangles} triangles exceeds budget of {triangle_budget}")
    if model.location.length > 1e-6 or abs(min(v.co.z for v in model.data.vertices)) > 1e-6:
        raise ValueError(f"{name}: origin and base must be at Z=0")
    export(name, [model], ROOT / "assets/models")
    previews = ROOT / "assets/previews"
    previews.mkdir(parents=True, exist_ok=True)
    render_preview(model, previews / f"{name}.png", camera_direction)
    render_preview(model, previews / f"{name}-game.png", GAME_CAMERA)
    print(f"{name}: {triangles}/{triangle_budget} triangles")
