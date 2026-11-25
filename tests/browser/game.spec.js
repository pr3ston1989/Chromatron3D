import {test,expect} from '@playwright/test';

test('3D board, bilingual UI, progressive hints, skip and contextual receiver details',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-start-campaign','demo');
  localStorage.setItem('chromatron-reborn-credit-wallet',JSON.stringify({balance:5}));
 });
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?play=1');
 await page.waitForFunction(()=>window.chromatron?.getState?.()?.pieces?.length>0);
 await expect(page.locator('#scene canvas')).toBeVisible();
 await expect(page.locator('#level-index')).toHaveText('001');
 await expect(page.locator('html')).toHaveAttribute('lang','pl');
 await expect(page.locator('#level-title')).toHaveText('PIERWSZE ŚWIATŁO');

 await page.locator('#hint').click();
 await expect(page.locator('#hint-overlay')).toBeVisible();
 await expect(page.locator('#skip-level')).toBeHidden();
 for(let i=1;i<=3;i++){
  await page.locator('#reveal-hint').click();
  await expect(page.locator('.hint-step')).toHaveCount(i);
 }
 await expect(page.locator('#skip-level')).toBeVisible();
 await page.locator('#skip-level').click();
 await expect(page.locator('#level-index')).toHaveText('002');
 await expect(page.locator('#level-status')).toBeEmpty();

 await page.keyboard.press('l');
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.locator('#level-title')).toHaveText('THE DOUBLE TURN');
 await page.locator('#receiver-toggle').click();
 await expect(page.locator('#receiver-card')).toBeVisible();
 await expect(page.locator('#receiver-required')).not.toBeEmpty();
 await expect(page.locator('#receiver-actual')).not.toBeEmpty();
 await page.screenshot({path:'test-results/chromatron-desktop.png',fullPage:true});
 expect(errors).toEqual([]);
});

test('classic toolbox: tray pieces selectable without starting on board',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('/');
 await page.waitForFunction(()=>window.chromatron?.getState?.()?.pieces?.length>0);
 await page.evaluate(()=>window.chromatron.loadLevels([{
  title:{pl:'Próba',en:'Trial'},
  startMovablesInTray:true,
  pieces:[['laser',2,7,2,4],['mirror',7,7,1,0],['target',7,3,0,4]]
 }]));
 const state=await page.evaluate(()=>window.chromatron.getState());
 expect(state.pieces.find(p=>p.type==='mirror').inTray).toBe(true);
 expect(state.result.won).toBe(false);
 await page.locator('button.inventory-item').click();
 await expect(page.locator('button.inventory-item.selected')).toHaveCount(1);
 expect(errors).toEqual([]);
});
