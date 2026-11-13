import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SCENIC_MODELS,SCENIC_VISIBLE,sceneryLayout} from './scenic-composition.js';
import {tuneHeroMaterials} from './hero-scenery.js';

/**
 * Eight distinct midground GLB set pieces, loaded only for the active biome.
 * There is no random geometry generation during gameplay; only cached GLB
 * clones with shared mesh buffers and materials. Two asset families are
 * available at ten art-directed sockets per biome.
 */
export function createMidgroundScenery(THREE,world,{
 loader=new GLTFLoader(),baseUrl='/models/midground/'
}={}){
 const records=new Map();
 for(const [biome,names] of Object.entries(SCENIC_MODELS)){
  const group=new THREE.Group();group.name='premium-midground-'+biome;
  group.visible=false;world.add(group);
  const slots=Array.from({length:10},(_,i)=>{
   const root=new THREE.Group();root.name='midground-socket-'+i;
   root.userData.scenicOnly=true;group.add(root);
   return {root,children:new Map(),family:0,phase:0,baseRotation:0};
  });
  const assets=names.map(name=>({name,state:'idle',source:null,error:null,meshParts:0}));
  records.set(biome,{group,slots,assets,layout:[]});
 }
 let active=null,quality='balanced',disposed=false;
 function sync(){
  for(const [biome,rec] of records){
   rec.group.visible=biome===active;
   const maxCount=SCENIC_VISIBLE[quality];
   for(let i=0;i<rec.slots.length;i++){
    const slot=rec.slots[i],layout=rec.layout[i],on=biome===active&&i<maxCount;
    slot.root.visible=Boolean(on&&layout);
    if(layout){
     slot.root.position.set(layout.x,layout.y,layout.z);
     slot.root.rotation.set(0,layout.rotation,0);
     slot.root.scale.setScalar(layout.scale);
     slot.family=layout.family;slot.phase=layout.activityPhase;
     slot.baseRotation=layout.rotation;
    }
    // If one GLB fails to download, the other family can still fill sockets.
    const requested=rec.assets[slot.family],fallback=rec.assets[1-slot.family];
    const showing=requested?.state==='ready'?slot.family:
      fallback?.state==='ready'?1-slot.family:-1;
    for(const [family,object] of slot.children)object.visible=slot.root.visible&&family===showing;
    if(showing<0)slot.root.visible=false;
   }
  }
 }
 function load(biome,family){
  const rec=records.get(biome),asset=rec.assets[family];
  if(asset.state!=='idle'||disposed)return;
  asset.state='loading';
  loader.load(baseUrl+asset.name+'.glb',gltf=>{
   if(disposed)return;
   try{
    if(!gltf?.scene?.isObject3D)throw new Error('Invalid GLB root');
    let meshParts=0;
    gltf.scene.traverse(obj=>{
     if(!obj.isMesh)return;
     meshParts++;
     obj.castShadow=false;obj.receiveShadow=false;
     obj.userData.scenicOnly=true;
    });
    if(!meshParts)throw new Error('Empty scenery mesh');
    tuneHeroMaterials(gltf.scene,biome);
    asset.source=gltf.scene;asset.meshParts=meshParts;
    for(const slot of rec.slots){
     const instance=asset.source.clone(true);
     instance.name='midground-'+asset.name;
     instance.userData.scenicOnly=true;
     slot.root.add(instance);slot.children.set(family,instance);
    }
    asset.state='ready';sync();
   }catch(error){asset.state='error';asset.error=String(error?.message||error);sync()}
  },undefined,error=>{
   if(disposed)return;
   asset.state='error';asset.error=String(error?.message||error);sync();
  });
 }
 function setLevel(biome,packId,index,seed=0){
  if(!records.has(biome))throw new Error('Unknown scenery biome');
  active=biome;
  const rec=records.get(active);
  rec.layout=sceneryLayout(packId,index,seed,biome);
  sync();
  // Current levels request only two compact assets, each fetched once.
  load(biome,0);load(biome,1);
 }
 function setQuality(profile){
  quality=SCENIC_VISIBLE[profile]?profile:'balanced';
  sync();
 }
 function update(seconds,reducedMotion=false){
  if(!active)return;
  const rec=records.get(active);
  // A subtle rotation for floating space wrecks and organic vertical roots.
  // Solid research cabins, bridges and cargo docks remain physically stable.
  const movable=active==='verdant'||active==='nebula';
  for(let i=0;i<SCENIC_VISIBLE[quality];i++){
   const slot=rec.slots[i],root=slot.root;
   if(!root.visible)continue;
   const lively=movable&&slot.family===1;
   root.rotation.y=slot.baseRotation+(lively&&!reducedMotion?
    Math.sin(seconds*.18+slot.phase)*.022:0);
  }
 }
 function getStats(){
  const rec=records.get(active);
  if(!rec)return {biome:null,status:'idle',visible:0,readyModels:0,distinct:0,loadErrors:[]};
  const readyModels=rec.assets.filter(a=>a.state==='ready').length;
  const loading=rec.assets.some(a=>a.state==='loading');
  const status=readyModels===2?'ready':loading?'loading':readyModels>0?'partial':
   rec.assets.some(a=>a.state==='error')?'error':'idle';
  const activeSlots=rec.slots.filter(s=>s.root.visible);
  const kinds=new Set();
  for(const slot of activeSlots)for(const [key,node] of slot.children)if(node.visible)kinds.add(key);
  return {biome:active,status,visible:activeSlots.length,
   readyModels,distinct:kinds.size,quality,loadErrors:rec.assets.filter(a=>a.error).map(a=>a.error)};
 }
 function dispose(){
  if(disposed)return;
  disposed=true;
  const meshes=new Set(),materials=new Set();
  for(const rec of records.values()){
   for(const asset of rec.assets){
    asset.source?.traverse(obj=>{
     if(!obj.isMesh)return;
     meshes.add(obj.geometry);
     const list=Array.isArray(obj.material)?obj.material:[obj.material];
     list.forEach(m=>{if(m)materials.add(m)});
    });
   }
   for(const slot of rec.slots){slot.root.clear();slot.children.clear()}
   rec.group.clear();world.remove(rec.group);
  }
  meshes.forEach(mesh=>mesh.dispose());
  materials.forEach(material=>material.dispose());
 }
 return {setLevel,setQuality,update,getStats,dispose};
}
