"""Model authoring and previews for the four visual overhaul worlds."""
from math import radians, tan
from pathlib import Path
import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from tools.style import GAME_CAMERA, Sculpture, export, plate, reset_scene
from tools.style import make_material as shared_material
from tools.style import shade_hex

PALETTE = {
    "obsidian": "#172132",
    "graphite": "#293447",
    "navy": "#273B5B",
    "steel": "#4F677D",
    "titanium": "#9EAFBE",
    "ceramic": "#DED9CB",
    "limestone": "#D1B589",
    "copper": "#AF7352",
    "bronze": "#8E6946",
    "jade": "#527770",
    "olive": "#687555",
    "plum": "#453655",
    "amethyst": "#827095",
    "lilac": "#B9AAC7",
    "cyan": "#65C6CE",
    "amber": "#E1A95F",
}
TONES = {name: {step: shade_hex(value, step) for step in range(-2, 3)}
         for name, value in PALETTE.items()}
MODELS = ROOT / "assets/models"
PREVIEWS = ROOT / "assets/previews/overhaul"
FOV = 40
DISTANCE = 44


def make_material(name, color, metallic=0.0, roughness=0.45, emission=0.0, *, shade=0):
    return shared_material(name, color, metallic, roughness, emission, shade=shade, tones=TONES)


def rotation_from_profile(sculpture, points, depths, angle, material, bands=None):
    """Extrude an X–Z contour into a closed volume off one side of a square."""
    from math import cos, sin
    c, s = cos(angle), sin(angle)
    sculpture.loft([[(x*c-y*s, x*s+y*c, z) for x, z in points] for y in depths],
                   material, bands)


def export_model(model, budget, folder=MODELS):
    bpy.context.view_layer.update()
    if model.location.length > 1e-6 or abs(min(v.co.z for v in model.data.vertices)) > 1e-6:
        raise ValueError(f"{model.name}: base and origin must be at Z=0")
    for face in model.data.polygons:
        face.use_smooth = False
        if face.area < 1e-8:
            raise ValueError(f"{model.name}: degenerate face {face.index}")
    model.data.calc_loop_triangles()
    triangles = len(model.data.loop_triangles)
    if triangles > budget:
        raise ValueError(f"{model.name}: {triangles} triangles exceeds {budget}")
    export(model.name, [model], folder)
    print(f"ASSET {model.name} · {triangles}/{budget} triangles · {tuple(round(v, 3) for v in model.dimensions)} m (Blender XYZ)")


def aim(obj, point):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_light(name, kind, position, target, energy, color):
    data = bpy.data.lights.new(name, kind)
    data.energy = energy
    data.color = color
    light = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(light)
    light.location = position
    aim(light, target)
    return light


def render(name, direction=GAME_CAMERA, *, model=None, resolution=(512, 512),
           transparent=False, folder=PREVIEWS):
    """An isolated 3/4 portrait, or a complete scene at the exact game camera."""
    scene = bpy.context.scene
    target = Vector((0, 0, 0))
    distance = DISTANCE
    if model is not None:
        bounds = [model.matrix_world @ Vector(p) for p in model.bound_box]
        lo = Vector(tuple(min(p[i] for p in bounds) for i in range(3)))
        hi = Vector(tuple(max(p[i] for p in bounds) for i in range(3)))
        target = (lo + hi) * .5
        distance = (hi - lo).length * 2
    elif resolution[0] < 680:
        distance *= max(1.55, 720 / max(380, resolution[0]))

    data = bpy.data.cameras.new("Review camera")
    data.sensor_fit = "VERTICAL"
    data.lens = data.sensor_height / (2 * tan(radians(FOV) / 2))
    data.clip_end = max(200, distance * 4)
    camera = bpy.data.objects.new(data.name, data)
    scene.collection.objects.link(camera)
    camera.location = target + Vector(direction).normalized() * distance
    aim(camera, target)
    if model is not None:
        data.type = "ORTHO"
        transform = camera.rotation_euler.to_quaternion().inverted()
        projected = [transform @ (p - target) for p in bounds]
        data.ortho_scale = 2.30 * max(max(abs(v.x), abs(v.y)) for v in projected)

    scene.camera = camera
    light_scale = distance / DISTANCE
    key = add_light("Warm key", "SUN", target + Vector((-8, -12, 16)), target, 2.5,
                    (1, .89, .74))
    key.data.angle = .21
    fill_side = -.44 if Vector(direction).z < 0 else .52
    fill = add_light("Blue fill", "AREA",
                     target + Vector((.80, .69, fill_side)) * distance, target,
                     8100 * light_scale**2, (.69, .83, 1))
    fill.data.shape = "DISK"
    fill.data.size = distance * .84
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (.15, .21, .31, 1)
    background.inputs["Strength"].default_value = .56
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 20 if model is None else 16
    scene.cycles.use_denoising = True
    scene.view_settings.view_transform = "AgX"
    scene.render.film_transparent = True
    tree = scene.compositing_node_group
    if tree is None:
        tree = bpy.data.node_groups.new("Review background", "CompositorNodeTree")
        tree.interface.new_socket(name="Image", in_out="OUTPUT", socket_type="NodeSocketColor")
        scene.compositing_node_group = tree
    tree.nodes.clear()
    layers = tree.nodes.new("CompositorNodeRLayers")
    backdrop = tree.nodes.new("CompositorNodeAlphaOver")
    backdrop.inputs["Background"].default_value = (.012, .018, .031, 1)
    tree.links.new(layers.outputs["Image"], backdrop.inputs["Foreground"])
    output = tree.nodes.new("NodeGroupOutput")
    result = layers.outputs["Image"] if transparent else backdrop.outputs[0]
    tree.links.new(result, output.inputs["Image"])
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA" if transparent else "RGB"
    scene.render.resolution_x, scene.render.resolution_y = resolution
    scene.render.resolution_percentage = 100
    scene.render.threads_mode = "FIXED"
    scene.render.threads = 4
    path = folder / f"{name}.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    for obj in (camera, key, fill):
        bpy.data.objects.remove(obj, do_unlink=True)


def save_asset(model, budget, angle=(1.2, -1.6, 1.1)):
    export_model(model, budget)
    render(model.name, angle, model=model)
