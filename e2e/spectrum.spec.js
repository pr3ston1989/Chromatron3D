import {expect,test} from '@playwright/test';
import {DEMO_SOLUTIONS,PROTOTYPE_LEVELS} from '../src/levels.js';

async function colourScores(page,points){
 const png=await page.screenshot();
 return page.evaluate(async({png,points})=>{
  const blob=await (await fetch('data:image/png;base64,'+png)).blob();
  const image=await createImageBitmap(blob);
  const canvas=new OffscreenCanvas(image.width,image.height);
  const pixels=canvas.getContext('2d');
  pixels.drawImage(image,0,0);
  image.close();
  return points.map(({x,y,mask})=>{
   const rgba=pixels.getImageData(Math.round(x)-2,Math.round(y)-2,5,5).data;
   let best=-255;
   for(let i=0;i<rgba.length;i+=4){
    const rgb=[rgba[i],rgba[i+1],rgba[i+2]];
    const low=Math.min(...rgb),high=Math.max(...rgb);
    const wanted=rgb.filter((_,channel)=>mask&(1<<channel));
    const other=rgb.filter((_,channel)=>!(mask&(1<<channel)));
    const score=mask===7?low-(high-low):Math.min(...wanted)-Math.max(...other);
    best=Math.max(best,score);
   }
   return best;
  });
 },{png:png.toString('base64'),points});
}

