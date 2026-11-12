import test from 'node:test';
import assert from 'node:assert/strict';
import {clamp01,easeOutCubic,shortestAngle,tweenPosition,travelDuration} from '../src/optic-motion.js';
test('easing always lands exactly on the logical destination',()=>{
 assert.deepEqual(tweenPosition([2,5],[6,9],1),[6,9]);
 assert.deepEqual(tweenPosition([2,5],[6,9],0),[2,5]);
 assert.ok(easeOutCubic(.75)>.75);
 assert.equal(clamp01(-1),0);
});
test('rotations across the 0/7 boundary take the short path',()=>{
 const step=Math.PI/4;
 assert.ok(Math.abs(shortestAngle(-7*step,0)+step)<1e-9);
 assert.ok(Math.abs(shortestAngle(0,-7*step)-step)<1e-9);
});
test('moving farther does not create unbounded animation delay',()=>{
 assert.ok(travelDuration(16)>travelDuration(1));
 assert.ok(travelDuration(500)<=420);
});
