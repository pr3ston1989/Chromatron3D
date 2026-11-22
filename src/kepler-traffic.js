// The tender and antenna have their pivots at the fuselage and elevation
// bearing in the Blender file. The rest of the dock remains a static batch.
export function createDockPatrol(THREE,dock,belt){
 const tender=dock.getObjectByName('Survey_tender');
 const dish=dock.getObjectByName('Tracking_reflector');
 const berth=tender.position.clone();
 const radius=Math.hypot(berth.x,berth.z);
 const bearing=Math.atan2(-berth.z,berth.x);
 const axle=new THREE.Vector3(dish.position.z,0,-dish.position.x).normalize();
 const ease=THREE.MathUtils.smootherstep;

 return function update(seconds){
  const t=seconds%57;
  const lift=ease(t,2,5)*(1-ease(t,50,54));
  const clearance=ease(t,4,11)*(1-ease(t,43,50));
  const turn=2*Math.PI*ease(t,8,47);
  const lane=radius+8.2*clearance;
  tender.position.set(lane*Math.cos(bearing+turn),berth.y+1.12*lift,-lane*Math.sin(bearing+turn));
  tender.rotation.y=turn;
  dish.quaternion.setFromAxisAngle(axle,.34*Math.sin(seconds*.29));
  belt.position.set(1.25*Math.sin(seconds*.068),.45*Math.sin(seconds*.085),0);
  belt.rotation.y=.018*Math.sin(seconds*.043);
 };
}
