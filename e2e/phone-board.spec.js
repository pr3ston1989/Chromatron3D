import {expect,test} from '@playwright/test';

test.use({hasTouch:true,isMobile:true,reducedMotion:'reduce'});

for(const [width,height] of [[320,568],[390,844]]){
 test(`phone map at ${width} × ${height}: zoom, pan, place and solve by touch`,async({page})=>{
  await page.setViewportSize({width,height});
  await page.addInitScript(()=>{
   localStorage.setItem('chromatron-start-campaign','demo');
   localStorage.setItem('chromatron-coach-dismissed','yes');
  });
  await page.goto('/?play=1');
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
  await zoom.tap();
  await expect.poll(tileWidth).toBeCloseTo(initial,0);
  await page.locator('#inventory [data-slot=mirror]').tap();
  await zoom.tap();
  await expect.poll(tileWidth).toBeGreaterThan(45);
  const destination=await project(7,7);
  await page.touchscreen.tap(destination.x,destination.y);
  await expect(page.locator('#inventory [data-slot=mirror]')).toHaveCount(0);
  await expect.poll(tileWidth).toBeGreaterThan(45);
  await page.locator('#turn-right').tap();
  await expect(page.locator('#win')).toBeVisible();
 });
}
