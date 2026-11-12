/**
 * Original Chromatron / Reborn environmental artwork, deliberately independent
 * from puzzle logic. The 15x15 logical grid remains unchanged.
 */
export function buildLaboratory(THREE, scene, world, tileSize=1.3) {
 const group=new THREE.Group();
 group.name='Spectral chamber environment';
 world.add(group);
 const shell=new THREE.MeshStandardMaterial({color:0x162a3b,metalness:.72,roughness:.32});
 const shellLight=new THREE.MeshStandardMaterial({color:0x324d61,metalness:.76,roughness:.25});
 const graphite=new THREE.MeshStandardMaterial({color:0x0b1625,metalness:.78,roughness:.38});
 const cyan=new THREE.MeshStandardMaterial({color:0x5de7ed,emissive:0x11bedc,emissiveIntensity:.58,roughness:.25});
 const amber=new THREE.MeshStandardMaterial({color:0xffbf78,emissive:0xff9933,emissiveIntensity:1.1,roughness:.28});
 const make=(geometry,material,x,y,z,rotationY=0)=>{
  const m=new THREE.Mesh(geometry,material);
  m.position.set(x,y,z);m.rotation.y=rotationY;group.add(m);
  return m;
 };
 // Industrial plinth, visually lifting the optical puzzle above the room.
 make(new THREE.BoxGeometry(22.3,.65,22.3),graphite,0,-1.32,0);
 make(new THREE.BoxGeometry(21.9,.18,21.9),shellLight,0,-.94,0);
 // Four perimeter light strips: bright enough to define the playable boundary.
 for(const side of [-1,1]){
  make(new THREE.BoxGeometry(21,.09,.095),cyan,0,-.16,side*10.08);
  make(new THREE.BoxGeometry(.095,.09,21),cyan,side*10.08,-.16,0);
  make(new THREE.BoxGeometry(21,.075,.18),shellLight,0,-.27,side*10.24);
  make(new THREE.BoxGeometry(.18,.075,21),shellLight,side*10.24,-.27,0);
  make(new THREE.BoxGeometry(20.1,.1,.065),amber,0,-1.05,side*11.05);
  make(new THREE.BoxGeometry(.065,.1,20.1),amber,side*11.05,-1.05,0);
 }
 // Readable bevels and luminous hardware distinguish the corners of the grid.
 for(const x of [-10.2,10.2])for(const z of [-10.2,10.2]){
  const pedestal=make(new THREE.CylinderGeometry(.55,.67,.52,8),shell,x,-.45,z);
  pedestal.rotation.y=Math.PI/8;
  make(new THREE.CylinderGeometry(.33,.37,.15,12),shellLight,x,-.10,z);
  const cap=make(new THREE.CylinderGeometry(.22,.22,.085,16),amber,x,.045,z);
  cap.rotation.y=Math.PI/8;
 }
 // Subtle edge tick marks make board scale and geometry easier to perceive.
 for(let i=-7;i<=7;i++){
  const p=i*tileSize;
  make(new THREE.BoxGeometry(.45,.025,.035),i%5===0?amber:cyan,p,.014,-9.95);
  make(new THREE.BoxGeometry(.035,.025,.45),i%5===0?amber:cyan,-9.95,.014,p);
 }
 // Room architecture outside the puzzle platform; not decorative on the board.
 const beams=new THREE.Group();scene.add(beams);
 const distant=new THREE.MeshStandardMaterial({color:0x0e2338,metalness:.75,roughness:.42});
 for(const [x,z] of [[-17,-15],[17,-15],[-17,15],[17,15]]){
  const pillar=new THREE.Mesh(new THREE.BoxGeometry(1.15,13,1.15),distant);
  pillar.position.set(x,4,z);beams.add(pillar);
  const rail=new THREE.Mesh(new THREE.BoxGeometry(.16,11.5,.16),cyan);
  rail.position.set(x+.65,4,z+.65);beams.add(rail);
 }
 const hemi=new THREE.HemisphereLight(0xbbebff,0x243448,.65);scene.add(hemi);
 for(const [x,z,color] of [[-10,-9,0x50dcff],[10,10,0xffa45d]]){
  const light=new THREE.PointLight(color,12,24,2);
  light.position.set(x,4,z);scene.add(light);
 }

 // A quiet, reflective physical room rather than an empty black void.
 // Low contrast preserves focus on the actual puzzle grid.
 const floorMat=new THREE.MeshStandardMaterial({
  color:0x0b1927,metalness:.57,roughness:.37,side:THREE.DoubleSide
 });
 const chamberFloor=new THREE.Mesh(new THREE.PlaneGeometry(85,85),floorMat);
 chamberFloor.rotation.x=-Math.PI/2;
 chamberFloor.position.y=-2.25;scene.add(chamberFloor);
 const circleMaterial=new THREE.MeshBasicMaterial({
  color:0x376b8e,transparent:true,opacity:.20,depthWrite:false,side:THREE.DoubleSide
 });
 for(const [inner,outer] of [[14.7,14.76],[18.3,18.37],[24.5,24.56]]){
  const arc=new THREE.Mesh(new THREE.RingGeometry(inner,outer,128),circleMaterial);
  arc.rotation.x=-Math.PI/2;
  arc.position.y=-2.20;
  scene.add(arc);
 }
 const guideMaterial=new THREE.MeshBasicMaterial({color:0x2e6382,transparent:true,opacity:.29,depthWrite:false});
 for(const offset of [-25,-17,17,25]){
  const strip=new THREE.Mesh(new THREE.BoxGeometry(.048,.01,54),guideMaterial);
  strip.position.set(offset,-2.18,0);scene.add(strip);
  const cross=new THREE.Mesh(new THREE.BoxGeometry(54,.01,.048),guideMaterial);
  cross.position.set(0,-2.18,offset);scene.add(cross);
 }
 const underlight=new THREE.PointLight(0x2f84ad,9,18,2);
 underlight.position.set(0,-1.45,0);scene.add(underlight);
 return group;
}
