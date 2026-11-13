// Copyright (c) Chromatron3D contributors. Original in-house asset geometry.
// Run: node scripts/generate-biome-models.mjs
import {mkdir,writeFile} from 'node:fs/promises';

function generateBiomes(){
 const TWO=Math.PI*2;
 const mat=(name,color,metallic=0.4,roughness=.55,emissive=0)=>({
  name,pbrMetallicRoughness:{baseColorFactor:[
   ((color>>16)&255)/255,((color>>8)&255)/255,(color&255)/255,1
  ],metallicFactor:metallic,roughnessFactor:roughness},
  emissiveFactor:emissive?[((emissive>>16)&255)/255,((emissive>>8)&255)/255,(emissive&255)/255]:[0,0,0],
  doubleSided:true
 });
 const v=(x,y,z)=>[x,y,z],add=(a,b)=>a.map((n,i)=>n+b[i]),sub=(a,b)=>a.map((n,i)=>n-b[i]),scale=(a,s)=>a.map(n=>n*s);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const norm=(a)=>{const l=Math.hypot(...a)||1;return scale(a,1/l)};
 function build(name,materials){
  const geometry=materials.map(()=>({p:[],n:[]}));
  let faces=0;
  function tri(m,a,b,c){
   const normal=norm(cross(sub(b,a),sub(c,a)));
   geometry[m].p.push(...a,...b,...c);
   geometry[m].n.push(...normal,...normal,...normal);
   faces++;
  }
  function quad(m,a,b,c,d){tri(m,a,b,c);tri(m,a,c,d)}
  function beam(a,b,width,depth,m){
   const tangent=norm(sub(b,a));
   const helper=Math.abs(tangent[1])>.94?v(1,0,0):v(0,1,0);
   const u=scale(norm(cross(tangent,helper)),width/2),w=scale(norm(cross(tangent,u)),depth/2);
   const corners=[];
   for(const pt of [a,b])corners.push(
    add(add(pt,u),w),add(sub(pt,u),w),
    sub(sub(pt,u),w),add(sub(pt,w),u)
   );
   const q=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
   for(const face of q)quad(m,...face.map(i=>corners[i]));
  }
  function box(x,y,z,w,h,d,m){
   beam(v(x,y-h/2,z),v(x,y+h/2,z),w,d,m);
  }
  function tube(points,radius,sideCount,m){
   const rings=[];
   for(let i=0;i<points.length;i++){
    const tangent=norm(sub(points[Math.min(i+1,points.length-1)],points[Math.max(i-1,0)]));
    const helper=Math.abs(tangent[1])>.92?v(1,0,0):v(0,1,0);
    const u=norm(cross(tangent,helper)),w=norm(cross(tangent,u));
    const ring=[];
    for(let j=0;j<sideCount;j++){
     const a=j*TWO/sideCount;
     ring.push(add(points[i],scale(add(scale(u,Math.cos(a)),scale(w,Math.sin(a))),radius)));
    }
    rings.push(ring);
   }
   for(let i=0;i<rings.length-1;i++)for(let j=0;j<sideCount;j++){
    const k=(j+1)%sideCount;
    quad(m,rings[i][j],rings[i][k],rings[i+1][k],rings[i+1][j]);
   }
   for(let j=0;j<sideCount;j++){
    const k=(j+1)%sideCount;
    tri(m,points[0],rings[0][k],rings[0][j]);
    tri(m,points[points.length-1],rings[rings.length-1][j],rings[rings.length-1][k]);
   }
  }
  function curveTube(controlPoints,radius,m,steps=24){
   const pts=[];
   for(let i=0;i<=steps;i++){
    const q=i/steps,len=controlPoints.length;
    const segment=Math.min(len-2,Math.floor(q*(len-1)));
    const a=controlPoints[segment],b=controlPoints[segment+1];
    const t=q*(len-1)-segment;
    const t2=t*t*(3-2*t);
    pts.push(add(scale(a,1-t2),scale(b,t2)));
   }
   tube(pts,radius,7,m);
  }
  function ring(cx,cy,cz,rx,rz,radius,m,steps=48){
   const pts=[];
   for(let i=0;i<=steps;i++){
    const a=i*TWO/steps;
    pts.push(v(cx+Math.cos(a)*rx,cy+Math.sin(a)*.13,cz+Math.sin(a)*rz));
   }
   tube(pts,radius,6,m);
  }
  function crystal(x,z,base,height,radius,leanX,leanZ,m,sides=7,tipAngle=0){
   function tier(y,r,offX,offZ,twist){
    const arr=[];
    for(let i=0;i<sides;i++){
     const a=i*TWO/sides+twist;
     const scaleVar=1+0.13*Math.sin(i*5+height*2);
     arr.push(v(x+offX+Math.cos(a)*r*scaleVar,base+y,
      z+offZ+Math.sin(a)*r*scaleVar));
    }
    return arr;
   }
   const bottom=tier(0,radius*.75,0,0,tipAngle);
   const middle=tier(height*.26,radius,.11*leanX,.12*leanZ,tipAngle+.09);
   const shoulder=tier(height*.66,radius*.62,leanX*.6,leanZ*.55,tipAngle-.07);
   const tip=v(x+leanX,base+height,z+leanZ);
   for(let i=0;i<sides;i++){
    const next=(i+1)%sides;
    quad(m,bottom[i],bottom[next],middle[next],middle[i]);
    quad(m,middle[i],middle[next],shoulder[next],shoulder[i]);
    tri(m,shoulder[i],shoulder[next],tip);
    tri(m,v(x,base,z),bottom[i],bottom[next]);
   }
  }
  function leaf(stem,tip,width,m){
   const d=sub(tip,stem),side=norm(cross(d,[0,0,1]));
   const mid=add(stem,scale(d,.53)),ridge=add(mid,v(0,.10,0));
   const left=add(mid,scale(side,width)),right=sub(mid,scale(side,width));
   const base=add(stem,scale(d,.12));
   tri(m,base,left,ridge);tri(m,base,ridge,right);
   tri(m,ridge,left,tip);tri(m,ridge,tip,right);
  }
  function boulder(x,y,z,rx,ry,rz,m,sides=8){
   const bottom=[],wide=[],top=[];
   for(let j=0;j<sides;j++){
    const a=TWO*j/sides;
    const rough=.82+.17*Math.sin(j*17+rx*3);
    bottom.push(v(x+Math.cos(a)*rx*.61*rough,y,z+Math.sin(a)*rz*.61*rough));
    wide.push(v(x+Math.cos(a)*rx*rough,y+ry*.44,z+Math.sin(a)*rz*rough));
    top.push(v(x+Math.cos(a)*rx*.48*rough,y+ry*.86,z+Math.sin(a)*rz*.48*rough));
   }
   for(let j=0;j<sides;j++){
    const k=(j+1)%sides;
    quad(m,bottom[j],bottom[k],wide[k],wide[j]);
    quad(m,wide[j],wide[k],top[k],top[j]);
    tri(m,top[j],top[k],v(x,y+ry,z));
    tri(m,bottom[k],bottom[j],v(x,y,z));
   }
  }
  function cylinder(x,y,z,r,h,m,sides=12){
   const bottom=[],top=[];
   for(let i=0;i<sides;i++){
    const a=TWO*i/sides;
    bottom.push(v(x+r*Math.cos(a),y,z+r*Math.sin(a)));
    top.push(v(x+r*Math.cos(a),y+h,z+r*Math.sin(a)));
   }
   for(let i=0;i<sides;i++){
    const j=(i+1)%sides;
    quad(m,bottom[i],bottom[j],top[j],top[i]);
    tri(m,v(x,y,z),bottom[i],bottom[j]);
    tri(m,v(x,y+h,z),top[j],top[i]);
   }
  }
  // Small emissive sphere for warning lights / signal beacons
  function sphere(cx,cy,cz,r,m,latSteps=5,lonSteps=6){
   const verts=[];
   for(let lat=0;lat<=latSteps;lat++){
    const theta=lat*Math.PI/latSteps;
    for(let lon=0;lon<=lonSteps;lon++){
     const phi=lon*TWO/lonSteps;
     verts.push(v(cx+r*Math.sin(theta)*Math.cos(phi),
      cy+r*Math.cos(theta),cz+r*Math.sin(theta)*Math.sin(phi)));
    }
   }
   for(let lat=0;lat<latSteps;lat++)for(let lon=0;lon<lonSteps;lon++){
    const a=lat*(lonSteps+1)+lon,b=a+lonSteps+1;
    if(lat>0)tri(m,verts[a],verts[b],verts[a+1]);
    if(lat<latSteps-1)tri(m,verts[a+1],verts[b],verts[b+1]);
   }
  }
  // Flat-topped mushroom cap (for verdant overgrowth)
  function mushroom(cx,cy,cz,stemR,stemH,capR,capH,stemMat,capMat,sides=6){
   cylinder(cx,cy,cz,stemR,stemH,stemMat,sides);
   // Cap: flat top with sloped sides
   const bottom=[],top=[];
   for(let i=0;i<sides;i++){
    const a=TWO*i/sides;
    bottom.push(v(cx+capR*Math.cos(a),cy+stemH,cz+capR*Math.sin(a)));
    top.push(v(cx+capR*.6*Math.cos(a),cy+stemH+capH,cz+capR*.6*Math.sin(a)));
   }
   for(let i=0;i<sides;i++){
    const j=(i+1)%sides;
    quad(capMat,bottom[i],bottom[j],top[j],top[i]);
    tri(capMat,v(cx,cy+stemH+capH,cz),top[i],top[j]);
    tri(capMat,v(cx,cy+stemH,cz),bottom[j],bottom[i]);
   }
  }
  function makeGLB(){
   const views=[],accessors=[],primitives=[],data=[];
   let offset=0;
   function addFloats(floats,type,minmax){
    while(offset%4){data.push(0);offset++}
    const start=offset,arr=new Float32Array(floats);
    const view=new DataView(new ArrayBuffer(arr.length*4));
    for(let i=0;i<arr.length;i++)view.setFloat32(i*4,arr[i],true);
    const bytes=new Uint8Array(view.buffer);
    for(const b of bytes)data.push(b);
    offset+=bytes.length;
    const bv=views.push({buffer:0,byteOffset:start,byteLength:bytes.length,target:34962})-1;
    const acc={bufferView:bv,componentType:5126,count:floats.length/3,type};
    if(minmax){
     const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
     for(let i=0;i<floats.length;i+=3)for(let k=0;k<3;k++){
      lo[k]=Math.min(lo[k],floats[i+k]);hi[k]=Math.max(hi[k],floats[i+k]);
     }
     acc.min=lo;acc.max=hi;
    }
    return accessors.push(acc)-1;
   }
   for(let i=0;i<geometry.length;i++){
    const g=geometry[i];if(!g.p.length)continue;
    const pi=addFloats(g.p,'VEC3',true),ni=addFloats(g.n,'VEC3',false);
    primitives.push({attributes:{POSITION:pi,NORMAL:ni},material:i,mode:4});
   }
   while(data.length%4)data.push(0);
   const json={asset:{version:"2.0",generator:"Chromatron3D hand-built biome models v2"},
    scene:0,scenes:[{nodes:[0]}],nodes:[{name,mesh:0}],meshes:[{name,primitives}],
    materials,accessors,bufferViews:views,buffers:[{byteLength:data.length}]};
   const string=JSON.stringify(json);
   const bytes=[];
   for(let i=0;i<string.length;i++){
    const c=string.charCodeAt(i);
    if(c<128)bytes.push(c);
    else if(c<2048)bytes.push(0xc0|(c>>6),0x80|(c&63));
    else bytes.push(0xe0|(c>>12),0x80|((c>>6)&63),0x80|(c&63));
   }
   while(bytes.length%4)bytes.push(32);
   const total=12+8+bytes.length+8+data.length;
   const glb=new Uint8Array(total);
   const dv=new DataView(glb.buffer);
   dv.setUint32(0,0x46546c67,true);
   dv.setUint32(4,2,true);
   dv.setUint32(8,total,true);
   dv.setUint32(12,bytes.length,true);
   dv.setUint32(16,0x4e4f534a,true);
   glb.set(bytes,20);
   const idx=20+bytes.length;
   dv.setUint32(idx,data.length,true);
   dv.setUint32(idx+4,0x004e4942,true);
   glb.set(new Uint8Array(data),idx+8);
   return {bytes:glb,faces,primitiveCount:primitives.length,
    vertices:geometry.reduce((sum,g)=>sum+g.p.length/3,0),json};
  }
  return{v,tri,quad,beam,box,tube,curveTube,ring,crystal,leaf,boulder,cylinder,sphere,mushroom,makeGLB};
 }
 const models={};

 // ═══════════════════════════════════════════════════════════════════════
 //  ORBITAL — Titan cargo gantry with industrial detail
 // ═══════════════════════════════════════════════════════════════════════
 {
  const m=[mat('graphite armored steel',0x344957,.86,.32),
   mat('worn titanium ribbing',0x829ba4,.76,.29),
   mat('oxidized brushed metal',0x536b6d,.7,.49),
   mat('warm hazard saffron',0xe7a650,.56,.36),
   mat('electric-cyan energy buses',0x2cb4d2,.30,.21,0x28b7dc),
   mat('blackened industrial core',0x1b2b35,.9,.36),
   mat('warning-light emissive',0xff6622,.15,.25,0xff4400)];
  const g=build('ORBITAL / Titan cargo gantry',m);

  // Main pylons and buttresses
  for(const sign of [-1,1]){
   g.box(sign*2.93,.26,0,1.8,.5,2.15,0);
   g.beam(g.v(sign*3.05,.3,0),g.v(sign*2.6,5.0,.12),.65,.77,1);
   g.beam(g.v(sign*4.0,.28,-.38),g.v(sign*2.6,3.85,.10),.26,.31,0);
   g.beam(g.v(sign*2.6,1.0,.0),g.v(sign*3.9,.32,.66),.32,.31,2);
   g.box(sign*2.9,.57,-.87,1.15,.15,.28,3);
   g.box(sign*2.52,4.93,.25,1.1,.42,1.15,0);
   for(let k=0;k<3;k++)g.box(sign*2.86,1.25+k*1.15,.54,.1,.10,.12,4);

   // Pipe runs along the pylons
   g.curveTube([g.v(sign*3.65,.35,-.20),g.v(sign*3.35,1.8,.0),g.v(sign*3.05,3.5,.08),g.v(sign*2.85,4.8,.12)],.065,2,18);
   g.curveTube([g.v(sign*3.55,.38,.25),g.v(sign*3.25,2.0,.30),g.v(sign*2.95,3.8,.25)],.055,0,14);

   // Small catwalk platforms on pylons
   g.box(sign*3.45,2.1,.0,.85,.06,.55,1);
   g.beam(g.v(sign*3.45,2.13,.28),g.v(sign*3.45,2.13,-.28),.04,.06,3);

   // Warning lights on pylons
   g.sphere(sign*3.05,5.05,.12,.09,6);
   g.sphere(sign*3.65,.58,-.38,.07,6);
  }

  // Main bridge beams
  g.beam(g.v(-3.45,5.14,0),g.v(3.15,5.14,0),.39,.85,1);
  g.beam(g.v(-3.45,5.77,-.13),g.v(3.30,5.77,-.13),.20,.26,0);

  // Bridge cross-bracing (X-pattern trusses)
  for(let k=0;k<7;k++){
   const x=-2.9+k*.95;
   g.beam(g.v(x,5.25,-.26),g.v(x+.65,5.70,-.26),.105,.11,3);
   g.beam(g.v(x,5.70,.25),g.v(x+.55,5.2,.25),.11,.11,2);
  }

  // Catwalk connecting the two pylons across the bridge
  g.box(0,5.02,.42,5.5,.05,.38,1);
  g.beam(g.v(-2.7,5.05,.62),g.v(2.7,5.05,.62),.035,.065,3);

  // Suspended reactor cargo pod
  g.box(-.48,3.4,.12,2.25,1.26,1.5,5);
  g.box(-.48,4.10,.12,2.15,.21,1.38,2);
  g.box(-.48,2.71,.12,2.1,.22,1.25,1);
  for(const x of [-1.42,.46]){
   g.beam(g.v(x,4.88,0),g.v(x,4.0,0),.075,.075,2);
   g.box(x,3.34,.91,.12,.62,.1,4);
  }
  for(let i=0;i<5;i++){g.box(-1.38+i*.44,3.37,.93,.23,.74,.055,i%2?3:1)}

  // Hanging cables from bridge to pod
  g.curveTube([g.v(-1.2,5.12,.0),g.v(-1.3,4.65,.06),g.v(-1.35,4.12,.10)],.04,2,12);
  g.curveTube([g.v(.8,5.12,.0),g.v(.7,4.55,-.04),g.v(.55,4.10,.08)],.04,2,12);
  g.curveTube([g.v(-2.0,5.14,.25),g.v(-1.8,4.3,.35),g.v(-1.65,3.75,.15)],.035,0,14);

  // Cargo containers stacked at base
  for(const [cx,cz,rot] of [[-1.8,.14,1.2],[1.5,.14,-1.1],[-2.4,.14,1.7],[2.0,.14,-1.6]]){
   g.box(cx,.42,cz,.85,.56,.52,0);
   g.box(cx,.73,cz,.88,.05,.55,3);
  }
  // Smaller crates
  for(const [cx,cz] of [[-.6,.14],[.9,.14],[-.2,.14]]){
   g.box(cx+1.6,.26,cz-1.4,.42,.28,.35,1);
  }

  // Satellite ring and antenna assembly
  g.ring(1.9,6.22,0,.86,.86,.12,1,32);
  g.curveTube([g.v(1.9,6.25,-.9),g.v(1.9,5.82,-.45),g.v(1.9,5.2,-.45)],.11,2);
  g.ring(1.9,6.35,0,.62,.62,.062,4,32);
  g.box(1.9,6.27,0,.34,.2,.34,5);

  // Small antenna dishes on top of bridge
  g.cylinder(-1.8,5.78,-.13,.25,.04,1,8);
  g.beam(g.v(-1.8,5.82,-.13),g.v(-1.8,6.25,-.13),.05,.05,0);
  g.sphere(-1.8,6.28,-.13,.06,4);
  g.cylinder(2.4,5.78,-.13,.20,.03,1,8);
  g.beam(g.v(2.4,5.81,-.13),g.v(2.4,6.1,-.13),.04,.04,0);
  g.sphere(2.4,6.13,-.13,.05,4);

  // Warning lights on bridge extremities and containers
  g.sphere(-3.4,5.80,0,.06,6);
  g.sphere(3.1,5.80,0,.06,6);
  g.sphere(0,5.82,.42,.05,6);

  models.orbital=g.makeGLB();
 }

 // ═══════════════════════════════════════════════════════════════════════
 //  VERDANT — Forgotten hanging garden arch with lush overgrowth
 // ═══════════════════════════════════════════════════════════════════════
 {
  const m=[mat('old jade-oxide architecture',0x455b54,.45,.73),
   mat('exposed silver under stone',0x708883,.67,.51),
   mat('lush fern leaf canopy',0x408d55,.05,.92),
   mat('fresh emerald foliage',0x7ac879,.04,.93),
   mat('ancient hanging roots',0x345b37,.04,.94),
   mat('ancient lit circuit channels',0x50a788,.18,.3,0x33a77a),
   mat('mossy natural stone',0x546c50,.03,.98),
   mat('mushroom cap tan',0x9b7d5e,.06,.88)];
  const g=build('VERDANT / Forgotten hanging garden arch',m);

  // Main pillars and base
  for(const sign of [-1,1]){
   g.box(sign*2.7,.24,.0,2.4,.42,2.2,0);
   g.beam(g.v(sign*2.86,.40,0),g.v(sign*2.43,4.45,.12),.97,1.10,0);
   g.beam(g.v(sign*2.92,1.0,.68),g.v(sign*2.48,4.2,.72),.11,.16,5);
   g.box(sign*2.7,3.30,-.47,1.32,.18,.26,1);

   // Extensive boulder clusters at the base
   for(let k=0;k<4;k++){
    const x=sign*(2.85-.18*k);
    g.boulder(x,.25,-1.03-.12*k,.48+.08*k,.55+.06*k,.64,6,7);
   }
   // More boulders on opposite side
   for(let k=0;k<3;k++){
    const x=sign*(2.60+.20*k);
    g.boulder(x,.22,1.10+.15*k,.42,.38,.52,6,6);
   }

   // Mushrooms growing on pillar surfaces
   g.mushroom(sign*3.15,1.2,.45,.04,.25,.14,.06,4,7);
   g.mushroom(sign*2.95,2.1,-.55,.035,.20,.12,.05,4,7);
   g.mushroom(sign*2.55,.48,.82,.05,.30,.16,.07,4,7);

   // Broken fallen structural piece at base, partially covered in moss
   g.box(sign*3.5,.18,.55,1.1,.12,.35,0);
   g.boulder(sign*3.3,.24,.60,.35,.22,.40,6,6);
  }

  // Ruined asymmetric cap with surviving bridge rails
  g.beam(g.v(-2.80,4.63,-.12),g.v(-.28,5.25,-.13),.63,1.06,1);
  g.beam(g.v(.12,5.31,-.10),g.v(2.45,4.43,-.1),.65,1.01,0);
  g.curveTube([g.v(-2.78,4.36,.49),g.v(-1.24,4.9,.5),g.v(.14,5.0,.5),g.v(2.34,4.23,.48)],.085,5,26);

  // Primary hanging vines (doubled from original 4 to 8)
  const vines=[
   [g.v(-2.47,5.01,.30),g.v(-2.16,4.47,1.0),g.v(-2.26,3.72,1.2),g.v(-1.96,2.40,1.38)],
   [g.v(-.6,5.08,.4),g.v(-.86,4.16,1.14),g.v(-.65,3.14,1.22),g.v(-.76,2.34,1.36)],
   [g.v(1.76,4.74,.47),g.v(1.55,3.95,.96),g.v(1.64,3.24,1.10),g.v(1.36,2.21,1.22)],
   [g.v(2.49,3.10,.53),g.v(3.08,2.5,.72),g.v(3.20,1.55,1.14),g.v(3.4,.3,1.30)],
   // New vines — more organic hanging tendrils
   [g.v(-1.65,5.18,.32),g.v(-1.48,4.55,.88),g.v(-1.60,3.60,1.08),g.v(-1.40,2.85,1.25)],
   [g.v(.65,5.22,.38),g.v(.52,4.40,1.02),g.v(.70,3.45,1.15),g.v(.48,2.50,1.30)],
   [g.v(-2.90,3.85,.50),g.v(-3.12,3.15,.85),g.v(-3.0,2.30,1.00),g.v(-2.85,1.20,1.15)],
   [g.v(2.10,4.50,.44),g.v(2.30,3.72,.82),g.v(2.15,2.90,1.05),g.v(2.35,1.85,1.18)]
  ];
  for(const vine of vines){
   g.curveTube(vine,.075,4,20);
   for(let i=1;i<vine.length;i++){
    const p=vine[i],d=(i%2?1:-1);
    g.leaf(p,g.v(p[0]+d*.58,p[1]+.22,p[2]+.35),.23,i%2?3:2);
    g.leaf(g.v(p[0],p[1]-.14,p[2]),g.v(p[0]-d*.45,p[1]-.55,p[2]+.20),.19,2);
    // Secondary branching leaf
    if(i>1)g.leaf(g.v(p[0]+d*.12,p[1]+.08,p[2]+.15),g.v(p[0]+d*.48,p[1]+.40,p[2]+.30),.17,3);
   }
  }

  // Hanging root tendrils from the arch top
  const rootDrops=[
   [-.2,5.28,.20],[.35,5.25,.15],[-1.1,5.15,.25],[1.2,4.95,.30],
   [-1.8,4.88,.35],[1.8,4.60,.38],[-.7,5.20,.10],[.8,5.18,.22]
  ];
  for(const [rx,ry,rz] of rootDrops){
   g.curveTube([g.v(rx,ry,rz),g.v(rx+.05,ry-.45,rz+.12),g.v(rx-.03,ry-.95,rz+.08)],.04,4,10);
  }

  // Side ferns and foliage (denser than before)
  for(const sign of [-1,1])for(let i=0;i<7;i++){
   const x=sign*(2.6+.45*Math.sin(i*3)),z=(-.85+i*.30);
   const stem=g.v(x,.4,z),top=g.v(x+sign*.55,1.0+.25*(i%3),z+.30);
   g.curveTube([stem,g.v(x+sign*.22,.68,z),top],.065,4,9);
   g.leaf(g.v(x+sign*.22,.68,z),top,.22, i%2?3:2);
   // Extra leaf pair
   g.leaf(g.v(x+sign*.10,.52,z-.08),g.v(x+sign*.42,.88,z+.15),.18,i%2?2:3);
  }

  // Moss mounds on the arch crown
  for(let i=0;i<9;i++){
   const x=-2.85+i*.72;
   g.box(x,5.10-.35*Math.abs(x)/3,.47,.55,.13,.36,6);
   g.leaf(g.v(x,5.17-.35*Math.abs(x)/3,.38),g.v(x+.35,5.65-.2*Math.abs(x)/3,.58),.20,3);
   g.leaf(g.v(x-.15,5.14-.35*Math.abs(x)/3,.42),g.v(x-.40,5.58-.2*Math.abs(x)/3,.60),.18,2);
  }

  // More mushrooms on ground level
  g.mushroom(-1.0,.20,.95,.04,.18,.13,.05,4,7);
  g.mushroom(1.5,.20,-1.05,.035,.22,.11,.06,4,7);
  g.mushroom(-.3,.20,1.15,.04,.20,.14,.05,4,7);

  models.verdant=g.makeGLB();
 }

 // ═══════════════════════════════════════════════════════════════════════
 //  POLAR — Frozen signal spire observatory with dramatic ice
 // ═══════════════════════════════════════════════════════════════════════
 {
  const m=[mat('glacial basalt base',0x334963,.60,.47),
   mat('ice blue prism faces',0x7fcce9,.12,.19),
   mat('frosted sapphire facets',0x3e91c2,.11,.32),
   mat('ice white refractive ridges',0xd4f4f2,.08,.18),
   mat('snow-flecked foundation',0xaec4d4,.12,.79),
   mat('polar electric conduit',0x3aa5d9,.18,.2,0x42a8e0),
   mat('compacted snow white',0xe8eff5,.05,.90)];
  const g=build('POLAR / Frozen signal spire observatory',m);

  // Foundation platforms
  g.box(0,.22,0,6.8,.44,2.7,0);
  g.box(0,.55,-.46,6.3,.21,1.5,4);

  // Side buildings encased in ice
  for(const sign of [-1,1]){
   g.box(sign*2.73,1.2,-.38,.79,1.7,1.3,0);
   g.beam(g.v(sign*3.25,.4,-1.0),g.v(sign*2.6,2.45,-.55),.30,.44,0);
   g.box(sign*2.72,1.25,.39,.16,.65,.11,5);

   // Ice encasement on buildings
   g.crystal(sign*3.15,-.05,-.70,2.0,.45,sign*.15,-.20,1,6,.3);
   g.crystal(sign*3.40,.10,-.30,1.4,.35,sign*.10,.10,3,5,.2);
  }

  // Primary ice spires — taller and more varied
  g.crystal(-1.9,-.07,.44,5.6,1.0,-.60,-.38,1,7,.4);
  g.crystal(-.48,.27,.42,7.2,1.35,.20,-.50,2,8,.2);
  g.crystal(1.3,-.17,.38,6.2,1.05,.45,-.22,1,7,.1);
  g.crystal(2.65,.26,.42,4.5,.82,.62,.14,3,7,.18);
  g.crystal(-2.99,-.17,.43,4.0,.72,-.35,.18,2,6,.2);

  // Additional dramatic tall spires
  g.crystal(.30,-.10,.50,8.0,1.10,.10,-.55,2,9,.15);
  g.crystal(-1.2,.15,.48,5.0,.78,-.42,-.30,3,7,.25);
  g.crystal(2.0,-.05,.46,4.2,.65,.52,-.15,1,6,.35);

  // Secondary spire field
  for(let i=0;i<9;i++){
   const x=-3.2+i*.85;
   g.crystal(x,.9,.40,1.8+.30*(i%3),.32,(i%2?.12:-.15),.14,i%2?3:1,6,.15);
  }

  // Snow-drift boulders at base (wide, low, white)
  for(let i=0;i<7;i++){
   const x=-2.8+i*.95;
   g.boulder(x,.20,1.12+.08*(i%3),.62,.20,.55,6,6);
  }
  // Large snow drifts on sides
  g.boulder(-3.5,.18,.40,.80,.22,.70,6,7);
  g.boulder(3.5,.18,.35,.75,.20,.65,6,7);
  g.boulder(0,.16,1.55,.95,.18,.70,6,8);

  // Frozen waterfall shapes — flattened cascading tubes
  g.curveTube([g.v(-1.5,4.5,.42),g.v(-1.6,3.5,.48),g.v(-1.45,2.5,.52),g.v(-1.55,1.5,.50),g.v(-1.5,.5,.48)],.18,3,22);
  g.curveTube([g.v(.8,5.0,.45),g.v(.75,4.0,.50),g.v(.85,3.0,.48),g.v(.78,2.0,.52),g.v(.82,1.0,.46)],.15,1,22);

  // Ice bridges connecting crystal clusters
  g.beam(g.v(-1.5,3.2,.44),g.v(.5,3.8,.44),.20,.12,3);
  g.beam(g.v(1.0,2.5,.40),g.v(2.3,2.8,.42),.15,.10,1);

  // Icicle formations hanging from observatory ring
  for(let i=0;i<10;i++){
   const a=i*TWO/10;
   const px=2.25*Math.cos(a),py=3.50+2.15*Math.sin(a);
   if(py<3.5){
    g.crystal(px,py-1.2,-1.1,.6+.2*(i%3),.08,0,.05,3,5,.1);
   }
  }

  // Large observatory ring
  g.curveTube(Array.from({length:49},(_,i)=>{
   const a=i*TWO/48;
   return g.v(2.25*Math.cos(a),3.50+2.15*Math.sin(a),-1.1);
  }),.13,0,48);
  for(let i=0;i<14;i++){
   const a=i*TWO/14;
   const p=g.v(2.25*Math.cos(a),3.5+2.15*Math.sin(a),-1.1);
   const q=g.v(p[0]*.96,3.5+(p[1]-3.5)*.96,p[2]+.14);
   g.beam(p,q,.18,.13,5);
  }

  // Additional equipment partially frozen
  g.box(-3.0,1.0,-.80,.60,.80,.55,0);
  g.crystal(-3.0,.60,-.50,1.2,.35,-.10,.15,1,5,.2);

  models.polar=g.makeGLB();
 }

 // ═══════════════════════════════════════════════════════════════════════
 //  NEBULA — Astral resonant reactor with mystical crystals
 // ═══════════════════════════════════════════════════════════════════════
 {
  const m=[mat('reactor midnight shell',0x292c44,.78,.31),
   mat('violet faceted crystal',0x9863b8,.19,.23),
   mat('magenta inner radiance',0xea75c4,.11,.24,0xa13a9c),
   mat('bronze stator frame',0x92706f,.77,.38),
   mat('glowing energy channels',0xffa5d2,.12,.2,0xd855aa),
   mat('shattered satellite shards',0x745ca7,.12,.32),
   mat('deep amethyst crystal',0x6a3d8f,.16,.28,0x4a1a6e)];
  const g=build('NEBULA / Astral resonant reactor',m);

  // Base platform tiers
  g.cylinder(0,.06,0,2.55,.43,0,12);
  g.cylinder(0,.47,0,2.05,.28,3,12);
  g.cylinder(0,.78,0,1.62,.14,4,12);

  // Stator ring pedestals
  for(let i=0;i<8;i++){
   const a=i*TWO/8;
   g.box(2.25*Math.cos(a),.49,2.25*Math.sin(a),.60,.31,.72,3);
   g.crystal(2.35*Math.cos(a),2.33*Math.sin(a),.67,1.0+.32*(i%3),.24,.18*Math.cos(a),.18*Math.sin(a),i%2?2:1,5,.13);
  }

  // Dramatic main levitating crystal core — more facets
  g.crystal(.0,.0,1.18,5.8,1.55,.38,.48,1,10,.12);
  g.crystal(.20,-.22,1.32,5.2,1.02,-.30,.30,2,8,.31);
  g.crystal(-1.12,.36,1.06,4.2,.82,-.26,.46,6,8,.26);
  g.crystal(1.33,.24,.96,4.0,.85,.38,.48,2,8,.11);

  // Additional floating crystal shards at various heights
  g.crystal(.80,3.5,.85,2.0,.42,.20,.15,1,6,.22);
  g.crystal(-1.5,4.0,.90,1.8,.38,-.18,.22,5,6,.18);
  g.crystal(.40,5.2,.75,1.5,.35,.12,-.15,2,7,.30);
  g.crystal(-0.6,2.8,1.35,1.6,.30,-.10,.18,6,5,.14);
  g.crystal(1.8,1.8,.92,1.3,.28,.22,.12,1,5,.20);

  // Resonance columns — tall thin crystal pillars
  for(const [cx,cz,h] of [[-2.8,.5,3.2],[2.8,-.3,2.8],[-1.8,-1.2,2.5],[2.2,1.0,2.6]]){
   g.crystal(cx,.06,cz,h,.28,cx*.08,cz*.06,6,7,.15);
  }

  // Orbital rings at different angles
  for(let i=0;i<4;i++){
   const cy=2.46+i*.62,rx=2.7+i*.25;
   g.curveTube(Array.from({length:65},(_,k)=>{
    const a=k*TWO/64;
    const tilt=i*.15;
    return g.v(rx*Math.cos(a),cy+.16*Math.sin(a*2+i)+Math.sin(a)*tilt,rx*.66*Math.sin(a));
   }),i===1?.13:i===3?.07:.09,i===1?3:4,64);
  }

  // Support pylons
  for(const sign of [-1,1]){
   g.beam(g.v(sign*2.7,.55,-.38),g.v(sign*2.5,3.55,-.48),.30,.43,0);
   g.beam(g.v(sign*2.45,3.65,-.47),g.v(sign*1.80,4.58,-.64),.28,.3,3);
   g.box(sign*2.58,1.15,.38,.13,1.14,.12,4);
  }

  // Energy conduit tubes connecting crystal clusters
  g.curveTube([g.v(-1.12,2.8,1.06),g.v(-.5,3.2,.95),g.v(.20,3.6,.90),g.v(.80,3.5,.85)],.06,4,16);
  g.curveTube([g.v(1.33,2.5,.96),g.v(1.6,3.0,.90),g.v(1.8,1.8,.92)],.05,4,12);
  g.curveTube([g.v(-.6,2.8,1.35),g.v(-.1,3.5,1.15),g.v(.40,4.5,.90)],.05,4,14);

  // Outer floating crystal ring
  for(let i=0;i<8;i++){
   const a=i*TWO/8;
   g.crystal(3.15*Math.cos(a),2.18*Math.sin(a),.80,1.5+.42*(i%3),.38,
    .30*Math.cos(a),.20*Math.sin(a),5,6,a*.3);
  }

  // Shattered crystal debris around the base
  for(let i=0;i<10;i++){
   const a=i*TWO/10;
   const r=2.8+.3*(i%3);
   g.crystal(r*Math.cos(a),.06,r*Math.sin(a),.5+.25*(i%4),.18,
    .08*Math.cos(a),.06*Math.sin(a),i%2?5:6,5,.1+i*.04);
  }

  models.nebula=g.makeGLB();
 }
 return models;
}
const models=generateBiomes();
await mkdir('public/models/biomes',{recursive:true});
for(const [name,{bytes,faces}] of Object.entries(models)){
 await writeFile('public/models/biomes/'+name+'.glb',bytes);
 console.log(name+'.glb',bytes.byteLength,'bytes',faces,'triangles');
}
