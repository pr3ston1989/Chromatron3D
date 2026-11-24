import {scenerySeed} from './campaign-worlds.js';
import {applyPanelSurface} from './panel-surface.js';
import {createGrottoPool,finishGrottoRock} from './grotto-surface.js';

const scenery=import.meta.glob('../assets/models/scenery/*.glb',{eager:true,import:'default',query:'?url'});
const platforms=import.meta.glob('../assets/models/overhaul-platform-*.glb',{eager:true,import:'default',query:'?url'});
const urlFor=(base,id)=>base['../assets/models/'+id+'.glb'];

function sequence(seed){
 let state=seed;
 return ()=>{
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  return state/4294967296;
 };
}

function gradientSky(THREE){
 const uniforms={
  dark:{value:new THREE.Color()}, glow:{value:new THREE.Color()},
  shaft:{value:0}, sun:{value:0}, cavern:{value:0}
 };
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,20,12),new THREE.ShaderMaterial({
  uniforms,depthWrite:false,side:THREE.BackSide,
  vertexShader:`
   varying vec3 direction;
   void main(){
    direction=position;
    gl_Position=projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.);
    gl_Position.z=gl_Position.w;
   }`,
  fragmentShader:`
   varying vec3 direction;
   uniform vec3 dark, glow;
   uniform float shaft, sun, cavern;
   void main(){
    vec3 ray=normalize(direction);
    float elevation=(ray.y+.38)*2.45;
    float horizon=exp(-elevation*elevation);
    float atmosphere=horizon*(.29+.31*smoothstep(-.8,.9,ray.x));
    float columns=pow(max(0.,sin(ray.x*16.+ray.z*6.)),8.)*.19*shaft;
    float facing=dot(ray,normalize(vec3(.87,-.32,-.37)));
    float sunset=exp(-(1.-facing)*25.)*.57+exp(-(1.-facing)*108.)*.23;
    float disk=smoothstep(.99983,.99990,facing);
    vec3 color=mix(dark,glow,atmosphere+columns*horizon);
    color+=vec3(1.,.48,.19)*sun*(sunset+disk*1.35);
    if(cavern>.5){
     // Skylight enters through a fissure high beyond the playable deck.
     float across=ray.x*.73+ray.z*.68;
     float upwell=exp(-6.*(ray.y+.57)*(ray.y+.57));
     float cleft=across-.48*ray.y-.49;
     float spill=exp(-5.*cleft*cleft);
     float shafts=exp(-75.*cleft*cleft)+.50*exp(-180.*(cleft+.28)*(cleft+.28));
     color=mix(dark,glow,.10+.43*upwell)+upwell*spill*vec3(.036,.057,.086);
     color+=vec3(.016,.022,.031)*upwell*shafts;
    }
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 }));
 mesh.name='Campaign world atmosphere';mesh.renderOrder=-100;mesh.frustumCulled=false;mesh.visible=false;
 return mesh;
}

/** Lazy family cache. Returning to a level just repositions existing objects. */
export function createCampaignArt(THREE,scene,world,{loader,onReady}){
 const sky=gradientSky(THREE);
 scene.add(sky);
 const cache=new Map(),sources=new Map();
 const tint=new THREE.Color(),white=new THREE.Color(0xffffff);
 const dummy=new THREE.Object3D(),instanceMatrix=new THREE.Matrix4();
 let requested=null,active=null;
 const load=url=>{
  if(!sources.has(url))sources.set(url,loader.loadAsync(url).then(result=>result.scene));
  return sources.get(url);
 };
 function sync(){
  for(const record of cache.values())record.root.visible=false;
  active=requested?.status==='ready'?requested:null;
  sky.visible=Boolean(active);
  if(!active)return;
  const {definition,root}=active;
  root.visible=true;
  const {dark,glow,shaft,sun}=sky.material.uniforms;
  dark.value.setHex(definition.sky);
  glow.value.setHex(definition.haze);
  shaft.value=definition.id==='abyss'?1:0;
  sun.value=definition.id==='heliostat'?1:0;
  sky.material.uniforms.cavern.value=definition.id==='grotto'?1:0;
 }
 function setup(record,base,scatter,fixtures){
  const {definition,root}=record;
  const plantings=definition.scatter?.[3];
  record.platform=base.clone(true);
  record.platform.position.y=-3.768;
  const materials=new Map();
  record.platform.traverse(node=>{
   if(!node.isMesh)return;
   const material=node.material;
   if(!materials.has(material)){
    const paint=material.clone();
    if(material.name==='Uniform playing surface'||material.name==='Machined upper bevel'){
     paint.color.multiplyScalar(definition.face);
     if(definition.deckTint)paint.color.multiply(tint.setHex(definition.deckTint));
    }
    if(material.name==='Inlay seam')paint.color.multiplyScalar(definition.groove);
    if(material.name==='Uniform playing surface')applyPanelSurface(THREE,paint,definition.id);
    materials.set(material,paint);
   }
   node.material=materials.get(material);
  });
  root.add(record.platform);
  if(definition.id==='grotto'){
   record.pool=createGrottoPool(THREE);root.add(record.pool);
  }
  record.props=fixtures.map((source,i)=>{
   const [id,anchor,scale,yaw,role]=definition.models[i];
   const mesh=source.clone(true);
   if(definition.id==='grotto'&&id!=='grotto-survey'){
    mesh.traverse(node=>{
     if(!node.isMesh)return;
     if(!materials.has(node.material)){
      const rock=node.material.clone();
      finishGrottoRock(THREE,rock);materials.set(node.material,rock);
     }
     node.material=materials.get(node.material);
    });
   }
   mesh.position.fromArray(anchor);
   mesh.rotation.y=yaw;
   if(Array.isArray(scale))mesh.scale.fromArray(scale);
   else mesh.scale.setScalar(scale);
   if(Math.hypot(anchor[0],anchor[2])>29&&/(ridge|terrace)/.test(id)){
    mesh.position.y-=anchor[1]>-10?5:2;
    const horizon=new Map();
    mesh.traverse(node=>{
     if(!node.isMesh)return;
     if(!horizon.has(node.material)){
      const mist=definition.id==='heliostat'?definition.haze:definition.sky;
      const color=node.material.color.clone().lerp(tint.setHex(mist),.62);
      horizon.set(node.material,new THREE.MeshBasicMaterial({color}));
     }
     node.material=horizon.get(node.material);
    });
   }
   root.add(mesh);
   return {mesh,anchor:[anchor[0],mesh.position.y,anchor[2]],yaw,role,id};
  });

  record.plantingSurfaces=plantings?record.props.filter(prop=>prop.id==='garden-terrace').map(prop=>prop.mesh):[];
  record.instances=[];
  scatter?.updateMatrixWorld(true);
  scatter?.traverse(node=>{
   if(!node.isMesh)return;
   const mesh=new THREE.InstancedMesh(node.geometry,node.material,plantings?.length??14);
   mesh.name=node.name;
   record.instances.push({mesh,base:node.matrixWorld.clone()});
   root.add(mesh);
  });
  const positions=new Float32Array(33*3);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  record.dust=new THREE.Points(geometry,new THREE.PointsMaterial({
   color:definition.dust,size:definition.id==='frost'?.16:.115,
   depthWrite:false,transparent:true,opacity:.52
  }));
  root.add(record.dust);
 }
 function layout(record,seed){
  if(record.lastSeed===seed)return;
  record.lastSeed=seed;
  const rand=sequence(seed);
  const offsets=new Map();
  for(const {mesh,anchor,yaw} of record.props){
   const key=anchor[0]+':'+anchor[2];
   if(!offsets.has(key))offsets.set(key,[(rand()-.5)*1.52,(rand()-.5)*1.52]);
   const [dx,dz]=offsets.get(key);
   mesh.position.set(anchor[0]+dx,anchor[1],anchor[2]+dz);
   mesh.rotation.y=yaw;
  }
  if(record.definition.scatter)placeScatter(record,rand);
  const position=record.dust.geometry.attributes.position;
  for(let i=0;i<position.count;i++){
   const angle=rand()*Math.PI*2,radius=18+rand()*17;
   position.setXYZ(i,Math.cos(angle)*radius,-6+rand()*10,Math.sin(angle)*radius);
  }
  position.needsUpdate=true;record.dust.geometry.computeBoundingSphere();
 }
 function placeScatter(record,rand){
  const [,scale,color,plantings]=record.definition.scatter;
  tint.setHex(color).lerp(white,.77);
  for(const mesh of record.plantingSurfaces)mesh.updateWorldMatrix(true,true);
  const ground=plantings?new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,-1,0)):null;
  let count=0;
  for(let i=0;i<(plantings?.length??14);i++){
   if(plantings){
    const [x,z]=plantings[i];
    ground.ray.origin.set(x,0,z);
    const contact=ground.intersectObjects(record.plantingSurfaces,true)[0];
    if(!contact)continue;
    dummy.position.copy(contact.point);
    dummy.position.y-=.11;
   }else{
    const angle=i*2.399+(rand()-.5)*.49;
    const radius=16.8+rand()*17;
    dummy.position.set(Math.cos(angle)*radius,-7.3+rand()*1.85,Math.sin(angle)*radius);
   }
   dummy.rotation.y=rand()*Math.PI*2;
   dummy.scale.setScalar(plantings?plantings[i][2]*(.83+rand()*.32):scale*(.65+rand()*.55));
   dummy.updateMatrix();
   for(const {mesh,base} of record.instances){
    mesh.setMatrixAt(count,instanceMatrix.multiplyMatrices(dummy.matrix,base));
    mesh.setColorAt(count,tint);
   }
   count++;
  }
  for(const {mesh} of record.instances){
   mesh.count=count;
   mesh.instanceMatrix.needsUpdate=true;
   mesh.instanceColor.needsUpdate=true;
   mesh.computeBoundingSphere();
  }
 }
 function setLevel(definition,campaign,index){
  requested=null;
  if(definition){
   if(!cache.has(definition.id)){
    const root=new THREE.Group();root.name=definition.en;root.visible=false;world.add(root);
    const record={root,definition,status:'loading'};
    cache.set(definition.id,record);
    const deck=load(urlFor(platforms,'overhaul-platform-'+definition.deck));
    const scatter=definition.scatter?load(urlFor(scenery,'scenery/'+definition.scatter[0])):null;
    const props=definition.models.map(([id])=>load(urlFor(scenery,'scenery/'+id)));
    Promise.all([deck,scatter,...props]).then(([base,detail,...models])=>{
     setup(record,base,detail,models);
     record.status='ready';
     if(requested===record)layout(record,record.seed);
    }).catch(()=>{record.status='error'}).then(()=>{
     if(requested===record){sync();onReady()}
    });
   }
   requested=cache.get(definition.id);
   requested.seed=scenerySeed(campaign,index);
   if(requested.status==='ready')layout(requested,requested.seed);
  }
  sync();
 }
 function update(seconds,still,camera){
  if(!active)return;
  const t=still?0:seconds;
  if(active.pool)active.pool.material.uniforms.seconds.value=t;
  active.dust.rotation.y=t*(active.definition.id==='abyss'?.028:.009);
  for(const {mesh,yaw,role} of active.props){
   if(role==='iris'||role==='turn'||role==='pulse')mesh.rotation.y=yaw+Math.sin(t*.26)*.23;
   if(role==='left'||role==='right'||role==='turn'||role==='iris')
    mesh.visible=mesh.position.x*camera.x+mesh.position.z*camera.z<8;
   if(role==='cliff'){
    const horizontal=Math.hypot(camera.x,camera.z);
    mesh.visible=(mesh.position.x*camera.x+mesh.position.z*camera.z)<7*horizontal+.001;
   }
  }
 }
 return {setLevel,update,isVisible:()=>Boolean(active),getStatus:()=>requested?.status??null};
}
