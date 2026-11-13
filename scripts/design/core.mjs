// Design-time optics laboratory. No browser code imports this module.
// It assembles candidate puzzles, verifies authored solutions with the real
// game engine and searches for unintended shortcuts.
import {trace,movable,DX,DY} from '../../src/optics.js';

export const MOVEABLE=new Set(['mirror','bender','filter','prism','doppler','splitter','tangler']);
export const id=(x,y)=>x+','+y;
export const inB=(x,y)=>x>=0&&y>=0&&x<15&&y<15;
export const wrap=n=>((n%8)+8)%8;
export const DIRS=[0,1,2,3,4,5,6,7];
export const opposite=d=>wrap(d+4);

export function rng(seed){
 let s=seed>>>0;
 return ()=>{
  s=(s+0x6D2B79F5)>>>0;
  let t=Math.imul(s^(s>>>15),1|s);
  t=(t+Math.imul(t^(t>>>7),61|t))^t;
  return ((t^(t>>>14))>>>0)/4294967296;
 };
}
export const pick=(r,arr)=>arr[Math.floor(r()*arr.length)];
export function shuffle(r,arr){
 const a=[...arr];
 for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
 return a;
}
export function sample(r,arr,n){return shuffle(r,arr).slice(0,n);}
export function toPieces(level){
 return level.pieces.map(([type,x,y,rot,color],index)=>({
  id:index+1,type,x,y,rot,color,
  inTray:Boolean(level.startMovablesInTray&&movable.has(type))
 }));
}
export function solutionPieces(level,solution){
 const parts=toPieces(level);
 for(const move of solution){
  const p=parts[move.index];
  if(!p)throw new Error('bad solution index '+move.index);
  Object.assign(p,{x:move.x,y:move.y,rot:move.rot,inTray:false});
 }
 return parts;
}
export function solveResult(level,solution){return trace(solutionPieces(level,solution));}
export function protectedPath(level,solution){
 const cells=new Set();
 for(const [type,x,y] of level.pieces)cells.add(id(x,y));
 const res=solveResult(level,solution);
 for(const s of res.segments){cells.add(id(s.x,s.y));cells.add(id(s.nx,s.ny));}
 for(const b of res.boundaryHits)cells.add(id(b.x,b.y));
 return cells;
}

function beamCells(result){
 const cells=new Set();
 for(const s of result.segments){cells.add(id(s.x,s.y));cells.add(id(s.nx,s.ny));}
 for(const b of result.boundaryHits)cells.add(id(b.x,b.y));
 return [...cells].filter(key=>{
  const [x,y]=key.split(',').map(Number);return inB(x,y);
 }).map(key=>key.split(',').map(Number));
}
function permutations(arr){
 if(arr.length<=1)return [arr];
 const out=[];
 for(let i=0;i<arr.length;i++){
  const rest=[...arr.slice(0,i),...arr.slice(i+1)];
  for(const p of permutations(rest))out.push([arr[i],...p]);
 }
 return out;
}
/**
 * Beam-guided search over placements of `allowed` movable optics.
 * Completeness argument: in any winning layout the optics can be ordered along
 * the beam; when the first k are placed, the (k+1)-th one lies on the partial
 * beam, because unplaced optics sit in the tray and cannot block it.
 */
export function findSolution(level,allowedIndexes,{
 maxChecks=250000,maxOrders=24,random=null,startInTray=true
}={}){
 const base=toPieces(level);
 if(!startInTray)for(const i of allowedIndexes)base[i].inTray=false;
 const allowed=[...allowedIndexes];
 const fixedWon=trace(base);
 if(fixedWon.won&&fixedWon.active===fixedWon.total)return {status:'solved',solution:[],checks:1,trivial:true};
 if(!allowed.length)return {status:'unsolved',checks:1,solution:null};
 let orders=allowed.length<=4?permutations(allowed):null;
 if(!orders){
  orders=[];
  for(let i=0;i<12;i++){
   const a=[...allowed];
   if(random)for(let j=a.length-1;j>0;j--){const k=Math.floor(random()*(j+1));[a[j],a[k]]=[a[k],a[j]];}
   orders.push(a);
  }
 }
 orders=orders.slice(0,maxOrders);
 let checks=0,exhausted=false,found=null,usedOrder=null;
 for(const order of orders){
  if(found||checks>=maxChecks)break;
  for(const i of allowed)base[i].inTray=true;
  const moves=[];
  const dfs=()=>{
   if(found||checks>=maxChecks)return;
   const res=trace(base);checks++;
   if(res.won&&!res.truncated&&!res.unsupported.length){found=moves.slice();usedOrder=order;return;}
   if(moves.length===order.length)return;
   const index=order[moves.length];
   const occupied=new Set(base.filter(p=>!p.inTray).map(p=>id(p.x,p.y)));
   const cells=beamCells(res).filter(([x,y])=>!occupied.has(id(x,y)));
   const p=base[index];
   const old={x:p.x,y:p.y,rot:p.rot,inTray:p.inTray};
   for(const [x,y] of cells){
    Object.assign(p,{x,y,inTray:false});
    for(let rot=0;rot<8;rot++){
     p.rot=rot;
     const after=trace(base);checks++;
     if(after.won&&!after.truncated&&!after.unsupported.length){
      moves.push({index,x,y,rot});found=moves.slice();break;
     }
     if(checks<maxChecks){moves.push({index,x,y,rot});dfs();moves.pop();}
     if(found||checks>=maxChecks)break;
    }
    Object.assign(p,old);
    if(playerFound(found)||checks>=maxChecks)break;
   }
  };
  const playerFound=f=>Boolean(f);
  dfs();
  if(found)break;
 }
 if(found)return {status:'solved',solution:found,checks,order:usedOrder};
 return {status:checks>=maxChecks?'budget':'unsolved',checks};
}
/**
 * Block every winning layout that omits one optic with a wall on a cell the
 * shortcut needs. Walls are never placed on the authored route. Returns the
 * number of necessary walls, or a failure reason.
 */
