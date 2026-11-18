"""Compact armor cassette with a dark grille and recessed power strip."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from style import Sculpture, make_material, plate, reset_scene, save_asset

reset_scene()
shadow = make_material("Deep marine recess", "ocean", .15, .76, shade=-2)
dark = make_material("Dark beveled side", "ocean", .35, .57, shade=-1)
marine = make_material("Blue armor", "ocean", .41)
rim = make_material("Highlight on upper chamfer", "ocean", .25, .39, shade=2)
metal = make_material("Copper intake vanes", "copper", .31, .45, shade=1)
status = make_material("Cyan panel edge", "cyan", .08, .36, 2.1)
signal = make_material("Amber bolt marker", "amber", .08, .40, .8)

asset = Sculpture()
plate(asset, [(0.59,.106,.065,0),(.6526,.136,.075,.075),
              (.6526,.136,.075,.27),(.594,.107,.072,.49),
              (.594,.107,.072,.72),(.637,.130,.065,.855),
              (.602,.110,.061,.96)], dark, [marine,marine,rim,shadow,marine,rim])

def front(points,y):
    return [(x,y,z) for x,z in points]

# Maximum reach toward the beam stays at .145 m from the panel anchor.
grille=[(-.48,.25),(.38,.25),(.45,.35),(.41,.62),(-.38,.62),(-.46,.50)]
asset.loft([front(grille,-.106),front(grille,-.123)],shadow)
for x in (-.29,0,.29):
    vane = [(x-.041,.28),(x+.024,.28),(x+.082,.52),(x+.017,.55)]
    asset.loft([front(vane,-.123),front(vane,-.145)],metal)
stripe=[(-.449,.668),(.420,.668),(.404,.700),(-.421,.700)]
asset.loft([front(stripe,-.108),front(stripe,-.127)],status)
# Two light-catching triangular catches welded into the upper face.
for x in (-.36,.36):
    top=[(x-.049,-.093,.911),(x+.049,-.093,.911),(x,-.096,.958)]
    asset.face(tuple(range(len(asset.vertices),len(asset.vertices)+3)),signal)
    asset.vertices.extend(top)
save_asset("absorber-armor", asset.object("absorber-armor"), 180, (1.2,-2,1))
