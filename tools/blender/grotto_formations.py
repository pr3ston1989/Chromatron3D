"""Cut amethyst geode and a fault shelf. Dimensions in Blender metres."""
from math import cos, sin, sqrt, tau
from random import Random

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

from tools.blender.style import export_model, render, reset_scene, Sculpture


def pigment(hex_color):
    srgb = bytes.fromhex(hex_color)
    return Vector(tuple(((v / 255 + .055) / 1.055) ** 2.4 for v in srgb))


SHALE, SLATE, LIP = map(pigment, ("28283D", "4C424F", "706370"))
CAVITY, AGATE, QUARTZ = map(pigment, ("362440", "846783", "AE94A5"))
AMETHYST, VIOLET, LILAC = map(pigment, ("694490", "8963AE", "BB9CCD"))


def finish(name, roughness, coat):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Coat Weight"].default_value = coat
    shader.inputs["Coat Roughness"].default_value = .23
    color = material.node_tree.nodes.new("ShaderNodeVertexColor")
    color.layer_name = "Mineral pigment"
    material.node_tree.links.new(color.outputs["Color"], shader.inputs["Base Color"])
    return material


class Formation(Sculpture):
    def __init__(self):
        super().__init__()
        self.colors = []
        self.rock = finish("Fractured slate", .84, 0)
        self.agate = finish("Banded chalcedony", .51, .12)
        self.gem = finish("Amethyst growth faces", .24, .32)

    def point(self, position, color):
        self.vertices.append(tuple(position))
        self.colors.append(tuple(color) + (1,))
        return len(self.vertices) - 1

    def connect(self, lower, upper, material, *, split=False):
        for i in range(len(lower)):
            j = (i + 1) % len(lower)
            a, b, c, d = lower[i], lower[j], upper[j], upper[i]
            if split:
                self.face((a, b, d), material)
                self.face((d, b, c), material)
            else:
                self.face((a, b, c, d), material)

    def object(self, name):
        model = super().object(name)
        mesh = model.data
        pigment_layer = mesh.color_attributes.new(name="Mineral pigment", type="BYTE_COLOR", domain="CORNER")
        coords = [v.co.copy() for v in mesh.vertices]
        tree = BVHTree.FromPolygons(coords, [tuple(p.vertices) for p in mesh.polygons])
        # Bake contact shading once; neighbouring crystals shadow the fracture
        # without a real-time shadow map. Inset samples avoid cracks along edges.
        samples = []
        for i in range(20):
            z = (i+.5)/20
            r = sqrt(1-z*z)
            samples.append((r*cos(i*2.39996),r*sin(i*2.39996),z))
        for face in mesh.polygons:
            n = face.normal
            tangent = n.orthogonal().normalized()
            bitangent = n.cross(tangent)
            directions = [tangent*x+bitangent*y+n*z for x,y,z in samples]
            for corner in face.loop_indices:
                index = mesh.loops[corner].vertex_index
                start = coords[index].lerp(face.center,.10)+.018*n
                shade = 0
                for direction in directions:
                    _, _, _, dist = tree.ray_cast(start,direction,2.7)
                    if dist is not None:
                        shade += 1-dist/2.7
                ao = 1-.81*shade/len(directions)
                pigment_layer.data[corner].color = (*[v*ao for v in self.colors[index][:3]],1)
        mesh.color_attributes.active_color = pigment_layer
        return model


def bedrock(shape, center, radii, top, phase):
    """A sheared cliff with a discontinuous mineral seam below the crown."""
    rng = Random(phase)
    footprint = []
    for i in range(13):
        angle = tau * (i + rng.uniform(-.18, .18)) / 13
        footprint.append((cos(angle) * rng.uniform(.87, 1.08), sin(angle) * rng.uniform(.88, 1.1),
                          rng.uniform(-.24, .24), rng.uniform(.78, 1.08)))
    layers = [
        (1.12, -9, SHALE*.47), (1.23, -4.8, SHALE*.69), (1.04, -1.6, SLATE*.72),
        (.97, .46*top, SHALE), (1.05, .62*top, SLATE),
        (1.02, .67*top, LIP), (.98, .71*top, SLATE),
        (1.03, .85*top, SHALE), (.82, top, SLATE),
    ]
    previous = None
    for layer, (scale, height, color) in enumerate(layers):
        ring = []
        for i, (x, y, warp, value) in enumerate(footprint):
            exposure = .5 + .5*cos(i*1.60+phase)
            slip = (.27 + .12*value) * sin(layer*.66+phase)
            fracture = .12*sin(2.55*i+.74*layer) + .09*cos(1.52*i-layer*.70)
            r = scale + fracture
            lift = (warp*2.4 + .62*x - .48*y + .32*sin(i+phase)) if layer else 0
            if layer in (4,5,6):
                lift += (exposure-.5)*.42
            face_color = color.lerp(SLATE*.65, exposure) if layer == 5 else color
            ring.append(shape.point((center[0] + radii[0]*(r*x + slip),
                                     center[1] + radii[1]*(r*y+.12*cos(layer*.73)),
                                     height + lift), face_color*value))
        if previous is None:
            shape.face(tuple(reversed(ring)), shape.rock)
        else:
            shape.connect(previous, ring, shape.rock, split=True)
        previous = ring
    crown = shape.point((*center, top + .18), SLATE)
    for i, a in enumerate(previous):
        shape.face((a, previous[(i+1) % len(previous)], crown), shape.rock)


