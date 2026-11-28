"""Model a polar radiometer with a fixed heated apron and a gimballed head."""
from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.orbital_finish import finish_surface
from tools.blender.style import MODELS, Sculpture, plate, render, reset_scene
from tools.style import clipped_rectangle, export
from blender_sculpt import paint


def build():
    reset_scene()
    base, head = Sculpture(), Sculpture()
    steel = paint("Radiometer blued alloy", (.061,.115,.169), .53,.51)
    titanium = paint("Radiometer machined edges", (.161,.246,.314), .63,.37)
    gasket = paint("Radiometer dark seals", (.024,.046,.066), .23,.67)
    ceramic = paint("Radiometer frostproof ceramic", (.272,.351,.388), .14,.65)
    bronze = paint("Radiometer heater traces", (.423,.215,.092), .49,.43)
    glass = paint("Radiometer optical panels", (.038,.167,.211), .51,.23)
    glass_dark = paint("Radiometer coated facets", (.028,.097,.146), .58,.30)
    amber = paint("Radiometer service lamps", (.68,.322,.096), .19,.44,1.13)
    guide = paint("Radiometer blue indicators", (.075,.296,.427), .24,.35,.68)

    # Angled apron sections step down to the ice and support the instrument.
    plate(base,[(2.72,1.86,.52,0),(3.03,2.12,.59,.18),(3.02,2.08,.57,.33),
                (2.89,1.91,.51,.44)],gasket,[gasket,steel,titanium])
    for y in (-2.14,-1.74):
        step_z = .24 if y<-2 else .34
        plate(base,[(1.17,.40,.19,0),(1.24,.41,.21,.08),(1.22,.37,.19,step_z)],
              steel,[steel,ceramic],(-.48,y))
        for x in (-1.21,-.51,.19):
            base.cable([(x-.17,y-.28,step_z+.005,.024),(x+.17,y-.28,step_z+.005,.024)],titanium,4)
    for side in (-1,1):
        for y in (-1.28,1.34):
            x = side*2.12
            plate(base,[(.40,.36,.12,.10),(.45,.39,.14,.24),(.38,.36,.11,.49)],
                  steel,[gasket,bronze],(x,y))
            base.lathe([(x,y,.49,.103,.103),(x,y,.56,.096,.096)],titanium,6)
        base.cable([(side*1.44,-1.37,.45,.037),(side*1.94,-1.46,.45,.037),
                    (side*2.52,-.88,.46,.037),(side*2.58,.61,.46,.037)],guide,4)
    # Two broad A-shaped side supports carry the fixed bearing housings.
    for side in (-1,1):
        x = side*1.73
        plate(base,[(.59,.75,.19,.43),(.55,.65,.17,.65),(.47,.56,.16,.81)],
              gasket,[steel,titanium],(x,.45))
        base.cable([(x,.98,.79,.37),(x*.95,.84,1.57,.28),(x*.93,.54,2.25,.21),
                    (x*.95,.12,2.82,.24)],steel,7)
        base.cable([(x,-.20,.75,.25),(x*.99,-.13,1.47,.17),(x*.95,.12,2.82,.19)],titanium,6)
        base.cable([(x,.96,.80,.060),(x*1.08,.69,1.24,.077),(x*1.05,.28,1.63,.060)],
                   bronze,5)
        base.cable([(side*1.86,.12,2.82,.36),(side*1.64,.12,2.82,.39),
                    (side*1.47,.12,2.82,.30)],bronze,10)
        base.cable([(side*1.96,.12,2.82,.24),(side*1.84,.12,2.82,.24)],titanium,8)
        base.cable([(side*1.90,-.25,1.29,.039),(side*1.76,-.24,1.57,.039)],amber,5)

    # An inset service cabinet and its cable continue under the two pivots.
    plate(base,[(.52,.67,.16,.43),(.64,.66,.17,.60),(.58,.56,.18,1.09),
                (.46,.50,.14,1.19)],gasket,[steel,steel,ceramic],(2.29,.46))
    for y in (.18,.39,.60):
        base.cable([(2.64,y,.72,.030),(2.64,y,1.00,.030)],gasket,4)
    base.cable([(2.61,.13,1.05,.026),(2.48,-.04,1.05,.026)],amber,4)
    base.cable([(2.00,.98,.59,.082),(1.82,1.40,.56,.078),(1.19,1.47,.58,.071),
                (.58,1.21,.67,.068),(.20,1.01,.85,.052)],gasket,6)
    base.cable([(-.35,1.39,.44,.06),(-.61,1.14,.48,.06),(-1.08,.60,.70,.064),
                (-1.28,.36,1.13,.052)],bronze,5)
    for x in (-1.79,.81):
        # Heated posts mark the service steps when the apron is snow-covered.
        base.cable([(x,-2.17,.13,.13),(x,-2.17,.32,.10),
                    (x-.065,-2.22,.83,.066),(x-.11,-2.23,.99,.085)],steel,6)
        base.cable([(x-.10,-2.23,.91,.095),(x-.10,-2.23,1.02,.071)],amber,6)

    # The three overlapping local clamshells share one horizontal axle.
    head.cable([(-1.64,0,0,.17),(-1.41,0,0,.16),(1.41,0,0,.16),(1.64,0,0,.17)],gasket,10)
    head.cable([(-1.39,.03,.05,.12),(-.86,.24,.25,.16),(0,.46,.43,.18),
                (.86,.24,.25,.16),(1.39,.03,.05,.12)],steel,7)
    for side in (-1,1):
        head.cable([(side*1.42,.19,-.07,.089),(side*.92,.30,-.59,.091),
                    (side*.66,.53,-.79,.077)],titanium,5)

    def window(x,half_width,half_height,sweep):
        def point(u,v,depth):
            return (x+u,depth+.37*v+sweep*u,v)
        outline = clipped_rectangle(half_width,half_height,min(.31,half_width*.40))
        shell = [[point(u*f,v*f,d) for u,v in outline]
                 for d,f in ((.21,.85),(.11,1.0),(-.169,1.0),(-.23,.92))]
        head.loft(shell,steel,[titanium,steel,bronze])
        optic = [[point(u*f,v*f,d+.031*abs(u)) for u,v in outline]
                 for d,f in ((-.269,.91),(-.298,.83),(-.306,.75))]
        head.loft(optic,glass,[glass_dark,glass])
        for v in (-.43,.21):
            head.cable([(*point(-half_width*.67,v,-.307),.016),
                        (*point(half_width*.67,v,-.307),.016)],titanium,4)
        head.cable([(*point(-half_width*.43,-half_height*.86,-.235),.025),
                    (*point(half_width*.39,-half_height*.86,-.235),.025)],guide,4)

    window(0,.76,1.24,0)
    for side in (-1,1):
        window(side*1.32,.52,1.04,side*.31)
        head.cable([(side*.32,.39,1.11,.066),(side*.69,.42,1.24,.056),
                    (side*1.19,.50,.97,.056)],bronze,5)
    head.cable([(0,-.23,.02,.171),(0,-.37,.05,.176),(0,-.53,.09,.108)],gasket,10)
    head.cable([(0,-.51,.08,.091),(0,-.565,.10,.086)],amber,8)

    origin = base.object("frost-radiometer")
    scanner = head.object("Radiometer_Pivot")
    scanner.parent = origin
    scanner.location = (0,.12,2.82)
    objects = [origin,scanner]
    triangles = 0
    for obj in objects:
        finish_surface(obj,reach=.34)
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
    if triangles>2400:
        raise ValueError(f"Radiometer: {triangles} triangles exceeds 2400")
    print(f"ASSET {origin.name} · {triangles}/2400 triangles")
    folder = MODELS/"scenery"
    export(origin.name,objects,folder)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder/(origin.name+".blend")),compress=True)
    render("scenery/"+origin.name,direction=(-.54,-.84,.68),model=origin)


if __name__ == "__main__":
    build()
