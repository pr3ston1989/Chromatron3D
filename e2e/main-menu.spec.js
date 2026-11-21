import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{
  if(!localStorage.getItem('chromatron-start-campaign'))localStorage.setItem('chromatron-start-campaign','demo');
  if(!localStorage.getItem('chromatron-graphics-quality'))localStorage.setItem('chromatron-graphics-quality','performance');
 });
});

test('main menu owns focus, settings apply and Continue restores a partial puzzle',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1366,height:768});
 await page.goto('/');
 const menu=page.locator('#main-menu'),play=page.locator('#menu-play');
 await expect(play).toBeEnabled();
 await expect(play).toContainText('GRAJ');
 await expect(play).toBeFocused();
 await menu.screenshot({path:'test-results/main-menu-desktop.png'});
 await expect(page.locator('#play-surface')).toHaveAttribute('inert','');
 await page.keyboard.press('Shift+Tab');
 await expect(page.locator('#menu-guide')).toBeFocused();
 await page.locator('#menu-settings').click();
 const settings=page.locator('#settings-overlay');
 await expect(settings).toBeVisible();
 await expect(menu).toHaveAttribute('inert','');
 await page.locator('#menu-language').selectOption('en');
 await page.locator('#menu-quality').selectOption('balanced');
 await page.locator('#menu-audio').click();
 await expect(page.locator('#menu-audio')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#settings-title')).toHaveText('SETTINGS');
 await page.keyboard.press('Escape');
 await expect(page.locator('#menu-settings')).toBeFocused();
 await page.locator('#menu-campaign').click();
 await expect(page.locator('#level-menu')).toBeVisible();
 await page.locator('#levels-close').click();
 await expect(page.locator('#menu-campaign')).toBeFocused();
 await page.locator('#menu-campaign').click();
 await page.locator('#level-grid [data-level-index="0"]').click();
 await expect(menu).toBeHidden();
 await expect(page.locator('#graphics-quality')).toHaveValue('balanced');
 await page.locator('#inventory button[data-optic-type="mirror"]').click();
 const tile=await page.evaluate(()=>window.chromatron.projectCell(6,8));
 await page.mouse.click(tile.x,tile.y);
 await page.locator('#levels-button').click();
 await page.locator('#level-grid [aria-current="step"]').click();
 await expect(page.locator('#undo')).toBeEnabled();
 await page.locator('#undo').click();
 expect(await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror').inTray)).toBe(true);
 await page.locator('#redo').click();
 await page.locator('#main-menu-toggle').click();
 await expect(play).toContainText('CONTINUE');
 await page.reload();
 await expect(play).toContainText('CONTINUE');
 await page.locator('#menu-settings').click();
 await expect(page.locator('#menu-audio')).toHaveAttribute('aria-pressed','true');
 await page.locator('#close-settings').click();
 await play.click();
 const mirror=await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
 expect(mirror).toMatchObject({inTray:false,x:6,y:8});
 await expect(page.locator('#play-surface')).not.toHaveAttribute('inert','');
 expect(errors).toEqual([]);
});

test('finishing the final puzzle opens the atlas and keeps the completed puzzle visible',async({page})=>{
 await page.goto('/');
 await page.locator('#menu-play').click();
 await page.evaluate(()=>window.chromatron.loadLevels([{title:'Finał',startMovablesInTray:true,pieces:[
  ['laser',1,7,2,1],['target',6,2,0,1],['mirror',6,7,1,0]
 ]}]));
 await page.locator('#inventory button[data-optic-type="mirror"]').click();
 const point=await page.evaluate(()=>window.chromatron.projectCell(6,7));
 await page.mouse.click(point.x,point.y);
 const finish=page.locator('#continue');
 await expect(finish).toHaveText('ZOBACZ KAMPANIĘ →');
 await expect(finish).toBeFocused();
 await finish.click();
 await expect(page.locator('#level-grid [data-level-index="0"]')).toHaveAttribute('data-status','solved');
 await page.locator('#levels-close').click();
 await expect(finish).toBeFocused();
 await page.locator('#menu-from-win').click();
 const play=page.locator('#menu-play');
 await expect(play).toBeFocused();
 await expect(play).toContainText('ZOBACZ KAMPANIĘ');
 await play.click();
 await expect(page.locator('#level-grid [data-level-index="0"]')).toHaveAttribute('data-status','solved');
 await page.locator('#levels-close').click();
 await expect(play).toBeFocused();
});

