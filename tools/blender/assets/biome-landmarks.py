"""Model the campaign landmarks, bake contact shading and export Blender sources and GLBs."""
from math import cos, pi, sin, tau
from pathlib import Path
from random import Random
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.style import MODELS, Sculpture, export_model, make_material, plate, render, reset_scene
from tools.blender.orbital_finish import finish_surface
from blender_sculpt import paint


class Landmark:
    def __init__(self, name, body, edge, signal, stone, *, masonry=False):
        self.s = Sculpture()
        self.dark = make_material("Recessed joints", "obsidian", .22, .65)
        self.body = make_material(name + " body", body, .15 if masonry else .44, .58)
        self.edge = make_material(name + " bevel", edge, .16 if masonry else .53, .42)
        self.stone = make_material(name + " substructure", stone, .08, .78, shade=-1)
        self.glass = make_material(name + " ceramic and glass", signal, .38, .24)
        self.signal = make_material(name + " pilot lights", signal, .12, .36, 1.15)

    def slab(self, center, x, y, base, height, corner, material=None):
        lip = min(height*.24, corner*.32)
        plate(self.s, [(x*.91,y*.91,corner,base), (x,y,corner,base+lip),
                       (x,y,corner,base+height-lip), (x*.96,y*.96,corner,base+height)],
              material or self.dark, [self.dark,material or self.body,self.edge], center)

    def pipe(self, points, radius, material=None, sides=6):
        self.s.cable([(*point,radius) for point in points], material or self.body, sides)

    def ring(self, center, inner, outer, depth, material, *, segments=18, start=0., span=tau,
             horizontal=False, lights=False):
        """Cut an annulus into individually beveled structural segments."""
        cx,cy,cz = center
        step = span/segments
        gap = min(.024,step/9)
        def point(angle,r,thickness):
            x,y = cos(angle)*r,sin(angle)*r
            return (cx+x,cy+y,cz+thickness) if horizontal else (cx+x,cy+thickness,cz+y)
        for i in range(segments):
            a = start+i*step+gap
            b = a+step-2*gap
            middle = (a+b)*.5
            p = [point(a,inner,-depth),point(a,outer,-depth),point(a,outer,depth),point(a,inner,depth)]
            q = [point(middle,inner,-depth),point(middle,outer,-depth),point(middle,outer,depth),point(middle,inner,depth)]
            r = [point(b,inner,-depth),point(b,outer,-depth),point(b,outer,depth),point(b,inner,depth)]
            self.s.loft([p,q,r],self.dark,[material,self.edge])
            if lights and i%2==0:
                rim = inner+(outer-inner)*.48
                self.pipe([point(a+step*.17,rim,-depth*1.035),point(middle,rim,-depth*1.035),
                           point(b-step*.17,rim,-depth*1.035)],max(.025,depth*.07),self.signal,4)

    def rock(self, xyz, radii, height, seed, *, cap=None):
        """Facet an asymmetric body with separate shelf, fracture and crown contours."""
        rng = Random(seed)
        x,y,z = xyz
        rx,ry = radii
        count = 9
        contour = [rng.uniform(.8,1.14) for _ in range(count)]
        levels = []
        for t,scale,shift in [(0.,.78,0),(.26,1,.05),(.61,.84,-.09),(.85,.60,-.16),(1.,.33,-.08)]:
            ring = []
            for i,k in enumerate(contour):
                a = i*tau/count+t*.09
                w = scale*k*rng.uniform(.87,1.10)
                ring.append((x+rx*(cos(a)*w+shift),y+ry*(sin(a)*w+.13*t),
                             z+height*(t+rng.uniform(-.065,.061) if t else 0.)))
            levels.append(ring)
        self.s.loft(levels,self.stone,[self.stone,self.body,self.stone,cap or self.edge])

    def pod(self, x, y, z, radius, height, *, luminous=True):
        profile = [(x,y,z,radius,radius*.82),(x,y,z+.16,radius*1.12,radius*.92),
                   (x,y,z+height*.57,radius,radius*.83),(x,y,z+height*.79,radius*.85,radius*.68),
                   (x,y,z+height,radius*.45,radius*.36)]
        self.s.lathe(profile,self.dark,12,bands=[self.edge,self.body,self.edge,self.glass if luminous else self.body])
        for i in range(8):
            a = i*tau/8
            self.pipe([(x+radius*cos(a),y+radius*.83*sin(a),z+height*.27),
                       (x+radius*.96*cos(a),y+radius*.79*sin(a),z+height*.49)],.059,
                      self.signal if luminous else self.edge,4)


def aqueduct():
    m = Landmark("Sandstone gallery", "limestone", "ceramic", "amber", "bronze", masonry=True)
    algae = make_material("Moss along the trough","olive",.06,.76,shade=-1)
    for x in (-5.5,-1.85,1.85,5.5):
        m.slab((x,0),1.38,1.61,0,1.74,.39)
        for z in (1.72,2.82,3.92):
            m.slab((x,0),.81,1.19,z,1.09,.24,m.body)
        m.slab((x,0),.98,1.42,4.82,.48,.25)
    for x in (-3.675,0,3.675):
        m.ring((x,0,5.09),1.42,2.12,1.0,m.body,segments=10,span=pi)
    m.slab((0,0),7.42,1.57,6.95,.38,.42)
    m.slab((0,.05),7.17,1.29,7.29,.22,.30,m.glass)
    for x in range(-6,7,2):
        m.slab((x,-1.17),.39,.17,7.48,.42,.11)
        m.pipe([(x-.29,-1.48,7.46),(x-.04,-1.53,7.08),(x+.14,-1.48,6.68)],.058,algae)
        for i in range(3):
            z=7.35-i*.22
            m.s.blade([(x-.08,-1.55,z,.05,.026),(x-.33,-1.65,z-.15,.12,.055),
                       (x-.55,-1.53,z-.26,.015,.012)],algae,m.stone)
    for x in (-5.5,-1.85,1.85,5.5):
        for k in (-.32,.32):
            m.pipe([(x+k,-1.22,1.95),(x+k,-1.22,4.62)],.046,m.stone,4)
    return m


def orchard():
    m = Landmark("Irrigated orchard", "limestone", "copper", "jade", "olive", masonry=True)
    leaf = make_material("Layered evergreen crowns","olive",.04,.77,shade=1)
    twig = make_material("Twisted bark","bronze",0,.84,shade=-1)
    for i,(x,y,z,rx,ry) in enumerate([(-2,.6,0,5.7,3.4),(2.2,1.5,1.6,4.3,2.7),(4.9,2.4,3.1,2.95,2.14)]):
        m.rock((x,y,z),(rx,ry),2.46,72+i,cap=leaf)
        m.slab((x,y+.3),rx*.79,ry*.73,z+1.59,.39,.78,m.stone)
    for i,(x,y,z,h) in enumerate([(-5,.5,1.85,3.2),(-1,1.7,3.3,3.55),(2.4,1.4,3.5,2.8),
                                   (4,2.7,5.,3.7),(6.2,2.45,4.75,2.8)]):
        m.pipe([(x,y,z),(x+.21,y+.07,z+h*.40),(x+.33,y-.04,z+h*.73)],.21,twig)
        for j in range(3):
            r=(.86-.18*j)*h*.48
            m.s.lathe([(x+.31,y,z+h*(.34+.17*j),r*.53,r*.50),
                       (x+.27,y,z+h*(.42+.18*j),r,r*.86),
                       (x+.42,y,z+h*(.73+.16*j),.12,.12)],m.stone,9,
                      ribs=3,relief=.13,bands=[m.stone,leaf],phase=i*.8+j*.48)
    return m


