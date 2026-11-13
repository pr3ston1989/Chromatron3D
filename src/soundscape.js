// An original eight-bar score. Biomes transpose the motif; every note and
// mechanical chime is synthesized locally after the player's sound gesture.
export function createSoundscape(){
 let ctx,master,timer,beat=0,biome='orbital',enabled=false;
 const roots=[50,46,53,48],motif=[12,19,22,17,14,21,19,12];
 const hz=midi=>440*2**((midi-69)/12);
 function voice(pitch,endPitch,length,volume,delay=0,wave='sine'){
  if(!enabled||ctx?.state!=='running')return;
  const time=ctx.currentTime+delay;
  const osc=ctx.createOscillator(),env=ctx.createGain();
  osc.type=wave;
  osc.frequency.setValueAtTime(pitch,time);
  osc.frequency.exponentialRampToValueAtTime(endPitch,time+length);
  env.gain.setValueAtTime(.0001,time);
  env.gain.exponentialRampToValueAtTime(volume,time+Math.min(.025,length/4));
  env.gain.exponentialRampToValueAtTime(.0001,time+length);
  osc.connect(env).connect(master);
  osc.onended=()=>{osc.disconnect();env.disconnect()};
  osc.start(time);osc.stop(time+length);
 }
 function music(){
  if(document.hidden||ctx?.state!=='running')return;
  const root=roots[Math.floor(beat/8)%4]+({verdant:5,polar:2,nebula:-3}[biome]||0);
  if(beat%4===0){
   voice(hz(root),hz(root),2.9,.075);
   voice(hz(root+7),hz(root+7),2.3,.026,.12);
  }
  if(beat%4!==3){
   const note=hz(root+motif[beat%8]);
   voice(note,note,1.25,.036,0,'triangle');
   voice(note*2,note*2,.85,.009,.22);
  }
  beat=(beat+1)%32;
 }
 async function setEnabled(on){
  enabled=on;clearInterval(timer);
  if(!on){if(ctx)await ctx.suspend();return}
  ctx??=new AudioContext();
  if(!master){master=ctx.createGain();master.gain.value=.35;master.connect(ctx.destination)}
  await ctx.resume();
  if(enabled){music();timer=setInterval(music,740)}
 }
 function effect(freq,length){
  if(freq===880){
   [0,4,7,12].forEach((step,i)=>{const f=hz(67+step);voice(f,f,.55,.12,i*.085)});
  }else{
   voice(freq*1.2,freq,length+.07,.13,0,'triangle');
   voice(freq*2.72,freq*2.3,length+.10,.038,.008);
  }
 }
 return {setEnabled,effect,setBiome:id=>{biome=id}};
}
