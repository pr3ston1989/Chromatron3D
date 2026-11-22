"""Kepler optical bench. Direction zero points along Blender +Y."""
from pathlib import Path
from math import cos, sin, pi, tau
import sys
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT))
from tools.blender.style import Sculpture, make_material, plate, reset_scene, export_model, render
from tools.blender.orbital_finish import finish_surface

reset_scene()
folder=ROOT/"assets/models/optical-bench"
ink=make_material("Carbon recess","obsidian",.44,.49,shade=-1)
body=make_material("Anodized cobalt","navy",.64,.36)
steel=make_material("Brushed titanium","steel",.79,.32)
alloy=make_material("Diamond cut edges","titanium",.80,.23)
porcelain=make_material("Satin porcelain","ceramic",.16,.38)
bronze=make_material("Copper ferrule","copper",.76,.29)
glass=make_material("Optical coating","cyan",.50,.14)
silver=make_material("Front silver","titanium",.83,.13,shade=2)
signal=make_material("glow","cyan",.16,.19,1.10)
gem=make_material("Resonance crystal","cyan",.12,.17,.27)
witness=make_material("Receiver lock","cyan",.18,.27,.28)
violet=make_material("Dielectric violet","amethyst",.41,.22)
for mat in (porcelain,glass,gem):
    bsdf=mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Coat Weight"].default_value=.46
    bsdf.inputs["Coat Roughness"].default_value=.18

def section(s,profile,depths,axis,base,bands):
    """Section in YZ for gimbals and XZ for emitters."""
    rings=[]
    for depth,scale in depths:
        if axis=="X":
            rings.append([(depth,u*scale,v*scale+base) for u,v in profile])
        else:
            rings.append([(u*scale,depth,v*scale+base) for u,v in profile])
    s.loft(rings,bands[0],bands)

def sleeve(s,axis,center,levels,bands,n=24):
    """Revolve a closed wall section, retaining an actual open bore."""
    start=len(s.vertices)
    for depth,r in levels:
        for i in range(n):
            c,t=cos(i*tau/n)*r,sin(i*tau/n)*r
            vertex=(depth,c,t) if axis=="X" else (c,depth,t) if axis=="Y" else (c,t,depth)
            s.vertices.append(tuple(v+p for v,p in zip(vertex,center)))
    for layer,material in enumerate(bands):
        i=start+layer*n
        j=start+(layer+1)%len(levels)*n
        for k in range(n):
            q=(k+1)%n;s.face((i+k,i+q,j+q,j+k),material)

def mount(s,round_base=False):
    if round_base:
        s.lathe([(0,0,z,r,r) for z,r in [(0,.42),(.055,.51),(.125,.51),(.17,.467),(.19,.415)]],
                ink,16,bands=[ink,body,alloy,steel])
    else:
        plate(s,[(.41,.40,.13,0),(.49,.48,.14,.052),(.49,.48,.14,.117),
                 (.454,.448,.133,.151),(.425,.421,.129,.173)],ink,[ink,body,alloy,steel])
    # Recessed swivel with two opposed micrometer scales. The dark slot and
    # interrupted silver lip read even when the markings are subpixel.
    s.lathe([(0,0,z,r,r) for z,r in [(.161,.327),(.180,.396),(.208,.396),(.227,.332)]],
            ink,16,bands=[ink,steel,body])
    for angle in (.18,pi+.18):
        rings=[]
        for i in range(9):
            a=angle+i*.205
            rings.append([(r*cos(a),r*sin(a),z) for r,z in [
                (.358,.188),(.371,.219),(.412,.219),(.428,.194),(.424,.171),(.365,.171)]])
        s.loft(rings,bronze)
        for i in (1,3,5,7):
            a=angle+i*.205
            s.loft([[(r*cos(a+t),r*sin(a+t),z) for r,t in [
                (.374,-.020),(.404,-.020),(.404,.020),(.374,.020)]] for z in (.218,.224)],ink)
    for side in (-1,1):
        # Proud datum tabs on two sides of the mounting shoe.
        plate(s,[(.079,.036,.019,.136),(.066,.032,.018,.164)],bronze,[alloy],
              center=(side*.23,-.366))

