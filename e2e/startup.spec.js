import {expect,test} from '@playwright/test';

const mainModule=url=>url.pathname.endsWith('/src/main.js');

test('a slow bundle keeps the styled startup screen over the untouched game',async({page},testInfo)=>{
 await page.setViewportSize({width:1093,height:614});
 await page.emulateMedia({reducedMotion:'reduce'});
 let bundle;
 await page.route(mainModule,route=>{bundle=route});
 await page.goto('/?play=1',{waitUntil:'commit'});
 const startup=page.locator('#startup-screen'),app=page.locator('#app');
 await expect.poll(()=>Boolean(bundle)).toBe(true);
 await expect(startup).toBeVisible();
 await expect(startup.getByRole('status')).toHaveText('Ładowanie gry…');
 await expect(app).toHaveCSS('opacity','0');
 await expect(app).toHaveAttribute('inert','');
 await expect(startup.locator('.startup-track')).toHaveCSS('height','2px');
 await expect.poll(()=>startup.locator('.startup-track').evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('none');
 await page.screenshot({path:testInfo.outputPath('loading.png')});
 await bundle.continue();
 await expect(startup).toBeHidden();
 await expect(app).not.toHaveAttribute('data-booting');
 await expect(page.locator('#scene canvas')).toBeVisible();
});

test('startup errors keep the raw HUD covered and offer a working retry',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>localStorage.setItem('chromatron-reborn-language','en'));
 await page.route(mainModule,route=>route.abort('failed'),{times:1});
 await page.goto('/');
 const startup=page.locator('#startup-screen');
 await expect(startup.getByRole('status')).toHaveText('The game could not start.');
 await expect(page.locator('#app')).toHaveCSS('opacity','0');
 const retry=startup.getByRole('button',{name:'Retry'});
 await expect(retry).toBeFocused();
 await retry.click();
 await expect(startup).toBeHidden();
 await expect(page.locator('#menu-play')).toBeEnabled();
 await expect(page.locator('#menu-play')).toBeFocused();
});
