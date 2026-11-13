/**
 * Procedural, inexpensive visual identities for the 15x15 floating deck.
 *
 * Colors are written into existing InstancedMesh instanceColor attributes,
 * so each level gains patina/edge inlays without adding draw calls, meshes,
 * optical obstacles, external textures or mutable puzzle-state data.
 *
 * v2 — richer per-cell variation: connected crystal veins, organic moss
 * gradients, branching frost, segmented industrial plating. New optional
 * fields (emissive, emissiveIntensity) and deckCellRoughness() export.
 */

/* ── Global surface profiles (unchanged API) ──────────────────────────── */
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

/* ── Deterministic hash helpers ───────────────────────────────────────── */
function hash(value){
 let h=2166136261;
 for(const character of String(value)){
  h^=character.charCodeAt(0);
  h=Math.imul(h,16777619);
 }
 return h>>>0;
}
/** Secondary hash — same FNV-1a but with a different initial state. */
function hash2(value){
 let h=0x811c9dc5^0xa5a5a5a5;
 for(const c of String(value)){
  h^=c.charCodeAt(0);
  h=Math.imul(h,16777619);
 }
 return h>>>0;
}
/** Cheap 2D value noise from grid hashes, returns 0–1. */
function noise2d(prefix,x,y){
 const x0=Math.floor(x),y0=Math.floor(y);
 const fx=x-x0,fy=y-y0;
 const smoothX=fx*fx*(3-2*fx),smoothY=fy*fy*(3-2*fy);
 const v00=(hash(prefix+':'+x0+','+y0)&0xffff)/0xffff;
 const v10=(hash(prefix+':'+(x0+1)+','+y0)&0xffff)/0xffff;
 const v01=(hash(prefix+':'+x0+','+(y0+1))&0xffff)/0xffff;
 const v11=(hash(prefix+':'+(x0+1)+','+(y0+1))&0xffff)/0xffff;
 return (v00*(1-smoothX)+v10*smoothX)*(1-smoothY)+
        (v01*(1-smoothX)+v11*smoothX)*smoothY;
}

/* ── Color math ───────────────────────────────────────────────────────── */
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
function addColor(a,b,strength){
 let out=0;
 for(const shift of [16,8,0]){
  out|=Math.min(255,channel(a,shift)+Math.round(channel(b,shift)*strength))<<shift;
 }
 return out;
}

/* ── Biome accent palette ─────────────────────────────────────────────── */
const biomeAccent=Object.freeze({
 scrap:0x778fa3,moss:0x5d9f70,ice:0x9bd7e8,crystal:0xc47dab
});
const mossDeep=0x2d6b3a;
const mossFresh=0x8cdf7a;
const frostBright=0xd8f4ff;
const frostSeam=0xaee8fc;
const crystalGlow=0xdf6cb8;
const crystalVein=0xb35ea0;
const crystalDeepBase=0x221830;
const amberWarning=0xe8a540;

/* ── Connected vein generation for nebula biome ───────────────────────── */
/**
 * For a given level seed, build a 15×15 boolean map of connected crystal
 * veins that flow diagonally across the board. Veins start at 2-4 edge
 * points and branch inward, creating organic-looking networks.
 */