test('the title screen offers the next puzzle after a solve and survives a reload',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 const play=page.locator('#menu-play');
 await play.click();
 await page.locator('#camera-preset').click();
 await page.locator('#inventory button[data-optic-type="mirror"]').click();
 const cell=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.mouse.click(cell.x,cell.y);
 await page.locator('#turn-right').click();
 await page.locator('#menu-from-win').click();
 const resume=page.locator('#menu-destination');
 await expect(play).toContainText('NASTĘPNA ZAGADKA');
 await expect(resume).toHaveText('Plansza 002 · PODWÓJNY ZAKRĘT');
 await page.reload();
 await expect(resume).toHaveText('Plansza 002 · PODWÓJNY ZAKRĘT');
 await play.click();
 await expect(page.locator('#main-menu')).toBeHidden();
 await expect(page.locator('#level-index')).toHaveText('002');
});

test('keyboard navigation selects tray and board optics and places and moves them',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1093,height:614});
 await page.goto('/');
 await expect(page.locator('#menu-play')).toBeFocused();
 await page.keyboard.press('Enter');
 await page.keyboard.press('c');
 await expect(page.locator('#camera-preset')).toHaveAttribute('aria-pressed','true');
 const tray=page.locator('#inventory button[data-optic-type="mirror"]');
 for(let n=0;n<24;n++){
  await page.keyboard.press('Tab');
  if(await tray.evaluate(el=>document.activeElement===el))break;
 }
 await expect(tray).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(tray).toHaveAttribute('aria-pressed','true');
 await page.keyboard.press('g');
 const board=page.getByRole('application',{name:'Plansza optyczna'});
 const cell=page.locator('#board-cell-status');
 await expect(board).toBeFocused();
 await expect(cell).toContainText('Pole (7, 7)');
 await page.keyboard.press('ArrowDown');
 await expect(cell).toContainText('Pole (7, 8)');
 await page.keyboard.press('Enter');
 await expect(cell).toContainText('LUSTRO');
 await page.keyboard.press('e');
 await expect(page.locator('#rotation-angle')).toHaveText('045°');
 await page.keyboard.press('Space');
 await expect(page.locator('#relocate')).toHaveAttribute('aria-pressed','true');
 await page.keyboard.press('ArrowRight');
 await page.keyboard.press('Enter');
 const mirror=()=>page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
 expect(await mirror()).toMatchObject({x:8,y:8,rot:1,inTray:false});
 await page.keyboard.press('Escape');
 await page.keyboard.press('Enter');
 expect(await page.evaluate(()=>window.chromatron.getState().selectedId)).toBe((await mirror()).id);
 expect(await page.evaluate(()=>[[0,0],[14,0],[14,14],[0,14]].every(([x,y])=>{
  const point=window.chromatron.projectCell(x,y);
  return Boolean(document.elementFromPoint(point.x,point.y)?.closest('#scene'));
 }))).toBe(true);
 await page.screenshot({path:'test-results/keyboard-board.png'});
 await page.keyboard.press('Control+z');
 expect(await mirror()).toMatchObject({x:7,y:8,rot:1,inTray:false});
});

test.describe('mobile menu and movement',()=>{
 test.use({hasTouch:true,viewport:{width:390,height:844},reducedMotion:'reduce'});

 test('touch play and move use reachable controls and reject occupied cells',async({page})=>{
  await page.goto('/');
  const menu=page.locator('#main-menu');
  await expect(page.locator('#menu-guide')).toBeInViewport({ratio:1});
  await menu.screenshot({path:'test-results/main-menu-mobile.png'});
  await page.locator('#menu-play').tap();
  await page.locator('#inventory button[data-optic-type="mirror"]').tap();
  const project=(x,y)=>page.evaluate(([x,y])=>window.chromatron.projectCell(x,y),[x,y]);
  const tap=async(x,y)=>{const tile=await project(x,y);await page.touchscreen.tap(tile.x,tile.y)};
  const board=()=>page.evaluate(()=>window.chromatron.getState());
  await tap(6,8);
  await expect(page.locator('#relocate')).toBeInViewport({ratio:1});
  await page.locator('#relocate').tap();
  await expect(page.locator('#relocate')).toHaveAttribute('aria-pressed','true');
  const emitter=(await board()).pieces.find(p=>p.type==='laser');
  await tap(emitter.x,emitter.y);
  expect((await board()).pieces.find(p=>p.type==='mirror')).toMatchObject({x:6,y:8});
  await expect(page.locator('#toast')).toHaveClass(/show/);
  await expect(page.locator('#relocate')).toHaveAttribute('aria-pressed','true');
  await tap(8,8);
  expect((await board()).pieces.find(p=>p.type==='mirror')).toMatchObject({x:8,y:8});
  await expect(page.locator('#relocate')).toHaveAttribute('aria-pressed','false');
  await page.locator('#undo').tap();
  expect((await board()).pieces.find(p=>p.type==='mirror')).toMatchObject({x:6,y:8});
 });
});
