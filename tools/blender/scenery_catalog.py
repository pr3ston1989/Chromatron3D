"""Reusable modeled landmarks, structural modules and terrain silhouettes."""
from math import cos, pi, sin, tau
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from tools.blender.style import MODELS, Sculpture, export_model, make_material
from tools.blender.style import plate, render, reset_scene, rotation_from_profile
from tools.blender.grotto_formations import FORMATIONS, produce_formation

OUT = MODELS / "scenery"


def finishes(hull="navy", accent="copper"):
    return {
        "dark": make_material("Deep joints", hull, .18, .78, shade=-2),
        "body": make_material("Structural shell", hull, .31, .57),
        "edge": make_material("Keyed chamfers", hull, .25, .47, shade=1),
        "trim": make_material("Inset fittings", accent, .43, .47),
        "panel": make_material("Raised service face", accent, .32, .51, shade=1),
        "cyan": make_material("Damped indicator", "cyan", .18, .52, .37, shade=-1),
        "amber": make_material("Warm status marker", "amber", .22, .48, .34, shade=-1),
    }


def curve(s, m, radius, z, pitches, width, thick, *, oval=1, inlay=True):
    """Machined arc segments with a stepped inner lip, in Blender X–Z."""
    section = [(radius-thick*.46,-width*.61),(radius-thick*.62,-width*.13),
               (radius-thick*.62,width*.44),(radius-thick*.40,width),
               (radius+thick*.40,width),(radius+thick*.63,width*.48),
               (radius+thick*.63,-width*.46),(radius+thick*.34,-width)]
    for lo,hi in pitches:
        def at(r,y,a):
            return (cos(a)*r*oval,y,z+sin(a)*r)
        steps = [lo+(hi-lo)*i/3 for i in range(4)]
        s.loft([[at(r,y,a) for r,y in section] for a in steps],
               m["dark"],[m["edge"],m["body"],m["body"]])
        if inlay:
            rim = radius + thick*.36
            s.loft([[at(r,y,a) for r,y in [(rim-.15,-width),
                       (rim-.09,-width-.065),(rim+.06,-width*.93),
                       (rim+.065,-width*.84)]] for a in steps],
                   m["trim"])


def arc(s,m,variant):
    if variant=="observatory":
        pitches = [(a*pi/180,b*pi/180) for a,b in
                   [(11,34),(35,58),(59,81),(87,111),(112,138),(139,169)]]
        radius,height,oval = 5.25,.35,1
    elif variant=="garden":
        pitches = [(t*pi/180,(t+21)*pi/180) for t in range(10,158,22)]
        radius,height,oval = 3.75,.40,1.08
    else:
        pitches = [(lo*pi/180,hi*pi/180) for lo,hi in ((12,49),(50,89),(91,130),(131,168))]
        radius,height,oval = 5.80,.40,.94
    curve(s,m,radius,height,pitches,.62,.83,oval=oval)
    for x in (-radius*oval*.91,radius*oval*.91):
        plate(s,[(1.14,1.08,.245,0),(1.22,1.08,.17,.21),(.96,.91,.22,.39),
                 (.79,.73,.18,1.16),(.67,.63,.19,1.34)],m["dark"],
              [m["body"],m["edge"],m["body"],m["trim"]],(x,0))
        plate(s,[(.41,.34,.08,1.32),(.51,.38,.07,1.67)],m["dark"],[m["body"]],(x,0))
    for a in (pi*.17,pi*.31,pi*.65,pi*.78):
        r = radius - .25
        s.cable([(cos(a)*r*oval,-.658,height+sin(a)*r,.035),
                 (cos(a)*(r+.38)*oval,-.668,height+sin(a)*(r+.38),.038)],
                 m["cyan"] if variant=="observatory" else m["trim"],4)


