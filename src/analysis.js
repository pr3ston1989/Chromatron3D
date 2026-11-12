/**
 * Pure, renderer-independent explanation of the current beam simulation.
 * Never guesses a solution: summarizes only verified, observable state.
 * Color masks are internal RGB: R=1 G=2 B=4.
 */
const NAMES = {
 pl:['Brak','Czerwony','Zielony','Żółty','Niebieski','Magenta','Cyjan','Biały'],
 en:['None','Red','Green','Yellow','Blue','Magenta','Cyan','White']
};
export const colorName = (mask, lang='pl') => NAMES[lang==='en'?'en':'pl'][mask & 7];
export const channels = mask => ['R','G','B'].filter((_,i)=>(mask & (1<<i))!==0);
const cell=(x,y)=>x+','+y;
const wrap=n=>(n+8)%8;

/** Summarize targets, intersections and beam absorptions without modifying play. */
export function inspectLight(pieces,result){
 const board=pieces.filter(p=>!p.inTray&&p.x>=0&&p.y>=0&&p.x<15&&p.y<15);
 const occupied=new Map(board.map(p=>[cell(p.x,p.y),p]));
 const targets=board.filter(p=>p.type==='target').map(p=>{
  const required=p.color&7,received=(result.received?.get(p.id)||0)&7;
  return {id:p.id,x:p.x,y:p.y,required,received,
   correct:received===required,missing:required&~received,unexpected:received&~required};
 });
 const collisions=[],seen=new Set();
 for(const segment of result.segments||[]){
  const p=occupied.get(cell(segment.nx,segment.ny));
  if(!p)continue;
  const direction=wrap(Math.sign(segment.nx-segment.x)===1?(segment.ny<segment.y?1:segment.ny>segment.y?3:2):
    Math.sign(segment.nx-segment.x)===-1?(segment.ny<segment.y?7:segment.ny>segment.y?5:6):
    segment.ny<segment.y?0:4);
  const rel=wrap(direction-p.rot);
  let blocked=false;
  switch(p.type){
   case 'wall':case 'laser':blocked=true;break;
   case 'mirror':blocked=rel<1||rel>3;break;
   case 'bender':blocked=rel>3;break;
   case 'filter':blocked=(rel!==2&&rel!==6)||!(p.color&segment.color);break;
   case 'doppler':blocked=rel!==2&&rel!==6;break;
   case 'splitter':blocked=rel===0||rel===4;break;
   case 'conduit':blocked=rel!==0&&rel!==4;break;
   case 'tangler':blocked=true;break; // not yet supported by the prototype
   default:break;
  }
  if(blocked){
   const key=cell(p.x,p.y)+':'+p.type+':'+segment.color;
   if(!seen.has(key)){seen.add(key);collisions.push({x:p.x,y:p.y,type:p.type,color:segment.color})}
  }
 }
 return {
  lasers:board.filter(p=>p.type==='laser').length,
  segments:(result.segments||[]).length,
  targets,
  collisions,
  unsupported:result.unsupported||[],
  truncated:Boolean(result.truncated),
  allCorrect:targets.length>0&&targets.every(t=>t.correct)
 };
}
