import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createOpticIllumination} from '../src/optic-illumination.js';
import {mountRealMirror} from '../src/mirror-reflections.js';
import {DX,DY,trace} from '../src/optics.js';

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

test('the splitter glass and axial stops match the traced beam from every direction after rotation',async()=>{
 const buffer=await readFile(new URL('../assets/models/optical-bench/splitter.glb',import.meta.url));
 const {scene}=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.length),'');
 scene.scale.set(1.05,1,1.05);
 const center=new THREE.Vector3(0,.78,0);
 for(let rot=0;rot<8;rot++){
  scene.rotation.y=-rot*Math.PI/4;
  scene.updateMatrixWorld(true);
  for(let dir=0;dir<8;dir++){
   const laser={type:'laser',x:7-DX[dir],y:7-DY[dir],rot:dir,color:6};
   const splitter={type:'splitter',x:7,y:7,rot};
   const {segments}=trace([laser,splitter]);
   const carriesLight=segments.some(s=>s.x===7&&s.y===7);
   const heading=new THREE.Vector3(DX[dir],0,DY[dir]).normalize();
   const ray=new THREE.Raycaster(center.clone().addScaledVector(heading,-1),heading,0,1);
   const hits=ray.intersectObject(scene,true);
   const first=hits[0]?.object.material;
   assert.ok(first,`empty head at rotation ${rot}, direction ${dir}`);
   if(carriesLight){
    assert.equal(first.name,'Splitter crown glass');
    assert.ok(first.transparent&&first.opacity>0&&first.opacity<1);
    assert.ok(hits.some(hit=>hit.object.material.name==='Optical coating'));
   }else{
    assert.equal(first.transparent,false);
    assert.ok(first.name!=='Optical coating','axial incidence must meet a stop first');
   }
  }
 }
});
