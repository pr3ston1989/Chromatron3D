import test from 'node:test';
import assert from 'node:assert/strict';
import {extractChromatron1Executable} from '../src/classic-exe.js';
import {convertClassicPack} from '../src/classic-import.js';
import {trace} from '../src/optics.js';

// Synthetic PE32 fixture: contains NO copyrighted original game code or data.
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