def garden_spring():
    m = Landmark("Spring terraces", "limestone", "bronze", "jade", "olive", masonry=True)
    water = paint("Garden running water", (.017,.158,.121), .22,.25)
    soil = paint("Moss over earth", (.062,.097,.026), .02,.89)
    leaf = paint("Olive crown sunward", (.127,.225,.037), .03,.68)
    leaf_dark = paint("Olive crown shade", (.023,.081,.028), .01,.83)
    blossom = paint("Ocher wildflowers", (.54,.22,.051), 0,.57)
    bark = make_material("Twisted olive bark","bronze",.03,.75,shade=-2)
    rng = Random(83)
    # A string of low retaining walls carries the water toward the ravine.
    for i,(x,y,z,rx,ry) in enumerate([(-3.1,.44,1.2,2.95,3.02),(.33,.22,.72,2.8,2.8),(3.2,-.32,.14,2.46,2.56)]):
        m.rock((x,y,0),(rx*1.22,ry*1.18),z+1.44,310+i,cap=soil)
        m.slab((x,y),rx,ry,z+.75,.49,.79,m.body)
        m.slab((x,y+.18),rx*.87,ry*.82,z+1.23,.13,.48,soil)
        rim = [(rx*.70,.78,1.35),(rx*.76,.91,1.49),(rx*.65,.74,1.57),(rx*.59,.66,1.45)]
        start = len(m.s.vertices)
        sides = 12
        m.s.vertices.extend((x+wx*cos(j*tau/sides),y-1.03+wy*sin(j*tau/sides),z+height)
                            for wx,wy,height in rim for j in range(sides))
        for row,material in enumerate((m.body,m.edge,m.dark)):
            for j in range(sides):
                a = start+row*sides+j
                b = start+row*sides+(j+1)%sides
                m.s.face((a,b,b+sides,a+sides),material)
        water_edge = start+3*sides
        m.s.face(tuple(range(water_edge,water_edge+sides)),water)
        for j in range(5):
            pos = x+rx*(j/3.3-.57)
            m.slab((pos,y-2.38),.27,.40,z+1.16,.22,.15,m.stone)
    # The cascade crests and then drops into the next, lower basin.
    for x,y,z in [(-1.47,-.68,2.73),(1.70,-.93,2.25),(4.22,-1.35,1.67)]:
        cross = [(x-.41,y,z),(x-.33,y+.28,z+.02),(x+.31,y+.24,z+.02),(x+.46,y,z)]
        sheet = [[(px+dx,py+dy,pz+dz) for px,py,pz in cross]
                 for dx,dy,dz in [(0,0,0),(.51,-.17,-.10),(.87,-.30,-.38),(1.01,-.35,-.67)]]
        base = len(m.s.vertices)
        m.s.vertices.extend(point for row in sheet for point in row)
        for i in range(3):
            for j in range(3):
                v = base+4*i+j
                m.s.face((v,v+1,v+5,v+4),water)
    for x,y,z,h in [(-4.55,1.74,2.53,2.64),(-2.26,1.62,2.57,3.03),(.41,1.69,2.08,2.75),(3.35,.89,1.58,2.17)]:
        m.s.cable([(x,y,z,.25),(x-.18,y+.16,z+h*.37,.19),(x+.18,y+.19,z+h*.70,.13)],bark,7)
        for i in range(4):
            a = i*tau/4+rng.uniform(-.4,.4)
            dx,dy = cos(a)*h*.45,sin(a)*h*.34
            m.s.cable([(x-.12,y+.13,z+h*.43,.12),(x+dx*.51,y+dy*.53,z+h*.71,.074),
                       (x+dx,y+dy,z+h*.84,.024)],bark,5)
            cx,cy,cz = x+dx,y+dy,z+h*(.78+.15*rng.random())
            radius = h*rng.uniform(.29,.39)
            m.s.lathe([(cx,cy,cz-.34,radius*.51,radius*.43),
                       (cx,cy,cz-.13,radius,radius*.73),(cx+.13,cy,cz+.29,radius*.76,radius*.61),
                       (cx+.21,cy+.10,cz+.49,.18,.17)],leaf_dark,9,ribs=3,relief=.16,
                      bands=[leaf_dark,leaf,leaf],phase=a)
    for i in range(14):
        x,y = rng.uniform(-5.5,4.4), rng.uniform(-2.14,-1.85)
        z = 2.54 if x<-1.7 else 2.03 if x<1.64 else 1.45
        for j in range(3):
            a = i*.68+j*tau/3
            m.s.blade([(x,y,z,.032,.02),(x+.12*cos(a),y+.12*sin(a),z+.27,.068,.043),
                       (x+.33*cos(a),y+.33*sin(a),z+.35,.014,.013)],leaf,leaf_dark)
        if i%3==0:
            m.s.lathe([(x,y,z+.25,.025,.025),(x,y,z+.37,.081,.072),(x+.018,y,z+.40,.045,.034)],
                      leaf,5,bands=[blossom,blossom])
    return m


def glacier():
    m = Landmark("Blue ice escarpment", "steel", "ceramic", "cyan", "navy", masonry=True)
    deep = make_material("Compressed glacial ice", "cyan", .15, .33, shade=-2)
    snow = make_material("Wind polished ice crust", "ceramic", .09, .54, shade=1)
    for i,(x,y,z,rx,ry,h) in enumerate([(-6.5,.4,0,5.3,3.7,5.1),(.4,1.3,0,5.2,3.5,6.7),
                                         (6.2,2.9,0,4.6,4.8,10.1),(10,5.2,1,4.2,4.0,6.7)]):
        m.rock((x,y,z),(rx,ry),h,76+i,cap=snow)
        for j in range(3):
            m.rock((x+(j-1)*1.37,y-ry*.68,z+(.12+j*.17)*h),(.92,1.12),h*(.45+.09*j),151+i*6+j,cap=deep)
    return m


def polar_station():
    m = Landmark("Polar traverser", "steel", "ceramic", "amber", "navy")
    m.slab((0,0),4.1,2.38,1.2,.42,.57)
    for x in (-2.88,2.88):
        for y in (-1.56,1.56):
            m.slab((x,y),.89,.56,0,.33,.29)
            m.pipe([(x,y,.20),(x*.89,y*.88,1.32)],.24)
    for i in range(4):
        x = -2.63+i*1.72
        m.slab((x,0),.83,1.43,1.55,1.49,.45,m.body)
        m.slab((x,0),.77,1.24,3.03,.28,.22,m.edge)
        for k in (-.32,.32):
            m.slab((x+k,-1.43),.21,.046,2.18,.32,.022,m.glass)
        m.pipe([(x-.42,-1.45,2.09),(x+.42,-1.45,2.09)],.035,m.signal,4)
    m.pipe([(2.64,.77,3.20),(2.64,.77,4.82),(1.93,.77,5.13)],.083)
    m.pod(2.64,.77,4.5,.27,.35)
    return m