def yoke(s,axis,height=.78):
    for side in (-1,1):
        wall=[(-.30,.18),(.265,.18),(.21,.30),(.135,height+.026),(.065,height+.12),
              (-.083,height+.11),(-.15,height+.025),(-.16,.44)]
        section(s,wall,[(side*.22,.96),(side*.252,1),(side*.316,.94)],axis,0,[steel,body])
        if axis=="X": center=(side*.319,0,height)
        else: center=(0,side*.319,height)
        sleeve(s,axis,center,[(-.012,.097),(.012,.107),(.035,.091),(.035,.047),(-.012,.047)],
               [ink,alloy,bronze,ink,body],12)

def emitter(s):
    mount(s);yoke(s,"X",.71)
    z=.78
    wall=[(-.43,.148),(-.398,.241),(-.34,.273),(-.21,.272),(-.18,.223),(-.075,.217),
          (-.050,.243),(.19,.241),(.22,.21),(.27,.242),(.366,.242),(.414,.203),
          (.468,.201),(.50,.175),(.49,.133),(.37,.123),(-.40,.118)]
    sleeve(s,"Y",(0,0,z),wall,[ink,alloy,body,steel,ink,bronze,body,steel,bronze,porcelain,
                              alloy,ink,alloy,signal,steel,ink,ink],24)
    ring=[(.112*cos(i*tau/20),.112*sin(i*tau/20)) for i in range(20)]
    section(s,ring,[(.36,.97),(.395,1),(.427,.79)],"Y",z,[signal,signal])
    for y in (-.34,-.27,-.20):
        sleeve(s,"Y",(0,0,z),[(y,.248),(y+.009,.298),(y+.035,.298),(y+.046,.248)],
               [steel,body,alloy,ink],16)
    for side in (-1,1):
        # Split shroud over the exciter, with an exposed copper heat sink.
        cheek=[(-.37,-.095),(-.265,-.153),(.164,-.128),(.219,-.047),
               (.166,.079),(-.063,.157),(-.294,.148),(-.38,.078)]
        section(s,cheek,[(side*.184,.83),(side*.226,1),(side*.262,.87)],
                "X",z+.051,[steel,porcelain])
        for y in (-.215,-.115,-.015):
            section(s,[(y,-.035),(y+.038,-.044),(y+.086,.056),(y+.046,.069)],
                    [(side*.254,.99),(side*.267,1)],"X",z+.065,[ink])
        s.cable([(side*.19,-.27,.61,.029),(side*.235,-.18,.53,.035),
                 (side*.192,.11,.44,.029),(side*.15,.215,.29,.024)],bronze,7)

def receiver(s):
    mount(s,True)
    s.lathe([(0,0,z,r,r) for z,r in [(.18,.30),(.23,.345),(.31,.30),(.35,.235)]],
            body,8,bands=[steel,ink,bronze])
    # A brilliant-cut double termination. Alternating triangular crown and
    # pavilion facets survive the overhead view as well as a grazing angle.
    rings=[]
    for z,r,phase in [(.30,.075,0),(.56,.301,.13),(.78,.366,0),(.86,.356,0),(1.09,.246,.37),(1.31,.12,0)]:
        rings.append([(r*cos(i*tau/8+phase),r*sin(i*tau/8+phase),z) for i in range(8)])
    start=len(s.vertices)
    for ring in rings:s.vertices.extend(ring)
    s.face(tuple(start+i for i in range(8)),gem)
    for row in range(len(rings)-1):
        for i in range(8):
            a=start+8*row+i;b=start+8*row+(i+1)%8
            s.face((a,b,b+8),gem);s.face((a,b+8,a+8),gem)
    s.face(tuple(start+40+i for i in range(8)),gem)
    for i in range(3):
        a=i*tau/3
        s.blade([(r*cos(a),r*sin(a),z,w,h) for r,z,w,h in [
            (.423,.19,.074,.035),(.365,.29,.092,.049),(.310,.56,.071,.054),
            (.304,.646,.042,.032),(.285,.64,.023,.015)]],porcelain,bronze)
        t=a+pi/3
        s.lathe([(.344*cos(t),.344*sin(t),z,r,r) for z,r in
                 [(.181,.074),(.20,.072),(.223,.049)]],ink,6,bands=[alloy,witness])
    sleeve(s,"Z",(0,0,0),[(.15,.48),(.17,.48),(.175,.467),(.15,.467)],
           [witness,witness,steel,ink],24)

