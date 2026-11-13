// Family builders for the expert campaign. Every generated puzzle carries a
// concrete solution and is later hardened against one-optic-shorter layouts.
import {DX,DY} from '../../src/optics.js';
import {id,inB,wrap,pick,shuffle,sample,rng,protectedPath} from './core.mjs';
import {trace} from '../../src/optics.js';
import {solveResult,toPieces,harden} from './core.mjs';
export {solveResult,toPieces};

export const mirrorRot=(inDir,outDir)=>{
 for(let rot=0;rot<8;rot++){
  const rel=wrap(inDir-rot);
  if(rel>=1&&rel<=3&&wrap(rot-rel)===wrap(outDir))return rot;
 }
 return null;
};
export const benderRot=(inDir,outDir)=>{
 for(let rot=0;rot<8;rot++){
  const rel=wrap(inDir-rot);
  if(rel>=0&&rel<=3&&wrap(rot-rel-1)===wrap(outDir))return rot;
 }
 return null;
};
export const mirrorOut=inDir=>{
 const out=[];
 for(let rot=0;rot<8;rot++){const rel=wrap(inDir-rot);if(rel>=1&&rel<=3)out.push({rot,out:wrap(rot-rel)});}
 return out;
};
export const benderOut=inDir=>{
 const out=[];
 for(let rot=0;rot<8;rot++){const rel=wrap(inDir-rot);if(rel>=0&&rel<=3)out.push({rot,out:wrap(rot-rel-1)});}
 return out;
};
export const shiftForward=mask=>((mask&1)?2:0)|((mask&2)?4:0)|((mask&4)?1:0);
export const shiftBackward=mask=>((mask&1)?4:0)|((mask&2)?1:0)|((mask&4)?2:0);

export function baffleWall(draft,laser,dist=2){
 const x=laser.x+DX[laser.d]*dist,y=laser.y+DY[laser.d]*dist;
 if(!inB(x,y))return null;
 const occupied=draft.pieces.some(p=>p[1]===x&&p[2]===y);
 if(occupied)return null;
 draft.fixed('wall',x,y,0,0);
 return [x,y];
}

