import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {SPACE_BIOMES,createSpaceEnvironments} from '../src/world-biomes.js';

test('four scenery palettes have different GPU-instanced habitat silhouettes',()=>{
 const scene=new THREE.Scene(),world=new THREE.Group();scene.add(world);
 const env=createSpaceEnvironments(THREE,scene,world);
 const shapes=new Set();
 for(let i=0;i<4;i++){
  const theme=env.setLevel('demo',i,{seed:426});
  const group=world.children.find(g=>g.name==='board-decor-'+theme.id);
  const habitat=group.getObjectByName('environment-rim-habitat');
  assert.ok(habitat?.isInstancedMesh);
  assert.equal(habitat.instanceMatrix.count,180);
  assert.ok(habitat.instanceColor,'biome surfaces vary color without textures');
  shapes.add(habitat.geometry.type);
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3();
  for(let n=0;n<habitat.instanceMatrix.count;n++){
   habitat.getMatrixAt(n,matrix);
   position.setFromMatrixPosition(matrix);
   assert.ok(Math.max(Math.abs(position.x),Math.abs(position.z))>=10.12-1e-5,
    'ambient growth stays beyond the 15x15 optical grid');
  }
 }
 assert.equal(shapes.size,4,'moss, ice, crystal and scrap have distinct shapes');
});

test('habitats retain meshes on level changes and scale with graphics quality',()=>{
 const scene=new THREE.Scene(),world=new THREE.Group();scene.add(world);
 const env=createSpaceEnvironments(THREE,scene,world);
 const baseline=world.children.length;
 env.setQuality('performance');
 const first=env.setLevel('demo',0,{seed:45});
 assert.equal(env.getStats().rimHabitat,35);
 const growth=world.getObjectByName('board-decor-'+first.id)
  .getObjectByName('environment-rim-habitat');
 env.setQuality('balanced');assert.equal(env.getStats().rimHabitat,105);
 env.setQuality('cinematic');assert.equal(env.getStats().rimHabitat,180);
 const matrix=new THREE.Matrix4();
 growth.getMatrixAt(0,matrix);
 const original=matrix.clone();
 const group=world.getObjectByName('board-decor-'+first.id);
 const childrenCount=group.children.length;
 let visited=false;
 for(let i=1;i<=32;i++){
  const theme=env.setLevel('demo',i,{seed:45});
  if(theme.id!==first.id)continue;
  visited=true;
  assert.equal(group.children.length,childrenCount);
  assert.equal(growth,group.getObjectByName('environment-rim-habitat'));
  assert.equal(world.children.length,baseline);
  assert.ok([0,Math.PI/2,Math.PI,3*Math.PI/2].some(
   v=>Math.abs(group.rotation.y-v)<1e-9));
  const next=new THREE.Matrix4();growth.getMatrixAt(0,next);
  assert.ok(original.equals(next),'per-level orientation never reallocates matrices');
  break;
 }
 assert.ok(visited);
});
