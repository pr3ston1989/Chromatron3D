import test from 'node:test';
import assert from 'node:assert/strict';
import {opticIcon} from '../src/optic-icons.js';

test('all optics have recognizable self-contained SVG silhouettes',()=>{
 for(const type of ['laser','mirror','wall','target','filter','prism','splitter','bender','doppler','tangler','conduit','teleporter']){
  const svg=opticIcon(type);
  assert.match(svg,/^<svg /);
  assert.match(svg,/aria-hidden="true"/);
  assert.ok(svg.includes('path')||svg.includes('circle')||svg.includes('rect'));
  assert.match(svg,/<\/svg>$/);
 }
});
test('laser and mirror look visually distinct',()=>{
 assert.notEqual(opticIcon('laser'),opticIcon('mirror'));
 assert.notEqual(opticIcon('mirror'),opticIcon('wall'));
});
