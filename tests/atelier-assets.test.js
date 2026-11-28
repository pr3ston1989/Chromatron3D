import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CLASSIC_TYPE_NAMES} from '../src/classic-pieces.js';
import {CAMPAIGN_FOOTING_Y,CAMPAIGN_WORLDS,campaignWorld} from '../src/campaign-worlds.js';
import {GROTTO_POOL_Y} from '../src/grotto-surface.js';
import {createSurveyLights} from '../src/landmark-surfaces.js';

const {Box3,Raycaster,Vector3}=THREE;

function gltf(path){
 const data=readFileSync(new URL('../public/models/'+path+'.glb',import.meta.url));
 return JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)));
}

test('garden waterworks and sanctuary ruins use detailed Blender meshes and surface materials',()=>{
 const models=[
  ['heliostat-garden-spring',1,'Garden running water'],
  ['sanctuary-collimator',6,'Sanctuary active lens'],
  ['sanctuary-broken-span',6,'Broken processional span body']
 ];
 for(const [id,level,material] of models){
  assert.ok(campaignWorld('demo',level).models.some(([name])=>name===id),id);
  const file=readFileSync(new URL('../assets/models/scenery/'+id+'.glb',import.meta.url));
  const doc=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12)));
  assert.ok(doc.materials.some(entry=>entry.name===material),id+' retains its authored finish');
  const triangles=doc.meshes.flatMap(mesh=>mesh.primitives)
   .reduce((count,primitive)=>count+doc.accessors[primitive.indices].count/3,0);
  assert.ok(triangles>=1500&&triangles<=4900,id+' stays within its module budget');
  assert.ok(readFileSync(new URL('../assets/models/scenery/'+id+'.blend',import.meta.url)).length>0,id+' has an editable source');
 }
});

test('the final forge, grotto and shipyard landmarks preserve their geometry and materials',async()=>{
 const loader=new GLTFLoader();
 const models={
  'shipyard-transfer-dock':[3800,'Freight control windows'],
  'shipyard-service-arm':[1800,'Dock transfer arm pilot lights'],
  'shipyard-cargo-tug':[1400,'Tug ion thrusters'],
  'forge-furnace-bank':[3800,'Furnace refractory throat'],
  'forge-casting-line':[3000,'Foundry flowing metal'],
  'forge-spillway':[2600,'Spillway molten glass'],
  'grotto-pump-causeway':[2300,'Grotto intake gallery pilot lights']
 };
 for(const [id,[budget,finish]] of Object.entries(models)){
  const file=readFileSync(new URL('../assets/models/scenery/'+id+'.glb',import.meta.url));
  const {scene}=await loader.parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');
  let triangles=0,finished=false;
  scene.traverse(node=>{
   if(!node.isMesh)return;
   assert.ok(node.geometry.attributes.color,id+' retains Blender cavity shading');
   triangles+=node.geometry.index.count/3;
   if(node.material.name===finish)finished=node.material.emissive.getHex()>0;
  });
  assert.ok(triangles>0&&triangles<=budget,id+' stays within its polygon budget');
  assert.ok(finished,id+' retains its emissive material');
  assert.ok(Math.abs(new Box3().setFromObject(scene).min.y)<1e-5,id+' stands on a Y-up base');
  assert.ok(readFileSync(new URL('../assets/models/scenery/'+id+'.blend',import.meta.url)).length>0);
 }
});

test('the cargo gantry clears the berth deck and stays on both rails throughout its travel',async()=>{
 const id='shipyard-cargo-berth',loader=new GLTFLoader();
 const file=readFileSync(new URL('../assets/models/scenery/'+id+'.glb',import.meta.url));
 const {scene}=await loader.parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');
 const gantry=scene.getObjectByName('Cargo_Gantry'),base=scene.getObjectByName(id);
 assert.equal(gantry?.parent,base,'cargo and bridge have a separate moving GLB node');
 assert.ok(readFileSync(new URL('../assets/models/scenery/'+id+'.blend',import.meta.url)).length>0);
 let triangles=0,lamps=false;
 scene.traverse(mesh=>{
  if(!mesh.isMesh)return;
  assert.ok(mesh.geometry.attributes.color,'the mesh has baked contact shading');
  triangles+=mesh.geometry.index.count/3;
  if(mesh.material.name==='Berth docking indicators')lamps=mesh.material.emissive.getHex()>0;
 });
 assert.ok(triangles>=1400&&triangles<=3500,'berth and gantry meet the combined triangle budget');
 assert.ok(lamps,'the GLB preserves the berth lights');
 assert.ok(Math.abs(new Box3().setFromObject(base).min.y)<1e-5,'the foundation has a Y-up origin');
 const fixed=base.children.filter(node=>node!==gantry),down=new Vector3(0,-1,0);
 const home=gantry.position.x;
 for(const movement of [0,2.245,4.49]){
  gantry.position.x=home+movement;
  scene.updateMatrixWorld(true);
  for(const z of [-2.04,2.04]){
   const rail=new Raycaster(new Vector3(gantry.position.x,4,z),down).intersectObjects(fixed,true)[0];
   assert.ok(rail&&rail.point.y>2.44&&rail.point.y<=2.51,'each bogie sits on a continuous rail');
  }
  assert.ok(new Box3().setFromObject(gantry).min.y>1.88,'the load clears the pallet cradles');
 }
});

