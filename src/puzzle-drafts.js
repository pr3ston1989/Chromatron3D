/**
 * Local-only, compact drafts of in-progress optical puzzles.
 *
 * Saves only the placement, rotation, and tray state of movable optics.
 * Fixed devices, beams, hints, and imported level definitions never enter
 * localStorage. All restored layouts are checked atomically to prevent
 * overlapping components or restoring a draft from a different puzzle.
 */
export function draftKey(packId,index){
 if(typeof packId!=='string'||!packId||packId.length>80||
    !Number.isInteger(index)||index<0||index>249)
  throw new Error('Invalid draft key');
 return 'chromatron-reborn-draft-v1-'+packId+':'+index;
}
const inBounds=n=>Number.isInteger(n)&&n>=0&&n<15;
const validRotation=n=>Number.isInteger(n)&&n>=0&&n<8;
const cell=(x,y)=>x+','+y;

export function encodePuzzleDraft(level,pieces,movableTypes){
 if(!Array.isArray(level?.pieces)||!Array.isArray(pieces)||
    level.pieces.length!==pieces.length)return null;
 const items=[];
 let changed=false;
 const occupied=new Set();
 for(let i=0;i<level.pieces.length;i++){
  const [type,x,y,rot,color]=level.pieces[i];
  const p=pieces[i];
  if(!p||p.type!==type||p.color!==color||
     !inBounds(p.x)||!inBounds(p.y)||!validRotation(p.rot)||
     typeof p.inTray!=='boolean')return null;
  if(!p.inTray){
   const position=cell(p.x,p.y);
   if(occupied.has(position))return null;
   occupied.add(position);
  }
  if(!movableTypes.has(type)){
   if(p.x!==x||p.y!==y||p.rot!==rot||p.inTray)return null;
   continue;
  }
  items.push({index:i,x:p.x,y:p.y,rot:p.rot,inTray:p.inTray});
  const initiallyInTray=Boolean(level.startMovablesInTray);
  if(p.x!==x||p.y!==y||p.rot!==rot||p.inTray!==initiallyInTray)
   changed=true;
 }
 return changed?JSON.stringify({version:1,items}):null;
}

export function restorePuzzleDraft(level,pieces,raw,movableTypes){
 if(typeof raw!=='string'||raw.length>32000||
    !Array.isArray(level?.pieces)||!Array.isArray(pieces)||
    level.pieces.length!==pieces.length)return null;
 let parsed;
 try{parsed=JSON.parse(raw)}catch{return null}
 const expected=level.pieces.flatMap(([type],i)=>movableTypes.has(type)?[i]:[]);
 if(parsed?.version!==1||!Array.isArray(parsed.items)||
    parsed.items.length!==expected.length)return null;
 const restored=pieces.map(piece=>({...piece}));
 const occupied=new Set();
 for(const p of restored.filter(p=>!movableTypes.has(p.type)&&!p.inTray)){
  const position=cell(p.x,p.y);
  if(occupied.has(position))return null;
  occupied.add(position);
 }
 for(let i=0;i<expected.length;i++){
  const item=parsed.items[i],index=expected[i];
  if(!item||item.index!==index||!inBounds(item.x)||!inBounds(item.y)||
     !validRotation(item.rot)||typeof item.inTray!=='boolean')return null;
  if(!item.inTray){
   const position=cell(item.x,item.y);
   if(occupied.has(position))return null;
   occupied.add(position);
  }
  Object.assign(restored[index],{
   x:item.x,y:item.y,rot:item.rot,inTray:item.inTray
  });
 }
 return restored;
}
