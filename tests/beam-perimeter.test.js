import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {trace} from '../src/optics.js';
import {createBeamPerimeter} from '../src/beam-perimeter.js';
import {SPACE_BIOMES} from '../src/world-biomes.js';
const p=(id,type,x,y,rot=0,color=0)=>({id,type,x,y,rot,color});

test('beam from last cell reaches edge absorber rather than vanishing at tile center',()=>{
 const right=trace([p(1,'laser',13,7,2,4)]);
 assert.equal(right.boundaryHits.length,1);
 assert.deepEqual(right.boundaryHits[0],{x:14,y:7,nx:14.5,ny:7,color:4,boundary:true});
 assert.equal(right.segments.at(-1).nx,14);
 const left=trace([p(1,'laser',1,7,6,1)]);
 assert.deepEqual(left.boundaryHits[0],{x:0,y:7,nx:-.5,ny:7,color:1,boundary:true});
 const up=trace([p(1,'laser',7,1,0,2)]);
 assert.deepEqual(up.boundaryHits[0],{x:7,y:0,nx:7,ny:-.5,color:2,boundary:true});
 const diagonal=trace([p(1,'laser',13,13,3,1)]);
 assert.equal(diagonal.boundaryHits[0].nx,14.5);
 assert.equal(diagonal.boundaryHits[0].ny,14.5);
});

test('solid blocking optics intercept light before it reaches the external absorber',()=>{
 const hit=trace([p(1,'laser',2,7,2,1),p(2,'wall',4,7)]);
 assert.equal(hit.boundaryHits.length,0);
 const empty=trace([p(1,'laser',7,7,2,1)]);
 assert.ok(empty.boundaryHits.length>0);
 assert.equal(hit.won,false);
});

test('absorber geometry is continuous, cached, themed and beyond the 15x15 field',()=>{
 const world=new THREE.Group();
 const rim=createBeamPerimeter(THREE,world,1.3);
 const s=rim.getStats();
 assert.equal(s.segments,60);
 assert.equal(s.collectors,60);
 assert.equal(s.guideLights,60);
 assert.equal(s.corners,4);
 assert.equal(s.boundary,9.75);
 assert.equal(s.beamHeight,.78);
 assert.equal(world.children.length,1);
 const collector=rim.group.getObjectByName('laser-absorber-contact-surfaces');
 const mat=new THREE.Matrix4(),p=new THREE.Vector3();
 for(let i=0;i<60;i++){
  collector.getMatrixAt(i,mat);
  p.setFromMatrixPosition(mat);
  const side=Math.floor(i/15);
  if(side<2)assert.ok(Math.abs(Math.abs(p.z)-9.815)<.001);
  else assert.ok(Math.abs(Math.abs(p.x)-9.815)<.001);
  assert.ok(p.y>.7);
 }
 const color=rim.group.getObjectByName('optical-perimeter-armor').material;
 for(const biome of SPACE_BIOMES){
  rim.setTheme(biome);
  assert.equal(color.color.getHex(),biome.tileA);
  assert.equal(rim.group.getObjectByName('absorber-guide-lights').material.color.getHex(),biome.edge);
 }
 assert.equal(world.children.length,1);
});

test('beam routing stays unchanged for all four absorber directions',()=>{
 for(const direction of [0,2,4,6]){
  const beam=trace([p(1,'laser',7,7,direction,4),p(2,'target',14,14,0,2)]);
  assert.ok(beam.segments.length>0);
  assert.equal(beam.active,0);
  assert.equal(beam.won,false);
  assert.equal(beam.boundaryHits.length,1);
  assert.equal(beam.boundaryHits[0].color,4);
 }
});
