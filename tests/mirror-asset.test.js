import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createMirrorHardware} from '../src/mirror-asset.js';

test('realistic optical hardware attaches to a 3D head as reusable geometry',()=>{
 const head=new THREE.Group();
 const hardware=createMirrorHardware(THREE,head);
 assert.equal(head.children[0],hardware);
 assert.equal(hardware.name,'optic-mirror-hardware');
 assert.ok(hardware.children.length>=20);
 assert.equal(hardware.children.filter(c=>c.name==='chrome-side-rail').length,2);
 assert.equal(hardware.children.filter(c=>c.name==='captive-screw').length,4);
 assert.equal(hardware.children.filter(c=>c.name==='opaque-carbon-back').length,1);
 assert.ok(hardware.children.every(c=>c.isMesh&&c.geometry&&c.material));
});
test('reflective front stays clear of screws and directional marking',()=>{
 const hardware=createMirrorHardware(THREE,new THREE.Group());
 for(const screw of hardware.children.filter(c=>c.name==='captive-screw')){
  assert.ok(Math.abs(screw.position.z)>.53,'screws must be outside mirror plane half-width');
  assert.ok(screw.position.x<-.139,'screws are on the visible front rail');
 }
 const carbon=hardware.children.find(c=>c.name==='opaque-carbon-back');
 assert.ok(carbon.position.x>0,'dark back lies behind front reflector plane');
 const marker=hardware.children.find(c=>c.name==='front-direction-notch');
 assert.ok(marker.position.x<0);
});
test('bender has distinguishable variant material',()=>{
 const a=createMirrorHardware(THREE,new THREE.Group());
 const b=createMirrorHardware(THREE,new THREE.Group(),{bender:true});
 assert.equal(b.name,'optic-bender-hardware');
 assert.notEqual(
  a.children.find(x=>x.name==='edge-indicator').material.color.getHex(),
  b.children.find(x=>x.name==='edge-indicator').material.color.getHex()
 );
});
