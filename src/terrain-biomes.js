/**
 * Terrain surrounds the floating optical instrument with a *real surface*.
 * Each biome receives four large worn/organic platforms, an authored
 * procedural COLOR texture and clustered, instanced 3D vegetation or geology.
 * All geometry is outside the 15x15 puzzle; no optics or raycaster changes.
 */
export const TERRAIN_QUALITY=Object.freeze({
 performance:Object.freeze({rocks:14,features:24,growth:35}),
 balanced:Object.freeze({rocks:30,features:52,growth:80}),
 cinematic:Object.freeze({rocks:48,features:90,growth:135})
});
export const TERRAIN_BIOMES=Object.freeze(['scrap','moss','ice','crystal']);
export const TERRAIN_INNER=12.9;
const PALETTES=Object.freeze({
 scrap:Object.freeze({dark:0x293d47,mid:0x536d73,bright:0x8ca0a1,accent:0xd3ab6a}),
 moss:Object.freeze({dark:0x243c30,mid:0x3c7951,bright:0x7ab16e,accent:0xa5c47a}),
 ice:Object.freeze({dark:0x315069,mid:0x8dbbd0,bright:0xcce5ea,accent:0xf2fbfb}),
 crystal:Object.freeze({dark:0x382940,mid:0x6b426d,bright:0xb47aa9,accent:0xee9dc9})
});
function hash(x,y,seed){
 let n=Math.imul((x|0)+seed,374761393)+Math.imul((y|0)-seed,668265263);
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967296;
}
function smooth(t){return t*t*(3-2*t)}
function noise(x,y,seed){
 const a=Math.floor(x),b=Math.floor(y),u=smooth(x-a),v=smooth(y-b);
 const a0=hash(a,b,seed)*(1-u)+hash(a+1,b,seed)*u;
 const a1=hash(a,b+1,seed)*(1-u)+hash(a+1,b+1,seed)*u;
 return a0*(1-v)+a1*v;
}
const blend=(a,b,t)=>{
 let value=0;
 for(const shift of [16,8,0]){
  const ca=(a>>>shift)&255,cb=(b>>>shift)&255;
  value|=Math.round(ca*(1-t)+cb*t)<<shift;
 }
 return value;
};
export function terrainTexel(kind,x,y,seed=0){
 if(!TERRAIN_BIOMES.includes(kind))throw new Error('Unknown terrain biome');
 const palette=PALETTES[kind];
 const large=noise(x/36,y/36,seed+13);
 const medium=noise(x/10,y/10,seed+31);
 const grain=noise(x/3.3,y/3.3,seed+73);
 const tint=Math.max(0,Math.min(1,.10+large*.50+medium*.32+grain*.12));
 let color=blend(palette.dark,palette.mid,tint);
 const detail=medium*.42+grain*.58;
 if(kind==='moss'){
  const lichen=noise(x/23+20,y/21-10,seed+17);
  if(lichen>.50)color=blend(color,palette.bright,(lichen-.5)*1.55);
  if(lichen<.31)color=blend(color,palette.dark,.48);
 }else if(kind==='ice'){
  const seam=Math.abs(Math.sin(x*.12+medium*5+y*.023));
  if(seam>.81)color=blend(color,palette.bright,(seam-.81)*2.3);
  color=blend(color,palette.bright,grain*.27);
 }else if(kind==='crystal'){
  const fault=Math.abs(Math.sin(x*.14+y*.19+medium*3.1));
  if(fault>.967)color=blend(color,palette.accent,(fault-.967)*22);
  else if(grain<.27)color=blend(color,palette.dark,.30);
 }else{
  const plate=Math.min(Math.abs((x%34)-17),Math.abs((y%34)-17));
  if(plate>15.5)color=blend(color,palette.dark,.76);
  if(grain>.78)color=blend(color,palette.bright,(grain-.78)*.90);
  const grit=Math.abs(Math.sin(x*.46+y*.028));
  if(grit>.96)color=blend(color,palette.accent,.11);
 }
 const shade=.84+detail*.22;
 const scale=c=>Math.max(0,Math.min(255,Math.round(c*shade)));
 return [scale((color>>>16)&255),scale((color>>>8)&255),scale(color&255),255];
}
export function buildTerrainTexture(THREE,kind,seed=0,size=128){
 const data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)
  data.set(terrainTexel(kind,x,y,seed),(y*size+x)*4);
 const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.magFilter=THREE.LinearFilter;
 texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
 texture.repeat.set(2,2);
 texture.generateMipmaps=true;texture.needsUpdate=true;
 return texture;
}
function terrainPosition(random,index){
 // Four functional courtyards, with clusters around docking / habitat
 // nodes. No points may be inside the hull (+/-12.5 world units).
 const hubs=[[-18,-17],[18,-17],[-18,17],[18,17],[-2,-20],[2,20],
  [-20,2],[20,-2]];
 const [hx,hz]=hubs[index%hubs.length];
 let x=hx+(random()-.5)*6.1,z=hz+(random()-.5)*5.3;
 if(Math.abs(x)<TERRAIN_INNER&&Math.abs(z)<TERRAIN_INNER){
  if(Math.abs(hx)>Math.abs(hz))x=Math.sign(hx||1)*TERRAIN_INNER;
  else z=Math.sign(hz||1)*TERRAIN_INNER;
 }
 return {x,z};
}
export function createBiomeTerrain(THREE,group,theme,random){
 const kind=theme.decor;
 if(!TERRAIN_BIOMES.includes(kind))throw new Error('Unknown terrain biome');
 const base=PALETTES[kind];
 const root=new THREE.Group();root.name='biome-terrain-'+theme.id;
 root.userData.scenicOnly=true;group.add(root);
 const texture=buildTerrainTexture(THREE,kind,theme.edge&65535);
 const material=new THREE.MeshStandardMaterial({
  color:0xffffff,map:texture,metalness:kind==='scrap'?.54:kind==='moss'?.03:.17,
  roughness:kind==='moss'?.97:kind==='ice'?.54:.77,
  side:THREE.DoubleSide
 });
 const cliffMat=new THREE.MeshStandardMaterial({
  color:base.dark,metalness:kind==='scrap'?.38:.09,roughness:.9,flatShading:true
 });
 // Four broad crescent-like courtyards around the square instrument.
 // Their inner edge starts outside the 25-unit outer stage hull.
 const platforms=[
  {w:54,d:14,x:0,z:-20},{w:54,d:14,x:0,z:20},
  {w:14,d:26,x:-20,z:0},{w:14,d:26,x:20,z:0}
 ];
 const slabs=[];
 platforms.forEach((p,i)=>{
  const plane=new THREE.PlaneGeometry(p.w,p.d,Math.round(p.w/1.3),Math.round(p.d/1.2));
  const pos=plane.attributes.position;
  for(let j=0;j<pos.count;j++){
   const x=pos.getX(j),z=-pos.getY(j);
   const innerDistance=i<2?Math.abs(z+p.z):Math.abs(x+p.x);
   const relief=noise((x+p.x)*.45,(z+p.z)*.45,18)*.24+
    noise((x+p.x)*.14,(z+p.z)*.14,43)*.3-.25;
   const edge=Math.min(1,Math.max(0,(innerDistance-TERRAIN_INNER)/3));
   pos.setZ(j,relief*edge); // Local Z becomes world Y after X=-PI/2.
  }
  plane.computeVertexNormals();
  const mesh=new THREE.Mesh(plane,material);
  mesh.name='textured-'+kind+'-courtyard-'+i;
  mesh.rotation.x=-Math.PI/2;
  mesh.position.set(p.x,-1.73,p.z);
  mesh.userData.scenicOnly=true;mesh.receiveShadow=false;
  root.add(mesh);slabs.push(mesh);
  const foundation=new THREE.Mesh(new THREE.BoxGeometry(p.w,.84,p.d),cliffMat);
  foundation.name='courtyard-substructure-'+i;
  foundation.position.set(p.x,-2.22,p.z);
  foundation.userData.scenicOnly=true;root.add(foundation);
 });
 const stoneGeo=new THREE.DodecahedronGeometry(1.03,1);
 const stoneMat=new THREE.MeshStandardMaterial({
  color:0xffffff,metalness:kind==='scrap'?.44:.12,
  roughness:kind==='ice'?.43:.8,flatShading:true
 });
 const stone=new THREE.InstancedMesh(stoneGeo,stoneMat,48);
 stone.name='terrain-major-stones';stone.frustumCulled=false;
 stone.userData.scenicOnly=true;root.add(stone);
 const shapeGeo=kind==='moss'?new THREE.IcosahedronGeometry(.65,1):
  kind==='ice'?new THREE.ConeGeometry(.46,2.9,6):
  kind==='crystal'?new THREE.OctahedronGeometry(.91,0):
  new THREE.BoxGeometry(1.35,.6,1.25);
 const shapeMat=new THREE.MeshStandardMaterial({
  color:0xffffff,metalness:kind==='scrap'?.65:.07,
  roughness:kind==='moss'?.96:.54,flatShading:kind!=='moss',
  emissive:kind==='crystal'?0x52244c:0x000000,
  emissiveIntensity:kind==='crystal'?.18:0
 });
 const features=new THREE.InstancedMesh(shapeGeo,shapeMat,90);
 features.name='terrain-landmark-clusters';features.frustumCulled=false;
 features.userData.scenicOnly=true;root.add(features);
 const growthGeo=kind==='moss'?new THREE.ConeGeometry(.28,1.24,5):
  kind==='ice'?new THREE.OctahedronGeometry(.28,0):
  kind==='crystal'?new THREE.ConeGeometry(.24,1.65,5):
  new THREE.BoxGeometry(.7,.13,.26);
 const growthMat=new THREE.MeshStandardMaterial({
  color:0xffffff,roughness:kind==='moss'?.97:.57,
  metalness:kind==='scrap'?.64:.08,side:THREE.DoubleSide,
  emissive:kind==='crystal'?0x371832:0x000000,
  emissiveIntensity:.16
 });
 const growth=new THREE.InstancedMesh(growthGeo,growthMat,135);
 growth.name='terrain-biome-vegetation-and-geology';
 growth.frustumCulled=false;growth.userData.scenicOnly=true;
 root.add(growth);
 const palette=[
  kind==='moss'?[0x466f49,0x5d8b4f,0x9caa6a]:
  kind==='ice'?[0x83a9c6,0xb6d6e8,0xe2f5fc]:
  kind==='crystal'?[0x69446c,0xae6c9d,0xec9ccf]:
  [0x526b76,0x75848b,0xb0a08a]
 ][0];
 const stoneColor=new THREE.Color(),dummy=new THREE.Object3D();
 const scatter=(mesh,count,mode)=>{
  for(let i=0;i<count;i++){
   const {x,z}=terrainPosition(random,i);
   const large=mode==='stone';
   const baseScale=large?.54+random()*.88:
    mode==='feature'?.75+random()*1.02:.66+random()*.78;
   let y=-1.60;
   if(mode==='stone')y=-1.55+(random()-.5)*.10;
   if(mode==='feature')y=kind==='ice'?-.57:kind==='crystal'?-1.17:-1.47;
   if(mode==='growth')y=kind==='moss'?-1.12:kind==='crystal'?-1.0:-1.45;
   dummy.position.set(x,y,z);
   dummy.rotation.set((random()-.5)*.24,random()*Math.PI*2,(random()-.5)*.20);
   if(mode==='stone')dummy.scale.set(baseScale*1.5,baseScale*.47,baseScale*1.15);
   else if(mode==='feature')dummy.scale.set(baseScale*(kind==='moss'?1.5:1),
    baseScale*(kind==='ice'?1.13:kind==='moss'?.35:1),baseScale);
   else dummy.scale.set(baseScale,baseScale*(kind==='moss'?1.28:1),baseScale);
   dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
   mesh.setColorAt(i,stoneColor.setHex(palette[Math.floor(random()*palette.length)]));
  }
  mesh.instanceMatrix.needsUpdate=true;
  mesh.instanceColor.needsUpdate=true;
 };
 scatter(stone,48,'stone');scatter(features,90,'feature');scatter(growth,135,'growth');
 let quality='balanced';
 function setQuality(profile='balanced'){
  quality=TERRAIN_QUALITY[profile]?profile:'balanced';
  const limits=TERRAIN_QUALITY[quality];
  stone.count=limits.rocks;features.count=limits.features;growth.count=limits.growth;
 }
 function getStats(){
  return {biome:theme.id,quality,courtyards:slabs.length,
   rocks:stone.count,features:features.count,growth:growth.count,
   textured:true,innerClearance:TERRAIN_INNER};
 }
 setQuality();
 return {root,setQuality,getStats};
}
