import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBeamBatcher} from '../src/beam-batching.js';
import {renderLaserFX} from '../src/laser-vfx.js';
import {COLORS} from '../src/optics.js';

test('long laser path batches the glow and camera-facing core into two draw calls',()=>{
 const scene=new THREE.Group();
 const batcher=createBeamBatcher(THREE,scene);
 const beam=new THREE.MeshBasicMaterial({color:'#56aaff',transparent:true});
 const core=new THREE.ShaderMaterial();
 const a=new THREE.Vector3(),b=new THREE.Vector3();
 for(let n=0;n<60;n++){
  a.set(n,1,0);b.set(n+1,1,0);
  batcher.addRibbon(a,b,.6,'horizontal',beam);
  batcher.addRibbon(a,b,.22,'camera',core,9);
 }
 const stats=batcher.flush();
 assert.equal(stats.drawCalls,2);
 assert.equal(stats.segments,120);
 const [ribbon,coreRibbon]=scene.children;
 assert.equal(ribbon.geometry.getAttribute('position').count,360);
 assert.equal(ribbon.geometry.getAttribute('uv').count,360);
 const position=coreRibbon.geometry.getAttribute('position');
 const axis=coreRibbon.geometry.getAttribute('beamAxis');
 assert.equal(axis.count,360);
 assert.equal(position.getX(32*6),32);
 assert.equal(position.getY(32*6),1);
 assert.equal(axis.getX(32*6),1);
 assert.ok(Math.abs(axis.getW(32*6)-.22)<1e-6);
});
test('differing wavelengths keep separate, correctly colored batches',()=>{
 const scene=new THREE.Group(),batcher=createBeamBatcher(THREE,scene);
 const blue=new THREE.MeshBasicMaterial({color:0x4444ff});
 const red=new THREE.MeshBasicMaterial({color:0xff4444});
 for(const material of [blue,red]){
  const a=new THREE.Vector3(0,.8,0),b=new THREE.Vector3(1,.8,0);
  batcher.addRibbon(a,b,.42,'vertical',material);
 }
 const stat=batcher.flush();
 assert.equal(stat.drawCalls,2);
 assert.notEqual(scene.children[0].material.color.getHex(),scene.children[1].material.color.getHex());
});
test('empty path does not allocate zero-length instanced meshes',()=>{
 const scene=new THREE.Group();
 const batcher=createBeamBatcher(THREE,scene);
 const result=batcher.flush();
 assert.equal(result.drawCalls,0);
 assert.equal(scene.children.length,0);
});

test('overlapping rays use one core in the combined color, without changing their directions',()=>{
 const scene=new THREE.Group();
 const segments=[{x:1,y:1,nx:2,ny:1,color:1},{x:2,y:1,nx:1,ny:1,color:2}];
 const point=(x,y,height)=>new THREE.Vector3(x,height,y);
 const result=renderLaserFX(THREE,scene,segments,[],new Map(),COLORS,point);
 assert.equal(result.geometryStats.drawCalls,3);
 const core=scene.children.find(mesh=>mesh.renderOrder===9);
 assert.equal(core.geometry.getAttribute('beamAxis').count,6);
 assert.equal(core.material.uniforms.uColor.value.getHexString(),COLORS[3].slice(1));
 assert.equal(core.material.blending,THREE.NormalBlending);
 const photons=scene.children.find(mesh=>mesh.isPoints).geometry;
 assert.deepEqual([...photons.getAttribute('position').array].filter((_,i)=>i%3===0),[1,1,2,2]);
});

test('receiver flares use the matched target color and skip the wrong wavelength',()=>{
 const scene=new THREE.Group();
 const point=(x,y,height)=>new THREE.Vector3(x,height,y);
 const pieces=[
  {type:'target',id:1,x:5,y:5,color:3},
  {type:'target',id:2,x:7,y:5,color:4}
 ];
 const segments=[
  {x:4,y:5,nx:5,ny:5,color:1},
  {x:5,y:4,nx:5,ny:5,color:2},
  {x:6,y:5,nx:7,ny:5,color:2}
 ];
 renderLaserFX(THREE,scene,segments,pieces,new Map([[1,3],[2,2]]),COLORS,point);
 const flares=scene.children.filter(obj=>obj.isSprite);
 assert.equal(flares.length,1);
 assert.equal(flares[0].material.color.getHexString(),COLORS[3].slice(1));
});
