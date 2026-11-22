import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createCollectorField} from '../src/collector-field.js';
import {createOpticModelLoader} from '../src/optic-model-loader.js';
import {CLASSIC_TYPE_NAMES} from '../src/classic-pieces.js';
import {COLORS,trace} from '../src/optics.js';

test('the physical field intersects every outgoing edge ray, including corners',()=>{
 const field=createCollectorField(THREE,new THREE.Group(),{cells:15,tileSize:1.3,palette:COLORS});
 const screen=field.group.getObjectByName('collector-membrane');
 const tex=screen.material.uniforms.contacts.value;
 const ray=new THREE.Raycaster();
 for(let rot=0;rot<8;rot++){
  const {boundaryHits}=trace([{id:1,type:'laser',x:7,y:7,color:1,rot}]);
  const {nx,ny}=boundaryHits[0];
  const end=new THREE.Vector3((nx-7)*1.3,.78,(ny-7)*1.3);
  const start=new THREE.Vector3(0,.78,0);
  ray.set(start,end.clone().sub(start).normalize());
  const hits=ray.intersectObject(screen,false);
  assert.ok(hits.some(h=>h.point.distanceTo(end)<1e-5),'direction '+rot);
  field.updateHits([...boundaryHits,{...boundaryHits[0],color:2}]);
  const pixels=tex.image.data;
  let contacts=0;
  for(let i=0;i<pixels.length;i+=4)if(pixels[i]){
   contacts++;
   assert.ok(pixels[i+1]>100,'coincident red and green display yellow');
  }
  assert.equal(contacts,rot%2?2:1);
 }
 field.updateHits([]);
 assert.equal(tex.image.data.filter((v,i)=>i%4!==3&&v!==0).length,0);
});

test('all 22 live bench models have cell-sized footprints, authored materials and stock portraits',()=>{
 for(const kind of CLASSIC_TYPE_NAMES.slice(1)){
  const bytes=readFileSync(new URL('../assets/models/optical-bench/'+kind+'.glb',import.meta.url));
  const doc=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
  const parts=doc.meshes.flatMap(m=>m.primitives);
  const bounds=parts.map(p=>doc.accessors[p.attributes.POSITION]);
  assert.equal(Math.min(...bounds.map(b=>b.min[1])),0,kind);
  assert.ok(bounds.every(b=>[0,2].every(axis=>Math.max(-b.min[axis],b.max[axis])*1.05<.65)),kind);
  assert.ok(parts.every(p=>p.attributes.NORMAL!==undefined&&p.attributes.COLOR_0!==undefined),kind);
  const portrait=readFileSync(new URL('../assets/models/optical-bench/portraits/'+kind+'.png',import.meta.url));
  assert.equal(portrait.readUInt32BE(16),160,kind);
 }
});

test('the actual coloured crystal intersects all eight beam headings and indicates correct reception independently',async()=>{
 const bytes=readFileSync(new URL('../assets/models/optical-bench/target.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const loader=createOpticModelLoader(THREE,{modelUrls:{target:'target'},loader:{load:(_,ok)=>ok(gltf)}});
 loader.load('target');
 const red=new THREE.Color(COLORS[1]),model=loader.cloneOptic('target',red,{deck:'kepler'});
 const findMaterial=name=>{
  let result;model.traverse(n=>{if(n.material?.name===name)result=n});return result;
 };
 const gem=findMaterial('Resonance crystal'),lock=findMaterial('Receiver lock');
 assert.ok(gem.material.isMeshStandardMaterial);
 model.updateMatrixWorld(true);
 for(let i=0;i<8;i++){
  const d=new THREE.Vector3(Math.cos(i*Math.PI/4),0,Math.sin(i*Math.PI/4));
  const ray=new THREE.Raycaster(new THREE.Vector3(0,.78,0).add(d),d.negate());
  assert.ok(ray.intersectObject(gem,false).some(hit=>hit.distance<.70),'heading '+i);
 }
 const inactive=gem.material;
 const inactiveLock=lock.material;
 loader.tint(model,red,true,'target');
 assert.equal(gem.material.color.getHex(),red.getHex());
 assert.ok(gem.material.emissiveIntensity>inactive.emissiveIntensity);
 assert.notEqual(lock.material.emissive.getHex(),inactiveLock.emissive.getHex());
 loader.tint(model,red,false,'target');
 assert.equal(gem.material,inactive);
});