def lens_base(s,m,garden=False):
    plate(s,[(2.70,1.71,.52,0),(2.86,1.88,.50,.23),(2.82,1.85,.49,.43),
             (2.40,1.55,.48,.72),(1.41,1.07,.25,.98)],
          m["dark"],[m["body"],m["edge"],m["body"],m["edge"]])
    for sign in (-1,1):
        s.blade([(sign*.80,-.49,.70,.40,.23),(sign*1.42,-.17,1.49,.39,.37),
                 (sign*1.82,.09,2.18,.29,.28),(sign*1.90,.10,2.33,.24,.21)],
                m["body"],m["trim"])
        s.cable([(sign*1.67,0,2.33,.32),(sign*1.93,0,2.33,.36),
                 (sign*2.18,0,2.33,.24)],m["edge"],8)
    if garden:
        curve(s,m,1.89,2.33,[(i*tau/6,(i+.987)*tau/6) for i in range(6)],
              .19,.27,oval=1.0)
        lens_surface(s,make_material("Patinated glass", "jade", .43, .34),2.33,1.75)


def lens_surface(s,mat,height,radius):
    points = [(radius*cos(i*tau/10),-.08,height+radius*sin(i*tau/10)) for i in range(10)]
    s.loft([points,[(x*.79,-.31,height+(z-height)*.79) for x,_,z in points]],mat)


def iris(s,m):
    # The pivot is 2.01m above base once placed in the lens support.
    r,h = 1.77,2.01
    curve(s,m,r,h,[(i*tau/5,(i+.990)*tau/5) for i in range(5)],.27,.34)
    lens_surface(s,make_material("Polarized violet glass", "steel", .42, .27, .12,shade=1),h,1.54)
    for a in (-.63,1.50,3.59):
        # Three centered metal blades read as a closed aperture from far away.
        path = [(cos(a)*1.56,-.36,h+sin(a)*1.56,.069),
                (cos(a+.34)*.80,-.42,h+sin(a+.34)*.80,.077),
                (cos(a+.82)*.24,-.44,h+sin(a+.82)*.24,.030)]
        s.cable(path,m["trim"],4)


def skyline(s,m,rock):
    edge = [(-14,-1.4),(-11,-2.3),(-8,-2.1),(-3,-2.6),(1,-1.5),(6,-2.4),
            (12,-1.9),(14,1.6),(10,2.3),(4,2.6),(-4,2),(-11,1.7)]
    crest = [1.1,2.4,1.8,3.1,2.5,3.6,1.9,1.1,3.2,3.8,4.0,2.9]
    s.loft([[(x*.88,y*1.26,0) for x,y in edge],
            [(x,y,z*.41) for (x,y),z in zip(edge,crest)],
            [(x*.91,y*.66,z) for (x,y),z in zip(edge,crest)],
            [(x*.72,y*.33,z+.20) for (x,y),z in zip(edge,crest)]],
           m["dark"],[m["dark"],m["body"],m["edge"] if rock else m["body"]])


def crystals(s,m,variant):
    prism = [(-3.8,-1.4,1.53,4.5),(-1.4,-.85,1.72,6.1),
             (1.3,.24,1.28,3.7),(3.32,-.40,1.1,2.8),(.4,1.52,1.7,4.85)]
    for i,(x,y,r,h) in enumerate(prism):
        drift = (-1 if i%2 else 1)*(.48+(i%3)*.22)
        s.lathe([(x,y,0,r*.83,r*.83),(x,y,.66,r,r*.86,.12),
                 (x+drift*.38,y+.17,h*.78,r*.78,r*.72,.31),
                 (x+drift,y+.06,h,r*.14,r*.19,.45)],m["dark"],6,
                bands=[m["dark"],m["body"],m["trim"] if i in (1,4) else m["edge"]])
    if variant=="frost":
        for x in (-3,3):
            plate(s,[(1.4,.90,.18,0),(1.32,.81,.24,.29),(.95,.72,.21,.53)],
                  m["dark"],[m["body"],m["edge"]],(x,-1.3))


