"""Sculpt a continuous landscape for each of the six grounded campaign scenes."""
from math import exp, hypot, sin
from pathlib import Path
from random import Random
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from tools.blender.style import MODELS, export_model, render, reset_scene


# Scene coordinates (X, Z, height). Pads hold the footings, while the larger
# slopes continue through the edges of the camera's orbit.
SCENES = {
    'heliostat': (-16.2, (.061, .087, .036), (.170, .209, .070), (.076, .153, .055), [
        (-10.5, -13.4, -8.9, 5.2), (22.55, 6.65, -8.71, 13.8),
        (9.7, 15.8, -9.5, 5.5),
        (-16.4, 3.1, -10.4, 6), (21.5, -16., -14.3, 7),
    ]),
    'grotto': (-17.1, (.024, .036, .058), (.075, .092, .132), (.055, .057, .102), [
        (12.8, 10.5, -8.22, 11), (-11.8, -10.4, -5.46, 6.4),
        (-13.8, -15.7, -8.45, 5.1), (27.5, -1.5, -12.1, 7.9), (24, -22, -16.7, 9),
    ]),
    'frost': (-16.3, (.067, .121, .181), (.180, .284, .360), (.074, .149, .217), [
        (-10.5, -13.9, -10.42, 9.4), (8.7, 13.95, -10.25, 7.5),
        (-17.5, 10.4, -11.36, 6.4), (24, -23.8, -18.1, 8),
        (27.7, 11.0, -14.64, 5.2), (29.8, 2.9, -14.64, 5.2),
    ]),
    'forge': (-15.9, (.023, .023, .032), (.092, .064, .066), (.046, .052, .063), [
        (-10.9, -13.6, -8.6, 5.7), (9.8, 15.1, -9.1, 5.8),
        (-17.5, 10.4, -11.6, 6.7), (24.5, -6.5, -13.6, 6.8),
        (31, -29, -15.95, 10),
    ]),
    'abyss': (-18.4, (.027, .055, .083), (.051, .117, .127), (.062, .087, .105), [
        (-9.7, -13.4, -7.64, 4.9), (18.7, 5, -11.45, 6.7),
        (9.3, 16.4, -8.46, 4.9), (-17.7, 10.8, -9.5, 5.7),
        (31., 6.8, -13.15, 8.8),
    ]),
    'sanctuary': (-17.1, (.044, .050, .072), (.127, .115, .132), (.071, .091, .081), [
        (-10.4, -15.4, -8.32, 5.2), (12.8, 12.25, -8.48, 7.5),
        (-12.75, -10.8, -12.43, 6.0), (17, -24.4, -12.43, 6.9),
        (36.4, 2.8, -14.50, 10.2),
    ]),
}

FLOOR = -40
TRAILS = {
    'heliostat': (.224, .169, .087, [(-10.5,-13.4),(-15,-8),(-16.5,2),(-14,12),(-6,15),(8,15.8),
                                             (15,15.5),(20,12.5),(22.55,6.65)]),
    'forge': (.128, .093, .082, [(9.8,15.1),(17,12),(22.4,6),(24.5,-6.5)]),
    'sanctuary': (.176, .139, .107, [(-10.4,-15.4),(-12.75,-10.8),(-17.6,2),(-12,12.8),(2,16),
                                            (12.8,12.25),(23.5,11.8),(29.6,7.2),(36.4,2.8)]),
}


def trail_distance(x, z, points):
    closest = float('inf')
    for (ax,az),(bx,bz) in zip(points,points[1:]):
        dx,dz = bx-ax,bz-az
        t = max(0,min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)))
        closest = min(closest,hypot(x-ax-dx*t,z-az-dz*t))
    return closest


