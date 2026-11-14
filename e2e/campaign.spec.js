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
  window.importShown=false;window.nativeDrags=0;
  document.addEventListener('dragstart',()=>window.nativeDrags++);
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
 expect(await page.evaluate(()=>window.nativeDrags)).toBe(0);
 await page.locator('#levels-button').click();
 await expect(page.locator('[data-campaign=expert]')).toHaveCount(0);
});

test('the workshop shows Blender portraits and cancels a carried optic released on the tray',async({page})=>{
 test.setTimeout(120000);
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-start-campaign','demo');
  localStorage.setItem('chromatron-graphics-quality','performance');
  localStorage.setItem('chromatron-coach-dismissed','yes');
 });
 await page.setViewportSize({width:1366,height:768});
 await page.goto('/');
 await page.evaluate(()=>window.chromatron.loadLevels(JSON.stringify([{title:'Pracownia optyczna',
  startMovablesInTray:true,pieces:[['laser',1,8,2,1],['target',12,4,0,1],['mirror',6,8,1,0],['splitter',9,8,3,0]]}])));
 const tray=page.locator('#inventory');
 const mirror=tray.locator('button[data-optic-type=mirror]');
 const splitter=tray.locator('button[data-optic-type=splitter]');
 await expect(splitter.locator('img')).toHaveAttribute('src',/portraits\/splitter\.png$/);
 await expect.poll(()=>mirror.locator('img').evaluate(img=>img.naturalWidth)).toBe(128);
 await expect(tray.locator('details')).not.toHaveAttribute('open','');
 const textHeight=await splitter.locator('span').nth(1).evaluate(el=>({
  height:el.getBoundingClientRect().height,line:parseFloat(getComputedStyle(el).lineHeight)
 }));
 expect(textHeight.height).toBeLessThanOrEqual(textHeight.line+1);
 const start=await mirror.boundingBox(),other=await splitter.boundingBox();
 await page.mouse.move(start.x+20,start.y+15);await page.mouse.down();
 await page.mouse.move(other.x+20,other.y+15,{steps:5});
 await expect(page.locator('body')).toHaveClass(/carrying-optic/);
 await page.mouse.up();
 await expect(page.locator('body')).not.toHaveClass(/carrying-optic/);
 expect(await page.evaluate(()=>window.chromatron.getState().pieces.filter(p=>p.inTray).length)).toBe(2);
 await mirror.click();
 const a=await page.evaluate(()=>window.chromatron.projectCell(5,8));
 await page.mouse.click(a.x,a.y);
 await splitter.click();
 const b=await page.evaluate(()=>window.chromatron.projectCell(8,8));
 await page.mouse.click(b.x,b.y);
 await page.keyboard.press('Escape');
 await page.mouse.move(1,1);
 await expect.poll(()=>page.evaluate(()=>window.chromatron.getVisualStats().activeOpticTweens)).toBe(0);
 await page.screenshot({path:'test-results/chromatron-workshop.png'});
});
