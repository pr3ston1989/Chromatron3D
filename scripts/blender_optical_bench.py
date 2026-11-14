"""Rebuild the playable instrument catalog and its orthographic tray portraits."""
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

sys.path.insert(0,str(Path(__file__).resolve().parent))
from blender_sculpt import ROOT, TAU, Sculpture, export, paint

OUT = ROOT / 'public/models/optics'
PORTRAITS = ROOT / 'public/portraits'
PORTRAITS.mkdir(exist_ok=True)
KINDS = ('wall laser mirror bender filter prism doppler splitter tangler target conduit '
         'teleporter multiFilter twister complementor logicGate starburst mobileTeleporter '
         'dualReflector quadBender occupiedSquare primaryLogicGate').split()

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
brass=paint('satin brass',(.85,.47,.13),.60)
ink=paint('midnight ceramic',(.035,.078,.106),.25)
ivory=paint('porcelain',(.78,.88,.85),.29)
silver=paint('silvered glass',(.67,.88,.99),.66,.16,.13)
sea=paint('lagoon enamel',(.032,.49,.50),.35)
amber=paint('amber enamel',(.98,.26,.04),.24)
iris=paint('iris enamel',(.38,.17,.70),.30)
ruby=paint('ruby enamel',(.82,.066,.17))
glow=paint('glow',(.25,.87,1),.18,.2,.45)
jade=paint('jade',(.14,.71,.32))

def radial(path,a):
    c,s=math.cos(a),math.sin(a)
    return [(x*c-y*s,x*s+y*c,*rest) for x,y,*rest in path]

def bezel(s,kind,accent):
    oval=kind in ('mirror','bender','laser','conduit','filter','dualReflector')
    ry=.49
    rx=.34 if oval else .46
    s.lathe([(0,0,.012,rx*.83,ry*.84),(0,0,.04,rx,ry),(0,0,.09,rx*1.06,ry*1.04),
             (0,0,.115,rx*1.05,ry*1.03),(0,.025,.19,rx*.84,ry*.84),
             (0,.025,.215,rx*.73,ry*.72)],ink,32,4,.065,[ink,accent,brass,accent,ink])

def feather(s,a,reach,rise,width,accent,bend=0,base=.20):
    s.blade(radial([(.05,0,base,.036,.035),(.19,bend*.22,base+rise*.32,width*.70,.075),
                    (reach*.77,bend*.62,base+rise*.74,width,.075),
                    (reach,bend,base+rise,.012,.018)],a),accent,brass)

def crystal(s,x,y,z,r,h,n,mat,lean=0):
    s.lathe([(x,y,z,r*.48,r*.54),(x,y,z+h*.22,r,r*.92),
             (x+lean*.4,y,z+h*.65,r*.80,r*.78,.14),
             (x+lean,y+.02,z+h,r*.06,r*.06,.20)],mat,n)

def shield(s,angle,scale,curved,back):
    # An asymmetric arched escutcheon, backed by contrasting lacquer. Its
    # chamfered face and cable molding follow the same twelve-point outline.
    shape=[(-.46,.52),(-.42,.40),(-.27,.33),(.24,.33),(.40,.40),(.45,.51),
           (.45,.76),(.37,.88),(.16,.94),(-.13,.94),(-.35,.88),(-.46,.78)]
    def pos(x,y,z):
        x=(x+(y*y*1.3 if curved else 0))*scale
        y=y*scale
        return (x*math.cos(angle)-y*math.sin(angle),x*math.sin(angle)+y*math.cos(angle),z)
    s.loft([[pos(x,y*f,.65+(z-.65)*f) for y,z in shape]
            for x,f in [(.11,.86),(.066,1),(-.036,1),(-.067,.88)]],back,[back,brass,silver])
    for y in [-.32,.32]:
        s.cable([(*pos(.02,y*.46,.19),.08),(*pos(.055,y*.83,.29),.071),
                 (*pos(.055,y,.48),.045)],brass)
    s.cable([(*pos(-.041,y,z),.023) for y,z in shape+shape[:1]],brass)

