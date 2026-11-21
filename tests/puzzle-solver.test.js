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
test('puzzles exceeding maxMovables report complex status',()=>{
 const pieces=[['laser',1,7,2,1],['target',12,7,0,4],
  ...[[1,1],[2,2],[3,3],[4,4],[5,5]].map(([x,y])=>['mirror',x,y,0,0])];
 const [level]=validateLevels([{title:'Many optics',pieces}]);
 const result=solvePuzzle(level,{maxMovables:4});
 assert.equal(result.status,'complex');
 assert.equal(result.solution,null);
});
test('bounded search solves a puzzle with three movable mirrors',()=>{
 // Laser shoots east from (1,7). Three mirrors must route beam:
 //   (1,7)→E to mirror at (5,7) rot=1 →N to mirror at (5,3) rot=5 →E
 //   to mirror at (10,3) rot=7 →S to target at (10,10).
 const pieces=[
  ['laser',1,7,2,4],['target',10,10,0,4],
  ['mirror',5,12,0,0],['mirror',5,14,0,0],['mirror',10,14,0,0]
 ];
 const [level]=validateLevels([{title:'Three mirrors',pieces}]);
 const found=solvePuzzle(level,{maxChecks:80000,maxMovables:4});
 assert.equal(found.status,'solved');
 assert.equal(found.solution.length,3);
 assert.equal(verifyPuzzleSolution(level,found.solution).valid,true);
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

test('verified clues pick the first reachable optic before a downstream move in the stored solution',()=>{
 const level={pieces:[['laser',1,7,2,1],['target',11,3,0,1],
  ['mirror',8,3,5,0],['mirror',8,7,1,0]]};
 const solution=[{index:2,x:8,y:3,rot:5},{index:3,x:8,y:7,rot:1}];
 assert.ok(verifyPuzzleSolution(level,solution).valid);
 const pieces=createPuzzlePieces(level);
 const clue=contextualHint(level,pieces,1,'en',solution);
 assert.match(clue.body,/red beam travelling right/i);
 assert.match(clue.body,/red up/i);
 assert.equal(clue.focus,null);
 const exact=contextualHint(level,pieces,3,'pl',solution);
 assert.deepEqual(exact.focus,{x:8,y:7});
 // Player chose the other identical mirror and set it correctly upstream.
 Object.assign(pieces[2],{x:8,y:7,rot:1,inTray:false});
 assert.deepEqual(contextualHint(level,pieces,3,'pl',solution).focus,{x:8,y:3});
 Object.assign(pieces[3],{x:8,y:3,rot:0,inTray:false});
 const rotate=contextualHint(level,pieces,3,'en',solution);
 assert.match(rotate.body,/Rotate.*225° \(3 × left\)/);
 assert.equal(rotate.instruction,rotate.body);
});

test('an extra tool interrupting the verified route is removed before a downstream placement',()=>{
 const level={pieces:[['laser',1,7,2,1],['target',7,3,0,1],
  ['mirror',7,7,1,0],['filter',4,7,0,4]]};
 const plan=[{index:2,x:7,y:7,rot:1}],pieces=createPuzzlePieces(level);
 pieces[3].inTray=false;
 assert.ok(verifyPuzzleSolution(level,plan).valid);
 const clue=contextualHint(level,pieces,3,'en',plan);
 assert.match(clue.body,/Return FILTER.*Blue.*tray/);
 assert.deepEqual(clue.focus,{x:4,y:7});
});

test('a verified clue can move a tool already used off the winning path',()=>{
 const [level]=validateLevels(PROTOTYPE_LEVELS);
 const pieces=createPuzzlePieces(level);
 const mirror=pieces.find(p=>p.type==='mirror');
 Object.assign(mirror,{x:5,y:10,inTray:false});
 const hint=contextualHint(level,pieces,3,'en',level.solution);
 assert.match(hint.body,/from \(5, 10\) to \(7, 7\)/);
 assert.deepEqual(hint.focus,{x:7,y:7});
 const experiment=contextualHint(level,pieces,2,'en',level.solution);
 assert.match(experiment.body,/Check for Blue up/);
});
