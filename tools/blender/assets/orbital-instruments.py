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
aperture=make_material("Silvered aperture","titanium",.91,.095,shade=2)
meniscus=make_material("Filter doublet","cyan",.18,.12)
signal=make_material("glow","cyan",.16,.19,1.10)
gem=make_material("Resonance crystal","cyan",.12,.17,.27)
witness=make_material("Receiver lock","cyan",.18,.27,.28)
violet=make_material("Dielectric violet","amethyst",.41,.22)
# The splitter shell is one front-face alpha pass; the internal film remains
# solid and picks up the actual ray at the point where it branches.
split_glass=make_material("Splitter crown glass","cyan",.23,.15,shade=-1)
split_glass.surface_render_method="BLENDED"
split_glass.use_backface_culling=True
split_bsdf=split_glass.node_tree.nodes.get("Principled BSDF")
split_bsdf.inputs["Alpha"].default_value=.74
split_bsdf.inputs["Coat Weight"].default_value=.65
split_bsdf.inputs["Coat Roughness"].default_value=.12
for mat in (porcelain,glass,gem,meniscus,aperture):
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
    # An Asscher cut. Each terrace has a different slope, alternating long
    # side facets with the corner facets. The laser enters through the girdle.
    sections=[]
    for z,r,clip in [(.309,.035,.43),(.499,.212,.48),(.665,.304,.43),
                     (.756,.391,.42),(.794,.402,.42),(.825,.398,.42),
                     (.963,.357,.50),(1.073,.296,.39),(1.167,.215,.46),
                     (1.183,.183,.46)]:
        v=r*clip
        sections.append([(x,y,z) for x,y in [
            (r,v),(v,r),(-v,r),(-r,v),(-r,-v),(-v,-r),(v,-r),(r,-v)]])
    s.loft(sections,gem)

    # Four open galleries expose the underside and keep metal below beam height.
    s.lathe([(0,0,z,r,r) for z,r in [(0,.47),(.044,.543),(.096,.548),
             (.118,.493),(.155,.487),(.178,.518),(.202,.48)]],
            ink,8,bands=[steel,body,alloy,ink,bronze,steel],phase=pi/8)
    sleeve(s,"Z",(0,0,0),[(.197,.316),(.235,.323),(.267,.294),
            (.269,.206),(.205,.199)],[ink,alloy,bronze,ink,steel],16)
    for i in range(4):
        a=(i+.5)*pi/2
        def jaw(r,t,z):
            return (r*cos(a)-t*sin(a),r*sin(a)+t*cos(a),z)
        rail=[]
        for radius,z,w,d in [(.388,.172,.099,.074),(.432,.238,.097,.065),
                             (.430,.320,.073,.046),(.357,.502,.044,.036),
                             (.342,.610,.048,.037),(.361,.682,.066,.033),
                             (.342,.700,.055,.020)]:
            rail.append([jaw(radius+x,y,z) for x,y in [
                (-d,-w*.76),(-d*.57,-w),(d*.63,-w),(d,-w*.65),
                (d,w*.65),(d*.63,w),(-d*.57,w),(-d,w*.76)]])
        s.loft(rail,ink,[body,steel,alloy,bronze,bronze,alloy])
        # A recessed status window on each shoe stays visible between the claws.
        theta=i*pi/2
        def port(x,y,z):
            return (x*cos(theta)-y*sin(theta),x*sin(theta)+y*cos(theta),z)
        for r,z,w,mat in [(.475,.140,.106,ink),(.480,.149,.083,witness)]:
            s.loft([[port(r+dx,y,z+h) for dx,y in
                    [(-.038,-w),(.003,-w),(.017,-w+.022),(.017,w-.022),(.003,w),(-.038,w)]]
                    for h in (0,.021)],mat)

