"""The playable low-poly instrument family. Forward is Blender +Y."""
from math import cos, pi, sin, tau
from pathlib import Path
import runpy
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from tools.blender.style import ROOT, Sculpture, export_model, make_material, plate
from tools.blender.style import render, reset_scene

KINDS = ("wall laser mirror bender filter prism doppler splitter tangler target conduit "
         "teleporter multiFilter twister complementor logicGate starburst mobileTeleporter "
         "dualReflector quadBender occupiedSquare primaryLogicGate").split()


def finishes():
    return {
        "shadow": make_material("Graphite isolation", "obsidian", .25, .61, shade=-1),
        "body": make_material("Naval enamel", "navy", .31, .49),
        "metal": make_material("Titanium chamfers", "titanium", .42, .42),
        "ivory": make_material("Porcelain", "ceramic", .13, .39, shade=1),
        "trim": make_material("Copper fittings", "copper", .34, .40, shade=1),
        "glass": make_material("silvered glass", "titanium", .58, .21, .06, shade=2),
        "jade": make_material("Jade optical housing", "jade", .24, .37, shade=1),
        "plum": make_material("Amethyst dielectric", "amethyst", .29, .34, shade=1),
        "glow": make_material("glow", "cyan", .1, .27, 1.1),
    }


def circle(n):
    return [(cos(tau*i/n), sin(tau*i/n)) for i in range(n)]


def mount(s, m, slim=False, finish=None):
    w = .36 if slim else .49
    plate(s, [(w*.87,.43,.096,0),(w,.50,.106,.054),(w,.50,.106,.104),
              (w*.87,.431,.094,.157),(w*.67,.357,.088,.208)],
          m["shadow"], [m["body"],m["shadow"],m["metal"],finish or m["body"]])


def radial(path, angle):
    c,s = cos(angle),sin(angle)
    return [(x*c-y*s,x*s+y*c,z,w,h) for x,y,z,w,h in path]


def fin(s, m, heading, bend=0, height=.32, width=.080, material=None):
    path = [(.054,0,.23,.050,.027),(.246,bend*.34,.27+height*.24,width,.056),
            (.417,bend,.248+height,width*.28,.035)]
    s.blade(radial(path,heading),material or m["trim"],m["body"])


def lens(s, m, x, radius, finish, luminous=True, n=12, height=.56):
    # Cross section closes on itself, preserving the opening of the yoke.
    outer = [(x-.06,1.04),(x-.045,1.12),(x+.035,1.12),(x+.06,1.03),
             (x+.054,.80),(x-.037,.77)]
    ring = circle(n)
    start = len(s.vertices)
    s.vertices.extend((offset,u*radius*r,height+v*radius*r) for offset,r in outer for u,v in ring)
    for row in range(len(outer)):
        a,b = start+row*n, start+((row+1)%len(outer))*n
        mat = (m["metal"], finish, finish, m["shadow"], m["glow"] if luminous else m["metal"], m["metal"])[row]
        for i in range(n):
            j = (i+1)%n
            s.face((a+i,a+j,b+j,b+i),mat)


def barrel(s, m):
    section = [(-.47,.142),(-.42,.212),(-.24,.228),(-.14,.155),
               (.22,.181),(.39,.218),(.49,.173),(.51,.13)]
    s.loft([[(r*u,y,.54+r*v) for u,v in circle(12)] for y,r in section],
           m["shadow"],
           [m["glass"],m["body"],m["trim"],m["jade"],m["ivory"],m["metal"],m["glow"]])
    for sign in (-1,1):
        s.blade([(sign*.17,-.35,.24,.055,.036),(sign*.23,-.16,.27,.069,.117),
                 (sign*.17,.17,.34,.044,.094)],m["body"],m["trim"])
    fin(s,m,-pi/2,0,.39,material=m["trim"])


