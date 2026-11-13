import test from 'node:test';
import assert from 'node:assert/strict';
import {QUALITY_MODES,normalizeQuality,profileFor,reflectionCandidates,nextAutoProfile} from '../src/visual-quality.js';
test('quality profiles are finite and ordered by GPU cost',()=>{
 assert.deepEqual(QUALITY_MODES,['auto','performance','balanced','cinematic']);
 assert.equal(normalizeQuality('wrong'),'auto');
 assert.equal(profileFor('auto').reflectorCount,1);
 assert.equal(profileFor('performance').reflectorCount,0);
 assert.ok(profileFor('cinematic').reflectionSize>profileFor('balanced').reflectionSize);
 assert.ok(profileFor('cinematic').pixelRatio>profileFor('balanced').pixelRatio);
 assert.ok(profileFor('performance').maxBeamLights<profileFor('balanced').maxBeamLights);
 assert.ok(profileFor('balanced').maxBeamLights<=profileFor('cinematic').maxBeamLights);
 assert.ok(profileFor('performance').maxOpticLights<profileFor('cinematic').maxOpticLights);
});
test('a selected mirror gets the real reflection before other mirrors',()=>{
 const a={type:'mirror',id:1,inTray:false},b={type:'mirror',id:2,inTray:false},c={type:'mirror',id:3,inTray:true};
 assert.deepEqual(reflectionCandidates([a,b,c],b,1),[b]);
 assert.deepEqual(reflectionCandidates([a,b,c],b,2),[b,a]);
 assert.deepEqual(reflectionCandidates([a,b,c],b,0),[]);
 assert.deepEqual(reflectionCandidates([a,b,c],c,2),[a,b]);
});
test('automatic downgrade and recovery need sustained evidence',()=>{
 assert.equal(nextAutoProfile('balanced',2,0),'balanced');
 assert.equal(nextAutoProfile('balanced',3,0),'performance');
 assert.equal(nextAutoProfile('performance',0,11),'performance');
 assert.equal(nextAutoProfile('performance',0,12),'balanced');
});
