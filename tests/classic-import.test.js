import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSIC_TYPE_NAMES,classicColorToWeb,classicPieceToWeb,convertClassicPack,convertClassicCollection,loadLevelBundle} from '../src/classic-import.js';
import {trace} from '../src/optics.js';

test('classic numeric type and original RGB bitmasks become web 15x15 coordinates',()=>{
 assert.equal(CLASSIC_TYPE_NAMES[3],'mirror');
 assert.equal(CLASSIC_TYPE_NAMES[10],'target');
 assert.equal(CLASSIC_TYPE_NAMES[9],'tangler');
 assert.deepEqual(classicPieceToWeb({type:3,x:7,y:8,rotation:5,color:4}),['mirror',7,8,5,1]);
 assert.deepEqual([1,2,3,4,5,6,7].map(classicColorToWeb),[4,2,6,1,5,3,7]);
 assert.throws(()=>classicPieceToWeb({type:99,x:7,y:7,color:0,rotation:0}),/Unknown/);
 assert.throws(()=>classicPieceToWeb({type:2,x:15,y:7,color:4,rotation:0}),/15×15/);
});
function fixture(){
 const levels=Array.from({length:3},(_,i)=>({text:'Test level '+i,
  pieces:[{type:2,x:2,y:7,rotation:2,color:4},
   {type:10,x:12,y:7,rotation:0,color:4}]}));
 return {levels,level_order:Array.from({length:50},(_,i)=>i%3)};
}
test('classic 50-level sequence uses original level_order instead of raw storage indices',()=>{
 const pack=convertClassicPack(fixture(),{game:1});
 assert.equal(pack.length,50);
 assert.equal(pack[0].title.en,'CHROMATRON 1 — 01');
 assert.equal(pack[49].title.en,'CHROMATRON 1 — 50');
 assert.deepEqual(pack[0].pieces[0],['laser',2,7,2,1]);
 assert.equal(pack[0].startMovablesInTray,true);
 const parts=pack[0].pieces.map(([type,x,y,rot,color],id)=>({id,type,x,y,rot,color}));
 assert.equal(trace(parts).won,true);
});
test('local multi-file imports combine games in selected original order',()=>{
 const collection=convertClassicCollection([{game:1,data:fixture()},{game:3,data:fixture()}]);
 assert.equal(collection.length,100);
 assert.match(collection[50].title.pl,/CHROMATRON 3/);
 assert.deepEqual(loadLevelBundle({packs:[{game:1,data:fixture()}]}).length,50);
 assert.deepEqual(loadLevelBundle([{
  title:'Custom',pieces:[['laser',1,1,2,1],['target',4,1,0,1]]
 }]).length,1);
 assert.throws(()=>convertClassicCollection([{game:1,data:fixture()},{game:1,data:fixture()}]),/Duplicate/);
 assert.throws(()=>convertClassicPack({levels:[{pieces:[]}]},{strict:true}),/50/);
});
