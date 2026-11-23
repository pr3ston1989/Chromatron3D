"""Bake editable Blender deck materials to compact linear PBR samples."""
from pathlib import Path
from struct import pack
import zlib

import bpy
import numpy as np


OUT = Path(__file__).resolve().parents[3] / "assets/materials/deck"
SIZE = 256


def write_sample(path, rgba):
    # Linear data, including an independent slope in alpha. A display colour
    # transform or Blender's premultiplied colour export would corrupt the slopes.
    def chunk(tag, data):
        return pack(">I", len(data)) + tag + data + pack(">I", zlib.crc32(tag + data))
    header = pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)
    scanlines = b"".join(b"\0" + row.tobytes() for row in rgba[::-1])
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) +
                     chunk(b"IDAT", zlib.compress(scanlines, 9)) + chunk(b"IEND", b""))


def draft_material(name, roughness, metal, relief, base):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    tree = material.node_tree
    bsdf = tree.nodes.get("Principled BSDF")
    bsdf.inputs["Metallic"].default_value = metal
    uv = tree.nodes.new("ShaderNodeTexCoord").outputs["UV"]

    def connect(value, socket):
        if isinstance(value, bpy.types.NodeSocket):
            tree.links.new(value, socket)
        else:
            socket.default_value = value

    def node(kind, label):
        n = tree.nodes.new(kind)
        n.label = label
        return n

    def remap(source, low, high, a, b, label):
        n = node("ShaderNodeMapRange", label)
        for socket, value in zip(n.inputs, (source, low, high, a, b)):
            connect(value, socket)
        return n.outputs[0]

    def noise(label, stretch, scale, detail=2, distortion=0, angle=0):
        mapping = node("ShaderNodeMapping", label + " direction")
        connect(uv, mapping.inputs["Vector"])
        mapping.inputs["Scale"].default_value = (*stretch, 1)
        mapping.inputs["Rotation"].default_value.z = angle
        n = node("ShaderNodeTexNoise", label)
        connect(mapping.outputs[0], n.inputs["Vector"])
        for key, val in (("Scale", scale), ("Detail", detail), ("Distortion", distortion)):
            n.inputs[key].default_value = val
        return n.outputs["Fac"]

    def mix(a, b, t, label):
        n = node("ShaderNodeMixRGB", label)
        for socket, value in zip(n.inputs, (t, a, b)):
            connect(value, socket)
        return n.outputs[0]

    cloud = noise("Body of the slab", (1, 1), 5.5, 3, .28)
    if name == "slate":
        beds = noise("Compressed mineral layers", (.82, 2.8), 4.8, 2.2, .52, .43)
        n = node("ShaderNodeMath", "Quartz seam")
        n.operation = "PINGPONG"
        connect(beds, n.inputs[0])
        n.inputs[1].default_value = .17
        quartz = remap(n.outputs[0], .116, .158, .04, .93, "Mineral ribbons")
        texture = mix(mix(beds, cloud, .38, "Cleavage"), quartz, .28, "Polished slate")
    elif name == "limestone":
        beds = noise("Sediment", (1, 3.4), 6, 2.5, .55, .3)
        pores = node("ShaderNodeTexVoronoi", "Open fossil pores")
        connect(uv, pores.inputs["Vector"])
        pores.voronoi_dimensions = "2D"
        pores.inputs["Scale"].default_value = 67
        pores = remap(pores.outputs["Distance"], .055, .29, .04, .70, "Honed pores")
        texture = mix(mix(beds, cloud, .40, "Stone matrix"), pores, .36, "Honed limestone")
    elif name == "alloy":
        cut = noise("Linear grinding marks", (.56, 13), 11, 1.5, .16)
        long_grain = noise("Overlapping tool passes", (.60, 4), 7, 2, .28)
        texture = mix(mix(cut, long_grain, .54, "Tool finish"), cloud, .24, "Satin alloy")
    elif name == "frost":
        feathers = noise("Ice needles", (1, 5.4), 9.5, 2, 1.4, .68)
        crystals = noise("Crystallisation front", (1.4, 1), 12, 2, .6)
        crystal_edge = remap(crystals, .48, .55, .18, .84, "Frost flowers")
        texture = mix(mix(feathers, crystal_edge, .44, "Rime"), cloud, .22, "Frosted plate")
    else:
        granules = noise("Fired ceramic grains", (1, 1), 71, 1.5)
        flecks = remap(granules, .43, .61, .19, .78, "Ceramic inclusions")
        texture = mix(cloud, flecks, .46, "Sintered porcelain")

    tone = remap(texture, .22, .78, .10, .90, "Slab tone")
    rough = remap(texture, .22, .78, roughness + .14, roughness - .14, "Local roughness")
    bump = node("ShaderNodeBump", "Microsurface relief")
    connect(texture, bump.inputs["Height"])
    bump.inputs["Distance"].default_value = 2 * relief
    connect(bump.outputs[0], bsdf.inputs["Normal"])
    body = mix(tuple(c*.80 for c in base)+(1,), tuple(c*1.20 for c in base)+(1,), tone, "Body colour")
    connect(body, bsdf.inputs["Base Color"])
    material.diffuse_color = (*base, 1)
    connect(rough, bsdf.inputs["Roughness"])

    # Arrange the editable graph by dependency depth, from output to coordinates.
    output = tree.nodes.get("Material Output")
    columns = {}
    def arrange(n, depth):
        if columns.get(n, -1) >= depth:
            return
        columns[n] = depth
        for socket in n.inputs:
            for link in socket.links:
                arrange(link.from_node, depth + 1)
    arrange(output, 0)
    next_y = {}
    for n, depth in sorted(columns.items(), key=lambda item: item[1]):
        n.location = (-depth * 245, next_y.get(depth, 0))
        n.hide = n.type == "MAPPING"
        next_y[depth] = n.location.y - (90 if n.hide else 325)
    return material, (tone, rough, texture)


