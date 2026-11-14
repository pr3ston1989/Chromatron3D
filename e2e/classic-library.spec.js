import {test,expect} from '@playwright/test';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';

const files=['chromatron','chromatron2','chromatron3','chromatron4'].map(name=>resolve('original',name+'.exe'));
test('fresh local game opens the first of four retail campaigns and restores the chosen game',async({page})=>{
 test.skip(!files.every(f=>existsSync(f)),'Requires the four user-owned Windows files');
 test.setTimeout(180000);
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-graphics-quality','performance');
  Object.defineProperty(window,'devicePixelRatio',{get:()=>.5});
 });
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1093,height:614});
 await page.goto('/');
 await page.locator('#levels-button').click();
 await expect(page.locator('#level-title')).toContainText('CHROMATRON 1');
 await expect(page.locator('#level-pack-label')).toHaveText('ORYGINAŁ');
 await expect(page.locator('[data-campaign=expert]')).toHaveCount(0);
 const tab=key=>page.locator('[data-campaign="'+key+'"]');
 for(const i of [1,2,3,4]){
  await tab('classic'+i).click();
  await expect(page.locator('#level-title')).toContainText('CHROMATRON '+i);
  await expect(page.locator('#level-grid .level-atlas-card')).toHaveCount(50);
  expect(await page.evaluate(()=>window.chromatron.getPuzzleTools().verifiedSolution)).toBe(true);
 }
 await page.reload();
 await expect(page.locator('#level-title')).toContainText('CHROMATRON 4');
 await page.locator('#levels-button').click();
 await tab('demo').click();
 await expect(page.locator('#level-pack-label')).toHaveText('PROTOTYP');
 await expect(tab('classic4')).toBeVisible();
 expect(errors).toEqual([]);
});
