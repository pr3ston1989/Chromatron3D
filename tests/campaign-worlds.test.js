import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignWorld, CAMPAIGN_WORLDS, scenerySeed} from '../src/campaign-worlds.js';

test('all campaign worlds have 25 classic stages and one public demo example',()=>{
 const counts=new Map();
 for(let game=1;game<=4;game++)for(let i=0;i<50;i++){
  const world=campaignWorld('classic'+game,i);
  counts.set(world.id,(counts.get(world.id)??0)+1);
 }
 assert.deepEqual([...counts.values()],Array(8).fill(25));
 const demos=Array.from({length:8},(_,i)=>campaignWorld('demo',i).id);
 assert.equal(new Set(demos).size,CAMPAIGN_WORLDS.length);
 assert.equal(demos[7],'shipyard');
 assert.equal(campaignWorld('classic4',50),null);
 assert.equal(campaignWorld('imported',7),null);
});

test('a return to a stage provides the same placement seed',()=>{
 assert.equal(scenerySeed('classic2',23),scenerySeed('classic2',23));
 assert.notEqual(scenerySeed('classic2',23),scenerySeed('classic2',24));
 assert.notEqual(scenerySeed('classic2',23),scenerySeed('classic3',23));
});