def barrel(s,open_back):
    # Turned bell, constricted waist and flared lens, all along +Y.
    profile=[(-.45,.19),(-.38,.25),(-.25,.21),(-.19,.16),(.02,.15),
             (.18,.20),(.34,.22),(.41,.21),(.46,.15),(.47,.115)]
    s.loft([[(r*math.cos(TAU*i/20),y,.54+r*math.sin(TAU*i/20)) for i in range(20)]
            for y,r in profile],ink,[brass,sea,ink,sea,sea,ivory,brass,ink,glow])
    for sign in [-1,1]:
        s.blade([(sign*.12,-.41,.32,.04,.04),(sign*.23,-.21,.36,.07,.15),
                 (sign*.16,.18,.33,.05,.065),(sign*.11,.33,.27,.02,.04)],sea,brass)
    if open_back:
        s.cable([(0,-.451,.54,.145),(0,-.465,.54,.134)],glow,20)
    else:
        s.blade([(0,-.36,.69,.055,.03),(0,-.18,.76,.08,.13),(0,.11,.70,.03,.03)],amber,brass)

def portal(s,x,r,mat,lean=0):
    path=[]
    for i in range(34):
        a=TAU*i/33
        path.append((x+lean*math.sin(a)+.036*math.sin(2*a),r*math.cos(a),
                     .55+r*1.06*math.sin(a),.052+.022*(1-math.sin(a))))
    s.cable(path,mat,8)
    s.cable([(px-.024,py*.87,.55+(pz-.55)*.87,.021) for px,py,pz,_ in path],glow)

def instrument(kind):
    s=Sculpture()
    if kind=='wall':
        silhouette=[(-.51,-.35),(-.32,-.51),(.36,-.51),(.52,-.32),(.5,.4),(.33,.50),(-.38,.51),(-.52,.32)]
        s.loft([[(x*f,y*f,z) for x,y in silhouette] for f,z in
                [(.88,.01),(1,.08),(.94,.29),(.90,.34),(.94,.37),(.78,.43)]],ink,[ink,ink,brass,ink,sea])
        for i in [-1,0,1]:
            s.blade([(-.29,i*.17-.05,.44,.023,.018),(-.08,i*.17,.45,.041,.033),
                     (.28,i*.17+.05,.44,.023,.018)],ink,brass)
        return s
    accent=amber if kind in ('splitter','starburst','twister','quadBender') else iris if kind in (
        'tangler','doppler','complementor','mobileTeleporter','teleporter') else sea
    bezel(s,kind,accent)
    if kind in ('mirror','bender','dualReflector'):
        shield(s,0,1,kind=='bender',accent)
        if kind=='bender':
            feather(s,0,.48,.47,.095,sea,.08)
        if kind=='dualReflector':
            shield(s,math.pi,.77,False,silver)
    elif kind=='splitter':
        # A forked amber tuning yoke with a daylight gap between the two tips.
        for sign in [-1,1]:
            s.blade([(0,-.41,.32,.065,.075),(sign*.04,-.18,.49,.094,.13),
                     (sign*.20,.06,.67,.095,.12),(sign*.28,.27,.78,.072,.075),
                     (sign*.27,.43,.84,.023,.029)],amber,brass)
            s.cable([(sign*.031,-.22,.58,.024),(sign*.16,.03,.75,.026),
                     (sign*.27,.29,.865,.020)],ivory)
        crystal(s,0,0,.27,.138,.40,4,silver)
    elif kind in ('laser','conduit'):
        barrel(s,kind=='conduit')
    elif kind in ('teleporter','mobileTeleporter','tangler','doppler'):
        if kind=='tangler':
            portal(s,-.17,.24,iris,.11)
            portal(s,.17,.24,sea,-.11)
        elif kind=='doppler':
            for i,r in enumerate([.17,.24,.30]):
                portal(s,(i-1)*.17,r,[brass,iris,sea][i])
        else:
            portal(s,0,.37,iris,.12)
            if kind=='mobileTeleporter':
                for sign in [-1,1]:
                    s.blade([(sign*.29,-.48,.14,.015,.06),(sign*.31,-.28,.09,.08,.06),
                             (sign*.31,.28,.09,.08,.06),(sign*.29,.50,.17,.02,.05)],ivory,brass)
    elif kind in ('prism','target','complementor'):
        n={'prism':3,'target':8,'complementor':5}[kind]
        if kind=='target':
            # Upward-facing scalloped receiving dish with a deep colored iris.
            s.lathe([(0,0,.19,.17,.17),(0,0,.30,.21,.21),(0,0,.43,.40,.40),
                     (0,0,.51,.46,.46),(0,0,.55,.42,.42),(0,0,.40,.26,.26),
                     (0,0,.39,.18,.18)],sea,32,8,.07,[sea,ivory,sea,brass,ivory,glow])
            crystal(s,0,0,.39,.16,.23,n,glow)
        else:
            crystal(s,.02,0,.21,.37,.69,n,silver if kind=='prism' else iris,.065)
            for i in range(n if kind=='prism' else 2):
                feather(s,TAU*i/(n if kind=='prism' else 2),.40,.29 if kind=='prism' else .56,.07,brass,.09)
    elif kind in ('filter','multiFilter'):
        if kind=='filter':
            portal(s,0,.31,sea)
            s.loft([[(x,.25*math.cos(TAU*i/12),.55+.25*math.sin(TAU*i/12))
                     for i in range(12)] for x in [-.025,.025]],glow)
        else:
            for i,mat in enumerate([ruby,jade,silver,ivory]):
                feather(s,TAU*i/4,.42,.44,.122,mat,.12)
            crystal(s,0,0,.23,.17,.40,8,brass)
    elif kind in ('logicGate','primaryLogicGate'):
        for sign in [-1,1]:
            s.cable([(sign*.38,-.36,.34,.115),(sign*.26,-.21,.42,.098),
                     (sign*.13,-.09,.50,.076),(0,.02,.53,.09)],sea if sign<0 else brass)
        s.cable([(0,.01,.53,.14),(0,.23,.56,.12),(0,.47,.56,.09)],ivory)
        crystal(s,0,0,.44,.21,.34,3 if kind=='primaryLogicGate' else 6,
                ruby if kind=='primaryLogicGate' else jade)
    elif kind in ('twister','starburst','quadBender'):
        n={'twister':5,'starburst':8,'quadBender':4}[kind]
        for i in range(n):
            feather(s,i*TAU/n,.45,.42,.08 if n==8 else .112,
                    [amber,ivory][i%2],{'twister':.27,'starburst':0,'quadBender':-.17}[kind])
        crystal(s,0,0,.25,.145,.28,6,brass)
    elif kind=='occupiedSquare':
        for i in range(4):
            feather(s,TAU*(i+.5)/4,.38,.045,.054,brass)
    return s


