"""Orbital station kit. Run from a clean Blender background session."""
from math import cos, sin, pi, tau
from pathlib import Path
from random import Random
import sys
import bpy

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from tools.blender.style import Sculpture, make_material, plate, reset_scene, export_model

reset_scene()
folder = ROOT / "assets/models/benchmark"
ink = make_material("Carbon recess", "obsidian", .39, .54)
hull = make_material("Midnight hull", "navy", .57, .38)
titanium = make_material("Machined rim", "titanium", .67, .32)
steel = make_material("Satellite blue", "steel", .48, .46)
tile = make_material("Satin deck", "titanium", .38, .60, shade=-1)
amber = make_material("Amber navigation glass", "amber", .18, .25, 3.1)
ice = make_material("Aperture glass", "cyan", .20, .28, 1.2)
basalt = make_material("Basalt shade", "graphite", .07, .88)
strata = make_material("Slate cleavage", "steel", .08, .84, shade=-1)
moss = make_material("Lichen", "olive", .04, .87, shade=-1)
leaf = make_material("Silver sage", "olive", .06, .72)
slate = make_material("Graphitic facets", "navy", .17, .72, shade=-1)
malachite = make_material("Mineral skin", "jade", .21, .44)
models = []

def finish(sculpt, name, budget):
    model = sculpt.object(name)
    export_model(model, budget, folder)
    models.append(model)

def panel(s, rings, mat, sides=None):
    plate(s, rings, mat, sides)

def strip(s, side, u, ingot, mat):
    """Sidewall extruded around the platform, u runs around its perimeter."""
    c, d = cos(side*pi/2), sin(side*pi/2)
    rings = [[((x+u)*c-r*d, (x+u)*d+r*c, z) for x,z in profile] for r,profile in ingot]
    s.loft(rings, mat)

def frame():
    s = Sculpture()
    panel(s, [(8.85,8.85,.57,0),(9.13,9.13,.62,.20),(9.37,9.37,.62,2.69),
              (9.98,9.98,.55,2.91),(10.10,10.10,.55,3.32),(9.99,9.99,.52,3.50)],
          ink,[steel,hull,ink,hull,titanium])
    panel(s, [(9.91,9.91,.53,3.48),(9.91,9.91,.53,3.507)], steel)
    # The playing fields share one material draw and follow the exact 1.30 m pitch.
    for j in range(15):
        for i in range(15):
            plate(s,[(.649,.649,.012,3.508),(.645,.645,.010,3.530)],
                  tile,[tile],center=((i-7)*1.30,(j-7)*1.30))
    for side in range(4):
        for k in range(5):
            u=(k-2)*3.60
            bay=[(-1.72,.58),(1.43,.58),(1.71,.88),(1.71,2.50),(-1.39,2.50),(-1.72,2.20)]
            strip(s,side,u,[(9.24,bay),(9.42,bay)],ink)
            vent=[(-1.38,.88),(1.22,.88),(1.41,1.08),(1.41,2.13),(-1.19,2.13),(-1.38,1.94)]
            strip(s,side,u,[(9.42,vent),(9.46,vent)],steel)
            brace=[(-1.80,.16),(-1.54,.16),(-.63,2.53),(-.97,2.62)]
            strip(s,side,u,[(9.41,brace),(9.66,brace)],hull)
            light=[(-.53,3.025),(.48,3.025),(.56,3.123),(-.48,3.123)]
            strip(s,side,u,[(10.024,light),(10.078,light)],amber)
    finish(s,"station-deck",9000)

def annulus(s, a, b, slices, profile, materials):
    start=len(s.vertices)
    for i in range(slices+1):
        t=a+(b-a)*i/slices
        s.vertices.extend((r*cos(t),r*sin(t),z) for r,z in profile)
    n=len(profile)
    for i in range(slices):
        for j in range(n):
            k=(j+1)%n
            p=start+i*n
            s.face((p+j,p+n+j,p+n+k,p+k),materials[j])
    s.face(tuple(range(start,start+n)),materials[0])
    s.face(tuple(reversed(range(start+slices*n,start+(slices+1)*n))),materials[0])

def relay():
    s=Sculpture()
    prof=[(4.13,3.42),(4.49,3.51),(4.60,3.69),(4.56,4.05),(4.34,4.16),(3.70,4.11),(3.63,3.72)]
    for i in range(16):
        a=i*tau/16
        annulus(s,a+.007,a+tau/16-.007,4,prof,[ink,steel,hull,titanium,steel,hull,ink])
        annulus(s,a+.055,a+.31,3,[(4.592,3.75),(4.599,3.75),(4.599,3.81),(4.592,3.81)],[amber]*4)
        if i%2==0:
            s.cable([(cos(a)*r,sin(a)*r,z,w) for r,z,w in [(.55,3.16,.17),(2.5,3.42,.115),(3.91,3.78,.14)]],steel,5)
    profile=[(0,.03),(.69,.18),(.95,1.19),(1.80,1.52),(2.95,1.30),(3.10,.87),(3.49,.99),
             (3.62,1.24),(3.86,1.24),(3.99,.91),(4.97,.70),(5.23,.44),(6.05,.34),(6.23,.16),(7.15,.053)]
    s.lathe([(0,0,z,r,r) for z,r in profile],hull,12,bands=[ink,hull,steel,hull,ink,steel,titanium,
             hull,titanium,steel,hull,steel,titanium,amber])
    for i in range(6):
        a=i*tau/6
        s.cable([(r*cos(a),r*sin(a),z,w) for r,z,w in [(1.03,1.57,.07),(1.03,2.62,.085),(.70,4.83,.047)]],amber,4)
    finish(s,"relay-crown",4000)

