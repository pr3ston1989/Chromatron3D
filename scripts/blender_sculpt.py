"""Author board instruments & dioramas from sculpted cross sections in Blender.
Coordinates are in board units. +Y faces north, -X is the mirror's silver side.
"""
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
TAU = math.tau


def paint(name, rgb, metallic=.2, roughness=.34, emission=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    for key, value in [("Base Color", (*rgb, 1)), ("Metallic", metallic),
                       ("Roughness", roughness), ("Emission Color", (*rgb, 1)),
                       ("Emission Strength", emission)]:
        shader.inputs[key].default_value = value
    return mat


class Sculpture:
    """Build closed lofts in a single mesh, preserving per-face finishes."""
    def __init__(self):
        self.vertices, self.faces, self.finishes, self.palette = [], [], [], []

    def face(self, indices, mat):
        if mat not in self.palette:
            self.palette.append(mat)
        self.faces.append(indices)
        self.finishes.append(self.palette.index(mat))

    def loft(self, rings, mat, bands=None):
        size = len(rings[0])
        start = len(self.vertices)
        self.vertices.extend(v for ring in rings for v in ring)
        self.face(tuple(reversed(range(start, start + size))), mat)
        for layer in range(1, len(rings)):
            a = start + size * (layer-1)
            b = a + size
            for i in range(size):
                j = (i+1) % size
                self.face((a+i, a+j, b+j, b+i), bands[layer-1] if bands else mat)
        self.face(tuple(range(b, b+size)), bands[-1] if bands else mat)

    def lathe(self, profile, mat, n=24, ribs=0, relief=0, bands=None, phase=0):
        rings = []
        for row in profile:
            x, y, z, rx, ry = row[:5]
            turn = row[5] if len(row)>5 else 0
            ring = []
            for i in range(n):
                a = TAU*i/n + phase
                f = 1 + relief*math.cos(ribs*a)
                ring.append((x+rx*f*math.cos(a+turn), y+ry*f*math.sin(a+turn), z))
            rings.append(ring)
        self.loft(rings, mat, bands)

    def cable(self, path, mat, n=8):
        rings = []
        prev = None
        for i, (x,y,z,r) in enumerate(path):
            center = Vector((x,y,z))
            tangent = (Vector(path[min(i+1,len(path)-1)][:3])-Vector(path[max(0,i-1)][:3])).normalized()
            axis = prev if prev is not None else Vector((0,0,1) if abs(tangent.z)<.85 else (1,0,0))
            side = tangent.cross(axis).normalized()
            axis = side.cross(tangent).normalized()
            prev = axis
            rings.append([tuple(center+r*(math.cos(TAU*j/n)*axis+math.sin(TAU*j/n)*side)) for j in range(n)])
        self.loft(rings, mat)

    def blade(self, path, mat, trim):
        """A hand-profiled leaf/ribbon with a raised ridge and a beveled underside."""
        rings = []
        for i,(x,y,z,w,h) in enumerate(path):
            first, last = path[max(0,i-1)], path[min(len(path)-1,i+1)]
            tangent = Vector((last[0]-first[0], last[1]-first[1],0)).normalized()
            side = Vector((-tangent.y, tangent.x,0))
            rings.append([(x+side.x*s*w,y+side.y*s*w,z+dz*h)
                          for s,dz in [(1,0),(0,1),(-1,0),(-.75,-.38),(.75,-.38)]])
        first = len(self.faces)
        self.loft(rings,mat)
        if trim not in self.palette:
            self.palette.append(trim)
        # Each five-sided cross section has a narrow bevel along its underside.
        for i in range(len(path)-1):
            self.finishes[first + 1 + i*5 + 3] = self.palette.index(trim)

    def object(self,name):
        import bmesh
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.vertices, [], self.faces)
        for mat in self.palette:
            mesh.materials.append(mat)
        for poly, idx in zip(mesh.polygons,self.finishes):
            poly.material_index = idx
        bm=bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
        bm.to_mesh(mesh)
        bm.free()
        mesh.update()
        obj = bpy.data.objects.new(name,mesh)
        bpy.context.collection.objects.link(obj)
        return obj


def export(name, objects, folder):
    folder.mkdir(parents=True,exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.export_scene.gltf(filepath=str(folder/(name+".glb")),use_selection=True,
                              export_format="GLB",export_yup=True)