export function rayToEdge(from,d){
 const cells=[];
 let x=from.x+DX[d],y=from.y+DY[d];
 while(inB(x,y)){cells.push([x,y]);x+=DX[d];y+=DY[d];}
 return cells;
}
export function ray(from,d,len){
 const cells=[];
 for(let i=1;i<=len;i++){
  const x=from.x+DX[d]*i,y=from.y+DY[d]*i;
  if(!inB(x,y))return null;
  cells.push([x,y]);
 }
 return cells;
}
const edges=[
 {x:[1,2,3,4],y:[1,13],d:2},{x:[10,11,12,13],y:[1,13],d:6},
 {x:[1,13],y:[1,2,3,4],d:4},{x:[1,13],y:[10,11,12,13],d:0}
];
export function randomLaser(r,color=null){
 const side=pick(r,edges);
 return {x:pick(r,side.x),y:pick(r,side.y),d:side.d,color:color??(1<<Math.floor(r()*3))};
}
/** Walk `turns` turns from a beam origin. No target yet. */
export function walkTurns(r,{start,turns,turnKinds=['mirror'],minRun=2,maxRun=9,firstRun=null,path=new Set(),nodeBudget=6000}={}){
 let nodes=0;
 const startPath=new Set(path);startPath.add(id(start.x,start.y));
 function extend(pos,d,pieces,legs,seen,remaining){
  if(nodes++>nodeBudget)return null;
  if(remaining===0)return {pieces,legs,pos,d,path:seen};
  const kinds=shuffle(r,turnKinds);
  for(const kind of kinds){
   const opts=(kind==='bender'?benderOut(d):mirrorOut(d)).filter(o=>o.out!==wrap(d+4));
   for(const turn of shuffle(r,opts)){
    const remainingTurns=remaining;
    const lens=firstRun!==null&&remainingTurns===turns?[firstRun]:shuffle(r,Array.from({length:Math.max(1,maxRun-minRun+1)},(_,j)=>minRun+j));
    for(const len of lens){
     const cells=ray(pos,d,len);
     if(!cells)continue;
     if(cells.slice(0,-1).some(([x,y])=>seen.has(id(x,y))))continue;
     const [tx,ty]=cells[cells.length-1];
     if(seen.has(id(tx,ty)))continue;
     const next=new Set(seen);for(const [x,y] of cells)next.add(id(x,y));
     const leg={from:{x:pos.x,y:pos.y},dir:d,cells,piece:kind};
     const found=extend({x:tx,y:ty},turn.out,[...pieces,[kind,tx,ty,turn.rot,0]],[...legs,leg],next,remaining-1);
     if(found)return found;
    }
   }
  }
  return null;
 }
 return extend({x:start.x,y:start.y},start.d,[],[],startPath,turns);
}
/** Extend a walked beam to an edge target (beam exits the board there). */
export function finishToEdge(r,pos,d,path,{targetGap=null}={}){
 const cells=targetGap?ray(pos,d,targetGap):rayToEdge(pos,d);
 if(!cells||!cells.length)return null;
 if(cells.slice(0,-1).some(([x,y])=>path.has(id(x,y))))return null;
 const [tx,ty]=cells[cells.length-1];
 if(path.has(id(tx,ty)))return null;
 const next=new Set(path);for(const [x,y] of cells)next.add(id(x,y));
 return {cells,target:{x:tx,y:ty},path:next,leg:{from:{x:pos.x,y:pos.y},dir:d,cells}};
}
/** Simple container preserving solution indexes while pieces are appended. */
export class Draft{
 constructor(){this.pieces=[];this.solution=[];}
 fixed(type,x,y,rot=0,color=0){this.pieces.push([type,x,y,rot,color]);return this.pieces.length-1;}
 movable(type,x,y,rot=0,color=0){
  const index=this.fixed(type,x,y,rot,color);
  this.solution.push({index,x,y,rot});
  return index;
 }
}
export function levelFromDraft(draft,meta={}){
 return {
  pieces:draft.pieces.map(p=>[...p]),solution:draft.solution.map(s=>({...s})),
  startMovablesInTray:true,...meta
 };
}
/** Choose cells on straight legs for colour optics and report final colour. */
export function insertColourOptics(r,route,laserColor,{dopplers=0,filters=0}={}){
 const legs=route.legs.map((leg,index)=>({...leg,index}));
 const usable=legs.filter(l=>l.cells.length>=3);
 const chosenD=shuffle(r,usable).slice(0,dopplers);
 const chosenF=shuffle(r,usable.filter(l=>!chosenD.includes(l))).slice(0,filters);
 const byLeg=new Map();
 // A Doppler chain must not cancel itself. Using one common shift direction
 // also prevents a two-step target from collapsing into a one-step shortcut.
 const forward=dopplers>0?r()<.5:false;
 for(const leg of chosenD){
  const slot=Math.floor(r()*(leg.cells.length-1));
  const cell=leg.cells[slot];
  byLeg.set(leg.index,{type:'doppler',cell,rot:wrap(leg.dir-(forward?2:6)),forward,color:0});
 }
 for(const leg of chosenF){
  const slot=Math.floor(r()*(leg.cells.length-1));
  const cell=leg.cells[slot];
  byLeg.set(leg.index,{type:'filter',cell,rot:wrap(leg.dir-2),color:0});
 }
 let color=laserColor;
 const placed=[];
 for(const leg of legs){
  const spec=byLeg.get(leg.index);
  if(!spec)continue;
  if(spec.type==='doppler'){
   color=spec.forward?shiftForward(color):shiftBackward(color);
   spec.color=0;
  }else{
   // A filter must actually narrow the beam, otherwise omitting it solves the
   // puzzle trivially and the optic would be decorative.
   const options=[1,2,4,3,5,6,7].filter(c=>(c&color)&&(c&color)!==color);
   if(!options.length)return null;
   spec.color=pick(r,options);
   color=color&spec.color;
  }
  placed.push(spec);
 }
 // Two Doppler passes can cancel out and a filter could leave the emitter
 // colour untouched; either would let the level be solved without the optic.
 if((dopplers+filters)>0&&color===laserColor)return null;
 // A second Doppler must move the colour out of reach of a single module.
 if(dopplers>=2&&(color===shiftForward(laserColor)||color===shiftBackward(laserColor)))return null;
 return {color,placed};
}
export function addColourPieces(draft,placed){
 for(const spec of placed)draft.movable(spec.type,spec.cell[0],spec.cell[1],spec.rot,spec.color);
}
/** Rebuild the full piece list: laser + turn optics + colour optics + target. */
export function assembleTurnLevel(r,{
 turns=3,turnKinds=['mirror'],color=null,walls=14,dopplers=0,filters=0,
 minRun=2,maxRun=8,laser=null,baffle=true
}={}){
 for(let attempt=0;attempt<160;attempt++){
  const start=laser??randomLaser(r,color);
  const walk=walkTurns(r,{start,turns,turnKinds,minRun,maxRun,firstRun:baffle&&turns>0?1:null});
  if(!walk)continue;
  const fin=finishToEdge(r,walk.pos,walk.d,walk.path);
  if(!fin)continue;
  const route={...walk,legs:[...walk.legs,fin.leg],target:fin.target,path:fin.path};
  const colour=insertColourOptics(r,route,start.color,{dopplers,filters});
  if(!colour)continue;
  const draft=new Draft();
  draft.fixed('laser',start.x,start.y,start.d,start.color);
  if(turns>0&&baffle)baffleWall(draft,start,2);
  for(const [type,x,y,rot] of walk.pieces)draft.movable(type,x,y,rot,0);
  addColourPieces(draft,colour.placed);
  draft.fixed('target',fin.target.x,fin.target.y,0,colour.color);
  const level=levelFromDraft(draft);
  const check=solveResult(level,draft.solution);
  if(!check.won||check.truncated||check.unsupported.length)continue;
  const initial=trace(toPieces(level));
  if(initial.won)continue;
  return {level,route,family:'turn'};
 }
 return null;
}

