import {test,expect} from '@playwright/test';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';

const files=['chromatron','chromatron2','chromatron3','chromatron4'].map(name=>resolve('original',name+'.exe'));
test('fresh local game opens the first of four retail campaigns and restores the chosen game',async({page})=>{
 test.skip(!files.every(f=>existsSync(f)),'Requires the four user-owned Windows files');
 test.setTimeout(180000);
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-graphics-quality','performance');
  if(!localStorage.getItem('chromatron-reborn-credit-wallet'))
   localStorage.setItem('chromatron-reborn-credit-wallet',JSON.stringify({balance:8}));
  Object.defineProperty(window,'devicePixelRatio',{get:()=>.5});
 });
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1093,height:614});
 await page.goto('/?play=1');
 await page.locator('#hint').click();
 await page.locator('#reveal-hint').click();
 await expect(page.locator('#hint-steps .hint-step p')).toContainText('Jedno lustro na przecięciu wystarczy.');
 await page.locator('#reveal-hint').click();
 const clue=page.locator('#hint-steps .hint-step p').last();
 await expect(clue).toContainText('Przedłuż w myślach kolumnę rezonatora');
 await expect(clue).not.toContainText(/\(\d+, \d+\)|\d+°/);
 await page.locator('#reveal-hint').click();
 await expect(clue).toContainText(/\(\d+, \d+\).*\d+°/);
 await expect(clue).toContainText('Czerwień ma wyjść z lustra');
 await page.locator('#close-hint').click();
 await page.locator('#levels-button').click();
 await expect(page.locator('#level-title')).toContainText('CHROMATRON 1');
 await expect(page.locator('#level-pack-label')).toHaveText('ORYGINAŁ');
 await expect(page.locator('[data-campaign=expert]')).toHaveCount(0);
 const tab=key=>page.locator('[data-campaign="'+key+'"]');
 for(const i of [1,2,3,4]){
  await tab('classic'+i).click();
  await expect(page.locator('#level-title')).toContainText('CHROMATRON '+i);
  await expect(page.locator('#level-grid .level-atlas-card')).toHaveCount(50);
  await expect(page.locator('.atlas-sector')).toHaveCount(2);
  await expect(page.locator('.atlas-sector').first().locator('.level-atlas-card')).toHaveCount(25);
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