def filter_wheel(s):
    mount(s);yoke(s,"Y",.66)
    loop=[(-.11,.282),(-.114,.369),(-.068,.406),(.03,.412),(.096,.378),(.106,.306),(.068,.284)]
    sleeve(s,"X",(0,0,.734),loop,[ink,alloy,body,bronze,alloy,ink,glass],28)
    outline=[(.278*cos(i*tau/28),.278*sin(i*tau/28)) for i in range(28)]
    section(s,outline,[(-.038,.96),(-.023,1),(.030,1),(.045,.96)],"X",.734,[signal,glass,signal])
    # A keyed latch on the high rim is visible from either face.
    s.cable([(-.087,-.145,1.074,.033),(.058,-.145,1.086,.035),(.09,-.132,1.049,.028)],bronze,6)
    for i in range(4):
        a=i*pi/2+.37
        s.cable([(.115,r*cos(a),.734+r*sin(a),.019) for r in (.307,.367)],porcelain,5)
    # Twin milled thumb grips rise above the bezel; keep the glass open.
    for a in (pi*.25,pi*.75):
        s.cable([(x,r*cos(a),.734+r*sin(a),w) for x,r,w in
                 [(-.073,.386,.039),(-.049,.42,.047),(.047,.42,.047),(.075,.386,.039)]],bronze,8)

def reflector(s,curved=False):
    mount(s);yoke(s,"Y",.65)
    if curved:
        # A continuous crescent with graduated curvature on the silvered edge.
        for i in range(10):
            rings=[]
            for j in (i,i+1):
                y=(j/10-.5)*.88
                x=.90*y*y-.13
                z=.71+.42*y*y
                rings.append([(x+dx,y,z+dz) for dx,dz in [(-.046,-.21),(.06,-.245),(.125,-.19),
                               (.11,.22),(.033,.27),(-.051,.235)]])
            start=len(s.vertices);s.vertices.extend(rings[0]+rings[1])
            for n,mat in enumerate([bronze,ink,body,steel,alloy,silver]):
                q=(n+1)%6;s.face((start+n,start+q,start+6+q,start+6+n),mat)
            if i==0:s.face(tuple(range(start,start+6)),bronze)
            if i==9:s.face(tuple(range(start+6,start+12)),bronze)
        for y in (-.39,.39):
            s.cable([(.16,y*.54,.22,.052),(.14,y*.92,.43,.04),(.10,y,.56,.042)],bronze,7)
        # Bright end shoes frame the curved silver face in silhouette.
        for sign in (-1,1):
            section(s,[(-.026,.58),(.059,.53),(.18,.57),(.18,.99),(.094,1.04),
                       (.008,1.012)],[(sign*.415,.99),(sign*.447,1)],"Y",0,[porcelain])
    else:
        outline=[(-.405,-.22),(-.316,-.304),(.326,-.304),(.405,-.20),
                 (.405,.203),(.317,.302),(-.315,.302),(-.405,.205)]
        section(s,outline,[(.115,.80),(.078,1),(-.026,1),(-.059,.917),(-.067,.875)],
                "X",.87,[body,steel,alloy,silver])
        for z in (.71,.86,1.01):
            s.cable([(.124,-.263,z,.019),(.138,.11,z+.025,.021),(.112,.26,z+.02,.015)],ink,6)
        for y in (-.31,.31):
            s.cable([(.10,y*.4,.23,.044),(.13,y,.45,.040),(.10,y,.61,.034)],bronze,7)
        # Cantilevered adjuster at the back of the optical flat.
        sleeve(s,"X",(.127,0,.856),[(0,.134),(.05,.128),(.067,.085),(.095,.081),
               (.104,.052),(0,.052)],[steel,alloy,bronze,porcelain,ink,steel],10)

