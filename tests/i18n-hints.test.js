import test from 'node:test';
import assert from 'node:assert/strict';
import {t,loc,normalizeLanguage,LANGUAGES} from '../src/i18n.js';
import {clampHints,nextHint,hintFor,progressKey} from '../src/hints.js';
import {PROTOTYPE_LEVELS,validateLevels} from '../src/levels.js';

test('Polish and English are supported with a safe fallback',()=>{
 assert.deepEqual(LANGUAGES,['pl','en']);
 assert.equal(normalizeLanguage('pl'),'pl');
 assert.equal(normalizeLanguage('en'),'en');
 assert.equal(normalizeLanguage('xx'),'pl');
 assert.equal(t('pl','hintButton'),'PODPOWIEDŹ');
 assert.equal(t('en','hintButton'),'HINT');
});
test('localized level fields fallback gracefully',()=>{
 assert.equal(loc({pl:'Cześć',en:'Hello'},'pl'),'Cześć');
 assert.equal(loc({en:'Hello'},'pl'),'Hello');
 assert.equal(loc('Universal','en'),'Universal');
});
test('three-step hints are bounded and progressive',()=>{
 assert.equal(clampHints(-3),0);
 assert.equal(clampHints(99),3);
 assert.equal(nextHint(2),3);
 assert.equal(nextHint(3),3);
 assert.equal(progressKey(4),'chromatron-reborn-hints-4');
});
test('prototype puzzles carry bilingual, authored hints',()=>{
 const levels=validateLevels(PROTOTYPE_LEVELS);
 for(const level of levels){
  for(let i=1;i<=3;i++){
   const pl=hintFor(level,'pl',i),en=hintFor(level,'en',i);
   assert.ok(pl.body.length>15);
   assert.ok(en.body.length>15);
   assert.equal(pl.step,i);
  }
 }
});
test('an unverified imported puzzle gets generic advice, not a fabricated next move',()=>{
 const level={title:{en:'Unknown'},hints:[]};
 assert.equal(hintFor(level,'en',1).body,t('en','hintFallback1'));
 assert.equal(hintFor(level,'pl',3).body,t('pl','hintFallback3'));
});