export function targetsCompatible(targets){
 for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++){
  const a=targets[i],b=targets[j];
  const dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);
  // A single beam must never be able to visit both targets in one pass.
  if(a.x===b.x||a.y===b.y||dx===dy)return false;
 }
 return true;
}

const MOVEABLE=new Set(['mirror','bender','filter','prism','doppler','splitter','tangler']);
export const movableIndexes=level=>level.pieces.map((p,i)=>MOVEABLE.has(p[0])?i:-1).filter(i=>i>=0);
const cellsFree=(cells,used)=>cells.every(([x,y])=>!used.has(id(x,y)));

export function assembleSplitterLevel(r,{
 preTurns=1,mainTurns=1,branchTurns=1,turnKinds=['mirror'],color=null,
 walls=16,minRun=1,maxRun=7,baffle=true
}={}){
 for(let attempt=0;attempt<500;attempt++){
  const start=randomLaser(r,color);
  const pre=walkTurns(r,{start,turns:preTurns,turnKinds,minRun:2,maxRun,firstRun:baffle&&preTurns>0?1:null});
  if(!pre)continue;
  const used=new Set(pre.path);
  const candidates=[];
  for(let len=2;len<=6;len++){
   const cells=ray(pre.pos,pre.d,len);
   if(!cells)continue;
   const c=cells[cells.length-1];
   if(c[0]<2||c[0]>12||c[1]<2||c[1]>12)continue;
   if(used.has(id(c[0],c[1])))continue;
   candidates.push({cell:c,len});
  }
  for(const {cell:S,len} of shuffle(r,candidates)){
   const path=new Set(pre.path);
   {const cells=ray(pre.pos,pre.d,len);if(!cells)continue;for(const c of cells)path.add(id(c[0],c[1]));}
   for(const branchDir of shuffle(r,[wrap(pre.d-2),wrap(pre.d+2)])){
    const splitRot=branchDir===wrap(pre.d-2)?wrap(pre.d-1):wrap(pre.d-7);
    const main=walkTurns(r,{start:{x:S[0],y:S[1],d:pre.d},turns:mainTurns,turnKinds,minRun,maxRun,path});
    if(!main)continue;
    const mainEnd=finishToEdge(r,main.pos,main.d,main.path);
    if(!mainEnd)continue;
    const branch=walkTurns(r,{start:{x:S[0],y:S[1],d:branchDir},turns:branchTurns,turnKinds,minRun,maxRun,path:mainEnd.path});
    if(!branch)continue;
    const branchEnd=finishToEdge(r,branch.pos,branch.d,branch.path);
    if(!branchEnd)continue;
    if(branchEnd.target.x===mainEnd.target.x&&branchEnd.target.y===mainEnd.target.y)continue;
    if(!targetsCompatible([mainEnd.target,branchEnd.target]))continue;
    const draft=new Draft();
    draft.fixed('laser',start.x,start.y,start.d,start.color);
    if(preTurns>0&&baffle)baffleWall(draft,start,2);
    for(const [type,x,y,rot] of pre.pieces)draft.movable(type,x,y,rot,0);
    draft.movable('splitter',S[0],S[1],splitRot,0);
    for(const [type,x,y,rot] of main.pieces)draft.movable(type,x,y,rot,0);
    for(const [type,x,y,rot] of branch.pieces)draft.movable(type,x,y,rot,0);
    draft.fixed('target',mainEnd.target.x,mainEnd.target.y,0,start.color);
    draft.fixed('target',branchEnd.target.x,branchEnd.target.y,0,start.color);
    const level=levelFromDraft(draft);
    const check=solveResult(level,draft.solution);
    if(!check.won||check.truncated||check.unsupported.length)continue;
    if(trace(toPieces(level)).won)continue;
    return {level,family:'splitter',targets:[mainEnd.target,branchEnd.target]};
   }
  }
 }
 return null;
}