def bed(theme):
    depth, shadow, light, secondary, pads = SCENES[theme]
    rng = Random(815 + list(SCENES).index(theme)*11)
    lines = [-112,-91,-73,-59,-48,-40,-34,-29,-25,-22,-19,-16,-13,-10,-8,-6,
             -4,-2,0,2,4,6,8,10,13,16,19,22,25,29,34,40,48,59,73,91,112]
    width = len(lines)
    vertices, faces, colors = [], [], []

    def profile(x, z):
        radial = hypot(x,z)
        broad = sin(.144*x+.067*z)+.5*sin(.31*z-.123*x)
        sediment = sin(.41*x+.31*z+.71*broad)
        channel = abs(x-.48*z-(19+8.5*sin(.078*z)))
        if theme == 'forge':
            channel = abs(.19*x+.72*sin(.117*z)+.23*sin(.30*z)-1.54)*6
        if theme == 'abyss':
            channel = abs(x+.52*z-7.8-5*sin(.066*z))
        floor = depth+1.43*broad+.62*sediment
        if theme in ('heliostat','forge','abyss'):
            floor -= 4.1*exp(-(channel/4.8)**2)
        if theme == 'abyss':
            slope = exp(-((z+21.0+.16*x)/10.5)**2)
            floor -= 3.3*slope*max(0,min(1,(x-7.)/16.))
        if theme == 'forge':
            river = abs(x-(27.3+.34*z+.90*sin(.21*z)))
            reach = 1.-exp(-((z-3.1)/6.4)**2)
            north = max(0,min(1,(z-2)/5.5))
            floor -= 6.4*exp(-(river/3.5)**2)*reach*north
        if theme == 'frost':
            floor += 1.67*sin(.137*x-.21*z+1.4*broad)
        if theme == 'grotto':
            floor -= 3.4*exp(-((x+.3*z+19)/6)**2)
        if theme == 'sanctuary':
            floor += .88*sin(.35*radial+.4*broad)
            verge = exp(-((x-25.6)/5.1)**2-((z+10.8)/15.6)**2)
            floor -= 4.45*verge
        # The central shelf holds all twelve platform piers. Peripheral ridges
        # dissolve into fog instead of exposing the border of the mesh.
        deck_distance = max(abs(x),abs(z))
        floor = max(floor, -8.52-.49*max(0,deck_distance-9.3))
        for px,pz,height,radius in pads:
            distance = hypot(x-px,z-pz)
            floor = max(floor,height-1.02*max(0,distance-radius*.65))
        if theme == 'frost':
            fault = abs(z-(6.9+.19*(x-28.75)+.67*sin((x-28.75)*.22)))
            reach = exp(-((x-29.5)/8.4)**4)
            bank = min(1,max(0,(fault-.63)/2.52))
            floor -= reach*max(0,floor-(-22.9+9.4*bank))
        if theme == 'grotto':
            inlet = hypot((x+16.6+.12*(z+9.0))/6.8,(z+9.0)/9.0)
            lake = hypot((x-29.6+.07*(z-9.5))/8.7,(z-9.5)/8.8)
            basin = min(inlet,lake)
            shore = min(1,max(0,(basin-.54)/.61))
            bedrock = -19.5+7.8*shore+.37*sediment
            cut = min(1,max(0,(-x-12.05)/1.85,(x-18.4)/2.06))
            if basin<1.15:
                floor -= cut*max(0,floor-bedrock)
            # Continue the back passage beyond the arch while retaining its
            # enclosing rock shelves and the dry ground beneath the board.
            along = .539*(x-38)-.842*(z+15.6)
            width = .842*(x-38)+.539*(z+15.6)
            reach = exp(-(width/6.6)**4) * exp(-((along-4.2)/18)**4)
            floor -= reach*max(0,floor-(-20.45+.15*sediment))
        hills = exp(-((radial-61)/24)**2)
        floor += hills*(3.5+(2.4 if theme in ('grotto','frost') else 1.14)*broad)
        floor = min(floor,-5.25)
        branch = .28 if theme == 'frost' else .53
        mix = .43+.18*broad+.12*sediment+.065*rng.uniform(-1,1)
        accent = max(0.,sin(.19*x-.23*z+.54*broad))*branch
        shade = tuple((a+(b-a)*mix)*(1-accent)+c*accent
                      for a,b,c in zip(shadow,light,secondary))
        if theme == 'frost':
            deep = min(1,max(0,(-floor-15.9)/7.))
            shade = tuple(c*(1-deep*.87)+ice*deep*.87 for c,ice in zip(shade,(.025,.071,.121)))
            compacted = exp(-((x-8.7-.37*(z-14.5))/1.72)**2-((z-14.5)/4.9)**4)
            shade = tuple(c*(1-compacted*.34)+ice*compacted*.34 for c,ice in zip(shade,(.095,.163,.200)))
        if theme in TRAILS:
            r,g,b,route = TRAILS[theme]
            path = .76*exp(-(trail_distance(x,z,route)/(1.36+.23*broad))**2)
            shade = tuple(value*(1-path)+gravel*path for value,gravel in zip(shade,(r,g,b)))
        return floor,shade

    for j,z in enumerate(lines):
        for i,x in enumerate(lines):
            dx,dz = (rng.uniform(-.34,.34),rng.uniform(-.34,.34)) if 0<i<width-1 and 0<j<width-1 else (0,0)
            height,color = profile(x+dx,z+dz)
            # glTF converts Blender XY into game X and minus Z.
            vertices.append((x+dx,-(z+dz),height-FLOOR))
            colors.append((*color,1))
    for j in range(width-1):
        for i in range(width-1):
            a = j*width+i
            b,c,d = a+1,a+width,a+width+1
            faces.extend(((a,c,d),(a,d,b)) if (i+j)%2 else ((a,c,b),(b,c,d)))
    perimeter = [*range(width), *(j*width+width-1 for j in range(1,width)),
                 *(width*(width-1)+i for i in range(width-2,-1,-1)),
                 *(j*width for j in range(width-2,0,-1))]
    for i,source in enumerate(perimeter):
        x,y,_ = vertices[source]
        vertices.append((x,y,0))
        colors.append((*shadow,1))
        following = (i+1)%len(perimeter)
        faces.append((source,perimeter[following],width*width+following,width*width+i))

    name = theme+'-terrain'
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices,[],faces)
    mesh.update()
    model = bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(model)
    material = bpy.data.materials.new('Terrain · '+theme)
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value = .9
    material.diffuse_color = (1,1,1,1)
    material.node_tree.links.new(material.node_tree.nodes.new('ShaderNodeVertexColor').outputs['Color'],shader.inputs['Base Color'])
    mesh.materials.append(material)
    pigment = mesh.color_attributes.new(name='Layered ground pigment',type='FLOAT_COLOR',domain='POINT')
    for i,color in enumerate(colors):
        pigment.data[i].color = color
    mesh.color_attributes.active_color = pigment
    bpy.context.view_layer.objects.active = model
    model.select_set(True)
    return model


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    bpy.context.preferences.filepaths.save_version = 0
    folder = MODELS/'scenery'
    for theme in [arg for arg in args if arg != '--preview'] or SCENES:
        reset_scene()
        model = bed(theme)
        export_model(model,3100,folder)
        bpy.ops.wm.save_as_mainfile(filepath=str(folder/(model.name+'.blend')),compress=True)
        if '--preview' in args:
            render('scenery/'+model.name,model=model)
