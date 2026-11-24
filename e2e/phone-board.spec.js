import {expect,test} from '@playwright/test';

test.use({hasTouch:true,isMobile:true,reducedMotion:'reduce'});

test('the Kepler phone map keeps the contextual receiver inspector reachable',async({page})=>{
 await page.setViewportSize({width:360,height:740});
 await page.goto('/?benchmark=orbital&debug=1');
 await expect(page.locator('#camera-preset')).toHaveAttribute('aria-pressed','true');
 await page.locator('#phone-magnify').tap();
 await expect(page.locator('#phone-overview')).toBeVisible();
 await page.locator('#phone-tools summary').tap();
 await page.locator('#receiver-toggle').tap();
 await expect(page.locator('#receiver-card')).toBeVisible();
 await page.locator('#receiver-close').tap();
 await page.locator('#phone-tools summary').tap();
 await expect(page.locator('#phone-tools #reset')).toBeVisible();
 await expect(page.locator('#phone-tools #spectral-toggle')).toHaveCount(0);
});

for(const [width,height] of [[320,568],[390,844]]){
 test(`phone map at ${width} × ${height}: zoom, pan, place and solve by touch`,async({page})=>{
  await page.setViewportSize({width,height});
  await page.addInitScript(()=>{
   localStorage.setItem('chromatron-start-campaign','demo');
   localStorage.setItem('chromatron-coach-dismissed','yes');
  });
  await page.goto('/?play=1');
  const brand=page.locator('#main-menu-toggle');
  await expect(brand).toBeInViewport({ratio:1});
  expect(await brand.evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThan(95);
  const camera=page.locator('#camera-preset'),zoom=page.locator('#phone-magnify');
  await expect(camera).toHaveAttribute('aria-pressed','true');
  const project=(x,y)=>page.evaluate(([x,y])=>window.chromatron.projectCell(x,y),[x,y]);
  const tileWidth=async()=>(await project(8,7)).x-(await project(7,7)).x;
  const initial=await tileWidth();
  await zoom.tap();
  await expect.poll(tileWidth).toBeGreaterThan(45);
  const before=await project(7,7);
  const touch=await page.context().newCDPSession(page);
  const send=(type,touchPoints)=>touch.send('Input.dispatchTouchEvent',{type,touchPoints});
  const empty=await project(6,6);
  await send('touchStart',[{id:1,...empty}]);
  await send('touchMove',[{id:1,x:empty.x+60,y:empty.y+42}]);
  await send('touchEnd',[]);
  const after=await project(7,7);
  expect(after.x-before.x).toBeCloseTo(60,0);
  expect(after.y-before.y).toBeCloseTo(42,0);
  const overview=page.locator('#phone-overview');
  await expect(overview).toBeVisible();
  await overview.tap({position:{x:60,y:32}});
  const far=await project(14,7);
  expect(far.x).toBeGreaterThan(0);expect(far.x).toBeLessThan(width);
  expect(await page.evaluate(()=>document.elementFromPoint(innerWidth/2,55)?.closest('#scene')===null)).toBe(true);
  await zoom.tap();
  await expect(overview).toBeHidden();
  await expect.poll(tileWidth).toBeCloseTo(initial,0);
  await page.locator('#inventory [data-slot=mirror]').tap();
  await zoom.tap();
  await expect.poll(tileWidth).toBeGreaterThan(45);
  const destination=await project(7,7);
  await page.touchscreen.tap(destination.x,destination.y);
  await expect(page.locator('#inventory [data-slot=mirror]')).toHaveCount(0);
  expect(await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror')))
   .toMatchObject({x:7,y:7,inTray:false});
  for(const id of ['turn-left','turn-right','relocate','return-tray','cancel-selection'])
   await expect(page.locator('#'+id)).toBeInViewport({ratio:1});
  const actions=await page.locator('.transform-controls button:visible').evaluateAll(buttons=>
   buttons.map(b=>{const {y,width,height}=b.getBoundingClientRect();return {y,width,height}}));
  expect(new Set(actions.map(b=>Math.round(b.y))).size).toBe(1);
  expect(actions.every(b=>b.width>=44&&b.height>=44)).toBe(true);
  const note=page.locator('#phone-optic-note');
  await expect(note).toHaveAccessibleName(/lustro/i);
  await expect(page.locator('#optic-info')).toBeHidden();
  await note.tap();
  await expect(page.locator('#optic-info')).toBeVisible();
  await expect(note).toHaveAttribute('aria-expanded','true');
  await note.tap();
  await expect(page.locator('#optic-info')).toBeHidden();
  await expect.poll(tileWidth).toBeGreaterThan(45);
  const boardHeight=()=>page.evaluate(()=>{
   const style=getComputedStyle(document.querySelector('#app'));
   return innerHeight-parseFloat(style.getPropertyValue('--phone-map-top'))-parseFloat(style.getPropertyValue('--phone-map-bottom'));
  });
  await expect.poll(boardHeight).toBeGreaterThanOrEqual(height*.42);
  await page.screenshot({path:`test-results/phone-selected-mirror-${width}x${height}.png`});
  await page.locator('#turn-right').tap();
  await expect(page.locator('#win')).toBeVisible();
 });
}
