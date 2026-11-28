"""Author the shipyard's cantilevered cargo berth and travelling gantry."""
from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.orbital_finish import finish_surface
from tools.blender.style import MODELS, Sculpture, plate, render, reset_scene
from tools.style import export
from blender_sculpt import paint


def build():
    reset_scene()
    hull, crane = Sculpture(), Sculpture()
    recess = paint("Berth recessed graphite", (.025,.036,.057), .36,.72)
    armor = paint("Berth blued alloy", (.074,.113,.176), .51,.47)
    trim = paint("Berth bead-blasted titanium", (.136,.192,.261), .59,.45)
    tread = paint("Berth ceramic walkway", (.080,.123,.177), .24,.64)
    orange = paint("Berth ochre safety panels", (.45,.225,.078), .39,.55)
    signal = paint("Berth docking indicators", (.76,.30,.065), .20,.46,1.27)
    cyan = paint("Berth inspection lamps", (.061,.355,.50), .27,.34,.82)
    glass = paint("Berth operations windows", (.025,.086,.130), .52,.20,.22)

    def block(s,x,y,z,w,d,h,material,cap=None):
        edge = min(.10,h*.32)
        s.loft([[(x+a*u,y+b*v,height) for a,b in ((-1,-1),(1,-1),(1,1),(-1,1))]
                for u,v,height in ((w*.96,d*.94,z),(w,d,z+edge),(w*.90,d*.91,z+h))],
               material,[material,cap or trim])

    # A deep hull and its central collar meet the deck's transfer arm.
    plate(hull,[(5.11,2.64,.69,0),(6.64,3.36,.79,.34),(6.97,3.54,.78,.82),
                (6.96,3.52,.76,1.16),(6.69,3.31,.72,1.35)],
          recess,[recess,armor,armor,trim])
    plate(hull,[(1.49,4.11,.57,.30),(2.01,4.35,.61,.62),(1.98,4.27,.60,1.40)],
          armor,[armor,trim],(-.27,0))
    plate(hull,[(5.79,2.43,.51,1.36),(5.68,2.26,.45,1.49)],recess,[recess])
    for side in (-1,1):
        y=side*2.91
        plate(hull,[(5.92,.55,.23,1.29),(5.90,.54,.23,1.44),(5.79,.49,.23,1.56)],
              tread,[armor,tread],(0,y))
        for x in (-5.03,-2.45,0,2.45,5.03):
            block(hull,x,side*3.48,.74,.71,.14,.29,recess,armor)
            hull.cable([(x-.49,side*3.62,.91,.035),(x+.49,side*3.62,.91,.035)],signal,4)
            if x!=0:
                hull.cable([(x-.17,side*2.43,.42,.17),(x,side*3.22,.67,.11),
                            (x+.37,side*3.45,1.17,.09)],trim,5)
        for x in (-4.86,4.86):
            block(hull,x,y,1.55,.21,.34,.23,armor,orange)
            hull.cable([(x-.14,y,1.78,.040),(x+.14,y,1.78,.040)],cyan,4)
        # The two rails sit on continuous beds. The gantry ends run on these.
        y=side*2.04
        for x in (-3.53,0,3.53):
            hull.cable([(x-.09,y,1.44,.23),(x,y,2.36,.14)],armor,5)
        hull.cable([(-4.41,y,2.38,.12),(4.41,y,2.38,.12)],trim,6)
        hull.cable([(-4.19,y+side*.079,2.41,.023),(4.19,y+side*.079,2.41,.023)],cyan,4)
    for x in (-4.58,4.58):
        plate(hull,[(.64,2.12,.29,1.35),(.63,2.11,.29,1.65),(.54,2.01,.24,1.75)],
              armor,[armor,tread],(x,0))
        for y in (-1.25,1.25):
            block(hull,x,y,1.74,.42,.28,.10,orange,orange)
    for x in (-2.58,1.91):
        for y in (-1.45,1.45):
            block(hull,x,y,1.51,.54,.29,.36,recess)
            hull.cable([(x-.33,y,1.89,.034),(x+.33,y,1.89,.034)],signal,5)
        # Guidance marks at the two pallet cradles.
        hull.cable([(x,-1.04,1.511,.029),(x,.98,1.511,.029)],orange,4)

    # Sloped bridge with segmented panoramic glass and a structural keel.
    center=(-5.19,.70)
    plate(hull,[(1.24,.91,.36,1.5),(1.36,1.0,.39,2.13),(1.29,.96,.39,2.40)],
          armor,[armor,trim],center)
    plate(hull,[(1.18,.89,.34,2.38),(1.26,.89,.34,2.50),(1.04,.77,.30,3.28),
                (1.00,.72,.29,3.45)],armor,[armor,glass,trim],center)
    for x in (-5.99,-5.22,-4.45):
        hull.cable([(x,-.16,2.55,.046),(x,-.05,3.23,.038)],trim,4)
    hull.cable([(-5.66,1.02,3.40,.079),(-5.6,1.01,4.08,.042),(-5.31,1.01,4.45,.034)],armor,6)
    hull.cable([(-5.31,1.01,4.45,.054),(-5.22,1.01,4.53,.048)],signal,6)
    for x in (-5.29,5.32):
        # Docking clamps hook over the service deck and offer a readable outline.
        for y in (-2.87,2.87):
            w=1 if y>0 else -1
            hull.cable([(x,y,.42,.21),(x-.40,y+w*.61,1.10,.18),
                        (x-.37,y+w*.78,1.85,.16),(x-.09,y+w*.63,2.29,.12)],armor,6)
            hull.cable([(x-.40,y+w*.80,1.19,.068),(x-.37,y+w*.86,1.78,.067)],orange,5)

    # Gantry coordinates are local to the rail height so the bogies stay on
    # the track. The rigid lifter clears the bed even with cargo attached.
    for side in (-1,1):
        y=side*2.04
        block(crane,0,y,-.07,.57,.27,.38,armor,orange)
        crane.cable([(-.43,y,.18,.20),(0,side*1.83,.93,.18),
                     (.14,side*1.28,1.37,.155)],trim,6)
        crane.cable([(.32,y,.19,.14),(.28,side*1.69,.91,.13),
                     (.15,side*1.26,1.35,.11)],armor,5)
    crane.cable([(.15,-1.39,1.39,.20),(.15,1.39,1.39,.20)],armor,8)
    crane.cable([(-.03,-1.27,1.43,.045),(-.03,1.27,1.43,.045)],signal,4)
    block(crane,.145,0,.92,.45,.44,.38,orange,trim)
    for y in (-.30,.30):
        crane.cable([(.12,y,.96,.048),(.12,y,.15,.044)],recess,5)
    plate(crane,[(.83,.66,.24,-.57),(.90,.72,.24,-.47),
                 (.90,.72,.24,.085),(.81,.66,.21,.23)],armor,[recess,orange,trim],(.12,0))
    for y in (-.74,.74):
        for x in (-.42,.09,.61):
            crane.cable([(x,y,-.41,.048),(x,y,.083,.041)],recess,4)

    base = hull.object("shipyard-cargo-berth")
    gantry = crane.object("Cargo_Gantry")
    gantry.parent = base
    gantry.location = (-2.58,0,2.48)
    objects = [base,gantry]
    triangles = 0
    for obj in objects:
        finish_surface(obj,reach=.56)
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
    if triangles>3500:
        raise ValueError(f"Cargo berth: {triangles} triangles exceeds 3500")
    print(f"ASSET {base.name} · {triangles}/3500 triangles")
    folder = MODELS/"scenery"
    export(base.name,objects,folder)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/(base.name+".blend")),compress=True)
    render("scenery/"+base.name,model=base)


if __name__ == "__main__":
    build()
