"""Orbital station kit. Run from a clean Blender background session."""
from math import cos, sin, pi, tau
from pathlib import Path
import sys
import bpy

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from tools.blender.style import Sculpture, make_material, plate, reset_scene, export_model, export
from tools.blender.orbital_finish import finish_surface

reset_scene()
folder = ROOT / "assets/models/benchmark"
station_edition = "--station" in sys.argv
if station_edition:
    folder = folder / "station"
ink = make_material("Carbon recess", "obsidian", .39, .54)
hull = make_material("Midnight hull", "navy", .57, .38)
titanium = make_material("Machined rim", "titanium", .67, .32)
steel = make_material("Satellite blue", "steel", .48, .46)
tile = make_material("Satin deck", "titanium", .38, .60, shade=-1)
amber = make_material("Amber navigation glass", "amber", .18, .25, 3.1)
ice = make_material("Aperture glass", "cyan", .20, .28, 1.2)
basalt = make_material("Basalt shade", "graphite", .07, .88)
strata = make_material("Slate cleavage", "steel", .08, .84, shade=-1)
slate = make_material("Graphitic facets", "navy", .17, .72, shade=-1)
models = []

def finish(sculpt, name, budget):
    model = sculpt.object(name)
    finish_surface(model,reach=.95)
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
        if station_edition:
            # A recessed expansion coupling anchors each outer corner.
            # It lives on the fascia, outside both the tiles and the collector.
            for sign in (-1,1):
                shoe=[(-.43,2.44),(.20,2.44),(.43,2.73),(.38,3.18),(-.27,3.18),(-.45,2.95)]
                for radius,scale,material in [(9.87,1,hull),(9.98,.86,steel),(10.042,.65,titanium)]:
                    cheek=[(x*scale,2.84+(z-2.84)*scale) for x,z in shoe]
                    strip(s,side,sign*9.13,[(radius,cheek),(radius+.085,cheek)],material)
        for k in range(5):
            u=(k-2)*3.60
            bay=[(-1.72,.58),(1.43,.58),(1.71,.88),(1.71,2.50),(-1.39,2.50),(-1.72,2.20)]
            strip(s,side,u,[(9.24,bay),(9.42,bay)],ink)
            vent=[(-1.38,.88),(1.22,.88),(1.41,1.08),(1.41,2.13),(-1.19,2.13),(-1.38,1.94)]
            strip(s,side,u,[(9.42,vent),(9.46,vent)],hull)
            brace=[(-1.80,.16),(-1.54,.16),(-.63,2.53),(-.97,2.62)]
            strip(s,side,u,[(9.41,brace),(9.66,brace)],hull)
            for z in (1.12,1.33,1.54,1.75):
                slat=[(-.94,z),(.81,z),(.95,z+.09),(-.84,z+.09)]
                strip(s,side,u,[(9.46,slat),(9.51,slat)],steel)
            if station_edition:
                # Herringbone service cheeks end in a bright, cut metal tip.
                cheek=[(-1.68,2.66),(-1.12,2.66),(-.76,2.47),(-1.33,2.47)]
                strip(s,side,u,[(9.49,cheek),(9.69,cheek)],titanium)
                for pos in (-1.42,1.42):
                    lock=[(pos-.09,.58),(pos+.09,.58),(pos+.075,.81),(pos-.075,.81)]
                    strip(s,side,u,[(9.43,lock),(9.56,lock)],steel)
            light=[(-.53,3.025),(.48,3.025),(.56,3.123),(-.48,3.123)]
            strip(s,side,u,[(10.024,light),(10.078,light)],amber)
    finish(s,"station-deck",11800)

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

def solar_wings(s, copper):
    """Two opposed wings share a torque tube. Local X is the actual hinge axis."""
    cell = make_material("Blue silicon", "steel", .52, .23)
    coating=cell.node_tree.nodes.get("Principled BSDF")
    coating.inputs["Base Color"].default_value=(.035,.079,.171,1)
    coating.inputs["Coat Weight"].default_value=.56
    coating.inputs["Coat Roughness"].default_value=.17
    bus = make_material("Solar busbars", "bronze", .70, .32, shade=1)
    for side in (-1,1):
        s.cable([(side*x,0,0,r) for x,r in [(1.12,.126),(1.45,.13),(1.57,.085),(5.46,.054)]],titanium,8)
        for j in range(4):
            cx=side*(2.02+j*1.06)
            # Raised frames, paired cell strings and hinge gaps read across the full span.
            half_span=(.69,.84,.84,.71)[j]
            tip_cut=.17 if j in (0,3) else .08
            plate(s,[(.485,half_span-.015,tip_cut,-.065),(.504,half_span,tip_cut,-.026),(.49,half_span-.014,tip_cut,.024)],
                  ink,[steel,copper],center=(cx,0))
            for k in (-1,1):
                span=(half_span-.10)*.5
                plate(s,[(.468,span,tip_cut*.69,.024),(.464,span-.005,tip_cut*.66,.045)],
                      hull,[cell],center=(cx,k*(span+.041)))
                for h in (-1,1):
                    plate(s,[(.009,span-.015,.005,.045),(.008,span-.02,.004,.048)],
                          bus,[bus],center=(cx+h*.196,k*(span+.041)))
            # On the unlit face two diagonals tie each frame into the axle.
            for k in (-1,1):
                s.cable([(cx-side*.43,k*(half_span-.13),-.082,.033),
                         (cx+side*.27,k*.12,-.125,.045)],steel,5)