def bake(swatch, name, channels, relief):
    mat = swatch.data.materials[0]
    tree = mat.node_tree
    output = tree.nodes.get("Material Output").inputs["Surface"]
    surface = output.links[0].from_socket
    emit = tree.nodes.new("ShaderNodeEmission")
    rgb = tree.nodes.new("ShaderNodeCombineColor")
    for source, socket in zip(channels, rgb.inputs):
        tree.links.new(source, socket)
    tree.links.new(rgb.outputs[0], emit.inputs[0])
    tree.links.new(emit.outputs[0], output)
    target = tree.nodes.new("ShaderNodeTexImage")
    image = bpy.data.images.new(name + " channels", SIZE, SIZE, alpha=False, float_buffer=True)
    image.colorspace_settings.name = "Non-Color"
    target.image = image
    tree.nodes.active = target
    bpy.ops.object.bake(type="EMIT", margin=0)
    pixels = np.empty(SIZE * SIZE * 4, dtype=np.float32)
    image.pixels.foreach_get(pixels)
    data = pixels.reshape(SIZE, SIZE, 4)
    # A sample covers 3.25 metres, independent of the swatch or panel size.
    dz, dx = np.gradient(data[:, :, 2], 3.25 / SIZE)
    packed = np.stack([data[:, :, 0], data[:, :, 1], .5 - dx * relief, .5 - dz * relief], axis=2)
    write_sample(OUT / (name + ".png"), np.uint8(np.rint(np.clip(packed, 0, 1) * 255)))
    for n in (target, emit, rgb):
        tree.nodes.remove(n)
    tree.links.new(surface, output)
    bpy.data.images.remove(image)


OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.engine = "CYCLES"
bpy.context.scene.cycles.samples = 1
for index, (name, roughness, metallic, relief, base) in enumerate([
        ("slate", .48, .12, .011, (.30,.26,.37)), ("limestone", .63, .06, .013, (.59,.46,.31)),
        ("alloy", .43, .48, .008, (.34,.41,.51)), ("frost", .40, .11, .014, (.47,.61,.69)),
        ("ceramic", .48, .08, .009, (.62,.60,.55))]):
    bpy.ops.mesh.primitive_plane_add(size=3.25, location=(index*3.6, 0, 0))
    swatch = bpy.context.object
    swatch.name = name
    material, channels = draft_material(name, roughness, metallic, relief, base)
    swatch.data.materials.append(material)
    bake(swatch, name, channels, relief)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "deck-surfaces.blend"), compress=True)