function crystalVeinMap(prefix){
 const map=new Float32Array(15*15); // intensity 0–1
 // Seed entry points along edges
 const entries=[];
 for(let i=0;i<15;i++){
  if((hash(prefix+':vein-top:'+i)&7)<2) entries.push({x:i,y:0,dir:1});
  if((hash(prefix+':vein-bot:'+i)&7)<2) entries.push({x:i,y:14,dir:-1});
  if((hash(prefix+':vein-left:'+i)&7)<2) entries.push({x:0,y:i,dir:1});
  if((hash(prefix+':vein-right:'+i)&7)<2) entries.push({x:14,y:i,dir:-1});
 }
 // Walk veins inward, branching occasionally
 const stack=[...entries];
 let steps=0;
 while(stack.length>0&&steps<300){
  const {x,y,dir}=stack.pop();
  steps++;
  if(x<0||x>14||y<0||y>14) continue;
  const idx=y*15+x;
  const intensity=.35+.65*Math.max(0,1-steps*.003);
  if(map[idx]>=intensity) continue;
  map[idx]=Math.max(map[idx],intensity);
  // Continue in a diagonal-ish direction
  const h=hash(prefix+':walk:'+x+':'+y+':'+steps);
  const dx=((h&3)===0?0:(h&1)?1:-1);
  const dy=((h&12)===0?0:(h&4)?dir:-dir);
  if(dx!==0||dy!==0) stack.push({x:x+dx,y:y+dy,dir});
  // Branch with ~25% probability
  if((h>>>8&3)===0){
   const bx=((h>>>12)&1)?1:-1;
   const by=((h>>>14)&1)?1:-1;
   stack.push({x:x+bx,y:y+by,dir});
  }
 }
 return map;
}

/* ── Branching frost patterns for polar biome ─────────────────────────── */
function frostMap(prefix){
 const map=new Float32Array(15*15);
 const stack=[];
 // Frost grows inward from all four edges
 for(let i=0;i<15;i++){
  const h=hash(prefix+':frost-seed:'+i);
  if((h&3)<2) stack.push({x:i,y:0,strength:1});
  if(((h>>>4)&3)<2) stack.push({x:i,y:14,strength:1});
  if(((h>>>8)&3)<2) stack.push({x:0,y:i,strength:1});
  if(((h>>>12)&3)<2) stack.push({x:14,y:i,strength:1});
 }
 let steps=0;
 while(stack.length>0&&steps<400){
  const {x,y,strength}=stack.pop();
  steps++;
  if(x<0||x>14||y<0||y>14||strength<.08) continue;
  const idx=y*15+x;
  if(map[idx]>=strength) continue;
  map[idx]=Math.max(map[idx],strength);
  const h=hash(prefix+':frost-walk:'+x+':'+y+':'+steps);
  // Frost decays as it extends inward; branching is more frequent than veins
  const decay=.72+((h&15)/15)*.18;
  const next=strength*decay;
  // Primary direction: toward center
  const cx=7-x,cy=7-y;
  const dx=cx===0?0:(cx>0?1:-1);
  const dy=cy===0?0:(cy>0?1:-1);
  // Main branch continues toward center
  if((h>>>4&3)<3) stack.push({x:x+dx,y:y+dy,strength:next});
  // Side branches create the crystalline fractal look
  if((h>>>8&3)===0) stack.push({x:x+dy,y:y-dx,strength:next*.7});
  if((h>>>12&3)===0) stack.push({x:x-dy,y:y+dx,strength:next*.7});
  // Occasional diagonal branch
  if((h>>>16&7)===0) stack.push({x:x+(h&1?1:-1),y:y+(h&2?1:-1),strength:next*.55});
 }
 return map;
}

/* ── Level-specific pattern caches ────────────────────────────────────── */
const veinCache=new Map();
const frostCache=new Map();
function getCrystalVeins(packId,index,seed){
 const key=packId+':'+index+':'+seed+':veins';
 if(!veinCache.has(key)){
  if(veinCache.size>8) veinCache.clear(); // keep memory bounded
  veinCache.set(key,crystalVeinMap(key));
 }
 return veinCache.get(key);
}
function getFrostPattern(packId,index,seed){
 const key=packId+':'+index+':'+seed+':frost';
 if(!frostCache.has(key)){
  if(frostCache.size>8) frostCache.clear();
  frostCache.set(key,frostMap(key));
 }
 return frostCache.get(key);
}

