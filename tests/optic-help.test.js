import test from 'node:test';
import assert from 'node:assert/strict';
import {OPTIC_GUIDE,opticDescription,opticExample} from '../src/optic-help.js';

test('all twelve optical devices have Polish and English help text',()=>{
 assert.equal(Object.keys(OPTIC_GUIDE).length,12);
 for(const [type,description] of Object.entries(OPTIC_GUIDE)){
  assert.ok(description.pl.length>38,type+' Polish description');
  assert.ok(description.en.length>38,type+' English description');
  assert.ok(opticDescription(type,'pl'));
  assert.ok(opticDescription(type,'en'));
 }
});
test('Doppler help explains BOTH wavelength shift orders with a worked example',()=>{
 assert.match(opticDescription('doppler','pl'),/czerwony.*zielony.*niebieski/);
 assert.match(opticDescription('doppler','en'),/red.*green.*blue/);
 assert.match(opticExample('doppler','pl'),/czerwony laser/);
 assert.match(opticExample('doppler','en'),/green beam/);
 assert.match(opticDescription('tangler','pl'),/Doppler/);
});
