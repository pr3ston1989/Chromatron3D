import {expect,test} from '@playwright/test';

test('slate stays visible within a cell and quieter than its joints on laptop and phone',async({page})=>{
 test.setTimeout(120000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?debug=1');
 await page.waitForFunction(()=>Boolean(window.__debug));
 await page.evaluate(()=>{
  window.__debug.switchCampaign('demo');window.__debug.loadLevel(3);
  window.__debug.freezeAnimations(true);
 });
 await expect.poll(()=>page.evaluate(()=>window.__debug.getLevelState().pilotStatus)).toBe('ready');
 await page.waitForLoadState('networkidle');
 for(const [width,height,overhead] of [[1366,768],[1280,720],[1093,614],[390,844],[390,844,true]]){
  await page.setViewportSize({width,height});
  if(overhead)await page.locator('#camera-preset').click();
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const frame=await page.screenshot();
  const {texture,joint}=await page.evaluate(async png=>{
   const image=await createImageBitmap(await (await fetch('data:image/png;base64,'+png)).blob());
   const ctx=new OffscreenCanvas(image.width,image.height).getContext('2d');
   ctx.drawImage(image,0,0);image.close();
   const {data,width}=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
   function luminance(x,y){
    const i=(Math.round(y)*width+Math.round(x))*4;
    return data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722;
   }
   const grain=[],edges=[],project=window.chromatron.projectCell;
   for(const x of [5,6,7,8,9])for(const y of [5,9,10]){
    const body=[];
    for(const u of [-.27,-.09,.09,.27])for(const v of [-.27,-.09,.09,.27]){
     const p=project(x+u,y+v,0);body.push(luminance(p.x,p.y));
    }
    body.sort((a,b)=>a-b);
    grain.push(body[13]-body[2]);
    const p=project(x+.5,y,0);
    edges.push(body[8]-Math.min(luminance(p.x,p.y),luminance(p.x-1,p.y),luminance(p.x+1,p.y)));
   }
   const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
   return {texture:median(grain),joint:median(edges)};
  },frame.toString('base64'));
  expect(texture,`slate detail at ${width}px`).toBeGreaterThan(1.3);
  expect(joint,`joint at ${width}px, interior contrast ${texture}`).toBeGreaterThan(texture);
 }
 expect(errors).toEqual([]);
});
