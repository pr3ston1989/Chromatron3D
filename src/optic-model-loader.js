import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CLASSIC_TYPE_NAMES} from './classic-pieces.js';
import {applyOpticFinish} from './optic-textures.js';

const housings={
 kepler:{'Naval enamel':0x1c3354,'Titanium chamfers':0x86a4b9,'Copper fittings':0xbc794c,'Porcelain':0xc4d1da},
 garden:{'Naval enamel':0x6a5136,'Titanium chamfers':0xb38550,'Copper fittings':0xd4aa70,'Porcelain':0xe3c698},
 grotto:{'Naval enamel':0x534268,'Titanium chamfers':0xaa86c4,'Copper fittings':0xa15f9c,'Porcelain':0xd0afd6},
 shipyard:{'Naval enamel':0x2b3e54,'Titanium chamfers':0xa0b5cc,'Copper fittings':0x6f869c,'Porcelain':0xc3d5e3}
};
const finishNames={'Anodized cobalt':'Naval enamel','Brushed titanium':'Titanium chamfers',
 'Copper ferrule':'Copper fittings','Satin porcelain':'Porcelain'};

// The opaque faceted mesh owns depth, so beams disappear into its entry face
// and emerge on the far side. A refracted view vector models colour depth
// inside each cut without transmission buffers or a second render of the scene.
function cutCrystal(shader){
 shader.vertexShader='varying vec3 jewelPosition;\nvarying vec3 jewelCamera;\n'+shader.vertexShader
  .replace('#include <begin_vertex>',`#include <begin_vertex>
   jewelPosition=position-vec3(0.,.78,0.);
   jewelCamera=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz-vec3(0.,.78,0.);`);
 shader.fragmentShader='varying vec3 jewelPosition;\nvarying vec3 jewelCamera;\n'+shader.fragmentShader
 .replace('#include <opaque_fragment>',`
  vec3 incoming=normalize(jewelPosition-jewelCamera);
  vec3 face=normalize(cross(dFdx(jewelPosition),dFdy(jewelPosition)));
  if(dot(incoming,face)>0.)face=-face;
  vec3 inside=refract(incoming,face,.625);
  // Find the far pavilion facet seen through this surface. Its reflection
  // changes across a single front facet when the player orbits the jewel.
  float distanceToExit=8.;
  vec3 returnNormal=vec3(0.,-1.,0.);
  for(int i=0;i<8;i++){
   float angle=(float(i)+.5)*.78539816;
   vec3 plane=vec3(cos(angle),-.58,sin(angle));
   float rate=dot(plane,inside);
   float distanceToPlane=(.367-dot(plane,jewelPosition))/max(.001,rate);
   if(rate>.001&&distanceToPlane>.004&&distanceToPlane<distanceToExit){
    distanceToExit=distanceToPlane;
    returnNormal=normalize(plane);
   }
  }
  vec3 bounced=reflect(inside,returnNormal);
  float caustic=smoothstep(-.22,.86,dot(bounced,normalize(vec3(-.44,.83,.34))));
  float rim=pow(1.-clamp(dot(-incoming,face),0.,1.),3.);
  vec3 reflected=reflect(incoming,face);
  float softbox=smoothstep(.79,.97,dot(reflected,normalize(vec3(-.30,.84,.46))));
  vec3 cut=diffuse*(.16+.67*caustic)+diffuseColor.rgb*.25;
  // Most light reaching the eye has crossed coloured glass twice.
  // Only the narrow first-surface glint is spectrally neutral.
  vec3 returnTint=mix(diffuse,vec3(1.),.045);
  outgoingLight=cut+min(outgoingLight,vec3(1.5))*.075+
    returnTint*(.085*rim+.41*softbox+.19*pow(caustic,7.))+vec3(.12)*pow(softbox,9.);
  #include <opaque_fragment>`);
}

// Every placement shares its geometry, metalwork and cached lens colours.
export function createOpticModelLoader(THREE,{baseUrl,portraitUrl,modelUrls={},portraitUrls={},onReady,loader=new GLTFLoader()}){
 const catalog=new Map(), lenses=new Map();
 const portraits=new Map();
 const finishes=new WeakMap();
 function finish(material,deck){
  const hex=housings[deck]?.[finishNames[material.name]??material.name];
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
   const tex=new THREE.TextureLoader().load(portraitPath(type));
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
  loader.load(modelUrls[type]??baseUrl+type+'.glb',({scene})=>{
   scene.traverse(node=>{
    if(!node.isMesh)return;
    node.receiveShadow=true;
    node.userData.catalogMesh=true;
    if(modelUrls[type]&&node.geometry.getAttribute('uv')&&['Brushed titanium','Anodized cobalt','Diamond cut edges'].includes(node.material.name)&&!node.material.normalMap)
     applyOpticFinish(THREE,node.material,node.material.name==='Diamond cut edges'?'polished':'brushed');
   });
   catalog.set(type,scene);onReady?.(type);
  },undefined,()=>{});
 }
 function tint(model,color,energized,type){
  const isSignal=type==='laser'||type==='target'||Boolean(modelUrls[type]&&type==='filter');
  const intensity=type==='target'&&!energized?.43:1;
  model.traverse(node=>{
   if(!node.isMesh)return;
   const role=node.material.name;
   if(!['glow','Resonance crystal','Receiver lock'].includes(role))return;
   const key=role+':'+color.getHex()+':'+energized+':'+(isSignal?type:'optic');
   if(!lenses.has(key)){
    const mat=isSignal&&role==='glow'
     ?new THREE.MeshBasicMaterial({name:'glow',side:node.material.side,toneMapped:false})
     :node.material.clone();
    mat.color.copy(color).multiplyScalar(intensity);
    if(mat.emissive){
     mat.emissive.copy(color);
     mat.emissiveIntensity=energized?1.55:.64;
    }
    if(role==='Resonance crystal'){
     mat.color.copy(color);
     mat.emissiveIntensity=energized?.36:.13;
     mat.envMapIntensity=.78;
     mat.onBeforeCompile=cutCrystal;
    }else if(role==='Receiver lock'){
     mat.color.setHex(energized?0xdbffef:0x263849);
     mat.emissive.setHex(energized?0x96ffe5:0x000000);
     mat.emissiveIntensity=energized?1.4:0;
    }
    lenses.set(key,mat);
   }
   node.material=lenses.get(key);
  });
 }
 function cloneOptic(type,color,{energized=false,deck}={}){
  const model=catalog.get(type)?.clone(true);
  if(model){
   if(deck&&type!=='wall')model.scale.set(modelUrls[type]?1.05:1.16,1,modelUrls[type]?1.05:1.16);
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
 function portraitPath(type){return portraitUrls[type]??portraitUrl+type+'.png'}
 return {load,portrait,portraitPath,cloneOptic,tint,instanceWalls};
}
