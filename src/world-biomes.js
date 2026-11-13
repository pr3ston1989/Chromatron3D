/**
 * Lightweight procedural environments for each puzzle. No downloaded skyboxes,
 * copyrighted background images or GPU-heavy simulated vegetation.
 *
 * The active background is chosen from a seeded shuffle-bag. Consecutive
 * levels never share a biome, but a new app session can yield a new sequence.
 * Decorative foliage stays outside the beam volume and is not raycastable.
 */
export const SPACE_BIOMES=Object.freeze([
 Object.freeze({id:'orbital',pl:'Orbitalna stocznia',en:'Orbital shipyard',
  sky:0x0a1b2e,fog:0x0c2032,edge:0x56cce8,accent:0xd9aa67,
  tileA:0x2b465a,tileB:0x263e53,nebula:0x3471ba,planet:0x7292b7,decor:'scrap'}),
 Object.freeze({id:'verdant',pl:'Zarośnięta stacja',en:'Overgrown station',
  sky:0x081c19,fog:0x102b27,edge:0x65c5ae,accent:0xb4c36b,
  tileA:0x354b40,tileB:0x2a4139,nebula:0x4d9e83,planet:0x8abf91,decor:'moss'}),
 Object.freeze({id:'polar',pl:'Lodowe obserwatorium',en:'Frozen observatory',
  sky:0x0a192d,fog:0x112d47,edge:0x94d7f5,accent:0xb6deed,
  tileA:0x314b62,tileB:0x283f56,nebula:0x437dbb,planet:0xb8d5ec,decor:'ice'}),
 Object.freeze({id:'nebula',pl:'Szkarłatna mgławica',en:'Crimson nebula',
  sky:0x1b1027,fog:0x241629,edge:0xdf83b6,accent:0xffb17c,
  tileA:0x4e3650,tileB:0x3e3048,nebula:0x984b88,planet:0xc98e91,decor:'crystal'})
]);
const hashText=(value)=>{
 let hash=2166136261;
 for(const char of String(value)){
  hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);
 }
 return hash>>>0;
};
const rngFrom=(seed)=>{
 let state=(seed>>>0)||0x6d2b79f5;
 return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296};
};
function shuffledSequence(packId,block,salt){
 const random=rngFrom(hashText(packId+':'+block+':'+salt));
 const ids=SPACE_BIOMES.map((_,i)=>i);
 for(let i=ids.length-1;i>0;i--){
  const j=Math.floor(random()*(i+1));
  [ids[i],ids[j]]=[ids[j],ids[i]];
 }
 return ids;
}
export function environmentForLevel(packId,index,salt=0){
 if(!Number.isInteger(index)||index<0)throw new Error('Invalid level for environment');
 const n=SPACE_BIOMES.length,block=Math.floor(index/n);
 const bag=shuffledSequence(packId,block,salt);
 if(block>0){
  const prev=shuffledSequence(packId,block-1,salt);
  if(bag[0]===prev[n-1]){
   const swap=bag.findIndex((id,i)=>i>0&&id!==prev[n-1]);
   [bag[0],bag[swap]]=[bag[swap],bag[0]];
  }
 }
 return SPACE_BIOMES[bag[index%n]];
}
export function makeNebulaTexture(THREE){
 const size=128,data=new Uint8Array(size*size*4);
 const rand=rngFrom(48119),noise=Array.from({length:14*14},rand);
 const bilinear=(u,v)=>{
  const x=u*13,y=v*13,x0=Math.floor(x),y0=Math.floor(y);
  const fx=x-x0,fy=y-y0;
  const get=(ix,iy)=>noise[Math.max(0,Math.min(13,iy))*14+Math.max(0,Math.min(13,ix))];
  return (get(x0,y0)*(1-fx)+get(x0+1,y0)*fx)*(1-fy)+
         (get(x0,y0+1)*(1-fx)+get(x0+1,y0+1)*fx)*fy;
 };
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x+.5)/size,v=(y+.5)/size,dx=u-.5,dy=v-.5;
  const r=Math.hypot(dx*1.03,dy*1.12);
  const cloud=Math.max(0,1-r/.49);
  const noiseValue=bilinear(u,v);
  const filaments=Math.sin(u*24+v*7+noiseValue*5)*.09;
  const a=Math.round(225*Math.pow(cloud,1.6)*Math.max(.15,noiseValue+filaments));
  const p=(y*size+x)*4;
  data[p]=255;data[p+1]=255;data[p+2]=255;data[p+3]=a;
 }
 const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
 t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;
 t.generateMipmaps=false;t.needsUpdate=true;
 return t;
}
function addDebris(THREE,group,random,color){
 const geometry=new THREE.IcosahedronGeometry(.9,0);
 const material=new THREE.MeshStandardMaterial({color,roughness:1,metalness:.16,flatShading:true});
 const mesh=new THREE.InstancedMesh(geometry,material,65);
 mesh.name='environment-distant-asteroids';
 mesh.frustumCulled=false;
 const dummy=new THREE.Object3D();
 for(let i=0;i<65;i++){
  const angle=random()*Math.PI*2,dist=33+random()*58;
  dummy.position.set(Math.cos(angle)*dist,7+random()*24,Math.sin(angle)*dist);
  dummy.rotation.set(random()*6,random()*6,random()*6);
  dummy.scale.setScalar(.38+random()*1.6);
  dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;
 group.add(mesh);
 return mesh;
}
function addSurfacePatches(THREE,group,kind,random){
 const overgrown=kind==='moss';
 const ice=kind==='ice';
 const geometry=overgrown?new THREE.CircleGeometry(.28,7):
  ice?new THREE.ConeGeometry(.095,.28,5):
  kind==='crystal'?new THREE.OctahedronGeometry(.15,0):
   new THREE.TetrahedronGeometry(.16,0);
 const material=new THREE.MeshStandardMaterial({
  color:overgrown?0x4b9161:ice?0x9ebfd8:kind==='crystal'?0xa36b9c:0x647582,
  metalness:overgrown?.0:.26,roughness:overgrown?1:.54,
  transparent:overgrown,opacity:overgrown?.89:1,
  depthWrite:!overgrown,side:THREE.DoubleSide,flatShading:!overgrown
 });
 const mesh=new THREE.InstancedMesh(geometry,material,196);
 mesh.frustumCulled=false;mesh.name='environment-rim-decoration';
 const dummy=new THREE.Object3D();
 for(let i=0;i<196;i++){
  const side=i%4;
  // 80% on the structural rim, 20% small edge-of-tile stains; never in
  // the central optical beam volume or under the 3D devices.
  const rim=i<158;
  const across=(random()-.5)*(rim?20.6:19.2);
  const distance=rim?9.78+random()*.58:9.19+random()*.25;
  const x=side<2?across:(side===2?-distance:distance);
  const z=side<2?(side===0?-distance:distance):across;
  dummy.position.set(x,overgrown?(rim?-.15:.028):rim?-.17:-.025,z);
  dummy.rotation.set(overgrown?-Math.PI/2:random()*.20,random()*Math.PI*2,overgrown?0:random()*.18);
  const scale=overgrown?.25+random()*.85:.45+random()*.85;
  dummy.scale.setScalar(scale);
  dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;
 group.add(mesh);
 const stems=new THREE.Group();group.add(stems);
 if(overgrown){
  const leafGeometry=new THREE.ConeGeometry(.11,.42,4);
  const leafMaterial=new THREE.MeshStandardMaterial({
   color:0x62ab73,roughness:.93,side:THREE.DoubleSide,flatShading:true
  });
  const leaves=new THREE.InstancedMesh(leafGeometry,leafMaterial,128);
  leaves.name='environment-moss-shrubs';
  leaves.frustumCulled=false;
  for(let i=0;i<128;i++){
   const edge=i%4,along=(random()-.5)*20;
   const side=9.86+random()*.34;
   dummy.position.set(edge<2?along:(edge===2?-side:side),
    -.10+random()*.12,edge<2?(edge===0?-side:side):along);
   dummy.rotation.set((random()-.5)*.95,random()*6.28,(random()-.5)*.8);
   dummy.scale.setScalar(.45+random()*.9);
   dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
  }
  leaves.instanceMatrix.needsUpdate=true;
  stems.add(leaves);
 }
 return {mesh,stems};
}
function makeStarfield(THREE,group,theme,random){
 const amount=1000,pos=new Float32Array(amount*3),color=new Float32Array(amount*3);
 const cold=new THREE.Color(theme.edge),warm=new THREE.Color(theme.accent);
 for(let i=0;i<amount;i++){
  const a=random()*Math.PI*2,vertical=(random()-.33)*95,r=46+random()*84;
  pos.set([Math.cos(a)*r,vertical,Math.sin(a)*r],i*3);
  const c=cold.clone().lerp(warm,random()*.65);
  c.multiplyScalar(.44+random()*.7);
  color.set([c.r,c.g,c.b],i*3);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));
 geometry.setAttribute('color',new THREE.BufferAttribute(color,3));
 const material=new THREE.PointsMaterial({
  size:.23,vertexColors:true,transparent:true,opacity:.73,
  sizeAttenuation:true,depthWrite:false,fog:false
 });
 const stars=new THREE.Points(geometry,material);
 stars.name='environment-stars';
 group.add(stars);return stars;
}
function makePlanet(THREE,group,theme,random){
 const palette=new THREE.Color(theme.planet);
 const material=new THREE.MeshStandardMaterial({
  color:palette,roughness:1,metalness:0,flatShading:false,
  emissive:theme.planet,emissiveIntensity:.09
 });
 const radius=6.2+random()*2;
 const planet=new THREE.Mesh(new THREE.SphereGeometry(radius,32,24),material);
 planet.position.set(-42,27,-68);
 planet.name='environment-distant-planet';
 group.add(planet);
 const ringMat=new THREE.MeshBasicMaterial({
  color:theme.edge,transparent:true,opacity:.13,depthWrite:false,
  side:THREE.DoubleSide,fog:false
 });
 const rings=new THREE.Mesh(new THREE.RingGeometry(radius*1.32,radius*1.85,80),ringMat);
 rings.position.copy(planet.position);
 rings.rotation.set(.95,.47,-.28);
 rings.name='environment-planet-rings';group.add(rings);
 return {planet,rings};
}
/**
 * Instantiates four environments exactly once. Changing a level toggles only
 * visible groups and a few colors/instance counts; no GPU buffers are leaked.
 */
export function createSpaceEnvironments(THREE,scene,world,{tileSize=1.3}={}){
 const nebulaTexture=makeNebulaTexture(THREE);
 const scenes=SPACE_BIOMES.map((theme,index)=>{
  const sky=new THREE.Group();sky.name='space-biome-'+theme.id;scene.add(sky);
  const foliage=new THREE.Group();foliage.name='board-decor-'+theme.id;world.add(foliage);
  const random=rngFrom(hashText(theme.id+':geometry'));
  const stars=makeStarfield(THREE,sky,theme,random);
  const rocks=addDebris(THREE,sky,random,theme.tileB);
  const planet=makePlanet(THREE,sky,theme,random);
  const nebulae=[];
  for(let i=0;i<3;i++){
   const material=new THREE.SpriteMaterial({
    map:nebulaTexture,color:theme.nebula,transparent:true,
    opacity:.15+i*.055,depthWrite:false,depthTest:true,
    blending:THREE.AdditiveBlending,fog:false
   });
   const sprite=new THREE.Sprite(material);
   sprite.name='environment-nebula-cloud';
   sprite.position.set([-46,43,26][i],[20,38,16][i],[-70,-64,72][i]);
   sprite.scale.set(64+i*20,37+i*11,1);
   sky.add(sprite);nebulae.push(sprite);
  }
  const patches=addSurfacePatches(THREE,foliage,theme.decor,random);
  sky.visible=false;foliage.visible=false;
  return {theme,sky,foliage,stars,rocks,planet,nebulae,patches};
 });
 let active=null,quality='balanced',sessionSeed=0;
 function setQuality(profile='balanced'){
  quality=profile==='auto'?'balanced':profile;
  for(const group of scenes){
   const perf=quality==='performance';
   group.stars.geometry.setDrawRange(0,perf?290:quality==='cinematic'?1000:620);
   group.rocks.count=perf?12:quality==='cinematic'?65:35;
   group.patches.mesh.count=perf?65:quality==='cinematic'?196:140;
   const leaves=group.patches.stems.children.find(c=>c.isInstancedMesh);
   if(leaves)leaves.count=perf?38:quality==='cinematic'?128:85;
   group.nebulae.forEach((s,i)=>s.visible=!perf||i===0);
  }
 }
 function setLevel(packId,index,{seed=0}={}){
  sessionSeed=seed;
  const theme=environmentForLevel(packId,index,sessionSeed);
  for(const group of scenes){
   const show=group.theme.id===theme.id;
   group.sky.visible=show;group.foliage.visible=show;
   if(show)active=group;
  }
  scene.background=new THREE.Color(theme.sky);
  if(scene.fog){
   scene.fog.color.setHex(theme.fog);
   scene.fog.density=.005;
  }
  return theme;
 }
 function update(seconds,reducedMotion=false){
  if(!active||reducedMotion)return;
  // Extremely slow motion; the starfield remains steady enough for aiming.
  active.stars.rotation.y=Math.sin(seconds*.018)*.014;
  active.nebulae.forEach((cloud,i)=>{
   cloud.material.opacity=(.15+i*.055)*(1+.11*Math.sin(seconds*.19+i*2));
  });
 }
 function getStats(){
  return {biome:active?.theme.id||null,stars:active?.stars.geometry.drawRange.count||0,
   foliage:active?.patches.mesh.count||0,shrubs:active?.patches.stems.children[0]?.count||0,
   nebulae:active?.nebulae.filter(s=>s.visible).length||0};
 }
 setQuality('balanced');
 return {setLevel,setQuality,update,getStats};
}
