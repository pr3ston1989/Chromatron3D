"""Beam splitter with a slotted yoke and a clear split facet at beam height."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.style import Sculpture, make_material, plate, reset_scene, save_asset

NAME = "overhaul-beam-splitter"


def build():
    shadow = make_material("Black isolator", "obsidian", .37, .52, shade=-1)
    base = make_material("Blue-black mount", "navy", .44, .48)
    bronze = make_material("Bronze fork sides", "copper", .38, .49, shade=-1)
    copper = make_material("Copper fork chamfers", "copper", .34, .39, shade=2)
    satin = make_material("Ceramic jaw inset", "ceramic", .19, .40)
    pivot = make_material("Titanium trunnions", "titanium", .61, .31, shade=1)
    optic = make_material("Optical bisector", "cyan", .37, .25, .32, shade=1)
    status = make_material("Warm paths / non-mechanical status", "amber", .20, .44, .62)

    asset = Sculpture()
    plate(asset,[(.43,.47,.13,0),(.49,.50,.14,.055),(.49,.50,.14,.112),
                 (.43,.445,.11,.164),(.33,.392,.10,.220)],
          shadow,[base,shadow,pivot,base])
    plate(asset,[(.19,.265,.076,.215),(.20,.29,.085,.277),(.148,.250,.060,.304)],
          base,[bronze,copper])

    # Long lips bracket the dividing plate; the central opening remains
    # visible in the default view and from the overhead camera.
    for sign in (-1,1):
        asset.blade([(sign*.10,-.30,.32,.079,.083),(sign*.235,-.13,.384,.084,.121),
                     (sign*.356,.034,.560,.070,.133),(sign*.405,.158,.724,.062,.097),
                     (sign*.392,.282,.815,.048,.048),(sign*.369,.333,.818,.028,.026)],
                    bronze,shadow)
        asset.blade([(sign*.220,-.113,.470,.044,.028),(sign*.343,.032,.664,.045,.030),
                     (sign*.397,.160,.811,.049,.026),(sign*.379,.332,.847,.028,.014)],
                    copper,satin)
        asset.cable([(sign*.288,.046,.150,.060),(sign*.334,.046,.150,.063),
                     (sign*.356,.046,.150,.045)],pivot,8)
        asset.cable([(sign*.396,.219,.795,.019),(sign*.374,.308,.832,.023)],status,6)

    # Short, edge-on optical wafer mounted on two graphite trunnion shoulders.
    plate(asset,[(.087,.181,.047,.410),(.103,.205,.053,.455),
                 (.097,.202,.053,.569),(.061,.173,.042,.640)],
          shadow,[pivot,optic,satin])
    for sign in (-1,1):
        asset.cable([(-.097,sign*.188,.470,.026),(.08,sign*.188,.470,.025)],pivot,6)
    return asset.object(NAME)


if __name__ == "__main__":
    reset_scene()
    save_asset(build(), 600, (.36,1.65,1.22))
