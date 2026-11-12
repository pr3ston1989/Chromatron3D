import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {getOpticFinishes,applyOpticFinish} from '../src/optic-textures.js';

test('PBR brushed and polished 128px maps are reusable offline textures',()=>{
 const finishes=getOpticFinishes(THREE);
 assert.equal(getOpticFinishes(THREE),finishes);
 for(const kind of ['polished','brushed']){
  const family=finishes[kind];
  for(const map of ['albedo','roughness','normal']){
   assert.ok(family[map].isDataTexture);
   assert.equal(family[map].image.data.length,128*128*4);
   assert.equal(family[map].wrapS,THREE.RepeatWrapping);
  }
  assert.equal(family.albedo.colorSpace,THREE.SRGBColorSpace);
  assert.equal(family.normal.colorSpace,THREE.NoColorSpace);
 }
 const x=getOpticFinishes(THREE).brushed.roughness.image.data;
 const different=new Set();
 for(let i=1;i<x.length;i+=4)different.add(x[i]);
 assert.ok(different.size>5,'roughness map should actually vary at micro-scale');
});
test('PBR finish attaches normal and roughness maps to existing metal materials',()=>{
 const m=new THREE.MeshPhysicalMaterial({metalness:.9,roughness:.18});
 const result=applyOpticFinish(THREE,m,'polished');
 assert.equal(result,m);
 assert.ok(m.map&&m.normalMap&&m.roughnessMap);
 assert.ok(m.normalScale.x>0);
 assert.throws(()=>applyOpticFinish(THREE,m,'other'),/Unknown/);
});
