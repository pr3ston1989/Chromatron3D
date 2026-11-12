import test from 'node:test';
import assert from 'node:assert/strict';
import {validateLevels,PROTOTYPE_LEVELS} from '../src/levels.js';
import {createPuzzlePieces,verifyPuzzleSolution,solvePuzzle} from '../src/puzzle-solver.js';
import {contextualHint} from '../src/hint-assistant.js';
import {trace} from '../src/optics.js';

test('every bundled demonstration has a machine-verified complete solution',()=>{
 const all=validateLevels(PROTOTYPE_LEVELS);
 assert.equal(all.length,8);
 for(const [i,level] of all.entries()){
  assert.ok(Array.isArray(level.solution),String(i));
  const check=verifyPuzzleSolution(level,level.solution);
  assert.equal(check.valid,true,'solution '+(i+1));
  const solved=solvePuzzle(level);
  assert.equal(solved.status,'solved');
  assert.equal(solved.method,'verified-authored');
  assert.deepEqual(solved.solution,level.solution);
 }
});
test('bad hints and overlapping optics can never pass as verified solutions',()=>{
 const [level]=validateLevels(PROTOTYPE_LEVELS);
 assert.equal(verifyPuzzleSolution(level,[{index:2,x:7,y:7,rot:0}]).valid,false);
 assert.equal(verifyPuzzleSolution(level,[{index:2,x:2,y:7,rot:1}]).reason,'collision');
 assert.equal(verifyPuzzleSolution(level,[{index:0,x:7,y:7,rot:1}]).valid,false);
});
test('bounded search solves an unannotated one-mirror optics puzzle',()=>{
 const [level]=validateLevels([{title:'Simple',pieces:[
  ['laser',2,7,2,4],['target',7,3,0,4],['mirror',7,11,0,0]
 ]}]);
 const found=solvePuzzle(level,{maxChecks:5000});
 assert.equal(found.status,'solved');
 assert.ok(found.checks<=5000);
 assert.equal(verifyPuzzleSolution(level,found.solution).valid,true);
});
test('very complex puzzles report limits rather than pretending to know the answer',()=>{
 const pieces=[['laser',1,7,2,1],['target',12,7,0,4],
  ...[[1,1],[2,2],[3,3]].map(([x,y])=>['mirror',x,y,0,0])];
 const [level]=validateLevels([{title:'Many optics',pieces}]);
 const result=solvePuzzle(level,{maxMovables:2});
 assert.equal(result.status,'complex');
 assert.equal(result.solution,null);
});
test('state-aware progressive hints use current colors, validate next step and never fabricate',()=>{
 const [level]=validateLevels(PROTOTYPE_LEVELS);
 const pieces=createPuzzlePieces(level),result=trace(pieces);
 assert.equal(result.won,false);
 const first=contextualHint(level,pieces,1,'pl',null);
 assert.match(first.body,/Rezonator/);
 const second=contextualHint(level,pieces,2,'en',level.solution);
 assert.equal(second.verified,true);
 assert.deepEqual(second.focus,{x:7,y:7});
 const third=contextualHint(level,pieces,3,'pl',level.solution);
 assert.equal(third.verified,true);
 assert.match(third.body,/\(7, 7\)/);
 const notVerified=contextualHint(level,pieces,3,'en',null);
 assert.equal(notVerified.verified,false);
 assert.match(notVerified.body,/No verified solution/);
});
