import {CAMPAIGN_FOOTING_Y,scenerySeed} from './campaign-worlds.js';
import {applyPanelSurface} from './panel-surface.js';
import {createGrottoPool,finishGrottoRock} from './grotto-surface.js';
import {createBiomeBasin} from './biome-basin.js';
import {applyOpticFinish} from './optic-textures.js';
import {applyLandmarkFinish,createVentPlumes} from './landmark-surfaces.js';
import {createScenicDrift} from './scenic-drift.js';

const scenery=import.meta.glob('../assets/models/scenery/*.glb',{eager:true,import:'default',query:'?url'});
const platforms=import.meta.glob('../assets/models/overhaul-platform-*.glb',{eager:true,import:'default',query:'?url'});
const urlFor=(base,id)=>base['../assets/models/'+id+'.glb'];
const atmosphereKinds={sunset:1,cavern:2,aurora:3,embers:4,current:5,twilight:6};

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
  kind:{value:0}, time:{value:0}
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
   uniform float kind,time;
   float hash2(vec2 cell){
    vec3 p=fract(cell.xyx*.1031);
    p+=dot(p,p.yzx+33.33);
    return fract((p.x+p.y)*p.z);
   }
   float noise2(vec2 p){
    vec2 i=floor(p),f=fract(p);
    f=f*f*(3.-2.*f);
    return mix(mix(hash2(i),hash2(i+vec2(1.,0.)),f.x),
               mix(hash2(i+vec2(0.,1.)),hash2(i+vec2(1.,1.)),f.x),f.y);
   }
   float veil(vec2 p){
    return .58*noise2(p)+.28*noise2(p*2.04+7.)+.14*noise2(p*5.17-2.);
   }
   void main(){
    vec3 ray=normalize(direction);
    float elevation=(ray.y+.38)*2.45;
    float horizon=exp(-elevation*elevation);
    float atmosphere=horizon*(.29+.31*smoothstep(-.8,.9,ray.x));
    vec2 uv=vec2(atan(ray.x,ray.z),ray.y);
    float clouds=veil(uv*vec2(3.,12.)+vec2(time*.012,0.));
    vec3 color=mix(dark,glow,atmosphere*(.63+.37*clouds));
    if(kind==1.){
     float facing=dot(ray,normalize(vec3(.76,-.40,-.60)));
     float sunset=exp(-(1.-facing)*16.)*.54+exp(-(1.-facing)*102.)*.37;
     float disk=smoothstep(.99955,.99982,facing);
     color+=vec3(.85,.39,.17)*(sunset+disk*1.29)*(1.-.31*clouds);
     color+=vec3(.16,.076,.034)*smoothstep(.34,.8,clouds)*horizon;
    }else if(kind==2.){
     // Skylight enters through a fissure high beyond the playable deck.
     float across=ray.x*.73+ray.z*.68;
     float upwell=exp(-6.*(ray.y+.57)*(ray.y+.57));
     float cleft=across-.48*ray.y-.49;
     float spill=exp(-5.*cleft*cleft);
     float shafts=exp(-75.*cleft*cleft)+.50*exp(-180.*(cleft+.28)*(cleft+.28));
     color=mix(dark,glow,.05+.29*upwell*clouds)+upwell*spill*vec3(.034,.058,.114);
     color+=vec3(.017,.031,.056)*upwell*shafts*(.49+.61*clouds);
    }else if(kind==3.){
     float drift=.13*sin(time*.16);
     float fold=.048*sin(uv.x*4.2+drift)+.023*sin(uv.x*9.3+.28+drift);
     float base=uv.y+.51+fold;
     float filaments=noise2(vec2(uv.x*46.+drift,uv.y*4.+time*.063));
     float ribbon=smoothstep(-.046,.001,base)*exp(-23.*max(0.,base));
     float higher=base-.098-.026*sin(uv.x*8.-drift);
     float afterglow=smoothstep(-.059,.016,higher)*exp(-26.*max(0.,higher));
     float reach=.29+.71*smoothstep(-.52,.64,ray.x);
     color+=reach*(vec3(.025,.169,.130)*ribbon*(.56+.63*filaments)
                +vec3(.070,.064,.149)*afterglow*(.32+.52*filaments));
     vec2 cells=uv*vec2(394.,288.);
     float pin=1.-smoothstep(.085,.205,length(fract(cells)-.5));
     float stars=step(.990,hash2(floor(cells)))*pin*smoothstep(-.49,-.24,ray.y);
     color+=vec3(.19,.23,.34)*stars;
    }else if(kind==4.){
     float heat=pow(clouds,2.65)*exp(-8.*abs(ray.y+.40));
     float soot=veil(uv*vec2(8.,17.)+vec2(.06*time,0.));
     float smoke=smoothstep(.26,.78,soot)*exp(-12.*abs(ray.y+.39+.12*sin(uv.x*4.)));
     color+=vec3(.119,.037,.017)*heat+vec3(.092,.034,.027)*smoke;
    }else if(kind==5.){
     float longitude=ray.x*.81+ray.z*.58;
     float surface=smoothstep(-.77,.05,ray.y);
     float openWater=longitude-.38;
     float water=surface*exp(-2.8*openWater*openWater);
     float drift=longitude-.57*ray.y-.011*sin(time*.38);
     float shaftA=drift-.33,shaftB=drift-.59;
     float shafts=.69*exp(-73.*shaftA*shaftA)+.47*exp(-171.*shaftB*shaftB);
     float filaments=pow(.5+.5*cos(31.*drift+2.5*clouds),5.);
     float wavefront=smoothstep(.42,.87,veil(vec2(13.*longitude,11.*ray.y+time*.053)));
     color=mix(dark,glow,.11+.30*surface*clouds);
     color+=vec3(.024,.112,.142)*water*(.63+.64*shafts+.18*filaments);
     color+=vec3(.009,.053,.075)*water*wavefront;
    }else if(kind==6.){
     color+=vec3(.06,.052,.12)*horizon*clouds;
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
  // The aurora sits at clip-space far depth. Draw it after the opaque deck
  // and ice so their depth lets the GPU skip those sky pixels.
  sky.renderOrder=definition.air==='aurora'?100:-100;
  const {dark,glow,kind}=sky.material.uniforms;
  dark.value.setHex(definition.sky);
  glow.value.setHex(definition.haze);
  kind.value=atmosphereKinds[definition.air]??0;
 }
 function setup(record,base,scatter,fixtures,foundation){
  const {definition,root}=record;
  const plantings=definition.scatter?.[3];
  record.scenicTime={value:0};
  for(const current of definition.currents??[])root.add(createScenicDrift(THREE,record.scenicTime,current));
  record.platform=base.clone(true);
  record.platform.position.y=-3.768;
  const materials=new Map();
  record.platform.traverse(node=>{
   if(!node.isMesh)return;
   node.receiveShadow=true;
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
  if(foundation){
   const supports=foundation.clone(true),colors=definition.footing;
   supports.position.y=CAMPAIGN_FOOTING_Y;
   supports.traverse(node=>{
    if(!node.isMesh)return;
    if(colors){
     const suffix=node.material.name.split(' ').at(-1);
     const color=colors[suffix];
     if(color!==undefined){
      node.material=node.material.clone();node.material.color.setHex(color);
     }
    }
    node.receiveShadow=true;
   });
   root.add(supports);
  }
  record.pool=definition.id==='grotto'?createGrottoPool(THREE):createBiomeBasin(THREE,definition.id);
  if(record.pool)root.add(record.pool);
  const groundMaterials=new Map();
  record.props=fixtures.map((source,i)=>{
   const [id,anchor,scale,yaw,role]=definition.models[i];
   const mesh=source.clone(true);
   const terrain=/(basalt|reef|escarpment|icefall|orchard|buttress|fault-shelf)$/.test(id);
   if(role!=='horizon'){
    const palette=role==='ground'?groundMaterials:materials;
    mesh.traverse(node=>{
     if(!node.isMesh)return;
     if(!palette.has(node.material)){
      const finish=node.material.clone();
      const groundColor=role==='ground'?definition.ground?.[finish.name]:undefined;
      if(groundColor!==undefined){
       finish.color.setHex(groundColor);
       // Subtle bounce from the surrounding terrain fills the shaded faces.
       finish.emissive.copy(finish.color).multiplyScalar(.13);
       finish.emissiveIntensity=1;
      }
      if(!applyLandmarkFinish(THREE,finish,record.scenicTime)&&id!=='frost-icefall'){
       if(terrain||(definition.masonry&&/ (body|bevel|substructure)$/.test(finish.name))){
        finishGrottoRock(THREE,finish,definition.surface);
       }else if(node.geometry.getAttribute('uv')&&/ (body|bevel)$/.test(finish.name)){
        applyOpticFinish(THREE,finish,'brushed');
       }
      }
      palette.set(node.material,finish);
     }
     node.material=palette.get(node.material);
    });
   }
   mesh.position.fromArray(anchor);
   mesh.rotation.y=yaw;
   if(Array.isArray(scale))mesh.scale.fromArray(scale);
   else mesh.scale.setScalar(scale);
   if(role==='horizon'||(Math.hypot(anchor[0],anchor[2])>29&&/(ridge|terrace)/.test(id))){
    const horizon=new Map();
    mesh.traverse(node=>{
     if(!node.isMesh)return;
     if(!horizon.has(node.material)){
      const color=node.material.color.clone().lerp(tint.setHex(definition.fog),.91);
      horizon.set(node.material,new THREE.MeshBasicMaterial({color}));
     }
     node.material=horizon.get(node.material);
    });
   }
   mesh.traverse(node=>{if(node.isMesh){node.receiveShadow=true;node.castShadow=role!=='horizon'&&role!=='ground'&&!terrain}});
   if(role==='vent')mesh.add(createVentPlumes(THREE,record.scenicTime));
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
  for(const {mesh,anchor,yaw,role} of record.props){
   if(role==='ground')continue;
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
    const foundation=load(urlFor(scenery,'scenery/biome-deck-'+(definition.masonry?'arcade':'truss')));
    Promise.all([deck,scatter,foundation,...props]).then(([base,detail,supports,...models])=>{
     setup(record,base,detail,models,supports);
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
  active.scenicTime.value=t;
  sky.material.uniforms.time.value=t;
  if(active.pool)active.pool.material.uniforms.seconds.value=t;
  active.dust.rotation.y=t*(active.definition.id==='abyss'?.028:.009);
  for(const {mesh,yaw,role,anchor} of active.props){
   if(role==='iris'||role==='turn'||role==='pulse')mesh.rotation.y=yaw+Math.sin(t*.26)*.23;
   if(role==='survey'){
    // Local patrol outside the playable deck, with a fixed pose at t = 0.
    mesh.position.y=anchor[1]+.42*Math.sin(t*.58);
    mesh.position.z=anchor[2]+2.60*Math.sin(t*.17);
    mesh.rotation.y=yaw+.44*Math.sin(t*.17);
    mesh.rotation.z=.10*Math.sin(t*.50);
   }
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
