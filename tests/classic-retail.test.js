import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {extractChromatronExecutable} from '../src/classic-exe.js';
import {convertClassicPack} from '../src/classic-import.js';
import {createPuzzlePieces,verifyPuzzleSolution} from '../src/puzzle-solver.js';
import {trace} from '../src/optics.js';
import {contextualHint} from '../src/hint-assistant.js';
import {classicStrategy} from '../src/classic-strategies.js';

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
  const seenClues={pl:new Set(),en:new Set()};
  for(const [slot,level] of pack.entries()){
   assert.equal(trace(createPuzzlePieces(level)).won,false,'starts unsolved '+slot);
   const verdict=verifyPuzzleSolution(level,level.solution);
   assert.ok(verdict.valid,'verified solution '+slot);
   const pieces=createPuzzlePieces(level);
   for(const part of pieces)if(part.inTray)part.rot=0;
   for(const language of ['pl','en']){
    const editorial=classicStrategy(level,language);
    assert.ok(editorial,'Missing '+language+' strategy '+game+':'+(slot+1));
    assert.equal(contextualHint(level,pieces,1,language,level.solution).body,editorial);
    assert.ok(!seenClues[language].has(editorial),'Repeated strategy '+slot);
    seenClues[language].add(editorial);
   }
   const {focus,verified,body}=contextualHint(level,pieces,2,'pl',level.solution);
   assert.ok(verified&&focus&&body.includes('zaznaczonym'), 'missing second clue '+slot);
   // Follow exact clues with interchangeable inventory pieces, as a player can.
   const at=(p,x,y)=>!p.inTray&&p.x===x&&p.y===y;
   for(let count=0;count<=level.solution.length&&!trace(pieces).won;count++){
    const exact=contextualHint(level,pieces,3,'en',level.solution);
    assert.ok(exact.verified&&exact.focus,'Missing exact clue '+game+':'+(slot+1));
    const {x,y}=exact.focus;
    const move=level.solution.find(m=>m.x===x&&m.y===y);
    assert.ok(move&&exact.body.includes(move.rot*45+'°'),'Invalid exact angle '+slot);
    const want=pieces[move.index];
    const part=pieces.find(p=>at(p,x,y))||pieces.find(p=>p.inTray&&p.type===want.type&&
     (p.type!=='filter'||p.color===want.color));
    assert.ok(part,'Exact clue needs a part not available '+slot);
    Object.assign(part,{x,y,rot:move.rot,inTray:false});
   }
   assert.ok(trace(pieces).won,'Exact hints do not reach a win '+game+':'+(slot+1));
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
