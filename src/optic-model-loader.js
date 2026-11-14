import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CLASSIC_TYPE_NAMES} from './classic-pieces.js';

// Every placement shares its geometry, metalwork and cached lens colours.
export function createOpticModelLoader(THREE,{baseUrl,portraitUrl,onReady,loader=new GLTFLoader()}){
 const catalog=new Map(), lenses=new Map();
 const portraits=new Map();
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
 function tint(model,color,energized){
  model.traverse(node=>{
   if(!node.isMesh||node.material.name!=='glow')return;
   const key=color.getHex()+':'+energized;
   if(!lenses.has(key)){
    const mat=node.material.clone();
    mat.color.copy(color);mat.emissive.copy(color);
    mat.emissiveIntensity=energized?2.1:.7;
    lenses.set(key,mat);
   }
   node.material=lenses.get(key);
  });
 }
 function cloneOptic(type,color,{energized=false}={}){
  const model=catalog.get(type)?.clone(true);
  if(model)tint(model,color,energized);
  return model;
 }
 function instanceWalls(walls,position){
  const scene=catalog.get('wall');
  if(!scene||!walls.length)return null;
  scene.updateMatrixWorld(true);
  const group=new THREE.Group(),translation=new THREE.Matrix4();
  scene.traverse(node=>{
   if(!node.isMesh)return;
   const batch=new THREE.InstancedMesh(node.geometry,node.material,walls.length);
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
