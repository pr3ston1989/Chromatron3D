"""Physical-size machining UVs, bevel normals and baked cavity for the orbital kit."""
from math import cos, pi, sin, sqrt
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def finish_surface(model, bevel=0, reach=.3):
    bpy.context.view_layer.objects.active=model
    if bevel:
        mod=model.modifiers.new("Machined edge radii","BEVEL")
        mod.width=bevel
        mod.segments=2
        mod.limit_method="ANGLE"
        mod.angle_limit=.58
        mod.harden_normals=True
        bpy.ops.object.modifier_apply(modifier=mod.name)
        normals=model.modifiers.new("Face weighted highlights","WEIGHTED_NORMAL")
        normals.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=normals.name)
    mesh=model.data
    mesh.update()
    uv=mesh.uv_layers.new(name="Machine grain")
    cavity=mesh.color_attributes.new(name="Baked cavity",type="BYTE_COLOR",domain="CORNER")
    mesh.color_attributes.active_color=cavity
    positions=[v.co.copy() for v in mesh.vertices]
    tree=BVHTree.FromPolygons(positions,[list(p.vertices) for p in mesh.polygons])
    directions=[]
    for i in range(12):
        z=(i+.5)/12
        r=sqrt(1-z*z)
        directions.append(Vector((cos(i*2.39996)*r,sin(i*2.39996)*r,z)))
    for poly in mesh.polygons:
        normal=poly.normal
        if normal.length_squared<.1:
            continue
        basis=normal.to_track_quat("Z","Y")
        axes=(1,2) if abs(normal.x)>.65 else (0,2) if abs(normal.y)>.65 else (0,1)
        for idx in poly.loop_indices:
            v=positions[mesh.loops[idx].vertex_index]
            uv.data[idx].uv=(v[axes[0]]/1.3, v[axes[1]]/1.3)
            origin=v.lerp(poly.center,.09)+normal*.002
            occlusion=0
            for direction in directions:
                _,_,_,distance=tree.ray_cast(origin,basis@direction,reach)
                if distance is not None:
                    occlusion+=1-distance/reach
            value=1-.70*occlusion/len(directions)
            cavity.data[idx].color=(value,value,value,1)
