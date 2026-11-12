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
  // Traditional mouse wheels report 100px or 3 lines PER notch. Treat each
  // such event as one stable 45° step; accumulating 22px residue after every
  // 100px event caused an unwanted extra step every fourth notch.
  const isDetentedMouseEvent=(deltaMode===1&&Math.abs(deltaY)>=2)||
    (deltaMode===0&&Math.abs(pixels)>=80);
  if(isDetentedMouseEvent){
   carry=0;
   const detents=Math.max(1,Math.min(maxSteps,Math.round(Math.abs(pixels)/100)));
   return Math.sign(pixels)*detents;
  }
  carry+=pixels;
  const rawSteps=Math.trunc(carry/threshold);
  const steps=Math.max(-maxSteps,Math.min(maxSteps,rawSteps));
  // A very large trackpad burst must not leave a hidden extra rotation behind.
  carry=Math.abs(rawSteps)>maxSteps?0:carry-steps*threshold;
  return steps===0?0:steps;
 }
 function reset(){carry=0;last=-Infinity}
 return {consume,reset,get pending(){return carry}};
}
