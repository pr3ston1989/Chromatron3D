/**
 * A deterministic art-directed environment composition.
 *
 * Rather than putting randomly sized objects on a ring, ten non-overlapping
 * sockets form recognizable industrial / organic clusters between the four
 * main monuments. All sockets remain outside the 15×15 optical workspace.
 */
export const SCENIC_VISIBLE=Object.freeze({performance:3,balanced:6,cinematic:10});
export const SCENIC_MODELS=Object.freeze({
 orbital:Object.freeze(['orbital-dock','orbital-comms']),
 verdant:Object.freeze(['verdant-greenhouse','verdant-root-tower']),
 polar:Object.freeze(['polar-bridge','polar-geolab']),
 nebula:Object.freeze(['nebula-resonators','nebula-wreckage'])
});
export const SCENIC_CLEARANCE=10.5;
const SOCKETS=Object.freeze([
 [-18.8,-10.2],[-18.3,10.4],[18.8,-10.2],[18.3,10.4],
 [-9.6,-19.5],[9.6,-19.5],[-9.6,19.5],[9.6,19.5],
 [-25.8,-18.0],[25.8,18.0]
]);
function seedHash(value){
 let h=2166136261;
 for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 return h>>>0;
}
export function sceneryLayout(packId,index,seed=0,biome='orbital'){
 if(!Number.isInteger(index)||index<0||!SCENIC_MODELS[biome])
  throw new Error('Invalid scenery level or biome');
 const h=seedHash(packId+':'+index+':'+seed+':'+biome+':set-dressing');
 const quarter=h%4;
 const sin=[0,1,0,-1][quarter],cos=[1,0,-1,0][quarter];
 const offset=(h>>>12)%SOCKETS.length;
 const layout=SOCKETS.map((_,i)=>{
  const socket=SOCKETS[(i+offset)%SOCKETS.length];
  const x=socket[0]*cos-socket[1]*sin,z=socket[0]*sin+socket[1]*cos;
  const mod=seedHash(h+':'+i+':'+biome);
  const scale=.92+((mod>>>4)%16)/100;
  const turn=((mod>>>11)%21-10)*.025;
  return {
   x,y:-1.76,z,scale,rotation:Math.atan2(-x,-z)+turn,
   family:(i+(h>>>5))%2,
   activityPhase:((mod>>>16)%360)*Math.PI/180
  };
 });
 // Conservative 4.5-unit horizontal half-extent after uniform scaling.
 if(layout.some(p=>Math.max(Math.abs(p.x),Math.abs(p.z))-4.5*p.scale<SCENIC_CLEARANCE))
  throw new Error('Unsafe scenery outside board');
 return layout;
}
