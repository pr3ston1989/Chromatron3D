import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {extractChromatronExecutable} from '../src/classic-exe.js';
import {convertClassicPack} from '../src/classic-import.js';
import {createPuzzlePieces,verifyPuzzleSolution} from '../src/puzzle-solver.js';
import {trace} from '../src/optics.js';

for(const game of [1,2,3,4]){
 const file=new URL('../original/chromatron'+(game===1?'':game)+'.exe',import.meta.url);
 test('local Windows retail pack '+game+' decodes and all 50 solutions win',{skip:!existsSync(file)},()=>{
  const raw=extractChromatronExecutable(readFileSync(file));
  const damaged=readFileSync(file);
  damaged[0x3e8]^=1;
  assert.throws(()=>extractChromatronExecutable(damaged),/checksum/);
  assert.equal(raw.detectedGame,game);
  const pack=convertClassicPack(raw,{game});
  assert.equal(pack.length,50);
  assert.equal(new Set(pack.map(p=>p.sourceIndex)).size,50);
  const gateSlots=[],primarySlots=[];
  for(const [slot,level] of pack.entries()){
   assert.equal(trace(createPuzzlePieces(level)).won,false,'starts unsolved '+slot);
   const verdict=verifyPuzzleSolution(level,level.solution);
   assert.ok(verdict.valid,'verified solution '+slot);
   if(game===4){
    for(const [kind,slots] of [['logicGate',gateSlots],['primaryLogicGate',primarySlots]]){
     const active=level.solution.some(step=>level.pieces[step.index][0]===kind&&
      verdict.result.segments.some(s=>s.x===step.x&&s.y===step.y));
     if(active)slots.push(slot+1);
    }
   }
  }
  // Independently recorded gate activity in the reference remake.
  if(game===4){
   assert.deepEqual(gateSlots,[4,5,6,15,50]);
   assert.deepEqual(primarySlots,[41,42]);
  }
 });
}
