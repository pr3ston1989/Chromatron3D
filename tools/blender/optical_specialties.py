"""Heads for the complete instrument bench. +Y is forward; Z=.78 is the optical axis."""
from functools import partial
from math import cos, pi, sin, tau
from tools.blender.style import plate


def add_specialties(builders, mount, sleeve, section, materials):
    ink, body, steel, alloy, porcelain, copper, glass, violet = materials

    def iris(s, axis, xyz, radius, depth, outer, inner, sides=16):
        sleeve(s,axis,xyz,[(-depth,.79*radius),(-depth,radius*.91),(-depth*.65,radius),
              (depth*.63,radius),(depth,radius*.90),(depth,radius*.67),
              (depth*.62,radius*.61),(-depth*.60,radius*.61)],
              [steel,alloy,outer,outer,alloy,inner,inner,ink],sides)

    def conduit(s):
        mount(s)
        for y in (-.31,.31):
            iris(s,"Y",(0,y,.78),.327,.09,porcelain,steel,8)
            for side in (-1,1):
                s.cable([(side*.21,y,.21,.067),(side*.27,y,.36,.078),(side*.23,y,.59,.053)],body,7)
        for i in range(4):
            a=pi*.25+i*pi/2
            s.cable([(.27*cos(a),y,.78+.27*sin(a),w) for y,w in
                     [(-.29,.042),(-.18,.034),(.18,.034),(.29,.042)]],copper,7)
        # A split ceramic spine ties the square entrance collars together.
        for sign in (-1,1):
            s.blade([(sign*x,y,z,w,h) for x,y,z,w,h in [
                (.21,-.29,.986,.055,.023),(.14,-.17,1.072,.071,.037),
                (.14,.16,1.072,.071,.037),(.21,.29,.986,.055,.023)]],porcelain,steel)

    def waveguide(s,kind):
        mount(s)
        if kind=="doppler":
            for x,r,material in [(-.31,.18,alloy),(-.09,.25,copper),(.15,.32,violet),(.32,.39,body)]:
                iris(s,"X",(x,0,.78),r,.046,material,glass,12)
                s.cable([(x,0,.22,.06),(x,0,.80-r,.052)],steel,8)
            for side in (-1,1):
                s.cable([(-.34,side*.10,.68,.027),(-.17,side*.19,.60,.030),
                         (.12,side*.23,.53,.032),(.30,side*.218,.47,.024)],porcelain,7)
        elif kind=="tangler":
            iris(s,"X",(-.19,0,.78),.32,.073,violet,glass,10)
            for y in (-.26,.26):
                iris(s,"Y",(.11,y,.78),.226,.072,copper,glass,10)
                s.cable([(.08,y*.80,.21,.074),(.11,y,.57,.052)],body,8)
            s.cable([(-.19,0,.22,.064),(-.19,0,.50,.060)],alloy,8)
            for side in (-1,1):
                s.blade([(-.17,side*.15,1.04,.040,.024),(-.04,side*.21,.987,.057,.037),
                         (.11,side*.26,.956,.038,.027)],porcelain,copper)
        else:
            mobile=kind=="mobileTeleporter"
            iris(s,"Z",(0,0,.79),.42,.073,copper if mobile else alloy,violet,12)
            for i in range(3):
                a=i*tau/3
                s.blade([(r*cos(a+tw),r*sin(a+tw),z,w,h) for r,tw,z,w,h in [
                    (.38,.0,.21,.062,.04),(.42,.14,.39,.079,.055),
                    (.34,.34,.65,.050,.047),(.35,.39,.80,.039,.032)]],body,alloy)
                if mobile:
                    s.cable([(.32*cos(a),.32*sin(a),.13,.057),(.48*cos(a),.48*sin(a),.09,.058)],copper,6)
                # Raised pole shoes straddle the horizontal field coil.
                s.blade([(r*cos(a+t),r*sin(a+t),z,w,h) for r,t,z,w,h in [
                    (.404,0,.742,.048,.029),(.438,.135,.813,.056,.038),
                    (.411,.28,.874,.04,.024)]],porcelain,steel)
            if not mobile:
                iris(s,"Z",(0,0,.37),.26,.045,body,violet,10)
            else:
                # A second, tilted traveller coil gives the mobile portal
                # an unmistakable silhouette above its three landing shoes.
                iris(s,"X",(0,0,.81),.30,.042,copper,glass,10)

    def radial(s,kind):
        mount(s,True)
        count,curve={"starburst":(8,0),"twister":(3,1.03),"quadBender":(4,-.56),
                     "multiFilter":(4,.09),"complementor":(4,0)}[kind]
        s.lathe([(0,0,z,r,r) for z,r in [(.20,.19),(.27,.272),(.33,.22),(.66,.14),(.77,.24),(.87,.19)]],
                ink,8,bands=[steel,alloy,body,steel,violet if kind=="complementor" else glass])
        for i in range(count):
            a=i*tau/count
            if kind in ("starburst","complementor"):
                def nozzle(distance, radius):
                    return [(distance*cos(a)-radius*sin(t*tau/8)*sin(a),
                             distance*sin(a)+radius*sin(t*tau/8)*cos(a),
                             .78+radius*cos(t*tau/8)) for t in range(8)]
                s.loft([nozzle(r,w) for r,w in [(.13,.083),(.25,.090),(.32,.115),(.45,.083),(.46,.063)]],
                       steel,[body,copper,violet if kind=="complementor" else steel,glass])
            else:
                path=[(.16,.0,.32,.074,.040),(.32,.22,.46,.089,.069),
                      (.39,.66,.67,.092,.070),(.39,1,.89,.067,.049),(.32,1.2,.97,.033,.028)]
                coat=(violet,glass,porcelain,copper)[i%4] if kind=="multiFilter" else (steel if kind=="twister" else glass)
                s.blade([(r*cos(a+curve*t),r*sin(a+curve*t),z,w,h) for r,t,z,w,h in path],coat,copper)
        if kind=="complementor":
            iris(s,"Z",(0,0,.92),.178,.04,violet,alloy,8)
        else:
            # Each free-standing head shows its own section from overhead.
            sides={"starburst":8,"twister":3,"quadBender":4,"multiFilter":4}[kind]
            s.lathe([(0,0,z,r,r) for z,r in [(.852,.154),(.889,.17),(.918,.131),(.926,.091)]],
                    ink,sides,bands=[steel,porcelain,violet if kind=="multiFilter" else alloy],phase=pi/sides)

    def gate(s,primary):
        mount(s)
        for sign in (-1,1):
            path=[(sign*.30,-.32,.78,.104),(sign*.23,-.22,.78,.13),
                  (sign*.136,-.09,.77,.12),(0,.06,.78,.123)]
            s.cable(path,steel if sign>0 else copper,10)
            s.cable([(sign*.25,-.18,.22,.08),(sign*.23,-.21,.63,.064)],body,7)
        iris(s,"Y",(0,.28,.78),.188,.144,porcelain,glass,12)
        for sign in (-1,1):
            iris(s,"Y",(sign*.285,-.291,.78),.139,.038,copper,alloy,10)
        s.lathe([(0,.017,z,r,r) for z,r in [(.31,.114),(.57,.17),(.76,.217),(.94,.190),(1.07,.084)]],
                body,3 if primary else 6,bands=[steel,body,violet if primary else glass,alloy],phase=pi/6)
        if primary:
            for i,coat in enumerate((copper,glass,violet)):
                x=(i-1)*.153
                section(s,[(-.060,.84),(.060,.84),(.064,1.13),(.024,1.22),(-.060,1.16)],
                        [(x-.042,1),(x+.042,1)],"X",0,[coat])

    def dual(s):
        mount(s)
        face=[(-.39,-.11),(-.26,-.23),(.27,-.23),(.40,-.09),(.40,.12),(.26,.23),(-.26,.23),(-.39,.11)]
        for sign in (-1,1):
            section(s,face,[(sign*.043,.81),(sign*.096,1),(sign*.13,.92),(sign*.135,.85)],
                    "X",.78,[body,copper,glass])
        for y in (-.30,.30):
            s.cable([(0,y*.60,.22,.065),(0,y,.43,.080),(0,y,.74,.049)],steel,8)
        for sign in (-1,1):
            s.cable([(sign*.136,-.26,.968,.021),(sign*.144,.18,.983,.025),
                     (sign*.13,.33,.918,.019)],porcelain,7)

    def tile(s,wall):
        plate(s,[(.43,.43,.13,0),(.52,.52,.135,.055),(.50,.50,.14,.105)],ink,[body,steel])
        if wall:
            # Capped radiation baffle catches even a horizontal beam at .78.
            plate(s,[(.38,.38,.11,.104),(.465,.465,.14,.26),(.444,.444,.14,.77),
                     (.41,.41,.12,.88),(.32,.32,.10,.94)],ink,[body,steel,body,alloy])
            for i in range(3):
                plate(s,[(.28,.037,.025,.936),(.25,.025,.018,.961)],body,[ink],center=(0,(i-1)*.13))
            for side in (-1,1):
                section(s,[(-.28,.31),(.26,.31),(.306,.383),(.21,.706),(-.208,.706),(-.304,.61)],
                        [(side*.442,1),(side*.46,.94)],"X",0,[body])
                for y in (-.17,.12):
                    section(s,[(y,.34),(y+.085,.34),(y+.13,.58),(y+.049,.58)],
                            [(side*.458,1),(side*.466,1)],"X",0,[copper])
        else:
            for x in (-.235,.235):
                for y in (-.235,.235):
                    plate(s,[(.16,.13,.056,.106),(.144,.112,.048,.147)],steel,[body],center=(x,y))
            s.lathe([(0,0,z,r,r) for z,r in [(.106,.177),(.122,.192),(.146,.157),(.152,.116)]],
                    ink,8,bands=[steel,copper,ink])
            plate(s,[(.066,.028,.014,.151),(.057,.022,.011,.16)],steel,[alloy])

    builders["conduit"]=conduit
    for kind in ("teleporter","mobileTeleporter","doppler","tangler"):
        builders[kind]=partial(waveguide,kind=kind)
    for kind in ("complementor","multiFilter","twister","quadBender","starburst"):
        builders[kind]=partial(radial,kind=kind)
    builders.update(logicGate=partial(gate,primary=False),primaryLogicGate=partial(gate,primary=True),
                    dualReflector=dual,wall=partial(tile,wall=True),occupiedSquare=partial(tile,wall=False))
