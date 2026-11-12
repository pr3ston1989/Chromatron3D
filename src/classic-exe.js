/**
 * Local extractor for a user's OWN, UNPACKED Chromatron 1.14 Win32 executable.
 *
 * It reads only the documented legacy PE32 address tables and returns the
 * intermediate format consumed by classic-import.js. No game data or original
 * executables are stored in the web application.
 *
 * The freely distributed original .exe is UPX-packed. Users must decompress a
 * copy locally (e.g. upx -d chromatron.exe) before this parser can read the
 * embedded 5-byte puzzle records. Other Chromatron versions and games 2–4
 * use different offsets and are intentionally rejected until separately
 * verified against their original binaries.
 */
export function extractChromatron1Executable(bytes){
 const data=bytes instanceof ArrayBuffer?new Uint8Array(bytes):
  ArrayBuffer.isView(bytes)?new Uint8Array(bytes.buffer,bytes.byteOffset,bytes.byteLength):null;
 if(!data||data.length<1024)throw new Error('Expected a Win32 PE32 executable');
 const view=new DataView(data.buffer,data.byteOffset,data.byteLength);
 const byte=(offset)=>{if(offset<0||offset>=data.length)throw new Error('Binary address outside file');return data[offset]};
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
 if(sections.some(s=>s.name.startsWith('UPX')))
  throw new Error('UPX-packed original detected. Decompress your own copy with upx -d first.');
 function fileOffset(va,length=1){
  const rva=va-imageBase;
  const section=sections.find(s=>rva>=s.rva&&rva+length<=s.rva+s.rawSize);
  if(!section)throw new Error('Missing Chromatron 1 address 0x'+va.toString(16));
  const offset=section.rawPtr+rva-section.rva;
  if(offset<0||offset+length>data.length)throw new Error('Truncated original game data');
  return offset;
 }
 const readByte=va=>byte(fileOffset(va));
 const readPointer=va=>u32(fileOffset(va,4));
 const readAscii=va=>{
  const out=[];
  for(let i=0;i<512;i++){
   const c=readByte(va+i);
   if(c===0)break;
   out.push(c>=32&&c<=126?String.fromCharCode(c):' ');
  }
  return out.join('');
 };
 // Chromatron 1.14: game level # to internal level index, 50 bytes.
 const level_order=Array.from({length:50},(_,i)=>readByte(0x0040b168+i));
 if(new Set(level_order).size!==50)throw new Error('Invalid or unsupported original level order');
 const total=Math.max(...level_order)+1;
 if(total>120)throw new Error('Unexpected original level count');
 const levels=[];
 for(let i=0;i<total;i++){
  const gridPtr=readPointer(0x0040e65c+i*4);
  const textPtr=readPointer(0x0040e758+i*4);
  const text=textPtr?readAscii(textPtr):'';
  const pieces=[];
  for(let k=0;k<225;k++){
   const type=readByte(gridPtr+k*5);
   if(type===0)break;
   if(type>12)throw new Error('Unexpected optical record in original level '+i);
   pieces.push({
    type,rotation:readByte(gridPtr+k*5+1),
    color:readByte(gridPtr+k*5+2),
    x:readByte(gridPtr+k*5+3),y:readByte(gridPtr+k*5+4)
   });
   if(k===224)throw new Error('Unterminated original level '+i);
  }
  levels.push({text,pieces});
 }
 return {levels,level_order};
}
