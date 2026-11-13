import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createBeamPerimeter} from './beam-perimeter.js';

/** Stable, decorative variations for the platform's distant architecture. */
export function stageLayoutForLevel(themeId,packId='demo',index=0,seed=0){
 if(!Number.isInteger(index)||index<0)throw new Error('Invalid stage index');
 const text=String(packId)+':'+seed+':'+index;
 let hash=2166136261;
 for(const c of text){
  hash^=c.charCodeAt(0);
  hash=Math.imul(hash,16777619);
 }
 const layout=(hash>>>0)%4;
 // The greener biomes feel abandoned; orbital environments keep active
 // docking structures. All meshes are cached and well outside the board.
 const density={
  orbital:[[3,4],[3,3],[2,4],[2,3]],
  verdant:[[1,1],[1,2],[2,1],[2,2]],
  polar:[[2,2],[2,3],[1,3],[1,2]],
  nebula:[[2,2],[3,2],[2,3],[3,3]]
 }[themeId]||[[3,4],[3,3],[2,4],[2,3]];
 return {orientation:layout,arcCount:density[layout][0],dockCount:density[layout][1]};
}

/**
 * The stage is a FLOATING OPTICAL INSTRUMENT, not a square grid ending
 * abruptly between four glowing pillars. All decorations are outside the
 * 15×15 interactive grid and are excluded from raycasts.
 *
 * Reusable textures and four atmospheric themes are controlled externally by
 * world-biomes.js; no stage geometry is recreated between levels.
 */
