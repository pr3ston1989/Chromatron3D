import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildLaboratory,stageLayoutForLevel} from '../src/world-art.js';
import {SPACE_BIOMES} from '../src/world-biomes.js';

test('station layouts are deterministic, varied, and never reduce the playable board',()=>{
 const designs=Array.from({length:4},(_,index)=>
  stageLayoutForLevel('verdant','private-pack',index,2026));
 assert.equal(new Set(designs.map(d=>d.orientation)).size,4);
 assert.deepEqual(designs,Array.from({length:4},(_,index)=>
  stageLayoutForLevel('verdant','private-pack',index,2026)));
 assert.ok(designs.every(d=>d.arcCount>=1&&d.arcCount<=3));
 assert.ok(designs.every(d=>d.dockCount>=1&&d.dockCount<=4));
 assert.throws(()=>stageLayoutForLevel('orbital','pack',-1),/Invalid stage index/);
});

test('the same cached stage changes architecture without blocking 15x15 optics',()=>{
 const scene=new THREE.Scene(),world=new THREE.Group();
 scene.add(world);
 const stage=buildLaboratory(THREE,scene,world,1.3);
 const structure=scene.children.find(c=>c.name==='distant-orbital-architecture');
 assert.ok(structure);
 const firstCount=structure.children.length,sceneCount=scene.children.length;
 const arcs=structure.children.filter(c=>c.name==='suspended-docking-arc');
 const decks=structure.children.filter(c=>c.name==='distant-floating-dock');
 const insets=structure.children.filter(c=>c.name==='dock-surface');
 const markers=structure.children.filter(c=>c.name==='dock-marker');
 assert.equal(arcs.length,3);
 assert.equal(decks.length,4);
 assert.equal(insets.length,4);
 assert.equal(markers.length,4);
 for(let i=0;i<32;i++){
  const theme=SPACE_BIOMES[i%SPACE_BIOMES.length];
  const context={packId:'demo',index:i,seed:241};
  stage.userData.setTheme(theme,context);
  const layout=stageLayoutForLevel(theme.id,context.packId,context.index,context.seed);
  assert.deepEqual(stage.userData.stageLayout,layout);
  assert.equal(arcs.filter(x=>x.visible).length,layout.arcCount);
  for(const parts of [decks,insets,markers])
   assert.equal(parts.filter(x=>x.visible).length,layout.dockCount);
  assert.ok(Math.abs(structure.rotation.y-layout.orientation*Math.PI/2)<1e-9);
  assert.equal(structure.children.length,firstCount);
  assert.equal(scene.children.length,sceneCount);
  for(const dock of decks)
   assert.ok(Math.hypot(dock.position.x,dock.position.z)>19,
    'remote docking structure stays far outside logical board');
 }
});
