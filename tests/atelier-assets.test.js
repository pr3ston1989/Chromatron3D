import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLASSIC_TYPE_NAMES} from '../src/classic-pieces.js';

function gltf(path){
 const data=readFileSync(new URL('../public/models/'+path+'.glb',import.meta.url));
 return JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)));
}

test('the playable Blender models have matching, distinct transparent equipment portraits',()=>{
 const portraits=new Set();
 for(const kind of CLASSIC_TYPE_NAMES.slice(1)){
  const data=readFileSync(new URL('../public/portraits/'+kind+'.png',import.meta.url));
  assert.equal(data.readUInt32BE(16),128);
  assert.equal(data.readUInt32BE(20),128);
  assert.equal(data[25],6,'RGBA');
  portraits.add(data.toString('base64'));
 }
 assert.equal(portraits.size,22);
 const mirror=gltf('optics/mirror'),splitter=gltf('optics/splitter');
 assert.ok(mirror.materials.some(m=>m.name==='silvered glass'));
 assert.ok(splitter.materials.some(m=>m.name==='amber enamel'));
 assert.notDeepEqual(mirror.meshes,splitter.meshes);
});

test('near-rim models fit the board clearance and the deck uses one UV-mapped cell',()=>{
 for(const theme of ['verdant','orbital','polar','nebula']){
  const model=gltf('terraces/'+theme);
  const landmark={verdant:'windwheel',orbital:'tracking-dish',polar:'observatory-dome',nebula:'orrery'}[theme];
  assert.ok(model.nodes.some(n=>n.name===landmark&&n.translation));
  const flora=gltf('terraces/'+theme+'-flora');
  assert.deepEqual(flora.nodes.map(n=>n.name).sort(),['feature','growth','stone']);
  assert.ok(flora.meshes.every(m=>m.primitives.length===1&&Number.isInteger(m.primitives[0].attributes.COLOR_0)));
  const terrain=model.meshes.find(m=>m.name==='terrace-'+theme);
  for(const prim of terrain.primitives){
   const bounds=model.accessors[prim.attributes.POSITION];
   assert.ok(12.5-1.4*Math.max(Math.abs(bounds.min[2]),bounds.max[2])>10.5);
  }
 }
 const tile=gltf('board-cell').meshes[0].primitives;
 assert.equal(tile.length,1);
 assert.ok(Number.isInteger(tile[0].attributes.TEXCOORD_0));
});
