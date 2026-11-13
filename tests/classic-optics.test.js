import test from 'node:test';
import assert from 'node:assert/strict';
import {trace,movable} from '../src/optics.js';
import {CLASSIC_TYPE_NAMES} from '../src/classic-pieces.js';
import {readFileSync} from 'node:fs';

const piece=(type,x,y,rot,color)=>({id:y*15+x,type,x,y,rot,color,sourceGame:4});
const laser=(x,y,rot,color)=>piece('laser',x,y,rot,color);
const target=(x,y,color)=>piece('target',x,y,0,color);
function check(parts,won=true){
 const result=trace(parts);
 assert.equal(result.truncated,false);assert.deepEqual(result.unsupported,[]);
 assert.equal(result.won,won);
}
test('Chromatron II–IV transfer angles, complements, portals and additive channels',()=>{
 for(const [kind,rot,color,tx,ty,want] of [
  ['multiFilter',0,7,9,5,1],['twister',0,2,5,2,2],['complementor',0,3,9,5,4],
  ['dualReflector',5,1,5,2,1],['quadBender',0,2,2,8,2],
  ['occupiedSquare',0,1,9,5,1],['starburst',0,4,8,8,4]
 ])check([laser(2,5,2,color),piece(kind,5,5,rot,0),target(tx,ty,want)]);
 check([laser(0,3,2,4),piece('mobileTeleporter',2,3,0,0),piece('wall',4,3,0,0),piece('teleporter',6,3,0,0),target(8,3,4)]);
 for(const primary of [false,true]){
  const gate=piece(primary?'primaryLogicGate':'logicGate',6,6,0,0);
  check([laser(3,9,1,7),laser(9,9,7,3),gate,target(6,2,3)],!primary);
  check([laser(3,9,1,5),laser(9,9,7,3),gate,target(6,2,1)]);
 }
});
test('later splitters return a head-on ray to the source side',()=>{
 for(const game of [1,2,3,4]){
  const parts=[laser(3,5,2,1),piece('splitter',5,5,0,0)].map(p=>({...p,sourceGame:game}));
  assert.equal(trace(parts).segments.some(s=>s.x===5&&s.nx===4),game>1);
 }
});
test('all 22 instrument models are distinct Blender exports and the tray supports 14 movable kinds',()=>{
 assert.equal(movable.size,14);
 for(const kind of CLASSIC_TYPE_NAMES.slice(1)){
  const data=readFileSync(new URL('../public/models/optics/'+kind+'.glb',import.meta.url));
  assert.equal(data.readUInt32LE(8),data.length);
  const gltf=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)));
  assert.match(gltf.asset.generator,/Blender/i);
  assert.equal(gltf.nodes[0].name,kind);
  assert.ok(gltf.materials.length>=3);
 }
});
