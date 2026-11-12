/**
 * Normalize wheel devices before transforming an optic.
 *
 * Windows mice often emit one 3-line or 100px event per wheel notch; trackpads
 * emit many sub-pixel deltas, and browsers report pixels, lines or pages.
 * Treat motion as cumulative input, with one 45° turn per threshold.
 * The caller performs the visual easing; this module never touches Three.js.
 */
export function toWheelPixels(deltaY,deltaMode=0,pageHeight=750){
 if(!Number.isFinite(deltaY))return 0;
 if(deltaMode===1)return deltaY*32;
 if(deltaMode===2)return deltaY*Math.max(200,pageHeight);
 return deltaY;
}
export function createWheelRotation({threshold=78,resetAfterMs=260,maxSteps=2}={}){
 let carry=0,last=-Infinity;
 function consume(deltaY,deltaMode=0,now=0,pageHeight=750){
  let pixels=toWheelPixels(deltaY,deltaMode,pageHeight);
  if(Math.abs(pixels)<.05)return 0;
  if(now-last>resetAfterMs || (carry!==0&&Math.sign(pixels)!==Math.sign(carry)))carry=0;
  last=now;
  carry+=pixels;
  const steps=Math.max(-maxSteps,Math.min(maxSteps,Math.trunc(carry/threshold)));
  carry-=steps*threshold;
  // Discard extreme motion when the device reports many detents at once.
  carry=Math.max(-threshold+.001,Math.min(threshold-.001,carry));
  return steps;
 }
 function reset(){carry=0;last=-Infinity}
 return {consume,reset,get pending(){return carry}};
}
