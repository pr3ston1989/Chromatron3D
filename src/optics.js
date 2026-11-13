/**
 * Renderer-independent 15x15 Chromatron ray tracer.
 *
 * 8 compass directions, RGB channel bitmasks (R=1, G=2, B=4), reflective
 * optics, prisms, Doppler shifts and paired quantum tangler rays.
 *
 * The tangler/Doppler interaction follows the layered beam-queue behaviour
 * documented by the original-game reverse engineering in
 * https://github.com/stared/chromatron-oxide/blob/main/src/beam.rs
 *
 * The engine intentionally does NOT claim pixel-perfect compatibility with
 * all four original games. Original data uses opposite red/blue bit positions,
 * converted by classic-import.js. Source 1..4 and 200-stage verification are
 * tracked separately in docs/CLASSIC_COMPATIBILITY.md.
 */
export const DX=Object.freeze([0,1,1,1,0,-1,-1,-1]);
export const DY=Object.freeze([-1,-1,0,1,1,1,0,-1]);
export const COLORS=Object.freeze(['#000000','#ff3b62','#6afba1','#ffe778','#6399ff','#ed65ff','#5ff8ef','#ffffff']);
export const movable=new Set(['mirror','bender','filter','prism','doppler','splitter','tangler',
 'multiFilter','complementor','logicGate','mobileTeleporter','dualReflector','quadBender','primaryLogicGate']);
const wrap=n=>(n+16)%8, inBounds=(x,y)=>x>=0&&y>=0&&x<15&&y<15, id=(x,y)=>x+','+y;
const port=(p,d)=>(p.y*15+p.x)*8+wrap(d);
const shiftForward=mask=>((mask&1)?2:0)|((mask&2)?4:0)|((mask&4)?1:0); // R -> G -> B -> R
const shiftBackward=mask=>((mask&1)?4:0)|((mask&2)?1:0)|((mask&4)?2:0); // R -> B -> G -> R
const MAX_BEAM_STEPS=16384;
const MAX_BEAM_LAYERS=1024;

/**
 * Each entangled ray carries a pair ID. A Doppler that touches one partner
 * shifts both: the beam crossing in relative direction 2 shifts forward,
 * while its twin simultaneously shifts backward; direction 6 reverses it.
 * We resolve all pair shifts AFTER propagating each wavefront, as in the
 * original's alternating beam queues. A per-wavefront visited cache prevents
 * impossible infinite reflection loops without dropping new colors.
 */
