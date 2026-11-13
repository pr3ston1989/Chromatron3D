import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSpaceEnvironments, environmentForLevel} from '../src/world-biomes.js';

function setup(){
 const scene = new THREE.Scene();
 const world = new THREE.Group();
 scene.add(world);
 scene.fog = new THREE.FogExp2(0x101625, .01);
 return {scene, director: createSpaceEnvironments(THREE,scene,world)};
}
function activeSky(scene, id){
 return scene.children.find(child => child.name === 'space-biome-' + id);
}
function composition(sky){
 const traffic = sky.getObjectByName('environment-distant-traffic');
 const planet = sky.getObjectByName('environment-distant-planet');
 const nebula = sky.getObjectByName('environment-nebula-cloud');
 return [sky.rotation.y, ...planet.position.toArray(),
  ...nebula.position.toArray(), ...traffic.children[0].position.toArray()];
}

test('repeated biomes have fresh, reproducible skies without new scene meshes',()=>{
 const {scene,director}=setup();
 const seed=723;
 const firstBiome=environmentForLevel('demo',0,seed).id;
 const otherIndex=Array.from({length:32},(_,i)=>i+1)
  .find(i=>environmentForLevel('demo',i,seed).id===firstBiome);
 assert.notEqual(otherIndex,undefined);
 director.setLevel('demo',0,{seed});
 const sky=activeSky(scene,firstBiome);
 const original=composition(sky);
 const childCount=sky.children.length;
 director.setLevel('demo',otherIndex,{seed});
 assert.notDeepEqual(composition(sky),original,'same biome gets a different arrangement');
 assert.equal(sky.children.length,childCount,'no recreated GPU objects');
 director.setLevel('demo',0,{seed});
 assert.deepEqual(composition(sky),original,'returning to a level restores its sky layout');
});

test('distant traffic respects performance tiers and reduced-motion setting',()=>{
 const {scene,director}=setup();
 const theme=director.setLevel('demo',3,{seed:82});
 const traffic=activeSky(scene,theme.id).getObjectByName('environment-distant-traffic');
 assert.equal(traffic.children.length,4,'all geometry is cached');
 director.setQuality('performance');
 assert.equal(director.getStats().traffic,1);
 director.setQuality('balanced');
 assert.equal(director.getStats().traffic,2);
 director.setQuality('cinematic');
 assert.equal(director.getStats().traffic,4);
 for(const craft of traffic.children){
  const p=craft.position;
  assert.ok(Math.hypot(p.x,p.z)>43,'decoration stays outside the optical board');
  assert.ok(p.y>10,'decoration stays above the game volume');
 }
 const before=traffic.children[0].position.clone();
 director.update(180,false);
 const animated=traffic.children[0].position.clone();
 assert.ok(animated.distanceTo(before)>0.01,'ambient traffic animates');
 director.update(460,true);
 assert.ok(traffic.children[0].position.equals(animated),
  'reduced motion freezes decor');
 director.setQuality('performance');
 assert.equal(traffic.children.filter(c=>c.visible).length,1);
});
