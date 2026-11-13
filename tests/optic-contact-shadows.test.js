import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createOpticContactShadows} from '../src/optic-contact-shadows.js';

test('a single instanced contact layer anchors all optical pieces',()=>{
 const world=new THREE.Group();
 const shadows=createOpticContactShadows(THREE,world,{tileSize:1.3,half:7});
 assert.equal(world.children.length,1);
 assert.equal(shadows.mesh.isInstancedMesh,true);
 assert.equal(shadows.mesh.count,0);
 const count=shadows.update([
  {type:'mirror',x:4,y:5,inTray:false},
  {type:'laser',x:2,y:7,inTray:false},
  {type:'wall',x:9,y:9,inTray:false},
  {type:'filter',x:7,y:7,inTray:true}
 ]);
 assert.equal(count,3);
 assert.equal(shadows.mesh.count,3);
 const m=new THREE.Matrix4();
 shadows.mesh.getMatrixAt(0,m);
 const position=new THREE.Vector3().setFromMatrixPosition(m);
 assert.ok(Math.abs(position.x+3.9)<.0001);
 assert.ok(Math.abs(position.z+2.6)<.0001);
 assert.ok(Math.abs(position.y-.018)<.0001);
 assert.equal(shadows.mesh.material.transparent,true);
 assert.equal(shadows.mesh.material.depthWrite,false);
 assert.equal(shadows.texture.image.data.length,64*64*4);
 shadows.dispose();
 assert.equal(world.children.length,0);
});
test('shadow count follows level and tray changes without allocating new meshes',()=>{
 const world=new THREE.Group();
 const shadows=createOpticContactShadows(THREE,world,{maxPieces:2});
 const same=shadows.mesh;
 assert.equal(shadows.update([{x:1,y:1},{x:2,y:2},{x:3,y:3}]),2);
 assert.equal(shadows.update([{x:1,y:1,inTray:true},{x:2,y:2,inTray:false}]),1);
 assert.equal(shadows.update([]),0);
 assert.equal(shadows.mesh,same);
 shadows.dispose();
});
