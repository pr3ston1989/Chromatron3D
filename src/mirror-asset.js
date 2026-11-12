import {applyOpticFinish} from './optic-textures.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Procedural, reusable sci-fi optical hardware asset.
 *
 * The front normal is local -X and the mirror lies in the YZ plane.
 * Geometric details never cover the central optical aperture, preserving
 * the planar reflection from mirror-reflections.js.
 *
 * No baked textures, external fonts or undocumented asset dependencies.
 * Can be used in a web build and later exported to glTF for desktop.
 */
export function createMirrorHardware(THREE,head,{bender=false}={}){
 const hardware=new THREE.Group();
 hardware.name=bender?'optic-bender-hardware':'optic-mirror-hardware';
 head.add(hardware);
 const chrome=new THREE.MeshPhysicalMaterial({
  color:0xa8c9df,metalness:.92,roughness:.17,clearcoat:.8,
  clearcoatRoughness:.11,envMapIntensity:1.1
 });
 const darkTitanium=new THREE.MeshStandardMaterial({color:0x15283b,metalness:.78,roughness:.33});
 const brushed=new THREE.MeshStandardMaterial({color:0x425b6c,metalness:.78,roughness:.28});
 const ceramic=new THREE.MeshPhysicalMaterial({color:0x0b1421,metalness:.45,roughness:.47,clearcoat:.38});
 applyOpticFinish(THREE,chrome,'polished');
 applyOpticFinish(THREE,brushed,'brushed');
 applyOpticFinish(THREE,darkTitanium,'brushed');
 const accent=new THREE.MeshBasicMaterial({
  color:bender?0xffb578:0x64cce9,transparent:true,opacity:.75,toneMapped:false
 });
 const add=(geometry,material,x,y,z,name)=>{
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name=name;mesh.position.set(x,y,z);
  hardware.add(mesh);return mesh;
 };
 // The front-facing chrome rails are deliberately OUTSIDE the planar reflector
 // rectangle (z +/- .522, y -.395..+.525); no mesh masks its reflections.
 const rounded=(w,h,d,bevel)=>new RoundedBoxGeometry(w,h,d,3,bevel);
 for(const z of [-.565,.565]){
  add(rounded(.24,1.10,.115,.025),chrome,-.067,.065,z,'chrome-side-rail');
  add(rounded(.065,.96,.041,.012),darkTitanium,-.21,.065,z>0?z+.032:z-.032,'rail-inset');
  add(rounded(.047,.82,.026,.009),accent,-.245,.065,z>0?z+.035:z-.035,'edge-indicator');
 }
 for(const y of [-.48,.61]){
  add(rounded(.23,.088,1.29,.025),brushed,-.078,y,0,'chamfered-end-rail');
  add(rounded(.035,.019,1.08,.008),chrome,-.219,y,0,'chrome-highlight');
 }
 // Top/bottom machined brackets connect the optical plate to the pedestal.
 // Fasteners stay on the outside of the reflective aperture.
 for(const y of [-.43,.55]){
  for(const z of [-.565,.565]){
   add(rounded(.19,.095,.16,.020),darkTitanium,.122,y,z,'mounting-ear');
   const screw=add(new THREE.CylinderGeometry(.035,.035,.018,12),chrome,-.206,y,z,'captive-screw');
   screw.rotation.z=Math.PI/2;
   const groove=add(new THREE.BoxGeometry(.008,.004,.042),ceramic,-.222,y,z,'screw-slot');
   groove.rotation.y=Math.PI/7;
  }
 }
 // Obvious dark, non-reflecting mechanical back. The solver's back face absorbs.
 const rear=add(rounded(.058,.80,.99,.018),ceramic,.167,.07,0,'opaque-carbon-back');
 const spine=add(rounded(.11,.75,.115,.019),brushed,.225,.07,0,'rear-structural-spine');
 spine.rotation.x=0;
 for(const y of [-.22,.07,.36]){
  add(rounded(.033,.045,.72,.008),darkTitanium,.202,y,0,'rear-heat-sink');
 }
 // Machined front/back directional notch on the bracket: visible from above.
 const notch=add(new THREE.ConeGeometry(.073,.19,3),accent,-.113,.63,0,'front-direction-notch');
 notch.rotation.z=-Math.PI/2;
 return hardware;
}
