"""Render the exported pilot GLBs alongside current optics at game scale."""
from math import pi
from pathlib import Path
import runpy
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from tools.blender.style import MODELS, ROOT, Sculpture, make_material, render, reset_scene

deck = runpy.run_path(str(ROOT / "tools/blender/assets/platform-deck.py"))
old_optics = ROOT / "public/models/optics"
beam_elevation = .62


def place_glb(path, location=(0, 0, 0), yaw=0):
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    imported = set(bpy.context.scene.objects) - before
    parent = bpy.data.objects.new(path.stem, None)
    bpy.context.scene.collection.objects.link(parent)
    for obj in imported:
        if obj.parent is None:
            obj.parent = parent
    parent.location = location
    parent.rotation_euler.z = yaw
    return parent


def render_current_scale():
    reset_scene()
    place_glb(MODELS / "overhaul-platform-deck.glb", (0,0,-deck["TOP"]))
    place_glb(MODELS / "overhaul-beam-splitter.glb", (1.30,-1.30,.05))
    place_glb(MODELS / "overhaul-service-skiff.glb", (1.65,-12.6,-1.10), pi*.57)
    place_glb(old_optics / "mirror.glb", (1.30,5.20,.05), pi/4)
    place_glb(old_optics / "laser.glb", (-6.50,-1.30,.07), -pi/2)
    place_glb(old_optics / "target.glb", (6.50,-1.30,.05))
    place_glb(old_optics / "target.glb", (6.50,5.20,.05))

    # Illustration beams use the exact grid pitch and are confined to the playfield.
    core = make_material("Beam review only", "cyan", .0, .35, 6.0, shade=2)
    lasers = Sculpture()
    origin = (-6.02,-1.30)
    splitter = (1.30,-1.30)
    mirror = (1.30,5.20)
    for a,b in [(origin,splitter),(splitter,(6.50,-1.30)),(splitter,mirror),(mirror,(6.50,5.20))]:
        lasers.cable([(*a,beam_elevation,.019),(*b,beam_elevation,.019)],core,6)
    lasers.object("Beam mockup")
    render("game-camera-1920x1080", resolution=(1920,1080))
    render("game-camera-390x844", resolution=(390,844))


def render_catalog_scale():
    from tools.blender.optical_catalog import KINDS

    reset_scene()
    place_glb(MODELS / "overhaul-platform-deck.glb", (0,0,-deck["TOP"]))
    for i,kind in enumerate(KINDS):
        x = (i%5-2)*3.25
        y = (i//5-2)*3.25
        place_glb(old_optics / f"{kind}.glb", (x,y,.035))
    render("catalog-camera-1920x1080",resolution=(1920,1080))
    render("catalog-camera-390x844",resolution=(390,844))


if __name__ == "__main__":
    if "--" in sys.argv and sys.argv[-1]=="catalog":
        render_catalog_scale()
    else:
        render_current_scale()
        for name in deck["FINISHES"]:
            reset_scene()
            platform = deck["build"](name)
            render(f"deck-{name}", (1.55,-1.7,.84), model=platform)
