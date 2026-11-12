import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyMirrorSegments} from '../src/beam-guides.js';
test('mirror guides label actual incoming/outgoing traced segments',()=>{
 const optic={type:'mirror',x:7,y:7,rot:1};
 const rays=[
  {x:6,y:7,nx:7,ny:7,color:4},
  {x:7,y:7,nx:7,ny:6,color:4},
  {x:4,y:5,nx:4,ny:4,color:1}
 ];
 const view=classifyMirrorSegments(optic,rays);
 assert.equal(view.incoming.length,1);assert.equal(view.outgoing.length,1);
 assert.deepEqual(view.incoming[0],rays[0]);
 assert.deepEqual(view.outgoing[0],rays[1]);
});
test('a mirror struck from its dark back has no outgoing guide',()=>{
 const optic={type:'mirror',x:7,y:7,rot:3};
 const rays=[{x:6,y:7,nx:7,ny:7,color:4}];
 const view=classifyMirrorSegments(optic,rays);
 assert.equal(view.incoming.length,1);assert.equal(view.outgoing.length,0);
});
test('unplaced and unrelated optics do not show guides',()=>{
 assert.deepEqual(classifyMirrorSegments({type:'mirror',inTray:true},[]),{incoming:[],outgoing:[]});
 assert.deepEqual(classifyMirrorSegments({type:'target',x:7,y:7},[]),{incoming:[],outgoing:[]});
});
