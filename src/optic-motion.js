/** Small, deterministic easing helpers for visual-only optics motion. */
export const clamp01=t=>Math.max(0,Math.min(1,t));
export const easeOutCubic=t=>1-(1-clamp01(t))**3;
/** Choose the shortest signed circular distance, avoiding 315° spins at wrap. */
export const shortestAngle=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
/** Visual easing does not change the logical cell or beam physics. */
export function tweenPosition(from,to,progress){
 const e=easeOutCubic(progress);
 return from.map((v,i)=>v+(to[i]-v)*e);
}
/** Travel duration scales only mildly with distance for predictable response. */
export const travelDuration=(tileDistance)=>Math.min(420,180+Math.sqrt(Math.max(0,tileDistance))*55);