def relay(s,m):
    plate(s,[(1.35,1.15,.35,0),(1.59,1.08,.25,.28),(.97,.73,.29,1.29),
             (.92,.69,.30,4.74),(.84,.67,.24,5.21)],
          m["dark"],[m["body"],m["edge"],m["body"],m["trim"]])
    plate(s,[(3.48,.68,.24,4.15),(3.62,.82,.36,4.37),(3.39,.72,.36,4.72),
             (3.14,.73,.27,4.82)],m["dark"],[m["body"],m["trim"],m["edge"]])
    for x in (-1.93,1.93):
        s.blade([(x,-.01,4.68,.66,.065),(x*1.22,.38,4.73,.48,.11),
                 (x*1.36,1.16,4.78,.28,.06)],m["body"],m["edge"])
        s.cable([(x-.23,-.69,4.45,.034),(x+.38,-.68,4.46,.034)],m["amber"],4)
    s.cable([(0,0,5.17,.17),(0,0,5.73,.11),(.04,-.08,6.53,.046)],m["edge"],6)


def dock(s,m):
    plate(s,[(2.1,1.34,.30,0),(2.24,1.44,.45,.25),(2.71,1.63,.45,.59),
             (3.05,1.77,.52,.88),(2.91,1.62,.45,1.04)],m["dark"],
          [m["body"],m["edge"],m["body"],m["trim"]])
    for x in (-1.95,1.95):
        s.blade([(x,-.88,.84,.22,.06),(x,.26,1.26,.30,.24),
                 (x,.94,1.58,.27,.21),(x,.99,2.16,.12,.11)],m["body"],m["edge"])
        s.cable([(x-.36,-.95,1,.034),(x+.36,-.94,1,.034)],m["amber"],4)


def observatory_landing(s,m):
    plate(s,[(5.84,1.72,.87,0),(6.42,1.82,.71,.26),(6.77,2.14,.92,.76),
             (6.53,2.00,.81,1.03),(6.05,1.81,.69,1.33)],
          m["dark"],[m["dark"],m["body"],m["edge"],m["body"]])
    for x in (-4.7,4.7):
        plate(s,[(1.03,1.04,.22,1.26),(1.19,1.12,.28,1.36),
                 (1.14,.99,.24,1.45)],m["body"],[m["trim"],m["edge"]],(x,0))
    for x in (-3.1,0,3.1):
        s.blade([(x-1.04,-2.04,.79,.089,.037),(x-.53,-2.115,.83,.138,.052),
                 (x+.70,-2.045,.80,.095,.043)],m["dark"],m["trim"])
    s.cable([(-2.3,-1.84,1.11,.025),(-.84,-1.89,1.11,.028),
             (.72,-1.88,1.11,.028),(2.27,-1.84,1.11,.023)],m["cyan"],4)


def shipyard_rib(s,m):
    # Two splayed structural arms and a heavy upper chord leave open bays.
    outlines = [
        [(-8,0),(-5.4,0),(5.1,12.6),(4.7,14.2),(2.9,14.2),(-8,1.25)],
        [(-1.8,0),(.7,0),(12.1,13.0),(11.5,14.2),(9.8,14.2),(-1.8,1.1)],
        [(-10.5,6.0),(-10.5,7.3),(13,14.7),(13,13.2),(8.8,11.1),(-9.1,5.75)],
    ]
    for outline in outlines:
        cx=sum(x for x,_ in outline)/len(outline)
        cz=sum(z for _,z in outline)/len(outline)
        inset=[(cx+(x-cx)*.966,cz+(z-cz)*.968) for x,z in outline]
        s.loft([[(x,y,z) for x,z in ring]
                for ring,y in zip((outline,outline,inset),(.83,-.82,-1.04))],
               m["dark"],[m["body"],m["edge"]])
    for x,z,k in ((-6.5,6.22,1),(-2.7,7.37,1),(2.77,3.98,2)):
        h=.42 if k==1 else 1.85
        lamp=[(x,z),(x+1.26,z+h),(x+1.20,z+h+.11),(x-.06,z+.11)]
        rotation_from_profile(s,lamp,[-1.035,-1.07],0,m["amber"])
    for x,z in ((-5.8,2.30),(.78,2.65),(-2.7,6.42)):
        plate_edge=[(x,z),(x+.31,z),(x+2.7,z+3.33),(x+2.49,z+3.35)]
        rotation_from_profile(s,plate_edge,[-.824,-.865],0,m["dark"])


