"""Model the campaign landmarks, bake contact shading and export Blender sources and GLBs."""
from math import cos, pi, sin, tau
from pathlib import Path
from random import Random
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.style import MODELS, Sculpture, export_model, make_material, plate, render, reset_scene
from tools.blender.orbital_finish import finish_surface


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
    "frost-escarpment": glacier, "frost-traverser": polar_station,
    "forge-smelter": smelter, "forge-basalt": basalt_basin,
    "abyss-habitat": bathysphere, "abyss-reef": reef,
    "sanctuary-gate": sanctuary_gate, "sanctuary-reliquary": reliquary,
    "sanctuary-terrace": sanctuary_terrace,
    "grotto-crystal-seam": crystal_seam, "shipyard-graving-dock": graving_dock,
    "biome-deck-truss": alloy_support, "biome-deck-arcade": stone_support,
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
        export_model(model,4900,folder)
        bpy.ops.wm.save_as_mainfile(filepath=str(folder/(name+".blend")),compress=True)
        if "--preview" in args:
            render("scenery/"+name,model=model)
