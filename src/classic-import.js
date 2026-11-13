import {validateLevels} from './levels.js';

/**
 * Private, user-supplied compatibility bridge for original Chromatron levels.
 * No original level data, art or original executable is bundled.
 *
 * Accepts the JSON shape emitted by a local extraction of a user's original
 * installation: {levels:[{text,pieces:[{type,rotation,color,x,y}]}],
 * level_order:[...]}. Each original 5-byte record is normalized into the
 * [type,x,y,rot,color] optical format used by the web game.
 *
 * Compatibility status: structural loader, NOT proof of 1:1 solver parity.
 * The Tangler/teleporter and additive-channel interactions require further
 * golden-master comparisons before an entire game can be certified.
 */
export const CLASSIC_TYPE_NAMES=Object.freeze([
 'empty','wall','laser','mirror','bender','filter','prism',
 'doppler','splitter','tangler','target','conduit','teleporter'
]);
export const CLASSIC_PACK_ORDER=Object.freeze([1,2,3,4]);

export function classicColorToWeb(mask){
 if(!Number.isInteger(mask)||mask<0||mask>7)throw new Error('Invalid classic RGB bitmask');
 // Existing web solver uses R=1,G=2,B=4; classic data uses B=1,G=2,R=4.
 return ((mask&4)>>2)|(mask&2)|((mask&1)<<2);
}
export function classicPieceToWeb(record){
 if(!record||typeof record!=='object')throw new Error('Missing classic piece record');
 const type=CLASSIC_TYPE_NAMES[record.type];
 if(!type||type==='empty')throw new Error('Unknown original piece type: '+record.type);
 const {x,y}=record;
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>14||y<0||y>14)
  throw new Error('Classic coordinates must fit the 15×15 board');
 const rot=record.rotation;
 if(!Number.isInteger(rot)||rot<0||rot>7)throw new Error('Invalid classic rotation');
 return [type,x,y,rot,classicColorToWeb(record.color)];
}
export function convertClassicPack(raw,{game=1,strict=true}={}){
 if(!CLASSIC_PACK_ORDER.includes(game))throw new Error('Chromatron game must be 1–4');
 if(!raw||!Array.isArray(raw.levels)||raw.levels.length===0)
  throw new Error('Classic extraction must contain nonempty levels');
 const order=Array.isArray(raw.level_order)?raw.level_order:
  raw.levels.map((_,i)=>i);
 if(strict&&order.length!==50)
  throw new Error('Expected 50 playable level indices for classic game '+game);
 const levels=order.map((originalIndex,sequence)=>{
  const entry=raw.levels[originalIndex];
  if(!entry||!Array.isArray(entry.pieces))
   throw new Error('Missing classic level '+originalIndex);
  const pieces=entry.pieces.map(classicPieceToWeb);
  // Instruction copy remains LOCAL from the user's chosen file.
  const instruction=typeof entry.text==='string'?entry.text:'';
  return {
   title:{pl:`CHROMATRON ${game} — ${String(sequence+1).padStart(2,'0')}`,
          en:`CHROMATRON ${game} — ${String(sequence+1).padStart(2,'0')}`},
   description:{pl:instruction,en:instruction},
   pieces,startMovablesInTray:true,
   sourceGame:game,sourceIndex:originalIndex,
   // The existing hint assistant can produce useful non-spoiler analysis
   // without shipping copyrighted scripted hints or claiming a solution.
   hints:[]
  };
 });
 return validateLevels(levels);
}
export function convertClassicCollection(sources,{strict=true}={}){
 if(!Array.isArray(sources)||sources.length===0||sources.length>4)
  throw new Error('Choose between 1 and 4 classic extraction files');
 const seen=new Set(),output=[];
 for(const {game,data} of sources){
  if(seen.has(game))throw new Error('Duplicate classic game '+game);
  seen.add(game);
  output.push(...convertClassicPack(data,{game,strict}));
 }
 return output;
}
export function loadLevelBundle(json,{game=1}={}){
 const data=typeof json==='string'?JSON.parse(json):json;
 if(Array.isArray(data))return validateLevels(data);
 if(Array.isArray(data?.packs))return convertClassicCollection(data.packs);
 if(Array.isArray(data?.level_order))return convertClassicPack(data,{game});
 if(Array.isArray(data?.levels)&&data.levels.some(level=>
    level?.pieces?.some(piece=>!Array.isArray(piece))))
  return convertClassicPack(data,{game});
 if(Array.isArray(data?.levels))return validateLevels(data.levels);
 throw new Error('Unsupported puzzle JSON format');
}
