export const OBSERVATORY=Object.freeze({
 id:'observatory',pl:'Obserwatorium pryzmatyczne',en:'Prism Observatory',
 sky:0x1a2841,fog:0x263652,edge:0x65c6ce,accent:0xaf7352,tileA:0x273b5b,nebula:0x2b416a
});

export function isObservatoryStage(packId,index){
 return packId==='demo'&&index===7;
}

const layoutHash=text=>{
 let h=2166136261;
 for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);
 return (h>>>0)/4294967296;
};

export function observatoryLayout(packId,index){
 const drift=layoutHash(packId+':'+index)-.5;
 return {
  arc:[3.8+drift*1.1,-2.9,-17.8+drift*.9],
  lens:[17.5+drift*1.0,-2.7,-3.6+drift*1.2],
  layers:[
   {anchor:[23,-19,-27],yaw:-.83,scale:[1.84,2.08,2.31],tint:0x1c2b44},
   {anchor:[35,-24,-37],yaw:-.85,scale:[2.35,2.36,2.4],tint:0x2c3d5a},
   {anchor:[47,-31,-47],yaw:-.78,scale:[2.70,2.72,2.3],tint:0x344667}
  ],
  phase:drift*Math.PI
 };
}

function createSky(THREE){
 const material=new THREE.ShaderMaterial({
  uniforms:{
   zenith:{value:new THREE.Color(0x0e1831)},
   haze:{value:new THREE.Color(0x3c527a)},
   nadir:{value:new THREE.Color(0x141f35)}
  },
  side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:`
   varying vec3 direction;
   void main(){
    direction=position;
    vec4 eye=viewMatrix*vec4(position+cameraPosition,1.0);
    gl_Position=projectionMatrix*eye;
    gl_Position.z=gl_Position.w;
   }
  `,
  fragmentShader:`
   uniform vec3 zenith;
   uniform vec3 haze;
   uniform vec3 nadir;
   varying vec3 direction;
   void main(){
    float up=normalize(direction).y;
    vec3 color=mix(nadir,haze,smoothstep(-0.93,-0.17,up));
    color=mix(color,zenith,smoothstep(-0.17,0.62,up));
    gl_FragColor=vec4(color,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }
  `
 });
 const dome=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),material);
 dome.name='Observatory dusk gradient';
 dome.frustumCulled=false;
 dome.renderOrder=-100;
 return dome;
}

function surveyMotes(THREE){
 const data=[];
 // The particles trace a ring outside the board, including when the camera orbits.
 for(let i=0;i<34;i++){
  const a=i*2.399;
  const r=18+layoutHash('radius'+i)*15;
  data.push(Math.cos(a)*r,-6+layoutHash('height'+i)*8,Math.sin(a)*r);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(data,3));
 return new THREE.Points(geometry,new THREE.PointsMaterial({
  color:0x7289a9,size:.12,transparent:true,opacity:.53,depthWrite:false
 }));
}

/** One cached pilot scene. The fallback remains live until every GLB is ready. */
export function createObservatory(THREE,scene,world,{loader,assets,onReady}){
 const root=new THREE.Group();
 root.name='Prism Observatory';
 root.visible=false;
 root.userData.scenicOnly=true;
 world.add(root);
 const sky=createSky(THREE);
 sky.visible=false;
 scene.add(sky);
 const motes=surveyMotes(THREE);
 root.add(motes);
 let loadStarted=false,wanted=false,status='idle',nodes,layout;
 function applyLayout(){
  if(!nodes||!layout)return;
  nodes.arc.position.fromArray(layout.arc);
  nodes.lens.position.fromArray(layout.lens);
  nodes.craft.position.set(5,-2.15,14.3);
  nodes.ridges.forEach((ridge,i)=>{
   const layer=layout.layers[i];
   ridge.position.fromArray(layer.anchor);
   ridge.scale.fromArray(layer.scale);
   ridge.rotation.y=layer.yaw;
  });
 }
 function startLoading(){
  loadStarted=true;
  status='loading';
  const load=id=>loader.loadAsync(assets[id]).then(result=>result.scene);
  Promise.all(['platform','arc','lens','iris','ridge','craft','landing'].map(load)).then(models=>{
   const [platform,arc,lens,iris,ridge,craft,landing]=models;
   platform.position.y=-3.76-.008;
   platform.traverse(o=>{
    if(!o.isMesh)return;
    o.receiveShadow=true;
    const name=o.material.name;
    if(name==='Uniform playing surface'||name==='Machined upper bevel')o.material.color.multiplyScalar(.52);
    if(name==='Inlay seam')o.material.color.multiplyScalar(.44);
   });
   arc.rotation.y=-.83;
   lens.rotation.y=-.69;
   lens.scale.setScalar(.87);
   const lensFoot=landing.clone(true);
   lensFoot.scale.set(.54,1.10,1.15);
   lensFoot.position.y=-1.39;
   lens.add(lensFoot);
   landing.position.y=-1.41;
   arc.add(landing);
   // Move the lens GLB into a pivot at the optical center of its cradle.
   const hinge=new THREE.Group();
   hinge.position.set(0,2.33,0);
   iris.position.y=-1.985;
   hinge.add(iris);
   lens.add(hinge);
   const ridges=Array.from({length:layout.layers.length},(_,i)=>{
    const model=ridge.clone(true);
    const material=new THREE.MeshBasicMaterial({color:layout.layers[i].tint,fog:true});
    model.traverse(node=>{if(node.isMesh)node.material=material});
    return model;
   });
   root.add(...ridges,platform,arc,lens,craft);
   nodes={arc,lens,hinge,ridges,craft};
   applyLayout();
   status='ready';
   root.visible=sky.visible=wanted;
   onReady();
  }).catch(()=>{
   status='error';
   onReady();
  });
 }
 function setLevel(enabled,packId,index){
  wanted=enabled;
  if(wanted){
   layout=observatoryLayout(packId,index);
   if(!loadStarted)startLoading();
   applyLayout();
  }
  root.visible=sky.visible=wanted&&status==='ready';
 }
 function update(seconds,still){
  if(!root.visible)return;
  const t=still?0:seconds;
  nodes.hinge.rotation.y=Math.sin(t*.20+layout.phase)*.23;
  nodes.craft.position.x=5+Math.sin(t*.14+layout.phase)*2.7;
  nodes.craft.position.y=-2.15+Math.sin(t*.24)*.22;
  nodes.craft.rotation.set(0,2.34,.06*Math.sin(t*.22));
  motes.rotation.y=t*.013;
 }
 return {setLevel,update,isVisible:()=>root.visible,getStatus:()=>status};
}
