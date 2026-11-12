import test from 'node:test';
import assert from 'node:assert/strict';
import {initialLanguage,translations,translateLevelField} from '../src/i18n.js';
import {hintsForLevel,revealHint} from '../src/hints.js';
test('language is detected from browser preference with stored override',()=>{
 const store={getItem:()=>null};
 assert.equal(initialLanguage(store,'pl-PL'),'pl');
 assert.equal(initialLanguage(store,'en-US'),'en');
 assert.equal(initialLanguage({getItem:()=> 'en'},'pl-PL'),'en');
});
test('all main UI keys have Polish and English translations',()=>{
 for(const key of Object.keys(translations.en))assert.ok(translations.pl[key],key);
});
test('localized level metadata respects fallback',()=>{
 assert.equal(translateLevelField({pl:'Cześć',en:'Hello'},'pl'),'Cześć');
 assert.equal(translateLevelField({en:'Hello'},'pl'),'Hello');
});
test('hints reveal progressively and never overrun',()=>{
 const a=revealHint({},0,'pl',0);
 assert.equal(a.hints.length,1);assert.equal(a.remaining,2);
 const b=revealHint({},0,'pl',99);
 assert.equal(b.hints.length,3);assert.equal(b.remaining,0);
});
test('imported levels cannot receive fabricated puzzle hints',()=>{
 assert.deepEqual(hintsForLevel({title:'Unknown'},0,'en',false),[]);
 assert.deepEqual(hintsForLevel({hints:{pl:['Pomyśl','Spróbuj']}},0,'pl',false),['Pomyśl','Spróbuj']);
});
