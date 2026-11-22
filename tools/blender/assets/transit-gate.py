"""Segmented transfer gantry and travelling inspection carriage, Blender Z-up."""
from math import cos, sin, pi
from pathlib import Path
import sys
import bpy

ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT))
from tools.blender.style import Sculpture, export, make_material, plate, reset_scene
from tools.blender.orbital_finish import finish_surface

reset_scene()
folder=ROOT/"assets/models/benchmark/station"
seal=make_material("Gate graphite seals","obsidian",.38,.53)
navy=make_material("Gate enamel","navy",.49,.32)
steel=make_material("Gate manganese steel","steel",.68,.37)
lip=make_material("Gate honed titanium","titanium",.74,.24)
copper=make_material("Gate conductors","copper",.72,.34)
light=make_material("Gate guide lamps","amber",.18,.27,2.2)
glass=make_material("Gate sensor sapphire","cyan",.32,.16,.5)
s=Sculpture()
axis=2.06

def arc(lo,hi,profile,finishes,n):
    # The underside remains visible from the board. Each section has its
    # own inner lip, sloping shoulders and dark joint between armour cassettes.
    off=len(s.vertices)
    for i in range(n+1):
        a=lo+(hi-lo)*i/n
        s.vertices.extend((r*cos(a),y,axis+r*sin(a)) for r,y in profile)
    k=len(profile)
    for i in range(n):
        for j,mat in enumerate(finishes):
            p=off+i*k+j;q=off+i*k+(j+1)%k
            s.face((p,q,q+k,p+k),mat)
    for i in (0,n):
        s.face(tuple(off+i*k+j for j in range(k)),seal)

def band(lo,hi,r,w,y,d,mat,n=6):
    arc(lo,hi,[(r,y),(r+w,y),(r+w,y+d),(r,y+d)],[mat]*4,n)

arc(0,pi,[(3.32,-.48),(3.56,-.64),(3.94,-.61),(4.11,-.39),
    (4.11,.39),(3.94,.61),(3.56,.64),(3.32,.47)],[steel,seal,navy,steel,navy,seal,steel,seal],40)
for i in range(11):
    a,b=i*pi/11+.009,(i+1)*pi/11-.009
    arc(a,b,[(3.31,-.42),(3.42,-.636),(3.61,-.69),(3.96,-.65),(4.15,-.455),
        (4.18,.29),(4.07,.52),(3.58,.63),(3.33,.43)],
        [lip,steel,navy,steel,navy,steel,navy,steel,seal],5)
    band(a+.014,b-.014,3.65,.21,-.686,-.027,navy if i%3 else steel)
    band(a+.049,b-.05,3.49,.063,-.665,-.031,light if i in (1,4,5,6,9) else copper)
    for y in (-.26,.25):
        band(a,b,3.255,.046,y,.054,copper)

for side in (-1,1):
    x=side*3.71
    plate(s,[(.86,1.08,.22,0),(.94,1.11,.24,.13),(.88,1.05,.22,.30),
             (.77,.94,.22,.48)],seal,[steel,navy,lip],center=(x,0))
    plate(s,[(.68,.79,.16,.48),(.68,.77,.17,.74),(.47,.62,.15,1.45),
             (.445,.60,.14,2.11)],navy,[seal,steel,navy],center=(x,0))
    for y in (-.72,.72):
        s.cable([(x+side*.43,y*1.15,.42,.115),(x+side*.37,y,1.00,.103),
                 (x+side*.22,y*.75,1.76,.082)],copper,10)
    for i in range(3):
        plate(s,[(.26,.036,.024,.77+i*.20),(.247,.036,.022,.83+i*.20)],
              seal,[lip],center=(x,-.693+i*.043))
# A cantilever joins the two feet to the inboard gallery.
plate(s,[(4.58,1.15,.27,-.48),(4.73,1.43,.33,-.23),(4.69,1.43,.33,-.04),
         (4.60,1.35,.30,0)],navy,[steel,navy,lip])
for x in (-3.68,0,3.68):
    for y in (-.80,.80):
        s.cable([(x,y,-.24,.19),(x+.60,y+1.19,-.74,.18),
                 (x+1.33,y+2.64,-1.06,.14)],steel,8)
for side in (-1,1):
    x=side*3.71
    plate(s,[(.92,1.23,.28,0),(.93,1.26,.25,.15)],steel,[seal],center=(x,0))
frame=s.object("Transfer arch")
finish_surface(frame,reach=.44)

# The trolley is authored at three o'clock. Its object origin is the
# centre of the circular guideway, so a single rotation moves all its parts.
s=Sculpture()
plate(s,[(.244,.42,.088,-.30),(.32,.48,.096,-.19),(.33,.49,.10,.16),
         (.24,.43,.09,.30)],seal,[steel,navy,lip],center=(3.28,0))
for y in (-.43,.43):
    s.cable([(3.27,y,-.19,.15),(3.29,y,.20,.15)],steel,10)
    s.cable([(3.26,y,-.145,.105),(3.26,y,.15,.105)],copper,10)
for x,r,mat in [(3.01,.21,seal),(2.98,.168,lip),(2.955,.123,glass)]:
    s.cable([(x,0,0,r),(x-.058,0,0,r*.87)],mat,16)
carriage=s.object("Inspection carriage")
finish_surface(carriage,reach=.20)
carriage.location.z=axis
carriage.rotation_euler.y=-.65*pi
folder.mkdir(parents=True,exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(folder/"transit-gate.blend"),compress=True)
export("transit-gate",[frame,carriage],folder)
