import {scenerySeed} from './campaign-worlds.js';
import {applyPanelSurface} from './panel-surface.js';

import {createOrbitalSky} from './orbital-benchmark.js';
import {applyOpticFinish} from './optic-textures.js';

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
 function sync(){
  root.visible=sky.visible=wanted&&status==='ready';
 }
 function startLoading(){
  status='loading';
  const load=id=>loader.loadAsync(assets[id]).then(asset=>asset.scene);
  Promise.all(['platform','dock','craft'].map(load)).then(([platform,dock,craft])=>{
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
   dock.position.set(20.4,-7.9,4.1);
   dock.rotation.y=-.38;
   dock.scale.setScalar(1.28);
   const serviceBay=dock.clone(true);
   serviceBay.position.set(-11.8,-7.2,-15.8);
   serviceBay.rotation.y=.51;
   serviceBay.scale.setScalar(1.36);
   const finished=new Set();
   dock.traverse(mesh=>{
    if(!mesh.isMesh||finished.has(mesh.material)||!mesh.geometry.getAttribute('uv'))return;
    finished.add(mesh.material);
    if(mesh.material.name.includes('bevel')||mesh.material.name.includes('body'))
     applyOpticFinish(THREE,mesh.material,'brushed');
   });
   craft.scale.setScalar(.90);
   craft.rotation.y=-.34;
   root.add(platform,dock,serviceBay,craft);
   nodes={dock,serviceBay,craft};
   status='ready';
  },()=>{status='error'}).then(()=>{
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
 function update(seconds,still,cameraPosition){
  if(!root.visible)return;
  const t=still?0:seconds;
  const {dock,serviceBay,craft}=nodes;
  // The mooring structures follow the camera clearance rule independently.
  dock.position.x=20.4+drift*1.4;
  for(const bay of [dock,serviceBay])
   bay.visible=bay.position.x*cameraPosition.x+bay.position.z*cameraPosition.z<20;
  craft.position.set(24+drift*2.4+Math.sin(t*.13)*3,-2.8+Math.sin(t*.24)*.30,-13.9+Math.cos(t*.13)*2.3);
 }
 return {setLevel,update,isVisible:()=>root.visible,getStatus:()=>status};
}
