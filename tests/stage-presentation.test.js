import test from 'node:test';
import assert from 'node:assert/strict';
import {SPACE_BIOMES,environmentForLevel} from '../src/world-biomes.js';
import {stageEntryMode,stagePresentation} from '../src/stage-presentation.js';
import {t} from '../src/i18n.js';

test('opening a solved or resumed stage has a meaningful distinct label',()=>{
 assert.equal(stageEntryMode(),'new');
 assert.equal(stageEntryMode({restored:true}),'resume');
 assert.equal(stageEntryMode({completed:true}),'replay');
 assert.equal(stageEntryMode({restored:true,completed:true}),'resume');
});

test('each environment label and color matches the real game biome',()=>{
 const seen=new Set();
 for(const theme of SPACE_BIOMES){
  const pl=stagePresentation(theme,'pl','new');
  const en=stagePresentation(theme,'en','resume');
  assert.equal(pl.biome,theme.id);
  assert.equal(pl.biomeLabel,theme.pl);
  assert.equal(en.biomeLabel,theme.en);
  assert.match(pl.accent,/^#[0-9a-f]{6}$/);
  assert.equal(pl.accent,en.accent,'switching language must not change the palette');
  assert.ok(t('pl',pl.statusKey).length>2);
  assert.ok(t('en',en.statusKey).length>2);
  seen.add(pl.accent);
 }
 assert.equal(seen.size,SPACE_BIOMES.length);
});

test('atlas previews and level entry resolve the same shuffled biome',()=>{
 for(let index=0;index<32;index++){
  const preview=environmentForLevel('demo',index,387);
  const entry=environmentForLevel('demo',index,387);
  assert.deepEqual(stagePresentation(preview,'pl'),stagePresentation(entry,'pl'));
 }
});

test('invalid themes and transition modes fail safely',()=>{
 assert.throws(()=>stagePresentation(null,'en'),/Invalid stage presentation/);
 assert.throws(()=>stagePresentation({id:'x',edge:0x1000000},'pl'),/Invalid stage presentation/);
 assert.throws(()=>stagePresentation(SPACE_BIOMES[0],'en','unrecognized'),/Invalid stage presentation/);
});
