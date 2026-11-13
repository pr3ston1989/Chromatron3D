import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createHeroScenery,heroLayout,HERO_BIOMES,HERO_CLEARANCE,HERO_COUNTS,tuneHeroMaterials}
 from '../src/hero-scenery.js';

test('four independently authored GLB meshes are real glTF 2.0 with materials and clear silhouettes',()=>{
 const totals=new Map();
 for(const id of HERO_BIOMES){
  const buf=readFileSync(new URL('../public/models/biomes/'+id+'.glb',import.meta.url));
  assert.equal(buf.toString('ascii',0,4),'glTF');
  assert.equal(buf.readUInt32LE(4),2);
  assert.equal(buf.readUInt32LE(8),buf.length);
  assert.ok(buf.length<1_500_000,'compact offline-authored mesh');
  const jsonSize=buf.readUInt32LE(12);
  assert.equal(buf.toString('ascii',16,20),'JSON');
  const gltf=JSON.parse(buf.toString('utf8',20,20+jsonSize));
  const binIndex=20+jsonSize;
  assert.equal(buf.toString('ascii',binIndex+4,binIndex+8),'BIN\0');
  assert.equal(buf.readUInt32LE(binIndex)+binIndex+8,buf.length);
  assert.equal(gltf.asset.version,'2.0');
  assert.equal(gltf.buffers.length,1);
  assert.equal(gltf.buffers[0].byteLength,buf.readUInt32LE(binIndex));
  assert.ok(gltf.scenes[0].nodes.length>=1,'at least one root node');
  assert.ok(gltf.materials.length>=4,'authored PBR material palette');
  let vertices=0,faces=0,bounds=[Infinity,-Infinity];
  for(const mesh of gltf.meshes){
   for(const primitive of mesh.primitives){
    const pos=gltf.accessors[primitive.attributes.POSITION];
    const normal=gltf.accessors[primitive.attributes.NORMAL];
    assert.equal(pos.count,normal.count,'vertex normals are baked');
    assert.equal(pos.componentType,5126);
    vertices+=pos.count;
    // Blender exports indexed geometry (shared vertices) — face count
    // comes from indices, not raw vertex count
    if(primitive.indices!==undefined){
     const idx=gltf.accessors[primitive.indices];
     assert.equal(idx.count%3,0,'triangle indices divisible by 3');
     faces+=idx.count/3;
    }else{
     assert.equal(pos.count%3,0,'non-indexed: vertices divisible by 3');
     faces+=pos.count/3;
    }
    bounds[0]=Math.min(bounds[0],pos.min[1]);
    bounds[1]=Math.max(bounds[1],pos.max[1]);
   }
  }
  assert.ok(faces>1200,id+' has full 3D sculpture, not decorative crumbs');
  assert.ok(bounds[1]-bounds[0]>2.0,id+' hero prop has meaningful vertical extent');
  assert.ok(gltf.materials.some(m=>m.pbrMetallicRoughness.metallicFactor>0.4));
  assert.ok(gltf.materials.some(m=>(m.emissiveFactor||[0,0,0]).some(c=>c>0)),'subtle built-in emissive accents');
  totals.set(id,{vertices,faces});
 }
 assert.equal(totals.size,4);
 assert.notEqual(totals.get('verdant').faces,totals.get('orbital').faces);
});

test('all seeded hero positions are deterministic, differ per level and clear board edges',()=>{
 const a=heroLayout('demo',0,312);
 assert.equal(a.length,4);
 assert.deepEqual(a,heroLayout('demo',0,312));
 assert.notDeepEqual(a,heroLayout('demo',1,312));
 for(let n=0;n<250;n++)for(const p of heroLayout('imported-pack',n,121)){
  assert.ok(Math.max(Math.abs(p.x),Math.abs(p.z))-4.5*p.scale>=HERO_CLEARANCE);
  assert.ok(p.y<-.5);
 }
 assert.throws(()=>heroLayout('demo',-1),/Invalid hero level/);
});

test('GLB loads once per biome, stale async loads never hijack the active scene',()=>{
 const world=new THREE.Group(),loads=[];
 const loader={load(url,onLoad,onProgress,onError){loads.push({url,onLoad,onError})}};
 const hero=createHeroScenery(THREE,world,{loader,baseUrl:'/custom-assets/'});
 assert.equal(world.children.length,4);
 hero.setQuality('performance');
 hero.setLevel('verdant','pack',0,8);
 assert.equal(hero.getStats().status,'loading');
 assert.equal(hero.getStats().visible,0);
 assert.equal(loads[0].url,'/custom-assets/verdant.glb');
 hero.setLevel('orbital','pack',1,8);
 assert.equal(loads.length,2);
 const model=new THREE.Group();
 model.add(new THREE.Mesh(new THREE.BoxGeometry(1,5,1),new THREE.MeshStandardMaterial()));
 loads[0].onLoad({scene:model});
 assert.equal(world.getObjectByName('premium-hero-verdant').visible,false);
 loads[1].onLoad({scene:model});
 assert.equal(hero.getStats().status,'ready');
 assert.equal(hero.getStats().visible,HERO_COUNTS.performance);
 assert.equal(world.getObjectByName('premium-hero-orbital').children.length,4);
 hero.setQuality('cinematic');
 assert.equal(hero.getStats().visible,4);
 const oldFirst=world.getObjectByName('premium-hero-orbital').children[0];
 hero.setLevel('orbital','pack',2,8);
 assert.equal(loads.length,2,'no new HTTP request on another level in same biome');
 assert.equal(world.getObjectByName('premium-hero-orbital').children[0],oldFirst);
 assert.equal(world.children.length,4,'cached biome containers never leak');
 hero.setLevel('verdant','pack',4,8);
 assert.equal(hero.getStats().status,'ready');
 assert.equal(hero.getStats().visible,4);
 hero.dispose();
 assert.equal(world.children.length,0);
});

test('unavailable model falls back without affecting optical gameplay',()=>{
 const world=new THREE.Group(),calls=[];
 const hero=createHeroScenery(THREE,world,{loader:{load(u,onLoad,_,onError){calls.push({u,onError})}}});
 hero.setLevel('polar','demo',3,8);
 calls[0].onError(new Error('404 asset'));
 assert.equal(hero.getStats().status,'error');
 assert.equal(hero.getStats().visible,0);
 assert.match(hero.getStats().loadError,/404 asset/);
 hero.setQuality('cinematic');
 hero.setLevel('polar','demo',4,8);
 assert.equal(calls.length,1,'avoid repeated requests for a failed resource');
 hero.dispose();
});

test('authored PBR detail remains colored instead of clipping under studio light',()=>{
 const root=new THREE.Group();
 const material=new THREE.MeshStandardMaterial({
  color:0xc7b2de,metalness:.93,roughness:.17
 });
 root.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material));
 root.add(new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),material));
 assert.equal(tuneHeroMaterials(root,'nebula'),1,'shared material tuned only once');
 assert.equal(material.envMapIntensity,.20);
 assert.equal(material.metalness,.70);
 assert.equal(material.roughness,.47);
 assert.ok(material.color.getHex()!==0xc7b2de,'colored surface toned down');
 root.traverse(n=>{if(n.isMesh)n.geometry.dispose()});
 material.dispose();
});
