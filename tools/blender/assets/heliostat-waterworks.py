"""Model the Heliostat Garden's masonry headrace, waterwheel and tailrace."""
from math import cos, pi, sin, tau
from pathlib import Path
from random import Random
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.orbital_finish import finish_surface
from tools.blender.style import MODELS, Sculpture, plate, render, reset_scene
from tools.style import export
from blender_sculpt import paint


def build():
    reset_scene()
    masonry = Sculpture()
    wheel = Sculpture()
    stone = paint("Waterworks ashlar", (.274,.198,.122), .04,.80)
    ochre = paint("Waterworks dressed coping", (.417,.303,.179), .04,.67)
    seam = paint("Waterworks recessed mortar", (.104,.084,.059), .04,.88)
    moss = paint("Waterworks damp moss", (.078,.129,.034), .02,.87)
    timber = paint("Waterworks soaked oak", (.148,.079,.041), .08,.68)
    bronze = paint("Waterworks patinated bronze", (.085,.169,.141), .53,.46)
    brass = paint("Waterworks bearing edges", (.383,.205,.076), .53,.37)
    water = paint("Garden running water", (.022,.176,.133), .21,.24)
    rng = Random(69)

    def slab(x,y,w,d,z,h,material=stone,cap=ochre):
        bevel = min(.10,h*.29)
        profile = [(w,d,z),(w,d,z+h-bevel),(w-.042,d-.042,z+h)]
        if min(w,d)>.9:
            plate(masonry,[(u,v,.27,height) for u,v,height in profile],seam,[material,cap],(x,y))
        else:
            masonry.loft([[(x+u*s,y+v*t,height) for s,t in ((-1,-1),(1,-1),(1,1),(-1,1))]
                          for u,v,height in profile],seam,[material,cap])

    # The gallery recedes into the uphill bank. Its lower terraces hold water.
    slab(-.16,.22,6.83,2.43,0,.68)
    slab(-2.83,-.55,3.66,1.73,.56,.22,seam,seam)
    for y in (-2.49,1.23):
        for x,w in ((-5.49,.82),(-3.85,.78),(-2.32,.72),(-.72,.83)):
            slab(x,y,w,.23,.59,.47,stone,ochre)
    slab(-6.42,-.59,.24,1.72,.59,.44)
    for x in (-6.62,5.09):
        for y in (-1.90,1.89):
            slab(x,y,.39,.47,.36,.52,stone,stone)

    def sheet(rows):
        first = len(masonry.vertices)
        masonry.vertices.extend(point for row in rows for point in row)
        for i in range(len(rows)-1):
            a = first+i*3
            for j in range(2):
                k = a+j
                masonry.face((k,k+1,k+4,k+3),water)

    sheet([[(x,y,.86) for y in (-2.17,-.56,1.04)] for x in (-6.10,-4.67,-2.89,-.84,1.09)])

    # Two barrel arches support the sloped headrace. Individual wedge blocks
    # reveal the joints on the facade and continue through the barrel vault.
    for x in (1.64,3.89,6.16):
        for y in (-.55,.88):
            slab(x,y,.59,.57,.42,.64,seam,stone)
            for j in range(4):
                slab(x+rng.uniform(-.05,.05),y,.40+rng.random()*.045,.49,1.02+j*.59,.57,stone,stone)
            slab(x,y,.55,.62,3.32,.28,stone,ochre)
    for span in (2.77,5.02):
        for i in range(8):
            a = i*pi/8+.012
            b = (i+1)*pi/8-.012
            loops = [[(span+r*cos(t),y,3.48+r*sin(t))
                      for r,t in ((.71,a),(.71,b),(1.14,b),(1.14,a))]
                     for y in (-1.03,1.48)]
            masonry.loft(loops,ochre if i in (3,4) else stone,[stone])
    for i in range(7):
        x = 1.06+i*.78
        z = 5.52+.044*i
        slab(x,.02,.44,1.35,z-.82,.31,stone,stone)
        for y in (-1.18,1.19):
            slab(x,y,.403,.22,z-.55,.42,stone,ochre)
            if i%2==0:
                slab(x+.07,y-.07,.24,.22,z-.64,.091,moss,moss)
    sheet([[(x,y,z) for y in (-.91,.01,.96)] for x,z in
           ((6.18,5.39),(3.88,5.26),(1.27,5.114),(.85,5.09))])
    # Water leaves the lip in the wheel's plane and runs out through the basin.
    sheet([[(x,y,z) for y in (-.98,-.36,.28)] for x,z in
           ((1.05,5.101),(.73,5.07),(.48,4.82),(.04,4.13),(-.42,2.49),(-.68,.84))])

    # The rear bearing is built into the gallery. Two cheeks support the
    # exposed front bearing while leaving the millrace visible beneath it.
    for x,y in ((-.79,1.00),(-1.63,-1.83),(.09,-1.83)):
        slab(x,y,.58,.49,.64,.39,stone,stone)
        for i in range(3):
            slab(x,y,.41-.025*i,.39,1.015+i*.55,.54,stone,stone)
    masonry.cable([(x,y,z,.21) for x,y,z in
                   ((-1.66,-1.82,2.49),(-1.28,-1.77,2.75),(-.79,-1.72,2.95),
                    (-.29,-1.77,2.75),(.14,-1.82,2.49))],stone,6)
    for y0,y1 in ((-1.96,-1.50),(.77,1.27)):
        masonry.cable([(-.79,y0,2.99,.29),(-.79,y1,2.99,.25)],brass,10)
    for x in (-5.79,-3.57,-.61,1.90,4.73,5.59):
        y = -1.83 if x>0 else -2.44
        z = 5.22 if x>0 else .98
        masonry.blade([(x,y,z,.051,.023),(x+.11,y-.10,z+.24,.087,.032),
                       (x+.29,y-.17,z+.32,.016,.008)],moss,stone)

    def radial(angle,r,y):
        return (r*cos(angle),y,r*sin(angle))

    for i in range(10):
        angle = i*tau/10
        for depth in (-.51,.49):
            loops = [[radial(a,r,y) for r,y in ((1.80,depth-.079),(2.02,depth-.079),
                                               (2.02,depth+.079),(1.80,depth+.079))]
                     for a in (angle+.012,angle+tau/10-.012)]
            wheel.loft(loops,timber,[bronze])
        # Broad radial scoops link the two hoops.
        loops = [[radial(angle+a,r,y) for r,a in ((1.45,-.034),(2.02,-.060),
                                                 (1.98,.018),(1.51,.074))]
                 for y in (-.50,.50)]
        wheel.loft(loops,brass,[timber])
        if i%2==0:
            spoke = []
            for r,w in ((.25,.26),(1.27,.11),(1.90,.13)):
                spoke.append([(r*cos(angle)-d*sin(angle),y,r*sin(angle)+d*cos(angle))
                              for d,y in ((-w,-.29),(w,-.29),(w,.28),(-w,.28))])
            wheel.loft(spoke,timber,[timber,bronze])
    wheel.cable([(0,-1.40,0,.15),(0,-.61,0,.15),(0,-.51,0,.37),(0,-.34,0,.41),
                 (0,.38,0,.35),(0,.49,0,.16),(0,1.59,0,.16)],brass,12)

    base = masonry.object("heliostat-waterworks")
    rotor = wheel.object("Sluice_Wheel")
    rotor.parent = base
    rotor.location = (-.79,-.36,2.99)
    objects = [base,rotor]
    triangles = 0
    for obj in objects:
        finish_surface(obj,reach=.66)
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
    if triangles>3600:
        raise ValueError(f"Waterworks: {triangles} triangles exceeds 3600")
    print(f"ASSET {base.name} · {triangles}/3600 triangles")
    folder = MODELS/"scenery"
    export(base.name,objects,folder)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/(base.name+".blend")),compress=True)
    render("scenery/"+base.name,model=base)


if __name__ == "__main__":
    build()
