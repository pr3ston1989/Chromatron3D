import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CLASSIC_TYPE_NAMES} from './classic-pieces.js';

const housings={
 kepler:{'Naval enamel':0x1c3354,'Titanium chamfers':0x86a4b9,'Copper fittings':0xbc794c,'Porcelain':0xc4d1da},
 garden:{'Naval enamel':0x6a5136,'Titanium chamfers':0xb38550,'Copper fittings':0xd4aa70,'Porcelain':0xe3c698},
 grotto:{'Naval enamel':0x534268,'Titanium chamfers':0xaa86c4,'Copper fittings':0xa15f9c,'Porcelain':0xd0afd6},
 shipyard:{'Naval enamel':0x2b3e54,'Titanium chamfers':0xa0b5cc,'Copper fittings':0x6f869c,'Porcelain':0xc3d5e3}
};

// Every placement shares its geometry, metalwork and cached lens colours.
export function createOpticModelLoader(THREE,{baseUrl,portraitUrl,onReady,loader=new GLTFLoader()}){
 const catalog=new Map(), lenses=new Map();
 const portraits=new Map();
 const finishes=new WeakMap();
 function finish(material,deck){
  const hex=housings[deck]?.[material.name];
  if(hex===undefined)return material;
  let variants=finishes.get(material);
  if(!variants)finishes.set(material,variants=new Map());
  if(!variants.has(deck)){
   const painted=material.clone();
   painted.color.setHex(hex);
   variants.set(deck,painted);
  }
  return variants.get(deck);
 }
 function portrait(type){
  if(!portraits.has(type)){
   const tex=new THREE.TextureLoader().load(portraitUrl+type+'.png');
   tex.colorSpace=THREE.SRGBColorSpace;
   portraits.set(type,new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
  }
  const sprite=new THREE.Sprite(portraits.get(type));
  sprite.userData.catalogMesh=true;sprite.scale.setScalar(1.12);
  return sprite;
 }
 function load(type){
  if(catalog.has(type)||!CLASSIC_TYPE_NAMES.includes(type))return;
  catalog.set(type,null);
  loader.load(baseUrl+type+'.glb',({scene})=>{
   scene.traverse(node=>{
    if(!node.isMesh)return;
    node.receiveShadow=true;
    node.userData.catalogMesh=true;
   });
   catalog.set(type,scene);onReady?.(type);
  },undefined,()=>{});
 }
 function tint(model,color,energized,type){
  const isSignal=type==='laser'||type==='target';
  const intensity=type==='target'&&!energized?.43:1;
  model.traverse(node=>{
   if(!node.isMesh||node.material.name!=='glow')return;
   const key=color.getHex()+':'+energized+':'+(isSignal?type:'optic');
   if(!lenses.has(key)){
    const mat=isSignal
     ?new THREE.MeshBasicMaterial({name:'glow',side:node.material.side,toneMapped:false})
     :node.material.clone();
    mat.color.copy(color).multiplyScalar(intensity);
    if(mat.emissive){
     mat.emissive.copy(color);
     mat.emissiveIntensity=energized?1.55:.64;
    }
    lenses.set(key,mat);
   }
   node.material=lenses.get(key);
  });
 }
 function cloneOptic(type,color,{energized=false,deck}={}){
  const model=catalog.get(type)?.clone(true);
  if(model){
   if(deck&&type!=='wall')model.scale.set(1.16,1,1.16);
   model.traverse(node=>{if(node.isMesh)node.material=finish(node.material,deck)});
   tint(model,color,energized,type);
  }
  return model;
 }
 function instanceWalls(walls,position,deck){
  const scene=catalog.get('wall');
  if(!scene||!walls.length)return null;
  scene.updateMatrixWorld(true);
  const group=new THREE.Group(),translation=new THREE.Matrix4();
  scene.traverse(node=>{
   if(!node.isMesh)return;
   const batch=new THREE.InstancedMesh(node.geometry,finish(node.material,deck),walls.length);
   for(const [index,wall] of walls.entries()){
    translation.makeTranslation(...position(wall).toArray()).multiply(node.matrixWorld);
    batch.setMatrixAt(index,translation);
   }
   batch.computeBoundingSphere();batch.userData.catalogMesh=true;
   batch.userData.instances=walls;group.add(batch);
  });
  return group;
 }
 return {load,portrait,cloneOptic,tint,instanceWalls};
}
