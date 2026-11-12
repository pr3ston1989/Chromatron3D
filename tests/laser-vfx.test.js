import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {getLaserFlareTexture} from '../src/laser-vfx.js';

test('laser lens flare texture is allocated once and reused across all wheel steps',()=>{
 const first=getLaserFlareTexture(THREE);
 const second=getLaserFlareTexture(THREE);
 assert.equal(first,second);
 assert.equal(first.image.width,64);
 assert.equal(first.image.height,64);
 assert.ok(first.isDataTexture);
 assert.equal(first.image.data.length,64*64*4);
});