const PRISM_SPLIT={
 2:[{color:4,off:2},{color:2,off:3},{color:1,off:-4}],
 5:[{color:4,off:-3},{color:2,off:-4},{color:1,off:3}]
};
export function assemblePrismLevel(r,{
 preTurns=0,mirrorBudget=2,turnKinds=['mirror'],walls=16,minRun=2,maxRun=7,baffle=true
}={}){
 for(let attempt=0;attempt<600;attempt++){
  const start=randomLaser(r,7);
  const pre=walkTurns(r,{start,turns:preTurns,turnKinds,minRun,maxRun,firstRun:baffle&&preTurns>0?1:null});
  if(!pre)continue;
  const used=new Set(pre.path);
  const candidates=[];
  for(let len=2;len<=6;len++){
   const cells=ray(pre.pos,pre.d,len);
   if(!cells)continue;
   const c=cells[cells.length-1];
   const margin=preTurns>0?2:1;
   if(c[0]<margin||c[0]>14-margin||c[1]<margin||c[1]>14-margin)continue;
   if(used.has(id(c[0],c[1])))continue;
   candidates.push({cell:c,len});
  }
  for(const {cell:P,len} of shuffle(r,candidates)){
   const rel=pick(r,[2,5]);
   const prismRot=wrap(pre.d-rel);
   const path=new Set(pre.path);
   {const cells=ray(pre.pos,pre.d,len);if(!cells)continue;for(const c of cells)path.add(id(c[0],c[1]));}
   path.add(id(P[0],P[1]));
   const usedCells=new Set(path);
   const outputs=PRISM_SPLIT[rel].map(o=>({...o,dir:wrap(prismRot+o.off)}));
   if(new Set(outputs.map(o=>o.dir)).size!==3)continue;
   if(outputs.some(o=>rayToEdge({x:P[0],y:P[1]},o.dir).length<1))continue;
   const targets=[];const mirrors=[];let ok=true;
   for(const out of shuffle(r,outputs)){
    const rayCells=rayToEdge({x:P[0],y:P[1]},out.dir);
    const freeRay=rayCells.every(([x,y])=>!usedCells.has(id(x,y)));
    if(!freeRay){ok=false;break;}
    let done=false;
    if(mirrorBudget>mirrors.length&&rayCells.length>=3&&r()<.8){
     for(const slot of shuffle(r,Array.from({length:rayCells.length-2},(_,j)=>j))){
      const M=rayCells[slot];
      for(const td of shuffle(r,[wrap(out.dir-2),wrap(out.dir+2)])){
       const after=rayToEdge({x:M[0],y:M[1]},td);
       if(!after.length)continue;
       if(!cellsFree([M,...after],usedCells))continue;
       const rot=mirrorRot(out.dir,td);
       if(rot===null)continue;
       mirrors.push({x:M[0],y:M[1],rot});
       for(const [x,y] of [M,...after])usedCells.add(id(x,y));
       const t=after[after.length-1];
       targets.push({x:t[0],y:t[1],color:out.color});
       done=true;break;
      }
      if(done)break;
     }
    }
    if(!done){
     for(const [x,y] of rayCells)usedCells.add(id(x,y));
     const t=rayCells[rayCells.length-1];
     targets.push({x:t[0],y:t[1],color:out.color});
    }
   }
   if(!ok||targets.length!==3)continue;
   if(!targetsCompatible(targets))continue;
   const draft=new Draft();
   draft.fixed('laser',start.x,start.y,start.d,7);
   if(preTurns>0&&baffle)baffleWall(draft,start,2);
   for(const [type,x,y,rot] of pre.pieces)draft.movable(type,x,y,rot,0);
   draft.movable('prism',P[0],P[1],prismRot,0);
   for(const m of mirrors)draft.movable('mirror',m.x,m.y,m.rot,0);
   for(const t of targets)draft.fixed('target',t.x,t.y,0,t.color);
   const level=levelFromDraft(draft);
   const check=solveResult(level,draft.solution);
   if(!check.won||check.truncated||check.unsupported.length)continue;
   if(trace(toPieces(level)).won)continue;
   return {level,family:'prism',targets};
  }
 }
 return null;
}

