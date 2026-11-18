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
 const framed=await page.evaluate(()=>{
  const corners=[[0,0],[14,0],[14,14],[0,14]];
  return corners.every(([x,y])=>{
   const p=window.chromatron.projectCell(x,y,0);
   return p.x>8&&p.x<innerWidth-8&&document.elementFromPoint(p.x,p.y)?.closest('#scene');
  });
 });
 expect(framed).toBe(true);
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
 await expect(page.evaluate(()=>window.__debug.getLevelState().pilotStatus)).resolves.toBeNull();
 await page.evaluate(()=>window.__debug.loadLevel(8));
 await expect(page.evaluate(()=>window.__debug.getLevelState().pilotStatus)).resolves.toBe('ready');
});
