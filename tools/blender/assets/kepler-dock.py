"""Kepler's maintenance cradle. Build with Blender -b -P tools/blender/assets/kepler-dock.py."""
from math import ceil, cos, pi, radians, sin
from pathlib import Path
import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from tools.blender.style import Sculpture, export, make_material, reset_scene
from tools.blender.orbital_finish import finish_surface

OUTPUT = ROOT / "assets/models/benchmark"
BASE_DEPTH = 6.80
reset_scene()

shadow = make_material("Dock | Carbon seals", "obsidian", .32, .50)
hull = make_material("Dock | Naval armour", "navy", .54, .38)
steel = make_material("Dock | Blue grey alloy", "steel", .59, .41)
pearl = make_material("Dock | Ceramic enamel", "titanium", .37, .36)
trim = make_material("Dock | Cut titanium", "titanium", .76, .30)
bronze = make_material("Dock | Heat discoloured copper", "copper", .66, .42)
glass = make_material("Dock | Cobalt glazing", "steel", .63, .15, .22)
amber = make_material("Dock | Amber guides", "amber", .12, .31, 1.65)
blue = make_material("Dock | Instrument glass", "cyan", .27, .28, .78)
canopy = make_material("Dock | Polarised canopy", "navy", .57, .12)
teal = make_material("Dock | Survey enamel", "jade", .40, .28)
assemblies = []


def save_part(s, name):
    obj = s.object(name)
    for vertex in obj.data.vertices:
        vertex.co.z += BASE_DEPTH
    finish_surface(obj, reach=.72)
    assemblies.append(obj)


def polar(angle, radius, z):
    a = radians(angle)
    return (radius*cos(a), radius*sin(a), z)


def swept(s, rings, finishes):
    """Machined section swept along rings with individually finished facets."""
    n = len(rings[0])
    first = len(s.vertices)
    for ring in rings:
        s.vertices.extend(ring)
    s.face(tuple(range(first, first+n)), finishes[0])
    for i in range(len(rings)-1):
        start = first+i*n
        for j, mat in enumerate(finishes):
            k = (j+1) % n
            s.face((start+j, start+k, start+n+k, start+n+j), mat)
    last = first+(len(rings)-1)*n
    s.face(tuple(range(last, last+n)), finishes[0])


def arc(s, lo, hi, section, finishes):
    steps = max(1, ceil((hi-lo)/4))
    rings = [[polar(lo+(hi-lo)*i/steps, r, z) for r,z in section] for i in range(steps+1)]
    swept(s, rings, finishes)


def rail(s, lo, hi, radius, z, width, depth, mat):
    h, w = depth/2, width/2
    section = [(radius-w,z), (radius-w*.78,z+h), (radius+w*.78,z+h),
               (radius+w,z), (radius+w*.78,z-h), (radius-w*.78,z-h)]
    arc(s, lo, hi, section, [mat]*6)


def girder(s, start, end, width, depth, mat, edge=None):
    a, b = Vector(start), Vector(end)
    direction = (b-a).normalized()
    side = direction.cross(Vector((0,0,1)))
    if side.length < .02:
        side = Vector((1,0,0))
    side.normalize()
    up = side.cross(direction).normalized()
    profile = [(-.5,-.33),(-.39,-.5),(.39,-.5),(.5,-.33),
               (.5,.33),(.39,.5),(-.39,.5),(-.5,.33)]
    rings = [[tuple(p+side*(x*width)+up*(y*depth)) for x,y in profile] for p in (a,b)]
    swept(s, rings, [mat,mat,mat,edge or mat,mat,edge or mat,mat,mat])


def cut_panel(s, f, contour, z, thick, finish, side):
    s.loft([[f(x,y,h) for x,y in contour] for h in (z,z+thick)],side,[finish])


