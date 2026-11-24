import {useTool} from './hud-tools.js';
import {expect,test} from '@playwright/test';

test('sound starts from the player gesture, plays the motif and pauses when muted',async({page})=>{
 await page.addInitScript(()=>{
  const AudioContext=window.AudioContext;
  window.__soundProbe={context:null,oscillators:0};
  window.AudioContext=class extends AudioContext{
   constructor(...args){
    super(...args);
    window.__soundProbe.context=this;
   }
   createOscillator(){
    window.__soundProbe.oscillators++;
    return super.createOscillator();
   }
  };
 });
 await page.goto('/?debug=1');
 await page.waitForFunction(()=>Boolean(window.__debug));
 const audio=page.locator('#audio');
 await useTool(page,'audio');
 await expect(audio).toHaveAttribute('aria-pressed','true');
 const readProbe=()=>page.evaluate(()=>({
  state:window.__soundProbe.context?.state,notes:window.__soundProbe.oscillators
 }));
 await expect.poll(async()=>(await readProbe()).state).toBe('running');
 const initial=(await readProbe()).notes;
 await expect.poll(async()=>(await readProbe()).notes).toBeGreaterThan(initial);
 await useTool(page,'audio');
 await expect(audio).toHaveAttribute('aria-pressed','false');
 await expect.poll(async()=>(await readProbe()).state).toBe('suspended');
});
