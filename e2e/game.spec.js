import {test,expect} from '@playwright/test';

test('3D gameplay loads, switches languages and exposes optical diagnostics',async({page})=>{
 const exceptions=[];page.on('pageerror',error=>exceptions.push(error.message));
 await page.goto('/');
 await expect(page.locator('#scene canvas')).toHaveCount(1);
 await expect(page.locator('#level-title')).not.toBeEmpty();
 await expect(page.locator('#counter')).toHaveText(/\d+\s*\/\s*\d+/);
 await expect(page.locator('#language')).toHaveText('PL');
 await page.locator('#language').click();
 await expect(page.locator('#language')).toHaveText('EN');
 await expect(page.locator('#hint')).toContainText('HINT');
 await page.locator('#analysis-toggle').click();
 await expect(page.locator('#analysis-panel')).toBeVisible();
 await expect(page.locator('#analysis-targets .analysis-target')).not.toHaveCount(0);
 await page.locator('#camera-preset').click();
 await expect(page.locator('#camera-preset')).toHaveAttribute('aria-pressed','true');
 await page.locator('#analysis-close').click();
 await expect(page.locator('#analysis-panel')).toBeHidden();
 await page.screenshot({path:'test-results/chromatron-desktop.png'});
 expect(exceptions).toEqual([]);
});

test('hints are progressive and non-destructive; narrow layout stays interactive',async({page})=>{
 const exceptions=[];page.on('pageerror',error=>exceptions.push(error.message));
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.locator('#hint').click();
 await expect(page.locator('#hint-overlay')).toBeVisible();
 await page.locator('#reveal-hint').click();
 await expect(page.locator('#hint-steps .hint-step')).toHaveCount(1);
 await expect(page.locator('#skip-level')).toBeHidden();
 await page.locator('#close-hint').click();
 await expect(page.locator('#hint-overlay')).toBeHidden();
 await page.locator('#analysis-toggle').click();
 await expect(page.locator('#analysis-panel')).toBeVisible();
 await page.locator('#analysis-close').click();
 await page.screenshot({path:'test-results/chromatron-mobile.png'});
 expect(exceptions).toEqual([]);
});


test('first puzzle teaches the three interactions and can be solved using the UI',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.locator('#coach')).toBeVisible();
 await expect(page.locator('#coach-title')).toContainText('Wybierz lustro');
 const mirror=page.locator('#inventory button').filter({hasText:'LUSTRO'});
 await expect(mirror).toHaveClass(/coach-focus/);
 await mirror.click();
 await expect(page.locator('#coach-title')).toContainText('Ustaw lustro');
 const bounds=await page.locator('#scene canvas').boundingBox();
 await page.mouse.click(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
 await expect.poll(async()=>page.evaluate(()=>window.chromatron.getState().pieces.find(x=>x.type==='mirror').inTray)).toBe(false);
 await expect(page.locator('#coach-title')).toContainText('Obróć lustro');
 await page.keyboard.press('e');
 await expect(page.locator('#counter')).toContainText('1 / 1');
 await expect(page.locator('#win')).toBeVisible();
 expect(errors).toEqual([]);
});