test('the forge has open casting pans and a spillway that reaches the lava channel',async()=>{
 const loader=new GLTFLoader();
 async function modelFor(id){
  const file=readFileSync(new URL('../assets/models/scenery/'+id+'.glb',import.meta.url));
  return (await loader.parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'')).scene;
 }
 const casting=await modelFor('forge-casting-line');
 let exposed=0;
 casting.traverse(mesh=>{
  if(mesh.material?.name!=='Foundry flowing metal')return;
  const {normal}=mesh.geometry.attributes;
  for(let i=0;i<normal.count;i++)if(normal.getY(i)>.97)exposed++;
 });
 assert.ok(exposed>=24,'three pan surfaces have upward-facing molten metal');

 const gate=await modelFor('forge-spillway');
 const [,anchor,scale,yaw]=campaignWorld('demo',4).models.find(([id])=>id==='forge-spillway');
 gate.position.fromArray(anchor);gate.scale.setScalar(scale);gate.rotation.y=yaw;
 gate.updateMatrixWorld(true);
 const spill=new Box3();
 gate.traverse(mesh=>{if(mesh.material?.name==='Spillway molten glass')spill.expandByObject(mesh)});
 assert.ok(spill.min.y<-16.5&&spill.max.y>-11,'the liquid sheet falls from the gate into the basin');
 assert.ok(new Box3().setFromObject(gate).max.y<-.6,'the spillway roof stays below the puzzle');
});

test('the grotto spring and intake meet the lake beneath the puzzle',async()=>{
 const loader=new GLTFLoader(),{models}=campaignWorld('demo',2);
 const placed=async name=>{
  const [,anchor,scale,yaw]=models.find(([id])=>id===name);
  const file=readFileSync(new URL('../assets/models/scenery/'+name+'.glb',import.meta.url));
  const {scene}=await loader.parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');
  scene.position.fromArray(anchor);
  if(Array.isArray(scale))scene.scale.fromArray(scale);
  else scene.scale.setScalar(scale);
  scene.rotation.y=yaw;scene.updateMatrixWorld(true);
  return scene;
 };
 const [ground,spring,intake]=await Promise.all(['grotto-terrain','grotto-calcite-spring','grotto-pump-causeway'].map(placed));
 const down=new Vector3(0,-1,0);
 const floorAt=(x,z)=>new Raycaster(new Vector3(x,5,z),down).intersectObject(ground,true)[0]?.point.y;
 assert.ok(floorAt(-19,-8)<GROTTO_POOL_Y-.5,'lake has a submerged bed');
 assert.ok(floorAt(29.6,9.5)<GROTTO_POOL_Y-.5,'the spring basin has a submerged bed');
 const water=new Box3();
 spring.traverse(mesh=>{if(mesh.material?.name==='Grotto falling water')water.expandByObject(mesh,true)});
 assert.ok(water.min.y<GROTTO_POOL_Y&&water.max.y>GROTTO_POOL_Y+2.5,'the cascade descends into the lake');
 const foot=spring.position;
 assert.ok(floorAt(foot.x,foot.z)>=foot.y,'the rock foundation reaches the bed');
 for(const x of [-3.7,-1.37,1.12,3.54]){
  const pier=intake.localToWorld(new Vector3(x,0,0));
  assert.ok(floorAt(pier.x,pier.z)>=pier.y,'intake pier reaches solid ground');
 }
 for(const model of [spring,intake])assert.ok(new Box3().setFromObject(model).max.y<-.6,'the scenery stays below the board');
});

