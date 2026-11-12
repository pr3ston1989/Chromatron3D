import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSelectionReticle} from '../src/selection-reticle.js';

test('selection is four small precision brackets, never a large glowing torus',()=>{
 const world=new THREE.Group();
 const selected=createSelectionReticle(THREE,world,(x,y,h)=>new THREE.Vector3(x,h,y),1.3);
 selected.setPiece({id:42,x:4,y:7,inTray:false});
 assert.equal(selected.root.visible,true);
 assert.equal(selected.root.userData.pieceId,42);
 assert.equal(selected.root.children.filter(c=>c.name==='selection-corner').length,4);
 assert.equal(selected.root.children.some(c=>c.geometry?.type==='TorusGeometry'),false);
 selected.update(200,false);
 selected.setPiece(null);
 assert.equal(selected.root.visible,false);
 selected.dispose();assert.equal(world.children.length,0);
});
test('the selectable reticle never appears over an optic in the tray',()=>{
 const scene=new THREE.Group();
 const r=createSelectionReticle(THREE,scene,(x,y,h)=>new THREE.Vector3(x,h,y),1.3);
 r.setPiece({id:5,x:9,y:2,inTray:true});
 assert.equal(r.root.visible,false);
 r.dispose();
});
