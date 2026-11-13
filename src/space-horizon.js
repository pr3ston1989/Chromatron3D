/**
 * Three monumental silhouettes, layered volumetric-look nebula sprites and
 * very slow infrastructure activity in the far distance.
 *
 * All assets are cached once per biome and sit far behind the playable grid.
 * The background planes use the same shared nebula DataTexture already
 * created by world-biomes; no additional runtime texture is needed.
 */
export const HORIZON_QUALITY=Object.freeze({
 performance:Object.freeze({structures:1,clouds:1}),
 balanced:Object.freeze({structures:2,clouds:2}),
 cinematic:Object.freeze({structures:3,clouds:3})
});
const ANCHORS=Object.freeze([
 [53,-25,-84],[-48,-35,-80],[83,-34,35]
]);
const AIR_PALLETTE=Object.freeze({scrap:'docking-ring',moss:'bio-ark',ice:'antenna-array',crystal:'fractured-reactor'});
export function createSpaceHorizon(THREE,sky,theme,random,nebulaTexture){
 const root=new THREE.Group();
 root.name='environment-deep-horizon';root.userData.scenicOnly=true;
 sky.add(root);
 const form=AIR_PALLETTE[theme.decor]||'docking-ring';
 const hull=new THREE.MeshStandardMaterial({
  color:theme.tileA,metalness:theme.decor==='moss'?.19:.58,
  roughness:.58,emissive:theme.fog,emissiveIntensity:.22,
  flatShading:true,fog:false
 });
 const trim=new THREE.MeshStandardMaterial({
  color:theme.accent,metalness:.55,roughness:.46,
  emissive:theme.edge,emissiveIntensity:.08,fog:false
 });
 const glow=new THREE.MeshBasicMaterial({
  color:theme.edge,transparent:true,opacity:.32,depthWrite:false,
  fog:false,blending:THREE.AdditiveBlending
 });
 const volumes=[];
 const beaconGeo=new THREE.SphereGeometry(.38,8,6);
 const baseBeam=new THREE.CylinderGeometry(.5,.5,1,6);
 const axis=new THREE.Vector3(0,1,0);
 function part(parent,geometry,material,name){
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name=name;mesh.userData.scenicOnly=true;
  mesh.castShadow=false;mesh.receiveShadow=false;
  parent.add(mesh);return mesh;
 }
 function brace(parent,a,b,radius,material=hull){
  const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b);
  const line=part(parent,baseBeam,material,'distant-truss');
  const delta=to.clone().sub(from);
  line.position.copy(from).add(to).multiplyScalar(.5);
  line.quaternion.setFromUnitVectors(axis,delta.clone().normalize());
  line.scale.set(radius*2,delta.length(),radius*2);
  return line;
 }
 function torus(parent,radius,tube,material,ax=0,ay=0){
  const mesh=part(parent,new THREE.TorusGeometry(radius,tube,7,72),material,'distant-megastructure-ring');
  mesh.rotation.set(ax,ay,0);return mesh;
 }
 function beacon(parent,x,y,z){
  const node=part(parent,beaconGeo,glow,'distant-signal-light');
  node.position.set(x,y,z);return node;
 }
 function createStructure(index){
  const group=new THREE.Group();
  group.name='distant-'+form+'-'+index;
  group.userData.scenicOnly=true;
  root.add(group);
  const body=new THREE.Group();body.name='horizon-mechanism';group.add(body);
  if(form==='docking-ring'){
   torus(body,9.1,.30,hull,.48,.20);
   torus(body,7.7,.13,trim,.48,.20);
   torus(body,4.1,.12,hull,.10,.45);
   part(body,new THREE.CylinderGeometry(2.1,2.8,3.4,10),hull,'central-cargo-hub');
   for(let j=0;j<8;j++){
    const a=j*Math.PI/4,c=Math.cos(a),s=Math.sin(a);
    brace(body,[c*2,0,s*2],[c*9,Math.sin(a*2)*1.2,s*9],.20,hull);
    beacon(body,c*9,s*.7,s*9);
   }
   for(const x of [-13,13]){
    const dock=part(body,new THREE.BoxGeometry(7,.9,2.7),hull,'outer-loading-pier');
    dock.position.set(x,-1,0);
    beacon(body,x,-.4,1.4);
   }
  }else if(form==='bio-ark'){
   for(const [radius,offset] of [[10,0],[7.8,1.2],[5.7,-1.1]]){
    const arch=torus(body,radius,.25,hull,.75,.30);arch.position.y=offset;
   }
   const hall=part(body,new THREE.SphereGeometry(3.8,18,12),hull,'suspended-biosphere');
   hall.scale.set(1.8,.68,1);hall.position.y=-1.5;
   for(let j=0;j<10;j++){
    const a=j*Math.PI/5,x=Math.cos(a)*8.5,z=Math.sin(a)*7;
    brace(body,[x,1,z],[x*.66,-6-j%3,z*.65],.12,trim);
    const growth=part(body,new THREE.ConeGeometry(1.1,2.8,5),hull,'hanging-garden-crown');
    growth.position.set(x*.72,-5.8,z*.7);
   }
   for(let j=0;j<5;j++)beacon(body,Math.cos(j*1.25)*4,-2,Math.sin(j*1.25)*3);
  }else if(form==='antenna-array'){
   torus(body,10.6,.22,trim,.23,.40);
   torus(body,6.5,.12,hull,.23,.40);
   const disc=part(body,new THREE.CylinderGeometry(4.9,4.9,.35,16),hull,'deep-sky-telescope');
   disc.rotation.z=.25;
   for(let j=0;j<12;j++){
    const a=j*Math.PI/6,x=Math.cos(a)*10.3,z=Math.sin(a)*10.3;
    brace(body,[x,-1,z],[x*.55,0,z*.55],.09,trim);
    if(j%2===0){
     const shard=part(body,new THREE.ConeGeometry(.75,4+j%3,5),hull,'ice-telemetry-spire');
     shard.position.set(x,-1.6,z);
    }
   }
   brace(body,[0,0,0],[0,9,0],.20,hull);
   beacon(body,0,10,0);
  }else{
   torus(body,10.6,.24,hull,.55,.14);
   torus(body,8.1,.17,trim,1.12,.65);
   torus(body,5.6,.11,hull,-.4,.96);
   const core=part(body,new THREE.OctahedronGeometry(4.2,1),trim,'floating-reactor-core');
   core.rotation.z=.27;
   for(let j=0;j<9;j++){
    const a=j*Math.PI*2/9,x=Math.cos(a)*12,z=Math.sin(a)*12;
    const crystal=part(body,new THREE.OctahedronGeometry(1.4+(j%3)*.34,0),hull,'distant-energy-fragment');
    crystal.position.set(x,(j%4-1.5)*2,z);
    beacon(body,x*.72,(j%4-1.5)*1.3,z*.72);
   }
  }
  group.position.set(...ANCHORS[index]);
  return {group,body,base:0,phase:random()*Math.PI*2};
 }
 for(let i=0;i<3;i++)volumes.push(createStructure(i));
 const clouds=[];
 const cloudBases=[[50,-24,-105],[92,-31,30],[-47,-38,-91]];
 for(let i=0;i<3;i++){
  const mat=new THREE.SpriteMaterial({
   map:nebulaTexture,color:theme.nebula,transparent:true,
   opacity:.12+i*.022,depthWrite:false,depthTest:true,
   blending:THREE.AdditiveBlending,fog:false
  });
  const cloud=new THREE.Sprite(mat);cloud.name='distant-parallax-haze-'+i;
  const at=cloudBases[i];
  cloud.position.set(...at);
  cloud.scale.set(105+i*15,53+i*8,1);
  cloud.userData.scenicOnly=true;
  root.add(cloud);clouds.push(cloud);
 }
 let quality='balanced';
 function setQuality(mode='balanced'){
  quality=HORIZON_QUALITY[mode]?mode:'balanced';
  const profile=HORIZON_QUALITY[quality];
  volumes.forEach((v,i)=>v.group.visible=i<profile.structures);
  clouds.forEach((cloud,i)=>cloud.visible=i<profile.clouds);
 }
 function setLayout(layoutRandom,skyYaw=0){
  // Counter-rotation keeps the meaningful silhouettes within the default
  // playable camera framing even when the starfield is shuffled.
  root.rotation.y=-skyYaw;
  for(const [i,v] of volumes.entries()){
   const a=ANCHORS[i];
   v.group.position.set(a[0]+(layoutRandom()-.5)*12,
    a[1]+(layoutRandom()-.5)*6,a[2]+(layoutRandom()-.5)*13);
   v.group.scale.setScalar(.84+layoutRandom()*.22);
   v.base=(layoutRandom()-.5)*.75;
   v.body.rotation.y=v.base;
   v.phase=layoutRandom()*Math.PI*2;
  }
  clouds.forEach((cloud,i)=>{
   const at=cloudBases[i];
   cloud.position.set(at[0]+(layoutRandom()-.5)*8,at[1],
    at[2]+(layoutRandom()-.5)*8);
  });
 }
 function update(seconds,reducedMotion=false){
  for(const v of volumes){
   if(!v.group.visible)continue;
   v.body.rotation.y=v.base+(reducedMotion?0:seconds*.0018*Math.sin(v.phase+.3));
  }
  glow.opacity=reducedMotion?.29:.27+.11*(.5+.5*Math.sin(seconds*.31));
  clouds.forEach((cloud,i)=>{
   cloud.material.opacity=reducedMotion?.12+i*.022:
    (.12+i*.022)*(1+.11*Math.sin(seconds*.11+i*1.7));
  });
 }
 function getStats(){
  return {form,structures:volumes.filter(v=>v.group.visible).length,
   clouds:clouds.filter(c=>c.visible).length,quality};
 }
 setQuality('balanced');
 return {root,setQuality,setLayout,update,getStats};
}