def access_cover(s, angle, number):
    f = frame_at(angle,14.66)
    # The cassette seam, inset service well and handle are wide enough to
    # survive minification in the orbit camera.
    rim=[(-1.06,-.28),(.72,-.28),(.98,-.09),(.98,.22),(-.91,.22),(-1.06,.09)]
    cut_panel(s,f,rim,-3.815,.024,shadow,steel)
    cut_panel(s,f,[(x*.93,y*.70) for x,y in rim],-3.791,.02,steel,trim)
    if number % 3 == 0:
        for i in range(5):
            x=-.60+i*.24
            cut_panel(s,f,[(x,-.13),(x+.095,-.13),(x+.23,.09),(x+.13,.09)],
                      -3.771,.018,shadow,hull)
    elif number % 3 == 1:
        # Quarter-turn inspection hatch with an asymmetric lift handle.
        s.lathe([(*f(-.21,0,h),r,r) for h,r in
                 [(-3.775,.22),(-3.738,.223),(-3.705,.178),(-3.701,.14)]],
                shadow,12,bands=[shadow,trim,steel])
        s.cable([(*f(-.29,0,-3.692),.025),(*f(-.27,0,-3.644),.026),
                 (*f(-.14,0,-3.644),.026),(*f(-.12,0,-3.692),.025)],bronze,6)
    else:
        for x in (-.72,.63):
            girder(s,f(x,-.09,-3.754),f(x,.085,-3.754),.054,.046,trim)
    for k in range(2 if number % 4 == 0 else 1):
        x=-1.33+k*.105
        cut_panel(s,f,[(x,-.32),(x+.052,-.32),(x+.16,-.04),(x+.10,-.04)],
                  -3.80,.013,amber if number % 4 == 0 else pearl,shadow)


def service_arc(start, bays, label):
    s = Sculpture()
    end = start + 14*bays
    for radius in (14.12,15.24):
        rail(s,start,end,radius,-6.25,.33,.32,steel)
        rail(s,start,end,radius,-4.62,.23,.30,hull)
    for i in range(bays):
        a = start+14*i
        arc(s,a+.20,a+13.80,[(13.84,-4.07),(13.96,-3.88),(15.32,-3.88),(15.64,-4.10),
              (15.64,-4.44),(15.38,-4.74),(14.09,-4.74),(13.84,-4.53)],
            [trim,steel,pearl,hull,steel,hull,shadow,hull])
        # Raised armour leaves a continuous dark joint and a satin lip along the gallery.
        arc(s,a+.78,a+12.9,[(14.10,-3.88),(14.18,-3.81),(15.14,-3.81),(15.27,-3.88)],
            [trim,steel if i%4==1 else pearl,trim,hull])
        access_cover(s,a+7,i)
        # A narrow, interrupted docking light on the inner lip, seen from above.
        if i % 2 == 0:
            rail(s,a+3.2,a+9.8,13.99,-3.878,.072,.053,shadow)
            rail(s,a+3.5,a+6.4,13.99,-3.843,.045,.028,amber)
        for radius in (14.12,15.24):
            girder(s,polar(a,radius,-6.23),polar(a+6.9,radius,-4.64),.19,.22,steel,trim)
            girder(s,polar(a+6.9,radius,-4.64),polar(a+13.95,radius,-6.23),.19,.22,hull,steel)
        girder(s,polar(a,13.93,-6.26),polar(a,15.43,-6.26),.24,.26,steel)
        if i % 2 == 0:
            arc(s,a+.4,a+1.9,[(14.00,-6.30),(14.09,-6.80),(15.20,-6.80),(15.36,-6.30)],
                [hull,steel,hull,shadow])
        rail(s,a+.6,a+13.6,14.75,-5.37,.18,.18,bronze)
        # Recessed face cassette with a short lamp; most bays are unlit.
        arc(s,a+2,a+11,[(15.64,-4.14),(15.69,-4.18),(15.69,-4.37),(15.64,-4.40)],
            [trim,shadow,hull,hull])
        if i % 3 == 1:
            rail(s,a+3.4,a+7.8,15.707,-4.26,.034,.067,amber)
        else:
            for j in range(3):
                rail(s,a+3+j*1.65,a+4.12+j*1.65,15.707,-4.26,.023,.052,steel)
    save_part(s,label)


