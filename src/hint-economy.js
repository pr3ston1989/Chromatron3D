/**
 * Local-only hint credits. Free first nudge, meaningful paid second/third
 * clues, and one reward for the first genuine solve of each puzzle.
 *
 * Imported packs are content-fingerprinted, preventing accidental progress
 * collisions between separate 50-level collections. No network account,
 * paid currency or microtransaction is involved.
 */
export const START_CREDITS=3;
export const SOLVE_REWARD=5;
export const HINT_COSTS=Object.freeze([0,2,3]);
export function packFingerprint(levels){
 const value=JSON.stringify(levels.map(l=>l.pieces));
 let hash=2166136261;
 for(let i=0;i<value.length;i++){
  hash^=value.charCodeAt(i);
  hash=Math.imul(hash,16777619)>>>0;
 }
 return hash.toString(36);
}
export function stageKey(pack,index){
 if(!pack||!Number.isInteger(index)||index<0)throw new Error('Invalid puzzle key');
 return pack+':'+index;
}
export function normalizeWallet(raw){
 let value=raw;
 try{if(typeof raw==='string')value=JSON.parse(raw)}catch{value=null}
 if(!value||typeof value!=='object')value={};
 return {
  balance:Number.isSafeInteger(value.balance)?Math.max(0,Math.min(100000,value.balance)):START_CREDITS,
  rewarded:Array.isArray(value.rewarded)?
   [...new Set(value.rewarded.filter(s=>typeof s==='string'&&s.length<110))].slice(0,2000):[],
  unlocked:Object.fromEntries(Object.entries(
   value.unlocked&&typeof value.unlocked==='object'&&!Array.isArray(value.unlocked)?value.unlocked:{}
  ).filter(([key])=>key.length<110&&key!=='__proto__')
   .map(([key,v])=>[key,Math.max(0,Math.min(3,Math.trunc(Number(v)||0)))]))
 };
}
export function rewardOnce(wallet,levelId){
 const next=normalizeWallet(wallet);
 if(next.rewarded.includes(levelId))return {wallet:next,awarded:0};
 next.rewarded.push(levelId);
 next.balance+=SOLVE_REWARD;
 return {wallet:next,awarded:SOLVE_REWARD};
}
export function ensurePreviousHints(wallet,levelId,alreadyRevealed){
 const next=normalizeWallet(wallet);
 next.unlocked[levelId]=Math.max(next.unlocked[levelId]||0,
  Math.min(3,Math.max(0,Math.trunc(Number(alreadyRevealed)||0))));
 return next;
}
export function buyNextHint(wallet,levelId){
 const next=normalizeWallet(wallet);
 const previous=next.unlocked[levelId]||0;
 if(previous>=3)return {wallet:next,unlocked:false,cost:0,reason:'complete'};
 const cost=HINT_COSTS[previous];
 if(next.balance<cost)return {wallet:next,unlocked:false,cost,reason:'credits'};
 next.balance-=cost;
 next.unlocked[levelId]=previous+1;
 return {wallet:next,unlocked:true,cost,reason:null,stage:previous+1};
}