test('each non-orbital biome shares continuous modeled ground between the piers and the surrounding landscape',async()=>{
 const worlds=CAMPAIGN_WORLDS.filter(world=>world.legacyId!=='orbital');
 const loader=new GLTFLoader(),sources=new Map();
 const ray=new Raycaster();
 const vertical=new Vector3(0,-1,0),up=new Vector3(0,1,0);
 assert.equal(worlds.length,6);
 for(const {id,models} of worlds){
  const ground=[];
  for(const [name,anchor,scale,yaw,role] of models){
   if(role!=='ground')continue;
   if(!sources.has(name)){
    const file=readFileSync(new URL('../assets/models/scenery/'+name+'.glb',import.meta.url));
    const bytes=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
    sources.set(name,(await loader.parseAsync(bytes,'')).scene);
   }
   const model=sources.get(name).clone(true);
   model.traverse(node=>{
    if(!node.isMesh)return;
    assert.equal(node.material.vertexColors,true,id+' uses authored terrain pigment');
    assert.ok(node.geometry.index.count/3<=3100,id+' stays within the terrain budget');
   });
   model.position.fromArray(anchor);model.scale.fromArray(scale);model.rotation.y=yaw;
   model.updateMatrixWorld(true);
   assert.ok(new Box3().setFromObject(model).max.y<-.6,id+' keeps the deck clear');
   ground.push(model);
  }
  assert.ok(ground.length,id+' has terrain beneath the platform');
  for(let side=0;side<4;side++)for(const x of [-7.24,0,7.24]){
   // The centers of the load-bearing feet in the Blender arcade and truss.
   ray.set(new Vector3(x,40,-7.89).applyAxisAngle(up,side*Math.PI/2),vertical);
   const contact=ray.intersectObjects(ground,true)[0];
   assert.ok(contact&&contact.point.y>=CAMPAIGN_FOOTING_Y,`${id}, pier ${side}/${x} reaches ground`);
  }
  for(let angle=0;angle<8;angle++)for(const distance of [17,32,64]){
   const direction=angle*Math.PI/4;
   ray.set(new Vector3(distance*Math.cos(direction),40,distance*Math.sin(direction)),vertical);
   assert.ok(ray.intersectObjects(ground,true).length,`${id}, no break in the terrain at ${angle}/${distance}`);
  }
  const fixtures={
   heliostat:['heliostat-optical-collector','heliostat-waterworks','heliostat-garden-spring'],
   grotto:['grotto-pump-causeway','grotto-survey'],
   frost:['frost-optical-lab','frost-radiometer'],
   forge:['forge-furnace-bank','forge-casting-line','forge-service-rail'],
   abyss:['abyss-observatory','abyss-vent-reef','abyss-rov-berth'],
   sanctuary:['sanctuary-meridian','sanctuary-collimator','sanctuary-broken-span','sanctuary-calibration','sanctuary-terrace']
  };
  for(const [name,[x,y,z]] of models){
   if(!fixtures[id].includes(name))continue;
   ray.set(new Vector3(x,40,z),vertical);
   const contact=ray.intersectObjects(ground,true)[0];
   assert.ok(contact?.point.y>=y,`${id}, ${name} rests on its terrain (${contact?.point.y.toFixed(2)} vs ${y})`);
  }
 }
});

test('the garden waterwheel joins an open headrace and a grounded stone basin',async()=>{
 const loader=new GLTFLoader(),{models}=campaignWorld('demo',1);
 const placed=async id=>{
  const [,anchor,scale,yaw]=models.find(([name])=>name===id);
  const data=readFileSync(new URL('../assets/models/scenery/'+id+'.glb',import.meta.url));
  const {scene}=await loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
  scene.position.fromArray(anchor);
  if(Array.isArray(scale))scene.scale.fromArray(scale);
  else scene.scale.setScalar(scale);
  scene.rotation.y=yaw;scene.updateMatrixWorld(true);
  return scene;
 };
 const [ground,works]=await Promise.all(['heliostat-terrain','heliostat-waterworks'].map(placed));
 const rotor=works.getObjectByName('Sluice_Wheel');
 assert.equal(rotor?.parent.name,'heliostat-waterworks');
 assert.ok(readFileSync(new URL('../assets/models/scenery/heliostat-waterworks.blend',import.meta.url)).length>0);
 let triangles=0;
 works.traverse(node=>{
  if(!node.isMesh)return;
  assert.ok(node.geometry.attributes.color,'the assembled model keeps baked shading');
  triangles+=node.geometry.index.count/3;
 });
 assert.ok(triangles>=2300&&triangles<=3600,'the combined model fits its polygon budget');
 const model=rotor.parent,down=new Vector3(0,-1,0);
 for(const x of [-5.9,5.9])for(const z of [-1.9,1.9]){
  const foot=model.localToWorld(new Vector3(x,0,z));
  const hit=new Raycaster(foot.clone().setY(20),down).intersectObject(ground,true)[0];
  assert.ok(hit?.point.y>=foot.y,'both ends of the base meet the ground');
 }
 for(const x of [1.4,2.3,3.85,5.82]){
  const headrace=model.localToWorld(new Vector3(x,8,0));
  const surface=new Raycaster(headrace,down).intersectObject(works,true)[0];
  assert.equal(surface?.object.material.name,'Garden running water','water stays above the headrace masonry');
 }
 const axle=rotor.getWorldPosition(new Vector3());
 for(const angle of [0,Math.PI/3,Math.PI/2]){
  rotor.rotation.z=angle;works.updateMatrixWorld(true);
  assert.ok(new Box3().setFromObject(works).max.y<-.6,'the gallery remains below the tiles');
  assert.deepEqual(rotor.getWorldPosition(new Vector3()).toArray(),axle.toArray());
 }
});