/* ── Main per-cell finish (backward-compatible + enhanced) ────────────── */
export function deckCellFinish(theme,packId,index,seed,x,y){
 if(!theme||!Number.isInteger(x)||!Number.isInteger(y)||
    x<0||x>14||y<0||y>14||
    !Number.isInteger(index)||index<0)
  throw new Error('Invalid deck cell');
 const decor=theme.decor;
 const tone=biomeAccent[decor]||biomeAccent.scrap;
 const random=hash(packId+':'+index+':'+seed+':'+x+':'+y);
 const random2=hash2(packId+':'+index+':'+seed+':'+x+':'+y);
 const grain=(random&1023)/1023;
 const wear=((random>>>12)&1023)/1023;
 const edgeDepth=Math.min(x,14-x,y,14-y);
 const border=edgeDepth<=1;
 const base=(x+y)%2===0?theme.tileB:theme.tileA;
 let patina=0;
 let emissive=0;
 let emissiveIntensity=0;
 let tileOverride=0; // 0 means use standard blend path
 let lineOverride=0;
 let useOverrides=false;

 if(decor==='scrap'){
  /* ── Orbital: segmented industrial floor plating ───────────────────── */
  const plateX=Math.floor(x/4),plateY=Math.floor(y/4);
  const plateHash=hash(packId+':'+index+':'+seed+':plate:'+plateX+':'+plateY);
  const plateGrain=((plateHash&1023)/1023)*.08;
  const isJoint=(x%4===0||y%4===0);
  const isCorner=(x%4===0&&y%4===0)||(x%4===3&&y%4===3)||(x%4===0&&y%4===3)||(x%4===3&&y%4===0);

  // Each plate group gets a slightly different base tone
  const plateShift=.92+plateGrain;
  let plateBase=multiply(base,plateShift);

  // Corner cells are darker (wear accumulation at bolt points)
  if(isCorner) plateBase=multiply(plateBase,.88);

  // Joints get distinct metallic seam color
  if(isJoint){
   patina=.14+((random>>>6&7)/7)*.08;
   // Seams are brighter, more metallic-looking
   const seamColor=blend(0x8a9eb0,tone,.3);
   plateBase=blend(plateBase,seamColor,.22);
  }else{
   patina=.02+plateGrain*.3;
  }

  // Warning cells near edges — amber tint on select border cells
  const isWarning=border&&((random2&15)<2);
  if(isWarning){
   plateBase=blend(plateBase,amberWarning,.18);
   emissive=amberWarning;
   emissiveIntensity=.06;
  }

  // Higher contrast between adjacent plate groups
  const groupParity=(plateX+plateY)%2;
  if(groupParity) plateBase=multiply(plateBase,.94);

  const tile=multiply(blend(plateBase,tone,patina),.91+grain*.12);
  const edge=isJoint?blend(0x9aafbe,base,.30):blend(theme.edge,base,.25+wear*.16);
  return {tileColor:tile,lineColor:edge,emissive,emissiveIntensity};

 }else if(decor==='moss'){
  /* ── Verdant: organically overgrown ────────────────────────────────── */
  const noisePrefix=packId+':'+index+':'+seed+':moss';
  // Multi-octave noise for organic moss distribution
  const n1=noise2d(noisePrefix+':a',x*.28,y*.28);
  const n2=noise2d(noisePrefix+':b',x*.55+3.7,y*.55+2.1);
  const noise=n1*.65+n2*.35;

  // Edge proximity drives base growth, noise modulates it organically
  const edgeFactor=Math.max(0,1-edgeDepth/7);
  const rawMoss=edgeFactor*.6+noise*.4;

  // Heavy moss on border cells, organic falloff toward center
  const mossThreshold=.25;
  const mossAmount=rawMoss>mossThreshold?
   Math.min(.48,(rawMoss-mossThreshold)*1.1):0;

  // Interior "crack" patterns — moss seeping through gaps in the deck
  const crackHash=hash(noisePrefix+':crack:'+x+':'+y);
  const isCrack=edgeDepth>2&&((crackHash&31)<2);
  const crackMoss=isCrack?.12+((crackHash>>>8&7)/7)*.09:0;

  patina=Math.max(mossAmount,crackMoss);

  // Fresh growth spots — brighter green scattered randomly
  const isFreshGrowth=patina>.1&&((random2&15)<2);
  let mossColor=tone;
  if(isFreshGrowth) mossColor=blend(mossFresh,tone,.45);
  else if(patina>.3) mossColor=blend(mossDeep,tone,.35);

  const tile=multiply(blend(base,mossColor,patina),.90+grain*.14);

  // Lines between mossy tiles are greenish (moss in the seams)
  const neighborMoss=Math.max(patina,
   noise2d(noisePrefix+':a',(x+.5)*.28,(y+.5)*.28)*.3);
  const lineGreen=Math.min(1,neighborMoss*1.5);
  const edge=blend(
   blend(theme.edge,base,.25+wear*.16),
   0x4a8a56,
   lineGreen*.35
  );

  return {tileColor:tile,lineColor:edge,emissive:0,emissiveIntensity:0};

 }else if(decor==='ice'){
  /* ── Polar: frosted and crystalline ────────────────────────────────── */
  const frost=getFrostPattern(packId,index,seed);
  const frostLevel=frost[y*15+x];

  // Base frost patina from the branching frost map
  patina=frostLevel*.28;

  // Edge cells with thick frost buildup
  if(border&&frostLevel>.3){
   patina=Math.min(.38,patina+.12);
  }

  // Frozen pool cells — smooth, reflective patches
  const poolHash=hash(packId+':'+index+':'+seed+':pool:'+x+':'+y);
  const isPool=frostLevel>.5&&((poolHash&7)<2);

  // Ice crystal veins running diagonally
  const diagA=(x+y)%3===0&&frostLevel>.2;
  const diagB=(x-y+15)%5===0&&frostLevel>.15;
  if(diagA||diagB) patina=Math.max(patina,.18);

  let frostColor=blend(tone,frostBright,frostLevel*.4);
  if(isPool) frostColor=blend(frostColor,0xeaf8ff,.25);

  const tile=multiply(blend(base,frostColor,patina),.92+grain*.11);

  // Frost in seams — bright white-blue between frozen cells
  const seamFrost=Math.min(1,frostLevel*1.2);
  const edge=blend(
   blend(theme.edge,base,.25+wear*.16),
   frostSeam,
   seamFrost*.4
  );

  // Subtle glow on heavily frosted cells
  if(frostLevel>.55||isPool){
   emissive=0x5ac0e8;
   emissiveIntensity=isPool?.08:frostLevel*.06;
  }

  return {tileColor:tile,lineColor:edge,emissive,emissiveIntensity};

 }else{
  /* ── Nebula: volcanic crystal-veined rock ──────────────────────────── */
  const veins=getCrystalVeins(packId,index,seed);
  const veinIntensity=veins[y*15+x];

  // Deep dark basalt base
  const darkBase=blend(base,crystalDeepBase,.25);

  // Crystal vein networks glow with purple-magenta
  const onVein=veinIntensity>.15;
  if(onVein){
   patina=veinIntensity*.35;
  }else{
   patina=.025+((random>>>5&7)/7)*.02;
  }

  // Geode cells — extra bright crystalline spots at vein intersections
  const geodeHash=hash(packId+':'+index+':'+seed+':geode:'+x+':'+y);
  const isGeode=veinIntensity>.6&&((geodeHash&7)<2);

  let veinColor=onVein?blend(crystalVein,tone,veinIntensity*.4):tone;
  if(isGeode) veinColor=blend(crystalGlow,veinColor,.45);

  const tile=multiply(blend(darkBase,veinColor,patina),.88+grain*.15);

  // Veins glow
  if(onVein){
   emissive=isGeode?crystalGlow:crystalVein;
   emissiveIntensity=isGeode?.14:veinIntensity*.08;
  }

  // Line colors reflect vein presence
  const edgeVein=Math.max(veinIntensity,
   (veins[Math.min(14,y)*15+Math.min(14,x+1)]+
    veins[Math.min(14,y+1)*15+x])/2);
  const lineVein=Math.min(1,edgeVein*1.3);
  const edge=blend(
   blend(theme.edge,darkBase,.30+wear*.12),
   0xb070a0,
   lineVein*.28
  );

  return {tileColor:tile,lineColor:edge,emissive,emissiveIntensity};
 }
}

