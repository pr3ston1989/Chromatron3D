/**
 * Soft contact shadows for optical instruments, rendered as a SINGLE instanced
 * GPU draw call. A texture is generated once; no shadow maps, extra lights or
 * per-device transparent meshes are required.
 *
 * A contact patch visually anchors machined hardware to the tiled board,
 * particularly when the camera is nearly top-down.
 */
export function createOpticContactShadows(THREE,parent,{
  maxPieces=256,tileSize=1.3,half=7
}={}){
 const resolution=64,bytes=new Uint8Array(resolution*resolution*4);
 for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
  const dx=(x+.5-resolution/2)/(resolution*.5);
  const dy=(y+.5-resolution/2)/(resolution*.5);
  const radial=Math.min(1,Math.hypot(dx,dy));
  const falloff=Math.pow(Math.max(0,1-radial),2.25);
  const offset=(y*resolution+x)*4;
  bytes[offset]=1;bytes[offset+1]=7;bytes[offset+2]=17;
  bytes[offset+3]=Math.round(224*falloff);
 }
 const texture=new THREE.DataTexture(bytes,resolution,resolution,THREE.RGBAFormat);
 texture.needsUpdate=true;
 texture.magFilter=THREE.LinearFilter;
 texture.minFilter=THREE.LinearFilter;
 texture.generateMipmaps=false;
 const material=new THREE.MeshBasicMaterial({
  map:texture,color:0xffffff,transparent:true,opacity:.84,
  depthWrite:false,depthTest:true,polygonOffset:true,polygonOffsetFactor:-1,
  side:THREE.DoubleSide
 });
 const geometry=new THREE.PlaneGeometry(tileSize*1.43,tileSize*1.43);
 const mesh=new THREE.InstancedMesh(geometry,material,maxPieces);
 mesh.name='instanced-optic-contact-shadows';
 mesh.frustumCulled=false;
 mesh.count=0;
 mesh.renderOrder=2;
 parent.add(mesh);
 const matrix=new THREE.Object3D();
 matrix.rotation.x=-Math.PI/2;
 matrix.position.y=.018;
 function update(pieces){
  const visible=pieces.filter(p=>!p.inTray);
  const count=Math.min(visible.length,maxPieces);
  mesh.count=count;
  for(let i=0;i<count;i++){
   const p=visible[i];
   matrix.position.x=(p.x-half)*tileSize;
   matrix.position.z=(p.y-half)*tileSize;
   // Bulkhead shadows are wider than the precision optics, so the physical
   // silhouettes read clearly while the grid stays bright enough to play.
   const scale=p.type==='wall'?1.19:p.type==='laser'?1.03:1;
   matrix.scale.set(scale,scale,1);
   matrix.updateMatrix();
   mesh.setMatrixAt(i,matrix.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
  return count;
 }
 function dispose(){
  parent.remove(mesh);
  geometry.dispose();material.dispose();texture.dispose();
 }
 return {mesh,texture,update,dispose};
}
