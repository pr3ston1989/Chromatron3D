import {scenerySeed} from './campaign-worlds.js';
import {applyPanelSurface} from './panel-surface.js';

import {createOrbitalSky} from './orbital-benchmark.js';
import {applyOpticFinish} from './optic-textures.js';
import {createScenicDrift} from './scenic-drift.js';

const terminalUrl=new URL('../assets/models/scenery/shipyard-transfer-dock.glb',import.meta.url).href;
const tugUrl=new URL('../assets/models/scenery/shipyard-cargo-tug.glb',import.meta.url).href;

/** One cached decorative layer, loaded atomically while the regular stage remains playable. */
export function createShipyard(THREE,scene,world,{loader,assets,onReady}){
 const root=new THREE.Group();
 root.name='Orbital Shipyard';
 root.userData.scenicOnly=true;
 root.visible=false;
 world.add(root);
 const sky=createOrbitalSky(THREE,{planet:[.62,-.74,-.54],sun:[.76,-.21,-.55]});
 sky.visible=false;
 scene.add(sky);
 let wanted=false,status='idle',nodes,drift=0;
 const trafficTime={value:0};
 function sync(){
  root.visible=sky.visible=wanted&&status==='ready';
 }
 function startLoading(){
  status='loading';
  const load=url=>loader.loadAsync(url).then(asset=>asset.scene);
  Promise.all([assets.platform,assets.dock,assets.craft,terminalUrl,tugUrl].map(load)).then(([platform,dock,scout,terminal,tug])=>{
   platform.position.y=-3.768;
   platform.traverse(node=>{
    if(!node.isMesh)return;
    node.receiveShadow=true;
    const material=node.material;
    if(material.name==='Uniform playing surface'||material.name==='Machined upper bevel')
     material.color.multiplyScalar(.59);
    if(material.name==='Inlay seam')material.color.multiplyScalar(.70);
    if(material.name==='Uniform playing surface')applyPanelSurface(THREE,material,'shipyard',.037);
   });
   const place=(object,x,y,z,scale,yaw)=>{
    object.position.set(x,y,z);object.scale.setScalar(scale);object.rotation.y=yaw;
    root.add(object);
   };
   place(terminal,-11.7,-8.69,-13.5,1.35,-.45);
   place(terminal.clone(true),9.8,-10.3,14.6,1.29,-.54);
   place(dock,25.4,-9.1,-14.5,1.14,-.30);
   root.add(platform,scout,tug);
   const finished=new Set();
   root.traverse(mesh=>{
    if(!mesh.isMesh||finished.has(mesh.material)||!mesh.geometry.getAttribute('uv'))return;
    finished.add(mesh.material);
    if(/ (bevel|body)$/.test(mesh.material.name))
     applyOpticFinish(THREE,mesh.material,'brushed');
   });
   tug.scale.setScalar(1.42);
   for(const x of [-1.05,1.05])tug.add(createScenicDrift(THREE,trafficTime,{
    count:12,origin:[x,.37,-1.60],spread:[.16,.15,.13],travel:[0,.03,-1.27],
    tint:0x55c7fc,size:.18,length:.41,opacity:.64,rate:1.65
   }));
   scout.scale.setScalar(1.15);
   scout.rotation.y=-.34;
   nodes={scout,tug};
   status='ready';
  }).catch(error=>{status='error';console.error('Orbital shipyard',error)}).then(()=>{
   sync();
   onReady();
  });
 }
 function setLevel(enabled,campaign,index){
  wanted=enabled;
  if(wanted)drift=campaign==='demo'?0:scenerySeed(campaign,index)/4294967296-.5;
  if(wanted&&status==='idle')startLoading();
  sync();
 }
 function update(seconds,still){
  if(!root.visible)return;
  const t=still?0:seconds;
  trafficTime.value=t;
  const {scout,tug}=nodes;
  scout.position.set(30+drift*2.4+Math.sin(t*.13)*3,-4.3+Math.sin(t*.24)*.30,-23.9+Math.cos(t*.13)*2.3);
  const leg=t*.20;
  tug.position.set(14.3+drift+Math.sin(leg)*1.2,-4.67+Math.sin(t*.42)*.28,10.2+Math.sin(leg)*2.3);
  tug.rotation.set(.07*Math.sin(t*.63),-.67+.31*Math.sin(leg),.06*Math.sin(t*.48));
 }
 return {setLevel,update,isVisible:()=>root.visible,getStatus:()=>status};
}
