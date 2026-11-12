import test from 'node:test';
import assert from 'node:assert/strict';
import {PROTOTYPE_LEVELS,validateLevels} from '../src/levels.js';
import {trace,movable} from '../src/optics.js';
/**
 * Golden solutions for each original demonstration puzzle.
 * These are independently authored, not the 200 classic Chromatron levels.
 * Change these only when a designer intentionally changes a puzzle.
 */
const solutions=[
 [[7,7,1]],                    // First light
 [[5,9,1],[5,4,5]],            // Double turn
 [[7,6,0]],                    // Spectrum: move filter off ray
 [[5,10,1],[5,3,5]],           // Blue detour
 [[4,5,7],[4,8,3]],            // Twin signal
 [[7,7,0]],                     // Spectral shift: red to green
 [[7,7,0]],                     // Three wavelengths: prism into RGB
 [[7,8,1]]                      // Split ray: forward and north
];
test('every included demo puzzle has a verified, playable solution',()=>{
 const levels=validateLevels(PROTOTYPE_LEVELS);
 assert.equal(levels.length,solutions.length);
 for(const [index,level] of levels.entries()){
  const parts=level.pieces.map(([type,x,y,rot,color],id)=>({id,type,x,y,rot,color}));
  const movableParts=parts.filter(p=>movable.has(p.type));
  assert.equal(movableParts.length,solutions[index].length,'level '+index+': movable count');
  for(const [i,[x,y,rot]] of solutions[index].entries()){
   Object.assign(movableParts[i],{x,y,rot,inTray:false});
  }
  const locations=new Set(parts.map(p=>p.x+','+p.y));
  assert.equal(locations.size,parts.length,'level '+index+': no overlapping parts');
  const result=trace(parts);
  assert.equal(result.won,true,'level '+index+' must be solvable following its third hint');
  assert.equal(result.active,result.total,'level '+index+': all targets active');
  assert.equal(result.truncated,false);
  assert.deepEqual(result.unsupported,[]);
  assert.equal(level.hints.length,3,'level '+index+': 3 tiers');
  for(const hint of level.hints){
   assert.ok(hint.pl.length>10 && hint.en.length>10,'level '+index+': bilingual clues');
  }
 }
});
