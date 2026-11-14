import {test,expect} from '@playwright/test';

test('dragging a tray mirror to the board never opens file import',async({page})=>{
 test.setTimeout(120000);
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-start-campaign','demo');
  localStorage.setItem('chromatron-graphics-quality','performance');
  Object.defineProperty(window,'devicePixelRatio',{get:()=>.65});
 });
 const dialogs=[];
 page.on('filechooser',()=>dialogs.push('filechooser'));
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/');
 const tray=page.locator('#inventory button[data-optic-type=mirror]');
 await expect(tray).toBeVisible();
 await page.evaluate(()=>{
  window.importShown=false;
  new MutationObserver(()=>{
   if(!document.getElementById('drop-zone').classList.contains('hidden'))window.importShown=true;
  }).observe(document.getElementById('drop-zone'),{attributes:true,attributeFilter:['class']});
 });
 const dest=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 const canvas=page.locator('#scene canvas');
 const rect=await canvas.boundingBox();
 await tray.dragTo(canvas,{targetPosition:{x:dest.x-rect.x,y:dest.y-rect.y}});
 await expect.poll(()=>page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror')))
  .toMatchObject({x:7,y:7,inTray:false});
 expect(await page.evaluate(()=>window.importShown)).toBe(false);
 expect(dialogs).toEqual([]);
 await page.locator('#levels-button').click();
 await expect(page.locator('[data-campaign=expert]')).toHaveCount(0);
});