export function buildLaboratory(THREE,scene,world,tileSize=1.3){
 const group=new THREE.Group();
 group.name='Floating optical laboratory architecture';
 world.add(group);
 const beamPerimeter=createBeamPerimeter(THREE,group,tileSize);
 group.userData.beamPerimeter=beamPerimeter;
 const hull=new THREE.MeshStandardMaterial({color:0x142b3c,metalness:.78,roughness:.31});
 const structural=new THREE.MeshStandardMaterial({color:0x324e61,metalness:.79,roughness:.3});
 const underside=new THREE.MeshStandardMaterial({color:0x081522,metalness:.68,roughness:.42});
 const accent=new THREE.MeshStandardMaterial({
  color:0x54c9e5,emissive:0x1d8cb3,emissiveIntensity:.66,metalness:.38,roughness:.24
 });
 const markerMat=new THREE.MeshStandardMaterial({
  color:0xc19a61,emissive:0x6e481f,emissiveIntensity:.42,metalness:.42,roughness:.34
 });
 const soft=new THREE.MeshBasicMaterial({color:0x4c90af,transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide});
 const add=(geometry,material,x,y,z,name,container=group)=>{
  const m=new THREE.Mesh(geometry,material);
  m.name=name;m.position.set(x,y,z);container.add(m);return m;
 };
 // Recessed rounded armor plates give the grid a graded rather than a
 // clipped edge. The top logical 15x15 board remains untouched.
 add(new RoundedBoxGeometry(21.9,.28,21.9,4,.22),
  structural,0,-.94,0,'rounded-deck-shoulder');
 add(new RoundedBoxGeometry(23.1,.38,23.1,4,.32),
  hull,0,-1.25,0,'chamfered-middle-hull');
 add(new RoundedBoxGeometry(24.25,.24,24.25,4,.23),
  underside,0,-1.49,0,'floating-lower-keel');
 add(new RoundedBoxGeometry(25.0,.1,25.0,3,.09),
  structural,0,-1.64,0,'bottom-metal-rim');
 add(new RoundedBoxGeometry(24.1,.07,24.1,3,.035),
  accent,0,-1.69,0,'diffuse-keel-luminescence');
 // Perimeter inlaid lights live lower than optics, not on their sight lines.
 for(const side of [-1,1]){
  add(new RoundedBoxGeometry(21.6,.043,.055,3,.018),
   accent,0,-.44,side*10.67,'recessed-side-light');
  add(new RoundedBoxGeometry(.055,.043,21.6,3,.018),
   accent,side*10.67,-.44,0,'recessed-side-light');
  add(new RoundedBoxGeometry(21.9,.042,.06,2,.015),
   markerMat,0,-1.38,side*11.7,'lower-safety-seam');
  add(new RoundedBoxGeometry(.06,.042,21.9,2,.015),
   markerMat,side*11.7,-1.38,0,'lower-safety-seam');
 }
 // Corner vents / flush hardware replace the old tall luminous pillars.
 for(const sx of [-1,1])for(const sz of [-1,1]){
  const plate=add(new RoundedBoxGeometry(.67,.08,.67,3,.04),
   structural,sx*10.15,-.23,sz*10.15,'low-profile-corner-vent');
  plate.rotation.y=Math.PI/4;
  const light=add(new THREE.BoxGeometry(.24,.014,.025),
   accent,sx*10.15,-.177,sz*10.15,'corner-status-led');
  light.rotation.y=Math.PI/4;
 }
 // The grid boundary has small engraved ticks; clear enough to orient the
 // board, never tall enough to obstruct the optical rays.
 for(let i=-7;i<=7;i++){
  const u=i*tileSize;
  add(new THREE.BoxGeometry(.30,.013,.025),i%5===0?markerMat:accent,
   u,-.198,-10.22,'scale-engraving');
  add(new THREE.BoxGeometry(.025,.013,.30),i%5===0?markerMat:accent,
   -10.22,-.198,u,'scale-engraving');
 }
 // Low outer docking arcs suggest a larger inhabited orbital structure
 // without surrounding the player with an unfinished 4-post cage.
 const architecture=new THREE.Group();
 architecture.name='distant-orbital-architecture';
 scene.add(architecture);
 const distant=new THREE.MeshStandardMaterial({color:0x102b39,metalness:.72,roughness:.40});
 const arcs=[];
 for(const radius of [16.3,20.8,27.0]){
  const geometry=new THREE.TorusGeometry(radius,radius===16.3?.11:.055,8,100,Math.PI*1.65);
  const arc=add(geometry,distant,0,-2.92,0,'suspended-docking-arc',architecture);
  arc.rotation.x=Math.PI/2;
  arc.rotation.z=radius*.07;
  arcs.push(arc);
 }
 // Structural plates suspended well outside gameplay, mostly horizontal.
 const docks=[];
 for(const [x,z,angle] of [[-17,-18,.64],[19,-16,-.55],[-19,18,-.35],[18,19,.83]]){
  const deck=add(new RoundedBoxGeometry(4.5,.36,2.8,3,.18),
   hull,x,-2.35,z,'distant-floating-dock',architecture);
  deck.rotation.y=angle;
  const inset=add(new RoundedBoxGeometry(3.6,.035,2.1,2,.012),
   structural,x,-2.13,z,'dock-surface',architecture);
  inset.rotation.y=angle;
  const strip=add(new RoundedBoxGeometry(3.7,.025,.065,2,.012),
   accent,x,-2.10,z,'dock-marker',architecture);
  strip.rotation.y=angle;
  docks.push([deck,inset,strip]);
 }
 // An underside halo fades smoothly into the void, without a giant 85×85
 // ground plane blocking the sky and making a hard horizon.
 const floorHalo=add(new THREE.RingGeometry(13.3,31.3,120),
  soft,0,-3.12,0,'subplatform-diffuse-halo',architecture);
 floorHalo.rotation.x=-Math.PI/2;
 const hemi=new THREE.HemisphereLight(0xc7efff,0x243448,.58);
 scene.add(hemi);
 const workLightA=new THREE.PointLight(0x50dcff,9,25,2);
 workLightA.position.set(-11,3,-10);scene.add(workLightA);
 const workLightB=new THREE.PointLight(0xffae79,5,23,2);
 workLightB.position.set(11,3,10);scene.add(workLightB);
 const bounce=new THREE.PointLight(0x2f84ad,7,20,2);
 bounce.position.set(0,-1.72,0);scene.add(bounce);
 // Changing a level never creates meshes: only the composition and palette
 // of the distant scaffolding change. It is deliberately non-interactive.
 group.userData.setTheme=(theme,level={})=>{
  if(!theme)return;
  const layout=stageLayoutForLevel(theme.id,level.packId,level.index??0,level.seed??0);
  beamPerimeter.setTheme(theme);
  architecture.rotation.y=layout.orientation*Math.PI/2;
  arcs.forEach((arc,i)=>arc.visible=i<layout.arcCount);
  docks.forEach((parts,i)=>parts.forEach(mesh=>mesh.visible=i<layout.dockCount));
  group.userData.stageLayout=layout;
  accent.color.setHex(theme.edge);
  accent.emissive.setHex(theme.edge);
  markerMat.color.setHex(theme.accent);
  markerMat.emissive.setHex(theme.accent);
  soft.color.setHex(theme.nebula);
  workLightA.color.setHex(theme.edge);
  workLightB.color.setHex(theme.accent);
  bounce.color.setHex(theme.edge);
 };
 return group;
}
