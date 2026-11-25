import {expect,test} from '@playwright/test';
import {openTools} from './hud-tools.js';

test('the playable campaign and Kepler share their header, inventory and contextual receiver panel',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:1366,height:768});
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-start-campaign','demo');
  localStorage.setItem('chromatron-coach-dismissed','yes');
  localStorage.setItem('chromatron-reborn-spectrum','true');
 });
 await page.emulateMedia({reducedMotion:'reduce'});
 const chrome=()=>page.evaluate(()=>{
  const box=selector=>document.querySelector(selector).getBoundingClientRect();
  const header=box('.header'),dock=box('.game-dock');
  return {brand:getComputedStyle(document.querySelector('.brand'),'::after').content,
   header:[header.left,header.right,header.height],dock:[dock.left,dock.right,dock.bottom,dock.height],
   font:getComputedStyle(document.querySelector('#level-title')).fontFamily};
 });
 await page.goto('/');
 await page.locator('#menu-play').click();
 const campaign=await chrome();
 expect(campaign.header).toEqual([0,1366,52]);
 expect(campaign.dock).toEqual([0,1366,768,73]);
 expect(campaign.brand).toContain('CHROMATRON');
 await expect(page.locator('#mission-world')).toBeInViewport();
 await expect(page.locator('.header #camera-preset')).toBeVisible();
 await expect(page.locator('#receiver-card')).toBeHidden();
 await expect(page.locator('#spectral-inspector, #spectral-toggle')).toHaveCount(0);
 const target=await page.evaluate(()=>{
  const part=window.chromatron.getState().pieces.find(p=>p.type==='target');
  return window.chromatron.projectCell(part.x,part.y);
 });
 await page.mouse.click(target.x,target.y);
 await expect(page.locator('#receiver-card')).toBeVisible();
 await page.locator('#receiver-close').click();
 await openTools(page);await page.locator('#orbital-settings').click();
 await expect(page.locator('#settings-overlay')).toBeVisible();
 await page.keyboard.press('Escape');
 await page.goto('/?benchmark=orbital');
 expect(await chrome()).toEqual(campaign);
 await expect(page.locator('.header #orbital-settings')).toBeVisible();
 await expect(page.locator('#receiver-toggle')).toBeVisible();
 await expect(page.locator('#coach')).toBeHidden();
 await expect(page.locator('#spectral-inspector, #spectral-toggle')).toHaveCount(0);
 await expect(page.locator('#levels-button')).toBeHidden();
});

test('receiver details stay contextual on compact campaign layouts with an old spectrum preference',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-start-campaign','demo');
  localStorage.setItem('chromatron-reborn-solved','[0]');
  localStorage.setItem('chromatron-reborn-spectrum','true');
 });
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/?play=1');
 const card=page.locator('#receiver-card'),info=page.locator('#receiver-toggle');
 await expect(card).toBeHidden();
 await expect(page.locator('#spectral-inspector, #spectral-toggle')).toHaveCount(0);
 await info.click();
 await expect(info).toHaveAttribute('aria-expanded','true');
 await expect(card).toBeVisible();
 await expect(page.locator('#receiver-required')).not.toBeEmpty();
 await expect(page.locator('#receiver-actual')).not.toBeEmpty();

 await page.setViewportSize({width:1093,height:614});
 await expect(card).toBeInViewport({ratio:1});
 await page.locator('#next').click();
 await expect(page.locator('#level-index')).toHaveText('002');
 await expect(card).toBeHidden();
 await expect(info).toHaveAttribute('aria-expanded','false');
 await info.click();
 await expect(card).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(card).toBeHidden();
 await expect(info).toBeFocused();
});