test('the sanctuary prism has a separate axle on a grounded stone terrace',async()=>{
 const {models}=campaignWorld('demo',6),loader=new GLTFLoader();
 async function placed(id){
  const [,anchor,scale,yaw]=models.find(([name])=>name===id);
  const file=readFileSync(new URL('../assets/models/scenery/'+id+'.glb',import.meta.url));
  const {scene}=await loader.parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');
  scene.position.fromArray(anchor);
  if(Array.isArray(scale))scene.scale.fromArray(scale);
  else scene.scale.setScalar(scale);
  scene.rotation.y=yaw;scene.updateMatrixWorld(true);
  return scene;
 }
 const [terrain,terrace]=await Promise.all(['sanctuary-terrain','sanctuary-calibration'].map(placed));
 const pivot=terrace.getObjectByName('Calibration_Pivot');
 assert.equal(pivot?.parent.name,'sanctuary-calibration');
 let triangles=0;
 terrace.traverse(mesh=>{if(mesh.isMesh)triangles+=mesh.geometry.index.count/3});
 assert.ok(triangles>=950&&triangles<=2300,'calibration assembly fits its polygon budget');
 assert.ok(readFileSync(new URL('../assets/models/scenery/sanctuary-calibration.blend',import.meta.url)).length>0);
 for(const x of [-3.5,3.5])for(const z of [-1.7,1.7]){
  const foot=terrace.localToWorld(new Vector3(x,0,z));
  const rock=new Raycaster(foot.clone().setY(20),new Vector3(0,-1,0)).intersectObject(terrain,true)[0];
  assert.ok(rock?.point.y>=foot.y,'calibration terrace rests on the slope');
 }
 const bearing=pivot.getWorldPosition(new Vector3());
 for(const angle of [-.53,0,.53]){
  pivot.rotation.x=angle;terrace.updateMatrixWorld(true);
  assert.ok(new Box3().setFromObject(terrace).max.y<-.6,'the prism remains safely below the active tiles');
  assert.deepEqual(pivot.getWorldPosition(new Vector3()).toArray(),bearing.toArray(),'the axle stays in its bearing');
 }
});

test('the terrace heliostat and meridian ruins retain their authored finishes in campaign scenery',async()=>{
 const loader=new GLTFLoader();
 const landmarks=[
  [1,'heliostat-optical-collector',4600,['Heliostat coated glass','Pale limestone footing','Heliostat machined axles']],
  [1,'heliostat-ravine',4600,['Garden running water','Ravine cypress foliage']],
  [6,'sanctuary-meridian',4300,['Meridian fractured filter','Meridian cut stone','Oxidized meridian copper']]
 ];
 for(const [level,id,budget,expectedFinishes] of landmarks){
  const file=readFileSync(new URL('../assets/models/scenery/'+id+'.glb',import.meta.url));
  const bytes=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
  const {scene}=await loader.parseAsync(bytes,'');
  let triangles=0;
  const materials=new Set();
  scene.traverse(node=>{
   if(!node.isMesh)return;
   assert.ok(node.geometry.attributes.color,id+' includes baked shadows');
   triangles+=node.geometry.index.count/3;
   materials.add(node.material.name);
  });
  assert.ok(triangles>0&&triangles<=budget,id);
  for(const finish of expectedFinishes)assert.ok(materials.has(finish),id+' retains '+finish);
  assert.ok(readFileSync(new URL('../assets/models/scenery/'+id+'.blend',import.meta.url)).length>0);
  const placement=campaignWorld('demo',level).models.find(([name])=>name===id);
  assert.ok(placement,id+' is used in campaign scenery');
  const [,anchor,scale,,role]=placement;
  const {min,max}=new Box3().setFromObject(scene);
  assert.ok(Math.abs(min.y)<1e-5,id+' has the glTF ground origin');
  const height=Array.isArray(scale)?scale[1]:scale;
  assert.ok(anchor[1]+max.y*height<(role==='left'?2:0),id+' fits the side scenery envelope');
 }
});