def filter_wheel(s):
    mount(s);yoke(s,"Y",.66)
    loop=[(-.11,.282),(-.114,.369),(-.068,.406),(.03,.412),(.096,.378),(.106,.306),(.068,.284)]
    sleeve(s,"X",(0,0,.734),loop,[ink,alloy,body,bronze,alloy,ink,glass],28)
    # Two convex optical faces meet in a silvered gasket. The dome and
    # stepped retaining ring catch a highlight even nearly edge-on.
    rings=[[(x,r*cos(i*tau/32),.734+r*sin(i*tau/32)) for i in range(32)] for x,r in [
        (-.106,.045),(-.100,.123),(-.081,.203),(-.044,.273),(-.022,.280),
        (.022,.280),(.044,.273),(.081,.203),(.100,.123),(.106,.045)]]
    s.loft(rings,meniscus,[meniscus]*4+[ink]+[meniscus]*4)
    for side in (-1,1):
        sleeve(s,"X",(0,0,.734),[(side*x,r) for x,r in [
            (.050,.275),(.073,.281),(.075,.292),(.052,.302)]],[alloy,bronze,steel,ink],32)
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
        # A scooped toroidal reflector. A low waist and swept horns distinguish
        # it from the flat mirror in both the side and overhead cameras.
        n=16
        start=len(s.vertices)
        for j in range(n+1):
            t=2*j/n-1
            y=.476*t
            center=.074-.236*t*t
            low=.527+.118*t*t
            high=.935+.248*t*t
            for depth,height in [(.085,low-.027),(.145,low+.015),(.148,high-.061),
                    (.096,high+.009),(.030,high+.019),(-.022,high-.017),
                    (-.044,high-.075),(0,(low+high)*.5),(-.054,low+.059),(-.021,low+.008)]:
                s.vertices.append((center+depth+.25*(height-.78),y,height))
        bands=[ink,body,steel,bronze,alloy,steel,silver,silver,alloy,bronze]
        for j in range(n):
            for k,material in enumerate(bands):
                a=start+j*10+k;b=start+j*10+(k+1)%10
                s.face((a,b,b+10,a+10),material)
        for j in (0,n):
            s.face(tuple(start+j*10+k for k in range(10)),bronze)
        for y in (-.39,.39):
            s.cable([(.16,y*.54,.22,.052),(.14,y*.92,.43,.04),(.10,y,.56,.042)],bronze,7)
        for side in (-1,1):
            s.cable([(.079,side*.24,.37,.054),(.098,side*.29,.49,.060),
                     (.04,side*.362,.628,.046)],porcelain,8)
    else:
        outline=[(-.405,-.22),(-.316,-.304),(.326,-.304),(.405,-.20),
                 (.405,.203),(.317,.302),(-.315,.302),(-.405,.205)]
        # Incline the complete bezel and coating together. The glTF aperture
        # itself defines the plane used for real-time reflections in Three.
        first=len(s.vertices)
        section(s,outline,[(.115,.80),(.078,1),(-.026,1),(-.059,.917),
                           (-.067,.875),(-.067,.866)],
                "X",.87,[body,steel,alloy,ink,aperture])
        tilt=.29
        for i in range(first,len(s.vertices)):
            x,y,z=s.vertices[i];h=z-.87
            s.vertices[i]=(cos(tilt)*x+sin(tilt)*h,y,.87-sin(tilt)*x+cos(tilt)*h)
        for z in (.71,.86,1.01):
            s.cable([(.124,-.263,z,.019),(.138,.11,z+.025,.021),(.112,.26,z+.02,.015)],ink,6)
        for y in (-.31,.31):
            s.cable([(.10,y*.4,.23,.044),(.13,y,.45,.040),(.10,y,.61,.034)],bronze,7)
        # Cantilevered adjuster at the back of the optical flat.
        sleeve(s,"X",(.127,0,.856),[(0,.134),(.05,.128),(.067,.085),(.095,.081),
               (.104,.052),(0,.052)],[steel,alloy,bronze,porcelain,ink,steel],10)