def frame_at(angle, radius):
    """Local x follows the gallery, y points radially outward, z is deck-relative."""
    a = radians(angle)
    return lambda x,y,z: ((radius+y)*cos(a)-x*sin(a),(radius+y)*sin(a)+x*cos(a),z)


def outriggers():
    s = Sculpture()
    for angle in (90,139,180,208,270,310,350):
        f = frame_at(angle,0)
        a = radians(angle)
        inner = 9.0/max(abs(cos(a)),abs(sin(a)))
        for x in (-.57,.57):
            girder(s,f(x,inner,-2.16),f(x,14.28,-4.30),.31,.38,steel,trim)
            girder(s,f(x,inner,-3.05),f(x,14.28,-6.24),.34,.35,hull,steel)
            girder(s,f(x,inner+.19,-3.17),f(x,14.02,-4.45),.17,.19,trim)
        girder(s,f(-.76,inner+.2,-2.34),f(.76,inner+.2,-2.34),.48,.43,shadow)
        for t in (.24,.68,.81):
            r=inner+(14.28-inner)*t
            z=-2.16-2.14*t
            girder(s,f(-.76,r,z+.16),f(.76,r,z+.16),.20,.12,steel,trim)
        s.cable([(*f(0,r,z),w) for r,z,w in [(inner,-2.55,.14),(inner+.6,-2.66,.14),
                 (13.72,-4.72,.14),(14.35,-4.8,.14)]],bronze,10)
    save_part(s,"Radial load paths and umbilicals")


def drum(s, f, profile, mat, finishes, sides=24):
    s.loft([[f(x,ry*cos(2*pi*i/sides),z+rz*sin(2*pi*i/sides))
             for i in range(sides)] for x,ry,rz,z in profile], mat, finishes)


def lockhouse():
    """Pressurised gallery with separate pressure vessel, armour panels and ports."""
    s = Sculpture()
    f = frame_at(197,16.04)
    z = -3.55
    drum(s,f,[(x,r,r*.86,z) for x,r in [(-2.85,.70),(-2.72,.96),(-2.42,1.04),
          (2.42,1.04),(2.72,.95),(2.85,.72)]],hull,[trim,steel,shadow,steel,trim])
    for x in (-2.39,-.79,.81):
        drum(s,f,[(t,r,r*.86,z) for t,r in [(x,1.035),(x+.10,1.13),(x+1.43,1.13),(x+1.52,1.035)]],
             steel,[trim,pearl,steel])
        for sign in (-1,1):
            # Individual panes follow the curved shoulders of the pressure shell.
            def window(x1,x2,t1,t2,r,material):
                rings = [[f(t,sign*radius*cos(b),z+.86*radius*sin(b)) for t,b in
                         [(x1,t1),(x2,t1),(x2,t2),(x1,t2)]] for radius in (r-.035,r)]
                s.loft(rings,material)
            window(x+.18,x+1.35,.38,1.18,1.17,shadow)
            for k in range(2):
                window(x+.26+k*.54,x+.73+k*.54,.45,1.11,1.20,glass)
                window(x+.27+k*.54,x+.68+k*.54,.49,.54,1.207,blue)
            window(x+.30,x+.63,.25,.31,1.16,amber if x<0 else steel)
    for side in (-1,1):
        drum(s,f,[(side*x,r,r,z) for x,r in [(2.74,.75),(2.88,.83),(2.97,.82),
            (3.02,.67),(3.10,.66),(3.13,.52)]],shadow,[hull,trim,hull,shadow,steel])
        drum(s,f,[(side*3.13,.42,.42,z),(side*3.19,.39,.39,z),(side*3.21,.34,.34,z)],
             shadow,[trim,shadow])
        drum(s,f,[(side*3.21,.26,.26,z),(side*3.24,.22,.22,z)],glass,[glass])
        for i in range(8):
            a=i*pi/4
            y,dz=.57*cos(a),.57*sin(a)
            s.cable([(*f(side*3.09,y,z+dz),.058),(*f(side*3.15,y,z+dz),.052)],trim,6)
        for x in (1.51,2.15):
            girder(s,f(side*x,-.76,-4.16),f(side*x,-.63,-5.40),.29,.43,hull,trim)
    save_part(s,"Pressure gallery and docking collars")


