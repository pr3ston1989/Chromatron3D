"""Four miniature habitats for the near edge of the optical table."""
import math
import random
import sys
from pathlib import Path
import bpy

sys.path.insert(0,str(Path(__file__).resolve().parent))
from blender_sculpt import ROOT, TAU, Sculpture, export, paint

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
bark=paint('carved cedar',(.31,.125,.056),.03,.76)
gold=paint('pollen',(.97,.58,.09),.10)
linen=paint('canvas',(.93,.81,.58),.08)
pool=paint('glacial water',(.04,.59,.68),.32,.2)
palettes={
    'verdant':[(.20,.41,.13),(.095,.33,.105),(.30,.64,.12),(.99,.49,.40)],
    'orbital':[(.48,.29,.15),(.40,.15,.05),(.85,.39,.075),(.98,.75,.24)],
    'polar':[(.38,.60,.66),(.095,.32,.41),(.45,.77,.80),(.85,.95,1)],
    'nebula':[(.21,.15,.35),(.24,.08,.36),(.64,.24,.57),(.54,.85,.96)]}

def bloom(s,x,y,z,r,n,mat):
    for i in range(n):
        a=TAU*i/n
        c,d=math.cos(a),math.sin(a)
        s.blade([(x,y,z,.015,.014),(x+r*.52*c,y+r*.52*d,z+r*.12,r*.29,r*.16),
                 (x+r*c,y+r*d,z+r*.35,r*.08,r*.08)],mat,mat)
    s.lathe([(x,y,z+.035,r*.20,r*.20),(x,y,z+.085,r*.18,r*.18)],gold,7)

def island(s,rng,land,leaf):
    n=23
    radii=[rng.uniform(.90,1.08) for _ in range(n)]
    s.loft([[(math.cos(i*TAU/n)*r*f*2.30,math.sin(i*TAU/n)*r*f*1.06,
              z+.07*math.sin(i*2.08)) for i,r in enumerate(radii)]
            for z,f in [(-.78,.54),(-.51,.90),(-.27,1),(-.14,1.03),(.04,.92)]],
            bark,[bark,land,bark,leaf])
    s.lathe([(.71,-.21,.045,.53,.41),(.71,-.21,.077,.51,.39)],pool,21,3,.09)
    for x,y in [(1.52,.31),(1.72,.12),(1.83,-.14),(-.03,-.49),(-1.65,.22)]:
        r=rng.uniform(.15,.27)
        s.lathe([(x,y,.01,r,r*.81),(x+.04,y,.13,r*.92,r*.77),
                 (x+.07,y,.24,r*.5,r*.45)],land,7,3,.08)

def tree(s,x,y,h,rng,deep,light,petal,biome):
    s.cable([(x-.12,y,.02,.24),(x+.045,y,.30,.20),(x-.08,y,.72,.14),
             (x+.09,y+.04,h*.76,.105),(x+.14,y,h,.04)],bark)
    for j in range(5):
        a=j*TAU/5+.23
        c,d=math.cos(a),math.sin(a)
        if biome=='polar':
            s.lathe([(x+c*.22,y+d*.22,.04,.18,.20),
                     (x+c*.32,y+d*.30,.51,.22,.18),
                     (x+c*.45,y+d*.41,.90+.22*c,.025,.027)],light,5)
        else:
            s.cable([(x,y,h*.39,.125),(x+.27*c,y+.27*d,h*.65,.09),
                     (x+.47*c,y+.47*d,h*.75,.048)],bark)
    # Layered canopies have scalloped edges, bent leaves, open spaces and a
    # lighter, ridged upper surface. The polar spruce has narrower needles.
    for layer in range(3):
        r=(.88-layer*.18)*(.80 if biome=='polar' else 1)
        for i in range(11):
            a=TAU*(i+.45*layer)/11
            c,d=math.cos(a),math.sin(a)
            z=h*.88+layer*.23+rng.uniform(-.055,.055)
            q=r*rng.uniform(.88,1.13)
            s.blade([(x-.06*c,y-.06*d,z,.045,.12),
                     (x+.37*q*c,y+.37*q*d,z+.105,q*.32,.14),
                     (x+.76*q*c,y+.76*q*d,z-.08,q*.30,.105),
                     (x+q*c,y+q*d,z-.29,q*.032,.045)],
                    light if (i+layer)%4==0 or layer==2 else deep,deep)
    if biome=='nebula':
        bloom(s,x,y,h*.88+.61,.35,6,petal)

def wheel(mat,axis_height):
    m=Sculpture()
    for i in range(5):
        a=TAU*i/5
        path=[(.035,0,.037,.03),(.26,.025,.06,.07),(.46,.113,.105,.10),(.57,.16,.035,.058)]
        # The rotor is modeled in XY; its pivot is rotated into the vertical plane at export.
        m.blade([(r*math.cos(a)-bend*math.sin(a),r*math.sin(a)+bend*math.cos(a),
                  .01,w,h) for r,bend,w,h in path],mat,gold)
    m.lathe([(0,0,-.06,.12,.12),(0,0,.075,.086,.086)],gold,12)
    obj=m.object('windwheel')
    obj.location=(.08,-.42,axis_height)
    obj.rotation_euler.x=math.pi/2
    return obj

