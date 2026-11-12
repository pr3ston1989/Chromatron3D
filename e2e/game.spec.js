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
