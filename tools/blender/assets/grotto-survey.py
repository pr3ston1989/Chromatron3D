"""Rail-mounted spectrometer overlooking the fracture. Run with Blender -b -P."""
from math import cos, sin, tau
from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.style import MODELS, Sculpture, export_model, make_material, plate, render, reset_scene
from tools.blender.orbital_finish import finish_surface


def build():
    reset_scene()
    s = Sculpture()
    iron = make_material("Forged blue steel", "navy", .53, .48)
    rubber = make_material("Gaskets and conduit", "obsidian", .14, .61)
    alloy = make_material("Brushed alloy", "titanium", .61, .38)
    brass = make_material("Aged brass", "bronze", .57, .41, shade=1)
    lens = make_material("Smoked objective", "jade", .46, .19)
    lamp = make_material("Survey lamps", "amber", .08, .33, 1.32)
    # The gallery cantilevers from three drill anchors into the rock face.
    for x,y in [(-1.72,.63),(1.67,.63),(1.60,-.60)]:
        s.lathe([(x,y,0,.41,.41),(x,y,.18,.47,.47),(x,y,.23,.33,.33),
                 (x,y,1.55,.25,.25)],iron,6,bands=[rubber,brass,iron],phase=.2)
    for x in (-1.68,1.63):
        s.cable([(x,.62,.27,.14),(x,-.88,1.48,.14)],alloy,4)
    plate(s,[(2.41,1.12,.32,1.42),(2.45,1.15,.37,1.51),(2.43,1.14,.36,1.70),
             (2.32,1.08,.29,1.77)],rubber,[iron,rubber,alloy])
    for x in (-1.79,-1.22,-.65,-.08,.49,1.06,1.63):
        plate(s,[(.266,.86,.06,1.76),(.26,.85,.06,1.8)],iron,[iron],(x,.01))
    for x in (-2.03,-1.05,.13,1.22,2.04):
        s.cable([(x,-1.02,1.74,.058),(x,-1.06,2.36,.048)],alloy,5)
    for z,r,mat in [(2.04,.025,iron),(2.38,.052,brass)]:
        s.cable([(-2.2,-.70,z,r),(-2.03,-1.06,z,r),(2.04,-1.06,z,r),
                 (2.22,-.74,z,r)],mat,6)
    for x in (-1.76,.02,1.73):
        plate(s,[(.26,.06,.025,1.49),(.24,.06,.02,1.59)],lamp,[lamp],(x,-1.12))
    # Horizontally split optical tube in a two-sided trunnion.
    cx,cy=-.39,.10
    s.lathe([(cx,cy,1.76,.75,.72),(cx,cy,1.88,.79,.75),(cx,cy,2.02,.66,.64),
             (cx,cy,2.23,.60,.57),(cx,cy,2.30,.65,.60)],iron,12,
            bands=[brass,iron,rubber,alloy])
    for sign in (-1,1):
        x=cx+sign*.58
        outline=[(-.61,2.22),(-.52,2.55),(-.17,3.32),(.19,3.53),(.43,3.37),(.28,2.23)]
        s.loft([[(x+sign*d,y+cy,z) for y,z in outline] for d in (-.10,.13)],iron,[alloy])
        s.cable([(x+sign*.10,.18,3.23,.215),(x+sign*.20,.18,3.23,.19)],brass,10)
    barrel=[(-1.14,3.79,.53),(-1.05,3.76,.66),(-.92,3.72,.66),(-.86,3.70,.58),
            (-.33,3.52,.56),(-.22,3.49,.59),(.15,3.36,.54),(.52,3.23,.51),
            (.76,3.15,.40),(.82,3.13,.30)]
    rings=[]
    for y,z,r in barrel:
        rings.append([(cx+r*cos(tau*i/12),cy+y+.32*r*sin(tau*i/12),
                       z+.95*r*sin(tau*i/12)) for i in range(12)])
    s.loft(rings,rubber,[brass,alloy,rubber,iron,brass,alloy,iron,rubber,iron])
    inner=[]
    for y,z,r in [(-1.19,3.81,.51),(-1.23,3.82,.44),(-1.26,3.83,.37),(-1.30,3.84,.20)]:
        inner.append([(cx+r*cos(tau*i/12),cy+y+.32*r*sin(tau*i/12),z+.95*r*sin(tau*i/12))
                      for i in range(12)])
    s.loft(inner,rubber,[brass,rubber,lens])
    # A power cabinet, replaceable cooling fins and a hanging service loop.
    plate(s,[(.43,.32,.08,1.79),(.46,.34,.09,1.88),(.41,.32,.08,2.52),
             (.34,.28,.07,2.60)],iron,[rubber,iron,alloy],(1.56,.34))
    for i in range(5):
        z=2.01+i*.092
        s.cable([(1.28,.005,z,.025),(1.78,.005,z,.025)],rubber,4)
    s.cable([(.13,.50,2.91,.055),(.43,.82,2.50,.06),(.77,.86,1.94,.062),
             (1.04,.72,1.87,.06),(1.30,.60,2.09,.056)],rubber,6)
    for x in (1.39,1.58):
        s.cable([(x,.005,2.46,.035),(x,-.023,2.46,.036)],lamp,8)
    # Position relative to the two interlocking beds in the companion GLB.
    s.vertices=[(x+.7,y-2.93,z) for x,y,z in s.vertices]
    model=s.object("grotto-survey")
    finish_surface(model,reach=.48)
    out=MODELS/"scenery"
    export_model(model,2000,out)
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(out/"grotto-survey.blend"),compress=True)
    render("scenery/grotto-survey",(-.80,-1.35,.88),model=model)


if __name__=="__main__":
    build()
