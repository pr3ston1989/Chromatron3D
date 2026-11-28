"""Sculpt the forge's two molten runs, fractured banks, and quenched basalt."""
from math import ceil, cos, sin, tau
from pathlib import Path
from random import Random
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.forge_channels import CHANNELS, CHANNEL_ORIGIN, section
from tools.blender.orbital_finish import finish_surface
from tools.blender.style import MODELS, Sculpture, export_model, render, reset_scene
from blender_sculpt import paint


def build():
    reset_scene()
    shape = Sculpture()
    lava = paint("Forge channel lava", (.57,.106,.022), .12,.55,1.16)
    crust = paint("Charred channel edges", (.043,.031,.038), .10,.83)
    stone = paint("Forge quenched basalt", (.027,.024,.037), .13,.87)
    rind = paint("Forge ash over basalt", (.071,.058,.061), .08,.78)
    uv_by_index = {}
    rng = Random(58)

    def world(x,y,z):
        return (x,-z,y-CHANNEL_ORIGIN)

    def rock(x,z,y,rx,rz,height):
        profile = []
        warp = [rng.uniform(.78,1.21) for _ in range(7)]
        for j,(width,top,shift) in enumerate(((.82,-.65,-.12),(1,.08,0),(.83,.62,.04),(.51,1,.17))):
            profile.append([world(x+rx*(shift+width*k*cos(a)),y+height*(top+.08*sin(j+i*2.4)),
                                  z-rz*width*k*sin(a))
                            for i,k in enumerate(warp) for a in (i*tau/7+j*.11,)])
        shape.loft(profile,stone,[stone,crust,rind])

    for run in CHANNELS:
        # glTF flips V. Orient it along the descent on both runs.
        uv_direction = -1 if run[-1][3]<run[0][3] else 1
        sections = []
        for a,b in zip(run,run[1:]):
            count = ceil((b[0]-a[0])/2.8)
            sections.extend(a[0]+(b[0]-a[0])*i/count for i in range(count))
        sections.append(run[-1][0])
        columns = (-1,-.66,-.28,.13,.48,1)
        first = len(shape.vertices)
        for z in sections:
            x,w,y = section(run,z)
            for u in columns:
                uv_by_index[len(shape.vertices)] = (u*.5+.5, uv_direction*z)
                height = y+.043*sin(z*1.1+u*3.4)*(1-abs(u))
                shape.vertices.append(world(x+u*w,height,z))
        for i in range(len(sections)-1):
            for j in range(len(columns)-1):
                a = first+i*len(columns)+j
                b = a+len(columns)
                shape.face((a,b,b+1,a+1),lava)
        for side in (-1,1):
            edge = []
            for i,z in enumerate(sections):
                x,w,y = section(run,z)
                skew = .19*sin(z*.63+side)
                # The inner crust overlaps the liquid edge. The bevel rises
                # toward solid ground before dropping into the terrain.
                row = [world(x+side*(w+d+skew*amount),y+h,z)
                       for d,h,amount in ((-.12,.025,0),(.39,.19,1),
                                          (.86,.57+skew,1),(1.58,.66+skew,1),(2.46,-.36,0))]
                row.append(world(x+side*(w+2.61),CHANNEL_ORIGIN,z))
                index = len(shape.vertices)
                shape.vertices.extend(row)
                if edge:
                    for j,mat in enumerate((crust,crust,rind,stone,stone)):
                        a,b = edge[j],edge[j+1]
                        c,d = index+j+1,index+j
                        shape.face((a,d,c,b) if side>0 else (a,b,c,d),mat)
                edge = list(range(index,index+len(row)))
                # Larger broken boulders lend weight to the visible banks.
                if i%4==1 and -48<z<29:
                    rock(x+side*(w+.77),z-.2,y+.08,.49+rng.random()*.39,.71+rng.random()*.79,
                         .64+rng.random()*.52)

    model = shape.object("forge-lava-runs")
    finish_surface(model,reach=.53)
    uv = model.data.uv_layers.active.data
    for face in model.data.polygons:
        if model.data.materials[face.material_index]!=lava:
            continue
        for loop in face.loop_indices:
            uv[loop].uv = uv_by_index[model.data.loops[loop].vertex_index]
    folder = MODELS/"scenery"
    export_model(model,3700,folder)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/(model.name+".blend")),compress=True)
    render("scenery/"+model.name,direction=(-.57,-.82,.86),model=model)


if __name__ == "__main__":
    build()