def conduit(s,m):
    # An open bore with two flared rims distinguishes it from an emitter.
    sections=[(-.42,.19),(-.44,.27),(-.32,.275),(-.20,.20),(.20,.20),
              (.32,.275),(.44,.27),(.42,.153),(-.42,.153)]
    rim=[m["metal"],m["ivory"],m["trim"],m["jade"],m["trim"],m["ivory"],
         m["metal"],m["glow"],m["glow"]]
    ring=circle(10)
    start=len(s.vertices)
    s.vertices.extend((r*u,y,.54+r*v) for y,r in sections for u,v in ring)
    for i in range(len(sections)):
        a,b=start+i*len(ring),start+(i+1)%len(sections)*len(ring)
        for j in range(len(ring)):
            k=(j+1)%len(ring)
            s.face((a+j,a+k,b+k,b+j),rim[i])
    plate(s,[(.23,.244,.045,.192),(.20,.23,.04,.34),(.174,.198,.04,.42)],
          m["body"],[m["metal"],m["jade"]])


def shield(s, m, angle=0, curved=False, scale=1, offset=0):
    # The front lands at X=-.067, immediately behind the game reflector.
    rim = [(-.46,.52),(-.42,.40),(-.27,.33),(.24,.33),(.40,.40),(.45,.51),
           (.45,.76),(.37,.88),(.16,.94),(-.13,.94),(-.35,.88),(-.46,.78)]
    c,t = cos(angle),sin(angle)

    def position(x,y,z):
        x = (x+(y*y*.95 if curved else 0))*scale-offset
        y *= scale
        return (x*c-y*t,x*t+y*c,z)
    s.loft([[position(x,y*f,.65+(z-.65)*f) for y,z in rim]
            for x,f in [(.105,.82),(.055,1),(-.043,1),(-.067,.9)]],
           m["body"],[m["body"],m["trim"],m["glass"]])
    for y in (-.28,.28):
        s.cable([(*position(.030,y*.48,.19),.06),(*position(.082,y,.46),.042)],m["metal"],5)


def gem(s, m, count, width, height, base=.23, color="glass", lean=.0):
    s.lathe([(0,0,base,width*.62,width*.66),(0,0,base+height*.23,width,width*.78),
             (.04,lean*.50,base+height*.68,width*.76,width*.56,.12),
             (.03,lean,base+height,width*.14,width*.16,.18)],
            m["shadow"], count, bands=[m["metal"],m[color],m["ivory"]])