def finish_relay(hub, ring, wings, height):
    core=hub.object("Relay core")
    rotor=ring.object("Habitat rotor")
    array=wings.object("Sun tracker")
    array.location.z=height
    assembly=bpy.data.objects.new("Relay crown",None)
    bpy.context.collection.objects.link(assembly)
    parts=[core,rotor,array]
    triangles=0
    for obj in parts:
        obj.parent=assembly
        finish_surface(obj,reach=.45)
        obj.data.calc_loop_triangles()
        triangles+=len(obj.data.loop_triangles)
    if triangles>7800:
        raise ValueError(f"relay-crown: {triangles}/7800 triangles")
    export("relay-crown",[assembly,*parts],folder)
    models.append(assembly)
    print(f"ASSET relay-crown · {triangles}/7800 triangles")

def relay():
    s=Sculpture()
    prof=[(4.13,3.42),(4.49,3.51),(4.60,3.69),(4.56,4.05),(4.34,4.16),(3.70,4.11),(3.63,3.72)]
    for i in range(16):
        a=i*tau/16
        annulus(s,a+.007,a+tau/16-.007,4,prof,[ink,steel,hull,titanium,steel,hull,ink])
        annulus(s,a+.055,a+.31,3,[(4.592,3.75),(4.599,3.75),(4.599,3.81),(4.592,3.81)],[amber]*4)
        if i%4==0:
            # Enclosed galleries taper to the hub; lower forks carry the ring load.
            def spoke(rad,width,z):
                return [(rad*cos(a)-dy*sin(a),rad*sin(a)+dy*cos(a),z+dz)
                        for dy,dz in [(-width,-.12),(-width*.82,.08),(width*.82,.08),(width,-.12),(width*.77,-.34),(-width*.72,-.34)]]
            s.loft([spoke(r,w,z) for r,w,z in [(1.0,.37,3.23),(2.18,.24,3.68),(3.65,.38,3.90),(4.1,.51,3.95)]],steel,[hull,steel,hull])
            for h in (-.16,.16):
                s.cable([(cos(a)*r-sin(a)*h,sin(a)*r+cos(a)*h,z,w) for r,z,w in
                         [(.81,1.91,.10),(1.9,2.25,.075),(3.91,3.59,.068)]],titanium,6)
        if i%2==0:
            annulus(s,a+.04,a+.32,4,[(3.78,4.09),(3.82,4.23),(4.19,4.28),(4.29,4.17)],
                    [ink,steel,titanium,hull])
            for j in range(3):
                offset=a+.095+j*.07
                annulus(s,offset,offset+.028,2,[(4.57,3.91),(4.579,3.91),(4.579,3.96),(4.57,3.96)],[ice]*4)
    if station_edition:
        copper=make_material("Brushed copper coping","copper",.68,.31)
        enamel=make_material("Pressure hull ceramic","ceramic",.34,.38)
        # Asymmetric observation galleries break the repeating rim silhouette.
        for a,span in [(1.20,.56),(3.92,.35),(5.37,.39)]:
            annulus(s,a,a+span,8,[(3.90,4.07),(4.52,4.00),(4.83,4.17),(4.80,4.40),
                                  (4.52,4.57),(4.04,4.49)],
                    [ink,copper,hull,steel,enamel,titanium])
            for i in range(4):
                lo=a+.032+i*(span-.052)/4
                annulus(s,lo,lo+(span-.052)/4-.018,2,
                        [(4.813,4.23),(4.83,4.24),(4.814,4.354),(4.797,4.35)],[ink,ice,steel,hull])
        # Bearings are coaxial with the four spokes and the lower support forks.
        for z,r in [(1.91,1.57),(3.17,1.30)]:
            annulus(s,0,tau,24,[(r-.13,z-.13),(r+.04,z-.11),(r+.04,z+.08),(r-.13,z+.13)],
                    [ink,copper,titanium,hull])
        ring=s
        s=Sculpture()
    profile=[(0,.03),(.69,.18),(.95,1.19),(1.80,1.52),(2.95,1.30),(3.10,.87),(3.49,.99),
            (3.62,1.24),(3.86,1.24),(3.99,.91),(4.97,.70),(5.23,.44),(6.05,.34),(6.23,.16),(7.15,.053)]
    s.lathe([(0,0,z,r,r) for z,r in profile],hull,12,bands=[ink,hull,steel,hull,ink,steel,titanium,
             hull,titanium,steel,hull,steel,titanium,steel if station_edition else amber])
    if station_edition:
        for i in range(8):
            a=i*tau/8
            # Glazed control room between two continuous pressure collars.
            annulus(s,a+.025,a+.75,5,[(.78,4.45),(.93,4.54),(.89,4.90),(.73,4.96)],
                    [titanium,hull,steel,ink])
            annulus(s,a+.10,a+.62,4,[(.916,4.64),(.913,4.74),(.915,4.76),(.929,4.65)],
                    [ice,hull,steel,hull])
            if i%2==0:
                s.cable([(r*cos(a),r*sin(a),z,w) for r,z,w in
                    [(.43,5.16,.112),(.53,5.68,.073),(.55,6.62,.030),(.55,6.78,.022)]],titanium,6)
        hinge=5.50
        for side in (-1,1):
            s.cable([(side*x,0,z,r) for x,z,r in [(.43,4.99,.17),(.88,5.12,.13),(1.08,hinge,.14),
                                                   (1.24,hinge,.14)]],steel,8)
            s.cable([(side*1.09,0,hinge,.185),(side*1.18,0,hinge,.18)],copper,10)
        wings=Sculpture()
        solar_wings(wings,copper)
    for i in range(6):
        a=i*tau/6
        s.cable([(r*cos(a),r*sin(a),z,w) for r,z,w in [(1.03,1.57,.07),(1.03,2.62,.085),(.70,4.83,.047)]],amber,4)
    # Radiator sails flank the communications mast at three unequal heights.
    for i,(a,h) in enumerate([(.24,6.41),(2.48,5.64),(4.67,5.23)]):
        s.cable([(r*cos(a),r*sin(a),z,w) for r,z,w in [(.84,3.76,.20),(.80,4.75,.15),(.56,h,.045)]],hull,6)
    if station_edition:
        finish_relay(s,ring,wings,hinge)
    else:
        finish(s,"relay-crown",7800)

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

