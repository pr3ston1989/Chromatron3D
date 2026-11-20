import {expect,test} from '@playwright/test';

test('shipyard pilot frames the mobile grid and keeps the same playable splitter puzzle',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/?debug=1');
 await page.waitForFunction(()=>Boolean(window.__debug));
 await page.evaluate(()=>{
  const control=document.querySelector('#graphics-quality');
  control.value='performance';control.dispatchEvent(new Event('change'));
  window.__debug.switchCampaign('demo');
  window.__debug.loadLevel(8);
  window.__debug.freezeAnimations(true);
 });
 await expect.poll(()=>page.evaluate(()=>window.__debug.getLevelState().pilotStatus)).toBe('ready');
 await expect(page.evaluate(()=>window.__debug.getLevelState().theme)).resolves.toBe('shipyard');
 const framed=()=>page.evaluate(()=>{
  const corners=[[0,0],[14,0],[14,14],[0,14]];
  return corners.every(([x,y])=>{
   const p=window.chromatron.projectCell(x,y,0);
   return p.x>8&&p.x<innerWidth-8&&document.elementFromPoint(p.x,p.y)?.closest('#scene');
  });
 });
 for(const [width,height] of [[390,844],[768,1024],[844,390],[390,844]]){
  await page.setViewportSize({width,height});
  await expect.poll(framed).toBe(true);
 }
 const clicked=await page.evaluate(()=>{
  const splitter=window.__debug.getLevelState().pieces.find(piece=>piece.type==='splitter');
  return {...window.chromatron.projectCell(splitter.x,splitter.y,.57),id:splitter.id};
 });
 await page.mouse.click(clicked.x,clicked.y);
 await expect.poll(()=>page.evaluate(()=>window.__debug.getLevelState().selectedId)).toBe(clicked.id);
 await expect(page.evaluate(()=>window.__debug.applyMove({index:3,x:7,y:8,rot:1}))).resolves.toBe(true);
 await expect(page.evaluate(()=>window.__debug.isSolved())).resolves.toBe(true);
 await page.evaluate(()=>window.__debug.undo());
 await expect(page.evaluate(()=>window.__debug.isSolved())).resolves.toBe(false);
 await page.evaluate(()=>window.__debug.loadLevel(7));
 await expect(page.evaluate(()=>window.__debug.getLevelState().theme)).resolves.toBe('sanctuary');
 await page.evaluate(()=>window.__debug.loadLevel(8));
 await expect(page.evaluate(()=>window.__debug.getLevelState().pilotStatus)).resolves.toBe('ready');
});

test('overhead precision fits all tiles with selected equipment and restores the orbit view',async({page})=>{
 test.setTimeout(120000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1366,height:768});
 await page.goto('/?debug=1');
 await page.waitForFunction(()=>Boolean(window.__debug));
 await page.evaluate(()=>{
  const quality=document.querySelector('#graphics-quality');
  quality.value='performance';quality.dispatchEvent(new Event('change'));
  window.__debug.switchCampaign('demo');window.__debug.loadLevel(8);
 });
 await expect.poll(()=>page.evaluate(()=>window.__debug.getLevelState().pilotStatus)).toBe('ready');
 const project=(x,y)=>page.evaluate(([x,y])=>window.chromatron.projectCell(x,y),[x,y]);
 const blank=await project(6,11);
 await page.mouse.move(blank.x,blank.y);
 await page.mouse.down();
 await page.mouse.move(blank.x+32,blank.y-9,{steps:3});
 await page.mouse.up();
 await page.mouse.wheel(0,-150);
 const orbit=await project(0,0);
 const camera=page.locator('#camera-preset');
 await camera.click();
 const splitter=await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='splitter'));
 const at=await project(splitter.x,splitter.y);
 await page.mouse.click(at.x,at.y);
 await expect.poll(()=>page.evaluate(()=>window.chromatron.getState().selectedId)).toBe(splitter.id);
 for(const [width,height] of [[1366,768],[1280,720],[1093,614],[1024,640],[390,844],[768,1024],[844,390],[640,360],[320,568]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>new Promise(requestAnimationFrame));
  await expect.poll(()=>page.evaluate(()=>{
   let blocked=0;
   for(let x=0;x<15;x++)for(let y=0;y<15;y++){
    const point=window.chromatron.projectCell(x,y);
    if(!document.elementFromPoint(point.x,point.y)?.closest('#scene'))blocked++;
   }
   return blocked;
  }),`${width} × ${height} visible tile centers`).toBe(0);
  expect(await page.evaluate(()=>[...document.querySelectorAll('#transform-tools button,#prev,#next')]
   .filter(button=>button.getClientRects().length).filter(button=>{
    const rect=button.getBoundingClientRect();
    const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
    return hit?.closest('button')!==button||button.scrollWidth>button.clientWidth+1;
   }).map(button=>button.id)),`${width} × ${height} usable optic controls`).toEqual([]);
  if(width===640||width===390)await page.screenshot({path:`test-results/precision-${width}x${height}.png`});
 }
 await page.setViewportSize({width:1366,height:768});
 const {x,y}=await project(7,7);
 const right=await project(8,7),below=await project(7,8);
 expect(right.y).toBeCloseTo(y,3);
 expect(below.x).toBeCloseTo(x,3);
 await page.mouse.move(x,y);
 await page.keyboard.down('Shift');
 await page.mouse.wheel(0,-180);
 await page.keyboard.up('Shift');
 await expect.poll(async()=>(await project(8,7)).x-x).toBeGreaterThan(right.x-x);
 await camera.click();
 const returned=await project(0,0);
 expect(returned.x).toBeCloseTo(orbit.x,3);
 expect(returned.y).toBeCloseTo(orbit.y,3);
 await camera.click();
 await page.evaluate(()=>window.chromatron.loadLevels([{title:'Sąsiednie przyrządy',pieces:[
  ['laser',1,6,2,1],['target',11,4,0,1],['mirror',7,8,0,0],['mirror',8,8,1,0]
 ]}]));
 const mirrors=await page.evaluate(()=>window.chromatron.getState().pieces.filter(p=>p.type==='mirror'));
 for(const piece of mirrors){
  const position=await project(piece.x,piece.y);
  await page.mouse.click(position.x,position.y);
  await expect.poll(()=>page.evaluate(()=>window.chromatron.getState().selectedId)).toBe(piece.id);
 }
 await page.setViewportSize({width:390,height:844});
 await page.keyboard.press('Escape');
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 const originalCorner=await project(0,0);
 const adjacent=await project(mirrors[0].x,mirrors[0].y);
 await page.mouse.move(adjacent.x,adjacent.y);
 await page.mouse.down();
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 await expect(page.locator('#transform-tools')).toBeVisible();
 expect(await project(0,0)).toEqual(originalCorner);
 await page.mouse.up();
});
