import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {SCENIC_MODELS,SCENIC_VISIBLE,SCENIC_CLEARANCE,sceneryLayout}
 from '../src/scenic-composition.js';
import {createMidgroundScenery} from '../src/midground-scenery.js';

test('eight new GLB files are valid, unique multi-material sculptures with depth',()=>{
 const identifiers=Object.values(SCENIC_MODELS).flat();
 assert.equal(identifiers.length,8);
 assert.equal(new Set(identifiers).size,8);
 const counts=new Set();
 for(const name of identifiers){
  const bytes=readFileSync(new URL('../public/models/midground/'+name+'.glb',import.meta.url));
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.readUInt32LE(4),2);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  const jsonSize=bytes.readUInt32LE(12);
  assert.equal(bytes.toString('ascii',16,20),'JSON');
  const data=JSON.parse(bytes.toString('utf8',20,20+jsonSize));
  const bin=20+jsonSize;
  assert.equal(bytes.toString('ascii',bin+4,bin+8),'BIN\0');
  assert.equal(bin+8+bytes.readUInt32LE(bin),bytes.length);
  assert.equal(data.asset.version,'2.0');
  assert.ok(data.materials.length>=4,'materials authored per module');
  assert.ok(data.materials.every(m=>m.pbrMetallicRoughness));
  assert.ok(data.meshes[0].primitives.length>=3);
  const positions=data.meshes[0].primitives.map(p=>data.accessors[p.attributes.POSITION]);
  const faces=positions.reduce((sum,p)=>sum+p.count/3,0);
  const minY=Math.min(...positions.map(p=>p.min[1]));
  const maxY=Math.max(...positions.map(p=>p.max[1]));
  assert.ok(faces>=180,name+' must be substantial geometry, not dust');
  assert.ok(maxY-minY>=2.7,name+' tall enough for a recognizable silhouette');
  assert.ok(bytes.length<180000,'small enough to load on-demand');
  counts.add(faces);
 }
 assert.ok(counts.size>=6,'not all copies of the same geometry');
});

test('midground compositions vary by level, maintain two model families and optical clearance',()=>{
 for(const biome of Object.keys(SCENIC_MODELS)){
  const first=sceneryLayout('demo',0,553,biome);
  assert.equal(first.length,10);
  assert.deepEqual(first,sceneryLayout('demo',0,553,biome));
  const seen=new Set(first.map(p=>p.family));
  assert.deepEqual([...seen].sort(),[0,1]);
  assert.ok(first.every(p=>p.y<0));
  const different=sceneryLayout('demo',1,553,biome);
  assert.notDeepEqual(first,different,'new level gets a different arrangement');
  for(let i=0;i<250;i++){
   const layout=sceneryLayout('private-pack',i,990,biome);
   assert.equal(layout.length,10);
   for(const prop of layout)
    assert.ok(Math.max(Math.abs(prop.x),Math.abs(prop.z))-4.5*prop.scale>=SCENIC_CLEARANCE);
  }
 }
 assert.throws(()=>sceneryLayout('p',-1,0,'polar'),/Invalid scenery/);
 assert.throws(()=>sceneryLayout('p',0,0,'unknown'),/Invalid scenery/);
});

test('GLB models are fetched exactly once per active biome, cloned and capped by quality',()=>{
 const world=new THREE.Group(),calls=[];
 const loader={load(url,onLoad,_progress,onError){calls.push({url,onLoad,onError})}};
 const director=createMidgroundScenery(THREE,world,{loader,baseUrl:'/assets/'});
 assert.equal(world.children.length,4);
 director.setLevel('verdant','demo',0,12);
 assert.equal(calls.length,2);
 assert.deepEqual(calls.map(x=>x.url),[
  '/assets/verdant-greenhouse.glb','/assets/verdant-root-tower.glb'
 ]);
 assert.equal(director.getStats().status,'loading');
 assert.equal(director.getStats().visible,0);
 const dummy=new THREE.Group();
 dummy.add(new THREE.Mesh(new THREE.BoxGeometry(1,4,1),new THREE.MeshStandardMaterial()));
 calls[0].onLoad({scene:dummy});
 assert.equal(director.getStats().readyModels,1);
 assert.ok(director.getStats().visible>0,'partial load gracefully fills sockets');
 calls[1].onLoad({scene:dummy});
 assert.equal(director.getStats().status,'ready');
 assert.equal(director.getStats().visible,SCENIC_VISIBLE.balanced);
 assert.equal(director.getStats().distinct,2);
 const first=world.getObjectByName('premium-midground-verdant').children[0];
 director.setQuality('performance');
 assert.equal(director.getStats().visible,SCENIC_VISIBLE.performance);
 director.setQuality('cinematic');
 assert.equal(director.getStats().visible,SCENIC_VISIBLE.cinematic);
 director.setLevel('verdant','demo',4,12);
 assert.equal(world.getObjectByName('premium-midground-verdant').children[0],first);
 assert.equal(calls.length,2,'cached GLB, no HTTP refetch between levels');
 director.setLevel('polar','demo',1,12);
 assert.equal(calls.length,4);
 assert.equal(world.getObjectByName('premium-midground-verdant').visible,false);
 calls[2].onLoad({scene:dummy});
 calls[3].onLoad({scene:dummy});
 assert.equal(director.getStats().status,'ready');
 assert.equal(director.getStats().visible,10);
 director.update(20,false);
 director.update(20,true);
 assert.equal(world.children.length,4);
 director.dispose();
 assert.equal(world.children.length,0);
});

test('missing models degrade gracefully and remain absent from optical selection',()=>{
 const world=new THREE.Group(),requests=[];
 const director=createMidgroundScenery(THREE,world,{
  loader:{load(url,complete,_progress,fail){requests.push({url,complete,fail})}}
 });
 director.setQuality('performance');
 director.setLevel('orbital','demo',0,1);
 requests[0].fail(new Error('404 dock'));
 const scene=new THREE.Group();
 scene.add(new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshStandardMaterial()));
 requests[1].complete({scene});
 assert.equal(director.getStats().status,'partial');
 assert.equal(director.getStats().visible,3);
 assert.equal(director.getStats().loadErrors.length,1);
 for(const object of world.getObjectByName('premium-midground-orbital').children){
  object.traverse(node=>{if(node.isMesh)assert.equal(node.userData.scenicOnly,true)});
 }
 director.setLevel('orbital','demo',1,1);
 assert.equal(requests.length,2,'do not continually retry missing asset');
 director.dispose();
});
