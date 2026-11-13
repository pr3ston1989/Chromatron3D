/**
 * Procedural, inexpensive visual identities for the 15x15 floating deck.
 *
 * Colors are written into existing InstancedMesh instanceColor attributes,
 * so each level gains patina/edge inlays without adding draw calls, meshes,
 * optical obstacles, external textures or mutable puzzle-state data.
 */
const profiles=Object.freeze({
 scrap:Object.freeze({tileMetalness:.59,tileRoughness:.46,
  deckMetalness:.75,deckRoughness:.37}),
 moss:Object.freeze({tileMetalness:.23,tileRoughness:.77,
  deckMetalness:.43,deckRoughness:.65}),
 ice:Object.freeze({tileMetalness:.38,tileRoughness:.30,
  deckMetalness:.61,deckRoughness:.32}),
 crystal:Object.freeze({tileMetalness:.47,tileRoughness:.42,
  deckMetalness:.68,deckRoughness:.40})
});
export function deckSurfaceProfile(decor){
 return profiles[decor]||profiles.scrap;
}
function hash(value){
 let h=2166136261;
 for(const character of String(value)){
  h^=character.charCodeAt(0);
  h=Math.imul(h,16777619);
 }
 return h>>>0;
}
const channel=(hex,shift)=>(hex>>>shift)&255;
function blend(a,b,weight){
 const t=Math.max(0,Math.min(1,weight));
 let out=0;
 for(const shift of [16,8,0]){
  const value=Math.round(channel(a,shift)*(1-t)+channel(b,shift)*t);
  out|=value<<shift;
 }
 return out;
}
function multiply(hex,scale){
 let result=0;
 for(const shift of [16,8,0]){
  result|=Math.min(255,Math.round(channel(hex,shift)*scale))<<shift;
 }
 return result;
}
const biomeAccent=Object.freeze({
 scrap:0x778fa3,moss:0x5d9f70,ice:0x9bd7e8,crystal:0xc47dab
});
export function deckCellFinish(theme,packId,index,seed,x,y){
 if(!theme||!Number.isInteger(x)||!Number.isInteger(y)||
    x<0||x>14||y<0||y>14||
    !Number.isInteger(index)||index<0)
  throw new Error('Invalid deck cell');
 const decor=theme.decor;
 const tone=biomeAccent[decor]||biomeAccent.scrap;
 const random=hash(packId+':'+index+':'+seed+':'+x+':'+y);
 const grain=(random&1023)/1023;
 const wear=((random>>>12)&1023)/1023;
 const edgeDepth=Math.min(x,14-x,y,14-y);
 const border=edgeDepth<=1;
 const base=(x+y)%2===0?theme.tileB:theme.tileA;
 let patina=0;
 if(decor==='moss'){
  // Older growth collects around the perimeter, not on center sight lines.
  patina=(border?.23:edgeDepth===2?.09:.015)*(wear>.24?1:.35);
 }else if(decor==='ice'){
  // Sparse bright frozen seams stretch into the deck from its outer edge.
  const frostStripe=(x*2+y+Math.floor(random/65536))%7===0;
  patina=(border?.21:.035)*(frostStripe?1:.45);
 }else if(decor==='crystal'){
  const vein=(x-y+Math.floor(random/65536)+210)%6===0;
  patina=vein?.15:.032;
 }else{
  // Precision-machined segmented panel plating.
  const plate=(x%4===0||y%4===0);
  patina=plate?.10:.02;
 }
 const tile=multiply(blend(base,tone,patina),.91+grain*.14);
 const edge=blend(theme.edge,base,.25+wear*.16);
 return {tileColor:tile,lineColor:edge};
}
