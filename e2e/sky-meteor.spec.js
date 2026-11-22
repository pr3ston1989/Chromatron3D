import {test,expect} from '@playwright/test';

test('shooting stars appear in outdoor campaign skies and respect the reduced-motion setting',async({page})=>{
 test.setTimeout(90000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/?debug=1');
 await page.waitForFunction(()=>window.__debug);
 await page.locator('#graphics-quality').selectOption('performance');
 for(const [name,width,height] of [['shipyard',1366,768],['observatory',1280,720]]){
  await page.setViewportSize({width,height});
  await page.evaluate(name=>window.__debug.setTheme(name),name);
  await page.waitForFunction(()=>window.__debug.getLevelState().pilotStatus==='ready');
  const sample=await page.waitForFunction(()=>{
   const head=window.__debug.getAmbientMotion().meteor;
   return head?.intensity>.4&&head;
  });
  const head=await sample.jsonValue();
  expect(head.x).toBeGreaterThan(0);
  expect(head.x).toBeLessThan(width);
  expect(head.y).toBeLessThan(height*.35);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>page.evaluate(()=>window.__debug.getAmbientMotion().meteor)).toBeNull();
  await page.emulateMedia({reducedMotion:'no-preference'});
 }
 await page.setViewportSize({width:1093,height:614});
 await page.evaluate(()=>window.__debug.setTheme('grotto'));
 await page.waitForFunction(()=>window.__debug.getLevelState().pilotStatus==='ready');
 const seen=await page.evaluate(()=>new Promise(resolve=>{
  const start=performance.now();
  function sample(){
   if(window.__debug.getAmbientMotion().meteor)return resolve(true);
   if(performance.now()-start>7300)return resolve(false);
   requestAnimationFrame(sample);
  }
  sample();
 }));
 expect(seen).toBe(false);
 expect(errors).toEqual([]);
});
