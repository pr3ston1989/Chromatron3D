/**
 * The sky is no longer a nearly black background with faint confetti.
 * Color-coded radiant stellar discs (one or two suns depending on the
 * environment and stage) illuminate the composition visually, and a broad
 * coherent arc of chunky 3D asteroids passes through the upper sky.
 *
 * Procedural corona texture, asteroid matrices and shared geometry are
 * created ONCE per biome, never each frame.
 */
export const CELESTIAL_BIOMES=Object.freeze(['orbital','verdant','polar','nebula']);
export const CELESTIAL_BUDGET=Object.freeze({
 performance:Object.freeze({asteroids:46,smallBodies:22}),
 balanced:Object.freeze({asteroids:125,smallBodies:66}),
 cinematic:Object.freeze({asteroids:260,smallBodies:120})
});
export const STELLAR_PALETTES=Object.freeze({
 orbital:Object.freeze([0xffc76e,0x79dfff]),
 verdant:Object.freeze([0xffe4a4,0x7fffd2]),
 polar:Object.freeze([0xf6f8ff,0xff996b]),
 nebula:Object.freeze([0xff8daf,0x79d9ff])
});
// Screen-aligned backdrop sockets in world space, evaluated for the game's
// default oblique camera. Counter-rotation cancels randomized star-sky yaw.
const SUN_ANCHORS=Object.freeze([
 Object.freeze({x:37.85,y:-59.04,z:-81.91,r:4.1}),
 Object.freeze({x:92.41,y:-63.72,z:9.50,r:3.8})
]);
const BELT_CENTRE=Object.freeze({x:47,y:-80,z:-54});
const BASE_CAMERA=Object.freeze({x:-17.31223167,y:39.21312384,z:9.93063709});
const VIEW_F=Object.freeze([.39345981,-.89120736,-.2256963]);
const VIEW_R=Object.freeze([.49757105,0,.86742323]);
const VIEW_U=Object.freeze([.77305396,.45359612,-.44343898]);
const HORIZONTAL_FOV_FACTOR=Math.tan(Math.PI/9)*1.78;
const VERTICAL_FOV_FACTOR=Math.tan(Math.PI/9);
function visualToWorld(x,y,depth){
 const origin=BASE_CAMERA;
 return [
  origin.x+depth*(VIEW_F[0]+VIEW_R[0]*x*HORIZONTAL_FOV_FACTOR+VIEW_U[0]*y*VERTICAL_FOV_FACTOR),
  origin.y+depth*(VIEW_F[1]+VIEW_R[1]*x*HORIZONTAL_FOV_FACTOR+VIEW_U[1]*y*VERTICAL_FOV_FACTOR),
  origin.z+depth*(VIEW_F[2]+VIEW_R[2]*x*HORIZONTAL_FOV_FACTOR+VIEW_U[2]*y*VERTICAL_FOV_FACTOR)
 ];
}
export function makeCoronaTexture(THREE,size=128){
 const bytes=new Uint8Array(size*size*4);
 for(let j=0;j<size;j++)for(let i=0;i<size;i++){
  const x=(i+.5)/size*2-1,y=(j+.5)/size*2-1;
  const r=Math.hypot(x,y),a=Math.atan2(y,x);
  const limb=Math.exp(-r*r*8.4);
  const rays=Math.pow(Math.abs(Math.cos(a*6+Math.sin(a*3)*.28)),22);
  const arms=Math.pow(Math.abs(Math.sin(a*4)),18);
  const corona=Math.exp(-r*3.7)*(.35+.40*rays+.25*arms);
  const alpha=Math.max(0,Math.min(255,Math.round(255*(limb*.80+corona*.70))));
  const p=(j*size+i)*4;
  bytes[p]=255;bytes[p+1]=251;bytes[p+2]=239;bytes[p+3]=alpha;
 }
 const tex=new THREE.DataTexture(bytes,size,size,THREE.RGBAFormat);
 tex.colorSpace=THREE.SRGBColorSpace;
 tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;
 tex.generateMipmaps=false;tex.needsUpdate=true;
 return tex;
}
export function createCelestialVista(THREE,sky,biome,random=()=>.5){
 if(!CELESTIAL_BIOMES.includes(biome))throw new Error('Unknown celestial biome');
 const root=new THREE.Group();root.name='radiant-celestial-vista-'+biome;
 root.userData.scenicOnly=true;sky.add(root);
 const coronaMap=makeCoronaTexture(THREE);
 const colors=STELLAR_PALETTES[biome];
 const suns=SUN_ANCHORS.map((anchor,i)=>{
  const group=new THREE.Group();group.name='radiant-star-'+i;
  group.position.set(anchor.x,anchor.y,anchor.z);
  group.userData.scenicOnly=true;root.add(group);
  const corona=new THREE.Sprite(new THREE.SpriteMaterial({
   map:coronaMap,color:colors[i],transparent:true,opacity:.95,
   blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true,
   fog:false,toneMapped:false
  }));
  corona.name='stellar-corona';corona.scale.setScalar(anchor.r*8.8);
  group.add(corona);
  const inner=new THREE.Sprite(new THREE.SpriteMaterial({
   map:coronaMap,color:0xffffff,transparent:true,opacity:.67,
   blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true,
   fog:false,toneMapped:false
  }));
  inner.name='stellar-white-hot-flare';inner.scale.setScalar(anchor.r*4.8);
  group.add(inner);
  const core=new THREE.Mesh(
   new THREE.SphereGeometry(anchor.r,24,14),
   new THREE.MeshBasicMaterial({color:colors[i],fog:false,toneMapped:false})
  );
  core.name='stellar-photosphere';core.userData.scenicOnly=true;
  group.add(core);
  const center=new THREE.Mesh(new THREE.SphereGeometry(anchor.r*.58,18,12),
   new THREE.MeshBasicMaterial({color:0xfff9ef,fog:false,toneMapped:false}));
  center.name='brilliant-stellar-core';
  // The incandescent inner photosphere must protrude towards the viewer;
  // a concentric smaller sphere would be hidden by the outer opaque shell.
  const facing=new THREE.Vector3(
   BASE_CAMERA.x-anchor.x,BASE_CAMERA.y-anchor.y,BASE_CAMERA.z-anchor.z
  ).normalize().multiplyScalar(anchor.r*.44);
  center.position.copy(facing);
  group.add(center);
  return {group,corona,inner,core};
 });
 // Large rocky near-band and fine distant particulate are two cached draw
 // calls. Asteroids have angular/fragmented silhouettes, not tiny stars.
 const belt=new THREE.Group();belt.name='sweeping-asteroid-belt';root.add(belt);
 const meshMaterials=[new THREE.MeshStandardMaterial({
  color:0xb9b5ad,metalness:.08,roughness:.93,
  emissive:biome==='nebula'?0x914863:biome==='verdant'?0x56866a:
   biome==='polar'?0x5a83a0:0x687c90,
  emissiveIntensity:.40,flatShading:true,fog:false
 }),new THREE.MeshBasicMaterial({
  color:biome==='polar'?0x92bfd9:biome==='nebula'?0xc07e9e:
   biome==='verdant'?0x8fa98d:0x91a0b1,
  fog:false
 })];
 const rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.05,0),meshMaterials[0],260);
 rocks.name='chunky-asteroid-belt-bodies';rocks.userData.scenicOnly=true;
 rocks.frustumCulled=false;belt.add(rocks);
 const fragments=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.53,0),meshMaterials[1],120);
 fragments.name='asteroid-belt-minor-fragments';fragments.userData.scenicOnly=true;
 fragments.frustumCulled=false;belt.add(fragments);
 const dummy=new THREE.Object3D(),tint=new THREE.Color();
 const baseColor=new THREE.Color(meshMaterials[0].color);
 function populate(mesh,count,minor){
  for(let i=0;i<count;i++){
   const t=random()*2.55-1.275;
   const arc=.71+.12*Math.cos(t*2.3)+.06*Math.sin(t*4.5);
   const thickness=(random()-.5)*(minor?.32:.28);
   const depth=(minor?155:110)+random()*(minor?35:32);
   const p=visualToWorld(t,arc+thickness,depth);
   dummy.position.set(...p);
   dummy.rotation.set(random()*Math.PI,random()*Math.PI,random()*Math.PI);
   const large=!minor&&i%15===0;
   const scale=minor?.12+random()*.29:large?2.1+random()*1.4:.35+random()*.79;
   dummy.scale.setScalar(scale);
   dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
   if(!minor)mesh.setColorAt(i,tint.copy(baseColor).multiplyScalar(.74+random()*.52));
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 }
 populate(rocks,260,false);populate(fragments,120,true);
 let quality='balanced',sunCount=2,phase=0,modelSeed=0;
 function setQuality(preset='balanced'){
  quality=CELESTIAL_BUDGET[preset]?preset:'balanced';
  rocks.count=CELESTIAL_BUDGET[quality].asteroids;
  fragments.count=CELESTIAL_BUDGET[quality].smallBodies;
 }
 function setLayout(layoutRandom=()=>.5,skyYaw=0){
  root.rotation.y=-skyYaw;
  modelSeed=layoutRandom();
  sunCount=biome==='orbital'?(modelSeed>.32?2:1):
   biome==='polar'?(modelSeed>.22?2:1):2;
  const both=sunCount===2;
  suns.forEach((sun,i)=>{
   sun.group.visible=i===0||both;
   const anchor=SUN_ANCHORS[i];
   sun.group.position.set(anchor.x+(layoutRandom()-.5)*8,
    anchor.y+(layoutRandom()-.5)*5,
    anchor.z+(layoutRandom()-.5)*7);
  });
  belt.rotation.set(0,0,0);
  // Rotate only very slightly: the band should remain within the camera view.
  phase=(layoutRandom()-.5)*Math.PI;
  belt.rotation.z=phase*.04;
 }
 function update(seconds,reducedMotion=false){
  for(const [i,s] of suns.entries()){
   const v=reducedMotion?1:1+.055*Math.sin(seconds*.37+i*1.9+phase);
   s.corona.scale.setScalar(SUN_ANCHORS[i].r*8.8*v);
   s.corona.material.opacity=reducedMotion?.95:.87+.10*Math.sin(seconds*.24+i*1.1);
   s.inner.material.opacity=reducedMotion?.67:.61+.08*Math.sin(seconds*.31+i*.8);
  }
  belt.rotation.y=reducedMotion?0:.025*Math.sin(seconds*.007+phase);
 }
 function getStats(){
  return {biome,quality,suns:sunCount,
   asteroidBodies:rocks.count,fragments:fragments.count,
   strongCorona:suns[0].corona.material.blending===THREE.AdditiveBlending};
 }
 function dispose(){
  for(const star of suns){
   star.corona.material.dispose();star.inner.material.dispose();
   star.core.geometry.dispose();star.core.material.dispose();
   const center=star.group.getObjectByName('brilliant-stellar-core');
   center.geometry.dispose();center.material.dispose();
  }
  rocks.geometry.dispose();fragments.geometry.dispose();
  meshMaterials.forEach(m=>m.dispose());coronaMap.dispose();sky.remove(root);
 }
 setQuality();
 return {root,setQuality,setLayout,update,getStats,dispose};
}