def frost_optical_lab():
    m = Landmark("Snowline optical station", "steel", "titanium", "amber", "navy")
    enamel = make_material("Orange ceramic cladding", "copper", .29,.44)
    glass = paint("Heated polar glazing", (.039,.171,.223), .41,.23,.08)
    snow = paint("Drift across the roof", (.38,.50,.59), .02,.79)
    m.slab((0,0),5.04,2.65,.83,.49,.65,m.stone)
    m.slab((-.28,-1.69),4.28,1.11,1.32,.25,.33,m.body)
    for x in (-3.51,3.51):
        for y in (-1.83,1.83):
            m.s.lathe([(x,y,-3.56,.46,.44),(x,y,-3.43,.54,.54),(x,y,-3.19,.54,.54),
                       (x,y,-3.04,.33,.33),(x,y,.13,.29,.29)],m.dark,8,
                      bands=[m.stone,m.body,m.edge,m.body])
            m.slab((x,y),.74,.62,0,.29,.21)
            m.pipe([(x,y,.19),(x*.91,y*.70,.97),(x*.95,y*.60,1.47)],.22,m.body)
            m.pipe([(x-.61,y+.22,.26),(x+.17,y-.13,1.24)],.093,m.edge,5)

    def outline(width,depth,z):
        return [(x,y,z) for x,y in [(-width+.44,-depth),(width-.44,-depth),(width,-depth+.40),
                (width,depth-.40),(width-.44,depth),(-width+.44,depth),(-width,depth-.40),(-width,-depth+.40)]]
    sections = [(4.26,1.92,1.57),(4.48,2.02,1.82),(4.48,2.02,2.28),(4.21,1.91,3.65),
                (3.89,1.63,4.03),(3.62,1.43,4.11)]
    m.s.loft([outline(*section) for section in sections],m.dark,[m.edge,m.stone,m.body,m.edge,m.body])
    for x in (-3.29,-2.17,-1.05,.07,1.19):
        def pane(w,y,low,high):
            return [(x-w,y,low+.09),(x-w+.10,y,low),(x+w-.10,y,low),(x+w,y,low+.09),
                    (x+w,y+.11,high-.08),(x+w-.09,y+.13,high),
                    (x-w+.09,y+.13,high),(x-w,y+.11,high-.08)]
        m.s.loft([pane(.52,-2.02,2.46,3.46),pane(.48,-2.16,2.50,3.42),
                  pane(.39,-2.17,2.59,3.34)],m.dark,[enamel,glass])
    for side in (-1,1):
        m.pipe([(-3.79,side*2.00,2.19),(.74,side*2.00,2.19),(1.38,side*1.95,2.44)],.053,m.signal,4)
        for x in (-3.68,-.90,1.87,3.72):
            m.pipe([(x,side*2.52,1.54),(x,side*2.52,1.95)],.041,m.edge,5)
        m.pipe([(-3.93,side*2.52,1.95),(3.87,side*2.52,1.95)],.041,m.edge,5)
    m.slab((2.96,-1.95),.85,.18,1.61,1.76,.12,enamel)
    m.slab((2.96,-2.13),.59,.059,1.62,1.50,.035,m.dark)
    for x in (2.57,3.35):
        m.pipe([(x,-2.21,1.91),(x,-2.21,2.76)],.035,m.signal,4)
    for step in range(4):
        m.slab((2.97,-2.97-.20*step),.66,.45,1.29-.14*step,.16,.125,m.body)
    # A drift interrupts the mechanical roof line. The intake and radiators stay exposed.
    roof_drift = [(-3.72,-.72,4.09,.30,.015),(-2.68,-.57,4.15,.75,.07),
                  (-1.82,-.76,4.16,.81,.16),(-.45,-.86,4.13,.57,.095),(.31,-.75,4.09,.19,.022)]
    m.s.blade(roof_drift,snow,m.edge)
    m.slab((1.64,.49),1.34,.67,4.14,.32,.24,m.stone)
    for x in (.76,1.12,1.48,1.84,2.20,2.56):
        m.slab((x,.49),.067,.57,4.46,.17,.047,m.edge)
    m.pipe([(2.82,1.34,3.59),(2.92,1.34,4.57),(3.27,1.34,4.83)],.14,m.body,8)
    m.pipe([(3.27,1.34,4.83),(3.46,1.34,4.83)],.18,enamel,8)
    return m


def frost_icefall():
    m = Landmark("Layered glacial icefall", "steel", "cyan", "cyan", "navy", masonry=True)
    core = paint("Glacier compressed blue ice", (.031,.125,.211), .19,.38)
    face = paint("Glacier clear fracture", (.061,.24,.37), .22,.28)
    snow = paint("Glacier wind crust", (.30,.43,.53), .03,.72)
    sifted = paint("Glacier drift scallops", (.18,.30,.41), .04,.65)
    rng = Random(418)
    for i,(x,y,rx,ry,height) in enumerate([(-5.1,1.1,3.64,3.1,4.31),(-.93,1.52,3.30,2.97,5.14),
                                         (2.78,1.88,3.43,3.27,6.32),(5.59,2.9,2.78,3.09,7.18),
                                         (-2.87,-1.24,3.08,2.62,3.53),(2.13,-1.21,2.55,2.19,3.27)]):
        count = 10
        outline = [rng.uniform(.84,1.16) for _ in range(count)]
        profile = [(0,.93,-.09),(.18,1.01,-.09),(.48,.94,-.11),(.69,.78,-.16),(.88,.77,-.18),
                   (.94,.71,-.12),(.99,.56,-.05),(1,.32,.02)]
        rings = []
        for j,(level,width,bend) in enumerate(profile):
            ring = []
            for k in range(count):
                a = k*tau/count+.13*i
                skew = outline[k]*width
                crust = max(0.,sin(a-.32))*min(j,5)*.035
                z = (level+crust+(rng.uniform(-.046,.038) if j else 0))*height
                ring.append((x+rx*(cos(a)*skew+bend),y+ry*(sin(a)*skew+.26*level),z))
            rings.append(ring)
        m.s.loft(rings,m.stone,[m.stone,core,face,core,face,sifted,snow])
    for i,(x,y,z,height,w) in enumerate([(-5.6,-1.26,1.85,2.74,.64),(-4.6,-1.42,1.5,2.09,.53),
                                        (.2,-1.91,1.37,2.13,.56),(1.19,-1.99,.94,1.75,.47),
                                        (4.01,-.70,2.20,2.90,.70),(4.92,-.83,2.08,3.36,.62),
                                        (6.03,.19,3.38,3.14,.58)]):
        bend = .28 if i%2 else -.24
        m.s.lathe([(x,y,z,w,w*.84),(x+bend*.31,y-.22,z+.47*height,w*.82,w*.61),
                   (x+bend,y-.31,z+.87*height,w*.63,w*.47),(x+bend+.13,y-.22,z+height,w*.11,w*.09)],
                  core,7,phase=.34*i,bands=[core,face,sifted])
    for x,y,z,rx in [(-6.5,-2.17,.16,1.21),(-3.95,-3.07,.49,.93),(-1.2,-3.11,.20,1.24),
                    (1.1,-3.17,.22,.93),(4.3,-2.88,.10,1.17),(5.8,-2.14,.21,.96)]:
        m.rock((x,y,z),(rx,rx*.72),.53+rx*.46,int((x+7)*78),cap=sifted)
    return m


def frost_ridge():
    m = Landmark("Distant glacial divide", "steel", "titanium", "cyan", "navy", masonry=True)
    snow = paint("Distant snow line", (.37,.49,.60), .02,.84)
    mountains = [(-12,1,4.2,3.4,7.1),(-6.8,0,4.8,3.8,10.2),(-1.8,-.5,4.1,3.3,8.8),
                 (3.5,.2,5.6,4.1,13.3),(9.4,1.3,4.8,3.3,9.9),(13,2.7,3.7,3.15,6.1)]
    for i,(x,y,w,d,h) in enumerate(mountains):
        contour = [(-1,-.24),(-.51,-1),(.14,-.86),(.62,-.59),(1,-.13),(.63,.87),(-.54,.71)]
        tiers = [(0,1,0),(.30,.92,.01),(.61,.51,-.08),(.83,.37,-.15),(1,.07,-.07)]
        m.s.loft([[(x+w*(u*width+shift),y+d*(v*width+.12*height),
                    h*max(0,height+.06*cos(k+i) if height else 0))
                   for k,(u,v) in enumerate(contour)] for height,width,shift in tiers],
                 m.body,[m.body,m.body,snow,snow])
    return m


