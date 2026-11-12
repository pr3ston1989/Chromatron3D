// Deterministic 8-direction, additive-color laser tracing, independent of renderer.
// MVP models reflection, filter, splitter and walls. Remaining classic optic rules are pending verification.
export const DX=[0,1,1,1,0,-1,-1,-1], DY=[-1,-1,0,1,1,1,0,-1];
export const COLORS=['#000000','#ff3b62','#6afba1','#ffe778','#6399ff','#ed65ff','#5ff8ef','#ffffff'];
export const movable=new Set(['mirror','filter','splitter','prism','bender','doppler']);
const id=(x,y)=>x+','+y;
export function trace(pieces){
 const map=new Map(pieces.map(p=>[id(p.x,p.y),p]));
 const segments=[], received=new Map(), queue=[], visited=new Set();
 for(const p of pieces)if(p.type==='laser')queue.push({x:p.x,y:p.y,dir:p.rot,color:p.color});
 let steps=0;
 while(queue.length&&steps++<4096){
  const b=queue.shift();
  if(b.color===0)continue;
  const state=[b.x,b.y,b.dir,b.color].join(':');
  if(visited.has(state))continue;
  visited.add(state);
  const nx=b.x+DX[b.dir],ny=b.y+DY[b.dir];
  if(nx<0||nx>=15||ny<0||ny>=15)continue;
  segments.push({x:b.x,y:b.y,nx,ny,color:b.color});
  const p=map.get(id(nx,ny));
  if(!p){queue.push({...b,x:nx,y:ny});continue;}
  if(p.type==='target'){received.set(p.id,(received.get(p.id)||0)|b.color);continue;}
  if(p.type==='wall'||p.type==='laser')continue;
  if(p.type==='mirror'||p.type==='bender'){
   queue.push({x:nx,y:ny,dir:(2*p.rot-b.dir+16)%8,color:b.color});continue;
  }
  if(p.type==='filter'){
   const color=b.color&p.color;
   if(color)queue.push({x:nx,y:ny,dir:b.dir,color});continue;
  }
  if(p.type==='splitter'){
   queue.push({x:nx,y:ny,dir:b.dir,color:b.color});
   queue.push({x:nx,y:ny,dir:(2*p.rot-b.dir+16)%8,color:b.color});continue;
  }
  // Unimplemented specialty optics: safely absorb the beam rather than pretending fidelity.
 }
 const targets=pieces.filter(p=>p.type==='target');
 const active=targets.filter(p=>(received.get(p.id)||0)===p.color);
 return {segments,received,total:targets.length,active:active.length,won:targets.length>0&&active.length===targets.length};
}
