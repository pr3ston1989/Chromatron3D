import test from 'node:test';
import assert from 'node:assert/strict';
import {createWheelRotation,toWheelPixels} from '../src/wheel-rotation.js';

test('mouse wheel rotates one optical step per Windows-style detent',()=>{
 const w=createWheelRotation();
 assert.equal(w.consume(100,0,100),1);
 assert.equal(w.consume(-100,0,400),-1);
});
test('high resolution trackpad scroll accumulates smoothly without missing movement',()=>{
 const w=createWheelRotation();
 for(let i=0;i<6;i++)assert.equal(w.consume(12,0,i*12),0);
 assert.equal(w.consume(12,0,72),1);
 assert.ok(w.pending>=0);
});
test('line and page modes convert to consistent pixel thresholds',()=>{
 assert.equal(toWheelPixels(3,1),96);
 assert.equal(toWheelPixels(-1,2,600),-600);
 const w=createWheelRotation();
 assert.equal(w.consume(3,1,100),1);
 assert.equal(w.consume(-3,1,500),-1);
});
test('quick direction reversal discards latent motion rather than rotating backwards unexpectedly',()=>{
 const w=createWheelRotation();
 assert.equal(w.consume(65,0,0),0);
 assert.equal(w.consume(-15,0,15),0);
 assert.equal(w.consume(-70,0,25),-1);
});
test('stale trackpad leftovers expire and a huge wheel cannot skip many rotations at once',()=>{
 const w=createWheelRotation();
 assert.equal(w.consume(40,0,0),0);
 assert.equal(w.consume(40,0,2500),0);
 assert.equal(w.consume(700,0,2600),2);
 assert.equal(w.consume(7,0,2620),0);
 w.reset();assert.equal(w.pending,0);
});

test('four consecutive 100px wheel detents yield exactly four turns, never five',()=>{
 const w=createWheelRotation();
 const steps=[0,100,200,300].map(t=>w.consume(100,0,t));
 assert.deepEqual(steps,[1,1,1,1]);
 assert.equal(w.pending,0);
 const backward=[400,500,600].map(t=>w.consume(-3,1,t));
 assert.deepEqual(backward,[-1,-1,-1]);
});

test('touchpad ticks spaced by 350ms still accumulate one deliberate turn',()=>{
 const w=createWheelRotation();
 assert.equal(w.consume(-20,0,0),0);
 assert.equal(w.consume(-20,0,350),0);
 assert.equal(w.consume(-20,0,700),0);
 assert.equal(w.consume(-20,0,1050),-1);
});
