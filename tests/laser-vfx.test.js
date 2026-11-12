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


test('performance mode caps dynamic beam lighting without changing laser geometry',async()=>{
 const {renderLaserFX}=await import('../src/laser-vfx.js');
 const point=(x,y,height)=>new THREE.Vector3(x*1.3,height,y*1.3);
 const segments=Array.from({length:12},(_,i)=>({x:i,y:0,nx:i+1,ny:0,color:4}));
 const pieces=[{id:1,type:'laser',x:0,y:0,rot:2,color:4,inTray:false},
  {id:2,type:'target',x:12,y:0,rot:0,color:4,inTray:false}];
 const received=new Map([[2,4]]),colors=['#000','#f36','#4f7','#ff0','#69f','#f6f','#6ff','#fff'];
 const low=new THREE.Group(),high=new THREE.Group();
 const a=renderLaserFX(THREE,low,segments,pieces,received,colors,point,{maxBeamLights:1,maxOpticLights:1});
 const b=renderLaserFX(THREE,high,segments,pieces,received,colors,point,{maxBeamLights:4,maxOpticLights:9});
 assert.equal(a.geometryStats.drawCalls,b.geometryStats.drawCalls);
 assert.ok(a.geometryStats.drawCalls<=4,'one wavelength uses <=4 batched geometry calls');
 assert.ok(a.dynamicLightCount<=2,'performance mode keeps <=2 point lights');
 assert.ok(b.dynamicLightCount>a.dynamicLightCount,'cinematic mode has richer light response');
 assert.equal(low.children.filter(c=>c.isPoints).length,1,'animated photons remain a single GPU layer');
});
