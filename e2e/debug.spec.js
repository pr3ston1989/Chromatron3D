import {test,expect} from '@playwright/test';

test('debug can inspect locked levels and exercise moves without changing player storage',async({page})=>{
 test.setTimeout(150000);
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-start-campaign','demo');
  localStorage.setItem('chromatron-reborn-credit-wallet','keep-player-data');
  Object.defineProperty(window,'devicePixelRatio',{get:()=>.65});
 });
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/?debug=1');
 await expect.poll(()=>page.evaluate(()=>window.__debug?.getStats().frames||0)).toBeGreaterThan(0);
 const result=await page.evaluate(()=>{
  const debug=window.__debug;
  debug.switchCampaign('demo');
  document.querySelector('#graphics-quality').value='performance';
  document.querySelector('#graphics-quality').dispatchEvent(new Event('change'));
  debug.freezeAnimations(true);
  const count=debug.getLevelCount();
  const locked=debug.loadLevel(count);
  const changed=debug.setTheme('polar');
  const rejectedTheme=debug.setTheme('invalid');
  debug.loadLevel(1);
  const state=debug.getLevelState();
  const index=state.pieces.findIndex(p=>p.type==='mirror');
  const rejectedMove=debug.applyMove({index,x:7,y:3,rot:1});
  const placed=debug.applyMove({index,x:7,y:7,rot:1});
  const solved=debug.isSolved();
  const completed=debug.getLevelState().completed;
  debug.undo();
  const undone=debug.getLevelState().pieces[index].inTray;
  debug.redo();
  const redone=debug.isSolved();
  debug.resetLevel();
  return {count,locked,changed,rejectedTheme,theme:state.theme,rejectedMove,placed,solved,completed,
   undone,redone,reset:debug.getLevelState().pieces[index].inTray,
   save:localStorage.getItem('chromatron-reborn-credit-wallet'),quality:debug.getStats().quality};
 });
 expect(result).toEqual({count:8,locked:true,changed:true,rejectedTheme:false,theme:'polar',
  rejectedMove:false,placed:true,solved:true,completed:true,undone:true,redone:true,reset:true,
  save:'keep-player-data',quality:'performance'});
 await page.goto('/?debug=0');
 await page.waitForFunction(()=>Boolean(window.chromatron));
 expect(await page.evaluate(()=>Object.hasOwn(window,'__debug'))).toBe(false);
});
