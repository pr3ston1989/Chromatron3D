import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CAMPAIGN_WORLDS} from '../src/campaign-worlds.js';
import {createCampaignTraffic,trafficProgress} from '../src/campaign-traffic.js';

test('background flybys leave a quiet interval and rail traffic parks in reduced motion',()=>{
 const flight={period:30,duration:10,offset:2};
 const rail={period:18,shuttle:true};
 assert.equal(trafficProgress(3,flight,false),.5);
 assert.equal(trafficProgress(10,flight,false),null);
 assert.equal(trafficProgress(31,flight,false),.3);
 assert.equal(trafficProgress(3,flight,true),null);
 assert.equal(trafficProgress(9,rail,false),1);
 assert.equal(trafficProgress(18,rail,false),0);
 assert.equal(trafficProgress(9,rail,true),0);
});

test('all campaign traffic models load and remain below the active puzzle during their entire route',async()=>{
 const loader=new GLTFLoader();
 const expected=['heliostat','grotto','frost','forge','abyss'];
 const definitions=CAMPAIGN_WORLDS.filter(world=>world.traffic);
 assert.deepEqual(definitions.map(world=>world.id),expected);
 for(const {id,traffic} of definitions){
  const source=await readFile(new URL('../assets/models/scenery/'+traffic.model+'.glb',import.meta.url));
  const asset=await loader.parseAsync(source.buffer.slice(source.byteOffset,source.byteOffset+source.byteLength),'');
  const animated=createCampaignTraffic(THREE,asset.scene,traffic);
  assert.ok(animated.root.children.length>0,id+' has a modeled actor');
  const child=animated.root.children[0],first=new THREE.Matrix4(),next=new THREE.Matrix4();
  animated.update(1,false);child.getMatrixAt(0,first);
  animated.update(3,false);child.getMatrixAt(0,next);
  assert.notDeepEqual(first.toArray(),next.toArray(),id+' moves');
  const sampled=new THREE.Box3();
  for(let t=0;t<traffic.period;t+=.5){
   animated.update(t,false);
   if(!animated.root.visible)continue;
   for(const part of animated.root.children){
    part.geometry.computeBoundingBox();
    for(let i=0;i<part.count;i++){
     part.getMatrixAt(i,next);
     sampled.copy(part.geometry.boundingBox).applyMatrix4(next);
     assert.ok(sampled.max.y<-.6,id+' keeps its moving scenery below the tiles');
    }
   }
  }
  animated.update(9,true);
  assert.equal(animated.root.visible,Boolean(traffic.shuttle));
  if(traffic.shuttle){
   child.getMatrixAt(0,first);
   animated.update(14,true);child.getMatrixAt(0,next);
   assert.deepEqual(first.toArray(),next.toArray(),id+' rail traffic stays at its berth');
  }
 }
});