def shipyard_platform(s,m):
    # Long narrow berth and an asymmetrical crane/relay tower.
    plate(s,[(1.20,1.01,.23,0),(1.48,1.14,.29,.35),
             (.87,.73,.24,7.6),(.69,.62,.16,8.45)],m["dark"],
          [m["body"],m["body"],m["edge"]],(4.1,0))
    plate(s,[(7.06,1.26,.38,7.72),(7.38,1.44,.39,8.0),
             (7.72,1.52,.38,8.34),(7.64,1.41,.32,8.59)],
          m["dark"],[m["body"],m["body"],m["edge"]])
    plate(s,[(1.31,.98,.20,8.45),(1.23,.91,.20,8.83),(.91,.76,.15,10.77),
             (.62,.50,.16,12.19),(.44,.38,.10,12.43)],
          m["dark"],[m["body"],m["edge"],m["body"],m["edge"]],(4.15,.09))
    s.cable([(4.15,.10,12.33,.10),(4.15,.10,13.22,.072),(4.16,.10,14.03,.036)],m["trim"],5)
    for x,h in ((-5.62,.55),(-3.48,.69),(.62,.4),(6.44,.71)):
        plate(s,[(.82,.82,.24,8.57),(.79,.80,.20,8.73),(.68,.65,.21,8.62+h)],
              m["dark"],[m["body"],m["edge"]],(x,.18))
    for x in (1.07,4.48):
        s.cable([(x,-.52,5.45,.17),(x-1.78,-.52,6.48,.15),(x-2.56,-.62,7.93,.22)],
                m["dark"],5)
    for y in (-1.04,1.04):
        s.cable([(-6.95,y,8.72,.041),(-1.22,y,8.80,.041),(6.95,y,8.73,.041)],
                m["panel"],4)
    for x in (-5.84,-2.70,.52,3.72,6.51):
        rotation_from_profile(s,[(x-.55,8.29),(x+.55,8.29),(x+.55,8.39),(x-.55,8.39)],
                              [-1.47,-1.54],0,m["amber"])
    rotation_from_profile(s,[(3.91,4.01),(4.03,4.12),(4.02,7.12),(3.88,7.16)],
                          [-.78,-.87],0,m["amber"])


def service_support(s,m,corner):
    wh,d,h = (.305,.305,1.18) if corner else (.18,.25,.78)
    plate(s,[(wh*.89,d,.075,0),(wh,d,.085,.084),
             (wh,d,.095,h*.38),(wh*.74,d*.81,.08,h*.50),
             (wh*.83,d*.88,.083,h*.86),(wh*.72,d*.72,.071,h)],
          m["dark"],[m["body"],m["body"],m["edge"],m["body"],m["trim"]])
    s.cable([(-wh*.45,-d*.84,h*.48,.030),(wh*.48,-d*.84,h*.48,.030)],m["dark"],5)


def flora(s,m):
    for i,(x,y,z,sway) in enumerate([(-.43,-.06,.65,-.28),(.30,.03,.79,.31),(0,.12,.92,.10),(-.09,-.34,.56,.14)]):
        s.blade([(.04*i,0,.02,.049,.026),(x*.51,y*.64,z*.43,.081,.07),
                 (x,y,z,.023,.033),(x+sway,y+.09,z*.81,.008,.015)],
                m["body"] if i%2 else m["edge"],m["trim"])
    plate(s,[(.38,.32,.16,0),(.43,.34,.14,.16),(.32,.27,.09,.23)],m["dark"],
          [m["body"],m["trim"]])


def rock(s,m,variant):
    height,r = {"scrap":(.25,.32),"ice":(.75,.21),"crystal":(.70,.28),
                "asteroid":(1.54,.90),"moss":(.39,.37)}[variant]
    for i,(x,y,size) in enumerate([(0,0,1),(-r*.73,r*.31,.62),(r*.53,-r*.46,.46)]):
        radius = size*r
        skew = (-1 if i==1 else 1)*radius*.45
        s.lathe([(x,y,0,radius*.76,radius*.83),(x,y,height*.17*size,radius,radius*.84,.24),
                 (x+skew*.30,y+r*.05,height*.69*size,radius*.82,radius*.70,.49),
                 (x+skew,y+.03,height*size,radius*.22,radius*.25,.85)],
                m["dark"],6,2,.14,bands=[m["dark"],m["body"],m["trim"] if i==0 else m["edge"]])


