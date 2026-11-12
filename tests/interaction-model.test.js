import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyClick,isFreeCell,nextTrayPiece,mirrorFrontDirection,mirrorAccepts} from '../src/interaction-model.js';

const a={id:1,type:'mirror',x:4,y:4,inTray:false};
const b={id:2,type:'mirror',x:10,y:10,inTray:false};
const c={id:3,type:'mirror',x:0,y:0,inTray:true};

test('empty cell cannot silently relocate a placed optic',()=>{
 assert.equal(classifyClick({x:7,y:7},a,false).action,'clear');
 assert.equal(classifyClick({x:7,y:7},a,true).action,'clear');
 assert.deepEqual(classifyClick({x:7,y:7},c,true),{action:'place',x:7,y:7});
});
test('selecting another mirror preserves its exact identity',()=>{
 assert.deepEqual(classifyClick({piece:b},a,false),{action:'select',piece:b});
 assert.notEqual(a,b);
});
test('inventory never recycles a mirror already on the board',()=>{
 assert.equal(nextTrayPiece([a,b,c],'mirror'),c);
 assert.equal(nextTrayPiece([a,b],'mirror'),null);
});
test('occupied and invalid cells are rejected, original cell is fine for own drag',()=>{
 assert.equal(isFreeCell([a,b,c],a,10,10),false);
 assert.equal(isFreeCell([a,b,c],a,4,4),true);
 assert.equal(isFreeCell([a,b,c],c,7,7),true);
 assert.equal(isFreeCell([a,b,c],a,15,7),false);
});
test('mirror face and optical one-sided reflection agree',()=>{
 assert.equal(mirrorFrontDirection(1),7); // north-west outward normal
 assert.equal(mirrorAccepts(2,1),true); // incoming east => reflected north
 assert.equal(mirrorAccepts(6,1),false); // wrong face
});
