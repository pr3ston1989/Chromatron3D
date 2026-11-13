import {unpackClassicImage} from './classic-packed.js';
// Data addresses for the four local Windows retail releases. Index zero
// can be a null pointer; only read records referenced by the playable order.
export const KNOWN_PROFILES=Object.freeze({
 1:{levelOrderVA:0x0040b168,levelPtrsVA:0x0040e65c,textPtrsVA:0x0040e758,maxLevels:120,playable:50},
 2:{levelOrderVA:0x40c178,levelPtrsVA:0x40e9e8,textPtrsVA:0x40eb98,namePtrsVA:0x40eac0,maxLevels:53,playable:50},
 3:{levelOrderVA:0x40c178,levelPtrsVA:0x411680,textPtrsVA:0x411900,namePtrsVA:0x4117c0,maxLevels:79,playable:50},
 4:{levelOrderVA:0x40b174,levelPtrsVA:0x40ebd0,textPtrsVA:0x40ed88,namePtrsVA:0x40ecac,maxLevels:55,playable:50},
});

/* ── Shared PE32 parser ──────────────────────────────────────────── */
export function parsePE32(bytes){
 let data=bytes instanceof ArrayBuffer?new Uint8Array(bytes):
  ArrayBuffer.isView(bytes)?new Uint8Array(bytes.buffer,bytes.byteOffset,bytes.byteLength):null;
 if(!data||data.length<1024)throw new Error('Expected a Win32 PE32 executable');
 let view=new DataView(data.buffer,data.byteOffset,data.byteLength);
 const byte=(o)=>{if(o<0||o>=data.length)throw new Error('Binary address outside file');return data[o]};
 const u16=(o)=>{if(o<0||o+2>data.length)throw new Error('Invalid PE header');return view.getUint16(o,true)};
 const u32=(o)=>{if(o<0||o+4>data.length)throw new Error('Invalid PE header');return view.getUint32(o,true)};
 if(byte(0)!==0x4d||byte(1)!==0x5a)throw new Error('Expected Windows MZ executable');
 const pe=u32(0x3c);
 if(u32(pe)!==0x00004550)throw new Error('Expected Windows PE executable');
 const sectionCount=u16(pe+6),optionalSize=u16(pe+20),optional=pe+24;
 if(u16(optional)!==0x10b)throw new Error('Only PE32 is supported');
 const imageBase=u32(optional+28);
 if(imageBase!==0x00400000)throw new Error('Unsupported executable layout');
 const sections=[];
 for(let i=0;i<sectionCount;i++){
  const o=optional+optionalSize+i*40;
  const name=String.fromCharCode(...data.slice(o,o+8)).replace(/\0/g,'');
  sections.push({name,virtualSize:u32(o+8),rva:u32(o+12),rawSize:u32(o+16),rawPtr:u32(o+20)});
 }
 if(sections.some(s=>s.name.startsWith('UPX'))){
  const decoded=unpackClassicImage(data);
  if(!decoded)throw new Error('Unsupported UPX-packed original');
  data=decoded;
  view=new DataView(data.buffer);
  sections.splice(0,sections.length,{name:'.image',rva:0x1000,rawSize:data.length,rawPtr:0});
 }
 /** Convert VA→file offset; returns -1 if unmapped (soft fail for scanning). */
 function toFileOffset(va,length=1){
  const rva=va-imageBase;
  for(const s of sections){
   if(rva>=s.rva&&rva+length<=s.rva+s.rawSize){
    const off=s.rawPtr+rva-s.rva;
    return(off>=0&&off+length<=data.length)?off:-1;
   }
  }
  return -1;
 }
 /** Strict version that throws on unmapped addresses. */
 function fileOffset(va,length=1){
  const off=toFileOffset(va,length);
  if(off<0)throw new Error('Missing Chromatron address 0x'+va.toString(16));
  return off;
 }
 const readByte=va=>byte(fileOffset(va));
 const readPointer=va=>u32(fileOffset(va,4));
 const readAscii=va=>{
  const out=[];
  for(let i=0;i<512;i++){
   const c=readByte(va+i);if(c===0)break;
   out.push(c>=32&&c<=126?String.fromCharCode(c):' ');
  }
  return out.join('');
 };
 return {data,view,sections,imageBase,byte,u16,u32,toFileOffset,fileOffset,readByte,readPointer,readAscii};
}

