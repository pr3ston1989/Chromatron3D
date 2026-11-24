import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Box3,Raycaster,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CLASSIC_TYPE_NAMES} from '../src/classic-pieces.js';
import {campaignWorld} from '../src/campaign-worlds.js';

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

test('the deepwater landmarks use authored meshes below the playing surface',async()=>{
 const {models}=campaignWorld('demo',5);
 const landmarks={
  'abyss-observatory':{budget:3700,material:'Bathyal coated glass'},
  'abyss-vent-reef':{budget:3000,material:'Sulfide chimney rim'},
  'abyss-survey-rov':{budget:1200,material:'Inspection camera glass'}
 };
 const loader=new GLTFLoader();
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
 const ids=new Set(campaignWorld('demo',2).models.map(([id])=>id).filter(id=>id!=='grotto-survey'));
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

test('the three survey anchors penetrate the fault shelf under the gallery',async()=>{
 const fixtures=campaignWorld('demo',2).models;
 const [,shelf,scale,yaw]=fixtures.find(([id])=>id==='grotto-fault-shelf');
 const [,station,stationScale,stationYaw]=fixtures.find(([id])=>id==='grotto-survey');
 assert.deepEqual([station[0],station[2],stationScale,stationYaw],[shelf[0],shelf[2],scale,yaw]);
 const loader=new GLTFLoader();
 const load=async id=>{
  const file=readFileSync(new URL('../assets/models/scenery/'+id+'.glb',import.meta.url));
  return (await loader.parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'')).scene;
 };
 const [cliff,rig]=await Promise.all(['grotto-fault-shelf','grotto-survey'].map(load));
 const rock=[];
 cliff.traverse(node=>{if(node.material?.name==='Fractured slate')rock.push(node)});
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
 const foot=(station[1]-shelf[1])/scale;
 for(const anchor of anchors){
  const ray=new Raycaster(new Vector3(anchor.x,40,anchor.z),new Vector3(0,-1,0));
  const contact=ray.intersectObjects(rock)[0];
  assert.ok(contact&&contact.point.y>=foot,'anchor reaches bedrock');
 }
});