def splitter(s):
    mount(s,True)
    # Opposed right-angle prisms share a splitter plane along Blender Y.
    # Clip the three corners and polish the sloping crown of each half.
    footprint=[(.049,-.375),(.089,-.403),(.462,-.067),(.462,.067),
               (.089,.403),(.049,.375)]
    for side in (-1,1):
        rings=[]
        for scale,z,slope in [(.86,.518,0),(1,.553,.04),(1,.893,.58),(.89,.936,.58)]:
            rings.append([(side*(.17+(x-.17)*scale),y*scale,z+x*slope) for x,y in footprint])
        # A polished bevel follows each rising shoulder. Only the narrow
        # chamfer is opaque; both sloping tables remain optical glass.
        s.loft(rings,split_glass,[split_glass,split_glass,steel])
        s.finishes[-1]=s.palette.index(split_glass)
        # Each prism beds on a separate gasket. The open gap continues
        # through the two crowns so the split is also readable from above.
        s.loft([[(side*(.17+(x-.17)*scale),y*scale,z) for x,y in footprint]
                for scale,z in [(.78,.447),(.93,.480),(.91,.509),(.84,.522)]],
               body,[steel,bronze,ink])
        # Forked shoes cradle the outer tips below the optical centreline.
        # Their capped nibs stay outside the polished entrance faces.
        for end in (-1,1):
            shoe=[]
            for x,y,z,w,d in [(.220,.131,.424,.066,.030),(.320,.139,.458,.060,.033),
                              (.425,.089,.518,.047,.031),(.452,.060,.557,.042,.022),
                              (.453,.060,.630,.036,.018)]:
                shoe.append([(side*(x+u*d),end*(y+v*w),z) for u,v in
                    [(-1,-.66),(-.6,-1),(.7,-1),(1,-.62),(1,.62),(.7,1),(-.6,1),(-1,.66)]])
            s.loft(shoe,body,[body,steel,bronze,alloy])
    film=[(-.407,-.214),(-.351,-.263),(.351,-.263),(.407,-.214),
          (.407,.110),(.349,.161),(-.349,.161),(-.407,.110)]
    section(s,film,[(-.013,.97),(-.008,1),(.008,1),(.013,.97)],"X",.78,
            [glass,violet,glass])
    # A rigid saddle rises below the glass. Only the axial stops extend to
    # beam height, where the puzzles absorb rays travelling along the film.
    plate(s,[(.189,.278,.070,.214),(.209,.318,.074,.251),(.152,.364,.069,.374),
             (.194,.381,.066,.453),(.188,.370,.066,.479)],body,[steel,body,steel,alloy])
    for end in (-1,1):
        jaws=[]
        for z,y,w,d in [(.195,.242,.151,.083),(.262,.322,.155,.086),(.427,.386,.102,.069),
                        (.535,.417,.085,.060),(.853,.443,.062,.055),
                        (.942,.413,.081,.064),(.974,.392,.064,.050)]:
            jaws.append([(w*u,end*(y+d*v),z) for u,v in
                [(-.70,-1),(.70,-1),(1,-.65),(1,.60),(.67,1),(-.67,1),(-1,.60),(-1,-.65)]])
        s.loft(jaws,body,[steel,body,alloy,bronze,alloy,bronze])
        sleeve(s,"Y",(0,end*.465,.779),[(end*depth,r) for depth,r in
               [(0,.069),(.020,.081),(.039,.068),(.039,.033),(0,.033)]],
               [ink,steel,bronze,ink,body],12)