def crystal(shape, base, axis, radius, phase, tone):
    """A hexagonal prism with an off-axis termination and a smoky root."""
    base, axis = Vector(base), Vector(axis)
    direction = axis.normalized()
    side = direction.cross(Vector((0, 1, 0))).normalized()
    cross = direction.cross(side)
    rings = []
    profile = [(0, .68, CAVITY), (.20, 1, tone * .70), (.72, .95, tone)]
    if axis.length < 1.1:
        profile = [(0,.88,tone*.54),(.63,.95,tone)]
    for height, scale, color in profile:
        ring = []
        for i in range(6):
            a = phase + i * tau/6
            offset = side * cos(a) + cross * (.84 * sin(a))
            h = height + (.045 * cos(a + .7) if height else 0)
            ring.append(shape.point(base + axis*h + offset*radius*scale,
                                    color * (.89 + .14*cos(a-.4))))
        if rings:
            shape.connect(rings[-1], ring, shape.gem)
        else:
            shape.face(tuple(reversed(ring)), shape.gem)
        rings.append(ring)
    tip = shape.point(base + axis + side * (.22 * radius), tone.lerp(LILAC, .42))
    for i, a in enumerate(rings[-1]):
        shape.face((a, rings[-1][(i+1) % 6], tip), shape.gem)


# Outline of the broken nodule, read from the front. Radius and local depth
# vary independently so the mineral bands follow the shell even around a chip.
OUTLINE = [(1,.06),(.93,.41),(.64,.81),(.36,.86),(.17,1.03),(-.15,.95),
           (-.55,.74),(-.88,.47),(-1.03,.12),(-.98,-.27),(-.79,-.61),
           (-.47,-.84),(-.12,-.88),(.22,-.83),(.52,-.64),(.82,-.41)]


def wall_position(x, h, depth):
    # Tilt the opening upwards so the hollow is visible at the game's camera pitch.
    return Vector((x * 4.05 - .32*h, .97*h + depth, 4.85 + 2.81*h + .33*depth))


def geode(shape):
    bedrock(shape, (-.10, .35), (5.25, 3.48), 3.15, 19)
    # Closed rear, outer rind, cut agate band and recessed druse lining.
    sections = [
        (.60, 2.45, SHALE, shape.rock), (.94, 1.62, SLATE, shape.rock),
        (1.05, .48, SHALE, shape.rock), (1, -.32, SLATE, shape.rock),
        (.93, -.58, AGATE, shape.agate), (.88, -.57, QUARTZ, shape.agate),
        (.83, -.51, AGATE, shape.agate), (.78, -.48, QUARTZ*.78, shape.agate),
        (.74, -.36, AMETHYST, shape.agate), (.63, .11, CAVITY, shape.agate),
        (.47, .60, AMETHYST*.35, shape.rock), (.22, .91, CAVITY*.54, shape.rock),
    ]
    previous = None
    for k, (radius, depth, color, material) in enumerate(sections):
        ring = []
        for i, (x, h) in enumerate(OUTLINE):
            irregular = .14*sin(i*1.79) + .08*cos(i*3.03)
            notch = .08*cos(3.1*i)/(1+abs(k-3))
            p = wall_position(x * (radius+notch), h * radius, depth + irregular)
            ring.append(shape.point(p, color * (.90+.13*sin(i*2.28))))
        if previous is None:
            shape.face(tuple(reversed(ring)), material)
        else:
            shape.connect(previous, ring, material, split=True)
        previous = ring
    center = shape.point(wall_position(0, 0, 1.05), CAVITY*.48)
    for i, a in enumerate(previous):
        shape.face((a, previous[(i+1) % len(previous)], center), shape.rock)

    rng = Random(263)
    for i, (x, h) in enumerate(OUTLINE):
        # Interrupted clusters leave some dark cavity and exposed agate readable.
        if i in (1, 2, 5, 8, 11, 15):
            continue
        for t in (.19, .64):
            nx, nh = OUTLINE[(i+1) % len(OUTLINE)]
            u, v = x + (nx-x)*t, h + (nh-h)*t
            seat = wall_position(.69*u, .69*v, -.17)
            axis = Vector((-u + .15, -.67, -.91*v + .19)).normalized()
            length = rng.uniform(.58, 1.18) * (1.20 if h < 0 else .88)
            crystal(shape, seat, axis * length, length*rng.uniform(.17,.24),
                    i*.72+t, AMETHYST.lerp(VIOLET,rng.random()))
    for x, y, z, dx, height, r in [(-3.04,-.9,2.87,-.67,1.55,.32),
            (-3.40,-.85,2.91,-.84,1.07,.24),(-2.83,-1.15,2.95,.02,.97,.23),
            (2.59,-.93,3.04,.53,1.35,.31),(2.92,-.78,3.02,.70,.83,.21)]:
        crystal(shape,(x,y,z),(dx,-.30,height),r,x,VIOLET)
    for x, h in [(-.42,.27),(-.38,.13),(-.49,.01),(.28,-.26),(.38,-.21),(.46,-.11)]:
        # A few small terminations carry the druse into the recessed wall.
        axis = (.12-x*.24, -.54, .28-h*.35)
        crystal(shape,wall_position(x,h,.54),axis,.14,2*x,VIOLET*.78)


