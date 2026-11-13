/**
 * A render frame can be delayed for seconds in a background tab or when the
 * GPU is overloaded. Ensure optical hardware finishes its visual transition
 * even if requestAnimationFrame is stalled. Logical optics are never delayed.
 *
 * Browser scheduling is injected so this module stays deterministic in tests.
 */
export function applyOpticTween(tween,progress) {
 const amount=Math.max(0,Math.min(1,progress));
 if(tween.kind==='move'){
  tween.object.position.copy(tween.from).lerp(tween.to,amount);
 }else if(tween.kind==='rotate'){
  tween.object.rotation.y=tween.from+(tween.to-tween.from)*amount;
  if(tween.footprint) tween.footprint.rotation.y=tween.object.rotation.y;
 }else if(tween.kind==='appear'){
  tween.object.position.y=tween.toY-.18*(1-amount);
  tween.object.scale.setScalar(.62+.38*amount);
 }
}
export function enqueueOpticTween(tweens,tween,schedule) {
 if(typeof schedule!=='function')throw new TypeError('A scheduler is required');
 tweens.push(tween);
 // At normal frame rates the RAF loop finishes and removes this tween first.
 // On a stuck renderer the lightweight timer settles the same final pose.
 schedule(()=>{
  const index=tweens.indexOf(tween);
  if(index===-1)return;
  applyOpticTween(tween,1);
  tweens.splice(index,1);
 },Math.max(0,tween.duration)+50);
 return tween;
}
