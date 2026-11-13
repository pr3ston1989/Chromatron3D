import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {SPACE_BIOMES,createSpaceEnvironments} from '../src/world-biomes.js';
import {TERRAIN_BIOMES,TERRAIN_QUALITY,TERRAIN_INNER,
 terrainTexel,buildTerrainTexture,createBiomeTerrain} from '../src/terrain-biomes.js';

function random(seed){
 let value=seed>>>0;return ()=>{
  value=(Math.imul(value,1664525)+1013904223)>>>0;
  return value/4294967296;
 };
}

test('each biome has a visibly distinct texture with natural surface variation',()=>{
 const signatures=new Set();
 for(const kind of TERRAIN_BIOMES){
  const pixels=[];
  for(let y=0;y<128;y+=7)for(let x=0;x<128;x+=7){
   const p=terrainTexel(kind,x,y,7221);
   assert.equal(p.length,4);assert.equal(p[3],255);
   assert.ok(p.every(v=>Number.isInteger(v)&&v>=0&&v<=255));
   assert.deepEqual(p,terrainTexel(kind,x,y,7221));
   pixels.push(p.slice(0,3).join(','));
  }
  assert.ok(new Set(pixels).size>60,'material should not look flat '+kind);
  signatures.add(pixels.join('|'));
  const texture=buildTerrainTexture(THREE,kind,7221,128);
  assert.equal(texture.image.data.length,128*128*4);
  assert.equal(texture.colorSpace,THREE.SRGBColorSpace);
  assert.equal(texture.wrapS,THREE.RepeatWrapping);
  texture.dispose();
 }
 assert.equal(signatures.size,4,'all biomes have different ground identities');
 assert.throws(()=>terrainTexel('unknown',1,1),/Unknown terrain biome/);
});

test('four solid textured outer courtyards frame the board without covering optics',()=>{
 for(const theme of SPACE_BIOMES){
  const world=new THREE.Group();
  const terrain=createBiomeTerrain(THREE,world,theme,random(71));
  const info=terrain.getStats();
  assert.equal(info.courtyards,4);
  assert.equal(info.textured,true);
  assert.equal(info.innerClearance,TERRAIN_INNER);
  const courtyards=terrain.root.children.filter(m=>m.name.startsWith('textured-'));
  assert.equal(courtyards.length,4);
  assert.ok(courtyards.every(m=>m.material.map?.isDataTexture));
  const foundation=terrain.root.children.filter(m=>m.name.startsWith('courtyard-substructure'));
  assert.equal(foundation.length,4);
  for(const p of courtyards){
   const dim=p.geometry.parameters;
   const zMin=Math.abs(p.position.z)-(dim.height/2);
   const xMin=Math.abs(p.position.x)-(dim.width/2);
   if(p.position.z!==0)assert.ok(zMin>12.5,'north/south ground clears hull');
   else assert.ok(xMin>12.5,'east/west ground clears hull');
  }
  const buffers=terrain.root.children.filter(c=>c.isInstancedMesh);
  assert.equal(buffers.length,3);
  const loc=new THREE.Vector3(),mat=new THREE.Matrix4();
  for(const mesh of buffers){
   assert.equal(mesh.userData.scenicOnly,true);
   for(let i=0;i<mesh.instanceMatrix.count;i++){
    mesh.getMatrixAt(i,mat);loc.setFromMatrixPosition(mat);
    assert.ok(Math.max(Math.abs(loc.x),Math.abs(loc.z))>=TERRAIN_INNER);
   }
  }
  for(const [quality,budget] of Object.entries(TERRAIN_QUALITY)){
   terrain.setQuality(quality);
   assert.equal(terrain.getStats().rocks,budget.rocks);
   assert.equal(terrain.getStats().features,budget.features);
   assert.equal(terrain.getStats().growth,budget.growth);
  }
 }
});

test('all terrain geometry is allocated once, independent of puzzle levels',()=>{
 const scene=new THREE.Scene(),world=new THREE.Group();
 scene.add(world);
 const environments=createSpaceEnvironments(THREE,scene,world);
 const count=world.children.length,skyCount=scene.children.length;
 environments.setQuality('performance');
 environments.setLevel('demo',0,{seed:220});
 assert.equal(environments.getStats().terrain.courtyards,4);
 assert.equal(environments.getStats().terrain.rocks,TERRAIN_QUALITY.performance.rocks);
 for(let i=1;i<75;i++){
  environments.setLevel('demo',i,{seed:220});
  assert.equal(environments.getStats().terrain.courtyards,4);
 }
 assert.equal(world.children.length,count);
 assert.equal(scene.children.length,skyCount);
 environments.setQuality('cinematic');
 assert.equal(environments.getStats().terrain.growth,TERRAIN_QUALITY.cinematic.growth);
});
