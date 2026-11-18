"""Floating optical platform with a deep load-bearing plinth."""
from math import cos, sin, pi
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from style import Sculpture, make_material, plate, reset_scene, save_asset

def build(decorated):
    name = "board-chassis-undercarriage" if decorated else "board-chassis"
    dark = make_material("Furnace-black cavities", "ocean", .25, .70, shade=-2)
    low = make_material("Graphite plinth", "ocean", .44, .53, shade=-1)
    housing = make_material("Deep blue enamel", "ocean", .46, .42)
    raised = make_material("Upper chamfer", "ocean", .30, .36, shade=2)
    fixture = make_material("Machined titanium", "titanium", .35, .40, shade=1)
    trim = make_material("Copper service bracket", "copper", .35)
    cyan = make_material("Cyan power bus", "cyan", .12, .32, 2.0)
    amber = make_material("Amber indicator", "amber", .13, .37, 1.3)

    asset = Sculpture()
    foot = .78 if decorated else 0
    plate(asset, [(7.02,7.02,1.38,foot),(7.67,7.67,1.20,foot+.20),
                  (8.26,8.26,1.15,foot+.43),(9.13,9.13,.94,1.54),
                  (9.88,9.88,.78,2.28),(10.36,10.36,.84,2.55),
                  (10.50,10.50,.81,2.75),(10.50,10.50,.75,3.51),
                  (10.34,10.34,.72,3.71)],
          dark,[dark,low,low,housing,low,raised,housing,raised])

    # Nine shallow top wells. The 15×15 board rests immediately above them.
    for x in (-6.46,0,6.46):
        for y in (-6.46,0,6.46):
            plate(asset,[(3.18,3.18,.17,3.711),(3.07,3.07,.15,3.75)],
                  low,[housing],(x,y))

    for side in range(4):
        angle=side*pi/2
        c,s=cos(angle),sin(angle)
        def turn(x,y,z):
            return (x*c-y*s,x*s+y*c,z)

        def fascia(points, depths, material):
            if depths[-1]-depths[0] > .09:
                asset.loft([[turn(x,y,z) for x,z in points] for y in depths],material)
                return
            start = len(asset.vertices)
            asset.vertices.extend(turn(x,depths[-1],z) for x,z in reversed(points))
            asset.face(tuple(range(start,start+len(points))),material)

        for offset in (-6.6,0,6.6):
            well=[(offset-2.2,2.78),(offset+2.2,2.78),(offset+2.34,3.04),
                  (offset+2.10,3.38),(offset-2.12,3.38),(offset-2.34,3.13)]
            fascia(well,[10.498,10.502],dark)
            for slope in (-1.3,-.65,0,.65,1.3):
                x=offset+slope
                fascia([(x-.07,2.89),(x+.025,2.89),(x+.22,3.25),(x+.12,3.25)],
                       [10.502,10.522],low)

        # Broad power strip visible at player distance on each side.
        fascia([(-2.6,3.24),(2.6,3.24),(2.39,3.31),(-2.43,3.31)],[10.521,10.525],cyan)
        fascia([(-1.54,3.40),(-.92,3.40),(-.84,3.47),(-1.54,3.47)],[10.502,10.516],amber)
        # A trapezoidal bracket with two exposed fasteners at each corner.
        for x in (-9.42,9.42):
            fascia([(x-.31,2.71),(x+.38,2.71),(x+.51,3.58),(x-.36,3.58)],
                   [10.19,10.49],trim)
            for z in (2.91,3.41):
                ring=[(x+.087*cos(i*pi/3),z+.087*sin(i*pi/3)) for i in range(6)]
                fascia(ring,[10.491,10.51],fixture)
        if decorated:
            # A single compact caged thruster serves each underside quadrant.
            x,y,_=turn(0,5.58,0)
            asset.lathe([(x,y,0,.75,.59),(x,y,.10,1.04,.78),
                         (x,y,.28,1.19,.85),(x,y,.41,.96,.64),
                         (x,y,.81,.69,.48)],dark,8,bands=[cyan,fixture,low,housing])
            asset.cable([turn(-3.7,4.2,.80)+(.105,),turn(-1.6,4.94,.51)+(.105,),
                         turn(-.10,5.28,.30)+(.13,)],trim,5)
            asset.cable([turn(3.7,4.2,.80)+(.105,),turn(1.6,4.94,.51)+(.105,),
                         turn(.10,5.28,.30)+(.13,)],trim,5)
            asset.blade([turn(-3.55,5.4,.97)+(.13,.14,),turn(0,5.3,.67)+(.16,.12,),
                         turn(3.55,5.4,.97)+(.13,.14,)],fixture,dark)

    model=asset.object(name)
    save_asset(name,model,1500,(1.1,-1.7,-.65 if decorated else .78))

for variant in (False,True):
    reset_scene()
    build(variant)