export function assembleTanglerLevel(r,{
 preTurns=0,legs=[1,1],turnKinds=['mirror'],color=null,walls=16,minRun=1,maxRun=7,baffle=true
}={}){
 for(let attempt=0;attempt<600;attempt++){
  const start=randomLaser(r,color);
  const pre=walkTurns(r,{start,turns:preTurns,turnKinds,minRun:2,maxRun,firstRun:baffle&&preTurns>0?1:null});
  if(!pre)continue;
  const used=new Set(pre.path);
  const candidates=[];
  for(let len=2;len<=6;len++){
   const cells=ray(pre.pos,pre.d,len);
   if(!cells)continue;
   const c=cells[cells.length-1];
   if(c[0]<2||c[0]>12||c[1]<2||c[1]>12)continue;
   if(used.has(id(c[0],c[1])))continue;
   candidates.push({cell:c,len});
  }
  for(const {cell:T,len} of shuffle(r,candidates)){
   const path=new Set(pre.path);
   {const cells=ray(pre.pos,pre.d,len);if(!cells)continue;for(const c of cells)path.add(id(c[0],c[1]));}
   path.add(id(T[0],T[1]));
   const tanglerRot=wrap(pre.d-2);
   const outDirs=[tanglerRot,wrap(tanglerRot+4)];
   if(outDirs.some(d=>rayToEdge({x:T[0],y:T[1]},d).length<2))continue;
   let cursor=new Set(path);
   const routePieces=[];const targets=[];let ok=true;
   for(let i=0;i<2;i++){
    const w=walkTurns(r,{start:{x:T[0],y:T[1],d:outDirs[i]},turns:legs[i],turnKinds,minRun,maxRun,path:cursor});
    if(!w){ok=false;break;}
    const fin=finishToEdge(r,w.pos,w.d,w.path);
    if(!fin){ok=false;break;}
    cursor=new Set(fin.path);cursor.add(id(T[0],T[1]));
    routePieces.push(...w.pieces);
    targets.push(fin.target);
   }
   if(!ok||targets.length!==2)continue;
   if(!targetsCompatible(targets))continue;
   const draft=new Draft();
   draft.fixed('laser',start.x,start.y,start.d,start.color);
   if(preTurns>0&&baffle)baffleWall(draft,start,2);
   for(const [type,x,y,rot] of pre.pieces)draft.movable(type,x,y,rot,0);
   draft.movable('tangler',T[0],T[1],tanglerRot,0);
   for(const [type,x,y,rot] of routePieces)draft.movable(type,x,y,rot,0);
   for(const t of targets)draft.fixed('target',t.x,t.y,0,start.color);
   const level=levelFromDraft(draft);
   const check=solveResult(level,draft.solution);
   if(!check.won||check.truncated||check.unsupported.length)continue;
   if(trace(toPieces(level)).won)continue;
   return {level,family:'tangler',targets};
  }
 }
 return null;
}

