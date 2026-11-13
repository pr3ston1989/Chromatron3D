import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

/**
 * Premium sculpted monuments are ORIGINAL, baked GLB meshes. They are not
 * browser-generated geometry. The same PBR mesh/material instances are shared
 * by all the statically positioned copies within a biome.
 */
export const HERO_BIOMES=Object.freeze(['orbital','verdant','polar','nebula']);
export const HERO_CLEARANCE=10.5;
export const HERO_COUNTS=Object.freeze({performance:2,balanced:3,cinematic:4});
const ANCHORS=Object.freeze([
 Object.freeze({x:-15.7,z:-.7,yaw:Math.PI/2}),
 Object.freeze({x:1.5,z:15.7,yaw:Math.PI}),
 Object.freeze({x:15.7,z:.8,yaw:-Math.PI/2}),
 Object.freeze({x:-1.4,z:-15.7,yaw:0})
]);
function hashText(value){
 let hash=2166136261;
 for(const c of String(value)){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619)}
 return hash>>>0;
}
export function heroLayout(packId,index,seed=0){
 if(!Number.isInteger(index)||index<0)throw new Error('Invalid hero level index');
 const hash=hashText(packId+':'+index+':'+seed+':hero-model-layout');
 const positions=ANCHORS.map((anchor,i)=>{
  const jitter=((hash>>>((i*7)%23))&127)/127-.5;
  const variation=((hash>>>((i*5+3)%21))&127)/127-.5;
  const rotation=anchor.yaw+variation*.19;
  const scale=.88+.10*Math.abs(jitter)+.06*(i%2);
  const along=jitter*.9;
  const x=anchor.x+(Math.abs(anchor.x)<10?along:0);
  const z=anchor.z+(Math.abs(anchor.z)<10?along:0);
  return {x,y:-1.58,z,rotation,scale};
 });
 // The nearest face of a hero prop is still beyond the physical board, even
 // after accounting for the widest baked mesh (under 4.5 world units).
 if(positions.some(p=>Math.max(Math.abs(p.x),Math.abs(p.z))-4.5*p.scale<HERO_CLEARANCE))
  throw new Error('Unsafe scenic asset placement');
 return positions;
}
/**
 * Keep the sculpture's authored biome colors readable beneath the game's
 * bright studio environment map. Without this, highly metallic GLB props
 * become nearly white on some software GPUs, hiding their detail.
 * Mutates each shared material only once (never each clone/frame).
 */
export function tuneHeroMaterials(scene,biome){
 const settings={
  orbital:{environment:.24,brightness:.78,roughness:.48},
  verdant:{environment:.19,brightness:.81,roughness:.61},
  polar:{environment:.30,brightness:.88,roughness:.42},
  nebula:{environment:.20,brightness:.77,roughness:.47}
 }[biome]||{environment:.25,brightness:.80,roughness:.47};
 const seen=new Set();
 scene.traverse(node=>{
  if(!node.isMesh)return;
  const mats=Array.isArray(node.material)?node.material:[node.material];
  for(const material of mats){
   if(!material?.isMeshStandardMaterial||seen.has(material))continue;
   seen.add(material);
   material.envMapIntensity=settings.environment;
   material.roughness=Math.max(settings.roughness,material.roughness);
   material.metalness=Math.min(.70,material.metalness);
   material.color.multiplyScalar(settings.brightness);
  }
 });
 return seen.size;
}
export function createHeroScenery(THREE,world,{
 loader=new GLTFLoader(),
 baseUrl='/models/biomes/'
}={}){
 const records=new Map();
 for(const id of HERO_BIOMES){
  const group=new THREE.Group();
  group.name='premium-hero-'+id;group.visible=false;
  world.add(group);
  records.set(id,{group,status:'idle',instances:[],error:null,primitives:0});
 }
 let active=null,quality='balanced',currentLayout=heroLayout('demo',0);
 const normalizeQuality=value=>HERO_COUNTS[value]?value:'balanced';
 function sync(){
  for(const [id,rec] of records){
   const selected=id===active;
   rec.group.visible=selected&&rec.status==='ready';
   for(let i=0;i<rec.instances.length;i++){
    const object=rec.instances[i],p=currentLayout[i];
    object.visible=selected&&i<HERO_COUNTS[quality];
    if(selected&&p){
     object.position.set(p.x,p.y,p.z);
     object.rotation.set(0,p.rotation,0);
     object.scale.setScalar(p.scale);
    }
   }
  }
 }
 function load(id){
  const rec=records.get(id);
  if(!rec||rec.status!=='idle')return;
  rec.status='loading';
  loader.load(baseUrl+id+'.glb',gltf=>{
   try{
    const scene=gltf?.scene;
    if(!scene?.isObject3D)throw new Error('Invalid GLB root');
    let meshes=0;
    scene.traverse(node=>{
     if(!node.isMesh)return;
     meshes++;
     node.castShadow=false;
     node.receiveShadow=false;
     // The game raycaster must only inspect optical pieces, never props.
     node.userData.scenicOnly=true;
    });
    if(!meshes)throw new Error('Empty GLB');
    tuneHeroMaterials(scene,id);
    rec.primitives=meshes;
    for(let i=0;i<ANCHORS.length;i++){
     const instance=scene.clone(true);
     instance.name='hero-'+id+'-'+i;
     instance.userData.scenicOnly=true;
     rec.instances.push(instance);
     rec.group.add(instance);
    }
    rec.status='ready';
    sync();
   }catch(error){
    rec.status='error';rec.error=String(error?.message||error);
    sync();
   }
  },undefined,error=>{
   rec.status='error';rec.error=String(error?.message||error);
   sync();
  });
 }
 function setLevel(id,packId,index,seed=0){
  if(!records.has(id))throw new Error('Unknown hero biome '+id);
  active=id;
  currentLayout=heroLayout(packId,index,seed);
  sync();
  load(id);
 }
 function setQuality(value){
  quality=normalizeQuality(value);
  sync();
 }
 function getStats(){
  const record=records.get(active);
  return {biome:active,status:record?.status||'idle',
   loaded:record?.status==='ready',
   visible:record?.instances.filter(x=>x.visible).length||0,
   meshParts:record?.primitives||0,
   loadError:record?.error||null};
 }
 function dispose(){
  // The geometries and materials are shared by scene.clone(). Dispose each
  // unique GPU resource once, not once per visible copy.
  const geometries=new Set(),materials=new Set();
  for(const rec of records.values()){
   for(const inst of rec.instances)inst.traverse(o=>{
    if(!o.isMesh)return;
    geometries.add(o.geometry);
    for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m);
   });
   rec.group.clear();rec.instances=[];
   world.remove(rec.group);
  }
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
 }
 return {setLevel,setQuality,getStats,dispose};
}
