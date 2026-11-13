import test from 'node:test';
import assert from 'node:assert/strict';
import {trace} from '../src/optics.js';

function puzzle({laserColor=4,dopplerRotation=4,removeDoppler=false}={}){
 const pieces=[
  {id:1,type:'laser',x:7,y:4,rot:4,color:laserColor},
  {id:2,type:'target',x:7,y:6,rot:0,color:laserColor},
  {id:3,type:'tangler',x:7,y:7,rot:2,color:0},
  {id:4,type:'target',x:4,y:7,rot:0,color:1},
  {id:5,type:'target',x:10,y:7,rot:0,color:2}
 ];
 if(!removeDoppler)pieces.push({id:6,type:'doppler',x:6,y:7,rot:dopplerRotation,color:0});
 return pieces;
}
test('quantum tangler creates two coupled rays, a Doppler shifts the remote twin backwards',()=>{
 const result=trace(puzzle());
 assert.equal(result.unsupported.length,0);
 assert.equal(result.entangledPairs,1);
 assert.equal(result.truncated,false);
 assert.equal(result.total,3);
 assert.equal(result.active,3);
 assert.equal(result.received.get(2),4,'blue receiver sees input before entanglement');
 assert.equal(result.received.get(4),1,'Doppler converts blue to red locally');
 assert.equal(result.received.get(5),2,'remote entangled blue partner turns green');
 assert.equal(result.won,true);
 const beamColors=[...new Set(result.segments.map(s=>s.color))].sort();
 assert.deepEqual(beamColors,[1,2,4]);
});
test('Doppler orientation reverses paired shifts rather than leaving the other ray unchanged',()=>{
 const result=trace(puzzle({dopplerRotation:0}));
 assert.equal(result.won,false);
 assert.equal(result.received.get(4),2);
 assert.equal(result.received.get(5),1);
});
test('without a Doppler both partners keep their original color',()=>{
 const result=trace(puzzle({removeDoppler:true}));
 assert.equal(result.won,false);
 assert.equal(result.received.get(4),4);
 assert.equal(result.received.get(5),4);
});
test('multi-channel input splits into independently entangled RGB pairs',()=>{
 const parts=puzzle({laserColor:7,removeDoppler:true});
 parts[1].color=7;parts[3].color=7;parts[4].color=7;
 const result=trace(parts);
 assert.equal(result.entangledPairs,3);
 assert.equal(result.received.get(4),7);
 assert.equal(result.received.get(5),7);
 assert.equal(result.won,true);
});
test('tangler absorbs beams entering from any other side',()=>{
 const parts=puzzle({removeDoppler:true});
 parts[2].rot=0;
 const result=trace(parts);
 assert.equal(result.entangledPairs,0);
 assert.equal(result.received.get(4),undefined);
 assert.equal(result.received.get(5),undefined);
 assert.equal(result.won,false);
});