def docking_arm():
    s = Sculpture()
    f = frame_at(141,15.03)
    # Split overhead capture frame. Inner copper hydraulic line is exposed between armour sleeves.
    path=[(-2.70,-4.10),(-2.80,-2.60),(-2.40,-1.60),(-1.34,-.68),(-.69,-.47)]
    for sign in (-1,1):
        for i in range(len(path)-1):
            x,z = path[i]
            u,v = path[i+1]
            girder(s,f(sign*x,0,z),f(sign*u,0,v),.72,.52,hull,steel)
            girder(s,f(sign*(x*.97),-.42,z-.10),f(sign*(u*.97),-.42,v-.10),.22,.24,trim)
            if i in (0,2):
                girder(s,f(sign*(.82*x+.18*u),-.395,.82*z+.18*v+.03),
                       f(sign*(.18*x+.82*u),-.395,.18*z+.82*v+.03),.050,.075,amber)
        s.cable([(*f(sign*(x*.88),.35,z-.17),.077) for x,z in path],bronze,10)
        # Exposed knuckle with a concentric bearing and axial retaining cap.
        x=sign*2.65
        for radius,y,length,material in [(.28,-.47,.20,hull),(.22,-.59,.11,trim),(.135,-.66,.09,bronze)]:
            s.cable([(*f(x,y,-2.56),radius),(*f(x,y-length,-2.56),radius*.90)],material,12)
        girder(s,f(sign*2.73,.15,-3.0),f(sign*2.28,1.20,-4.82),.31,.34,steel,trim)
    save_part(s,"Split capture yoke")


def heat_exchanger():
    s = Sculpture()
    f = frame_at(310,16.56)
    # Two slightly tilted banks, stepped like the blades of a turbine. The
    # central headers and dividers interrupt the specular response of each bank.
    for pos in (-1.80,1.80):
        for x in (-1.12,1.12):
            girder(s,f(pos+x,-1.65,-5.63),f(pos+x,.96,-4.57),.27,.32,hull,steel)
        for i in range(7):
            x = pos-1.31+i*.432
            rings=[]
            for dx in (-.10,.10):
                rings.append([f(x+dx+offset,y,z) for y,z,offset in [
                    (-1.30,-3.65,0),(-1.12,-3.28,.025),(.98,-3.87,.10),
                    (1.38,-4.42,.13),(1.25,-4.65,.13),(-.99,-4.03,0)]])
            swept(s,rings,[trim,hull,steel,trim,shadow,hull])
        for y,z in ((-1.34,-3.90),(1.30,-4.65)):
            girder(s,f(pos-1.58,y,z),f(pos+1.58,y,z),.20,.24,bronze,steel)
        for side in (-1,1):
            girder(s,f(pos+side*1.58,-1.38,-3.74),f(pos+side*1.58,1.44,-4.55),.18,.28,pearl,trim)
        for x in (-.90,.90):
            s.cable([(*f(pos+x,y,z),.08) for y,z in [(1.30,-4.67),(1.54,-4.71),
                     (1.72,-4.90),(1.72,-5.02)]],bronze,10)
    # Thermal manifold with an open bell mouth and recessed fan. In the game
    # camera this breaks the rectangular outline at the end of the radiators.
    def manifold(x,y,z):
        return f(x,y+1.78,z)
    z=-4.61
    drum(s,manifold,[(x,r,r,z) for x,r in [(-3.52,.52),(-3.35,.70),(-2.80,.72),
         (-2.62,.49),(2.55,.49),(2.75,.63),(3.12,.60),(3.26,.47)]],
         hull,[trim,steel,hull,steel,hull,steel,trim])
    for x in (-2.41,-1.86,-.34,1.17,2.35):
        drum(s,manifold,[(x,.51,.51,z),(x+.06,.57,.57,z),(x+.19,.56,.56,z),(x+.24,.51,.51,z)],
             hull,[trim,bronze,steel])
    for i in range(8):
        a=i*pi/4
        contour=[(.14,a),(.49,a+.27),(.49,a+.52),(.18,a+.40)]
        s.loft([[manifold(x,r*cos(t),z+r*sin(t)) for r,t in contour] for x in (-3.52,-3.55)],steel)
    drum(s,manifold,[(-3.57,.15,.15,z),(-3.63,.105,.105,z)],trim,[bronze],12)
    save_part(s,"Twin radiator banks and coolant headers")

