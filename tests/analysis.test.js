import test from 'node:test';
import assert from 'node:assert/strict';
import {trace} from '../src/optics.js';
import {inspectLight,colorName,channels} from '../src/analysis.js';
const p=(id,type,x,y,rot=0,color=0)=>({id,type,x,y,rot,color});
test('analyzer names the color and channels without color-only cues',()=>{
 assert.equal(colorName(3,'pl'),'Żółty');
 assert.equal(colorName(5,'en'),'Magenta');
 assert.deepEqual(channels(5),['R','B']);
});
test('analyzer describes an illuminated exact-color target',()=>{
 const pieces=[p(1,'laser',2,7,2,4),p(2,'target',8,7,0,4)];
 const d=inspectLight(pieces,trace(pieces));
 assert.equal(d.lasers,1);assert.equal(d.targets.length,1);
 assert.equal(d.targets[0].correct,true);assert.equal(d.targets[0].missing,0);
 assert.equal(d.allCorrect,true);assert.equal(d.collisions.length,0);
});
test('analyzer differentiates missing and unexpected wavelengths',()=>{
 const pieces=[p(1,'laser',2,7,2,1),p(2,'target',8,7,0,4)];
 const d=inspectLight(pieces,trace(pieces));
 assert.equal(d.targets[0].missing,4);assert.equal(d.targets[0].unexpected,1);
 assert.equal(d.allCorrect,false);
});
test('analyzer sees a wall absorption, deduplicating repeated hits',()=>{
 const pieces=[p(1,'laser',2,7,2,1),p(2,'wall',4,7),p(3,'target',8,7,0,1)];
 const d=inspectLight(pieces,trace(pieces));
 assert.deepEqual(d.collisions.map(e=>[e.x,e.y,e.type]),[[4,7,'wall']]);
});
test('optics in the tray never affect diagnostics',()=>{
 const pieces=[p(1,'laser',2,7,2,1),{...p(2,'wall',4,7),inTray:true},p(3,'target',8,7,0,1)];
 const d=inspectLight(pieces,trace(pieces));
 assert.equal(d.allCorrect,true);assert.equal(d.collisions.length,0);
});
