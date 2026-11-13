import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * A continuous, readable physical edge for the optical instrument:
 * 60 matte absorption panels, 60 protected collector lips, four reinforced
 * corner joints and sparse structural buttresses. All cached and instanced.
 *
 * The ray-tracer's logical last cell is at ±7*T. Its board boundary is the
 * near face of the collector, exactly at ±7.5*T (half a tile further).
 * Perimeter meshes never enter the 15x15 grid and are not raycast targets.
 */
export const ABSORBER_PANELS_PER_SIDE=15;
export const ABSORBER_HEIGHT=.96;
export function createBeamPerimeter(THREE,parent,tileSize=1.3){
 const half=tileSize*7.5;
 const group=new THREE.Group();
 group.name='continuous-beam-absorber-perimeter';
 group.userData.scenicOnly=true;
 parent.add(group);
 const outer=new THREE.MeshStandardMaterial({
  color:0x263e52,metalness:.68,roughness:.44,flatShading:false
 });
 const black=new THREE.MeshStandardMaterial({
  color:0x111c2a,metalness:.23,roughness:.86,
  emissive:0x194259,emissiveIntensity:.18
 });
 const trim=new THREE.MeshStandardMaterial({
  color:0x65cce1,emissive:0x26798c,emissiveIntensity:.34,
  metalness:.43,roughness:.37
 });
 const panels=new THREE.InstancedMesh(
  new RoundedBoxGeometry(tileSize*1.004,.96,.29,2,.06),
  outer,ABSORBER_PANELS_PER_SIDE*4
 );
 panels.name='optical-perimeter-armor';
 panels.frustumCulled=false;panels.userData.scenicOnly=true;
 group.add(panels);
 const collectors=new THREE.InstancedMesh(
  new RoundedBoxGeometry(tileSize*1.01,.38,.13,2,.045),
  black,ABSORBER_PANELS_PER_SIDE*4
 );
 collectors.name='laser-absorber-contact-surfaces';
 collectors.frustumCulled=false;collectors.userData.scenicOnly=true;
 group.add(collectors);
 const guide=new THREE.InstancedMesh(
  new RoundedBoxGeometry(tileSize*.82,.036,.065,2,.015),
  trim,ABSORBER_PANELS_PER_SIDE*4
 );
 guide.name='absorber-guide-lights';
 guide.frustumCulled=false;guide.userData.scenicOnly=true;
 group.add(guide);
 const dummy=new THREE.Object3D();
 const tintA=new THREE.Color(),tintB=new THREE.Color();
 for(let side=0;side<4;side++){
  for(let cell=0;cell<15;cell++){
   const index=side*15+cell,along=(cell-7)*tileSize;
   const horizontal=side<2,sign=side%2===0?-1:1;
   const azimuth=horizontal?0:Math.PI/2;
   const anchor=sign*(half+.145);
   // Back of each plate is outside the board. The mathematical inward face
   // is exactly ±7.5 * tileSize; the red/blue laser contacts this surface.
   dummy.position.set(horizontal?along:anchor,.20,
    horizontal?anchor:along);
   dummy.rotation.set(0,azimuth,0);
   dummy.scale.setScalar(1);
   dummy.updateMatrix();panels.setMatrixAt(index,dummy.matrix);
   dummy.position.set(horizontal?along:sign*(half+.065),.77,
    horizontal?sign*(half+.065):along);
   dummy.updateMatrix();collectors.setMatrixAt(index,dummy.matrix);
   dummy.position.set(horizontal?along:sign*(half+.10),1.005,
    horizontal?sign*(half+.10):along);
   dummy.updateMatrix();guide.setMatrixAt(index,dummy.matrix);
   // Distinct 5-cell modules, without random trash on the rim.
   const warm=(cell%5===0);
   panels.setColorAt(index,tintA.setHex(warm?0xbed4d7:0x7b9cae));
   collectors.setColorAt(index,tintB.setHex(warm?0xb8cad3:0xe4eff0));
  }
 }
 for(const mesh of [panels,collectors,guide]){
  mesh.instanceMatrix.needsUpdate=true;
  mesh.instanceColor&&(mesh.instanceColor.needsUpdate=true);
 }
 const cornerGeo=new RoundedBoxGeometry(.59,1.18,.59,3,.12);
 const corners=[];
 for(const sx of [-1,1])for(const sz of [-1,1]){
  const m=new THREE.Mesh(cornerGeo,outer);
  m.name='armored-beam-absorber-corner';
  m.userData.scenicOnly=true;
  m.position.set(sx*(half+.17),.25,sz*(half+.17));
  group.add(m);corners.push(m);
 }
 // Thick clips at the 5-cell intervals create a purposeful repeated design
 // rather than the tiny disconnected "confetti" props from older versions.
 const brace=new THREE.InstancedMesh(new THREE.BoxGeometry(.36,.78,.5),
  outer,4*4);
 brace.name='optical-absorber-support-ribs';
 brace.userData.scenicOnly=true;brace.frustumCulled=false;
 let rib=0;
 for(let side=0;side<4;side++)for(let k=0;k<4;k++){
  const along=(k*5-7.5)*tileSize;
  const horizontal=side<2,sign=side%2===0?-1:1;
  dummy.position.set(horizontal?along:sign*(half+.47),.0,
   horizontal?sign*(half+.47):along);
  dummy.rotation.set(0,horizontal?0:Math.PI/2,0);
  dummy.scale.setScalar(1);dummy.updateMatrix();brace.setMatrixAt(rib++,dummy.matrix);
 }
 brace.instanceMatrix.needsUpdate=true;group.add(brace);
 function setTheme(theme){
  if(!theme)return;
  outer.color.setHex(theme.tileA);outer.needsUpdate=true;
  black.emissive.setHex(theme.fog);
  trim.color.setHex(theme.edge);
  trim.emissive.setHex(theme.edge);
 }
 function getStats(){
  return {segments:panels.count,collectors:collectors.count,
   guideLights:guide.count,structuralRibs:brace.count,corners:corners.length,
   boundary:half,beamHeight:.78};
 }
 return {group,setTheme,getStats};
}
