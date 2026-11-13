import test from 'node:test';
import assert from 'node:assert/strict';
import {draftKey,encodePuzzleDraft,restorePuzzleDraft} from '../src/puzzle-drafts.js';
import {movable} from '../src/optics.js';

const level={
 startMovablesInTray:true,
 pieces:[
  ['laser',1,7,2,4],
  ['target',12,7,0,4],
  ['mirror',6,9,0,0],
  ['mirror',9,9,0,0]
 ]
};
const initial=()=>level.pieces.map(([type,x,y,rot,color],i)=>({
 id:i+1,type,x,y,rot,color,inTray:movable.has(type)
}));

test('draft keys are stage- and pack-specific',()=>{
 assert.notEqual(draftKey('abc',0),draftKey('abc',1));
 assert.notEqual(draftKey('abc',0),draftKey('def',0));
 assert.throws(()=>draftKey('',0),/Invalid draft/);
 assert.throws(()=>draftKey('abc',-1),/Invalid draft/);
});

test('unmodified puzzle does not create a redundant draft',()=>{
 assert.equal(encodePuzzleDraft(level,initial(),movable),null);
});

test('only movable coordinates, orientations and tray flags are saved',()=>{
 const pieces=initial();
 pieces[2].x=5;pieces[2].y=7;pieces[2].rot=3;pieces[2].inTray=false;
 pieces[3].rot=6; // Rotation while still in the inventory.
 const raw=encodePuzzleDraft(level,pieces,movable);
 const parsed=JSON.parse(raw);
 assert.equal(parsed.version,1);
 assert.deepEqual(parsed.items,[
  {index:2,x:5,y:7,rot:3,inTray:false},
  {index:3,x:9,y:9,rot:6,inTray:true}
 ]);
 assert.equal(raw.includes('laser'),false,'fixed/sourced puzzle data stays private');
 assert.equal(raw.includes('target'),false);
 const restored=restorePuzzleDraft(level,initial(),raw,movable);
 assert.deepEqual(restored,pieces);
 assert.equal(restored[0].x,1);
 assert.equal(restored[1].x,12);
});

test('invalid or overlapping drafts are rejected atomically',()=>{
 const baseline=initial();
 const edited=initial();
 edited[2].x=5;edited[2].y=7;edited[2].inTray=false;
 let parsed=JSON.parse(encodePuzzleDraft(level,edited,movable));
 const malformed=[
  'garbage',
  JSON.stringify({version:2,items:parsed.items}),
  JSON.stringify({version:1,items:[parsed.items[0]]}),
  JSON.stringify({version:1,items:[
   {...parsed.items[0],x:1,y:7},parsed.items[1]
  ]}),
  JSON.stringify({version:1,items:[
   parsed.items[0],{...parsed.items[1],inTray:false,x:5,y:7}
  ]}),
  JSON.stringify({version:1,items:[
   {...parsed.items[0],rot:20},parsed.items[1]
  ]}),
  JSON.stringify({version:1,items:[
   {...parsed.items[0],x:15},parsed.items[1]
  ]}),
  JSON.stringify({version:1,items:[
   {...parsed.items[0],inTray:'yes'},parsed.items[1]
  ]}),
  JSON.stringify({version:1,items:[
   {...parsed.items[0],index:1},parsed.items[1]
  ]})
 ];
 for(const raw of malformed){
  assert.equal(restorePuzzleDraft(level,baseline,raw,movable),null,raw);
  assert.deepEqual(baseline,initial(),'rejecting a draft never changes the board');
 }
});

test('non-movable optics cannot be written into the draft',()=>{
 const pieces=initial();
 pieces[0].x=5;
 assert.equal(encodePuzzleDraft(level,pieces,movable),null);
});

test('drafts do not leak from one pack to another even when shapes differ',()=>{
 const a=initial();a[2].inTray=false;a[2].x=7;a[2].y=8;
 const raw=encodePuzzleDraft(level,a,movable);
 const different={...level,pieces:[
  ['laser',1,7,2,4],['target',12,7,0,4],
  ['wall',6,9,0,0],['mirror',9,9,0,0]
 ]};
 assert.equal(restorePuzzleDraft(different,initial(),raw,movable),null);
});
