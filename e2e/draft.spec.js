import {test,expect} from '@playwright/test';

// These are real browser/localStorage tests; the frame buffer is smaller on
// CI because software WebGL otherwise dominates test execution time.
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('chromatron-start-campaign','demo'));
 if(process.env.CI){
  await page.addInitScript(()=>{
   Object.defineProperty(window,'devicePixelRatio',{
    configurable:true,get:()=>.7
   });
   if(!localStorage.getItem('chromatron-graphics-quality'))
    localStorage.setItem('chromatron-graphics-quality','performance');
  });
 }
});

test('partial mirror layout and inventory rotation survive reload; reset clears it',async({page})=>{
 // Three full Three.js reloads cost much more under software WebGL on CI.
 test.setTimeout(process.env.CI?150000:75000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 await page.keyboard.press('e');
 let mirror=await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
 expect(mirror.rot).toBe(1);
 expect(mirror.inTray).toBe(true);
 await expect(page.locator('#draft-status')).toContainText('ZAPISANY');
 await page.reload({waitUntil:'domcontentloaded'});
 mirror=await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
 expect(mirror.rot).toBe(1);
 expect(mirror.inTray).toBe(true);
 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 const cell=await page.evaluate(()=>window.chromatron.projectCell(6,7));
 await page.mouse.click(cell.x,cell.y);
 mirror=await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
 expect(mirror).toMatchObject({x:6,y:7,rot:1,inTray:false});
 await page.locator('#levels-button').click();
 await expect(page.locator('#level-grid [data-level-index="0"]')).toHaveAttribute('data-draft','true');
 await expect(page.locator('#level-grid [data-level-index="0"]')).toContainText('W TRAKCIE');
 await page.locator('#levels-close').click();
 await page.reload({waitUntil:'domcontentloaded'});
 mirror=await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
 expect(mirror).toMatchObject({x:6,y:7,rot:1,inTray:false});
 await expect(page.locator('#level-intro-mode')).toHaveText('WZNOWIENIE ZAGADKI');
 // A fresh page does not claim to have historical undo records.
 await expect(page.locator('#undo')).toBeDisabled();
 await page.locator('#reset').click();
 await expect(page.locator('#level-intro')).not.toHaveClass(/show/);
 await expect(page.locator('#level-arrival')).not.toHaveClass(/show/);
 mirror=await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
 expect(mirror).toMatchObject({x:7,y:9,rot:0,inTray:true});
 await expect(page.locator('#draft-status')).toBeEmpty();
 await page.reload({waitUntil:'domcontentloaded'});
 mirror=await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
 expect(mirror).toMatchObject({x:7,y:9,rot:0,inTray:true});
 expect(errors).toEqual([]);
});

test('undo removes a pending draft, redo restores it, and solving clears it',async({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 const cell=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.mouse.click(cell.x,cell.y);
 await expect(page.locator('#draft-status')).toContainText('ZAPISANY');
 await page.locator('#undo').click();
 await expect(page.locator('#draft-status')).toBeEmpty();
 await page.locator('#redo').click();
 await expect(page.locator('#draft-status')).toContainText('ZAPISANY');
 await page.keyboard.press('e');
 await expect.poll(async()=>page.evaluate(()=>window.chromatron.getState().result.won)).toBe(true);
 await expect(page.locator('#draft-status')).toBeEmpty();
 await page.locator('#win').waitFor({state:'visible'});
 await page.locator('#levels-from-win').click();
 await expect(page.locator('#level-grid [data-level-index="0"]')).toHaveAttribute('data-status','solved');
 await expect(page.locator('#level-grid [data-level-index="0"]')).not.toHaveAttribute('data-draft','true');
 await page.locator('#level-grid [data-level-index="0"]').click();
 await expect(page.locator('#level-intro-mode')).toHaveText('POWTÓRKA');
});

test('reimported private puzzle resumes only its own saved optic state',async({page})=>{
 const custom=[{
  title:{pl:'PRYWATNA PRÓBA',en:'PRIVATE TEST'},
  description:{pl:'Próba lokalna',en:'Local test'},
  pieces:[['laser',2,7,2,4],['target',7,3,0,4],['mirror',7,9,0,0]],
  startMovablesInTray:true
 }];
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(levels=>window.chromatron.loadLevels(levels),custom);
 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 const point=await page.evaluate(()=>window.chromatron.projectCell(6,7));
 await page.mouse.click(point.x,point.y);
 const selected=await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
 expect(selected).toMatchObject({x:6,y:7,inTray:false});
 await page.reload({waitUntil:'domcontentloaded'});
 // Import data itself is not persisted, so the browser starts with demos.
 await expect(page.locator('#total-levels')).toHaveText('008');
 const demo=await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
 expect(demo.inTray).toBe(true);
 await page.evaluate(levels=>window.chromatron.loadLevels(levels),custom);
 const restored=await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
 expect(restored).toMatchObject({x:6,y:7,inTray:false});
 await expect(page.locator('#level-title')).toContainText('PRYWATNA PRÓBA');
});
