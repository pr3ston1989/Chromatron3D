import {test,expect} from '@playwright/test';

test('expert campaign is selectable, persists and stays separate from the prototype',async({page})=>{
 const exceptions=[];
 page.on('pageerror',error=>exceptions.push(error.message));
 await page.goto('/');
 await expect(page.locator('#total-levels')).toHaveText('008');
 await page.locator('#levels-button').click();
 await expect(page.locator('.campaign-tab[data-campaign="demo"]')).toHaveAttribute('aria-selected','true');
 await expect(page.locator('.campaign-tab[data-campaign="expert"]')).toHaveAttribute('aria-selected','false');

 await page.locator('.campaign-tab[data-campaign="expert"]').click();
 await expect(page.locator('#total-levels')).toHaveText('050');
 await expect(page.locator('#chapter')).toContainText('ROZDZIAŁ 01 // REFLEKSY');
 await expect(page.locator('#level-grid .level-atlas-card')).toHaveCount(50);
 await expect(page.locator('#level-grid [data-level-index="0"]')).toBeEnabled();
 await expect(page.locator('#level-grid [data-level-index="1"]')).toBeDisabled();

 await page.locator('#level-grid [data-level-index="0"]').click();
 await expect(page.locator('#level-title')).toHaveText('PIERWSZY ODDECH');
 await expect(page.locator('#level-pack-label')).toHaveText('EKSPERT');
 await expect(page.locator('#level-menu')).toBeHidden();

 // The chosen campaign is remembered across reloads, but its saved progress
 // lives under a different pack fingerprint than the eight demonstrations.
 await page.reload();
 await expect(page.locator('#total-levels')).toHaveText('050');
 await expect(page.locator('#level-title')).toHaveText('PIERWSZY ODDECH');

 await page.locator('#levels-button').click();
 await page.locator('.campaign-tab[data-campaign="demo"]').click();
 await expect(page.locator('#total-levels')).toHaveText('008');
 await expect(page.locator('#level-pack-label')).toHaveText('PROTOTYP');
 await expect(page.locator('#chapter')).toContainText('ROZDZIAŁ 01 // PODSTAWY');
 expect(exceptions).toEqual([]);
});
