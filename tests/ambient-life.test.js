import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {AMBIENT_BIOMES,AMBIENT_COUNTS,AMBIENT_CLEARANCE,
 ambientLayout,createAmbientLife} from '../src/ambient-life.js';

test('biome-dependent activity layouts are repeatable, varied and outside optics',()=>{
 for(const biome of AMBIENT_BIOMES){
  const first=ambientLayout('demo',0,421,biome);
  assert.deepEqual(first,ambientLayout('demo',0,421,biome));
  assert.notDeepEqual(first,ambientLayout('demo',1,421,biome));
  assert.equal(first.craft.length,3);
  assert.equal(first.rigs.length,2);
  assert.equal(first.beacons.length,12);
  assert.equal(first.motes.length,32);
  for(let index=0;index<250;index++){
   const layout=ambientLayout('pack',index,421,biome);
   const all=[...layout.craft,...layout.rigs,...layout.beacons,...layout.motes];
   for(const a of all){
    assert.ok(Math.max(Math.abs(a.x),Math.abs(a.z))>=AMBIENT_CLEARANCE+2);
    assert.ok(Number.isFinite(a.phase));
   }
   // Vehicles travel exclusively along perimeter service lanes,
   // including at their sinusoidal extremities.
   for(const c of layout.craft){
    const constant=c.axis==='x'?Math.abs(c.z):Math.abs(c.x);
    assert.ok(constant>=17,'no shuttle crosses beams in the puzzle');
   }
  }
 }
 assert.throws(()=>ambientLayout('p',-1,0,'orbital'),/Invalid ambient/);
 assert.throws(()=>ambientLayout('p',0,0,'other'),/Invalid ambient/);
});

test('every graphics preset caps craft, rigs, light beacons and particles',()=>{
 const world=new THREE.Group(),life=createAmbientLife(THREE,world);
 assert.equal(world.children.length,4,'one cached group per biome');
 life.setLevel('orbital','demo',0,12);
 for(const [name,counts] of Object.entries(AMBIENT_COUNTS)){
  life.setQuality(name);
  assert.deepEqual(life.getStats(),{
   biome:'orbital',mode:name,...counts,reducedMotion:true
  });
  const group=world.getObjectByName('ambient-life-orbital');
  assert.equal(group.visible,true);
  assert.equal(group.getObjectByName('perimeter-signals').count,counts.beacons);
  assert.equal(group.getObjectByName('ambient-orbital-particles').count,counts.motes);
  const active=group.children.filter(c=>c.name.startsWith('active-orbital-craft')&&c.visible);
  assert.equal(active.length,counts.craft);
 }
 life.setLevel('verdant','demo',1,12);
 assert.equal(world.getObjectByName('ambient-life-orbital').visible,false);
 assert.equal(life.getStats().biome,'verdant');
 life.dispose();
 assert.equal(world.children.length,0,'cleanup releases each cached environment');
});

test('machinery moves outside the board, with no new 3D objects across frames',()=>{
 const world=new THREE.Group(),life=createAmbientLife(THREE,world);
 life.setLevel('nebula','demo',2,10);
 life.setQuality('cinematic');
 const root=world.getObjectByName('ambient-life-nebula');
 const objects=[];
 root.traverse(o=>objects.push(o));
 const beforeCount=objects.length;
 const rig=root.getObjectByName('active-biome-mechanism');
 const initial=rig.rotation.y;
 const vehicle=root.children.find(c=>c.name==='active-nebula-craft-0');
 const initialX=vehicle.position.x;
 life.update(26,false);
 assert.notEqual(rig.rotation.y,initial);
 assert.notEqual(vehicle.position.x,initialX);
 assert.equal(life.getStats().reducedMotion,false);
 life.update(26,true);
 assert.equal(rig.rotation.y,0);
 assert.equal(life.getStats().reducedMotion,true);
 life.update(32,true);
 assert.equal(vehicle.position.x,vehicle.position.x,'finite stable vehicle state');
 assert.ok(Number.isFinite(vehicle.position.x));
 assert.equal(objects.length,beforeCount);
 const updated=[];root.traverse(o=>updated.push(o));
 assert.equal(updated.length,beforeCount,'no new objects created in animation');
 root.traverse(node=>{
  if(node.isMesh||node.isInstancedMesh){
   assert.equal(node.userData.scenicOnly,true);
  }
 });
 life.dispose();
});

test('different biom themes have distinctive working device shapes',()=>{
 const world=new THREE.Group(),life=createAmbientLife(THREE,world);
 const names=new Set();
 for(const biome of AMBIENT_BIOMES){
  life.setLevel(biome,'demo',0,14);
  const root=world.getObjectByName('ambient-life-'+biome);
  assert.equal(root.visible,true);
  assert.equal(root.children.filter(x=>x.name.startsWith('working-installation')).length,2);
  const moving=new Set();
  root.traverse(node=>{
   if(node.name.startsWith('moving-')||node.name.includes('telemetry-dish')||
      node.name.includes('resonance-')||node.name.includes('wind-driven'))
    moving.add(node.name);
  });
  assert.ok(moving.size>0,'distinct functional moving features in '+biome);
  names.add([...moving].sort().join('|'));
 }
 assert.equal(names.size,4);
 life.dispose();
});