def frost_radiometer():
    m = Landmark("Polar scanning radiometer", "steel", "titanium", "amber", "navy")
    mirror = paint("Radiometer optical panels", (.10,.29,.33), .66,.24)
    copper = make_material("Radiometer heater traces", "copper", .46,.42)
    m.s.lathe([(0,0,-1.62,.80,.80),(0,0,-1.49,.91,.91),(0,0,-1.24,.83,.83),
               (0,0,-1.08,.59,.59),(0,0,.14,.56,.56)],m.dark,12,bands=[m.stone,m.body,m.edge,m.body])
    m.slab((0,0),2.28,1.71,0,.38,.54,m.stone)
    m.slab((0,.1),1.44,1.07,.36,.41,.39,m.body)
    dish_axis = (0,-.85,.53)
    radial_z = (0,.53,.85)
    def dish_point(angle,r,depth):
        return (r*cos(angle),r*sin(angle)*radial_z[1]+depth*dish_axis[1],
                2.75+r*sin(angle)*radial_z[2]+depth*dish_axis[2])
    n = 18
    profile = [(-.85,.20),(-.68,1.02),(-.46,1.49),(-.11,1.87),(-.02,1.94),(.03,1.90),
               (-.09,1.78),(-.43,1.24),(-.65,.59),(-.72,.19)]
    m.s.loft([[dish_point(i*tau/n,radius,depth) for i in range(n)] for depth,radius in profile],
             m.dark,[m.body,m.body,m.body,m.edge,m.edge,copper,mirror,mirror,mirror])
    for i in range(0,n,2):
        angle = i*tau/n
        m.pipe([dish_point(angle,.31,-.70),dish_point(angle,.62,-.61),
                dish_point(angle,1.26,-.40),dish_point(angle,1.87,-.054)],.027,copper,4)
    for x in (-1.43,1.43):
        m.pipe([(x,0,.64),(x,.47,1.58),(x*.76,.48,2.49)],.25,m.body,8)
        m.pipe([(x,-.38,.45),(x*1.03,-.08,1.17)],.051,m.signal,5)
    for side in (-1,1):
        m.pipe([dish_point(0 if side==1 else pi,1.64,-.18),(side*.32,-.70,2.93),(0,-.83,3.04)],.065,m.edge,6)
    m.pipe([(0,-.58,2.96),(0,-.89,3.09),(0,-.98,3.15)],.16,m.body,8)
    m.pipe([(0,-.96,3.13),(0,-1.04,3.16)],.119,m.signal,8)
    return m


def smelter():
    m = Landmark("Spectral furnace", "graphite", "copper", "amber", "obsidian")
    m.slab((0,0),4.9,3.0,0,.56,.88)
    for x in (-2.8,2.8):
        m.slab((x,0),1.55,2.57,.55,.95,.62)
        m.pipe([(x,-2.48,1.23),(x,-1.42,2.0),(x,-.95,3.56),(x,0,4.45)],.32)
        m.pipe([(x+.21,-2.46,1.23),(x+.21,-1.49,2),(x+.21,-.99,3.57)],.08,m.signal,4)
    m.ring((0,-.07,3.35),1.28,2.78,1.10,m.body,segments=20,lights=True)
    m.ring((0,-1.43,3.35),1.70,1.91,.18,m.edge,segments=16)
    for x in (-3.4,3.4):
        for y in (.24,1.12,1.94):
            m.pipe([(x,y,.82),(x,y,3.52),(x*.90,y,4.12)],.13,m.edge)
    return m


