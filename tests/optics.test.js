import test from 'node:test';
import assert from 'node:assert/strict';
import {trace} from '../src/optics.js';
import {PROTOTYPE_LEVELS,validateLevels} from '../src/levels.js';
import {normalizeLanguage,t,loc} from '../src/i18n.js';
import {clampHints,nextHint,hintFor} from '../src/hints.js';

const p=(id,type,x,y,rot=0,color=0)=>({id,type,x,y,rot,color});

test('light reaches an exact-color target and then passes through',()=>{
 const r=trace([p(1,'laser',2,7,2,4),p(2,'target',8,7,0,4),p(3,'target',11,7,0,4)]);
 assert.equal(r.won,true);assert.equal(r.active,2);assert.ok(r.segments.length>=9);
});
test('reflector redirects an incoming eastern beam to the north',()=>{
 const r=trace([p(1,'laser',2,7,2,4),p(2,'mirror',7,7,1),p(3,'target',7,3,0,4)]);
 assert.equal(r.won,true);
});
test('reflector blocks a beam arriving from its forbidden side',()=>{
 const r=trace([p(1,'laser',2,7,2,4),p(2,'mirror',7,7,3),p(3,'target',7,11,0,4)]);
 assert.equal(r.won,false);
});
test('wall blocks a beam',()=>{
 const r=trace([p(1,'laser',2,7,2,1),p(2,'wall',4,7),p(3,'target',8,7,0,1)]);
 assert.equal(r.won,false);
});
test('filter blocks mismatched colors and passes matched colors axially',()=>{
 assert.equal(trace([p(1,'laser',2,7,2,4),p(2,'filter',4,7,0,1),p(3,'target',8,7,0,4)]).won,false);
 assert.equal(trace([p(1,'laser',2,7,2,1),p(2,'filter',4,7,0,1),p(3,'target',8,7,0,1)]).won,true);
 assert.equal(trace([p(1,'laser',2,7,2,1),p(2,'filter',4,7,2,1),p(3,'target',8,7,0,1)]).won,false);
});
test('target rejects incorrect/mixed colors',()=>{
 assert.equal(trace([p(1,'laser',2,7,2,4),p(2,'target',8,7,0,1)]).won,false);
 assert.equal(trace([p(1,'laser',2,7,2,1),p(2,'laser',8,7,6,4),p(3,'target',5,7,0,1)]).won,false);
});
test('splitter creates both a straight and reflected signal',()=>{
 const r=trace([p(1,'laser',2,7,2,1),p(2,'splitter',7,7,1),p(3,'target',11,7,0,1),p(4,'target',7,3,0,1)]);
 assert.equal(r.won,true);assert.equal(r.active,2);
});
test('prism splits white light into independently directed RGB rays',()=>{
 const r=trace([p(1,'laser',2,5,2,7),p(2,'prism',5,5,0),p(3,'target',8,5,0,4),p(4,'target',8,8,0,2),p(5,'target',5,9,0,1)]);
 assert.equal(r.won,true);
});
test('doppler shifts red to green',()=>{
 assert.equal(trace([p(1,'laser',2,7,2,1),p(2,'doppler',4,7,0),p(3,'target',8,7,0,2)]).won,true);
});
test('teleporter forwards light to the next teleporter in beam direction',()=>{
 assert.equal(trace([p(1,'laser',2,7,2,1),p(2,'teleporter',4,7),p(3,'teleporter',9,7),p(4,'target',12,7,0,1)]).won,true);
});
test('ray tracing halts on cycles and walls',()=>{
 const r=trace([p(1,'laser',2,7,2,1),p(2,'mirror',5,7,0),p(3,'mirror',5,5,0),p(4,'target',14,14,0,1)]);
 assert.equal(r.won,false);assert.ok(r.segments.length<16384);
});
test('all five prototype demonstration layouts have verified working placements',()=>{
 const layouts=[
  [['mirror',0,7,7,1]],
  [['mirror',0,5,9,1],['mirror',1,5,4,5]],
  [['filter',0,7,9,0]],
  [['mirror',0,5,10,1],['mirror',1,5,3,5]],
  [['mirror',0,4,5,7],['mirror',1,4,8,3]]
 ];
 const levels=validateLevels(PROTOTYPE_LEVELS);
 assert.equal(levels.length,layouts.length);
 levels.forEach((level,index)=>{
  const pieces=level.pieces.map(([type,x,y,rot,color],i)=>p(i+1,type,x,y,rot,color));
  for(const [type,indexOfType,x,y,rot] of layouts[index]){
   const piece=pieces.filter(p=>p.type===type)[indexOfType];
   assert.ok(piece,'Missing '+type+' in level '+index);
   Object.assign(piece,{x,y,rot});
  }
  const result=trace(pieces);
  assert.equal(result.won,true,'The provided hints must solve demo level '+(index+1));
 });
});
test('language selection and each static UI translation work',()=>{
 assert.equal(normalizeLanguage('bad'),'pl');
 for(const lang of ['pl','en']){
  assert.ok(t(lang,'manualTitle').length>3);
  assert.ok(t(lang,'hintTitle').length>3);
  assert.equal(t(lang,'hintStep',{step:2}).includes('2'),true);
  assert.ok(loc({pl:'Kot',en:'Cat'},lang));
 }
 assert.equal(loc({pl:'Kot',en:'Cat'},'en'),'Cat');
});
test('three-stage hints, no penalties and a reliable end to escalation',()=>{
 const level=validateLevels(PROTOTYPE_LEVELS)[0];
 assert.equal(nextHint(0),1);assert.equal(nextHint(3),3);assert.equal(clampHints(-4),0);
 assert.equal(hintFor(level,'pl',0),null);
 const one=hintFor(level,'pl',1),three=hintFor(level,'en',3);
 assert.ok(one.body.includes('Laser'));assert.equal(one.canSkip,false);
 assert.ok(three.body.includes('(7, 7)'));assert.equal(three.canSkip,true);
 assert.ok(three.focus&&three.focus.x===7);
});