test('the deepwater landmarks use authored meshes below the playing surface',async()=>{
 const {models}=campaignWorld('demo',5);
 const landmarks={
  'abyss-observatory':{budget:3900,material:'Bathyal coated glass'},
  'abyss-vent-reef':{budget:3300,material:'Sulfide chimney rim'},
  'abyss-survey-rov':{budget:1200,material:'Inspection camera glass'},
  'abyss-rov-berth':{budget:2350,material:'Dock approach markers'}
 };
 const loader=new GLTFLoader();
 const terrainFile=readFileSync(new URL('../assets/models/scenery/abyss-terrain.glb',import.meta.url));
 const terrain=(await loader.parseAsync(terrainFile.buffer.slice(terrainFile.byteOffset,terrainFile.byteOffset+terrainFile.byteLength),'')).scene;
 terrain.position.fromArray(models.find(([id])=>id==='abyss-terrain')[1]);terrain.updateMatrixWorld(true);
 for(const [id,{budget,material}] of Object.entries(landmarks)){
  const file=readFileSync(new URL('../assets/models/scenery/'+id+'.glb',import.meta.url));
  const bytes=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
  const {scene}=await loader.parseAsync(bytes,'');
  let triangles=0,finished=false;
  scene.traverse(node=>{
   if(!node.isMesh)return;
   assert.ok(node.geometry.attributes.color,id+' retains Blender cavity shading');
   triangles+=node.geometry.index.count/3;
   finished||=node.material.name===material;
  });
  assert.ok(triangles>0&&triangles<=budget,id);
  assert.ok(finished,id+' retains its named finish');
  assert.ok(readFileSync(new URL('../assets/models/scenery/'+id+'.blend',import.meta.url)).length>0);
  const bounds=new Box3().setFromObject(scene);
  assert.ok(Math.abs(bounds.min.y)<1e-5,id+' has a Y-up base');
  const placements=models.filter(([name])=>name===id);
  assert.ok(placements.length>0,id+' is placed in the Abyss');
  for(const [,anchor,scale,,role] of placements){
   const motionMargin=role==='survey'?.70:0;
   assert.ok(anchor[1]+bounds.max.y*(Array.isArray(scale)?scale[1]:scale)+motionMargin<0,
    id+' remains below the play surface');
  }
  if(id==='abyss-rov-berth'){
   const [,anchor,scale,yaw]=placements[0];
   scene.position.fromArray(anchor);scene.scale.setScalar(scale);scene.rotation.y=yaw;scene.updateMatrixWorld(true);
   for(const x of [-2.78,2.78])for(const z of [-1.63,1.63]){
    const foot=scene.localToWorld(new Vector3(x,0,z));
    const ground=new Raycaster(foot.clone().setY(20),new Vector3(0,-1,0)).intersectObject(terrain,true)[0];
    assert.ok(ground?.point.y>=foot.y,'each docking berth leg reaches the seafloor');
   }
  }
  if(id==='abyss-survey-rov'){
   const [,anchor,scale]=placements[0];
   const lights=createSurveyLights(THREE);
   assert.equal(lights.children.length,2);
   for(const light of lights.children)assert.equal(light.material.depthWrite,false);
   assert.ok(anchor[1]+new Box3().setFromObject(lights).max.y*scale+.70<-.6,'searchlights stay below the deck');
  }
 }
});

