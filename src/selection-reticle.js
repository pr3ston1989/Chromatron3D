/**
 * One reusable, restrained selection affordance for the entire board.
 * Precision corner brackets on the occupied tile replace large glowing
 * rings around the optical hardware. It never participates in picking,
 * collision detection, reflection or the puzzle solver.
 */
export function createSelectionReticle(THREE,parent,point,tileSize){
 const root=new THREE.Group();
 root.name='selection-precision-brackets';
 root.visible=false;
 parent.add(root);
 const trim=new THREE.MeshBasicMaterial({
  color:0x9eeadd,transparent:true,opacity:.8,depthWrite:false,
  depthTest:false,toneMapped:true
 });
 const floorMat=new THREE.MeshBasicMaterial({
  color:0x57bcd0,transparent:true,opacity:.055,depthWrite:false,
  depthTest:false,side:THREE.DoubleSide
 });
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(tileSize*.91,tileSize*.91),floorMat);
 floor.name='selected-cell-fill';
 floor.rotation.x=-Math.PI/2;
 floor.position.y=.004;
 floor.renderOrder=16;root.add(floor);
 const inset=tileSize*.38,arm=tileSize*.135,thickness=tileSize*.019;
 const parts=[];
 for(const sx of [-1,1])for(const sz of [-1,1]){
  const corner=new THREE.Group();
  corner.name='selection-corner';
  corner.position.set(sx*inset,.035,sz*inset);
  root.add(corner);
  const hx=new THREE.Mesh(new THREE.BoxGeometry(arm,.012,thickness),trim);
  hx.position.x=-sx*arm*.5;
  const hz=new THREE.Mesh(new THREE.BoxGeometry(thickness,.012,arm),trim);
  hz.position.z=-sz*arm*.5;
  hx.renderOrder=17;hz.renderOrder=17;
  corner.add(hx,hz);
  parts.push(corner);
 }
 const dot=new THREE.Mesh(new THREE.BoxGeometry(.052,.014,.052),
  new THREE.MeshBasicMaterial({color:0xe7f7fc,transparent:true,opacity:.7,depthWrite:false,depthTest:false}));
 dot.position.set(-inset,.035,-inset);
 dot.renderOrder=18;root.add(dot);
 function setPiece(piece){
  root.visible=Boolean(piece&&!piece.inTray);
  if(root.visible){
   root.position.copy(point(piece.x,piece.y,.045));
   root.userData.pieceId=piece.id;
  }else root.userData.pieceId=null;
 }
 function update(time,reducedMotion=false){
  if(!root.visible)return;
  const phase=reducedMotion?0:time*.0024;
  const breathe=reducedMotion?0:.035*Math.sin(phase);
  floorMat.opacity=.060+breathe*.5;
  trim.opacity=.79+breathe;
  for(const part of parts){
   part.scale.setScalar(reducedMotion?1:1+.018*Math.sin(phase));
  }
 }
 return {root,setPiece,update,
  dispose(){
   parent.remove(root);
   root.traverse(c=>{if(c.geometry)c.geometry.dispose()});
   trim.dispose();floorMat.dispose();dot.material.dispose();
  }};
}