def splitter(s):
    mount(s)
    # Two open jaws support different edges of a dichroic wafer.
    for sign in (-1,1):
        path=[(-.13,.185),(.12,.185),(.19,.37),(.42,.64),(.428,.86),
              (.35,.902),(.29,.834),(.29,.697),(.065,.48),(-.11,.41)]
        section(s,[(u*sign,z) for u,z in path],[(-.11,.97),(-.076,1),(.09,1),(.13,.95)],
                "X",0,[alloy,body,bronze])
    diamond=[(-.32,0),(0,-.225),(.32,0),(0,.225)]
    section(s,diamond,[(-.053,.81),(-.027,1),(.027,1),(.055,.81)],"X",.78,[glass,alloy,glass])
    for y in (-.34,.34):
        sleeve(s,"Y",(0,y,.74),[(-.023,.095),(.023,.095),(.027,.052),(-.023,.052)],
               [bronze,alloy,ink,steel],8)
        s.blade([(.134,y*.29,.32,.047,.028),(.137,y*.65,.47,.059,.033),
                 (.132,y,.61,.044,.029),(.125,y*1.02,.72,.03,.019)],porcelain,alloy)

def prism(s):
    mount(s,True)
    s.lathe([(0,0,.21,.34,.34),(0,0,.29,.37,.37),(0,0,.34,.34,.34)],
            ink,3,bands=[body,bronze],phase=pi/6)
    # A triangular optical wedge sitting lengthwise in its saddle. All three
    # longitudinal edges have a bevel; the broad faces remain unobstructed.
    wedge=[(-.331,-.227),(.331,-.227),(.353,-.185),(.029,.325),(-.029,.325),(-.353,-.185)]
    section(s,wedge,[(-.323,.91),(-.297,1),(.285,1),(.32,.90)],"Y",.665,[glass,glass,silver])
    for i in range(3):
        a=i*tau/3+pi/6
        s.cable([(r*cos(a),r*sin(a),z,w) for r,z,w in [(.39,.19,.047),(.34,.33,.04),(.30,.49,.028)]],bronze,6)
    for side in (-1,1):
        s.cable([(-.298,side*.31,.481,.027),(-.025,side*.31,.976,.023),
                 (.025,side*.31,.976,.023),(.298,side*.31,.481,.027)],porcelain,6)

builders={"laser":emitter,"target":receiver,
          "filter":filter_wheel,"mirror":reflector,"bender":lambda s:reflector(s,True),
          "splitter":splitter,"prism":prism}
from tools.blender.optical_specialties import add_specialties
add_specialties(builders, mount, sleeve, section,
                (ink,body,steel,alloy,porcelain,bronze,glass,violet))
models=[]
for name,build in builders.items():
    sculpture=Sculpture();build(sculpture)
    model=sculpture.object(name)
    # Chamfers are part of each profiled section. A second mesh-wide bevel
    # would collapse the fine engravings on the adjustment scales.
    finish_surface(model,reach=.18)
    if name=="target":
        # Pavilion facets return very different amounts of the internal
        # spectrum. Bake that contrast in linear light, independently of the
        # required RGB mask that the game sets on this same material.
        values=model.data.color_attributes["Baked cavity"].data
        light=Vector((-.71,-.34,.62)).normalized()
        for face in model.data.polygons:
            if model.data.materials[face.material_index]!=gem:continue
            depth=.13+.86*(.5+.5*face.normal.dot(light))**1.7
            for index in face.loop_indices:
                values[index].color=(depth,depth,depth,1)
    export_model(model,5500,folder)
    view=(-1.3,1.48,1.0) if name in ("laser","logicGate","primaryLogicGate") else (-1.18,-1.45,1.23)
    render(name,view,model=model,resolution=(160,160),transparent=True,folder=folder/"portraits")
    model.hide_render=True
    models.append(model)
for i,model in enumerate(models):
    model.hide_render=False
    model.location.x=(i%6)*1.65;model.location.y=(i//6)*2
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(folder/"optical-bench.blend"),compress=True)
