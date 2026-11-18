"""A 15×15 ceramic inlay over a deep modular machine plinth."""
from math import cos, pi, sin
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.style import Sculpture, make_material, plate, reset_scene
from tools.blender.style import render, rotation_from_profile, save_asset
from tools.style import clipped_rectangle

NAME = "overhaul-platform-deck"
TOP = 3.76
FINISHES = {
    "observatory": ("ceramic", "navy", "obsidian", "copper", "cyan"),
    "grotto": ("lilac", "plum", "obsidian", "amethyst", "cyan"),
    "garden": ("limestone", "bronze", "jade", "bronze", "amber"),
    "shipyard": ("titanium", "steel", "graphite", "titanium", "amber"),
}


def build(finish="observatory"):
    surface, body, well, metal, light = FINISHES[finish]
    seam = make_material("Inlay seam", surface, roughness=.76, shade=-2)
    tile = make_material("Uniform playing surface", surface, roughness=.59)
    bright = make_material("Machined upper bevel", surface, .13, .47, shade=1)
    shell = make_material("Main cladding", body, .34, .56)
    low = make_material("Load-bearing plinth", body, .26, .66, shade=-1)
    recess = make_material("Recessed service wells", well, .13, .72, shade=-1)
    trim = make_material("Brackets and fasteners", metal, .42, .44, shade=1)
    glow = make_material("Embedded power indicator", light, .12, .44, .85)
    steel = make_material("Undercarriage strut", body, .42, .46, shade=1)

    asset = Sculpture()
    plate(asset, [(7.0,7.0,1.48,.25), (7.65,7.65,1.35,.51),
                  (7.94,7.94,1.24,.63), (8.85,8.85,1.13,1.04),
                  (9.73,9.73,.78,2.54), (10.23,10.23,.86,2.72),
                  (10.23,10.23,.82,3.41), (10.50,10.50,.82,3.54),
                  (10.50,10.50,.79,3.65), (10.41,10.41,.71,3.72)],
          low, [low,low,shell,low,steel,shell,recess,bright,seam])
    # Exposed levitation collar beneath the lower plinth.
    asset.lathe([(0,0,0,2.30,2.30),(0,0,.075,2.64,2.64),
                 (0,0,.17,2.86,2.86),(0,0,.35,3.21,3.21)],
                glow,8,bands=[recess,glow,steel],phase=pi/8)

    # Four rows of service fascia on the sides, well below the playable field.
    for side in range(4):
        angle = side*pi/2
        c, s = cos(angle), sin(angle)
        for offset, half in ((-6.85,2.02),(0,3.59),(6.85,2.02)):
            pocket = [(offset-half,2.81),(offset+half,2.81),(offset+half+.18,2.95),
                      (offset+half-.02,3.32),(offset-half+.18,3.32),(offset-half-.16,3.15)]
            first = len(asset.vertices)
            asset.vertices.extend((x*c+10.235*s,x*s-10.235*c,z) for x,z in pocket)
            asset.face(tuple(range(first,first+len(pocket))),recess)
        for offset in (-6.88,-1.92,1.92,6.88):
            folded_brace = [(offset-.34,2.74),(offset+.19,2.74),(offset+.39,3.46),
                            (offset-.17,3.46)]
            rotation_from_profile(asset, folded_brace, [-10.235,-10.44], angle, steel)
        for offset in (-.85,.85):
            strip = [(offset-.55,3.105),(offset+.45,3.105),(offset+.55,3.177),
                     (offset-.48,3.177)]
            rotation_from_profile(asset, strip, [-10.245,-10.267], angle, glow)
        for offset in (-9.08,9.08):
            tab = [(offset-.22,3.37),(offset+.26,3.37),(offset+.43,3.55),
                   (offset+.39,3.67),(offset-.26,3.67),(offset-.35,3.55)]
            rotation_from_profile(asset, tab, [-10.45,-10.51], angle, trim)
            stud = [(offset-.078,3.51),(offset+.078,3.51),(offset,3.68)]
            rotation_from_profile(asset, stud, [-10.509,-10.56], angle, recess)
        # A deep underside brace and an exposed fluid line break up the taper.
        strut = [(-5.25,.85),(2.80,1.51),(5.76,2.54),(5.37,2.61),
                 (2.72,1.81),(-5.45,1.04)]
        rotation_from_profile(asset, strut, [-8.82,-9.01], angle, steel)
        pipe = [(-5.95,1.35),(-2.10,1.35),(-1.22,1.70),(1.76,1.70)]
        depth = -9.37
        asset.cable([(x*c-depth*s, x*s+depth*c, z, .071) for x,z in pipe], trim, 5)

    # Top-facing ceramic inlays sit above one continuous recessed support,
    # so the 225 cells cost 450 triangles without checkerboard colouring.
    half = .606
    for y in range(-7,8):
        for x in range(-7,8):
            cx, cy = x*1.30, y*1.30
            i = len(asset.vertices)
            asset.vertices.extend([(cx-half,cy-half,TOP),(cx+half,cy-half,TOP),
                                   (cx+half,cy+half,TOP),(cx-half,cy+half,TOP)])
            asset.face((i,i+1,i+2,i+3),tile)
    outlines = [clipped_rectangle(*p) for p in [(9.752,9.752,.045),
                 (9.81,9.81,.09),(10.30,10.30,.59),(10.42,10.42,.71)]]
    start = len(asset.vertices)
    for outline, elevation in zip(outlines,(3.723,3.779,3.779,3.721)):
        asset.vertices.extend((x,y,elevation) for x,y in outline)
    for ring, material in enumerate((bright,tile,bright)):
        a, b = start+8*ring, start+8*(ring+1)
        for i in range(8):
            j = (i+1)%8
            asset.face((a+j,a+i,b+i,b+j),material)
    return asset.object(NAME)


if __name__ == "__main__":
    reset_scene()
    finish = sys.argv[-1] if "--" in sys.argv else "observatory"
    model = build(finish)
    if finish != "observatory":
        model.name = model.data.name = f"overhaul-platform-{finish}"
    save_asset(model, 1500, (1.55,-1.7,.84))
    if finish == "observatory":
        render(f"{NAME}-underside", (1.1,-1.6,-.62), model=model)
