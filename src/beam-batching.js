/**
 * Batch geometric laser layers by material.
 *
 * Before batching, each 1-cell ray allocated 2 cylinders + 3 ribbon meshes:
 * a 25-cell route required ~125 draw calls for beam geometry alone.
 * This module preserves their exact shaders, positions, additive blending
 * and colors while reducing them to a few instanced/batched draw calls.
 *
 * Physics / emitted colors remain the responsibility of optics.js.
 */
export function createBeamBatcher(THREE,parent){
 const ribbons=new Map(),tubes=new Map();
 const up=new THREE.Vector3(0,1,0);
 function addRibbon(a,b,width,vertical,material,order=6){
  const direction=b.clone().sub(a);
  if(direction.lengthSq()<1e-6)return;
  const sideways=vertical
   ?new THREE.Vector3(0,1,0)
   :new THREE.Vector3(-direction.z,0,direction.x).normalize();
  sideways.multiplyScalar(width*.5);
  const points=[
   a.clone().sub(sideways),a.clone().add(sideways),
   b.clone().add(sideways),b.clone().sub(sideways)
  ];
  let batch=ribbons.get(material);
  if(!batch){batch={vertices:[],uvs:[],order};ribbons.set(material,batch)}
  for(const index of [0,1,2,0,2,3])
   batch.vertices.push(...points[index].toArray());
  batch.uvs.push(0,0,0,1,1,1, 0,0,1,1,1,0);
 }
 function addTube(a,b,radius,material,order){
  const direction=b.clone().sub(a),length=direction.length();
  if(length<.001)return;
  const key=radius+':'+order;
  let byMaterial=tubes.get(key);
  if(!byMaterial){byMaterial=new Map();tubes.set(key,byMaterial)}
  let matrices=byMaterial.get(material);
  if(!matrices){matrices=[];byMaterial.set(material,matrices)}
  const position=a.clone().add(b).multiplyScalar(.5);
  const quaternion=new THREE.Quaternion().setFromUnitVectors(up,direction.normalize());
  const scale=new THREE.Vector3(1,length,1);
  matrices.push(new THREE.Matrix4().compose(position,quaternion,scale));
 }
 function flush(){
  let drawCalls=0,segments=0;
  for(const [material,batch] of ribbons){
   if(!batch.vertices.length)continue;
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(batch.vertices,3));
   geometry.setAttribute('uv',new THREE.Float32BufferAttribute(batch.uvs,2));
   const mesh=new THREE.Mesh(geometry,material);
   mesh.frustumCulled=false;
   mesh.renderOrder=batch.order;
   mesh.name='batched-laser-ribbon';
   parent.add(mesh);
   drawCalls++;segments+=batch.vertices.length/18;
  }
  for(const [key,byMaterial] of tubes){
   const [radius,order]=key.split(':').map(Number);
   const geometry=new THREE.CylinderGeometry(radius,radius,1,radius>.02?9:7);
   for(const [material,matrices] of byMaterial){
    const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
    mesh.name='instanced-laser-tubes';
    mesh.renderOrder=order;
    mesh.frustumCulled=false;
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
    mesh.instanceMatrix.needsUpdate=true;
    parent.add(mesh);
    drawCalls++;
   }
  }
  return {drawCalls,segments};
 }
 return {addRibbon,addTube,flush};
}