def fault_shelf(shape):
    bedrock(shape, (-1.44,.48), (4.34,2.74), 3.67, 75)
    bedrock(shape, (2.41,-.57), (3.17,2.69), 2.36, 43)
    # Three exposed pockets of differing height along one diagonal fault.
    pockets = [(-2.35,.68,3.62,3.29,-.19),(-.30,-.13,3.64,1.98,.31),
               (2.84,-1.00,2.35,2.26,.40),(4.03,-.49,2.45,.85,.32)]
    for j, (x, y, z, height, lean) in enumerate(pockets):
        fan = [(0,0,lean,-.14,1,.16),(-.47,.11,-.56,.12,.72,.145),
               (.39,.16,.56,.20,.61,.14),(-.14,-.49,-.24,-.57,.52,.14),
               (.29,-.38,.52,-.44,.39,.125),(-.32,.38,-.40,.35,.46,.14)]
        for i, (dx,dy,ax,ay,h,r) in enumerate(fan):
            length = height*h
            crystal(shape,(x+dx*height*.42,y+dy*height*.42,z-.10),
                    (length*ax,length*ay,length),length*r+.05,1.3*j+.52*i,
                    AMETHYST.lerp(VIOLET, (.79*i+.24*j)%1))


def escarpment(shape):
    """Interlocking basalt columns above a deep wall on the far side of the cave."""
    path = [(-13,3,4.6),(-11,2.4,5.3),(-9,2.2,6.8),(-7,2.5,5.9),(-5,1.1,4.9),
            (-3,1.4,5.4),(-1,.8,4.3),(1,.2,4.4),(3,-.3,5.2),(5,.2,4.9),
            (7,.4,6.2),(9,1.1,7.6),(11,1.8,6.2),(13,2.6,5.6)]
    rng = Random(963)
    for x, y, h in path:
        width, depth = rng.uniform(1.55,2.30), rng.uniform(2.65,3.15)
        angles = [tau*(i+rng.uniform(-.16,.16))/7 for i in range(7)]
        previous = None
        brow = [rng.uniform(-.60,.60) for _ in angles]
        for layer, (size,z,dx,color) in enumerate([
            (1.31,-9,-.60,SHALE*.38),(1.24,h*.19,-.34,SHALE*.52),
            (1.04,h*.76,.12,SLATE*.53),(.84,h,.23,SLATE*.65),(.44,h+.22,.29,SHALE*.86)]):
            ring = [shape.point((x+dx+cos(a)*width*size, y+sin(a)*depth*size,
                                 z+(brow[i] if layer else 0)), color*(1+.12*cos(a)))
                    for i,a in enumerate(angles)]
            if previous is None:
                shape.face(tuple(reversed(ring)), shape.rock)
            else:
                shape.connect(previous,ring,shape.rock,split=True)
            previous = ring
        shape.face(tuple(ring),shape.rock)


FORMATIONS = {"grotto-buttress": geode, "grotto-fault-shelf": fault_shelf,
              "grotto-escarpment": escarpment}


def produce_formation(name, directory):
    reset_scene()
    shape = Formation()
    FORMATIONS[name](shape)
    base = min(z for _, _, z in shape.vertices)
    shape.vertices = [(x,y,z-base) for x,y,z in shape.vertices]
    model = shape.object(name)
    export_model(model, 1500, directory)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(directory/(name+".blend")), compress=True)
    render("scenery/"+name,(-.32,-1.4,.97),model=model)
