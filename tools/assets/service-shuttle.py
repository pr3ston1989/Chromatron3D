"""Twin-boom utility shuttle. The nose points +X in Blender and Three.js."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from style import Sculpture, make_material, reset_scene, save_asset

reset_scene()
shell = make_material("Cream ceramic skin", "cream", .20)
dark = make_material("Black heat shield", "graphite", .40)
ocean = make_material("Blue outriggers", "ocean", .43)
red = make_material("Cupric maneuvering fins", "copper", .47)
glass = make_material("Smoked blue cockpit", "indigo", .40, .23)
lip = make_material("Stainless nozzle", "titanium", .62)
thrust = make_material("Ion chamber", "cyan", .16, .35, 1.1)

asset = Sculpture()
asset.loft([[(x,py*w,z+pz*h) for py,pz in [(-.72,-1),(.72,-1),(1,-.30),
               (.83,.52),(.49,1),(-.49,1),(-.83,.52),(-1,-.30)]]
            for x,w,z,h in [(-1.08,.25,.32,.19),(-.91,.41,.32,.24),
            (-.45,.49,.32,.29),(.23,.41,.33,.30),(.72,.27,.29,.17),(1.20,.085,.23,.062)]],
           dark,[ocean,shell,shell,shell,dark])
asset.loft([[(x,w*y,z+h*u) for y,u in [(-1,0),(1,0),(.75,.65),(.43,1),(-.43,1),(-.75,.65)]]
            for x,w,z,h in [(-.62,.17,.56,.03),(-.37,.29,.59,.17),
            (-.05,.25,.58,.19),(.28,.16,.53,.10),(.50,.04,.45,.025)]],glass)
for side in (-1,1):
    asset.blade([(-.69,side*.20,.26,.62,.045),(-.61,side*.47,.25,.51,.082),
                 (-.82,side*.68,.27,.29,.066),(-1.16,side*.85,.31,.09,.025)],ocean,red)
    asset.cable([(-1.20,side*.69,.212,.196),(-1.10,side*.69,.225,.225),
                 (-.81,side*.64,.245,.205),(-.62,side*.58,.29,.115)],lip,8)
    asset.cable([(-1.213,side*.69,.212,.131),(-1.222,side*.69,.212,.105)],thrust,8)
    asset.blade([(-.94,side*.67,.38,.14,.16),(-.75,side*.61,.41,.091,.21),
                 (-.32,side*.45,.44,.022,.045)],red,ocean)
    asset.cable([(-.74,side*.29,.01,.010),(-.45,side*.29,.018,.016),
                 (-.19,side*.22,.040,.012)],dark,6)
# Use the lowest skids or nozzle vertices as the ground plane.
minimum = min(z for _, _, z in asset.vertices)
asset.vertices = [(x,y,z-minimum) for x,y,z in asset.vertices]
save_asset("service-shuttle", asset.object("service-shuttle"), 600, (1.5,-1.8,1.3))
