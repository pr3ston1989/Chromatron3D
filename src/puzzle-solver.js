import {trace,movable} from './optics.js';
import {validateLevels} from './levels.js';

/** Puzzle solutions are piece-indexed and validated by the SAME engine used
 * for gameplay; a guessed layout is never presented as a verified answer. */
export function createPuzzlePieces(level){
 return level.pieces.map(([type,x,y,rot,color],index)=>({
  id:index+1,type,x,y,rot,color,inTray:movable.has(type)
 }));
}
export function verifyPuzzleSolution(level,solution){
 if(!Array.isArray(solution))return {valid:false,reason:'missing'};
 const parts=createPuzzlePieces(level);
 const movableIndexes=new Set(parts.flatMap((p,i)=>movable.has(p.type)?[i]:[]));
 const seen=new Set();
 for(const step of solution){
  if(!step||!Number.isInteger(step.index)||!movableIndexes.has(step.index)||seen.has(step.index)||
   !Number.isInteger(step.x)||!Number.isInteger(step.y)||
   step.x<0||step.x>14||step.y<0||step.y>14||
   !Number.isInteger(step.rot)||step.rot<0||step.rot>7)return {valid:false,reason:'invalid-step'};
  seen.add(step.index);
  Object.assign(parts[step.index],{x:step.x,y:step.y,rot:step.rot,inTray:false});
 }
 // Pieces omitted from the solution stay in the tray, which is legal for
 // classic toolbox puzzles. Existing initial board positions are not assumed
 // to be solved until explicitly verified.
 const locations=new Set();
 for(const p of parts){
  if(p.inTray)continue;
  const key=p.x+','+p.y;
  if(locations.has(key))return {valid:false,reason:'collision'};
  locations.add(key);
 }
 const result=trace(parts);
 return {valid:result.won&&!result.truncated&&!result.unsupported.length,
  reason:result.won?'verified':'not-solved',result};
}
/**
 * Bounded search for simple original and custom puzzles (0–2 movable optics).
 * The ray path identifies candidate placement cells, pruning the entire
 * 15×15 board. Intended to run in a Web Worker, not on the render thread.
 * No claims of solving all original 200 levels: tangler and special cases
 * require exact physics and more advanced constraint search.
 */
export function solvePuzzle(level,{maxChecks=30000,maxMovables=2}={}){
 const [parsed]=validateLevels([level]);
 const parts=createPuzzlePieces(parsed);
 const moveIndexes=parts.flatMap((p,i)=>movable.has(p.type)?[i]:[]);
 const known=Array.isArray(level.solution)?level.solution:null;
 if(known){
  const check=verifyPuzzleSolution(parsed,known);
  if(check.valid)return {status:'solved',solution:known,checks:1,method:'verified-authored'};
 }
 const fixed=trace(parts);
 if(fixed.won)return {status:'solved',solution:[],checks:1,method:'trivial'};
 if(fixed.unsupported.length)return {status:'unsupported',solution:null,checks:1};
 if(moveIndexes.length>maxMovables)
  return {status:'complex',solution:null,checks:1};
 let checks=0,exhausted=false,found=null;
 const occupied=new Set(parts.filter(p=>!p.inTray).map(p=>p.x+','+p.y));
 const current=[];
 function candidateCells(previousResult,index){
  const positions=new Map();
  for(const seg of previousResult.segments){
   if(seg.nx>=0&&seg.nx<=14&&seg.ny>=0&&seg.ny<=14)
    positions.set(seg.nx+','+seg.ny,[seg.nx,seg.ny]);
  }
  const original=parts[index];
  positions.set(original.x+','+original.y,[original.x,original.y]);
  // A movable filter can be parked off the current beam, legitimately
  // unblocking the route without introducing any new interaction.
  for(const [x,y] of [[0,0],[14,14],[0,14],[14,0],[7,14]]){
   positions.set(x+','+y,[x,y]);
  }
  return [...positions.values()].filter(([x,y])=>!occupied.has(x+','+y));
 }
 function explore(depth,priorResult){
  if(exhausted||found)return;
  if(checks>=maxChecks){exhausted=true;return}
  const index=moveIndexes[depth];
  const p=parts[index];
  for(const [x,y] of candidateCells(priorResult,index)){
   const id=x+','+y;
   occupied.add(id);
   for(let rot=0;rot<8;rot++){
    Object.assign(p,{x,y,rot,inTray:false});
    const result=trace(parts);checks++;
    if(result.won&&!result.truncated&&!result.unsupported.length){
     found=[...current,{index,x,y,rot}];break;
    }
    if(depth+1<moveIndexes.length&&checks<maxChecks){
     current.push({index,x,y,rot});
     explore(depth+1,result);
     current.pop();
    }
    if(exhausted||found||checks>=maxChecks)break;
   }
   p.inTray=true;occupied.delete(id);
   if(found||exhausted||checks>=maxChecks)break;
  }
  if(checks>=maxChecks&&!found)exhausted=true;
 }
 if(moveIndexes.length)explore(0,fixed);
 if(found){
  const verify=verifyPuzzleSolution(parsed,found);
  if(!verify.valid)throw new Error('Internal solver verification failed');
  return {status:'solved',solution:found,checks,method:'bounded-ray-search'};
 }
 return {status:exhausted?'budget':'unsolved',solution:null,checks};
}
