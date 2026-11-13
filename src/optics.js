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
export const movable=new Set(['mirror','bender','filter','prism','doppler','splitter','tangler']);
const wrap=n=>(n+16)%8, inBounds=(x,y)=>x>=0&&y>=0&&x<15&&y<15, id=(x,y)=>x+','+y;
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
 let queue=pieces.filter(p=>p.type==='laser'&&p.color)
  .map(p=>({x:p.x,y:p.y,dir:wrap(p.rot),color:p.color&7,eid:0}));
 let steps=0,entangleCounter=0,layer=0;
 while(queue.length&&steps<MAX_BEAM_STEPS&&layer++<MAX_BEAM_LAYERS){
  const next=[];
  for(const b of queue){
   if(steps>=MAX_BEAM_STEPS)break;
   steps++;
   if(!b.color)continue;
   const state=`${b.x}:${b.y}:${b.dir}:${b.color}:${b.eid}`;
   if(visited.has(state))continue;
   visited.add(state);
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
   const rel=wrap(b.dir-p.rot);
   const emit=(dir,color=b.color,eid=b.eid,x=nx,y=ny)=>{
    if(color)next.push({x,y,dir:wrap(dir),color:color&7,eid});
   };
   switch(p.type){
    case 'wall':case 'laser':break;
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
     if(b.color&4&&blue[rel]!==undefined)emit(p.rot+blue[rel],4);
     if(b.color&2&&green[rel]!==undefined)emit(p.rot+green[rel],2);
     if(b.color&1&&red[rel]!==undefined)emit(p.rot+red[rel],1);
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
     emit(b.dir,b.color,rel===2||rel===6?b.eid:0);
     if(rel===1)emit(p.rot-1,b.color,0);
     if(rel===3)emit(p.rot-3,b.color,0);
     if(rel===5)emit(p.rot+3,b.color,0);
     if(rel===7)emit(p.rot+1,b.color,0);
     break;
    case 'conduit':
     if(rel===0||rel===4)emit(b.dir);
     break;
    case 'teleporter':{
     let tx=nx+DX[b.dir],ty=ny+DY[b.dir];
     while(inBounds(tx,ty)){
      const candidate=map.get(id(tx,ty));
      if(candidate?.type==='teleporter'){emit(b.dir,b.color,b.eid,tx,ty);break}
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
 const targets=pieces.filter(p=>p.type==='target');
 const active=targets.filter(p=>(received.get(p.id)||0)===p.color);
 const truncated=queue.length>0&&(steps>=MAX_BEAM_STEPS||layer>=MAX_BEAM_LAYERS);
 return {segments,boundaryHits,received,total:targets.length,active:active.length,
  won:targets.length>0&&active.length===targets.length&&!truncated,
  unsupported:[...unsupported],truncated,entangledPairs:entangleCounter};
}
