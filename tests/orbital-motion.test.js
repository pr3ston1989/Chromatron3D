import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createDockPatrol} from '../src/kepler-traffic.js';
import {createSkyMeteor} from '../src/sky-meteor.js';

test('the Blender tender leaves its real berth, clears the board and lands on the same apron',async()=>{
 const bytes=await readFile(new URL('../assets/models/benchmark/kepler-service-dock.glb',import.meta.url));
 const {scene:dock}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
 dock.position.y=-6.8;
 const belt=new THREE.Group(),update=createDockPatrol(THREE,dock,belt);
 const tender=dock.getObjectByName('Survey_tender'),berth=tender.position.clone();
 const dish=dock.getObjectByName('Tracking_reflector'), bearing=dish.position.clone();
 let furthest=0;
 const bounds=new THREE.Box3();
 for(let t=0;t<=57;t+=.25){
  update(t);
  dock.updateMatrixWorld(true);
  bounds.setFromObject(tender,true);
  assert.ok(bounds.max.y<0,'the entire spacecraft stays below the board surface');
  assert.ok(bounds.min.x>9.75||bounds.max.x< -9.75||bounds.min.z>9.75||bounds.max.z< -9.75);
  furthest=Math.max(furthest,berth.distanceTo(tender.position));
  assert.ok(dish.position.equals(bearing));
 }
 assert.ok(furthest>30);
 assert.ok(tender.position.distanceTo(berth)<1e-6);
 update(6);
 assert.ok(dish.quaternion.angleTo(new THREE.Quaternion())>.25);
 assert.ok(belt.position.length()>.3);
 update(0);
 assert.ok(tender.position.distanceTo(berth)<1e-6&&tender.rotation.y===0);
 assert.equal(dish.quaternion.w,1);
});

for(const [width,height] of [[1366,768],[1280,720],[1093,614],[390,844]]){
 test(`meteors have a world-fixed path and quiet intervals at ${width}x${height}`,()=>{
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,width/height,.1,200);
  camera.position.set(-13,26,24);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const {mesh,update}=createSkyMeteor(THREE,scene,48129);
  const geo=mesh.geometry,mat=mesh.material;
  const head=()=>mat.uniforms.head.value.clone().multiplyScalar(100).add(camera.position).project(camera);
  let active=0,start,last,end,gap;
  for(let frame=0;frame<60*52;frame++){
   update(1/60,true,camera);
   if(mesh.visible){
    const p=head();
    assert.ok(p.x>-.95&&p.x<.95&&p.y>.46&&p.y<.89);
    if(!last){active++;if(active===1)start=p;else{gap=frame/60-end;break}}
    if(active===1&&last){assert.ok(p.x>last.x&&p.y<last.y)}
    last=p;
   }else if(last){end=frame/60;last=null}
  }
  assert.ok(start&&active===2&&gap>=20&&gap<40.1);
  const before=head();
  camera.lookAt(10,0,0);camera.updateMatrixWorld();
  assert.ok(before.distanceTo(head())>.1,'orbiting must not drag the meteor with the camera');
  update(1/60,false,camera);
  assert.equal(mesh.visible,false);
  for(let frame=0;frame<300;frame++)update(1/60,true,camera);
  assert.equal(mesh.visible,false,'no burst on resume');
  assert.equal(mesh.geometry,geo);assert.equal(mesh.material,mat);
  assert.equal(mesh.material.depthWrite,false);
  assert.equal(scene.children.length,1);
 });
}
