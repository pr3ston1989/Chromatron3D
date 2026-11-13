/**
 * Stage-three scenery: visible industry, organic activity, polar telemetry
 * and crystal energy, deliberately confined to the non-optical perimeter.
 *
 * Everything is allocated once per biome. Animation changes matrices of a
 * handful of cached objects: no moving lights, dynamic shadows or buffers
 * allocated per frame, and no ambient mesh is in optical hit-testing.
 */
export const AMBIENT_COUNTS=Object.freeze({
 performance:Object.freeze({craft:1,rigs:1,beacons:4,motes:6}),
 balanced:Object.freeze({craft:2,rigs:2,beacons:8,motes:16}),
 cinematic:Object.freeze({craft:3,rigs:2,beacons:12,motes:32})
});
export const AMBIENT_BIOMES=Object.freeze(['orbital','verdant','polar','nebula']);
export const AMBIENT_CLEARANCE=12.0;
const LANES=Object.freeze([
 Object.freeze({x:0,z:19.8,axis:'x'}),
 Object.freeze({x:-19.5,z:-.8,axis:'z'}),
 Object.freeze({x:0,z:-21.5,axis:'x'})
]);
const RIG_SOCKETS=Object.freeze([
 Object.freeze({x:19.5,z:15.1}),
 Object.freeze({x:-19.6,z:-15.8})
]);
function hashText(text){
 let h=2166136261;
 for(const char of String(text)){
  h^=char.charCodeAt(0);
  h=Math.imul(h,16777619);
 }
 return h>>>0;
}
function randomFrom(seed){
 let state=seed||0x6d2b79f5;
 return ()=>{
  state^=state<<13;state^=state>>>17;state^=state<<5;
  return (state>>>0)/4294967296;
 };
}
export function ambientLayout(packId,index,seed,biome){
 if(!Number.isInteger(index)||index<0||!AMBIENT_BIOMES.includes(biome))
  throw new Error('Invalid ambient environment');
 const random=randomFrom(hashText(packId+':'+index+':'+seed+':'+biome+':activity'));
 const craft=LANES.map(lane=>({
  ...lane,span:7+random()*4,altitude:2.5+random()*3,
  phase:random()*Math.PI*2,speed:.11+random()*.09
 }));
 const rigs=RIG_SOCKETS.map(socket=>({
  ...socket,heading:(random()-.5)*.6,phase:random()*Math.PI*2
 }));
 const makePoint=(i,inner,outer)=> {
  const side=i%4,position=inner+random()*(outer-inner),
   along=(random()-.5)*25;
  return {
   x:side<2?along:(side===2?-position:position),
   z:side<2?(side===0?-position:position):along,
   y:1.3+random()*4.2,phase:random()*Math.PI*2,
   speed:.10+random()*.18
  };
 };
 const beacons=Array.from({length:12},(_,i)=>makePoint(i,15.0,22.0));
 const motes=Array.from({length:32},(_,i)=>makePoint(i,15.5,27.0));
 const safe=point=>Math.max(Math.abs(point.x),Math.abs(point.z))>=AMBIENT_CLEARANCE+2;
 if([...craft,...rigs,...beacons,...motes].some(p=>!safe(p)))
  throw new Error('Ambient activity breaches optical clearance');
 return {craft,rigs,beacons,motes};
}
function rigGeometry(THREE,group,biome,materials,baseGeo){
 const {hull,metal,glow}=materials;
 const part=(geo,mat,name,x=0,y=0,z=0)=>{
  const mesh=new THREE.Mesh(geo,mat);
  mesh.name=name;mesh.userData.scenicOnly=true;
  mesh.castShadow=false;mesh.receiveShadow=false;
  mesh.position.set(x,y,z);group.add(mesh);return mesh;
 };
 // Substantial machinery, not floating dots: 4m high, located beside
 // the outer side of the board, with a visible functional moving arm.
 part(baseGeo.platform,hull,'service-machinery-footing',0,.25,0);
 for(const x of [-1.4,1.4])
  part(baseGeo.pillar,metal,'machine-support',x,2.2,-.2);
 const rotor=new THREE.Group();
 rotor.position.set(0,4.1,-.2);
 rotor.name='active-biome-mechanism';rotor.userData.scenicOnly=true;
 group.add(rotor);
 const blade=(geo,mat,name,x=0,y=0,z=0)=>{
  const obj=new THREE.Mesh(geo,mat);obj.name=name;obj.position.set(x,y,z);
  obj.userData.scenicOnly=true;rotor.add(obj);return obj;
 };
 if(biome==='orbital'){
  blade(baseGeo.arm,hull,'moving-cargo-gantry',2.1,.2,0);
  blade(baseGeo.pod,metal,'gantry-cargo-lift',3.65,-1.0,0);
  blade(baseGeo.beacon,glow,'gantry-status-emitter',3.55,-.45,.64);
 }else if(biome==='verdant'){
  blade(baseGeo.flower,metal,'botanical-growth-turbine',0,.1,0);
  for(let i=0;i<5;i++){
   const angle=i*Math.PI*2/5;
   const leaf=blade(baseGeo.leaf,i%2?metal:hull,'wind-driven-leaf',Math.cos(angle)*1.55,.25,Math.sin(angle)*1.55);
   leaf.rotation.z=angle*.4;
   leaf.rotation.y=angle;
  }
  blade(baseGeo.beacon,glow,'growth-station-lamp',0,.6,0);
 }else if(biome==='polar'){
  const dish=blade(baseGeo.dish,metal,'arctic-telemetry-dish',0,.45,0);
  dish.rotation.x=.45;
  blade(baseGeo.arm,hull,'antenna-counterweight',1.85,-.2,0);
  blade(baseGeo.beacon,glow,'polar-relay-light',0,.2,1.1);
 }else{
  blade(baseGeo.ring,metal,'resonance-outer-ring');
  const inner=blade(baseGeo.ring,glow,'resonance-inner-ring');
  inner.scale.setScalar(.66);inner.rotation.y=.65;
  blade(baseGeo.flower,hull,'resonator-coupling-core',0,0,0);
  blade(baseGeo.beacon,glow,'reactor-status-orb',0,.4,0);
 }
 return rotor;
}
export function createAmbientLife(THREE,world){
 const shared={
  platform:new THREE.BoxGeometry(4.3,.42,3.3),
  pillar:new THREE.CylinderGeometry(.24,.33,4.0,7),
  arm:new THREE.BoxGeometry(4.1,.24,.40),
  pod:new THREE.BoxGeometry(1.36,1.15,1.15),
  beacon:new THREE.SphereGeometry(.40,8,6),
  ring:new THREE.TorusGeometry(2.0,.15,6,32),
  flower:new THREE.IcosahedronGeometry(.74,0),
  leaf:new THREE.ConeGeometry(.75,2.5,5),
  dish:new THREE.SphereGeometry(1.5,14,8,0,Math.PI*2,0,Math.PI*.42)
 };
 const sceneRecords=new Map();
 const craftMaterials=new Map();
 const mobCache=new THREE.Object3D();
 for(const biome of AMBIENT_BIOMES){
  const colors={
   orbital:[0x49697e,0x9db3bc,0x66d8e8],
   verdant:[0x335c49,0x80bb73,0x93f3ad],
   polar:[0x496580,0xb0e1eb,0x89d9ff],
   nebula:[0x45304e,0xad77b9,0xe38ed1]
  }[biome];
  const hull=new THREE.MeshStandardMaterial({color:colors[0],metalness:biome==='verdant'?.1:.67,roughness:.46});
  const metal=new THREE.MeshStandardMaterial({color:colors[1],metalness:biome==='verdant'?.12:.49,roughness:.47,flatShading:true});
  const glow=new THREE.MeshBasicMaterial({color:colors[2],transparent:true,opacity:.72,depthWrite:false});
  const materialSet={hull,metal,glow};craftMaterials.set(biome,materialSet);
  const root=new THREE.Group();
  root.name='ambient-life-'+biome;root.visible=false;world.add(root);
  const machineries=RIG_SOCKETS.map((_,i)=>{
   const group=new THREE.Group();
   group.name='working-installation-'+i;group.userData.scenicOnly=true;
   root.add(group);
   const rotor=rigGeometry(THREE,group,biome,materialSet,shared);
   return {group,rotor,base:0,phase:0};
  });
  const vehicles=LANES.map((_,i)=>{
   const craft=new THREE.Group();
   craft.name='active-'+biome+'-craft-'+i;craft.userData.scenicOnly=true;
   const body=new THREE.Mesh(
    biome==='nebula'?new THREE.OctahedronGeometry(.98,0):
    biome==='verdant'?new THREE.IcosahedronGeometry(.82,0):
    new THREE.BoxGeometry(2.2,.65,1.05),hull
   );
   body.name='animated-service-craft-hull';body.userData.scenicOnly=true;
   craft.add(body);
   const wing=new THREE.Mesh(new THREE.BoxGeometry(3.1,.11,.26),metal);
   wing.name='animated-service-craft-wing';wing.userData.scenicOnly=true;
   wing.rotation.y=i*.24;craft.add(wing);
   for(const z of [-.50,.50]){
    const engine=new THREE.Mesh(shared.beacon,glow);
    engine.name='service-drive';engine.userData.scenicOnly=true;
    engine.scale.setScalar(.52);engine.position.set(-1.18,.11,z);
    craft.add(engine);
   }
   root.add(craft);return craft;
  });
  const signalMaterial=new THREE.MeshBasicMaterial({
   color:0xffffff,transparent:true,opacity:.79,depthWrite:false,
   vertexColors:false
  });
  const moteMaterial=new THREE.MeshBasicMaterial({
   color:biome==='orbital'?0xe6b66b:colors[2],
   transparent:true,opacity:biome==='polar'?.52:.68,depthWrite:false
  });
  const beacons=new THREE.InstancedMesh(shared.beacon,signalMaterial,12);
  beacons.name='perimeter-signals';beacons.frustumCulled=false;
  const bright=new THREE.Color(colors[2]),dim=new THREE.Color(biome==='orbital'?0xf9ba59:colors[1]);
  for(let i=0;i<12;i++)beacons.setColorAt(i,bright.clone().lerp(dim,i/15));
  beacons.instanceColor.needsUpdate=true;
  root.add(beacons);
  const moteGeo=biome==='verdant'?new THREE.IcosahedronGeometry(.17,0):
   biome==='polar'?new THREE.ConeGeometry(.10,.42,5):
   biome==='nebula'?new THREE.OctahedronGeometry(.24,0):
   new THREE.TetrahedronGeometry(.14,0);
  const motes=new THREE.InstancedMesh(moteGeo,moteMaterial,32);
  motes.name='ambient-'+biome+'-particles';motes.frustumCulled=false;
  root.add(motes);
  sceneRecords.set(biome,{root,machineries,vehicles,beacons,motes,
   moteGeo,signalMaterial,moteMaterial,layout:null});
 }
 let active=null,quality='balanced',reduced=true,elapsed=0;
 function syncQuality(){
  for(const [biome,record] of sceneRecords){
   record.root.visible=active===biome;
   const limit=AMBIENT_COUNTS[quality];
   record.vehicles.forEach((craft,i)=>craft.visible=i<limit.craft);
   record.machineries.forEach((rig,i)=>rig.group.visible=i<limit.rigs);
   record.beacons.count=limit.beacons;
   record.motes.count=limit.motes;
  }
 }
 function setLevel(biome,packId,index,seed=0){
  if(!sceneRecords.has(biome))throw new Error('Unknown ambient biome');
  active=biome;
  const record=sceneRecords.get(biome);
  record.layout=ambientLayout(packId,index,seed,biome);
  for(let i=0;i<record.machineries.length;i++){
   const rig=record.machineries[i],value=record.layout.rigs[i];
   rig.group.position.set(value.x,-1.53,value.z);
   rig.group.rotation.y=value.heading;
   rig.phase=value.phase;rig.base=value.heading;
  }
  syncQuality();
  update(elapsed,reduced);
 }
 function setQuality(mode){
  quality=AMBIENT_COUNTS[mode]?mode:'balanced';
  syncQuality();
  update(elapsed,reduced);
 }
 function update(seconds,reducedMotion=false){
  if(!active)return;
  elapsed=seconds;reduced=reducedMotion;
  const record=sceneRecords.get(active),layout=record.layout;
  if(!layout)return;
  for(let i=0;i<AMBIENT_COUNTS[quality].rigs;i++){
   const item=record.machineries[i];
   item.rotor.rotation.set(0,reducedMotion?0:Math.sin(seconds*.12+item.phase)*.45,0);
   if(active==='verdant')item.rotor.rotation.z=reducedMotion?0:Math.sin(seconds*.16+item.phase)*.095;
   else item.rotor.rotation.z=0;
  }
  for(let i=0;i<AMBIENT_COUNTS[quality].craft;i++){
   const lane=layout.craft[i],craft=record.vehicles[i];
   const p=reducedMotion?0:Math.sin(seconds*lane.speed+lane.phase)*lane.span;
   const x=lane.x+(lane.axis==='x'?p:0),z=lane.z+(lane.axis==='z'?p:0);
   craft.position.set(x,lane.altitude+(reducedMotion?0:Math.sin(seconds*.3+lane.phase)*.24),z);
   craft.rotation.y=lane.axis==='x'?0:Math.PI/2;
   craft.rotation.z=reducedMotion?0:Math.sin(seconds*.18+lane.phase)*.03;
  }
  for(let i=0;i<AMBIENT_COUNTS[quality].beacons;i++){
   const b=layout.beacons[i],bright=reducedMotion?1: .81+.19*Math.sin(seconds*.27+b.phase);
   mobCache.position.set(b.x,b.y-.8,b.z);
   mobCache.rotation.set(0,0,0);
   mobCache.scale.setScalar(.6*bright);
   mobCache.updateMatrix();
   record.beacons.setMatrixAt(i,mobCache.matrix);
  }
  record.beacons.instanceMatrix.needsUpdate=true;
  for(let i=0;i<AMBIENT_COUNTS[quality].motes;i++){
   const m=layout.motes[i],a=reducedMotion?0:seconds*m.speed+m.phase;
   const radius=reducedMotion?0:1.0;
   mobCache.position.set(
    m.x+Math.cos(a)*radius,
    m.y+(reducedMotion?0:Math.sin(a*.62+i)*.8),
    m.z+Math.sin(a)*radius
   );
   mobCache.rotation.set(0,a*.2,0);
   mobCache.scale.setScalar(.62+(i%4)*.15);
   mobCache.updateMatrix();
   record.motes.setMatrixAt(i,mobCache.matrix);
  }
  record.motes.instanceMatrix.needsUpdate=true;
 }
 function getStats(){
  const rec=sceneRecords.get(active);
  const limits=AMBIENT_COUNTS[quality];
  return {biome:active,mode:quality,craft:rec?limits.craft:0,
   rigs:rec?limits.rigs:0,beacons:rec?limits.beacons:0,
   motes:rec?limits.motes:0,reducedMotion:reduced};
 }
 function dispose(){
  const geometries=new Set(Object.values(shared)),materials=new Set();
  for(const [_,record] of sceneRecords){
   geometries.add(record.moteGeo);
   const m=craftMaterials.get(_);materials.add(m.hull);materials.add(m.metal);materials.add(m.glow);
   materials.add(record.signalMaterial);materials.add(record.moteMaterial);
   record.root.traverse(node=>{if(node.isMesh||node.isInstancedMesh)geometries.add(node.geometry)});
   world.remove(record.root);
  }
  geometries.forEach(geo=>geo.dispose());
  materials.forEach(mat=>mat.dispose());
 }
 return {setLevel,setQuality,update,getStats,dispose};
}