test('the polar instruments and core bridge sit on the ice below a clear glider route',async()=>{
 const {models,traffic}=campaignWorld('demo',3);
 const loader=new GLTFLoader();
 const landmarks={
  'frost-optical-lab':[3200,'Heated polar glazing'],
  'frost-radiometer':[1800,'Radiometer optical panels'],
  'frost-core-bridge':[2600,'Frosted sampling core'],
  'frost-icefall':[2400,'Glacier clear fracture'],
  'frost-ridge':[480,'Distant snow line']
 };
 const originals=new Map();
 const terrain=models.find(fixture=>fixture[4]==='ground');
 const terrainFile=readFileSync(new URL('../assets/models/scenery/'+terrain[0]+'.glb',import.meta.url));
 originals.set(terrain[0],(await loader.parseAsync(terrainFile.buffer.slice(terrainFile.byteOffset,terrainFile.byteOffset+terrainFile.byteLength),'')).scene);
 for(const [id,[budget,finish]] of Object.entries(landmarks)){
  const file=readFileSync(new URL('../assets/models/scenery/'+id+'.glb',import.meta.url));
  const bytes=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
  const {scene}=await loader.parseAsync(bytes,'');
  let triangles=0,finished=false;
  scene.traverse(node=>{
   if(!node.isMesh)return;
   triangles+=node.geometry.index.count/3;
   finished||=node.material.name===finish;
  });
  assert.ok(triangles>0&&triangles<=budget,id);
  assert.ok(finished,id+' retains its modeled material');
  assert.ok(readFileSync(new URL('../assets/models/scenery/'+id+'.blend',import.meta.url)).length>0);
  assert.ok(Math.abs(new Box3().setFromObject(scene).min.y)<1e-5,id+' has a Y-up base');
  originals.set(id,scene);
 }
 const placed=([id,anchor,scale,yaw])=>{
  const model=originals.get(id).clone(true);
  model.position.fromArray(anchor);model.rotation.y=yaw;
  if(Array.isArray(scale))model.scale.fromArray(scale);
  else model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  return model;
 };
 const mounts={
  'frost-optical-lab':[[-3.51,-1.83],[-3.51,1.83],[3.51,-1.83],[3.51,1.83]],
  'frost-radiometer':[[0,0]],
  'frost-core-bridge':[[-4.16,-1.16],[-4.16,1.16],[4.16,-1.16],[4.16,1.16]]
 };
 const down=new Vector3(0,-1,0);
 const ice=placed(terrain);
 for(const [id,points] of Object.entries(mounts)){
  const fixture=models.find(([name])=>name===id);
  const prop=placed(fixture);
  assert.ok(new Box3().setFromObject(prop).max.y<0,id+' remains below the playable deck');
  for(const [x,z] of points){
   const foot=prop.localToWorld(new Vector3(x,0,z));
   const ray=new Raycaster(foot.clone().setY(20),down);
   const contact=ray.intersectObject(ice,true)[0];
   assert.ok(contact&&contact.point.y>foot.y,id+' foot reaches the glacial face');
  }
 }
 const [,bridge]=models.find(([name])=>name==='frost-core-bridge');
 const fracture=new Raycaster(new Vector3(bridge[0],20,bridge[2]),down).intersectObject(ice,true)[0];
 assert.ok(fracture?.point.y<bridge[1]-2.5,'the bridge spans a recessed ice face');
 const departure=new Vector3(...traffic.from),arrival=new Vector3(...traffic.to);
 for(let i=0;i<=12;i++){
  const point=departure.clone().lerp(arrival,i/12);
  const terrainBelow=new Raycaster(point.clone().setY(20),down).intersectObject(ice,true)[0];
  assert.ok(terrainBelow?.point.y<point.y-1.6,'the survey glider clears the glacier along its route');
 }
});

test('the playable Blender models have matching, distinct transparent equipment portraits',()=>{
 const portraits=new Set();
 for(const kind of CLASSIC_TYPE_NAMES.slice(1)){
  const data=readFileSync(new URL('../public/portraits/'+kind+'.png',import.meta.url));
  assert.equal(data.readUInt32BE(16),128);
  assert.equal(data.readUInt32BE(20),128);
  assert.equal(data[25],6,'RGBA');
  portraits.add(data.toString('base64'));
 }
 assert.equal(portraits.size,22);
 const mirror=gltf('optics/mirror'),splitter=gltf('optics/splitter');
 assert.ok(mirror.materials.some(m=>m.name==='silvered glass'));
 assert.ok(splitter.materials.some(m=>m.name==='Copper fork chamfers'));
 assert.notDeepEqual(mirror.meshes,splitter.meshes);
});

test('all 22 new instruments meet the geometry contract and dynamic lenses remain tintable',()=>{
 const tintable=new Set(['laser','filter','target','teleporter','mobileTeleporter','conduit','doppler','tangler']);
 for(const kind of CLASSIC_TYPE_NAMES.slice(1)){
  const doc=gltf('optics/'+kind);
  const parts=doc.meshes.flatMap(mesh=>mesh.primitives);
  const triangles=parts.reduce((sum,p)=>sum+doc.accessors[p.indices].count/3,0);
  const budget=kind==='wall'||kind==='occupiedSquare'?180:600;
  assert.ok(triangles>0&&triangles<=budget,kind);
  assert.equal(doc.images,undefined,kind+' uses solid materials');
  const bounds=parts.map(p=>doc.accessors[p.attributes.POSITION]);
  assert.equal(Math.min(...bounds.map(b=>b.min[1])),0,kind+' has a Y-up base');
  for(const b of bounds)for(const axis of [0,2]){
   assert.ok(b.min[axis]>-.65&&b.max[axis]<.65,kind+' fits its cell');
  }
  if(tintable.has(kind))assert.ok(doc.materials.some(m=>m.name==='glow'),kind);
 }
});

test('near-rim models fit the board clearance and the deck uses one UV-mapped cell',()=>{
 for(const theme of ['verdant','orbital','polar','nebula']){
  const model=gltf('terraces/'+theme);
  const landmark={verdant:'windwheel',orbital:'tracking-dish',polar:'observatory-dome',nebula:'orrery'}[theme];
  assert.ok(model.nodes.some(n=>n.name===landmark&&n.translation));
  const flora=gltf('terraces/'+theme+'-flora');
  assert.deepEqual(flora.nodes.map(n=>n.name).sort(),['feature','growth','stone']);
  assert.ok(flora.meshes.every(m=>m.primitives.length===1&&Number.isInteger(m.primitives[0].attributes.COLOR_0)));
  const terrain=model.meshes.find(m=>m.name==='terrace-'+theme);
  for(const prim of terrain.primitives){
   const bounds=model.accessors[prim.attributes.POSITION];
   assert.ok(12.5-1.4*Math.max(Math.abs(bounds.min[2]),bounds.max[2])>10.5);
  }
 }
 const tile=gltf('board-cell').meshes[0].primitives;
 assert.equal(tile.length,1);
 assert.ok(Number.isInteger(tile[0].attributes.TEXCOORD_0));
});

