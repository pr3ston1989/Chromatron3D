import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENIC_CAMERA,snapshotPuzzleCamera,scenicCameraDistance} from '../src/scenic-view-state.js';

test('a scene panorama stores the exact previous view without changing the puzzle',()=>{
 const original={zoomTarget:37.2,boardFocus:false,yaw:-.82,pitch:1.17,cameraTop:true};
 const saved=snapshotPuzzleCamera(original);
 assert.deepEqual(saved,original);
 assert.notEqual(saved,original);
 assert.equal(SCENIC_CAMERA.distance,60);
 assert.ok(SCENIC_CAMERA.pitch<1.1,'more of the distant horizon is visible');
 assert.equal(saved.zoomTarget,37.2);
 assert.equal(saved.cameraTop,true);
 assert.throws(()=>snapshotPuzzleCamera({zoomTarget:NaN,yaw:0,pitch:1}),/Invalid camera/);
});

test('panoramic distance ignores board-focus magnification but normal view preserves it',()=>{
 const d=44,focus=.86,portrait=1.7;
 assert.equal(scenicCameraDistance(d,1,focus,false),44*focus);
 assert.equal(scenicCameraDistance(d,1,focus,true),44);
 assert.equal(scenicCameraDistance(d,portrait,focus,false),d*portrait*focus);
 assert.equal(scenicCameraDistance(d,portrait,focus,true),d*portrait);
 assert.ok(SCENIC_CAMERA.distance>44);
});
