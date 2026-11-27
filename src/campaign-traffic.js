// Individual flybys leave a quiet interval between passes. Mechanical tracks
// reverse smoothly at their fixed ends and remain parked in reduced motion.
export function trafficProgress(seconds,{period,duration,offset=0,shuttle=false},still){
 if(still)return shuttle?0:null;
 const cycle=(seconds+offset)%period;
 if(shuttle)return (1-Math.cos(cycle/period*Math.PI*2))*.5;
 return cycle<duration?cycle/duration:null;
}

export function createCampaignTraffic(THREE,source,spec){
 const root=new THREE.Group(),materials=new Map(),parts=[];
 const count=spec.count??1;
 const from=new THREE.Vector3(...spec.from),to=new THREE.Vector3(...spec.to);
 const direction=to.clone().sub(from).normalize();
 const side=new THREE.Vector3(direction.z,0,-direction.x);
 const heading=spec.heading??Math.atan2(direction.x,direction.z);
 const dummy=new THREE.Object3D(),matrix=new THREE.Matrix4();
 source.updateMatrixWorld(true);
 source.traverse(node=>{
  if(!node.isMesh)return;
  const original=node.material;
  if(!materials.has(original)){
   const material=original.clone();
   const tint=spec.palette?.[material.name];
   if(tint!==undefined)material.color.setHex(tint);
   materials.set(original,material);
  }
  const mesh=new THREE.InstancedMesh(node.geometry,materials.get(original),count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled=false;
  // The bounds enclose the full route, so raycasts see the current poses
  // without rebuilding a bounding sphere on each animation frame.
  mesh.boundingSphere=new THREE.Sphere(from.clone().lerp(to,.5),from.distanceTo(to)*.5+8);
  root.add(mesh);
  parts.push({mesh,base:node.matrixWorld.clone()});
 });
 function update(time,still){
  const progress=trafficProgress(time,spec,still);
  root.visible=progress!==null;
  if(progress===null)return;
  for(let i=0;i<count;i++){
   const phase=i*2.39996;
   const offset=count>1?(i-(count-1)*.5):0;
   const t=spec.shuttle?0:time;
   dummy.position.lerpVectors(from,to,progress);
   dummy.position.addScaledVector(direction,offset*.93);
   dummy.position.addScaledVector(side,Math.sin(phase)*.98+.34*Math.sin(t*.72+phase));
   if(!spec.shuttle)dummy.position.y+=.29*Math.sin(t*1.36+phase)+offset*.18;
   dummy.rotation.set(0,heading+(spec.shuttle?0:.16*Math.sin(t*.59+phase)),spec.shuttle?0:.14*Math.sin(t*.93+phase));
   const edge=spec.shuttle?1:THREE.MathUtils.smoothstep(progress,0,.09)*
    (1-THREE.MathUtils.smoothstep(progress,.91,1));
   dummy.scale.setScalar(spec.scale*(.22+.78*edge)*(1+offset*.047));
   dummy.updateMatrix();
   for(const {mesh,base} of parts)mesh.setMatrixAt(i,matrix.multiplyMatrices(dummy.matrix,base));
  }
  for(const {mesh} of parts)mesh.instanceMatrix.needsUpdate=true;
 }
 root.name=spec.model;
 update(0,true);
 return {root,update};
}