export function trace(allPieces){
 const pieces=allPieces.filter(p=>!p.inTray&&inBounds(p.x,p.y));
 const map=new Map(pieces.map(p=>[id(p.x,p.y),p]));
 const segments=[],boundaryHits=[],received=new Map(),unsupported=new Set(),visited=new Set();
 const game=allPieces[0]?.sourceGame;
 const byCell=(a,b)=>a.y-b.y||a.x-b.x;
 const gates=pieces.filter(p=>p.type==='logicGate'||p.type==='primaryLogicGate').sort(byCell);
 const complements=pieces.filter(p=>p.type==='complementor').sort(byCell);
 const inputs=gates.length||complements.length?new Uint8Array(225*8):null;
 const gateOutputs=new Map(),disabled=new Set();
 let steps=0,entangleCounter=0,truncated=false;
 function propagate(p,dir,color){
 let queue=[{x:p.x,y:p.y,dir,color,eid:0}],layer=0;
 while(queue.length&&steps<MAX_BEAM_STEPS&&layer++<MAX_BEAM_LAYERS){
  const next=[];
  for(const b of queue){
   if(steps>=MAX_BEAM_STEPS)break;
   steps++;
   if(!b.color)continue;
   const state=`${b.x}:${b.y}:${b.dir}:${b.color}:${b.eid}`;
   // A linked ray may revisit this port while its partner is at a different Doppler.
   if(!b.eid&&visited.has(state))continue;
   if(!b.eid)visited.add(state);
   const nx=b.x+DX[b.dir],ny=b.y+DY[b.dir];
   if(!inBounds(nx,ny)){
    // Rays travel all the way to the physical absorber face, halfway
    // beyond the last cell center. This is visual metadata only: the
    // 15x15 logical trace and target/optics interactions stay unchanged.
    boundaryHits.push({x:b.x,y:b.y,
     nx:b.x+DX[b.dir]*.5,ny:b.y+DY[b.dir]*.5,
     color:b.color,boundary:true});
    continue;
   }
   segments.push({x:b.x,y:b.y,nx,ny,color:b.color});
   const p=map.get(id(nx,ny));
   if(!p){next.push({...b,x:nx,y:ny});continue}
   if(inputs)inputs[port(p,b.dir)]|=b.color;
   const rel=wrap(b.dir-p.rot);
   const emit=(dir,color=b.color,eid=b.eid,x=nx,y=ny)=>{
    if(color)next.push({x,y,dir:wrap(dir),color:color&7,eid});
   };
   switch(p.type){
    case 'complementor':case 'logicGate':case 'primaryLogicGate':
    case 'wall':case 'laser':break;
    case 'occupiedSquare':emit(b.dir);break;
    case 'twister':emit(b.dir-2);break;
    case 'multiFilter':emit(b.dir,b.color & [4,2,1,7][rel%4]);break;
    case 'dualReflector':if(rel%4!==0)emit(p.rot-rel);break;
    case 'quadBender':emit(p.rot-rel-1);break;
    case 'starburst':
     for(let d=1-(b.dir%2);d<8;d+=2)emit(d,b.color,0);
     break;
    case 'target':
     received.set(p.id,(received.get(p.id)||0)|b.color);
     emit(b.dir);
     break;
    case 'mirror':
     if(rel>=1&&rel<=3)emit(p.rot-rel);
     break;
    case 'bender':
     if(rel>=0&&rel<=3)emit(p.rot-rel-1);
     break;
    case 'filter':
     if((rel===2||rel===6)&&(p.color&b.color))emit(b.dir,p.color&b.color);
     break;
    case 'prism':{
     const blue={1:1,2:2,5:-3,6:-2};
     const green={0:1,2:3,5:-4,7:-2};
     const red={0:-2,2:-4,5:3,7:1};
     const straight=game?1:4, bent=game?4:1;
     if(b.color&straight&&blue[rel]!==undefined)emit(p.rot+blue[rel],straight);
     if(b.color&2&&green[rel]!==undefined)emit(p.rot+green[rel],2);
     if(b.color&bent&&red[rel]!==undefined)emit(p.rot+red[rel],bent);
     break;
    }
    case 'doppler':
     if(rel===2||rel===6){
      // For paired rays, defer both color changes to the wavefront pass.
      // Unpaired rays change color immediately, as they always have.
      const shifted=b.eid?b.color:rel===2?shiftForward(b.color):shiftBackward(b.color);
      emit(b.dir,shifted);
     }
     break;
    case 'splitter':
     if(rel===0||rel===4)break;
     // Only straight-through perpendicular crossing preserves entanglement;
     // all diagonal hits collapse it on both outputs.
     emit(b.dir,b.color,!(game>=2)&&(rel===2||rel===6)?b.eid:0);
     if(game>=2&&(rel===2||rel===6))emit(p.rot-rel,b.color,0);
     if(rel===1)emit(p.rot-1,b.color,0);
     if(rel===3)emit(p.rot-3,b.color,0);
     if(rel===5)emit(p.rot+3,b.color,0);
     if(rel===7)emit(p.rot+1,b.color,0);
     break;
    case 'conduit':
     if(rel===0||rel===4)emit(b.dir);
     break;
    case 'mobileTeleporter':case 'teleporter':{
     let tx=nx+DX[b.dir],ty=ny+DY[b.dir];
     while(inBounds(tx,ty)){
      const candidate=map.get(id(tx,ty));
      if(candidate?.type==='teleporter'||candidate?.type==='mobileTeleporter'){emit(b.dir,b.color,b.eid,tx,ty);break}
      tx+=DX[b.dir];ty+=DY[b.dir];
     }
     break;
    }
    case 'tangler':
     // The original tangler only accepts light incident at rel=2. Each
     // active RGB channel creates TWO linked rays in opposing directions.
     if(rel===2){
      for(const bit of [1,2,4]){
       if(!(b.color&bit))continue;
       const eid=++entangleCounter;
       emit(p.rot,bit,eid);
       emit(p.rot-4,bit,eid);
      }
     }
     break;
    default:unsupported.add(p.type);
   }
  }
  // Resolve paired color shifts simultaneously within the newly emitted
  // wavefront. Doppler-carrying beam's relative angle controls shift sign.
  for(let i=0;i<next.length;i++){
   const b=next[i];
   if(!b.eid)continue;
   const cell=map.get(id(b.x,b.y));
   if(cell?.type!=='doppler')continue;
   const forward=wrap(b.dir-cell.rot)===2;
   for(let j=0;j<next.length;j++){
    const peer=next[j];
    if(peer.eid!==b.eid)continue;
    peer.color=(i===j)===forward?
     shiftForward(peer.color):shiftBackward(peer.color);
   }
  }
  queue=next;
 }
 if(queue.length||steps>=MAX_BEAM_STEPS)truncated=true;
 }
 function emitGates(){
  let changed=false;
  for(const g of gates){
   const shared=inputs[port(g,g.rot-1)]&inputs[port(g,g.rot+1)];
   if(g.type==='primaryLogicGate'&&![1,2,4].includes(shared))continue;
   const fresh=shared&~(gateOutputs.get(g)||0);
   if(!fresh)continue;
   gateOutputs.set(g,shared);
   propagate(g,g.rot,fresh);
   changed=true;
  }
  return changed;
 }
 // Complement feedback can invalidate a previous output. Disable the
 // contradicted device for this board state and retrace from the emitters.
 let retry;
 do{
  retry=false;
  for(const laser of pieces.filter(p=>p.type==='laser'&&p.color).sort(byCell))
   propagate(laser,laser.rot,laser.color);
  if(!inputs)break;
  let before,changed;
  do{
   before=inputs.slice();
   changed=emitGates();
   for(const p of complements){
    if(disabled.has(p))continue;
    for(let d=p.rot%2;d<8;d+=2){
     const mask=inputs[port(p,d)];
     if(mask&&mask!==7)propagate(p,d,7^mask);
    }
   }
   changed=emitGates()||changed||complements.some(p=>!disabled.has(p)&&
    inputs.subarray(port(p,0),port(p,0)+8).some((v,d)=>v&&!before[port(p,d)]));
  }while(changed&&!truncated);
  for(const p of complements){
   if(disabled.has(p))continue;
   for(let d=0;d<8;d++)if(before[port(p,d)]&&before[port(p,d)]!==inputs[port(p,d)]){
    disabled.add(p);retry=true;break;
   }
  }
  if(retry&&!truncated){
   received.clear();visited.clear();gateOutputs.clear();inputs.fill(0);
   segments.length=boundaryHits.length=0;
  }
 }while(retry&&!truncated);
 const targets=pieces.filter(p=>p.type==='target');
 const active=targets.filter(p=>(received.get(p.id)||0)===p.color);
 return {segments,boundaryHits,received,total:targets.length,active:active.length,
  won:targets.length>0&&active.length===targets.length&&!truncated,
  unsupported:[...unsupported],truncated,entangledPairs:entangleCounter};
}