export function assembleTeleporterLevel(r,{
 turns=3,turnKinds=['mirror'],color=null,walls=16,minRun=2,maxRun=7
}={}){
 for(let attempt=0;attempt<320;attempt++){
  const start=randomLaser(r,color);
  const cellsA=rayToEdge(start,start.d);
  if(cellsA.length<5)continue;
  const a=1+Math.floor(r()*Math.min(3,cellsA.length-3));
  const A=cellsA[a-1];
  const maxB=cellsA.length-1;
  const b=a+2+Math.floor(r()*Math.max(1,maxB-a-1));
  if(b>=cellsA.length)continue;
  const B=cellsA[b];
  const prePath=new Set([id(start.x,start.y)]);
  for(let i=0;i<b;i++)prePath.add(id(cellsA[i][0],cellsA[i][1]));
  const w=walkTurns(r,{start:{x:B[0],y:B[1],d:start.d},turns,turnKinds,minRun,maxRun,path:prePath});
  if(!w)continue;
  const fin=finishToEdge(r,w.pos,w.d,w.path);
  if(!fin)continue;
  const draft=new Draft();
  draft.fixed('laser',start.x,start.y,start.d,start.color);
  draft.fixed('teleporter',A[0],A[1],0,0);
  draft.fixed('teleporter',B[0],B[1],0,0);
  for(const [type,x,y,rot] of w.pieces)draft.movable(type,x,y,rot,0);
  draft.fixed('target',fin.target.x,fin.target.y,0,start.color);
  const level=levelFromDraft(draft);
  const check=solveResult(level,draft.solution);
  if(!check.won||check.truncated||check.unsupported.length)continue;
  if(trace(toPieces(level)).won)continue;
  return {level,family:'teleporter',targets:[fin.target]};
 }
 return null;
}

/** Walk backwards from a fixed target so several lasers can share it. */
export function backwardRoute(r,target,incomingDir,{turns,turnKinds,path,minRun=2,maxRun=7}){
 const back=walkTurns(r,{start:{x:target.x,y:target.y,d:wrap(incomingDir+4)},turns,turnKinds,minRun,maxRun,path});
 if(!back)return null;
 const cells=rayToEdge(back.pos,back.d);
 if(!cells||!cells.length)return null;
 let seen=new Set(back.path);
 if(cells.slice(0,-1).some(([x,y])=>seen.has(id(x,y))))return null;
 const laserCell=cells[cells.length-1];
 const laserDir=wrap(back.d+4);
 for(const [x,y] of cells)seen.add(id(x,y));
 return {pieces:back.pieces,path:seen,laser:{x:laserCell[0],y:laserCell[1],d:laserDir},mid:cells};
}
export function assembleAdditiveLevel(r,{
 pair=[1,2],turns=[2,2],turnKinds=['mirror'],walls=18,minRun=2,maxRun=7
}={}){
 for(let attempt=0;attempt<400;attempt++){
  const target={x:3+Math.floor(r()*9),y:3+Math.floor(r()*9)};
  const used=new Set([id(target.x,target.y)]);
  const routes=[];let ok=true;
  const dirs=shuffle(r,[0,1,2,3,4,5,6,7]);
  for(let i=0;i<2;i++){
   const incoming=dirs[i];
   const back=backwardRoute(r,target,incoming,{turns:turns[i],turnKinds,path:used,minRun,maxRun});
   if(!back){ok=false;break;}
   if(back.laser.x===target.x&&back.laser.y===target.y){ok=false;break;}
   used.clear?null:null;
   for(const key of back.path)used.add(key);
   used.add(id(target.x,target.y));
   for(const piece of back.pieces)used.add(id(piece[1],piece[2]));
   used.add(id(back.laser.x,back.laser.y));
   routes.push({...back,incoming,color:pair[i]});
  }
  if(!ok||routes.length!==2)continue;
  // beams leaving the shared target must be absorbed immediately, otherwise
  // they could reach the other route's optics with an unintended colour.
  const stops=[];
  for(const route of routes){
   const x=target.x+DX[route.incoming],y=target.y+DY[route.incoming];
   if(!inB(x,y)||used.has(id(x,y)))continue;
   stops.push([x,y]);used.add(id(x,y));
  }
  const draft=new Draft();
  for(const route of routes)draft.fixed('laser',route.laser.x,route.laser.y,route.laser.d,route.color);
  for(const [x,y] of stops)draft.fixed('wall',x,y,0,0);
  for(const route of routes)for(const [type,x,y,rot] of route.pieces)draft.movable(type,x,y,rot,0);
  draft.fixed('target',target.x,target.y,0,pair[0]|pair[1]);
  const level=levelFromDraft(draft);
  const check=solveResult(level,draft.solution);
  if(!check.won||check.truncated||check.unsupported.length)continue;
  if(trace(toPieces(level)).won)continue;
  return {level,family:'additive',target:{...target,color:pair[0]|pair[1]}};
 }
 return null;
}