/* ── Per-cell roughness / metalness overrides ─────────────────────────── */
/**
 * Returns per-cell {roughness, metalness} that override the global
 * deckSurfaceProfile. Consumers can optionally apply these to specific
 * tile instances for extra surface variation.
 */
export function deckCellRoughness(theme,packId,index,seed,x,y){
 if(!theme||!Number.isInteger(x)||!Number.isInteger(y)||
    x<0||x>14||y<0||y>14)
  return null;
 const decor=theme.decor;
 const profile=profiles[decor]||profiles.scrap;
 const h=hash(packId+':'+index+':'+seed+':rough:'+x+':'+y);
 const variation=((h&255)/255-.5)*.08;

 if(decor==='moss'){
  const noisePrefix=packId+':'+index+':'+seed+':moss';
  const n=noise2d(noisePrefix+':a',x*.28,y*.28);
  const edgeDepth=Math.min(x,14-x,y,14-y);
  const edgeFactor=Math.max(0,1-edgeDepth/7);
  const mossLevel=edgeFactor*.6+n*.4;
  // Mossy cells are much rougher and less metallic
  return {
   roughness:Math.min(1,profile.tileRoughness+mossLevel*.22+variation),
   metalness:Math.max(0,profile.tileMetalness-mossLevel*.18+variation)
  };
 }

 if(decor==='ice'){
  const frost=getFrostPattern(packId,index,seed);
  const frostLevel=frost[y*15+x];
  const poolHash=hash(packId+':'+index+':'+seed+':pool:'+x+':'+y);
  const isPool=frostLevel>.5&&((poolHash&7)<2);
  if(isPool){
   // Frozen pool: extremely smooth, slightly metallic (glassy)
   return {roughness:.10+variation,metalness:.12+variation};
  }
  // Frosted cells: slightly smoother as ice builds up
  return {
   roughness:Math.max(.12,profile.tileRoughness-frostLevel*.15+variation),
   metalness:profile.tileMetalness+frostLevel*.04+variation
  };
 }

 if(decor==='crystal'){
  const veins=getCrystalVeins(packId,index,seed);
  const veinIntensity=veins[y*15+x];
  const geodeHash=hash(packId+':'+index+':'+seed+':geode:'+x+':'+y);
  const isGeode=veinIntensity>.6&&((geodeHash&7)<2);
  if(isGeode){
   // Geode: glassy, semi-transparent look
   return {roughness:.14+variation,metalness:.10+variation};
  }
  if(veinIntensity>.15){
   // Crystal veins: smoother and slightly less metallic
   return {
    roughness:Math.max(.18,profile.tileRoughness-veinIntensity*.20+variation),
    metalness:Math.max(.08,profile.tileMetalness-veinIntensity*.12+variation)
   };
  }
 }

 if(decor==='scrap'){
  const isJoint=(x%4===0||y%4===0);
  if(isJoint){
   // Plate joints: more polished metal from wear
   return {roughness:profile.tileRoughness-.08+variation,metalness:profile.tileMetalness+.06+variation};
  }
 }

 // Default: small random variation around the global profile
 return {
  roughness:Math.max(0,Math.min(1,profile.tileRoughness+variation)),
  metalness:Math.max(0,Math.min(1,profile.tileMetalness+variation))
 };
}
