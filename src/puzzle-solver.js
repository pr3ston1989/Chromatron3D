import {trace,movable} from './optics.js';
import {validateLevels} from './levels.js';

/** Puzzle solutions are piece-indexed and validated by the SAME engine used
 * for gameplay; a guessed layout is never presented as a verified answer. */
export function createPuzzlePieces(level){
 return level.pieces.map(([type,x,y,rot,color],index)=>({
  id:index+1,type,x,y,rot,color,sourceGame:level.sourceGame,inTray:movable.has(type)
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
 * Bounded search for original and custom puzzles (up to 4 movable optics).
 * The ray path identifies candidate placement cells, pruning the entire
 * 15×15 board. Intended to run in a Web Worker, not on the render thread.
 *
 * Strategies for scaling beyond 2 movables:
 * - Beam-adjacent candidate cells (on-beam + Manhattan-1 neighbours)
 * - Target-proximity widening: try near-target cells first, expand if needed
 * - Early pruning: skip placements that block previously-lit targets
 *
 * No claims of solving all original 200 levels: tangler and special cases
 * require exact physics and more advanced constraint search.
 */
export function solvePuzzle(level,{maxChecks=80000,maxMovables=4}={}){
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
 // Collect target positions for proximity-guided search
 const targets=parts.filter(p=>p.type==='target');
 let checks=0,exhausted=false,found=null;
 const occupied=new Set(parts.filter(p=>!p.inTray).map(p=>p.x+','+p.y));
 const current=[];
 /** Beam-adjacent candidate cells: every cell touched by the current beam
  * plus Manhattan-distance-1 neighbours, the piece's original position and
  * a few corner parking spots for filters that need to leave the beam. */
 function candidateCells(previousResult,index,nearOnly){
  const positions=new Map();
  for(const seg of previousResult.segments){
   for(const [sx,sy] of [[seg.x,seg.y],[seg.nx,seg.ny]]){
    if(sx<0||sx>14||sy<0||sy>14)continue;
    positions.set(sx+','+sy,[sx,sy]);
    // Manhattan-1 neighbours cover interception points one cell off the beam
    for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
     const ax=sx+dx,ay=sy+dy;
     if(ax>=0&&ax<=14&&ay>=0&&ay<=14)
      positions.set(ax+','+ay,[ax,ay]);
    }
   }
  }
  const original=parts[index];
  positions.set(original.x+','+original.y,[original.x,original.y]);
  // Parking spots for movable filters/optics that need to leave the beam
  for(const [x,y] of [[0,0],[14,14],[0,14],[14,0],[7,14]]){
   positions.set(x+','+y,[x,y]);
  }
  let cells=[...positions.values()].filter(([x,y])=>!occupied.has(x+','+y));
  // Target-proximity widening: in the first pass, prefer cells within
  // distance 5 of any target. This dramatically prunes the search space
  // for 3-4 movable puzzles where optics interact near receivers.
  if(nearOnly&&targets.length){
   const near=cells.filter(([x,y])=>
    targets.some(t=>Math.abs(t.x-x)+Math.abs(t.y-y)<=5));
   if(near.length>0)cells=near;
  }
  return cells;
 }
 /** Count how many targets receive their exact required color. */
 function litTargetCount(result){
  let count=0;
  for(const t of targets){
   if((result.received.get(t.id)||0)===t.color)count++;
  }
  return count;
 }
 const baselineLit=litTargetCount(fixed);
 function explore(depth,priorResult,nearOnly){
  if(exhausted||found)return;
  if(checks>=maxChecks){exhausted=true;return}
  const index=moveIndexes[depth];
  const p=parts[index];
  for(const [x,y] of candidateCells(priorResult,index,nearOnly)){
   const id=x+','+y;
   occupied.add(id);
   for(let rot=0;rot<8;rot++){
    Object.assign(p,{x,y,rot,inTray:false});
    const result=trace(parts);checks++;
    if(result.won&&!result.truncated&&!result.unsupported.length){
     found=[...current,{index,x,y,rot}];break;
    }
    // Early pruning: if this placement blocks a target that was lit before
    // any movables were placed, it is very unlikely to lead to a solution.
    // Skip deeper exploration in that case.
    if(depth+1<moveIndexes.length&&checks<maxChecks){
     const currentLit=litTargetCount(result);
     // Only prune when we have 3+ movables and lit count dropped below
     // the fixed baseline minus the number of remaining pieces to place.
     // This allows temporary disruption when more pieces will compensate.
     const remaining=moveIndexes.length-depth-1;
     if(moveIndexes.length>=3&&currentLit<baselineLit-remaining){
      // skip — this placement disrupted too many targets
     }else{
      current.push({index,x,y,rot});
      explore(depth+1,result,nearOnly);
      current.pop();
     }
    }
    if(exhausted||found||checks>=maxChecks)break;
   }
   p.inTray=true;occupied.delete(id);
   if(found||exhausted||checks>=maxChecks)break;
  }
  if(checks>=maxChecks&&!found)exhausted=true;
 }
 if(moveIndexes.length){
  // Two-pass iterative widening: first try near-target cells only,
  // then fall back to full beam-adjacent search if that fails.
  explore(0,fixed,true);
  if(!found&&!exhausted){
   explore(0,fixed,false);
  }
 }
 if(found){
  const verify=verifyPuzzleSolution(parsed,found);
  if(!verify.valid)throw new Error('Internal solver verification failed');
  return {status:'solved',solution:found,checks,method:'bounded-ray-search'};
 }
 return {status:exhausted?'budget':'unsolved',solution:null,checks};
}