def portal():
    s=Sculpture()
    for side in [-1,1]:
        plate(s,[(.7,.86,.18,0),(.82,.94,.19,.23),(.73,.82,.16,.62)],hull,[steel,hull],center=(side*2.74,0))
    path=[(-2.74,.43),(-2.74,2.30),(-1.58,3.69),(-.83,3.99),(.83,3.99),(1.58,3.69),(2.74,2.30),(2.74,.43)]
    for i,((x,z),(xx,zz)) in enumerate(zip(path,path[1:])):
        dx,dz=xx-x,zz-z
        length=(dx*dx+dz*dz)**.5
        nx,nz=-dz/length,dx/length
        def slice_at(t):
            return [(x+dx*t+nx*w,y,z+dz*t+nz*w) for w,y in
                    [(-.24,-.30),(-.16,-.42),(.18,-.42),(.29,-.27),(.29,.27),(.17,.42),(-.15,.42),(-.24,.30)]]
        s.loft([slice_at(-.025),slice_at(1.025)],hull)
        s.loft([slice_at(.035),slice_at(.074)],steel)
        if i in (1,3,5):
            s.cable([(x+dx*t+nx*.04,-.432,z+dz*t+nz*.04,.043) for t in (.22,.80)],amber,5)
    finish(s,"transfer-arch",800)

def escarpment():
    s=Sculpture()
    rng=Random(8391)
    # Offset successive fractures; exposed shoulders catch the blue rim light.
    for k in range(19):
        x,y=rng.uniform(-3.7,3.7),rng.uniform(-1.8,1.8)
        h=2.6+rng.random()*1.65-.065*x*x
        r=rng.uniform(.72,1.58)
        outline=[(cos(tau*i/7)*rng.uniform(.80,1.13),sin(tau*i/7)*rng.uniform(.82,1.2)) for i in range(7)]
        tips=[rng.random()*.42 for _ in outline]
        rings=[[(x+u*r*scale+dx,y+v*r*scale+.13*sin(i+theta),z+tilt*t) for i,((u,v),t) in enumerate(zip(outline,tips))]
               for scale,z,dx,tilt,theta in [(.68,0,.20,0,0),(.99,h*.44,.07,.4,.9),
                                             (1.03,h*.73,0,.65,-.7),(.89,h*.94,-.09,1,.32),(.71,h,-.21,1,.35)]]
        base=len(s.vertices)
        for ring in rings:
            s.vertices.extend(ring)
        s.face(tuple(reversed(range(base,base+7))),basalt)
        for row in range(4):
            for n in range(7):
                a=base+row*7+n
                b=base+row*7+(n+1)%7
                s.face((a,b,b+7),rng.choice([basalt,basalt,slate,strata]))
                s.face((a,b+7,a+7),rng.choice([basalt,slate,strata]))
        s.face(tuple(range(base+28,base+35)),strata)
        if k%3==0:
            crown=[(x+(a-x)*.68,y+(b-y)*.56,c+.029) for a,b,c in rings[-1]]
            s.loft([[(a,b,c-.06) for a,b,c in crown],crown],moss)
            for j in range(8):
                a=j*2.399
                u,v=x+.25*cos(a),y+.21*sin(a)
                z=sum(p[2] for p in crown)/7
                length=rng.uniform(.25,.51)
                s.blade([(u,v,z,.017,.014),(u+.18*cos(a),v+.18*sin(a),z+length*.78,.073,.028),
                         (u+length*cos(a),v+length*sin(a),z+length,.008,.008)],leaf,moss)
    for cx,cy in [(-2.8,-.97),(1.66,-1.32),(2.43,.91)]:
        for j in range(7):
            a=j*2.39
            x,y=cx+.32*cos(a),cy+.24*sin(a)
            r=rng.uniform(.085,.20)
            h=rng.uniform(.53,1.24)
            z=3.32
            s.lathe([(x,y,z,r*.63,r*.63),(x+.12*cos(a),y+.12*sin(a),z+h*.73,r,r),
                     (x+.25*cos(a),y+.22*sin(a),z+h,.016,.016)],malachite,5,bands=[malachite,ice])
    finish(s,"mineral-shelf",4400)

def asteroid():
    s=Sculpture()
    s.loft([[((1+.18*sin(i*13+z))*r*cos(i*tau/7+twist),.70*r*sin(i*tau/7+twist),z+(.10*r*sin(i*3) if z else 0))
              for i in range(7)] for r,z,twist in [(.28,0,0),(.89,.24,.32),(1.02,.74,0),(.62,1.08,.43),(.26,1.20,.22)]],
           basalt,[basalt,slate,basalt,strata])
    finish(s,"belt-fragment",160)

frame()
relay()
portal()
escarpment()
asteroid()
# Keep editable meshes together in a laid-out Blender kit. GLBs have local origins.
for model,x in zip(models,(0,19,30,41,49)):
    model.location.x=x
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(folder/"orbital-kit.blend"),compress=True)
