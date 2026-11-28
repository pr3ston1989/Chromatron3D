"""Model two distinct colonies on the abyssal observatory's rock shelves."""
from math import cos, sin, tau
from pathlib import Path
from random import Random
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.orbital_finish import finish_surface
from tools.blender.style import MODELS, Sculpture, export_model, render, reset_scene
from blender_sculpt import paint


def build(name, sponge_bank):
    reset_scene()
    shape = Sculpture()
    rock = paint("Garden dark basalt", (.027,.045,.065), .03,.86)
    silt = paint("Garden manganese silt", (.057,.083,.096), .08,.79)
    lip = paint("Garden mineral ledges", (.083,.115,.130), .07,.75)
    copper = paint("Gorgonian copper cartilage", (.300,.134,.094), .10,.62,.035)
    wine = paint("Gorgonian wine branches", (.192,.067,.122), .09,.70,.034)
    rose = paint("Gorgonian amber polyps", (.540,.218,.130), .12,.55,.27)
    sponge = paint("Glass sponge lattice", (.058,.179,.177), .20,.53)
    throat = paint("Glass sponge inner walls", (.022,.074,.077), .11,.70)
    collar = paint("Glass sponge pale collars", (.142,.307,.283), .15,.52,.13)
    rng = Random(402 if sponge_bank else 78)

    def shelf(x,y,rx,ry,height,phase,floor=0.):
        outline = [(cos(i*tau/9+phase),sin(i*tau/9+phase),rng.uniform(.79,1.19))
                   for i in range(9)]
        rings = [[(x+rx*(u*r*f+lean),y+ry*(v*r*f-.05*i),
                   floor+height*(z+.031*cos(k*1.17+i) if i else 0))
                  for k,(u,v,f) in enumerate(outline)]
                 for i,(r,z,lean) in enumerate(((.91,0,-.11),(1,.25,0),(.94,.65,.10),(.78,.88,.11),(.60,1,.14)))]
        shape.loft(rings,rock,[rock,silt,rock,lip])

    def fan(x,y,z,height,width,angle,count,material):
        u,v = cos(angle),sin(angle)

        def point(a,depth,h,radius):
            return (x+width*a*u-depth*v,y+width*a*v+depth*u,z+height*h,radius)

        shape.cable([point(0,0,0,.12),point(-.07,.07,.24,.094),
                     point(.025,.16,.51,.077),point(.11,.26,.77,.056),point(.16,.30,1.0,.037)],
                    material,6)
        margins = {}
        for j in range(count):
            side = -1 if j%2 else 1
            reach = .51+.39*rng.random()
            base = .14+.064*j
            elbow = .18+rng.random()*.12
            top = min(1.13,base+.40+rng.random()*.24)
            drift = rng.uniform(-.16,.15)
            root = (-.06+j*.011,.075+j*.014,base)
            shoulder = (side*elbow,.12+drift,base+.19)
            rim = (side*reach*.76,.20+drift,top-.16)
            tip = (side*reach,.29+drift,top)
            shape.cable([point(*root,.063),point(*shoulder,.050),point(*rim,.034),point(*tip,.018)],material,4)
            if side in margins:
                # Short anastomoses join nearby branches into a fan.
                shape.cable([point(*margins[side],.017),point(*rim,.013)],material,4)
            margins[side] = rim
            fork_x,fork_y,fork_z = shoulder
            for branch in (0,1):
                a = side*reach*(.38+branch*.33)
                h = top+.094+branch*.057
                d = .21+drift+branch*.063
                shape.cable([point(fork_x,fork_y,fork_z,.038),point(a*.83,d-.08,h-.19,.027),
                             point(a,d,h,.012)],material,4)
                if (branch==0 and j%2==0) or (branch==1 and j%3==0):
                    shape.cable([point(a,d,h-.044,.023),point(a,d,h+.006,.014)],rose,4)

    def tube(x,y,z,height,width,lean,phase):
        rings = []
        n = 8
        profile = [(0,.75),(.25,.91),(.58,1.0),(.87,1.13),(1,1.19),
                   (1,.88),(.89,.74),(.60,.61),(.21,.40)]
        for j,(h,r) in enumerate(profile):
            ring = []
            for k in range(n):
                a = k*tau/n+phase
                twist = .15*sin(a*3)+.087*cos(a*2+j*.45)
                mouth = .08*sin(a*2+phase)
                ring.append((x+cos(a)*width*r*(1+twist)+lean*h*h,
                             y+sin(a)*width*r*(1+twist)+h*.19,
                             z+height*(h+mouth*(h*h))))
            rings.append(ring)
        shape.loft(rings,throat,[sponge,sponge,sponge,collar,collar,throat,throat,throat])

    if sponge_bank:
        shelf(-.82,.18,4.83,2.62,1.47,.20)
        shelf(2.28,.27,2.13,1.89,1.30,.63,.27)
        for x,y,z,h,w,curve in [(-2.90,-.12,1.21,2.67,.53,-.37),(-2.23,-.49,1.37,1.89,.39,-.26),
                                 (-1.04,.63,1.38,2.29,.49,-.14),(-.21,.29,1.38,2.73,.56,.29),
                                 (.41,-.57,1.34,1.72,.37,.24),(1.59,.35,1.50,1.83,.41,-.20),
                                 (2.14,-.05,1.45,1.28,.34,.13)]:
            tube(x,y,z,h,w,curve,rng.uniform(0,tau))
        fan(3.0,.25,1.48,2.33,1.29,.66,5,wine)
        fan(-.71,-1.31,1.15,1.33,1.14,-.45,5,copper)
    else:
        shelf(-.72,.36,4.12,2.36,1.40,.40)
        shelf(1.92,.82,2.57,1.76,1.13,.18,.31)
        fan(-2.55,-.38,1.01,2.54,1.43,-.35,6,wine)
        fan(-.81,.09,1.31,4.63,2.61,.11,8,copper)
        fan(1.87,.81,1.40,3.56,2.12,-.34,7,wine)
        fan(2.43,-.28,1.30,1.97,1.40,.48,4,copper)
        for x in (-2.78,2.55,3.03):
            tube(x,.19,1.22,1.27,.29,rng.uniform(-.2,.2),rng.uniform(0,tau))
    model = shape.object(name)
    finish_surface(model,reach=.54)
    folder = MODELS/"scenery"
    export_model(model,3000,folder)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/(name+".blend")),compress=True)
    render("scenery/"+name,direction=(-.52,-.86,.69),model=model)


if __name__ == "__main__":
    build("abyss-fan-slope",False)
    build("abyss-sponge-ledge",True)
