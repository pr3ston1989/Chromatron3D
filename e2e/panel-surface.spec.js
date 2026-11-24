import {expect,test} from '@playwright/test';
import {captureFrame,luminance,projectCells} from './frame.js';

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
  window.__debug.freezeAnimations(true,{onDemand:true});
 });
 await expect.poll(()=>page.evaluate(()=>window.__debug.getLevelState().pilotStatus)).toBe('ready');
 await page.waitForLoadState('networkidle');
 for(const [width,height,overhead] of [[1366,768],[1280,720],[1093,614],[390,844],[390,844,true]]){
  await page.setViewportSize({width,height});
  if(overhead)await page.locator('#camera-preset').click();
  const frame=await captureFrame(page);
  const cells=[];
  for(const x of [5,6,7,8,9])for(const y of [5,9,10]){
   for(const u of [-.27,-.09,.09,.27])for(const v of [-.27,-.09,.09,.27])cells.push([x+u,y+v]);
   cells.push([x+.5,y]);
  }
  const points=await projectCells(page,cells);
  const grain=[],edges=[];
  for(let i=0;i<points.length;i+=17){
   const body=points.slice(i,i+16).map(p=>luminance(frame,p.x,p.y)).sort((a,b)=>a-b);
   const edge=points[i+16];
   grain.push(body[13]-body[2]);
   edges.push(body[8]-Math.min(...[-1,0,1].map(dx=>luminance(frame,edge.x+dx,edge.y))));
  }
  const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
  const texture=median(grain),joint=median(edges);
  expect(texture,`slate detail at ${width}px`).toBeGreaterThan(1.3);
  expect(joint,`joint at ${width}px, interior contrast ${texture}`).toBeGreaterThan(texture);
 }
 expect(errors).toEqual([]);
});
