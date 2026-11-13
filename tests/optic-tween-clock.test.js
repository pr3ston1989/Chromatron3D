import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {applyOpticTween,enqueueOpticTween} from '../src/optic-tween-clock.js';

function fakeSchedule(){
 const tasks=[];
 return {tasks,schedule:(callback,delay)=>tasks.push({callback,delay})};
}
test('animation frame and fallback settle hardware to exactly the same pose',()=>{
 const a=new THREE.Object3D(),footprint=new THREE.Object3D();
 const tween={kind:'rotate',object:a,footprint,from:.4,to:Math.PI*.85,duration:225};
 applyOpticTween(tween,.6);
 assert.ok(a.rotation.y>.4&&a.rotation.y<tween.to);
 assert.equal(footprint.rotation.y,a.rotation.y);
 const tweens=[],clock=fakeSchedule();
 enqueueOpticTween(tweens,tween,clock.schedule);
 assert.equal(clock.tasks[0].delay,275);
 clock.tasks[0].callback();
 assert.equal(a.rotation.y,tween.to);
 assert.equal(footprint.rotation.y,tween.to);
 assert.equal(tweens.length,0);
});
test('fallback ignores a cancelled transition and never overrides a new one',()=>{
 const model=new THREE.Object3D(),clock=fakeSchedule(),tweens=[];
 const old={kind:'rotate',object:model,from:0,to:.5,duration:200};
 const current={kind:'rotate',object:model,from:.2,to:1.1,duration:250};
 enqueueOpticTween(tweens,old,clock.schedule);
 tweens.splice(0,1);
 enqueueOpticTween(tweens,current,clock.schedule);
 clock.tasks[0].callback();
 assert.equal(tweens.length,1);
 assert.equal(model.rotation.y,0);
 clock.tasks[1].callback();
 assert.equal(model.rotation.y,1.1);
});
test('move and appearance finish when frames are suspended',()=>{
 const moved=new THREE.Object3D(),newborn=new THREE.Object3D();
 const clock=fakeSchedule(),tweens=[];
 const to=new THREE.Vector3(4,2,-3);
 enqueueOpticTween(tweens,{kind:'move',object:moved,from:new THREE.Vector3(),to,duration:100},clock.schedule);
 enqueueOpticTween(tweens,{kind:'appear',object:newborn,toY:.4,duration:130},clock.schedule);
 clock.tasks.forEach(task=>task.callback());
 assert.ok(moved.position.equals(to));
 assert.equal(newborn.position.y,.4);
 assert.equal(newborn.scale.x,1);
 assert.equal(tweens.length,0);
});