export function assembleTwinLevel(r,{
 turns=[2,2],turnKinds=['mirror'],colors=[1,4],walls=16,minRun=2,maxRun=7,baffle=true
}={}){
 for(let attempt=0;attempt<500;attempt++){
  const start1=randomLaser(r,colors[0]);
  const w1=walkTurns(r,{start:start1,turns:turns[0],turnKinds,minRun,maxRun,firstRun:baffle&&turns[0]>0?1:null});
  if(!w1)continue;
  const fin1=finishToEdge(r,w1.pos,w1.d,w1.path);
  if(!fin1)continue;
  let start2=null,w2=null;
  for(let t=0;t<60&&!w2;t++){
   const candidate=randomLaser(r,colors[1]);
   if(fin1.path.has(id(candidate.x,candidate.y)))continue;
   const walk=walkTurns(r,{start:candidate,turns:turns[1],turnKinds,minRun,maxRun,path:fin1.path,firstRun:baffle&&turns[1]>0?1:null});
   if(walk){start2=candidate;w2=walk;}
  }
  if(!w2)continue;
  const fin2=finishToEdge(r,w2.pos,w2.d,w2.path);
  if(!fin2)continue;
  if(!targetsCompatible([fin1.target,fin2.target]))continue;
  const draft=new Draft();
  draft.fixed('laser',start1.x,start1.y,start1.d,start1.color);
  const b1=baffle?baffleWall(draft,start1,2):null;
  if(b1&&(fin1.path.has(id(b1[0],b1[1]))||fin2.path.has(id(b1[0],b1[1]))))draft.pieces.pop();
  for(const [type,x,y,rot] of w1.pieces)draft.movable(type,x,y,rot,0);
  draft.fixed('target',fin1.target.x,fin1.target.y,0,start1.color);
  draft.fixed('laser',start2.x,start2.y,start2.d,start2.color);
  const b2=baffle?baffleWall(draft,start2,2):null;
  if(b2&&(fin1.path.has(id(b2[0],b2[1]))||fin2.path.has(id(b2[0],b2[1]))))draft.pieces.pop();
  for(const [type,x,y,rot] of w2.pieces)draft.movable(type,x,y,rot,0);
  draft.fixed('target',fin2.target.x,fin2.target.y,0,start2.color);
  const level=levelFromDraft(draft);
  const check=solveResult(level,draft.solution);
  if(!check.won||check.truncated||check.unsupported.length)continue;
  if(trace(toPieces(level)).won)continue;
  return {level,family:'twin',targets:[fin1.target,fin2.target]};
 }
 return null;
}
/** Add original-style conduits on straight, empty beam segments. */
export function addConduits(level,solution,r,count=2){
 let added=0;
 for(let attempt=0;attempt<count*8&&added<count;attempt++){
  const res=solveResult(level,solution);
  const candidates=[];
  for(const seg of res.segments){
   if(!inB(seg.x,seg.y)||!inB(seg.nx,seg.ny))continue;
   if(level.pieces.some(p=>p[1]===seg.x&&p[2]===seg.y))continue;
   const dx=seg.nx-seg.x,dy=seg.ny-seg.y;
   const dir=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]
    .findIndex(([ex,ey])=>ex===dx&&ey===dy);
   if(dir<0)continue;
   candidates.push({x:seg.x,y:seg.y,dir});
  }
  if(!candidates.length)break;
  const pickCell=pick(r,candidates);
  level.pieces.push(['conduit',pickCell.x,pickCell.y,pickCell.dir,0]);
  if(!solveResult(level,solution).won)level.pieces.pop();
  else added++;
 }
 return added;
}
/** Scatter decorative/structural walls away from every authored beam cell. */
export function addRandomWalls(level,solution,r,count,{protectedCells=null}={}){
 const protectedSet=protectedCells??protectedPath(level,solution);
 const free=[];
 for(let y=0;y<15;y++)for(let x=0;x<15;x++){
  const key=id(x,y);
  if(protectedSet.has(key))continue;
  if(level.pieces.some(p=>p[1]===x&&p[2]===y&&p[0]!=='wall'))continue;
  free.push([x,y]);
 }
 const chosen=shuffle(r,free).slice(0,count);
 for(const [x,y] of chosen)level.pieces.push(['wall',x,y,0,0]);
 return chosen.length;
}
