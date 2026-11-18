"""Twin engine orbital service skiff with forward sensor forks."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.style import Sculpture, make_material, reset_scene, save_asset

NAME = "overhaul-service-skiff"


def build():
    shell = make_material("Titanium airframe", "titanium", .46, .44, shade=1)
    mid = make_material("Steel underside", "steel", .40, .55, shade=-1)
    seal = make_material("Graphite joint", "obsidian", .34, .56)
    trim = make_material("Oxide weather covers", "copper", .34, .49, shade=1)
    glass = make_material("Deep cockpit", "navy", .58, .22, shade=-2)
    sensor = make_material("Marker lamps", "amber", .11, .40, 1.1)

    asset = Sculpture()
    section = [(-.64,-1),(.64,-1),(1,-.32),(.85,.58),(.49,1),(-.49,1),(-.85,.58),(-1,-.32)]
    stations = [(-1.26,.35,.39,.13),(-1.13,.54,.43,.20),(-.52,.62,.43,.25),
                (.37,.47,.42,.27),(.79,.30,.365,.17),(1.18,.15,.29,.10),(1.28,.13,.28,.065)]
    asset.loft([[(x,y*w,z+k*h) for y,k in section] for x,w,z,h in stations],
               seal,[mid,mid,shell,shell,mid,trim])
    canopy = [(-1,0),(1,0),(.74,.70),(.43,1),(-.43,1),(-.74,.70)]
    asset.loft([[(x,y*w,z+k*h) for y,k in canopy]
                for x,w,z,h in [(-.73,.22,.624,.051),(-.42,.36,.659,.166),
                                (-.01,.34,.682,.158),(.40,.245,.640,.126),(.71,.118,.533,.040)]],
               seal,[glass,glass,glass,mid])
    for sign in (-1,1):
        asset.blade([(-1.06,sign*.34,.38,.37,.072),(-.99,sign*.80,.40,.36,.103),
                     (-.70,sign*1.11,.371,.222,.081),(-.37,sign*1.19,.392,.092,.039)],
                    shell,mid)
        asset.blade([(-.54,sign*.47,.405,.17,.105),(.16,sign*.55,.366,.133,.083),
                     (.69,sign*.53,.298,.100,.065),(1.38,sign*.51,.288,.072,.048)],
                    mid,seal)
        asset.blade([(.13,sign*.548,.42,.077,.025),(.68,sign*.53,.349,.063,.029),
                     (1.40,sign*.51,.324,.041,.027)],shell,trim)
        asset.cable([(-1.43,sign*.84,.285,.155),(-1.36,sign*.84,.285,.211),
                     (-1.10,sign*.81,.310,.193),(-.77,sign*.72,.354,.082)],mid,6)
        asset.cable([(-1.447,sign*.84,.285,.098),(-1.463,sign*.84,.285,.089)],sensor,6)
        asset.cable([(.85,sign*.533,.328,.023),(1.33,sign*.51,.337,.021)],sensor,4)
        asset.cable([(-.88,sign*.36,.041,.023),(-.57,sign*.37,.037,.030),
                     (.18,sign*.29,.044,.025)],seal,4)
        asset.cable([(-.92,sign*1.00,.457,.034),(-.66,sign*1.085,.442,.029)],
                    trim,4)
    minimum = min(z for _,_,z in asset.vertices)
    center_x = (min(x for x,_,_ in asset.vertices) + max(x for x,_,_ in asset.vertices)) / 2
    asset.vertices = [(x-center_x,y,z-minimum) for x,y,z in asset.vertices]
    return asset.object(NAME)


if __name__ == "__main__":
    reset_scene()
    save_asset(build(), 600, (1.25,-1.75,1.0))