test('the pilot GLBs preserve palette emission, base origin and category budgets',()=>{
 const budgets={'board-chassis':1500,'board-chassis-undercarriage':1500,
  'absorber-armor':180,'service-shuttle':600};
 for(const [name,budget] of Object.entries(budgets)){
  const file=readFileSync(new URL('../assets/models/'+name+'.glb',import.meta.url));
  const doc=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12)));
  const parts=doc.meshes.flatMap(mesh=>mesh.primitives);
  const triangles=parts.reduce((sum,part)=>sum+doc.accessors[part.indices].count/3,0);
  const bounds=parts.map(part=>doc.accessors[part.attributes.POSITION]);
  assert.ok(triangles<=budget,name);
  assert.equal(Math.min(...bounds.map(b=>b.min[1])),0,name+' has a Y-up base');
  assert.equal(doc.images,undefined,name+' uses palette materials');
  assert.ok(doc.materials.some(material=>material.emissiveFactor?.some(c=>c>0)),name);
  if(name.startsWith('board-chassis')){
   const height=Math.max(...bounds.map(b=>b.max[1]));
   const width=Math.max(...bounds.map(b=>b.max[0]))-Math.min(...bounds.map(b=>b.min[0]));
   assert.equal(height,3.75,name+' must preserve the supported play surface');
   assert.ok(height/width>=.15&&height/width<=.20);
  }
  for(const suffix of ['','-game']){
   const preview=readFileSync(new URL('../assets/previews/'+name+suffix+'.png',import.meta.url));
   assert.deepEqual([preview.readUInt32BE(16),preview.readUInt32BE(20)],[512,512],name);
  }
 }
});

test('overhaul samples load as untextured, Y-up models within the design budgets',async()=>{
 const loader=new GLTFLoader();
 const budgets={
  'overhaul-platform-deck':1500,
  'overhaul-platform-shipyard':1500,
  'overhaul-beam-splitter':600,
  'overhaul-service-skiff':600
 };
 for(const [name,budget] of Object.entries(budgets)){
  const file=readFileSync(new URL('../assets/models/'+name+'.glb',import.meta.url));
  assert.equal(file.toString('ascii',0,4),'glTF');
  assert.equal(file.readUInt32LE(4),2);
  const doc=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12)));
  assert.equal(doc.images,undefined);
  assert.ok(doc.materials.some(material=>material.emissiveFactor?.some(c=>c>0)),name);
  const parts=doc.meshes.flatMap(mesh=>mesh.primitives);
  const triangles=parts.reduce((sum,p)=>sum+doc.accessors[p.indices].count/3,0);
  assert.ok(triangles>0&&triangles<=budget,name);
  const bounds=parts.map(p=>doc.accessors[p.attributes.POSITION]);
  const minimum=[0,1,2].map(axis=>Math.min(...bounds.map(b=>b.min[axis])));
  const maximum=[0,1,2].map(axis=>Math.max(...bounds.map(b=>b.max[axis])));
  assert.ok(Math.abs(minimum[1])<1e-6,name+' has a Y-up base');
  const bytes=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
  const {scene}=await loader.parseAsync(bytes,'');
  assert.ok(Math.abs(new Box3().setFromObject(scene).min.y)<1e-6,name+' loads without rotation');
  if(name.startsWith('overhaul-platform-')){
   const aspect=maximum[1]/(maximum[0]-minimum[0]);
   assert.ok(aspect>=.15&&aspect<=.20,'depth-to-width ratio');
   const tileMaterial=doc.materials.findIndex(m=>m.name==='Uniform playing surface');
   const tileFaces=parts.filter(p=>p.material===tileMaterial)
    .reduce((sum,p)=>sum+doc.accessors[p.indices].count/3,0);
   assert.equal(tileFaces,15*15*2+16,'225 inlays and a continuous frame');
   if(name.endsWith('shipyard')){
    const struts=doc.materials.findIndex(m=>m.name==='Undercarriage strut');
    assert.ok(struts>=0);
    assert.ok(parts.some(p=>p.material===struts&&doc.accessors[p.attributes.POSITION].min[1]<.1),
     'exposed struts reach the lower deck');
   }
  }
  if(name.endsWith('beam-splitter')){
   const cornerRadius=Math.hypot(Math.max(-minimum[0],maximum[0]),Math.max(-minimum[2],maximum[2]));
   assert.ok(cornerRadius<.72,'rotation stays clear of the next instrument');
   assert.ok(maximum[1]<1,'fits the visual instrument envelope');
  }
 }
});

