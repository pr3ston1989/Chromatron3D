"""Sculpt the layered limestone vault above the Crystal Grotto's back passage."""
from math import cos, sin, tau
from pathlib import Path
from random import Random
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.grotto_formations import Formation, crystal, pigment
from tools.blender.style import MODELS, export_model, render, reset_scene


SLATE, EDGE, RIND, VEIN, SHADOW, GEM = map(pigment, (
    "3B405C", "5B5970", "56516F", "8D8099", "232941", "8066A5",
))

# Jagged changes of pitch and an offset crest break the arch into strata.
INNER = [(-11.3,0),(-10.6,3.6),(-9.5,5.2),(-10.2,7.7),(-7.4,9.3),
         (-6.6,10.75),(-4.1,10.35),(-1.0,12.15),(2.6,12.0),(4.2,10.5),
         (6.5,10.1),(7.1,8.1),(9.25,6.3),(8.6,4.2),(10.2,0)]
OUTER = [(-16.4,0),(-16.9,3.4),(-16.6,6.4),(-15.2,9.1),(-12.4,11.7),
         (-9.4,13.25),(-5.7,14.36),(-2.0,15.25),(2.7,15.1),(6.0,14.42),
         (9.0,13.11),(11.2,11.1),(13.45,8.1),(14.9,4.8),(15.2,0)]


def arch(shape):
    # The contours run across the rock thickness, then into the dark sloping
    # tunnel. There is no mesh cap across the actual opening.
    last = None
    for level,(depth,blend,tint) in enumerate((
        (8.4,1.0,SHADOW),(4.9,1.0,SLATE),(.92,1.0,SLATE),
        (-.70,.83,EDGE),(-.82,.69,RIND),(-.91,.60,VEIN),
        (-.71,.54,EDGE),(-.58,.37,SLATE),(-.15,0,SHADOW),
        (2.6,.10,SHADOW),(6.6,.12,SHADOW),(8.4,0,SHADOW),
    )):
        row = []
        for i,((ix,iz),(ox,oz)) in enumerate(zip(INNER,OUTER)):
            x = ix+(ox-ix)*blend+.34*sin(i*1.7+level*.51)
            edge = i in (0,len(INNER)-1)
            z = 0 if edge else iz+(oz-iz)*blend+.20*sin(i*1.9+level*.86)
            y = depth+.47*sin(i*1.25+.53*level)+.17*cos(i*2.7)
            tone = tint.lerp(SLATE,.25+.18*sin(i*1.93+level*.51))
            tone *= .70+.27*sin(i*.92+level*.31)**2 if level==5 else .83+.21*cos(i*1.62+level*.80)
            row.append(shape.point((x,y,z),tone))
        if last:
            for i in range(len(row)-1):
                a,b,c,d = last[i],last[i+1],row[i+1],row[i]
                if (level+i)%2:
                    shape.face((a,d,b),shape.rock)
                    shape.face((d,c,b),shape.rock)
                else:
                    shape.face((a,d,c),shape.rock)
                    shape.face((a,c,b),shape.rock)
        last = row


def spire(shape,root,axis,width,seed):
    """Build offset erosion rings around the central growth axis."""
    rng = Random(seed)
    shift = [rng.uniform(.82,1.19) for _ in range(7)]
    previous = None
    for n,(height,radius,tint) in enumerate(((0,1.00,SLATE),(.21,.84,RIND),(.50,.58,EDGE),
                                             (.72,.31,SLATE),(.90,.16,RIND),(1,.05,SHADOW))):
        cx,cy,cz = Vector(root)+Vector(axis)*height
        row = []
        for i,warp in enumerate(shift):
            a = i*tau/7+.14*n
            z = cz + .17*cos(a*2+n) if n else cz
            row.append(shape.point((cx+cos(a)*width*radius*warp,cy+sin(a)*width*radius*warp,z),
                                   tint*(.76+.25*sin(i*2.35+n*.81)**2)))
        if previous:
            # The hanging formations run downward. Keep the outside visible.
            first,second = (row,previous) if axis[2]<0 else (previous,row)
            shape.connect(first,second,shape.rock,split=True)
        previous = row
    indices = tuple(reversed(previous)) if axis[2]<0 else tuple(previous)
    shape.face(indices,shape.rock)


def build():
    reset_scene()
    shape = Formation()
    shape.rock.name = "Grotto vault strata"
    arch(shape)
    for seed,(x,y,z,dx,drop,width) in enumerate((
        (-8.4,1.1,10.1,-.32,-3.78,.96),(-6.9,2.1,11.02,.42,-5.57,1.08),
        (-5.4,.99,11.45,-.19,-3.71,.81),(-1.1,1.85,12.93,.34,-2.85,.73),
        (1.18,2.4,12.74,.31,-4.11,1.01),(4.58,1.39,11.45,-.37,-2.93,.83),
        (6.3,1.7,10.66,-.10,-3.78,.94),(7.0,3.8,10.10,.64,-5.25,.98),
    ),21):
        spire(shape,(x,y,z),(dx,.21,drop),width,seed)
    # Small columns grow out of the same bases as the layered wall.
    for seed,(x,y,size,height,lean) in enumerate((
        (-14.2,-1.44,2.71,5.36,1.4),(-11.89,-1.36,2.24,3.40,.46),
        (11.05,-1.5,2.49,3.86,-.87),(14.34,-.54,2.50,6.18,-1.20),
    ),44):
        spire(shape,(x,y,0),(lean,.76,height),size,seed)
    for seed,(x,y,z) in enumerate(((-11.43,-1.98,1.12),(12.25,-2.05,1.19))):
        for i in range(6):
            angle = i*2.46
            crystal(shape,(x+cos(angle)*i*.17,y+sin(angle)*i*.13,z-.093*i),
                    (.25*cos(angle),-.27,1.7-.14*i),.29-i*.016,angle,GEM*(.94+.09*seed))
    model = shape.object("grotto-vault")
    folder = MODELS/"scenery"
    export_model(model,2300,folder)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/(model.name+".blend")),compress=True)
    render("scenery/"+model.name,direction=(-.54,-.84,.43),model=model)


if __name__ == "__main__":
    build()
