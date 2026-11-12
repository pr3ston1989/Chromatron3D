import test from 'node:test';
import assert from 'node:assert/strict';
import {trace} from '../src/optics.js';
const p=(id,type,x,y,rot=0,color=0)=>({id,type,x,y,rot,color});
test('unobstructed beam reaches matching target',()=>{
 const r=trace([p(1,'laser',2,7,2,4),p(2,'target',8,7,0,4)]);
 assert.equal(r.won,true);assert.equal(r.active,1);assert.equal(r.segments.length,6);
});
test('a rotated reflector turns eastbound blue light to north',()=>{
 const r=trace([p(1,'laser',2,7,2,4),p(2,'mirror',7,7,1),p(3,'target',7,3,0,4)]);
 assert.equal(r.won,true);assert.equal(r.active,1);
});
test('a wall blocks beams',()=>{
 const r=trace([p(1,'laser',2,7,2,1),p(2,'wall',4,7),p(3,'target',8,7,0,1)]);
 assert.equal(r.won,false);
});
test('filter rejects mismatched RGB component',()=>{
 const r=trace([p(1,'laser',2,7,2,4),p(2,'filter',4,7,2,1),p(3,'target',8,7,0,4)]);
 assert.equal(r.won,false);
});
test('target rejects wrong or mixed colors',()=>{
 const wrong=trace([p(1,'laser',2,7,2,4),p(2,'target',8,7,0,1)]);
 assert.equal(wrong.active,0);
 const mixed=trace([p(1,'laser',2,7,2,1),p(2,'laser',8,7,6,4),p(3,'target',5,7,0,1)]);
 assert.equal(mixed.won,false);
});
test('splitter branches and propagates both rays',()=>{
 const r=trace([p(1,'laser',2,7,2,1),p(2,'splitter',7,7,1),p(3,'target',11,7,0,1),p(4,'target',7,3,0,1)]);
 assert.equal(r.won,true);assert.equal(r.active,2);
});
test('tracing terminates on mirror cycles',()=>{
 const r=trace([p(1,'laser',2,7,2,1),p(2,'mirror',5,7,0),p(3,'mirror',5,5,0),p(4,'target',14,14,0,1)]);
 assert.equal(r.won,false);assert.ok(r.segments.length<4096);
});
