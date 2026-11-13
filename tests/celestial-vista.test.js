import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CELESTIAL_BIOMES,CELESTIAL_BUDGET,STELLAR_PALETTES,
 makeCoronaTexture,createCelestialVista} from '../src/celestial-vista.js';
import {createSpaceEnvironments,SPACE_BIOMES} from '../src/world-biomes.js';

function seeded(seed){
 let x=seed>>>0;
 return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296};
}

test('each biome has recognizable dual-color sun palette and brilliant corona',()=>{
 assert.equal(new Set(CELESTIAL_BIOMES).size,4);
 for(const id of CELESTIAL_BIOMES){
  const palette=STELLAR_PALETTES[id];
  assert.equal(palette.length,2);
  assert.notEqual(palette[0],palette[1]);
  const sky=new THREE.Group();
  const vista=createCelestialVista(THREE,sky,id,seeded(10));
  vista.setLayout(()=>.5,.3);
  assert.equal(vista.getStats().suns,2);
  assert.equal(vista.getStats().strongCorona,true);
  assert.equal(sky.children.length,1);
  assert.equal(vista.root.rotation.y,-.3);
  const stars=vista.root.children.filter(o=>o.name.startsWith('radiant-star-'));
  assert.equal(stars.length,2);
  for(const star of stars){
   assert.equal(star.children.length,4);
   assert.ok(star.getObjectByName('stellar-photosphere')?.isMesh);
   assert.ok(star.getObjectByName('stellar-corona')?.isSprite);
   assert.ok(star.getObjectByName('stellar-white-hot-flare')?.isSprite);
   assert.equal(star.getObjectByName('stellar-corona').material.blending,THREE.AdditiveBlending);
   const span=star.getObjectByName('stellar-corona').scale.x;
   assert.ok(span>30&&span<45,'strong but controlled radiance without washing out the board');
  }
  vista.dispose();
  assert.equal(sky.children.length,0);
 }
});

test('solar corona has bright hot center and smooth soft transparent outer edge',()=>{
 const texture=makeCoronaTexture(THREE,128);
 assert.equal(texture.image.data.length,128*128*4);
 const a=texture.image.data;
 const alpha=(x,y)=>a[(y*128+x)*4+3];
 assert.ok(alpha(64,64)>alpha(64,34));
 assert.ok(alpha(64,34)>alpha(3,3));
 assert.ok(alpha(3,3)<25);
 assert.equal(texture.colorSpace,THREE.SRGBColorSpace);
 texture.dispose();
});

test('asteroid band is coherent, seeded, visible and capped by GPU profile',()=>{
 const sky=new THREE.Group();
 const vista=createCelestialVista(THREE,sky,'nebula',seeded(38));
 const group=vista.root.getObjectByName('sweeping-asteroid-belt');
 const major=group.getObjectByName('chunky-asteroid-belt-bodies');
 const minor=group.getObjectByName('asteroid-belt-minor-fragments');
 assert.equal(group.children.length,2);
 assert.equal(major.instanceMatrix.count,260);
 assert.equal(minor.instanceMatrix.count,120);
 assert.equal(major.userData.scenicOnly,true);
 const mat=new THREE.Matrix4(),p=new THREE.Vector3(),eye=new THREE.Vector3();
 const camera=new THREE.PerspectiveCamera(40,1093/614,.1,500);
 const yaw=-1.05,pitch=1.10,d=44;
 camera.position.set(Math.sin(yaw)*Math.cos(pitch)*d,
  Math.sin(pitch)*d,Math.cos(yaw)*Math.cos(pitch)*d);
 camera.lookAt(0,0,0);camera.updateMatrixWorld();
 let visible=0,top=0;
 for(let i=0;i<260;i++){
  major.getMatrixAt(i,mat);
  p.setFromMatrixPosition(mat);
  assert.ok(p.distanceTo(camera.position)>90,'real distant asteroid');
  eye.copy(p).project(camera);
  if(Math.abs(eye.x)<1&&Math.abs(eye.y)<1){
   visible++;
   if(eye.y>.30)top++;
  }
 }
 assert.ok(visible>155,'majority of band appears within laptop camera framing');
 assert.ok(top>140,'belt has a recognizable arc across upper sky');
 for(const [quality,budget] of Object.entries(CELESTIAL_BUDGET)){
  vista.setQuality(quality);
  assert.equal(vista.getStats().asteroidBodies,budget.asteroids);
  assert.equal(vista.getStats().fragments,budget.smallBodies);
 }
 vista.setLayout(()=>.1,0);
 assert.equal(vista.getStats().suns,2,'crystal biome has a colorful binary star');
 vista.update(18,false);
 vista.update(18,true);
 vista.dispose();
});

test('single and binary stars differ across seeded levels, without geometry growth',()=>{
 const scene=new THREE.Scene(),world=new THREE.Group();scene.add(world);
 const worlds=createSpaceEnvironments(THREE,scene,world);
 const before=scene.children.length,worldCount=world.children.length;
 worlds.setQuality('performance');
 let foundSingle=false,foundDouble=false;
 for(let i=0;i<60;i++){
  worlds.setLevel('demo',i,{seed:17});
  const celestial=worlds.getStats().celestial;
  assert.ok(CELESTIAL_BIOMES.includes(celestial.biome));
  assert.equal(celestial.asteroidBodies,46);
  assert.equal(celestial.fragments,22);
  foundSingle||=celestial.suns===1;foundDouble||=celestial.suns===2;
  worlds.update(i*2,true);
 }
 assert.equal(scene.children.length,before);
 assert.equal(world.children.length,worldCount);
 assert.ok(foundSingle&&foundDouble,'some levels show one sun, others two');
 worlds.setQuality('cinematic');
 assert.equal(worlds.getStats().celestial.asteroidBodies,260);
});
