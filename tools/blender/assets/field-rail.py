"""One 1.30 m collector cassette. Blender +Y faces outboard."""
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT))
from tools.blender.style import Sculpture,make_material,plate,reset_scene,export_model
from tools.blender.orbital_finish import finish_surface

reset_scene()
s=Sculpture()
ink=make_material("Field rail | light trap","obsidian",.25,.68)
steel=make_material("Field rail | satin titanium","steel",.62,.37)
ceramic=make_material("Field rail | ceramic coupler","titanium",.41,.37)
ice=make_material("Field rail | pilot strip","cyan",.17,.32,.95)
# The continuous face begins on the logical boundary. The shoe, fuse and
# cowl project outboard, away from the last playable row.
s.loft([[(x,y,z) for y,z in [(0,.06),(.024,.132),(.084,.132),(.107,.080),
         (.163,.076),(.208,.147),(.283,.147),(.316,.085),(.316,.014),(.28,0),(.03,0)]]
        for x in (-.65,.65)],steel)
plate(s,[(.48,.024,.015,.073),(.47,.023,.015,.082)],ink,[ink],center=(0,.134))
plate(s,[(.37,.013,.008,.082),(.366,.012,.007,.088)],ice,[ice],center=(0,.134))
plate(s,[(.083,.12,.023,.129),(.074,.105,.022,.195),(.056,.087,.022,.217)],
      ink,[steel,ceramic],center=(-.53,.168))
# Slotted ferrite fuse and a retaining shoe on the outboard side of the rail.
s.loft([[(x,y,z) for y,z in [(.182,.144),(.201,.179),(.251,.185),
         (.285,.159),(.276,.146)]] for x in (.284,.444)],ink,[ceramic])
for x in (.31,.36,.41):
    s.loft([[(u,y,z) for y,z in [(.204,.178),(.204,.186),(.259,.188),(.267,.18)]]
            for u in (x-.007,x+.007)],steel)
obj=s.object("field-rail")
finish_surface(obj,reach=.12)
export_model(obj,240,ROOT/"assets/models")
