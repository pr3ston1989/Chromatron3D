import test from 'node:test';
import assert from 'node:assert/strict';
import {SPACE_BIOMES} from '../src/world-biomes.js';
import {deckSurfaceProfile,deckCellFinish} from '../src/deck-finishes.js';

test('each biome has distinct tile metal/roughness and physically valid materials',()=>{
 const profiles=SPACE_BIOMES.map(theme=>deckSurfaceProfile(theme.decor));
 assert.equal(new Set(profiles.map(p=>p.tileRoughness)).size,4);
 for(const p of profiles){
  for(const v of Object.values(p))
   assert.ok(Number.isFinite(v)&&v>=0&&v<=1);
 }
 assert.ok(deckSurfaceProfile('moss').tileRoughness>deckSurfaceProfile('ice').tileRoughness);
 assert.ok(deckSurfaceProfile('moss').tileMetalness<deckSurfaceProfile('scrap').tileMetalness);
});

test('every biome gets repeatable per-cell coloring with variation across levels',()=>{
 const palettes=[];
 for(const biome of SPACE_BIOMES){
  const map=Array.from({length:15*15},(_,i)=>
   deckCellFinish(biome,'demo',4,241,i%15,Math.floor(i/15)));
  const repeat=Array.from({length:15*15},(_,i)=>
   deckCellFinish(biome,'demo',4,241,i%15,Math.floor(i/15)));
  assert.deepEqual(map,repeat);
  const colors=new Set(map.map(x=>x.tileColor));
  const seamColors=new Set(map.map(x=>x.lineColor));
  assert.ok(colors.size>70,'patina breaks the uniform checkerboard');
  assert.ok(seamColors.size>30,'inlaid seams have subtle irregular wear');
  for(const cell of map){
   assert.ok(Number.isInteger(cell.tileColor)&&cell.tileColor>=0&&cell.tileColor<=0xffffff);
   assert.ok(Number.isInteger(cell.lineColor)&&cell.lineColor>=0&&cell.lineColor<=0xffffff);
  }
  const other=Array.from({length:15*15},(_,i)=>
   deckCellFinish(biome,'demo',5,241,i%15,Math.floor(i/15)));
  assert.notDeepEqual(map,other,'new levels have different patina distributions');
  palettes.push(map.map(x=>x.tileColor));
 }
 assert.equal(new Set(palettes.map(p=>p.join(','))).size,4,'biomes remain distinct');
});

test('decoration stays on tile surfaces without changing the logical board shape',()=>{
 const theme=SPACE_BIOMES[1];
 for(const [x,y] of [[0,0],[14,14],[0,7],[7,14],[7,7]]){
  assert.ok(deckCellFinish(theme,'demo',0,0,x,y));
 }
 for(const [x,y] of [[-1,5],[15,5],[4,-1],[4,15],[2.5,6]])
  assert.throws(()=>deckCellFinish(theme,'demo',0,0,x,y),/Invalid deck cell/);
});
