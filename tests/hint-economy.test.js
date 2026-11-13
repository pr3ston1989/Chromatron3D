import test from 'node:test';
import assert from 'node:assert/strict';
import {START_CREDITS,SOLVE_REWARD,HINT_COSTS,packFingerprint,stageKey,normalizeWallet,
 rewardOnce,buyNextHint,ensurePreviousHints} from '../src/hint-economy.js';

test('first hint free, second 2 credits, final 3 credits',()=>{
 let wallet=normalizeWallet(null);
 assert.equal(wallet.balance,START_CREDITS);
 const id=stageKey('demo',0);
 const a=buyNextHint(wallet,id);
 assert.equal(a.unlocked,true);assert.equal(a.cost,HINT_COSTS[0]);
 assert.equal(a.wallet.balance,3);
 const b=buyNextHint(a.wallet,id);
 assert.equal(b.cost,2);assert.equal(b.wallet.balance,1);
 const c=buyNextHint(b.wallet,id);
 assert.equal(c.unlocked,false);assert.equal(c.reason,'credits');
 const d=rewardOnce(b.wallet,'demo:1');
 assert.equal(d.awarded,SOLVE_REWARD);
 const e=buyNextHint(d.wallet,id);
 assert.equal(e.unlocked,true);assert.equal(e.stage,3);
 assert.equal(e.wallet.balance,3);
 assert.equal(buyNextHint(e.wallet,id).reason,'complete');
});
test('resetting or repeating solved puzzles never farms points',()=>{
 let w=normalizeWallet(null);
 const r=rewardOnce(w,'a:0');const rr=rewardOnce(r.wallet,'a:0');
 assert.equal(r.awarded,5);assert.equal(rr.awarded,0);
 assert.equal(rr.wallet.balance,8);
 assert.equal(rewardOnce(rr.wallet,'a:1').awarded,5);
});
test('each original/user-owned pack is independently fingerprinted',()=>{
 const x=[{pieces:[['laser',2,3,0,1]]}],y=[{pieces:[['laser',2,3,0,4]]}];
 assert.notEqual(packFingerprint(x),packFingerprint(y));
 assert.equal(packFingerprint(x),packFingerprint(JSON.parse(JSON.stringify(x))));
 assert.notEqual(stageKey(packFingerprint(x),0),stageKey(packFingerprint(y),0));
});
test('old revealed hints migrate without charging the player again',()=>{
 const id='legacy:0',w=ensurePreviousHints(normalizeWallet(null),id,2);
 assert.equal(w.unlocked[id],2);
 assert.equal(w.balance,3);
 assert.equal(buyNextHint(w,id).stage,3);
});
test('malformed saved wallet cannot create negative credits or unsafe keys',()=>{
 const w=normalizeWallet('{"balance":-40,"rewarded":["ok",2,"ok"],"unlocked":{"x":999,"__proto__":9}}');
 assert.equal(w.balance,0);
 assert.deepEqual(w.rewarded,['ok']);
 assert.equal(w.unlocked.x,3);
 assert.equal(Object.hasOwn(w.unlocked,'__proto__'),false);
});
