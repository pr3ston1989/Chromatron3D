/**
 * Renderer-independent ray tracer for an orthogonal 15×15 puzzle grid.
 * Sources: independently implemented against the publicly documented classic
 * optical behaviors. Entangled-beam interactions remain unimplemented.
 *
 * Internal prototype color encoding: RED=1, GREEN=2, BLUE=4.
 * Original Chromatron data stores BLUE=1, GREEN=2, RED=4, so a future
 * importer MUST convert its color masks to the representation used here.
 */
export const DX = Object.freeze([0,1,1,1,0,-1,-1,-1]);
export const DY = Object.freeze([-1,-1,0,1,1,1,0,-1]);
export const COLORS=Object.freeze(['#000000','#ff3b62','#6afba1','#ffe778','#6399ff','#ed65ff','#5ff8ef','#ffffff']);
export const movable=new Set(['mirror','bender','filter','prism','doppler','splitter','tangler']);
const wrap = n=>(n+16)%8, inBounds=(x,y)=>x>=0&&y>=0&&x<15&&y<15, id=(x,y)=>x+','+y;
const shiftForward=mask=>((mask&1)?2:0)|((mask&2)?4:0)|((mask&4)?1:0); // R → G → B → R
const shiftBackward=mask=>((mask&1)?4:0)|((mask&2)?1:0)|((mask&4)?2:0); // R → B → G → R

/** Simulate rays and return visual beam segments and exact target-color matches. */
export function trace(allPieces){
 const pieces=allPieces.filter(p=>!p.inTray&&inBounds(p.x,p.y));
 const map=new Map(pieces.map(p=>[id(p.x,p.y),p]));
 const segments=[],received=new Map(),queue=[],visited=new Set(),unsupported=new Set();
 for(const p of pieces)if(p.type==='laser'&&p.color)queue.push({x:p.x,y:p.y,dir:wrap(p.rot),color:p.color&7});
 let steps=0;
 while(queue.length&&steps++<16384){
  const b=queue.shift();
  if(!b.color)continue;
  const state=[b.x,b.y,b.dir,b.color].join(':');
  if(visited.has(state))continue;visited.add(state);
  const nx=b.x+DX[b.dir],ny=b.y+DY[b.dir];
  if(!inBounds(nx,ny))continue;
  segments.push({x:b.x,y:b.y,nx,ny,color:b.color});
  const p=map.get(id(nx,ny));
  if(!p){queue.push({...b,x:nx,y:ny});continue}
  const rel=wrap(b.dir-p.rot);
  const emit=(dir,color=b.color,x=nx,y=ny)=>{if(color)queue.push({x,y,dir:wrap(dir),color:color&7})};
  switch(p.type){
   case 'wall':case 'laser':break;
   case 'target':
    received.set(p.id,(received.get(p.id)||0)|b.color);
    emit(b.dir); // A target receives but does not stop the beam.
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
   case 'prism': {
    // Disperse channels independently. All angles are discrete octants.
    const blue={1:1,2:2,5:-3,6:-2};
    const green={0:1,2:3,5:-4,7:-2};
    const red={0:-2,2:-4,5:3,7:1};
    if(b.color&4&&blue[rel]!==undefined)emit(p.rot+blue[rel],4);
    if(b.color&2&&green[rel]!==undefined)emit(p.rot+green[rel],2);
    if(b.color&1&&red[rel]!==undefined)emit(p.rot+red[rel],1);
    break;
   }
   case 'doppler':
    if(rel===2)emit(b.dir,shiftForward(b.color));
    else if(rel===6)emit(b.dir,shiftBackward(b.color));
    break;
   case 'splitter':
    if(rel===0||rel===4)break;
    emit(b.dir);
    if(rel===1)emit(p.rot-1);
    if(rel===3)emit(p.rot-3);
    if(rel===5)emit(p.rot+3);
    if(rel===7)emit(p.rot+1);
    break;
   case 'conduit':
    if(rel===0||rel===4)emit(b.dir);
    break;
   case 'teleporter': {
    let tx=nx+DX[b.dir],ty=ny+DY[b.dir];
    while(inBounds(tx,ty)){
     const candidate=map.get(id(tx,ty));
     if(candidate?.type==='teleporter'){emit(b.dir,b.color,tx,ty);break}
     tx+=DX[b.dir];ty+=DY[b.dir];
    }
    break;
   }
   case 'tangler':
    unsupported.add('entanglement');
    break;
   default:unsupported.add(p.type);
  }
 }
 const targets=pieces.filter(p=>p.type==='target');
 const active=targets.filter(p=>(received.get(p.id)||0)===p.color);
 return {segments,received,total:targets.length,active:active.length,won:targets.length>0&&active.length===targets.length,unsupported:[...unsupported],truncated:steps>=16384};
}
