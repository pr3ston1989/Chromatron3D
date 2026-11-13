import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLevelAtlas} from '../src/level-atlas.js';

test('new packs start at level one with subsequent levels locked',()=>{
 const atlas=buildLevelAtlas(50);
 assert.equal(atlas.total,50);
 assert.equal(atlas.unlockedCount,1);
 assert.equal(atlas.solvedCount,0);
 assert.deepEqual(atlas.entries.slice(0,3).map(x=>x.status),
  ['available','locked','locked']);
 assert.equal(atlas.entries[49].unlocked,false);
});
test('solving and paid skipping reveal the next puzzle but remain distinct',()=>{
 const atlas=buildLevelAtlas(8,[0],[1]);
 assert.deepEqual(atlas.entries.slice(0,4).map(x=>x.status),
  ['solved','skipped','available','locked']);
 assert.equal(atlas.solvedCount,1);
 assert.equal(atlas.skippedCount,1);
 assert.equal(atlas.unlockedCount,3);
});
test('completed levels remain selectable and cannot duplicate awards',()=>{
 const atlas=buildLevelAtlas(5,[0,0,2,300,-1,1.5],[1,1,0,NaN]);
 assert.equal(atlas.entries[0].status,'solved','solve overrides skip');
 assert.equal(atlas.entries[1].status,'skipped');
 assert.equal(atlas.entries[2].status,'solved');
 assert.equal(atlas.entries[3].status,'available');
 assert.equal(atlas.entries[4].status,'locked');
 assert.equal(atlas.solvedCount,2);
 assert.equal(atlas.skippedCount,1);
});
test('earlier player access is preserved, bounded and pack-scoped',()=>{
 const oldDemo=buildLevelAtlas(8,[],[],6);
 assert.equal(oldDemo.unlockedCount,7);
 assert.equal(oldDemo.entries[6].status,'available');
 assert.equal(oldDemo.entries[7].status,'locked');
 const freshImport=buildLevelAtlas(50);
 assert.equal(freshImport.unlockedCount,1);
 assert.equal(buildLevelAtlas(2,[],[],999).unlockedCount,2);
 assert.equal(buildLevelAtlas(2,[],[],-100).unlockedCount,1);
 assert.equal(buildLevelAtlas(3,[],[],NaN).unlockedCount,1);
 assert.throws(()=>buildLevelAtlas(0),/1–250/);
});
