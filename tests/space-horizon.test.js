import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {SPACE_BIOMES,createSpaceEnvironments} from '../src/world-biomes.js';
import {createSpaceHorizon,HORIZON_QUALITY} from '../src/space-horizon.js';

function seeded(seed){
 let n=seed;return ()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);
}

test('four biomes get distinct far-field silhouettes and three layered haze planes',()=>{
 const forms=new Set();
 const texture=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);
 for(const theme of SPACE_BIOMES){
  const sky=new THREE.Group();
  const horizon=createSpaceHorizon(THREE,sky,theme,seeded(3),texture);
  assert.equal(sky.children.length,1);
  assert.equal(horizon.root.name,'environment-deep-horizon');
  const info=horizon.getStats();forms.add(info.form);
  assert.equal(info.structures,2);
  assert.equal(info.clouds,2);
  const architectures=horizon.root.children.filter(g=>g.isGroup&&g.name.startsWith('distant-'));
  assert.equal(architectures.length,3);
  assert.ok(architectures.every(g=>Math.hypot(g.position.x,g.position.z)>70));
  const meshNames=new Set();
  for(const group of architectures)group.traverse(n=>{
   if(n.isMesh){
    assert.equal(n.userData.scenicOnly,true);
    meshNames.add(n.name);
   }
  });
  assert.ok(meshNames.size>=3,theme.id+' has distinct 3D shape elements');
  horizon.setQuality('performance');
  assert.deepEqual(horizon.getStats(),{
   form:info.form,structures:1,clouds:1,quality:'performance'
  });
  horizon.setQuality('cinematic');
  assert.equal(horizon.getStats().structures,3);
  assert.equal(horizon.getStats().clouds,3);
 }
 assert.equal(forms.size,4);
 texture.dispose();
});

test('the far backdrop is seeded, cached, visible and motion-reduced',()=>{
 const sky=new THREE.Group();
 const texture=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);
 const horizon=createSpaceHorizon(THREE,sky,SPACE_BIOMES[0],seeded(12),texture);
 const seededLayout=()=>{
  horizon.setLayout(seeded(19),.4);
  return horizon.root.children.filter(g=>g.name.startsWith('distant-')).map(g=>({
   x:g.position.x,y:g.position.y,z:g.position.z,scale:g.scale.x
  }));
 };
 const layout=seededLayout();
 assert.deepEqual(seededLayout(),layout);
 assert.equal(horizon.root.rotation.y,-.4);
 const first=horizon.root.children[0].children[0];
 const before=first.rotation.y;
 horizon.update(12,false);
 assert.notEqual(first.rotation.y,before);
 horizon.update(12,true);
 assert.equal(first.rotation.y,before);
 assert.equal(sky.children.length,1);
 texture.dispose();
});

test('world-biome system honors horizon quality and never creates new meshes on level changes',()=>{
 const scene=new THREE.Scene(),world=new THREE.Group();scene.add(world);
 scene.fog=new THREE.FogExp2('#192434',.01);
 const worlds=createSpaceEnvironments(THREE,scene,world);
 const sceneCount=scene.children.length,worldCount=world.children.length;
 worlds.setQuality('performance');
 worlds.setLevel('demo',0,{seed:12});
 assert.equal(worlds.getStats().horizon.structures,1);
 assert.equal(worlds.getStats().horizon.clouds,1);
 for(let i=1;i<=32;i++)worlds.setLevel('demo',i,{seed:12});
 assert.equal(scene.children.length,sceneCount);
 assert.equal(world.children.length,worldCount);
 worlds.setQuality('cinematic');
 assert.equal(worlds.getStats().horizon.structures,3);
 assert.equal(worlds.getStats().horizon.clouds,3);
 worlds.update(25,false);
 worlds.update(25,true);
});