def survey_tender():
    """Docked survey launch. The nose points along the tangent of the gallery."""
    s = Sculpture()
    f = frame_at(169,15.76)
    # A flattened lifting body lofted through seven different fuselage stations.
    def hull_shell(stations, profile, finishes):
        rings = [[f(x,y*width,z+v*height) for y,v in profile] for x,width,z,height in stations]
        swept(s,rings,finishes)

    fuselage=[(-.74,-.76),(.74,-.76),(1,-.30),(.94,.27),(.58,.79),
              (.28,1),(-.28,1),(-.58,.79),(-.94,.27),(-1,-.30)]
    hull_shell([(-2.14,.58,-2.90,.48),(-1.91,.74,-2.88,.56),(-.72,.80,-2.81,.67),
                (.48,.64,-2.78,.54),(1.42,.45,-2.87,.35),(2.29,.18,-2.92,.19),
                (2.43,.08,-2.94,.12)],fuselage,
               [shadow,hull,trim,pearl,teal,pearl,teal,pearl,trim,hull])
    windshield=[(-1,0),(1,0),(.82,.67),(.39,1),(-.39,1),(-.82,.67)]
    hull_shell([(-.74,.43,-2.39,.06),(-.48,.52,-2.38,.45),(.15,.49,-2.45,.52),
                (.82,.36,-2.53,.36),(1.35,.15,-2.60,.095)],windshield,
               [shadow,canopy,glass,canopy,glass,canopy])
    for x,width,z,height in [(-.46,.53,-2.38,.455),(.33,.47,-2.47,.48)]:
        hull_shell([(x-.028,width,z,height),(x+.028,width,z+.011,height+.007)],
                   windshield,[steel]*6)
    for side in (-1,1):
        def wing(points):
            return [(x,side*y) for x,y in points]
        wing_outline=wing([(-1.82,.53),(.31,.50),(.58,.70),(-.68,1.59),
                           (-1.32,1.79),(-2.06,1.67),(-2.04,1.46),(-1.77,1.20)])
        cut_panel(s,f,wing_outline,-3.05,.17,pearl,hull)
        cut_panel(s,f,wing([(-1.74,.76),(-.11,.68),(-.73,1.19),(-1.85,1.59)]),
                  -2.88,.018,teal,trim)
        # Separate engine petals around a recessed thrust chamber and nozzle.
        def nacelle(x,y,z):
            return f(x,side*1.21+y,z)
        drum(s,nacelle,[(x,r,r*.85,z) for x,r,z in [
            (-2.23,.34,-2.86),(-2.12,.41,-2.85),(-1.71,.44,-2.82),
            (-1.44,.40,-2.81),(-.97,.39,-2.81),(-.73,.29,-2.85),(-.62,.13,-2.88)]],
            steel,[hull,steel,trim,pearl,teal,pearl],16)
        for x in (-1.99,-1.80):
            drum(s,nacelle,[(x,.428,.365,-2.83),(x+.07,.439,.377,-2.83)],hull,[shadow],16)
        for x,r,material in [(-2.24,.26,shadow),(-2.255,.146,bronze),(-2.27,.092,blue)]:
            drum(s,nacelle,[(x+.02,r,r,-2.86),(x,r*.97,r*.97,-2.86)],material,[material],14)
        # Vertical stabilizers lean outboard at the rear.
        swept(s,[[f(x,side*y,z) for x,y,z in ring] for ring in [
            [(-1.99,1.31,-2.56),(-1.13,1.31,-2.53),(-1.10,1.40,-2.55),(-2.05,1.40,-2.58)],
            [(-2.23,1.64,-1.92),(-1.90,1.64,-1.97),(-1.91,1.70,-1.98),(-2.24,1.70,-1.93)]]],
            [teal,pearl,teal,trim])
        girder(s,f(-1.22,side*.54,-3.20),f(-1.38,side*.79,-3.78),.13,.13,steel,trim)
        girder(s,f(.85,side*.30,-3.13),f(1.03,side*.47,-3.77),.10,.13,hull,trim)
    # Cantilevered landing apron with a painted docking centreline and an
    # umbilical routed underneath. It physically joins the main gallery.
    apron=[(-2.72,-1.64),(2.28,-1.64),(2.74,-1.14),(2.74,1.51),
           (2.22,1.91),(-2.28,1.91),(-2.72,1.43)]
    cut_panel(s,f,apron,-4.19,.40,steel,hull)
    for side in (-1,1):
        girder(s,f(-2.26,side*1.41,-3.77),f(2.16,side*1.41,-3.77),.07,.034,pearl)
        girder(s,f(side*1.98,-1.84,-5.81),f(side*1.98,1.52,-4.16),.22,.28,hull,trim)
    save_part(s,"Survey launch on cantilevered apron")