def signal_mast(s,m):
    plate(s,[(.19,.19,.055,0),(.215,.213,.05,.055),(.185,.17,.067,.101),
             (.112,.117,.025,.15)],m["dark"],[m["body"],m["edge"],m["body"]])
    s.cable([(0,.019,.137,.066),(0,.017,.39,.048),(.046,.008,.60,.050)],m["edge"],6)
    s.lathe([(.047,.007,.54,.051,.049),(.047,.007,.57,.115,.103),
             (.048,.022,.61,.165,.119),(.043,.028,.651,.191,.131)],
             m["body"],8,bands=[m["dark"],m["body"],m["trim"]])
    s.cable([(.04,.015,.60,.025),(.04,.004,.695,.027),(.041,0,.730,.014)],m["cyan"],5)


def rig(s,m,variant):
    plate(s,[(2.04,1.3,.23,0),(2.17,1.48,.31,.16),(2.08,1.41,.33,.34),
             (1.95,1.23,.36,.53)],m["dark"],[m["body"],m["edge"],m["body"]])
    for x in (-1.32,1.32):
        plate(s,[(.31,.31,.06,.50),(.28,.27,.05,.69),(.21,.24,.06,2.52),
                 (.14,.18,.044,2.73)],m["dark"],[m["edge"],m["body"],m["trim"]],(x,.28))
    if variant=="crane":
        s.blade([(-1.42,.28,2.59,.26,.16),(0,.28,2.72,.26,.24),
                 (1.46,.27,2.67,.24,.19),(2.40,.25,2.21,.17,.15)],m["body"],m["trim"])
        s.cable([(2.34,.25,2.31,.15),(2.29,.24,1.84,.11),(2.36,.25,1.50,.29)],m["edge"],8)
        s.cable([(2.30,.24,1.51,.13),(2.32,.24,1.40,.072)],m["amber"],6)
    else:
        if variant=="observing":
            s.lathe([(0,.24,2.29,.43,.42),(0,.24,2.42,.62,.55),
                     (.02,.19,2.54,.79,.74),(.02,.16,2.69,1.05,.88)],
                    m["dark"],10,bands=[m["edge"],m["body"],m["trim"]])
            s.cable([(.02,.16,2.68,.078),(-.04,.21,3.15,.065),
                     (-.10,.275,3.3,.091)],m["cyan"],6)
        else:
            s.cable([(-1.33,.27,2.61,.16),(0,.20,2.71,.21),(1.33,.26,2.62,.16)],m["body"],6)
            s.lathe([(0,.20,2.55,.29,.27),(0,.20,2.70,.33,.31),(0,.20,2.86,.25,.24)],
                    m["dark"],8,bands=[m["trim"],m["edge"]])
            for i in range(3):
                a=i*tau/3
                s.blade([(.05*cos(a),.18+.05*sin(a),2.66,.13,.11),
                         (.77*cos(a),.18+.77*sin(a),2.76,.23,.14),
                         (1.15*cos(a+.21),.18+1.15*sin(a+.21),2.64,.08,.06)],
                        m["edge"],m["trim"])


def reactor(s,m):
    plate(s,[(2.8,2.0,.48,0),(3.0,2.2,.42,.28),(2.69,2.06,.47,.47),
             (2.36,1.61,.51,.69)],m["dark"],[m["body"],m["edge"],m["trim"]])
    curve(s,m,2.22,2.62,[(i*tau/6,(i+.94)*tau/6) for i in range(6)],.41,.52)
    s.lathe([(0,0,.54,.39,.39),(0,0,1.2,.78,.71,.11),
             (0,0,2.79,.91,.72,.24),(.14,.1,3.59,.24,.20,.54)],
            m["dark"],7,bands=[m["body"],m["cyan"],m["edge"]])


