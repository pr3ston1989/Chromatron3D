/**
 * Small, satisfying but non-intrusive completion moment.
 * Uses 3D rings instead of a blocking instant flash; the actual success
 * condition still comes only from the independent optics solver.
 */
export function createVictoryFX(THREE,world,pieces,palette,point){
 const group=new THREE.Group();world.add(group);
 const pulses=[];
 for(const p of pieces){
  if(p.inTray||p.type!=='target')continue;
  const color=new THREE.Color(palette[p.color]||'#ffffff');
  for(let i=0;i<2;i++){
   const geometry=new THREE.RingGeometry(.22,.285,64);
   const material=new THREE.MeshBasicMaterial({
    color,side:THREE.DoubleSide,transparent:true,opacity:.9,
    depthWrite:false,depthTest:false,toneMapped:false,
    blending:THREE.AdditiveBlending
   });
   const ring=new THREE.Mesh(geometry,material);
   ring.rotation.x=-Math.PI/2;ring.position.copy(point(p.x,p.y,.12+i*.015));
   ring.renderOrder=21;group.add(ring);
   pulses.push({ring,delay:i*.30});
  }
 }
 let finished=false;
 return {
  update(t){
   if(finished)return false;
   let allDone=true;
   for(const {ring,delay} of pulses){
    const age=Math.max(0,t-delay);
    const duration=1.6;
    const life=Math.min(1,age/duration);
    if(t-delay<duration)allDone=false;
    ring.visible=t>=delay && life<1;
    ring.scale.setScalar(.75+life*7);
    ring.material.opacity=.79*(1-life)**1.8;
   }
   if(allDone)finished=true;
   return !finished;
  },
  dispose(){
   for(const {ring} of pulses){ring.geometry.dispose();ring.material.dispose()}
   world.remove(group);
   group.clear();
  }
 };
}
