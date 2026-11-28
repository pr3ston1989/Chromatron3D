"""Author the sanctuary's weathered calibration terrace and moving prism."""
from math import cos, sin, tau
from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.style import MODELS, Sculpture, make_material, plate, render, reset_scene
from tools.blender.orbital_finish import finish_surface
from tools.style import export
from blender_sculpt import paint


def build():
    reset_scene()
    base = Sculpture()
    moving = Sculpture()
    stone = paint("Calibration weathered stone", (.078,.079,.121), .08,.83)
    edge = paint("Calibration worn edges", (.149,.139,.185), .11,.71)
    joints = paint("Calibration dark joints", (.038,.043,.064), .20,.73)
    bronze = make_material("Calibration patinated bronze", "bronze", .55,.52)
    oxide = paint("Calibration copper patina", (.050,.137,.129), .39,.49)
    pilot = paint("Calibration inlay", (.042,.192,.207), .16,.42,.58)
    prism = paint("Calibration prism facets", (.077,.235,.250), .38,.22,.15)
    shadowed_facet = paint("Calibration prism shadow", (.038,.110,.164), .28,.34,.05)

    # The back landing meets a broad set of weathered stairs on the slope.
    plate(base,[(4.9,2.64,.79,0),(4.87,2.62,.78,.42),(4.77,2.52,.75,.54)],joints,[stone,edge])
    for i in range(5):
        z = .45+.24*i
        y = -1.91+i*.48
        width = 3.04-.22*i
        plate(base,[(width,.51,.41,z),(width,.51,.40,z+.19),(width-.05,.47,.37,z+.22)],stone,[stone,edge],(0,y))
    plate(base,[(3.52,1.97,.55,.45),(3.47,1.93,.54,.89),(3.15,1.79,.54,1.76)],joints,[stone,edge],(0,.65))
    for x,y,w,d in [(-2.47,-.08,.53,.40),(-1.52,.04,.36,.42),(-.57,.03,.54,.35),
                    (.53,.16,.48,.42),(1.52,.24,.39,.39),(2.42,.35,.48,.45)]:
        plate(base,[(w,d,.12,1.748),(w-.024,d-.018,.12,1.82)],stone,[joints,edge],(x,y))
    for side in (-1,1):
        # The pivot sits in metal bearings carried by two staggered stone piers.
        x = side*2.03
        skew = .23 if side>0 else -.13
        profiles = [(1.4,1.53,.97,.79),(1.89,1.51,.82,.76),(3.04,1.63,.66,.71),
                    (4.08,1.79,.56,.65),(4.78,1.85,.47,.55),(5.11,2.04,.41,.51)]
        rings = []
        for z,cx,w,d in profiles:
            rings.append([(side*cx+cos(i*tau/8+.26)*w,.64+skew+sin(i*tau/8+.26)*d,z+.04*cos(i*2.25))
                          for i in range(8)])
        base.loft(rings,joints,[edge,stone,stone,edge,stone])
        base.cable([(side*2.21,.28,2.01,.087),(side*2.03,.06,3.34,.070),
                    (side*1.73,-.13,4.08,.063)],oxide,6)
        lining = [(side*1.95,.077,2.17,.047),(side*1.91,.032,2.45,.047),
                  (side*1.89,-.01,2.70,.039),(side*1.82,-.025,3.19,.042)]
        base.cable(lining,bronze,5)
        base.cable([(side*1.96,.017,2.23,.021),(side*1.93,-.010,2.49,.021),
                    (side*1.90,-.042,2.66,.021)],pilot,4)
        base.cable([(side*1.91,-.22,4.30,.27),(side*1.72,-.17,4.29,.30),
                    (side*1.39,-.12,4.27,.18)],bronze,10)
        base.cable([(side*1.92,-.39,4.29,.042),(side*1.65,-.36,4.28,.043)],pilot,5)
        for i in range(3):
            px = side*(2.30+i*.31)
            z = 1.72+.08*i
            plate(base,[(.26,.31,.09,z),(.24,.30,.08,z+.10)],stone,[edge],(px,-.92-i*.45))

    # Segmented brass yoke and prism co-rotate around the dark horizontal axle.
    moving.cable([(-1.53,0,0,.116),(-1.13,0,0,.118),(1.13,0,0,.118),(1.53,0,0,.116)],bronze,10)
    for side in (-1,1):
        moving.cable([(side*1.15,0,0,.13),(side*.94,-.09,-.72,.10),(side*.48,-.13,-.94,.086),
                      (-side*.08,-.14,-1.03,.062)],oxide,6)
        moving.cable([(side*.95,.09,.035,.10),(side*.73,.05,.69,.088),(side*.29,.015,.88,.070)],bronze,6)
    section = [(-.48,.62),(-.77,-.15),(-.26,-.69),(.46,-.52),(.71,.12),(.26,.65)]
    contours = [[(x*f,depth,z*f) for x,z in section] for depth,f in [(.36,.60),(.20,.95),(-.16,1.0),(-.41,.61)]]
    moving.loft(contours,shadowed_facet,[shadowed_facet,prism,prism])
    for x,z in [(-.66,-.20),(.62,.14),(-.22,.59),(.43,-.48)]:
        moving.cable([(x,-.17,z,.040),(x*.83,-.32,z*.83,.035)],pilot,5)

    origin = base.object("sanctuary-calibration")
    rotor = moving.object("Calibration_Pivot")
    rotor.parent = origin
    rotor.location = (0,-.14,4.28)
    objects = [origin,rotor]
    triangles = 0
    for obj in objects:
        finish_surface(obj,reach=.55)
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
    if triangles>2300:
        raise ValueError(f"Calibration assembly: {triangles} triangles exceeds 2300")
    print(f"ASSET {origin.name} · {triangles}/2300 triangles")
    folder = MODELS/"scenery"
    export(origin.name,objects,folder)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/(origin.name+".blend")),compress=True)
    render("scenery/"+origin.name,model=origin)


if __name__ == "__main__":
    build()