def prism(s):
    flint=make_material("Dispersive flint","steel",.17,.12,shade=1)
    edge=make_material("Ground flint bevel","titanium",.63,.16)
    flint.surface_render_method="BLENDED"
    flint.use_backface_culling=True
    bsdf=flint.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Alpha"].default_value=.69
    bsdf.inputs["Coat Weight"].default_value=.72
    bsdf.inputs["Coat Roughness"].default_value=.12
    # Three large polished windows around the horizontal beam plane. The
    # clipped apex points along +X and remains visible in the overhead camera.
    outline=[(-.329,-.374),(-.269,-.437),(.474,-.052),
             (.474,.052),(-.269,.437),(-.329,.374)]
    def rim(scale,z,pitch=0):
        return [(x*scale,y*scale,z+pitch*x) for x,y in outline]
    s.loft([rim(scale,z,pitch) for scale,z,pitch in [
        (.84,.426,0),(1,.516,0),(1,.995,.27),(.959,1.041,.27),
        (.806,1.111,.27),(.786,1.117,.27)]],flint,[edge,flint,edge,flint,edge])
    s.finishes[-1]=s.palette.index(flint)
    # Three floating seating pads sit on a levelling stage. Recess the
    # dark backing under the glass so the cut edges stand out over pale decks.
    mount(s,True)
    s.loft([rim(.75,.226),rim(.92,.268),rim(.92,.310),rim(.78,.334)],
           steel,[body,steel,alloy])
    s.loft([rim(.83,.373),rim(1.04,.404),rim(1.04,.431),rim(.91,.445)],
           body,[steel,bronze,ink])
    # Two sprung rear corner clips. They follow the short ground corners,
    # between compass rays, and leave the pointed end completely exposed.
    for side in (-1,1):
        strap=[]
        for z,x,y,w,d in [(.404,-.256,.401,.063,.031),(.489,-.295,.424,.060,.033),
                          (.642,-.300,.426,.039,.025),(.882,-.301,.423,.032,.022),
                          (.933,-.307,.415,.041,.028),(.972,-.297,.405,.048,.029),
                          (.989,-.282,.391,.039,.025)]:
            strap.append([(x+(u*d+v*w)*.7071,side*(y+(v*w-u*d)*.7071),z)
                          for u,v in [(-1,-.7),(-.6,-1),(.65,-1),(1,-.65),
                                      (1,.65),(.65,1),(-.6,1),(-1,.7)]])
        s.loft(strap,body,[steel,bronze,body,bronze,alloy,steel])
    for angle in (0,2.15,-2.15):
        c,t=cos(angle),sin(angle)
        def radial(r,w,z):return (c*r-t*w,t*r+c*w,z)
        foot=[]
        for r,z,w,d in [(.332,.168,.117,.075),(.409,.221,.121,.077),
                        (.447,.290,.094,.055),(.430,.390,.078,.047),
                        (.446,.458,.065,.040),(.461,.522,.067,.033),
                        (.452,.549,.053,.025)]:
            foot.append([radial(r+u*d,v*w,z) for u,v in [
                (-1,-.64),(-.63,-1),(.65,-1),(1,-.66),(1,.66),(.65,1),(-.63,1),(-1,.64)]])
        s.loft(foot,ink,[body,steel,body,bronze,bronze,alloy])
        # Knurled levelling head in each shoe.
        cx,cy,_=radial(.337,0,0)
        s.lathe([(cx,cy,z,r,r) for z,r in [(.319,.056),(.339,.068),(.371,.068),(.388,.051)]],
                bronze,12,bands=[ink,bronze,steel])
    # A tangent screw projects from the entrance side of the turntable.
    sleeve(s,"X",(-.401,0,.299),[
        (.040,.069),(-.019,.069),(-.027,.099),(-.093,.099),(-.108,.078),
        (-.108,.036),(.036,.036)],[body,alloy,bronze,steel,alloy,ink,body],18)
    for i in range(10):
        a=tau*i/10
        s.cable([(-.434,.099*cos(a),.299+.099*sin(a),.008),
                 (-.482,.099*cos(a+.10),.299+.099*sin(a+.10),.008)],ink,5)
    # Pockets at the three corners hold the flint from above its windows.
    # Their toes follow the crown facet and leave the wide top table open.
    for i,j in [(0,1),(2,3),(4,5)]:
        clip=[]
        for lift in (-.003,.014):
            ring=[]
            for corner,r in [(i,.815),(j,.815),(j,.955),(i,.955)]:
                x,y=outline[corner]
                z=1.041+(.959-r)*(.070/.153)+.27*x
                ring.append((x*r,y*r,z+lift))
            clip.append(ring)
        s.loft(clip,bronze,[alloy])

builders={"laser":emitter,"target":receiver,
          "filter":filter_wheel,"mirror":reflector,"bender":lambda s:reflector(s,True),
          "splitter":splitter,"prism":prism}
from tools.blender.optical_specialties import add_specialties
add_specialties(builders, mount, sleeve, section,
                (ink,body,steel,alloy,porcelain,bronze,glass,violet))
models=[]
# Always save a complete editable bench. A named export only rewrites the
# GLBs and portraits requested after Blender's '--'.
requested=set(sys.argv[sys.argv.index("--")+1:]) if "--" in sys.argv else set()
if requested-builders.keys():raise ValueError(f"Unknown bench models: {requested-builders.keys()}")
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
    if not requested or name in requested:
        export_model(model,5500,folder)
        view=(-1.3,1.48,1.0) if name in ("laser","logicGate","primaryLogicGate") else (-1.18,-1.45,1.23)
        if name=="splitter":view=(-.28,-1.85,1.10)
        render(name,view,model=model,resolution=(160,160),transparent=True,folder=folder/"portraits")
    model.hide_render=True
    models.append(model)
for i,model in enumerate(models):
    model.hide_render=False
    model.location.x=(i%6)*1.65;model.location.y=(i//6)*2
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(folder/"optical-bench.blend"),compress=True)