/* ── Level record validator ──────────────────────────────────────── */
/** Check whether bytes at `offset` form a valid Chromatron level (5-byte records). */
export function isValidLevel(data,offset){
 let pos=offset,count=0;
 const limit=Math.min(offset+225*5+1,data.length);
 while(pos<limit){
  const type=data[pos];
  if(type===0)return count>=2; // terminated; need at least laser+target
  if(pos+5>limit)return false; // incomplete record
  if(type>22)return false;
  if(data[pos+1]>7)return false;  // rotation 0–7
  if(data[pos+2]>7)return false;  // color bitmask 0–7
  if(data[pos+3]>14)return false; // x 0–14
  if(data[pos+4]>14)return false; // y 0–14
  count++;pos+=5;
 }
 return false; // unterminated
}

/* ── Scan-based level discovery (games 2–4) ──────────────────────── */
/**
 * Scan data sections for an array of 32-bit pointers to valid level records.
 * Returns {fileOffset, count, pointers} or null.
 */
export function scanLevelPointers(pe){
 const {data,view,sections,imageBase,toFileOffset}=pe;
 let best=null;
 for(const section of sections){
  if(section.name==='.text'||section.name==='.reloc')continue;
  const start=section.rawPtr,end=Math.min(start+section.rawSize-4,data.length-4);
  for(let off=start;off<=end;off+=4){
   const va=view.getUint32(off,true);
   if(va<imageBase||va>imageBase+0x1000000)continue;
   const loff=toFileOffset(va,6);
   if(loff<0||!isValidLevel(data,loff))continue;
   let count=1;
   for(let next=off+4;next+4<=end+4&&count<200;next+=4){
    const nva=view.getUint32(next,true);
    if(nva<imageBase)break;
    const noff=toFileOffset(nva,6);
    if(noff<0||!isValidLevel(data,noff))break;
    count++;
   }
   if(count>=40&&(!best||count>best.count))
    best={fileOffset:off,count};
   if(count>1)off+=(count-1)*4;
  }
 }
 if(!best)return null;
 const pointers=Array.from({length:best.count},(_,i)=>
  view.getUint32(best.fileOffset+i*4,true));
 return {...best,pointers};
}

/**
 * Scan for a 50-byte level order table (unique indices 0..maxIndex-1).
 * An unrecognized order must not expose unpublished stages.
 */
export function scanLevelOrder(pe,maxIndex){
 const {data,sections}=pe;
 for(const section of sections){
  if(section.name==='.text'||section.name==='.reloc')continue;
  const start=section.rawPtr;
  const end=Math.min(start+section.rawSize-50,data.length-50);
  for(let off=start;off<=end;off++){
   const seen=new Set();
   let valid=true;
   for(let i=0;i<50;i++){
    const v=data[off+i];
    if(v>=maxIndex||seen.has(v)){valid=false;break}
    seen.add(v);
   }
   if(valid&&seen.size===50)
    return Array.from({length:50},(_,i)=>data[off+i]);
  }
 }
 throw Error('Could not identify a playable 50-level order');
}

/**
 * Scan for a text-pointer array near the level-pointer array.
 * Text pointers are dword VAs to null-terminated ASCII strings.
 */
export function scanTextPointers(pe,levelPtrsFileOffset,levelCount){
 const {data,view,imageBase,toFileOffset}=pe;
 // Text pointers are typically in the same section, within 2 KB after level pointers
 const searchStart=levelPtrsFileOffset+levelCount*4;
 const searchEnd=Math.min(searchStart+4096,data.length-4);
 for(let off=searchStart;off<=searchEnd;off+=4){
  let textCount=0;
  for(let i=0;i<levelCount&&off+i*4+4<=data.length;i++){
   const va=view.getUint32(off+i*4,true);
   if(va===0){textCount++;continue} // null text OK
   if(va<imageBase)break;
   const toff=toFileOffset(va,1);
   if(toff<0)break;
   const c=data[toff];
   if(c<32&&c!==0)break; // not printable ASCII
   textCount++;
  }
  if(textCount>=levelCount)return off;
 }
 return -1;
}