def basalt_basin():
    m = Landmark("Fused basalt", "plum", "bronze", "amber", "obsidian", masonry=True)
    for i in range(15):
        x = (i%5-2)*2.23+(i//5)*.69
        y = (i//5-1)*2.67+(i%3)*.34
        m.rock((x,y,0),(1.43+i%3*.28,1.46),1.42+(.48*y+1.65)**2*.4+(i%4)*.43,12+i)
    for y in (-3.6,-1.55):
        m.pipe([(-6,y,.48),(-3.4,y+.52,.72),(-.6,y-.28,.63),
                (1.45,y+.35,.74),(4.9,y-.60,.58)],.115,m.signal,5)
    return m


def bathysphere():
    m = Landmark("Abyssal habitat", "jade", "titanium", "cyan", "navy")
    m.slab((0,0),4.35,3.35,.95,.37,.78)
    for x in (-2.84,2.84):
        for y in (-1.84,1.84):
            m.pipe([(x*1.24,y*1.23,.12),(x,y,1.16),(x*.89,y,1.60)],.29)
            m.slab((x*1.24,y*1.23),.68,.57,0,.24,.28)
    for x,y,r in [(-1.3,-.25,2.18),(1.85,.71,1.65),(-.7,2.0,1.26)]:
        m.pod(x,y,1.27,r,2.78)
        for z in (1.69,2.72):
            m.ring((x,y,z),r*.88,r*1.06,.082,m.edge,segments=12,horizontal=True)
    m.pipe([(-2.8,-.37,2.01),(-4.1,-.37,2.01),(-4.61,-.37,1.50)],.46,m.body,10)
    m.pipe([(-2.3,1.8,3.62),(-2.3,1.8,5.07),(-1.52,1.8,5.07)],.093)
    return m


def reef():
    m = Landmark("Deep reef", "navy", "jade", "cyan", "obsidian", masonry=True)
    frond = make_material("Translucent kelp blades","jade",.08,.49,shade=1)
    for i in range(8):
        x,y = (i%4-1.5)*2.67,(i//4-1)*3.06
        m.rock((x,y,0),(2.1,2.37),3.05+i%3*.65,99+i)
        for j in range(3):
            sx,sy,z = x+(j-1)*.68,y+.18*j,2.1+i%3*.54
            bend = .82+.18*j
            m.s.blade([(sx,sy,z,.12,.05),(sx+.47,sy+.26,z+.79,bend*.45,.11),
                       (sx-.40,sy+.8,z+2.04,bend*.32,.12),(sx-.81,sy+1.19,z+2.82,.04,.034)],
                      frond,m.glass if j==1 else m.body)
    return m


def abyss_observatory():
    m = Landmark("Bathyal observatory", "jade", "steel", "amber", "navy")
    glass = paint("Bathyal coated glass", (.035,.18,.23), .32,.21,.09)
    copper = make_material("Bronze hatch seal", "bronze", .57,.39)
    fairing = make_material("Pressure hull fairing", "steel", .41,.53,shade=-1)
    # The hull narrows into pressure bulkheads at both ends.
    sections = [(-4.8,.54,.60),(-4.62,.94,.93),(-3.85,1.55,1.31),(-3.29,1.69,1.40),
                (2.99,1.69,1.40),(3.36,1.55,1.32),(4.27,.94,.93),(4.50,.64,.63)]
    def section(x,width,height):
        return [(x,width*cos(a*tau/16),2.82+height*sin(a*tau/16)) for a in range(16)]
    m.s.loft([section(*row) for row in sections],m.dark,
             [m.dark,m.body,m.edge,m.body,m.edge,m.body,m.dark])
    for x in (-3.09,-1.39,1.39,2.77):
        m.s.loft([section(x-.17,1.70,1.42),section(x-.11,1.77,1.47),
                  section(x+.11,1.77,1.47),section(x+.17,1.70,1.42)],m.dark,[m.dark,m.edge,m.body])
    for x in (-2.27,0,2.05):
        m.slab((x,.16),.56,.76,4.12,.29,.21,fairing)
        for y in (-.11,.14,.39):
            m.pipe([(x-.32,y,4.43),(x+.32,y,4.43)],.029,m.dark,4)

    # A broad convex observation window and two small instrumentation ports.
    for x,z,r,front in [(-.10,2.79,1.06,-1.55),(-2.22,2.82,.51,-1.55),(2.06,2.72,.49,-1.55)]:
        m.ring((x,front-.21,z),r*.79,r,.19,m.edge,segments=12)
        m.ring((x,front-.42,z),r*.75,r*.84,.055,copper,segments=12)
        dome = []
        for radius,offset in [(.80,0),(.71,.18),(.46,.27),(.18,.30)]:
            dome.append([(x+r*radius*cos(a*tau/12),front-.44-r*offset,z+r*radius*sin(a*tau/12))
                         for a in range(12)])
        m.s.loft(dome,glass,[glass]*3)
        for side in (-1,1):
            m.pipe([(x+side*r*.48,front-.44,z+r*.80),(x+side*r*.69,front-.44,z+r*.68)],.033,m.signal,4)

    m.slab((.2,0),5.1,2.96,.74,.45,.75,m.stone)
    for x in (-3.62,3.35):
        for y in (-2.42,2.42):
            m.slab((x,y),.61,.68,0,.23,.23)
            m.pipe([(x,y,.16),(x*.93,y*.68,1.30),(x*.87,y*.47,1.75)],.24,m.body)
            m.pipe([(x-.51,y,.2),(x+.10,y*.74,1.08)],.093,m.edge,5)
    for y in (-2.41,2.41):
        m.pipe([(-4.2,y,1.29),(4.35,y,1.29)],.135,m.edge)
        for x in (-3.4,-1.7,0,1.7,3.4):
            m.pipe([(x-.34,y-.04,1.36),(x+.34,y-.04,1.36)],.046,m.signal,4)
    m.pipe([(-3.25,1.28,2.28),(-3.75,2.11,2.04),(-.75,2.10,1.97),(2.79,1.80,2.22)],.21,copper,8)
    m.pipe([(-2.9,1.03,3.66),(-3.27,1.07,4.58),(-3.14,1.1,5.04)],.083,m.body)
    m.pipe([(-3.14,1.1,5.04),(-3.14,1.1,5.31)],.071,m.signal,5)
    return m


def abyss_vent_reef():
    m = Landmark("Hydrothermal outcrop", "navy", "jade", "cyan", "obsidian", masonry=True)
    shell = paint("Sulfide chimney rim", (.195,.143,.070), .16,.69)
    mussel = paint("Blue mussel valves", (.042,.113,.152), .20,.39)
    polyp = paint("Cold-water anemone tips", (.205,.119,.092), .06,.55)
    weed = paint("Sea fan membranes", (.045,.171,.157), .06,.65)
    fan_stem = paint("Sea fan branch tips", (.12,.271,.216), .07,.68)
    rng = Random(131)
    for i,(x,y,rx,ry,height) in enumerate([(-3.0,.38,3.3,3.6,2.73),(1.1,1.4,3.55,3.1,3.01),
                                           (3.6,-.6,2.7,2.8,1.87),(-.2,-1.4,2.5,2.75,2.32)]):
        m.rock((x,y,0),(rx,ry),height,711+i,cap=m.body)
    for i,(x,y,z,height,radius) in enumerate([(-1.8,.73,1.3,3.7,.79),(-.75,1.02,1.5,2.74,.52),
                                               (-2.92,.59,1.3,1.94,.55),(1.34,1.92,1.5,2.1,.62),
                                               (2.03,1.54,1.5,3.02,.61),(2.43,2.0,1.5,1.7,.37)]):
        profile = [(x+dx*height,y-dx*.63,z+rise*height,radius*width,radius*width*.88)
                   for rise,width,dx in [(0,1.18,0),(.22,.90,.02),(.45,.60,-.04),(.68,.65,-.05),
                                         (.93,.43,.015),(1,.58,.035),(.99,.36,.035),(.74,.30,.018)]]
        m.s.lathe(profile,m.stone,9,ribs=4,relief=.22,bands=[m.body,m.stone,m.body,m.body,shell,shell,m.dark],phase=.47*i)
    for x,y,z,size in [(-4.33,-.73,1.65,1.26),(-3.66,-1.60,1.75,1.77),(.37,-1.82,1.67,1.56),
                       (1.62,-1.09,1.98,1.64),(3.69,-1.48,1.34,1.44)]:
        for j in range(5):
            side = (j-2)*.38
            h = size*(1-.135*abs(j-2))
            m.s.blade([(x,y,z,.025,.021),(x+side*.24,y+.12,z+h*.52,.12,.067),
                       (x+side*.69,y-.11,z+h*.86,.19,.06),(x+side,y-.30,z+h,.012,.012)],weed,fan_stem)
            if j%2==0:
                m.pipe([(x+side*.31,y-.01,z+h*.58),(x+side*.67+.20,y-.14,z+h*.86),
                        (x+side*.83+.25,y-.24,z+h*.98)],.024,fan_stem,4)
    for x,y,z in [(-2.85,-1.10,1.6),(-1.57,-1.14,1.82),(.4,-1.93,1.64),(3.38,-1.06,1.34)]:
        for j in range(5):
            cx,cy = x+rng.uniform(-.40,.40),y+rng.uniform(-.32,.32)
            rad = rng.uniform(.105,.19)
            m.s.lathe([(cx,cy,z,rad,rad*.65),(cx+.09,cy,z+.16,rad*.85,rad*.71),
                       (cx+.13,cy,z+.30,rad*.18,rad*.23)],mussel,5,bands=[mussel,polyp if j==0 else mussel])
    return m


def abyss_survey_rov():
    m = Landmark("Deepwater survey drone", "steel", "titanium", "amber", "navy")
    enamel = make_material("Safety orange composite", "copper", .23,.44,shade=1)
    lens = paint("Inspection camera glass", (.065,.19,.25), .32,.20,.33)
    m.slab((0,-.08),.99,.73,.43,.37,.28,enamel)
    m.slab((0,.03),.62,.58,.71,.43,.28,m.stone)
    for x in (-1.0,1.0):
        m.pipe([(x,-.93,.11),(x,-.54,.05),(x,.84,.05),(x,.99,.18)],.071,m.body)
        for y in (-.44,.47):
            m.pipe([(x,y,.05),(x*.91,y,.44),(x*.74,y,.73)],.063,m.body)
        sections = [(-.77,.20),(-.69,.30),(-.53,.31),(.43,.26),(.53,.20)]
        m.s.loft([[(x+r*cos(i*tau/10),y,.61+r*sin(i*tau/10)) for i in range(10)] for y,r in sections],
                 m.dark,[m.body,m.edge,m.body,m.dark])
        m.ring((x,.53,.61),.16,.21,.065,m.edge,segments=6)
        m.pipe([(x*.61,-.67,.82),(x*.61,-.91,.82)],.10,m.signal,8)
    m.pipe([(0,-.63,.60),(0,-.96,.58)],.20,m.dark,10)
    m.pipe([(0,-.94,.58),(0,-1.01,.58)],.14,lens,10)
    for y in (-.22,-.03,.16):
        m.pipe([(-.32,y,1.15),(.34,y,1.15)],.035,m.edge,4)
    m.pipe([(-.40,.32,1.07),(-.37,.32,1.30),(.40,.32,1.30),(.43,.32,1.07)],.061,enamel,6)
    m.pipe([(.69,-.49,.51),(.58,-1.04,.40),(.77,-1.27,.22)],.082,m.edge,6)
    for x in (.68,.86):
        m.pipe([(.77,-1.26,.22),(x,-1.39,.20),(x,-1.49,.20)],.037,m.stone,4)
    m.pipe([(.28,.56,.91),(.29,.71,1.28),(.29,.78,1.42)],.04,m.edge,5)
    m.pipe([(.29,.78,1.42),(.30,.85,1.46)],.048,m.signal,5)
    return m


def sanctuary_gate():
    m = Landmark("Ancient lens gate", "plum", "lilac", "cyan", "amethyst", masonry=True)
    for x in (-4.13,4.13):
        m.slab((x,0),1.66,2.35,0,.71,.47)
        m.slab((x,0),1.40,1.82,.68,1.15,.48)
        m.slab((x,0),1.21,1.49,1.80,1.46,.37,m.body)
        m.pipe([(x,-1.48,2.12),(x,-1.48,2.98)],.043,m.signal,4)
    m.ring((0,0,2.97),3.79,5.18,1.27,m.body,segments=16,start=.05,span=pi-.1,lights=True)
    m.ring((0,-1.38,2.97),4.80,5.09,.14,m.edge,segments=16,start=.05,span=pi-.1)
    return m


def reliquary():
    m = Landmark("Collimator reliquary", "amethyst", "lilac", "cyan", "plum", masonry=True)
    m.slab((0,0),3.86,2.73,0,.88,.73)
    m.slab((0,0),3.15,2.14,.85,.61,.48,m.body)
    for x in (-2.11,2.11):
        m.slab((x,.26),.77,1.07,1.45,2.98,.24,m.body)
        m.pipe([(x,-.79,2.31),(x,-.79,4.07)],.049,m.signal,4)
    m.ring((0,-.20,3.99),1.63,2.27,.55,m.body,segments=14,lights=True)
    m.ring((0,-.84,3.99),.97,1.28,.13,m.edge,segments=12)
    m.pipe([(0,-.20,2.08),(0,-.20,5.88)],.10,m.edge)
    m.pipe([(-1.8,-.27,4.12),(1.8,-.27,4.12)],.075,m.edge)
    return m


def sanctuary_terrace():
    m = Landmark("Sanctuary terrace", "plum", "amethyst", "cyan", "obsidian", masonry=True)
    for i,(x,y,rx,ry) in enumerate([(-2.7,.3,2.4,2.1),(0,.6,2.8,2.4),(2.9,.2,2.32,1.9)]):
        m.rock((x,y,0),(rx,ry),2.73+i*.25,205+i)
    m.slab((0,0),4.17,2.57,2.66,.61,.63,m.body)
    m.slab((0,0),3.81,2.34,3.23,.40,.54,m.body)
    for x in (-3.14,-1.04,1.04,3.14):
        m.slab((x,-2.18),.35,.23,2.65,.85,.14,m.edge)
    return m


def sanctuary_collimator():
    m = Landmark("Sanctuary collimator", "navy", "amethyst", "cyan", "plum", masonry=True)
    bronze = paint("Dark engraved bronze", (.23,.107,.060), .61,.38)
    glyph = paint("Etched copper inlay", (.39,.175,.068), .54,.31)
    lens_body = paint("Sanctuary active lens", (.022,.200,.269), .51,.11,.12)
    deep_glass = paint("Smoked edge glass", (.011,.055,.098), .32,.14)
    m.slab((0,0),4.3,2.72,0,.57,.68,m.stone)
    m.slab((0,0),3.81,2.34,.57,.60,.54,m.body)
    m.slab((0,0),3.19,1.90,1.16,.26,.42,m.dark)
    center = 4.09
    # Two tapering, counterweighted buttresses carry the cradles and lens.
    for side in (-1,1):
        for lane in (-.59,.66):
            outlines = [
                [(side*x,lane+y,z) for x,y,z in [(2.10,-.56,1.39),(3.49,-.46,1.39),(3.39,.53,1.39),(2.09,.64,1.39)]],
                [(side*x,lane+y,z) for x,y,z in [(2.53,-.48,2.33),(3.23,-.40,2.33),(3.18,.50,2.33),(2.50,.50,2.33)]],
                [(side*x,lane+y,z) for x,y,z in [(2.30,-.44,4.32),(2.85,-.37,4.32),(2.86,.40,4.32),(2.31,.43,4.32)]],
                [(side*x,lane+y,z) for x,y,z in [(1.97,-.36,5.28),(2.45,-.23,5.28),(2.42,.28,5.28),(1.94,.32,5.28)]]
            ]
            m.s.loft(outlines,m.dark,[m.stone,m.body,m.edge])
        m.pipe([(side*3.13,-1.08,1.65),(side*2.95,-1.06,2.82),(side*2.59,-1.01,4.12)],.063,glyph,5)
        m.pipe([(side*2.70,-1.05,2.04),(side*2.60,-1.032,2.91),(side*2.41,-1.0,4.16)],.042,m.signal,4)
    m.ring((0,.09,center),2.00,2.44,.44,m.body,segments=18,lights=True)
    m.ring((0,-.44,center),1.88,2.07,.17,bronze,segments=20)
    m.ring((0,-.635,center),1.83,1.88,.047,glyph,segments=20)
    radii = [(.33,1.70),(.08,1.86),(-.27,1.90),(-.54,1.80),(-.76,1.43),(-.86,.75),(-.90,.20)]
    face = [[(cos(i*tau/24)*r,y+r*sin(i*tau/24)*.19,center+r*sin(i*tau/24))
             for i in range(24)] for y,r in radii]
    m.s.loft(face,deep_glass,[deep_glass,bronze,deep_glass,lens_body,lens_body,lens_body])
    for i in range(12):
        a = i*tau/12
        m.pipe([(cos(a)*2.23,-.375,center+sin(a)*2.23),
                (cos(a)*2.32,-.418,center+sin(a)*2.32)],.034,glyph,4)
    for x in (-2.97,2.97):
        m.slab((x,-1.44),.45,.34,1.43,.34,.11,bronze)
        for z in (1.48,1.56,1.64):
            m.pipe([(x-.31,-1.77,z),(x+.32,-1.77,z)],.022,m.dark,4)
    return m


def sanctuary_broken_span():
    m = Landmark("Broken processional span", "plum", "titanium", "cyan", "obsidian", masonry=True)
    for i,(x,y,scale) in enumerate([(-4,.11,1),(-.73,.38,.93),(3.18,.22,.76)]):
        m.rock((x,y,0),(1.93,2.15),2.24*scale,138+i)
        m.slab((x,y),1.18,1.24,1.52*scale,.55,.28,m.body)
        for z in (2.03,2.70,3.36,4.02):
            m.slab((x,y),.79,.90,z*scale,.66*scale,.13,m.body)
        m.slab((x,y),1.01,1.12,4.65*scale,.30,.25,m.edge)
    m.ring((-2.36,.26,4.85),1.32,1.98,.68,m.body,segments=9,start=.02,span=pi-.11)
    m.ring((1.20,.24,4.47),1.45,2.12,.67,m.body,segments=3,start=.12,span=.91)
    m.ring((1.20,.24,4.47),1.45,2.12,.67,m.body,segments=2,start=2.42,span=.68)
    for i in range(4):
        m.rock((3.2+i*.52,.84+i*.38,0),(.91,1.07),1.64+i*.11,180+i)
    return m


def crystal_seam():
    m = Landmark("Amethyst seam", "plum", "amethyst", "lilac", "obsidian", masonry=True)
    quartz = make_material("Quartz tips", "lilac", .24, .24, .14, shade=1)
    flanks = make_material("Layered violet quartz", "amethyst", .33, .29)
    for i in range(5):
        x,y = (i-2)*1.79, .17*(i%3)
        m.rock((x,y,0),(1.72,1.87),2.80+i%3,42+i)
        for j in range(4):
            cx,cy = x+(j-1.5)*.51,y-1.08+.16*(j%2)
            z = 1.56+i%3*.44
            h = 1.02+.76*((j+i*3)%4)
            r = .19+(h*.11)
            m.s.lathe([(cx,cy,z,r*.72,r*.85), (cx+.18,cy-.16,z+h*.61,r,r*.90),
                       (cx+.26,cy-.29,z+h*.84,r*.71,r*.66),
                       (cx+.37,cy-.44,z+h,.021,.018)],m.stone,6,
                      bands=[flanks,m.glass,quartz],phase=.31*j)
    return m


def graving_dock():
    m = Landmark("Orbital graving dock", "navy", "titanium", "amber", "obsidian")
    for y in (-2.18,2.18):
        m.slab((0,y),7.19,1.22,0,.54,.68)
        for x in (-5.5,-1.87,1.87,5.5):
            m.slab((x,y),.94,1.12,.53,.84,.26)
            m.pipe([(x-.56,y-.95,.93),(x+.56,y-.95,.93)],.054,m.signal,4)
    for x in (-5.5,-1.87,1.87,5.5):
        m.pipe([(x,-2.18,1.17),(x,-1.61,3.63),(x,-.90,4.52),
                (x,.90,4.52),(x,1.61,3.63),(x,2.18,1.17)],.34,m.body,8)
        for y in (-1.66,1.66):
            m.pipe([(x-.51,y,2.55),(x+.51,y,2.55)],.19,m.edge)
    for y in (-1.61,1.61):
        m.pipe([(-6.2,y,3.66),(6.2,y,3.66)],.15)
        m.pipe([(-6.2,y,3.80),(6.2,y,3.80)],.035,m.signal,4)
    return m


def shipyard_transfer_dock():
    m = Landmark("Orbital freight terminal", "navy", "titanium", "amber", "obsidian")
    enamel = make_material("Dock ceramic shutters", "steel", .22,.50,shade=1)
    glass = paint("Freight control windows", (.022,.092,.142), .52,.24,.16)
    for y in (-2.22,2.22):
        m.slab((0,y),6.95,1.01,.50,.51,.49,m.stone)
        m.slab((0,y),6.65,.93,1.01,.21,.39,m.body)
        for x in (-5.30,-1.76,1.76,5.30):
            m.slab((x,y),.80,.94,0,.52,.37,m.dark)
            m.pipe([(x-.53,y-.88,.83),(x+.53,y-.88,.83)],.047,m.signal,4)
            m.pipe([(x,0,.22),(x,y*.58,.57),(x+.48,y,1.38)],.23,m.edge,5)
    for x in (-4.84,-1.56,1.72,4.80):
        for side in (-1,1):
            m.pipe([(x-.32,side*2.5,1.20),(x,side*2.31,2.83),
                    (x,side*1.54,3.69),(x,side*.96,3.77)],.25,m.body,6)
            m.slab((x,side*2.08),.47,.43,2.57,.52,.22,m.edge)
            m.pipe([(x-.22,side*2.52,2.72),(x+.22,side*2.52,2.72)],.041,m.signal,4)
        m.pipe([(x,-.97,3.75),(x,.97,3.75)],.20,enamel,6)
    for y in (-1.67,1.67):
        m.pipe([(-5.03,y,3.54),(4.88,y,3.54)],.135,m.edge)
        m.pipe([(-4.72,y,3.66),(4.56,y,3.66)],.033,m.signal,4)
    m.slab((-4.83,.71),1.44,1.02,3.76,.20,.21,m.body)
    m.slab((-4.83,.71),1.18,.77,3.96,.77,.26,enamel)
    m.slab((-4.83,-.087),.93,.083,4.22,.33,.069,glass)
    m.slab((-4.74,.77),1.21,.87,4.69,.18,.24,m.edge)
    m.pipe([(-4.60,1.26,4.82),(-4.53,1.26,5.61),(-4.03,1.26,5.96)],.060)
    m.pipe([(-4.05,1.26,5.94),(-3.91,1.26,6.04)],.075,m.signal,6)
    for x in (-2.8,-.88,1.16,3.43):
        m.slab((x,1.95),.66,.57,1.23,.66,.20,enamel)
        m.pipe([(x-.32,1.34,1.56),(x+.32,1.34,1.56)],.036,m.signal,4)
    return m


def shipyard_cargo_tug():
    m = Landmark("Orbital cargo tug", "navy", "titanium", "amber", "obsidian")
    glass = paint("Tug cockpit canopy", (.022,.117,.176), .49,.21,.10)
    drive = paint("Tug ion thrusters", (.044,.35,.54), .22,.24,1.9)
    dr = [(1.54,.78,.32),(1.18,1.07,.53),(.12,1.03,.54),(-.82,.76,.68),(-1.67,.25,.41),(-1.93,.08,.21)]
    m.s.loft([[(w*cos(i*tau/10),y,.65+h*sin(i*tau/10)) for i in range(10)] for y,w,h in dr],
             m.dark,[m.edge,m.body,m.edge,m.body,m.edge])
    m.s.blade([(0,.74,1.00,.29,.14),(0,.23,1.12,.48,.26),
               (0,-.40,1.19,.39,.18),(0,-1.11,.99,.15,.04)],glass,m.body)
    for side in (-1,1):
        m.s.blade([(0,.77,.63,.23,.14),(side*1.00,1.01,.57,.42,.18),
                   (side*1.75,1.28,.47,.22,.10),(side*1.96,1.40,.42,.02,.01)],m.edge,m.dark)
        x=side*1.05
        m.pipe([(x,.36,.57),(x,.70,.57),(x,1.35,.57)],.29,m.body,8)
        m.pipe([(x,1.27,.57),(x,1.57,.57)],.22,m.edge,8)
        m.pipe([(x,1.54,.57),(x,1.63,.57)],.155,drive,8)
        m.pipe([(x*.73,-.47,.70),(x*.80,-.15,.71)],.040,m.signal,4)
        m.pipe([(side*.97,1.18,.72),(side*1.13,1.14,1.19)],.07,m.edge,5)
    return m


def forge_furnace_bank():
    m = Landmark("Spectral foundry hearth", "graphite", "copper", "amber", "obsidian")
    enamel = make_material("Heat resistant ceramic", "bronze", .28,.57,shade=-1)
    fire = paint("Furnace refractory throat", (.66,.176,.025), .06,.64,.92)
    m.slab((0,0),5.80,3.31,0,.42,.72,m.stone)
    for x in (-3.55,3.55):
        for y in (-2.56,2.32):
            m.slab((x,y),.91,.59,.38,.62,.29,m.dark)
            m.pipe([(x,y,.79),(x*.94,y*.96,2.48),(x*.67,y*.74,4.67)],.31,m.body,6)
    shell = [(-1.80,1.25),(-1.68,1.98),(-.86,2.18),(1.02,2.18),(1.45,1.83),(1.83,1.29)]
    m.s.loft([[(r*cos(i*tau/16),y,3.01+r*sin(i*tau/16)) for i in range(16)] for y,r in shell],
             m.dark,[m.edge,m.body,m.stone,m.body,m.edge])
    m.ring((0,-1.86,3.01),.92,1.63,.22,m.edge,segments=12)
    m.ring((0,-2.08,3.01),.72,1.15,.07,fire,segments=12)
    m.ring((0,-1.95,3.01),.41,.74,.06,enamel,segments=10)
    for x in (-1.29,1.29):
        m.pipe([(x,-1.48,1.55),(x*1.52,-1.99,1.19),(x*2.13,-2.43,.94)],.19,m.edge)
    for x in (-3.64,3.64):
        m.s.lathe([(x,.67,.55,.77,.78),(x,.67,.79,.89,.85),(x,.67,2.16,.77,.76),
                   (x,.67,2.57,.64,.63),(x,.67,4.39,.57,.56),(x,.67,4.64,.73,.70),
                   (x,.67,4.87,.62,.61),(x,.67,4.82,.45,.44),(x,.64,4.33,.42,.40)],
                  m.stone,11,bands=[m.edge,m.body,enamel,m.body,m.edge,m.body,enamel,m.dark])
        m.pipe([(x,.24,3.60),(x,-.84,3.64),(x*.76,-1.52,4.20),(x*.47,-1.25,4.24)],.20,m.body)
    for y in (-2.78,2.73):
        m.pipe([(-5.02,y,.78),(4.98,y,.78)],.089,m.edge)
        for x in (-4.4,-2.2,2.13,4.4):
            m.pipe([(x-.35,y-.04,.87),(x+.35,y-.04,.87)],.044,m.signal,4)
    return m


def forge_casting_line():
    m = Landmark("Lava foundry ingot line", "graphite", "copper", "amber", "obsidian")
    hot = paint("Foundry flowing metal", (.50,.12,.020), .07,.42,1.14)
    lining = make_material("Casting slag liner", "bronze", .16,.72,shade=-2)
    for x in (-3.10,0,3.10):
        m.slab((x,0),1.34,2.14,0,.41,.43,m.stone)
        for y in (-1.60,1.60):
            m.pipe([(x,y,.28),(x+.19,y*.76,1.52),(x-.38,y*.90,2.18)],.20,m.body,6)
    for y in (-1.81,1.81):
        m.slab((0,y),5.32,.39,2.01,.42,.28,m.body)
        m.pipe([(-4.99,y,2.48),(4.90,y,2.48)],.103,m.edge,5)
    for i,x in enumerate((-3.96,-2.02,-.08,1.86,3.8)):
        low = .50+.12*i
        m.slab((x,0),.86,1.33,2.21,.47+low,.29,m.stone)
        m.slab((x,0),.77,1.23,2.68+low,.20,.32,lining)
        m.slab((x,0),.62,.98,2.86+low,.083,.30,hot if i<3 else m.edge)
        for y in (-1.22,1.22):
            m.pipe([(x-.50,y,2.92+low),(x+.50,y,2.92+low)],.061,m.edge,5)
    for y in (-2.27,2.27):
        for x in (-4.57,-1.54,1.47,4.56):
            m.pipe([(x,y,2.19),(x,y,3.29)],.041,m.edge,5)
        m.pipe([(-4.65,y,3.31),(4.61,y,3.31)],.052,m.edge,5)
    m.slab((-4.14,0),1.08,1.20,3.53,.61,.37,m.body)
    m.pipe([(-4.90,0,4.09),(-5.38,0,4.34),(-5.69,.03,4.34)],.16,m.edge)
    return m


def grotto_pump_causeway():
    m = Landmark("Grotto intake gallery", "navy", "titanium", "cyan", "obsidian")
    for x in (-3.7,-1.37,1.12,3.54):
        m.slab((x,0),.60,1.22,0,.43,.31,m.stone)
        m.slab((x,0),.48,.77,.42,.97,.22,m.body)
        m.pipe([(x,.79,.36),(x+.52,.52,1.60)],.108,m.edge,5)
    m.slab((0,0),4.74,1.34,1.47,.37,.44,m.body)
    for y in (-1.27,1.27):
        for x in (-4.09,-2.11,0,2.11,4.09):
            m.pipe([(x,y,1.79),(x,y,2.58)],.042,m.edge,5)
        m.pipe([(-4.19,y,2.60),(4.19,y,2.60)],.043,m.edge,5)
    for x in (-3.27,0,3.19):
        m.pipe([(x,-1.26,1.67),(x+.55,-1.26,1.67)],.037,m.signal,4)
    m.slab((-2.42,.33),1.05,.81,1.84,.38,.29,m.stone)
    m.ring((-2.42,-.03,2.83),.28,.75,.23,m.edge,segments=10,lights=True)
    m.pipe([(-2.42,.25,2.81),(-1.63,.71,2.82),(1.17,.71,2.82),(1.43,.71,2.18)],.145,m.body)
    m.pipe([(-2.45,-.28,2.81),(-2.45,-1.67,2.81),(-2.41,-1.97,1.79),(-2.41,-1.97,.61)],.12,m.body)
    return m


def support_frame(materials, masonry):
    m = Landmark(*materials, masonry=masonry)
    m.slab((0,0),9.59,9.59,4.68,.49,.77,m.body)
    m.slab((0,0),8.91,8.91,3.76,.99,.77,m.stone)
    for angle in (0,pi/2,pi,3*pi/2):
        def face(x,y,z):
            return (x*cos(angle)-y*sin(angle),x*sin(angle)+y*cos(angle),z)
        for x in (-7.24,0,7.24):
            rings = [[face(x-w,y-d,z),face(x+w,y-d,z),face(x+w,y+d,z),face(x-w,y+d,z)]
                     for w,d,y,z in [(1.1,1.24,-7.89,0),(1.17,1.28,-7.90,.35),
                                     (.72,1.12,-8.12,1.23),(.63,.79,-8.64,3.2),
                                     (1.28,.94,-8.31,4.84)]]
            m.s.loft(rings,m.dark,[m.edge,m.stone,m.body,m.edge])
        for x in (-3.62,3.62):
            m.pipe([face(x-2.6,-8.94,4.27),face(x+2.6,-8.94,4.27)],.084,m.edge,4)
            if masonry:
                path = [face(x+2.85*cos(i*pi/10),-8.52,1.39+2.79*sin(i*pi/10)) for i in range(11)]
                m.pipe(path,.43,m.body,5)
                m.pipe([(px,py,pz+.10) for px,py,pz in path],.13,m.edge,4)
            else:
                for direction in (-1,1):
                    m.pipe([face(x+direction*2.65,-8.41,.75),face(x+direction*.31,-8.83,2.05),
                            face(x-direction*2.65,-8.71,4.02)],.31,m.body)
                m.pipe([face(x-.61,-9.04,4.45),face(x+.61,-9.04,4.45)],.057,m.signal,4)
    return m


def alloy_support():
    return support_frame(("Service deck truss","navy","steel","cyan","obsidian"),False)


def stone_support():
    return support_frame(("Stone arcade foundations","amethyst","lilac","amber","plum"),True)


BUILDERS = {
    "heliostat-aqueduct": aqueduct, "heliostat-orchard": orchard,
    "heliostat-garden-spring": garden_spring,
    "frost-escarpment": glacier, "frost-traverser": polar_station,
    "frost-optical-lab": frost_optical_lab, "frost-icefall": frost_icefall,
    "frost-radiometer": frost_radiometer, "frost-ridge": frost_ridge,
    "forge-smelter": smelter, "forge-basalt": basalt_basin,
    "abyss-habitat": bathysphere, "abyss-reef": reef,
    "abyss-observatory": abyss_observatory, "abyss-vent-reef": abyss_vent_reef,
    "abyss-survey-rov": abyss_survey_rov,
    "sanctuary-gate": sanctuary_gate, "sanctuary-reliquary": reliquary,
    "sanctuary-terrace": sanctuary_terrace,
    "sanctuary-collimator": sanctuary_collimator, "sanctuary-broken-span": sanctuary_broken_span,
    "grotto-crystal-seam": crystal_seam, "shipyard-graving-dock": graving_dock,
    "shipyard-transfer-dock": shipyard_transfer_dock, "shipyard-cargo-tug": shipyard_cargo_tug,
    "forge-furnace-bank": forge_furnace_bank, "forge-casting-line": forge_casting_line,
    "grotto-pump-causeway": grotto_pump_causeway,
    "biome-deck-truss": alloy_support, "biome-deck-arcade": stone_support,
}

LANDMARK_BUDGETS = {
    "abyss-observatory": 3700, "abyss-vent-reef": 3000, "abyss-survey-rov": 1200,
    "frost-optical-lab": 3200, "frost-icefall": 2400, "frost-radiometer": 1800, "frost-ridge": 480,
    "shipyard-transfer-dock": 3800, "shipyard-cargo-tug": 1400,
    "forge-furnace-bank": 3800, "forge-casting-line": 3000, "grotto-pump-causeway": 1800,
}


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    names = [arg for arg in args if arg != "--preview"] or BUILDERS
    folder = MODELS/"scenery"
    bpy.context.preferences.filepaths.save_version = 0
    for name in names:
        reset_scene()
        sculpture = BUILDERS[name]().s
        floor = min(vertex[2] for vertex in sculpture.vertices)
        sculpture.vertices = [(x,y,z-floor) for x,y,z in sculpture.vertices]
        model = sculpture.object(name)
        finish_surface(model,reach=.72)
        export_model(model,LANDMARK_BUDGETS.get(name,4900),folder)
        bpy.ops.wm.save_as_mainfile(filepath=str(folder/(name+".blend")),compress=True)
        if "--preview" in args:
            render("scenery/"+name,model=model)
