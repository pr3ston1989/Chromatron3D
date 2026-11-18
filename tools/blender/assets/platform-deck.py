"""A 15×15 inlaid deck with architectural support matched to each world."""
from math import cos, hypot, pi, sin
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
    "shipyard": ("titanium", "graphite", "obsidian", "steel", "amber"),
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
    if finish == "shipyard":
        build_shipyard(asset, seam, bright, shell, low, recess, trim, glow, steel)
        inlay(asset, tile, bright, .613)
        return asset.object(NAME)
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

    inlay(asset, tile, bright, .606)
    return asset.object(NAME)


def girder(asset, a, b, width, depths, angle, main, chamfer):
    dx,dz = b[0]-a[0], b[1]-a[1]
    offset = (-dz*width*.5/hypot(dx,dz), dx*width*.5/hypot(dx,dz))
    x,z = offset
    outline = [(a[0]-x,a[1]-z),(b[0]-x,b[1]-z),(b[0]+x,b[1]+z),(a[0]+x,a[1]+z)]
    inset = [(a[0]-x*.70,a[1]-z*.70),(b[0]-x*.70,b[1]-z*.70),
             (b[0]+x*.70,b[1]+z*.70),(a[0]+x*.70,a[1]+z*.70)]
    c,s = cos(angle),sin(angle)
    sections = (outline,outline,inset) if len(depths)==3 else (outline,inset)
    rings = [[(px*c-y*s,px*s+y*c,pz) for px,pz in profile]
             for y,profile in zip(depths,sections)]
    asset.loft(rings,main,[main,chamfer][-len(depths)+1:])


def build_shipyard(asset, seam, bright, shell, low, recess, trim, glow, steel):
    # Open perimeter truss with a narrower spine visible through the bays.
    plate(asset,[(3.35,3.35,.73,.06),(3.59,3.59,.77,.36),
                 (3.93,3.93,.63,2.9),(3.61,3.61,.55,3.02)],low,[shell,low,steel])
    plate(asset,[(9.22,9.22,.76,2.52),(9.82,9.82,.68,2.69),
                 (10.43,10.43,.69,2.79),(10.50,10.50,.62,3.49),
                 (10.50,10.50,.58,3.60),(10.41,10.41,.71,3.72)],
          low,[low,steel,shell,bright,seam])
    for x in (-9.50,9.50):
        for y in (-9.50,9.50):
            bottom=[(x-.36,y-.37,0),(x+.36,y-.37,0),(x+.36,y+.37,0),(x-.36,y+.37,0)]
            top=[(x+(u-x)*.86,y+(v-y)*.86,2.81) for u,v,_ in bottom]
            asset.loft([bottom,top],low,[steel])
    for side in range(4):
        angle = side*pi/2
        cs,sn = cos(angle),sin(angle)
        girder(asset,(-9.5,.22),(9.5,.22),.44,[-9.67,-10.10,-10.18],angle,low,steel)
        for x in (-9.24,-3.13,3.13,9.24):
            girder(asset,(x,.25),(x,2.76),.52,[-9.38,-10.00],angle,low,steel)
        for start,end in ((-9.15,-3.13),(-3.02,3.02),(3.13,9.15)):
            girder(asset,(start,.39),(end,2.61),.47,[-9.49,-9.89,-10.02],angle,low,steel)
            c=(start+end)*.5
            panel=[(c-2.65,2.98),(c+2.65,2.98),(c+2.65,3.35),(c-2.65,3.35)]
            first=len(asset.vertices)
            asset.vertices.extend((x*cs+10.515*sn,x*sn-10.515*cs,z) for x,z in panel)
            asset.face(tuple(range(first,first+4)),recess)
            lamp=[(c-.76,2.51),(c+.76,2.51),(c+.65,2.67),(c-.65,2.67)]
            rotation_from_profile(asset,lamp,[-10.31,-10.43],angle,glow)
        for x in (-9.4,9.4):
            cap=[(x-.26,2.64),(x+.24,2.64),(x+.29,2.91),(x-.27,2.91)]
            rotation_from_profile(asset,cap,[-10.47,-10.53],angle,trim)


def inlay(asset, tile, bright, half):
    # Top-facing inlays sit above one continuous recessed support,
    # so the 225 cells cost 450 triangles without checkerboard colouring.
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


if __name__ == "__main__":
    reset_scene()
    finish = sys.argv[-1] if "--" in sys.argv else "observatory"
    model = build(finish)
    if finish != "observatory":
        model.name = model.data.name = f"overhaul-platform-{finish}"
    save_asset(model, 1500, (1.55,-1.7,.84))
    if finish == "observatory":
        render(f"{NAME}-underside", (1.1,-1.6,-.62), model=model)