def habitat(s,m):
    plate(s,[(4.28,2.84,.76,0),(4.60,2.93,.78,.28),(4.54,2.84,.81,.59),
             (4.22,2.57,.82,.84)],m["dark"],[m["body"],m["edge"],m["body"]])
    for y in (-1.58,0,1.58):
        frame = Sculpture()
        curve(frame,m,3.0,.62,[(0,pi*.25),(pi*.25,pi*.5),(pi*.5,pi*.75),(pi*.75,pi)],
              .12,.22,inlay=False,oval=1.43)
        i = len(s.vertices)
        s.vertices.extend((x,py+y,z) for x,py,z in frame.vertices)
        for face,slot in zip(frame.faces,frame.finishes):
            s.face(tuple(i+v for v in face),frame.palette[slot])
    cover = make_material("Reflective greenhouse cladding","jade",.37,.36,shade=-1)
    rows = []
    for y in (-1.49,1.49):
        rows.append([(4.19*cos(a*pi/12),y,.62+2.68*sin(a*pi/12)) for a in range(13)])
    s.loft(rows,cover)


SPECS = {
    "observatory-arc": (arc,"observatory","navy","copper",2000),
    "observatory-lens": (lens_base,False,"navy","copper",1500),
    "observatory-iris": (iris,None,"steel","copper",600),
    "observatory-landing": (observatory_landing,None,"navy","copper",600),
    "skyline-ridge": (skyline,False,"navy","steel",2000),
    "grotto-ridge": (skyline,True,"plum","amethyst",2000),
    "frost-spires": (crystals,"frost","steel","titanium",1500),
    "garden-arcade": (arc,"garden","bronze","limestone",1500),
    "garden-heliostat": (lens_base,True,"bronze","jade",1500),
    "garden-terrace": (skyline,True,"olive","jade",1500),
    "garden-fern": (flora,None,"olive","jade",300),
    "dock-gantry": (arc,"dock","graphite","titanium",2000),
    "dock-relay": (relay,None,"graphite","steel",1500),
    "dock-landing": (dock,None,"graphite","steel",600),
    "shipyard-rib": (shipyard_rib,None,"graphite","steel",1500),
    "shipyard-platform": (shipyard_platform,None,"navy","steel",1500),
    "perimeter-corner": (service_support,True,"navy","titanium",180),
    "perimeter-brace": (service_support,False,"navy","titanium",180),
    "ring-reactor": (reactor,None,"plum","amethyst",2000),
    "greenhouse-habitat": (habitat,None,"olive","jade",1500),
    "maintenance-crane": (rig,"crane","graphite","copper",600),
    "wind-turbine": (rig,"wind","jade","bronze",600),
    "tracking-dish": (rig,"observing","steel","titanium",600),
    "survey-mast": (signal_mast,None,"steel","titanium",300),
    "reclaimed-metal": (rock,"scrap","graphite","titanium",300),
    "ice-shard": (rock,"ice","steel","titanium",300),
    "amethyst-shard": (rock,"crystal","plum","amethyst",300),
    "basalt-remnant": (rock,"asteroid","graphite","steel",300),
    "moss-cover": (rock,"moss","olive","jade",300),
}


def produce(name):
    if name in FORMATIONS:
        return produce_formation(name, OUT)
    reset_scene()
    build,argument,hull,accent,budget = SPECS[name]
    shape,materials = Sculpture(),finishes(hull,accent)
    if argument is None:
        build(shape,materials)
    else:
        build(shape,materials,argument)
    if name=="observatory-iris":
        lower = min(z for _,_,z in shape.vertices)
        shape.vertices = [(x,y,z-lower) for x,y,z in shape.vertices]
    model = shape.object(name)
    export_model(model,budget,OUT)
    render("scenery/"+name,(-1.5,-1.7,.81),model=model)


if __name__ == "__main__":
    requested = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [*SPECS, *FORMATIONS]
    for name in requested:
        produce(name)
