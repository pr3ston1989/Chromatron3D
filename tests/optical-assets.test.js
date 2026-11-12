import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {detailEmitter,detailResonator} from '../src/optical-assets.js';

test('directional laser asset follows all eight optical headings',()=>{
 const sample=new Set();
 for(let dir=0;dir<8;dir++){
  const group=new THREE.Group();
  const g=detailEmitter(THREE,group,dir,new THREE.Color('#4099ff'));
  assert.equal(g.parent,group);
  assert.equal(g.children.filter(c=>c.name==='machined-barrel-ring').length,4);
  assert.equal(g.children.filter(c=>c.name==='heatsink-fin').length,8);
  const lens=g.children.find(c=>c.name==='laser-wavelength-lens');
  assert.ok(lens);
  const ring=g.children.find(c=>c.name==='machined-barrel-ring');
  const outward=new THREE.Vector3(0,1,0).applyQuaternion(lens.quaternion);
  const frontVector=new THREE.Vector3(0,0,1).applyQuaternion(ring.quaternion);
  assert.ok(outward.distanceTo(frontVector)<1e-6,'torus and lens must share physical forward normal');
  sample.add(lens.position.x.toFixed(3)+','+lens.position.z.toFixed(3));
 }
 assert.equal(sample.size,8,'eight unique headings produce unique apertures');
});
test('resonator responds visually to illumination without changing solver',()=>{
 const off=detailResonator(THREE,new THREE.Group(),{color:0xff5555,active:false});
 const on=detailResonator(THREE,new THREE.Group(),{color:0xff5555,active:true});
 assert.equal(off.children.filter(c=>c.name==='iris-vane').length,8);
 assert.equal(on.children.filter(c=>c.name==='iris-vane').length,8);
 assert.equal(on.children.filter(c=>c.name==='wavelength-index').length,8);
 const emissive=(g)=>g.children.find(c=>c.name==='receiver-color-halo').material.opacity;
 assert.ok(emissive(on)>emissive(off),'active receptacle is more luminous');
});
