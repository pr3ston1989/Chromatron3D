import {expect,test} from '@playwright/test';

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
  const png=await page.screenshot();
  const scores=await page.evaluate(async({png,points})=>{
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
  for(const [index,{kind,mask}] of points.entries()){
   const threshold=mask===7?145:kind==='active lens'?27:38;
   expect(scores[index],`${width} × ${height} · ${kind} · RGB mask ${mask}`).toBeGreaterThan(threshold);
  }
 }
});
