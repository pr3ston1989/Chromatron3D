"""Build the 22 optical instruments, in board units. Blender +Y is north."""
import bpy
import math
from mathutils import Vector
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'public/models/optics'
OUT.mkdir(parents=True, exist_ok=True)
TAU = math.tau
KINDS = ('wall laser mirror bender filter prism doppler splitter tangler target conduit '
         'teleporter multiFilter twister complementor logicGate starburst mobileTeleporter '
         'dualReflector quadBender occupiedSquare primaryLogicGate').split()


def material(name, rgb, metal, roughness, emission=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    for key, value in [('Base Color', (*rgb, 1)), ('Metallic', metal), ('Roughness', roughness),
                       ('Emission Color', (*rgb, 1)), ('Emission Strength', emission)]:
        shader.inputs[key].default_value = value
    return mat


def finish(mat, bevel=0):
    obj = bpy.context.object
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Machined edge', 'BEVEL')
        mod.width, mod.segments = bevel, 2
        bpy.ops.object.modifier_apply(modifier=mod.name)
        mod = obj.modifiers.new('Face normals', 'WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def block(position, dimensions, mat, angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position)
    obj = bpy.context.object
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler.z = angle
    return finish(mat, .018)


def tube(start, end, radius, mat, rim=None, sides=16):
    a, b = Vector(start), Vector(end)
    bpy.ops.mesh.primitive_cone_add(vertices=sides, radius1=radius,
        radius2=radius if rim is None else rim, depth=(b-a).length, location=(a+b)/2)
    obj = bpy.context.object
    obj.rotation_euler = (b-a).to_track_quat('Z', 'Y').to_euler()
    return finish(mat, .006)


def disk(z, height, radius, mat, rim=None, sides=24):
    return tube((0, 0, z), (0, 0, z+height), radius, mat, rim, sides)


def hoop(center, radius, thickness, mat, normal=(0, 0, 1)):
    bpy.ops.mesh.primitive_torus_add(location=center, major_radius=radius, minor_radius=thickness,
                                     major_segments=32, minor_segments=8)
    bpy.context.object.rotation_euler = Vector(normal).to_track_quat('Z', 'Y').to_euler()
    return finish(mat)


def jewel(position, radius, height, mat, sides=6):
    x, y, z = position
    tube((x,y,z), (x,y,z+height*.47), radius*.42, mat, radius, sides)
    tube((x,y,z+height*.47), (x,y,z+height), radius, mat, .015, sides)


def instrument(kind):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    enamel = material('petrol enamel', (.032,.115,.14), .48,.28)
    brass = material('champagne brass', (.64,.38,.15), .78,.28)
    steel = material('silver', (.55,.77,.8), .81,.17)
    dark = material('ebonite', (.022,.038,.053), .31,.39)
    glow = material('glow', (.18,.8,.89), .24,.2, .65)
    opal = material('opal', (.38,.62,.93), .43,.18, .18)
    if kind == 'wall':
        block((0,0,.28), (.94,.91,.55), enamel)
        block((0,0,.57), (1,.98,.10), brass)
        for i in range(-2,3):
            block((i*.16,0,.65), (.082,.72,.08), dark)
        for x in [-.38,.38]:
            for y in [-.36,.36]: tube((x,y,.6),(x,y,.67),.045,steel,sides=6)
    else:
        disk(0,.09,.50,dark,.54,16)
        disk(.09,.12,.54,enamel,.43,16)
        hoop((0,0,.13),.49,.022,brass)
        disk(.2,.028,.42,brass)
        disk(.228,.035,.37,dark)
        for i in range(8):
            a=i*TAU/8
            block((.396*math.sin(a),.396*math.cos(a),.247),(.028,.077,.021),
                  glow if i==0 else steel,-a)
        if kind in ('mirror','dualReflector','bender','quadBender','filter','splitter'):
            bent=kind in ('bender','quadBender')
            disk(.25,.18,.14,brass,.11)
            for y in [-.39,.39]:
                block((0,y,.54),(.14,.085,.48),brass)
            if bent:
                for side in [-1,1]:
                    block((-.03,side*.20,.65),(.08,.42,.5),steel,side*.28)
                hoop((0,0,.36),.17,.028,brass)
            else:
                block((0,0,.66),(.075,.75,.5),glow if kind=='filter' else steel)
            if kind in ('mirror','bender'):
                block((.075,0,.65),(.07,.71,.48),dark)
            if kind=='splitter':
                for y in [-.18,0,.18]: block((-.05,y,.67),(.02,.024,.47),opal)
            block((0,0,.93),(.13,.83,.052),brass)
        elif kind in ('laser','conduit'):
            z=.53
            tube((0,-.34,z),(0,.47,z),.19,enamel,.145)
            for y in [-.27,-.14,0,.31,.46]:
                hoop((0,y,z),.176,.032,brass if y>0 else steel,(0,1,0))
            for y in ([.48] if kind=='laser' else [-.355,.48]):
                tube((0,y,z),(0,y+.018,z),.12,glow)
            disk(.24,.19,.17,dark,.13)
        elif kind in ('teleporter','mobileTeleporter','tangler','doppler','complementor'):
            twin=kind=='tangler'
            for x in ([-.19,.19] if twin else [0]):
                r=.246 if twin else .34
                axis=(0,1,0) if twin else (1,0,0)
                hoop((x,0,.62),r,.055,enamel,axis)
                hoop((x,0,.62),r-.06,.027,glow,axis)
                for sign in [-1,1]:
                    tube((x,sign*.18,.25),(x,sign*.22,.46),.046,brass)
            if kind=='complementor':
                jewel((0,0,.42),.16,.39,opal)
            if kind=='doppler':
                for i in [-1,1]: hoop((i*.145,0,.62),.235,.027,brass,(1,0,0))
            if kind=='mobileTeleporter':
                for x in [-.32,.32]: block((x,0,.13),(.14,.87,.12),steel)
        elif kind in ('logicGate','primaryLogicGate'):
            for x in [-.37,.37]:
                tube((x,-.34,.39),(0,0,.57),.102,brass,.074)
            tube((0,0,.55),(0,.45,.55),.14,enamel,.09)
            jewel((0,0,.49),.16,.32,glow,3 if kind=='primaryLogicGate' else 6)
        elif kind in ('prism','target','starburst','multiFilter'):
            jewel((0,0,.26),.34,.68,glow if kind=='target' else opal,3 if kind=='prism' else 6)
            if kind=='target': hoop((0,0,.44),.35,.033,brass)
            if kind=='multiFilter':
                filters=[material('ruby',(.8,.07,.06),.3,.2), material('jade',(.04,.7,.24),.3,.2), opal, steel]
            if kind in ('multiFilter','starburst'):
                for i in range(4 if kind=='multiFilter' else 8):
                    a=i*TAU/(4 if kind=='multiFilter' else 8)
                    mat=filters[i] if kind=='multiFilter' else brass
                    tube((.18*math.sin(a),.18*math.cos(a),.48),
                         (.42*math.sin(a),.42*math.cos(a),.63),.072,mat,.028)
        elif kind=='twister':
            for i in range(8):
                a=i*TAU/8
                block((.22*math.cos(a),.22*math.sin(a),.51),(.37,.095,.24),brass,a+.68)
            jewel((0,0,.32),.16,.45,opal)
        elif kind=='occupiedSquare':
            for a in [math.pi/4,-math.pi/4]: block((0,0,.28),(.65,.075,.035),brass,a)
    # One object / material primitives, shared across every instance of this instrument.
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active=bpy.context.selected_objects[0]
    bpy.ops.object.join()
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    bpy.context.object.name=kind
    bpy.ops.export_scene.gltf(filepath=str(OUT/(kind+'.glb')),use_selection=True,
                              export_format='GLB',export_yup=True)


for kind in KINDS:
    instrument(kind)
