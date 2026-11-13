import test from 'node:test';
import assert from 'node:assert/strict';
import {extractChromatron1Executable,extractChromatronExecutable,
 parsePE32,isValidLevel,scanLevelPointers,scanLevelOrder} from '../src/classic-exe.js';
import {convertClassicPack} from '../src/classic-import.js';
import {trace} from '../src/optics.js';

// Synthetic PE32 fixture: contains NO copyrighted original game code or data.
// Creates a minimal PE32 with 50 levels at the Chromatron 1 known addresses.
function peFixture(packed=false){
 const data=new Uint8Array(0xd400);
 const view=new DataView(data.buffer);
 const u16=(i,v)=>view.setUint16(i,v,true);
 const u32=(i,v)=>view.setUint32(i,v,true);
 const pe=0x80,opt=pe+24,section=opt+224;
 const offset=va=>0x200+(va-0x400000)-0xb000;
 data[0]=0x4d;data[1]=0x5a;u32(0x3c,pe);
 u32(pe,0x4550);u16(pe+6,1);u16(pe+20,224);
 u16(opt,0x10b);u32(opt+28,0x400000);
 const name=(packed?'UPX0':'.data').padEnd(8,'\0');
 for(let i=0;i<8;i++)data[section+i]=name.charCodeAt(i);
 u32(section+8,0xd000);u32(section+12,0xb000);
 u32(section+16,0xd000);u32(section+20,0x200);
 for(let i=0;i<50;i++){
  data[offset(0x40b168+i)]=i;
  const grid=0x411000+i*16,text=0x414000+i*40;
  u32(offset(0x40e65c+i*4),grid);
  u32(offset(0x40e758+i*4),text);
  data.set([2,2,4,2,7,10,0,4,12,7,0],offset(grid));
  data.set(new TextEncoder().encode('Synthetic level '+i+'\0'),offset(text));
 }
 return data.buffer;
}

/**
 * Creates a synthetic PE32 with level data at NON-standard addresses,
 * simulating a Chromatron 2–4 executable that requires scan-based extraction.
 */
function scanFixture(){
 const data=new Uint8Array(0x12000);
 const view=new DataView(data.buffer);
 const u16=(i,v)=>view.setUint16(i,v,true);
 const u32=(i,v)=>view.setUint32(i,v,true);
 const pe=0x80,opt=pe+24,section=opt+224;
 data[0]=0x4d;data[1]=0x5a;u32(0x3c,pe);
 u32(pe,0x4550);u16(pe+6,1);u16(pe+20,224);
 u16(opt,0x10b);u32(opt+28,0x400000);
 const sectionName='.data'.padEnd(8,'\0');
 for(let i=0;i<8;i++)data[section+i]=sectionName.charCodeAt(i);
 // .data section at RVA 0xc000, raw offset 0x400, large enough
 u32(section+8,0x11000); // virtualSize
 u32(section+12,0xc000); // rva
 u32(section+16,0x11000); // rawSize
 u32(section+20,0x400);   // rawPtr
 const offset=va=>0x400+(va-0x400000)-0xc000;
 // Place 55 levels at a non-standard address (not 0x40e65c)
 const levelPtrsVA=0x0040f000;
 const levelDataBase=0x00412000;
 const textPtrsVA=levelPtrsVA+55*4+64; // text pointers after level pointers + gap
 const textDataBase=0x00415000;
 for(let i=0;i<55;i++){
  const gridVA=levelDataBase+i*16;
  u32(offset(levelPtrsVA+i*4),gridVA);
  // Each level: laser(2) at (2,7) rot=2 color=4, target(10) at (12,7) rot=0 color=1, terminator
  data.set([2,2,4,2,7, 10,0,1,12,7, 0],offset(gridVA));
  // Text pointers
  const textVA=textDataBase+i*32;
  u32(offset(textPtrsVA+i*4),textVA);
  data.set(new TextEncoder().encode('Scanned lvl '+i+'\0'),offset(textVA));
 }
 // Level order: shuffled 50-entry table (indices into the 55 levels)
 const orderVA=0x0040d000;
 // Fill preceding bytes with 0xFF to prevent off-by-one scanner matches
 for(let j=0;j<8;j++) data[offset(orderVA)-1-j]=0xff;
 for(let i=0;i<50;i++) data[offset(orderVA+i)]=49-i; // reverse order
 return data.buffer;
}

test('unpacked synthetic PE32 puzzle records become a 50-stage original-format pack',()=>{
 const raw=extractChromatron1Executable(peFixture());
 assert.equal(raw.levels.length,50);
 assert.deepEqual(raw.level_order.slice(0,3),[0,1,2]);
 assert.deepEqual(raw.levels[0].pieces[0],{type:2,rotation:2,color:4,x:2,y:7});
 const normalized=convertClassicPack(raw);
 assert.equal(normalized.length,50);
 assert.match(normalized[0].description.en,/Synthetic/);
 const pieces=normalized[1].pieces.map(([type,x,y,rot,color],id)=>({id,type,x,y,rot,color}));
 assert.equal(trace(pieces).won,true);
});
test('compressed game binaries and invalid files fail clearly, not silently',()=>{
 assert.throws(()=>extractChromatron1Executable(new Uint8Array(500)),/PE32/);
 assert.throws(()=>extractChromatron1Executable(peFixture(true)),/UPX-packed/);
 const broken=new Uint8Array(peFixture());broken[0]=0;
 assert.throws(()=>extractChromatron1Executable(broken),/MZ/);
});
test('unified extractor detects game 1 via known profile',()=>{
 const result=extractChromatronExecutable(peFixture());
 assert.equal(result.detectedGame,1);
 assert.equal(result.levels.length,50);
 assert.deepEqual(result.level_order.slice(0,3),[0,1,2]);
});
test('isValidLevel accepts well-formed 5-byte records and rejects garbage',()=>{
 // Valid: laser(2)+target(10)+terminator
 const valid=new Uint8Array([2,2,4,2,7, 10,0,1,12,7, 0]);
 assert.equal(isValidLevel(valid,0),true);
 // Too few pieces (just terminator)
 assert.equal(isValidLevel(new Uint8Array([0]),0),false);
 // One piece (no terminator by end of buffer)
 assert.equal(isValidLevel(new Uint8Array([2,0,0,0,0]),0),false);
 // Invalid type
 assert.equal(isValidLevel(new Uint8Array([15,0,0,0,0,0]),0),false);
 // Invalid x coordinate
 assert.equal(isValidLevel(new Uint8Array([2,0,0,15,0,0]),0),false);
});
test('scan-based extractor finds levels at non-standard addresses',()=>{
 const pe=parsePE32(scanFixture());
 const ptrs=scanLevelPointers(pe);
 assert.ok(ptrs,'scanLevelPointers should find the pointer table');
 assert.ok(ptrs.count>=50,'should find at least 50 level pointers');
 // Full unified extraction via scan fallback (no known profile matches)
 const result=extractChromatronExecutable(scanFixture(),{game:2});
 assert.equal(result.detectedGame,2);
 assert.ok(result.levels.length>=50);
 assert.equal(result.levels[0].pieces.length,2); // laser + target
 assert.equal(result.levels[0].pieces[0].type,2); // laser
 assert.equal(result.levels[0].pieces[1].type,10); // target
});
test('scanLevelOrder finds a unique 50-entry permutation',()=>{
 const pe=parsePE32(scanFixture());
 const order=scanLevelOrder(pe,55);
 assert.equal(order.length,50);
 assert.equal(new Set(order).size,50);
 // Our fixture uses reverse order
 assert.equal(order[0],49);
 assert.equal(order[49],0);
});