def instrument(kind):
    if kind == "splitter":
        source = runpy.run_path(str(ROOT / "tools/blender/assets/beam-splitter.py"))
        model = source["build"]()
        model.name = model.data.name = kind
        return model
    m = finishes()
    s = Sculpture()
    if kind in ("wall","occupiedSquare"):
        tall = kind == "wall"
        height = .43 if tall else .146
        plate(s,[(.45,.43,.13,0),(.52,.514,.143,.065),
                 (.47,.47,.132,height*.74),(.405,.43,.127,height)],
              m["shadow"],[m["body"],m["shadow"],m["metal"]])
        for y in (-.26,0,.26):
            s.blade([(-.29,y-.02,height-.005,.033,.014),(.03,y+.04,height+.03,.049,.035),
                     (.30,y+.06,height-.005,.032,.014)],m["trim"] if tall else m["body"],m["shadow"])
        return s.object(kind)

    mount(s,m,kind in ("laser","conduit","mirror","bender","filter","dualReflector"))
    if kind=="laser":
        barrel(s,m)
    elif kind=="conduit":
        conduit(s,m)
    elif kind in ("mirror","bender","dualReflector"):
        dual=kind=="dualReflector"
        shield(s,m,curved=kind=="bender",scale=.78 if dual else 1,offset=.096 if dual else 0)
        if kind=="bender":
            fin(s,m,0,.11,.28,.10,m["jade"])
        if dual:
            shield(s,m,pi,scale=.78,offset=.096)
    elif kind in ("teleporter","mobileTeleporter","tangler","doppler","filter"):
        plate(s,[(.35,.115,.038,.194),(.294,.087,.034,.295)],
              m["body"],[m["metal"]])
        if kind=="doppler":
            for x,r in ((-.21,.21),(0,.29),(.23,.36)):
                lens(s,m,x,r,m["plum"] if x>0 else m["jade"],x>=0,8)
        elif kind=="tangler":
            lens(s,m,-.21,.29,m["plum"],True,10,.56)
            lens(s,m,.21,.29,m["jade"],True,10,.56)
        else:
            lens(s,m,0,.35,m["plum"] if kind!="filter" else m["jade"],True,12)
            if kind=="filter":
                glass = [(u*.272,.56+v*.272) for u,v in circle(10)]
                s.loft([[(x,y,z) for y,z in glass] for x in (-.022,.022)],m["glow"])
            if kind=="mobileTeleporter":
                for a in (pi/2,-pi/2):
                    fin(s,m,a,.14,.055,.080,m["ivory"])
    elif kind=="target":
        s.lathe([(0,0,.19,.19,.19),(0,0,.31,.24,.24),(0,0,.46,.40,.40),
                 (0,0,.54,.441,.441),(0,0,.55,.376,.376),(0,0,.39,.217,.217)],
                m["shadow"],12,3,.062,[m["jade"],m["body"],m["trim"],m["ivory"],m["glow"]])
        gem(s,m,6,.164,.21,.39,"glow")
    elif kind in ("prism","complementor"):
        sides = 3 if kind=="prism" else 5
        gem(s,m,sides,.378,.68,.21,"glass" if sides==3 else "plum",.07)
        for i in range(3 if sides==3 else 2):
            fin(s,m,i*tau/(3 if sides==3 else 2),.09,.19 if sides==3 else .40)
    elif kind in ("logicGate","primaryLogicGate"):
        primary = kind=="primaryLogicGate"
        for sign in (-1,1):
            lift=.11 if primary else 0
            s.cable([(sign*.37,-.34,.34,.11),(sign*.26,-.19,.43+lift,.101),
                     (sign*.13,-.09,.52+lift,.085),(0,.06,.54,.079)],
                    m["jade"] if sign<0 else m["trim"],8)
        s.cable([(0,.035,.54,.137),(0,.22,.54,.119),(0,.44,.54,.084)],m["ivory"],8)
        gem(s,m,3 if primary else 6,.26 if primary else .18,.42 if primary else .32,.45,
            "plum" if primary else "jade")
        if primary:
            plate(s,[(.21,.19,.051,.21),(.165,.16,.047,.44)],m["body"],[m["plum"]])
    elif kind in ("multiFilter","twister","starburst","quadBender"):
        count = {"multiFilter":4,"twister":5,"starburst":8,"quadBender":4}[kind]
        bend = {"multiFilter":.12,"twister":.235,"starburst":0,"quadBender":-.19}[kind]
        for i in range(count):
            color = ("jade","plum","ivory","trim")[i%4] if kind=="multiFilter" else ("trim","ivory")[i%2]
            fin(s,m,i*tau/count,bend,.14 if kind=="starburst" else .40,.067 if count==8 else .092,m[color])
        if kind=="starburst":
            s.lathe([(0,0,.19,.17,.17),(0,0,.32,.26,.25),(0,0,.39,.19,.18)],
                    m["shadow"],8,4,.12,bands=[m["trim"],m["ivory"]])
        else:
            gem(s,m,8 if kind=="multiFilter" else 6,.148,.27,.24,"jade")
    else:
        raise ValueError(kind)
    return s.object(kind)


def produce(kind):
    reset_scene()
    model = instrument(kind)
    limit = 180 if kind in ("wall","occupiedSquare") else 600
    export_model(model,limit,ROOT / "public/models/optics")
    # Faces whose orientation matters have their silvered side shown in review.
    render("optics/"+kind,(-1.50,-1.25,1.17),model=model)
    render(kind,model=model,resolution=(128,128),transparent=True,folder=ROOT / "public/portraits")


if __name__ == "__main__":
    requested = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else KINDS
    for kind in requested:
        produce(kind)