/* ── Profile-based extraction (known addresses) ──────────────────── */
function extractWithProfile(pe,profile){
 const {readByte,readPointer,readAscii}=pe;
 const level_order=Array.from({length:profile.playable},(_,i)=>
  readByte(profile.levelOrderVA+i));
 if(new Set(level_order).size!==profile.playable)
  throw new Error('Invalid or unsupported original level order');
 const total=Math.max(...level_order)+1;
 if(total>profile.maxLevels)
  throw new Error('Unexpected original level count');
 const levels=Array(total).fill(null);
 for(const i of level_order){
  const gridPtr=readPointer(profile.levelPtrsVA+i*4);
  const textPtr=readPointer(profile.textPtrsVA+i*4);
  const text=textPtr?readAscii(textPtr):'';
  const pieces=[];
  for(let k=0;k<=225;k++){
   const type=readByte(gridPtr+k*5);
   if(type===0)break;
   if(k===225)throw new Error('Unterminated original level '+i);
   if(type>22)throw new Error('Unexpected optical record in original level '+i);
   pieces.push({type,rotation:readByte(gridPtr+k*5+1),
    color:readByte(gridPtr+k*5+2),
    x:readByte(gridPtr+k*5+3),y:readByte(gridPtr+k*5+4)});
  }
  if(!pieces.length)throw Error('Empty original level');
  const name=profile.namePtrsVA?readAscii(readPointer(profile.namePtrsVA+i*4)):'';
  levels[i]={text,name,pieces};
 }
 return {levels,level_order};
}

/* ── Scan-based extraction (games 2–4 or unknown versions) ───────── */
function extractByScan(pe){
 const ptrs=scanLevelPointers(pe);
 if(!ptrs)throw new Error('Could not locate Chromatron level data in this executable. '+
  'Ensure the file is a decompressed (upx -d) Chromatron game.');
 const {data,view,toFileOffset}=pe;
 const levels=[];
 for(let i=0;i<ptrs.count;i++){
  const gridOff=toFileOffset(ptrs.pointers[i],6);
  if(gridOff<0)throw new Error('Bad level pointer at index '+i);
  const pieces=[];
  for(let k=0;k<225;k++){
   const pos=gridOff+k*5;
   if(pos>=data.length)break;
   const type=data[pos];
   if(type===0)break;
   if(type>22)throw new Error('Unexpected record in scanned level '+i);
   pieces.push({type,rotation:data[pos+1],color:data[pos+2],
    x:data[pos+3],y:data[pos+4]});
  }
  levels.push({text:'',pieces});
 }
 // Try to recover level text strings
 const textOff=scanTextPointers(pe,ptrs.fileOffset,ptrs.count);
 if(textOff>=0){
  for(let i=0;i<ptrs.count;i++){
   const off=textOff+i*4;
   if(off+4>data.length)break;
   const va=view.getUint32(off,true);
   if(!va)continue;
   const toff=toFileOffset(va,1);
   if(toff<0)continue;
   const out=[];
   for(let j=0;j<512&&toff+j<data.length;j++){
    const c=data[toff+j];if(c===0)break;
    out.push(c>=32&&c<=126?String.fromCharCode(c):' ');
   }
   levels[i].text=out.join('');
  }
 }
 const level_order=scanLevelOrder(pe,ptrs.count);
 return {levels,level_order};
}

/* ── Public API ──────────────────────────────────────────────────── */

/** Backward-compatible: extract Chromatron 1 only (known addresses). */
export function extractChromatron1Executable(bytes){
 return extractWithProfile(parsePE32(bytes),KNOWN_PROFILES[1]);
}

/**
 * Unified multi-game extractor. Tries known profiles first, then
 * falls back to scan-based discovery for games 2–4.
 * @param {ArrayBuffer|Uint8Array} bytes  Decompressed PE32 executable
 * @param {object} [options]
 * @param {number} [options.game]  Hint: which game (1–4) this executable is
 * @returns {{levels,level_order,detectedGame:number}}
 */
export function extractChromatronExecutable(bytes,{game}={}){
 const pe=parsePE32(bytes);
 // If caller knows the game and we have a profile, use it directly
 if(game&&KNOWN_PROFILES[game]){
  try{return {...extractWithProfile(pe,KNOWN_PROFILES[game]),detectedGame:game}}catch{}
 }
 // Try all known profiles
 for(const [g,profile] of Object.entries(KNOWN_PROFILES)){
  try{return {...extractWithProfile(pe,profile),detectedGame:Number(g)}}
  catch{}
 }
 // Fall back to scan-based extraction for unknown versions
 return {...extractByScan(pe),detectedGame:game||0};
}
