import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBeamBatcher} from '../src/beam-batching.js';

test('long laser path uses two draw calls for ribbons and tube shell/core',()=>{
 const scene=new THREE.Group();
 const batcher=createBeamBatcher(THREE,scene);
 const beam=new THREE.MeshBasicMaterial({color:'#56aaff',transparent:true});
 const shell=new THREE.MeshBasicMaterial({color:'#56aaff',transparent:true});
 const a=new THREE.Vector3(),b=new THREE.Vector3();
 for(let n=0;n<60;n++){
  a.set(n,1,0);b.set(n+1,1,0);
  batcher.addRibbon(a,b,.6,false,beam);
  batcher.addTube(a,b,.06,shell,8);
 }
 const stats=batcher.flush();
 assert.equal(stats.drawCalls,2);
 assert.equal(stats.segments,60);
 const ribbon=scene.children.find(x=>x.name==='batched-laser-ribbon');
 const tubes=scene.children.find(x=>x.name==='instanced-laser-tubes');
 assert.equal(ribbon.geometry.getAttribute('position').count,360);
 assert.equal(ribbon.geometry.getAttribute('uv').count,360);
 assert.equal(tubes.count,60);
 const m=new THREE.Matrix4();
 tubes.getMatrixAt(32,m);
 const pos=new THREE.Vector3().setFromMatrixPosition(m);
 assert.equal(pos.x,32.5);
 assert.equal(pos.y,1);
});
test('differing wavelengths keep separate, correctly colored batches',()=>{
 const scene=new THREE.Group(),batcher=createBeamBatcher(THREE,scene);
 const blue=new THREE.MeshBasicMaterial({color:0x4444ff});
 const red=new THREE.MeshBasicMaterial({color:0xff4444});
 for(const material of [blue,red]){
  const a=new THREE.Vector3(0,.8,0),b=new THREE.Vector3(1,.8,0);
  batcher.addRibbon(a,b,.42,true,material);
  batcher.addTube(a,b,.01,material,9);
 }
 const stat=batcher.flush();
 assert.equal(stat.drawCalls,4);
 assert.equal(scene.children.filter(x=>x.isInstancedMesh).length,2);
 assert.notEqual(scene.children[0].material.color.getHex(),scene.children[1].material.color.getHex());
});
test('empty path does not allocate zero-length instanced meshes',()=>{
 const scene=new THREE.Group();
 const batcher=createBeamBatcher(THREE,scene);
 const result=batcher.flush();
 assert.equal(result.drawCalls,0);
 assert.equal(scene.children.length,0);
});
