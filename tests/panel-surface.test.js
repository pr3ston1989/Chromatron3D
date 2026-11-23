import test from 'node:test';
import assert from 'node:assert/strict';
import {MeshStandardMaterial} from 'three';
import {applyPanelSurface} from '../src/panel-surface.js';

test('a late mineral sample cannot replace the current deck, and cached sheets are reused',async()=>{
 const requests=[];
 const THREE={TextureLoader:class{
  loadAsync(url){return new Promise(resolve=>requests.push({url,resolve}))}
 }};
 const deck=new MeshStandardMaterial();
 applyPanelSurface(THREE,deck,'grotto');
 applyPanelSurface(THREE,deck,'shipyard');
 const shader={vertexShader:'#include <worldpos_vertex>',fragmentShader:'#include <color_fragment>',uniforms:{}};
 deck.onBeforeCompile(shader);
 assert.equal(shader.uniforms.panelReady.value,0);
 assert.deepEqual(requests.map(req=>new URL(req.url).pathname.split('/').pop()),['slate.png','alloy.png']);
 const metal={},stone={};
 requests[1].resolve(metal);
 requests[0].resolve(stone);
 await new Promise(done=>setImmediate(done));
 assert.equal(shader.uniforms.panelSample.value,metal);
 assert.equal(shader.uniforms.panelReady.value,1);
 applyPanelSurface(THREE,deck,'sanctuary');
 await new Promise(done=>setImmediate(done));
 assert.equal(shader.uniforms.panelSample.value,stone);
 assert.equal(requests.length,2);
});
