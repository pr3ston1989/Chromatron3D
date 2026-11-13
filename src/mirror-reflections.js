import {Reflector} from 'three/addons/objects/Reflector.js';

/**
 * True dynamic planar reflection of the actual Three.js scene.
 * Optical logic remains in optics.js: this is exclusively a visual surface.
 *
 * Mirror head coordinates:
 *   bright reflective FRONT faces local -X,
 *   dark opaque BACK faces local +X,
 *   rot 0 runs north-south (Z).
 */
export function mountRealMirror(THREE,head,resolution=160){
 const size=Math.max(64,Math.min(512,Math.round(resolution)));
 const reflector=new Reflector(new THREE.PlaneGeometry(1.045,.92),{
  textureWidth:size,
  textureHeight:size,
  clipBias:.003,
  color:0xbfd6e3,
  multisample:0
 });
 reflector.name='dynamic-planar-mirror';
 // PlaneGeometry's normal is +Z. -90 degrees around Y makes it -X.
 // Its front aligns exactly with the physical silvered mirror front.
 reflector.rotation.y=-Math.PI/2;
 reflector.position.set(-.139,.065,0);
 reflector.userData.isOpticalReflection=true;
 head.add(reflector);
 return reflector;
}
/** Drain WebGLRenderTarget memory when optics are rebuilt. */
export function disposeReflectionTargets(group){
 let n=0;
 group.traverse(object=>{
  if(!object.isReflector)return;
  // The scene collector disposes geometry/material; Reflector owns an
  // additional offscreen render target that must be released explicitly.
  object.getRenderTarget()?.dispose();
  n++;
 });
 return n;
}