export function checkShortcuts(level,movableIdx,{maxChecks=120000,maxOrders=64,random=null}={}){
 const out=[];
 for(const drop of movableIdx){
  const s=findSolution(level,movableIdx.filter(i=>i!==drop),{maxChecks,maxOrders,random});
  if(s.status==='solved'&&s.solution.length)out.push({drop,...s});
 }
 return out;
}
/**
 * Block every winning layout that omits one optic with a wall on a cell the
 * shortcut needs. Walls are never placed on the authored route. Returns the
 * number of necessary walls, or a failure reason.
 */
export function harden(level,solution,movableIdx,{
 maxWalls=40,maxRounds=140,checkBudget=120000,finalBudget=300000,maxOrders=64,seed=1,verbose=false
}={}){
 const r=rng(seed);
 const protectedCells=protectedPath(level,solution);
 const wallSet=new Set();
 const wallCells=[];
 let rounds=0;
 const blockShortcut=(shortcut)=>{
  const candidates=[];
  for(const move of shortcut.solution)if(!protectedCells.has(id(move.x,move.y)))candidates.push([move.x,move.y]);
  if(!candidates.length){
   const res=solveResult(level,solution);
   for(const seg of res.segments)for(const [x,y] of [[seg.x,seg.y],[seg.nx,seg.ny]])
    if(!protectedCells.has(id(x,y)))candidates.push([x,y]);
  }
  const free=candidates.filter(([x,y])=>{
   const key=id(x,y);
   if(wallSet.has(key)||protectedCells.has(key))return false;
   return !level.pieces.some(p=>p[1]===x&&p[2]===y);
  });
  if(!free.length)return false;
  const chosen=pick(r,free);
  level.pieces.push(['wall',chosen[0],chosen[1],0,0]);
  wallSet.add(id(chosen[0],chosen[1]));wallCells.push(chosen);
  if(verbose)console.log('   block',shortcut.drop,'->',chosen);
  return solveResult(level,solution).won;
 };
 while(rounds++<maxRounds){
  const bad=checkShortcuts(level,movableIdx,{maxChecks:checkBudget,maxOrders,random:r});
  if(!bad.length){
   // Confirm with the stronger final search before declaring success.
   const finalBad=checkShortcuts(level,movableIdx,{maxChecks:finalBudget,maxOrders,random:r});
   if(!finalBad.length)return {ok:true,wallCells,rounds};
   for(const shortcut of finalBad.slice(0,4)){
    if(wallCells.length>=maxWalls)return {ok:false,reason:'wall budget',walls:wallCells.length,rounds};
    if(!blockShortcut(shortcut))return {ok:false,reason:'cannot block final shortcut',walls:wallCells.length,rounds};
   }
   continue;
  }
  for(const shortcut of bad.slice(0,4)){
   if(wallCells.length>=maxWalls)return {ok:false,reason:'wall budget',walls:wallCells.length,rounds};
   if(!blockShortcut(shortcut))return {ok:false,reason:'nothing to block',walls:wallCells.length,rounds};
  }
 }
 return {ok:false,reason:'round budget',walls:wallCells.length,rounds};
}
export function validateCandidate(level,solution){
 const res=solveResult(level,solution);
 const empty=trace(toPieces(level));
 return {
  won:res.won&&!res.truncated,truncated:res.truncated,unsupported:res.unsupported,
  active:res.active,total:res.total,segments:res.segments.length,
  startsSolved:empty.won,colors:[...res.received.entries()].map(([k,v])=>v)
 };
}