test('the garden meshes from Blender fit their scenery budgets and stand on a Y-up base',async()=>{
 const loader=new GLTFLoader();
 const budgets={'garden-heliostat-authored':1500,'garden-terrace-shrub':600};
 for(const [name,budget] of Object.entries(budgets)){
  const file=readFileSync(new URL('../assets/models/scenery/'+name+'.glb',import.meta.url));
  const doc=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12)));
  const parts=doc.meshes.flatMap(mesh=>mesh.primitives);
  const triangles=parts.reduce((sum,part)=>sum+doc.accessors[part.indices].count/3,0);
  assert.ok(triangles>0&&triangles<=budget,name);
  assert.equal(doc.images,undefined,name+' uses solid materials');
  assert.ok(new Set(parts.map(part=>part.material)).size>=3,name+' uses at least three finishes');
  const bytes=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
  const {scene}=await loader.parseAsync(bytes,'');
  assert.ok(Math.abs(new Box3().setFromObject(scene).min.y)<1e-6,name+' stands on Y=0');
 }
});

test('grotto cliffs preserve vertex pigment, opaque facets and the per-module triangle budget',async()=>{
 const loader=new GLTFLoader();
 const ids=new Set(campaignWorld('demo',2).models.map(([id])=>id).filter(id=>/(buttress|shelf|seam|escarpment)$/.test(id)));
 for(const id of ids){
  const file=readFileSync(new URL('../assets/models/scenery/'+id+'.glb',import.meta.url));
  const bytes=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
  const {scene}=await loader.parseAsync(bytes,'');
  const bounds=new Box3().setFromObject(scene);
  assert.ok(Math.abs(bounds.min.y)<1e-5,id+' starts at its base');
  let triangles=0,passes=0;
  scene.traverse(node=>{
   if(!node.isMesh)return;
   passes++;
   const {color,position}=node.geometry.attributes;
   assert.equal(color?.count,position.count,id+' has pigment on every vertex');
   const tones=new Set();
   for(let i=0;i<color.count;i++)tones.add(Math.round(1000*color.getZ(i)));
   assert.ok(tones.size>3,id+' retains the variation between rock faces');
   assert.equal(node.material.vertexColors,true);
   assert.equal(node.material.transparent,false);
   assert.equal(node.material.map,null);
   triangles+=node.geometry.index.count/3;
  });
  assert.ok(triangles>0&&triangles<=1500,id+' exceeds its geometry budget');
  const materialBudget=id==='grotto-crystal-seam'?6:3;
  assert.ok(passes<=materialBudget,id+' exceeds its material budget');
 }
});

test('the three survey anchors penetrate the cavern floor beneath the gallery',async()=>{
 const fixtures=campaignWorld('demo',2).models;
 const [,station,stationScale,stationYaw]=fixtures.find(([id])=>id==='grotto-survey');
 const [terrain,floor]=fixtures.find(([, , , ,role])=>role==='ground');
 const loader=new GLTFLoader();
 const load=async id=>{
  const file=readFileSync(new URL('../assets/models/scenery/'+id+'.glb',import.meta.url));
  return (await loader.parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'')).scene;
 };
 const [cliff,rig]=await Promise.all([terrain,'grotto-survey'].map(load));
 cliff.position.fromArray(floor);
 cliff.updateMatrixWorld(true);rig.updateMatrixWorld(true);
 const anchors=[];
 rig.traverse(node=>{
  if(!node.isMesh)return;
  const pos=node.geometry.attributes.position;
  const pt=new Vector3();
  for(let i=0;i<pos.count;i++){
   pt.fromBufferAttribute(pos,i).applyMatrix4(node.matrixWorld);
   if(Math.abs(pt.y)>1e-5)continue;
   const group=anchors.find(g=>Math.hypot(pt.x-g.x,pt.z-g.z)<.96);
   if(!group)anchors.push(pt.clone());
  }
 });
 assert.equal(anchors.length,3);
 for(const anchor of anchors){
  const foot=anchor.multiplyScalar(stationScale).applyAxisAngle(new Vector3(0,1,0),stationYaw).add(new Vector3(...station));
  const ray=new Raycaster(new Vector3(foot.x,40,foot.z),new Vector3(0,-1,0));
  const contact=ray.intersectObject(cliff,true)[0];
  assert.ok(contact&&contact.point.y>=foot.y,`survey anchor at ${foot.x.toFixed(2)}, ${foot.z.toFixed(2)} reaches bedrock (${contact?.point.y.toFixed(2)} vs ${foot.y})`);
 }
});
