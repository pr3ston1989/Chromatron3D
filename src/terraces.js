import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Each habitat has a long, narrow footprint. Turn the long side parallel to
// the rim so even the tips of the canopy stay clear of the optical grid.
export function createTerraces(THREE,world,baseUrl){
 const loader=new GLTFLoader(),records=new Map();
 const sockets=[[0,-12.5,0],[0,12.5,Math.PI],[-12.5,0,Math.PI/2],[12.5,0,-Math.PI/2]];
 let active,level=0,count=4;
 function sync(){
  for(const [id,rec] of records){
   rec.group.visible=id===active;
   rec.group.children.forEach((island,i)=>{
    const [x,z,angle]=sockets[(i+level)%4];
    island.visible=i<count;
    island.position.set(x+(x===0?(i%2?3:-3):0),-.69,z+(z===0?(i%2?3:-3):0));
    island.rotation.y=angle;island.scale.setScalar(1.4);
   });
  }
 }
 function setLevel(id,index){
  active=id;level=index;
  if(!records.has(id)){
   const group=new THREE.Group(),rotors=[];
   group.name='terraces-'+id;world.add(group);
   records.set(id,{group,rotors});
   loader.load(baseUrl+id+'.glb',({scene})=>{
    for(let i=0;i<sockets.length;i++){
     const clone=scene.clone(true);
     const wheel=clone.getObjectByName('windwheel');
     if(wheel)rotors.push({wheel,rest:wheel.quaternion.clone()});
     group.add(clone);
    }
    sync();
   });
  }
  sync();
 }
 const axis=new THREE.Vector3(0,1,0);
 return {setLevel,setQuality(q){count=q==='performance'?2:4;sync()},
  update(time,still){
   const rec=records.get(active);
   rec?.rotors.forEach(({wheel,rest},i)=>{
    if(wheel.parent.visible){
     wheel.quaternion.copy(rest);
     if(!still)wheel.rotateOnAxis(axis,time*.64+i*1.7);
    }
   });
  }};
}
