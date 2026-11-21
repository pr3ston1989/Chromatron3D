/**
 * Combine all segments of each laser layer and color into one draw call.
 * Camera-facing ribbons expand in the vertex shader as the player orbits.
 */
export function createBeamBatcher(THREE,parent){
 const ribbons=new Map();
 function addRibbon(a,b,width,orientation,material,order=6){
  const direction=b.clone().sub(a);
  if(direction.lengthSq()<1e-6)return;
  const cameraFacing=orientation==='camera';
  let points=[a,a,b,b];
  if(!cameraFacing){
   const sideways=orientation==='vertical'
    ?new THREE.Vector3(0,1,0)
    :new THREE.Vector3(-direction.z,0,direction.x).normalize();
   sideways.multiplyScalar(width*.5);
   points=[a.clone().sub(sideways),a.clone().add(sideways),b.clone().add(sideways),b.clone().sub(sideways)];
  }
  let batch=ribbons.get(material);
  if(!batch){batch={vertices:[],uvs:[],beamAxes:cameraFacing?[]:null,order};ribbons.set(material,batch)}
  for(const index of [0,1,2,0,2,3]){
   batch.vertices.push(...points[index].toArray());
   if(cameraFacing)batch.beamAxes.push(direction.x,direction.y,direction.z,width);
  }
  batch.uvs.push(0,0,0,1,1,1, 0,0,1,1,1,0);
 }
 function flush(){
  let drawCalls=0,segments=0;
  for(const [material,batch] of ribbons){
   if(!batch.vertices.length)continue;
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(batch.vertices,3));
   geometry.setAttribute('uv',new THREE.Float32BufferAttribute(batch.uvs,2));
   if(batch.beamAxes)geometry.setAttribute('beamAxis',new THREE.Float32BufferAttribute(batch.beamAxes,4));
   const mesh=new THREE.Mesh(geometry,material);
   mesh.frustumCulled=false;
   mesh.renderOrder=batch.order;
   mesh.name='batched-laser-ribbon';
   parent.add(mesh);
   drawCalls++;segments+=batch.vertices.length/18;
  }
  return {drawCalls,segments};
 }
 return {addRibbon,flush};
}
