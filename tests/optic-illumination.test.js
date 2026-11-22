import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createOpticIllumination} from '../src/optic-illumination.js';
import {mountRealMirror} from '../src/mirror-reflections.js';

test('a coated surface sees the incident and filtered colours on their respective sides',()=>{
 const light=createOpticIllumination(THREE,15,1.3);
 const data=light.map.image.data;
 const channel=(x,y,dir)=>data[(y*15+x)*8+dir];
 light.update([
  {x:12,y:3,nx:13,ny:3,color:3},
  {x:12,y:3,nx:13,ny:3,color:4},
  {x:13,y:3,nx:14,ny:3,color:2}
 ],[{x:14,y:3,nx:14.5,ny:2.5,color:2}]);
 assert.equal(channel(13,3,6),7);
 assert.equal(channel(13,3,2),2);
 assert.equal(channel(14,3,1),2);
 assert.equal(channel(13,3,0),0);
 light.update([],[]);
 assert.equal(light.map.image.data,data);
 assert.ok(data.every(value=>value===0));
});

test('the mirror reflection follows the front coating exported by Blender after selection changes',async()=>{
 const buffer=await readFile(new URL('../assets/models/optical-bench/mirror.glb',import.meta.url));
 const {scene}=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.length),'');
 const head=new THREE.Group();
 head.add(scene);
 scene.scale.set(1.05,1,1.05);
 scene.position.y=-.7;
 head.position.set(2,.7,-3);
 head.rotation.y=Math.PI*.75;
 let coating;
 scene.traverse(mesh=>{if(mesh.material?.name==='Silvered aperture')coating=mesh});
 assert.ok(coating);
 const first=mountRealMirror(THREE,head);
 assert.ok(first?.isReflector);
 const normal=new THREE.Vector3(0,0,1).applyQuaternion(first.quaternion);
 assert.ok(normal.x<-.9&&normal.y>.24,'front should face outwards and upwards');
 const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,first.position);
 const vertices=coating.geometry.getAttribute('position');
 const relative=head.matrixWorld.clone().invert().multiply(coating.matrixWorld);
 for(let i=0;i<vertices.count;i++){
  const point=new THREE.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(relative);
  assert.ok(Math.abs(plane.distanceToPoint(point)+.002)<.0001);
 }
 head.remove(first);
 const next=mountRealMirror(THREE,head);
 assert.ok(next.position.distanceTo(first.position)<1e-6);
 assert.ok(next.quaternion.angleTo(first.quaternion)<1e-6);
 for(const m of [first,next]){m.geometry.dispose();m.dispose()}
});