test('beam cores and receiver lenses keep distinct hues at playable screen sizes',async({page})=>{
 test.setTimeout(120000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?debug=1');
 await page.waitForFunction(()=>Boolean(window.__debug));
 const masks=[1,2,3,4,5,6,7];
 const pieces=masks.flatMap((mask,index)=>{
  const y=1+2*index;
  return [
   ['laser',2,y,2,mask],['target',10,y,0,mask],
   mask===6?['target',12,y,0,4]:['wall',12,y,0,0],
   ['target',13,y,0,mask]
  ];
 });
 await page.evaluate(pieces=>{
  window.__debug.setTheme('heliostat');
  window.chromatron.loadLevels([{pieces}]);
  window.__debug.freezeAnimations(true);
 },pieces);
 await page.waitForLoadState('networkidle');
 await expect.poll(()=>page.evaluate(()=>window.__debug.getLevelState().pilotStatus)).toBe('ready');

 for(const [width,height,quality] of [[1366,768,'cinematic'],[1280,720,'balanced'],[1093,614,'performance'],[390,844,'performance']]){
  await page.setViewportSize({width,height});
  await page.locator('#graphics-quality').selectOption(quality);
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const points=await page.evaluate(masks=>masks.flatMap((mask,index)=>{
   const y=1+index*2;
   const sample=(kind,x,mask,height)=>({kind,mask,...window.chromatron.projectCell(x,y,height)});
   return [
    sample('beam',5.5,mask,.78),
    sample('active lens',10,mask,.79),
    mask===6?sample('blue lens hit by cyan',12,4,.79):sample('idle lens',13,mask,.79)
   ];
  }),masks);
  const scores=await colourScores(page,points);
  for(const [index,{kind,mask}] of points.entries()){
   const threshold=mask===7?145:kind==='active lens'?27:38;
   expect.soft(scores[index],`${width} × ${height} · ${kind} · RGB mask ${mask}`).toBeGreaterThan(threshold);
  }
 }
});

test('the prism separates white into visible RGB branches on the Three Wavelengths board',async({page})=>{
 test.setTimeout(120000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?debug=1');
 await page.waitForFunction(()=>Boolean(window.__debug));
 await page.evaluate(moves=>{
  window.__debug.switchCampaign('demo');
  window.__debug.loadLevel(7);
  window.__debug.freezeAnimations(true);
  moves.forEach(move=>window.__debug.applyMove(move));
 },DEMO_SOLUTIONS[6]);
 await page.locator('#win-close').click();
 await page.waitForLoadState('networkidle');
 expect(await page.evaluate(()=>window.__debug.isSolved())).toBe(true);
 for(const [width,height] of [[1366,768],[1280,720],[1093,614],[390,844]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const {hit,points}=await page.evaluate(()=>{
   const api=window.chromatron;
   const center=api.projectCell(7,7,.78);
   const points=[[6,7,7],[8,7,4],[7.8,7.8,2],[7,8,1]].map(([x,y,mask])=>
    ({...api.projectCell(x,y,.78),mask}));
   return {hit:api.inspectPointer(center.x,center.y).hit?.pieceType,points};
  });
  expect(hit).toBe('prism');
  const scores=await colourScores(page,points);
  for(const [i,{mask}] of points.entries())
   expect.soft(scores[i],`${width}px · prism path ${mask}`).toBeGreaterThan(mask===7?145:38);
 }
 // Feed both instruments at the same location, then check which wavelengths
 // really leave the cell. Reuse the authored layout and change the source.
 for(const [type,input,rot,expected] of [['prism',1,0,[1]],['splitter',7,1,[7,7]]]){
  const outputs=await page.evaluate(({original,type,input,rot})=>{
   const pieces=original.map(([kind,x,y,r,color])=>kind==='prism'?[type,7,7,rot,0]:
    [kind,x,y,r,kind==='laser'?input:color]);
   window.chromatron.loadLevels([{pieces}]);
   return window.chromatron.getState().result.segments.filter(s=>s.x===7&&s.y===7).map(s=>s.color);
  },{original:PROTOTYPE_LEVELS[6].pieces,type,input,rot});
  expect(outputs).toEqual(expected);
 }
});

test('filter colour follows the cartridge from stock through drag to the overhead view',async({page})=>{
 test.setTimeout(120000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?debug=1');
 await page.waitForFunction(()=>Boolean(window.__debug));
 await page.evaluate(()=>{
  const filters=Array.from({length:7},(_,i)=>['filter',i+1,4,0,i+1]);
  window.chromatron.loadLevels([{startMovablesInTray:true,pieces:[
   ['laser',2,7,2,7],['target',12,7,0,1],...filters]}]);
  window.__debug.freezeAnimations(true);
 });
 await page.waitForLoadState('networkidle');
 // Read the glass in each actual Blender portrait, including the secondary
 // colours. A different URL alone could still point to the same cyan artwork.
 const portraits=await page.locator('[data-optic-type="filter"] img').evaluateAll(async images=>{
  const canvas=new OffscreenCanvas(160,160);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const result=[];
  for(const img of images){
   await img.decode();
   ctx.clearRect(0,0,160,160);ctx.drawImage(img,0,0);
   const mask=Number(img.closest('[data-slot]').dataset.slot.split(':')[1]);
   const rgb=Array.from(ctx.getImageData(77,72,1,1).data).slice(0,3);
   const peak=Math.max(...rgb);
   const visible=rgb.reduce((bits,value,i)=>value>peak*.58?bits|(1<<i):bits,0);
   result.push({mask,visible});
  }
  return result;
 });
 expect(portraits).toHaveLength(7);
 for(const {mask,visible} of portraits)expect(visible).toBe(mask);

 const green=page.locator('[data-slot="filter:2"]');
 await green.scrollIntoViewIfNeeded();
 const box=await green.boundingBox();
 const dest=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await page.mouse.down();
 await page.mouse.move(dest.x,dest.y,{steps:8});
 await expect(page.locator('.carried-portrait')).toHaveAttribute('src',await green.locator('img').getAttribute('src'));
 await page.mouse.up();
 await expect.poll(()=>page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='filter'&&!p.inTray)))
  .toMatchObject({color:2,x:7,y:7});
 await page.keyboard.press('Escape');
 await page.locator('#camera-preset').click();
 await page.mouse.move(1,1);
 for(const [width,height] of [[1366,768],[1280,720],[1093,614],[390,844]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const points=await page.evaluate(()=>[[7,1.34,2],[5.5,.78,7],[8.5,.78,2]].map(([x,h,mask])=>
   ({...window.chromatron.projectCell(x,7,h),mask})));
  const scores=await colourScores(page,points);
  for(const [i,threshold] of [30,145,38].entries())
   expect.soft(scores[i],width+'px · '+['index glass','white input','green output'][i]).toBeGreaterThan(threshold);
 }
});