def drydock():
    """Cantilevered repair quay with twin guide rails and inset landing lights."""
    s=Sculpture()
    panel(s,[(4.19,1.73,.63,0),(4.46,1.89,.56,.22),(4.78,1.98,.48,1.46),
             (4.87,2.05,.47,1.60),(4.73,2.00,.47,1.73)],ink,[hull,ink,steel,titanium])
    for x in (-3.09,-1.54,0,1.54,3.09):
        plate(s,[(.74,1.83,.13,1.72),(.71,1.79,.13,1.77)],steel,[hull],center=(x,0))
        for side in (-1,1):
            s.cable([(x-.48,side*1.70,1.781,.025),(x+.26,side*1.70,1.781,.025)],amber,5)
    for side in (-1,1):
        for x in (-2.75,0,2.75):
            section=[(-.83,.26),(-.49,.21),(.80,1.28),(.80,1.48),(.40,1.48)]
            s.loft([[(x+u,side*r,z) for u,z in section] for r in (1.90,2.14)],hull)
        for y in (.95,1.16):
            plate(s,[(4.01,.049,.023,1.77),(3.96,.038,.019,1.83)],titanium,[steel],center=(0,side*y))
    finish(s,"transfer-quay",2100)

def asteroid():
    s=Sculpture()
    if station_edition:
        # Uneven strata and an actual recessed impact basin in the upper shell.
        outline=[(1.09,.0),(.93,.51),(.78,1.04),(.96,1.62),(1.16,2.17),(.78,2.72),
                 (.94,3.24),(1.18,3.80),(.81,4.27),(.89,4.82),(1.08,5.43),(.92,5.98)]
        rings=[]
        for r,z,dx,dy,turn in [(.37,.0,0,0,.0),(.94,.24,0,0,.12),(1.02,.56,.02,0,.08),
                (.96,.78,.10,.04,.02),(.58,1.03,.17,.06,0),(.35,1.06,.20,.09,.07),(.18,.91,.17,.06,.11)]:
            rings.append([(dx+1.15*r*w*cos(a+turn),dy+.72*r*w*sin(a+turn),
                           z+(.062*sin(a*3.1) if z else 0)) for w,a in outline])
        s.loft(rings,slate,[basalt,slate,strata,basalt,strata,basalt])
        # Break the lathed outline with a chipped spur and an inclined rift.
        s.loft([[(x+u*r,y+v*r,z+dz) for u,v,dz in [
            (-.39,-.16,.01),(.15,-.23,.04),(.37,.04,.02),(.08,.29,0),(-.33,.16,.04)]]
            for x,y,z,r in [(-.74,.18,.30,.77),(-.90,.22,.48,.95),(-.89,.20,.68,.46)]],
            basalt,[slate,strata])
        finish(s,"belt-fragment",190)
        return
    s.loft([[((1+.18*sin(i*13+z))*r*cos(i*tau/7+twist),.70*r*sin(i*tau/7+twist),z+(.10*r*sin(i*3) if z else 0))
              for i in range(7)] for r,z,twist in [(.28,0,0),(.89,.24,.32),(1.02,.74,0),(.62,1.08,.43),(.26,1.20,.22)]],
           basalt,[basalt,slate,basalt,strata])
    finish(s,"belt-fragment",160)

frame()
relay()
if not station_edition:
    portal()
    drydock()
asteroid()
# Keep editable meshes together in a laid-out Blender kit. GLBs have local origins.
for model,x in zip(models,(0,19,30,41,49)):
    model.location.x=x
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(folder/"orbital-kit.blend"),compress=True)