def portrait(scene,obj):
    scene.camera.location=(-1.9,-2.0,2.65)
    scene.camera.rotation_euler=(Vector((0,0,.40))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(PORTRAITS/(obj.name+'.png'))
    bpy.ops.render.render(write_still=True)

scene=bpy.context.scene
scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.light='STUDIO'
scene.display.shading.color_type='MATERIAL'
scene.display.shading.show_shadows=True
scene.display.shading.show_cavity=True
scene.display.shading.cavity_type='WORLD'
scene.render.film_transparent=True
scene.render.resolution_x=scene.render.resolution_y=128
scene.render.resolution_percentage=100
bpy.ops.object.camera_add()
scene.camera=bpy.context.object
scene.camera.data.type='ORTHO'
scene.camera.data.ortho_scale=1.44
# Keep an editable Blender object for each design in the source catalog.
for index,kind in enumerate(KINDS):
    obj=instrument(kind).object(kind)
    export(kind,[obj],OUT)
    portrait(scene,obj)
    obj.hide_render=True
    obj.location=((index%5-2)*1.6,(2-index//5)*1.7,0)
for obj in scene.objects:
    obj.hide_render=False
scene.camera.data.ortho_scale=10.6
scene.camera.location=(-3,-6,12)
scene.camera.rotation_euler=(Vector((0,0,.35))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_distance=12
            area.spaces.active.region_3d.view_rotation=scene.camera.rotation_euler.to_quaternion()
            area.spaces.active.shading.color_type='MATERIAL'
            area.spaces.active.overlay.show_floor=False
scene.render.filepath='//instrument-catalog.png'
scene.render.resolution_x=scene.render.resolution_y=1024
bpy.ops.object.select_all(action='DESELECT')
source=ROOT/'art'
source.mkdir(exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(source/'Instruments.blend'),compress=True)