def tracking_dish():
    s = Sculpture()
    f = frame_at(288,15.48)
    for side in (-1,1):
        girder(s,f(side*.72,-.56,-3.86),f(side*.49,.12,-2.72),.24,.27,hull,trim)
        girder(s,f(side*.77,.66,-3.87),f(side*.49,.12,-2.72),.21,.23,steel,pearl)
    center=Vector(f(0,.12,-2.64))
    tangent=Vector(f(1,0,0))-Vector(f(0,0,0))
    radial=Vector(f(0,1,0))-Vector(f(0,0,0))
    axis=(radial*.46+Vector((0,0,.89))).normalized()
    second=axis.cross(tangent).normalized()
    # Separate compound-curved reflector petals and their rear ribs share
    # one focus. The small open seams read against the dark back of the dish.
    def bowl(r,a,offset=0):
        return tuple(center+(tangent*cos(a)+second*sin(a))*r+axis*(.302*r*r+offset))
    for i in range(12):
        angle=i*2*pi/12
        rings=[]
        for r in (.19,.58,.99,1.43):
            lo,hi=angle+.012,angle+2*pi/12-.012
            rings.append([bowl(r,a,depth) for a,depth in [
                (lo,-.086),(lo,0),((lo+hi)*.5,0),(hi,0),(hi,-.086)]])
        swept(s,rings,[trim,pearl if i%3 else steel,pearl if i%3 else steel,trim,hull])
        s.cable([(*bowl(r,angle,-.10),w) for r,w in [(.2,.075),(.80,.046),(1.42,.031)]],bronze,7)
        if i%4==0:
            girder(s,bowl(1.27,angle,.02),tuple(center+axis*1.35),.068,.065,trim)
    s.cable([(*tuple(center+axis*d),r) for d,r in [(1.17,.13),(1.32,.18),(1.51,.09)]],bronze,12)
    s.cable([(*tuple(center+axis*d),r) for d,r in [(1.49,.094),(1.54,.069)]],blue,10)
    save_part(s,"Petal reflector and elevation cradle")


service_arc(84,9,"Port armoured service gallery")
service_arc(267,7,"Starboard thermal gallery")
outriggers()
lockhouse()
docking_arm()
heat_exchanger()
survey_tender()
tracking_dish()

# Preserve the named assemblies for editing. Merge only the runtime copy to
# batch all static geometry by material, including the baked contact shading.
assert abs(min(v.co.z for obj in assemblies for v in obj.data.vertices)) < 1e-5
bpy.context.view_layer.update()
OUTPUT.mkdir(parents=True, exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT/"kepler-service-dock.blend"),compress=True)
bpy.ops.object.select_all(action="DESELECT")
for obj in assemblies:
    obj.select_set(True)
bpy.context.view_layer.objects.active=assemblies[0]
bpy.ops.object.join()
model=bpy.context.active_object
model.name="kepler-service-dock"
model.data.calc_loop_triangles()
print("Dock triangles",len(model.data.loop_triangles),"place at Three Y =",-BASE_DEPTH)
export(model.name,[model],OUTPUT)