for theme,colors in palettes.items():
    rng=random.Random(17)
    land,deep,light,petal=[paint(theme+' '+n,rgb,.05,.55) for n,rgb in zip(
        ('stone','shadow leaves','sunlit leaves','flowers'),colors)]
    s=Sculpture()
    island(s,rng,land,deep)
    tree(s,-1.01,.05,1.34,rng,deep,light,petal,theme)
    if theme in ('polar','verdant'):
        tree(s,1.38,.42,.73,rng,deep,light,petal,theme)
    # Small glazed observatory with tapered sides and a folded overhanging roof.
    s.lathe([(.08,0,.05,.40,.35),(.08,0,.16,.43,.38),(.08,.01,.70,.34,.30),
             (.08,.01,.83,.32,.27)],linen,12,4,.08,[land,linen,land])
    s.lathe([(.08,0,.80,.45,.38),(.08,0,.88,.46,.39),(.03,0,1.12,.35,.29),
             (-.04,.05,1.35,.17,.15),(-.02,.09,1.45,.045,.04)],deep,12,6,.09,[gold,deep,light,deep])
    for i in range(18):
        a=TAU*i/18
        x=math.cos(a)*rng.uniform(1.15,1.87)
        y=math.sin(a)*rng.uniform(.54,.85)
        r=rng.uniform(.13,.22)
        bloom(s,x,y,.10,r,5,petal)
        for j in [-1,1]:
            s.blade([(x,y,.075,.018,.02),(x+j*.105,y+.07,.18,.047,.026),
                     (x+j*.16,y+.13,.24,.007,.01)],light,deep)
    # Three indexed meshes replace the old scattered cubes and cones in the
    # landscape. Vertex colours retain different finishes in one instanced draw.
    rock,feature,growth=Sculpture(),Sculpture(),Sculpture()
    rock.lathe([(-.12,.03,-.30,.64,.53),(-.05,0,-.12,.96,.78),
                (.03,0,.30,.82,.73,.13),(.19,.06,.65,.49,.42,.24),
                (.20,.08,.71,.26,.21)],land,9,3,.14,[bark,land,land,deep])
    if theme in ('verdant','orbital'):
        tree(feature,0,0,1.45,rng,deep,light,petal,theme)
    else:
        for j in range(5):
            a=TAU*j/5
            r=.32 if j==0 else .17
            x,y=.31*math.cos(a),.31*math.sin(a)
            feature.lathe([(x,y,-.12,r*.7,r*.7),(x,y,.04,r,r),
                           (x*1.28,y*1.28,.60+r,r*.83,r*.8),
                           (x*1.65,y*1.65,.71+r*2.8,.015,.018)],
                          light,5,0,0,[land,deep,light])
    for j in range(6):
        a=TAU*j/6
        c,d=math.cos(a),math.sin(a)
        growth.blade([(0,0,0,.025,.015),(.18*c,.18*d,.15,.095,.045),
                      (.32*c,.32*d,.32,.07,.04),(.40*c,.40*d,.39,.012,.015)],deep,light)
    bloom(growth,0,0,.28,.24,5,petal)
    plants=[]
    for name,shape in [('stone',rock),('feature',feature),('growth',growth)]:
        obj=shape.object(name)
        color=obj.data.color_attributes.new(name='Pigment',type='BYTE_COLOR',domain='CORNER')
        for face in obj.data.polygons:
            rgb=obj.data.materials[face.material_index].diffuse_color
            for corner in face.loop_indices:
                color.data[corner].color=rgb
        obj.data.materials.clear()
        plants.append(obj)
    export(theme+'-flora',plants,ROOT/'public/models/terraces')
    for obj in plants:
        bpy.data.objects.remove(obj,do_unlink=True)
    root=s.object('terrace-'+theme)
    rotor=wheel(petal if theme=='nebula' else linen,.82)
    export(theme,[root,rotor],ROOT/'public/models/terraces')
    for obj in (root,rotor):
        bpy.data.objects.remove(obj,do_unlink=True)

# Each cell is a low crowned ceramic slab with clipped corners and two beveled
# shoulders. Export one material so Three can draw the entire deck in one batch.
slab=Sculpture()
edge=[(-.62,-.51),(-.51,-.62),(.51,-.62),(.62,-.51),
      (.62,.51),(.51,.62),(-.51,.62),(-.62,.51)]
slab.loft([[(x*f,y*f,z) for x,y in edge] for f,z in [
    (.91,-.11),(1,-.066),(1,.061),(.965,.098),(.91,.109)]],linen)
tile=slab.object('board-cell')
# Planar UVs preserve the brushed finish on the tiled upper surface.
uv=tile.data.uv_layers.new(name='Surface')
for loop in tile.data.loops:
    co=tile.data.vertices[loop.vertex_index].co
    uv.data[loop.index].uv=(co.x/1.24+.5,co.y/1.24+.5)
export('board-cell',[tile],ROOT/'public/models')
