import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildLaboratory} from '../src/world-art.js';
import {SPACE_BIOMES} from '../src/world-biomes.js';

test('orbital board is rounded, floating, and has no old corner towers',()=>{
 const scene=new THREE.Scene(),world=new THREE.Group();scene.add(world);
 const stage=buildLaboratory(THREE,scene,world,1.3);
 assert.equal(stage.parent,world);
 const names=[];
 stage.traverse(mesh=>names.push(mesh.name));
 assert.ok(names.includes('rounded-deck-shoulder'));
 assert.ok(names.includes('chamfered-middle-hull'));
 assert.ok(names.includes('floating-lower-keel'));
 assert.ok(names.includes('low-profile-corner-vent'));
 assert.equal(names.some(n=>/pillar|tall-corner/i.test(n)),false);
 const shoulder=stage.children.find(c=>c.name==='rounded-deck-shoulder');
 assert.ok(shoulder.geometry.type.includes('BufferGeometry')||shoulder.geometry.type==='BoxGeometry');
 const dock=scene.children.find(c=>c.name==='distant-orbital-architecture');
 assert.ok(dock);
 const hover=dock.children.find(c=>c.name==='suspended-docking-arc');
 assert.ok(hover);
 stage.userData.setTheme(SPACE_BIOMES[1]);
 const strips=stage.children.filter(c=>c.name==='recessed-side-light');
 assert.equal(strips.length,4);
 assert.equal(strips[0].material.color.getHex(),SPACE_BIOMES[1].edge);
});
