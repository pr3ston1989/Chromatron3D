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
export function mountRealMirror(THREE,head,resolution=160,illumination){
 let coating;
 head.traverse(node=>{if(node.material?.name==='Silvered aperture')coating=node});
 if(!coating)return null;
 head.updateWorldMatrix(true,true);
 const transform=head.matrixWorld.clone().invert().multiply(coating.matrixWorld);
 const geometry=coating.geometry.clone().applyMatrix4(transform);
 geometry.computeBoundingBox();
 const center=geometry.boundingBox.getCenter(new THREE.Vector3());
 const normal=new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('normal'),0).normalize();
 // Reflector clips against its local +Z. Flatten the actual silver insert
 // into that space, then restore its pose just in front of the opaque film.
 const orientation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
 const pose=new THREE.Matrix4().compose(center,orientation,new THREE.Vector3(1,1,1));
 geometry.applyMatrix4(pose.invert());
 const size=Math.max(64,Math.min(512,Math.round(resolution)));
 const reflector=new Reflector(geometry,{textureWidth:size,textureHeight:size,
  clipBias:.003,color:0xc6dbe6,multisample:0});
 reflector.name='dynamic-planar-mirror';
 reflector.position.copy(center).addScaledVector(normal,.002);
 reflector.quaternion.copy(orientation);
 reflector.userData.isOpticalReflection=true;
 illumination?.apply(reflector.material);
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
