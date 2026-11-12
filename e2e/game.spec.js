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
 const center=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 const intent=await page.evaluate(({x,y})=>window.chromatron.inspectPointer(x,y),center);
 expect(intent).toMatchObject({intent:'place',placementMode:true});
 await page.mouse.click(center.x,center.y);
 await expect.poll(async()=>page.evaluate(()=>window.chromatron.getState().pieces.find(x=>x.type==='mirror').inTray)).toBe(false);
 await expect(page.locator('#coach-title')).toContainText('Obróć lustro');
 await page.keyboard.press('e');
 await expect(page.locator('#counter')).toContainText('1 / 1');
 await expect(page.locator('#win')).toBeVisible();
 expect(errors).toEqual([]);
});


test('select, place, rotate both ways and never teleport a placed mirror',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 const point=async(x,y,height=0)=>page.evaluate(({x,y,height})=>window.chromatron.projectCell(x,y,height),{x,y,height});
 const state=()=>page.evaluate(()=>window.chromatron.getState());
 const mirror=page.locator('#inventory button').filter({hasText:'LUSTRO'});
 await mirror.click();
 expect((await state()).placementMode).toBe(true);
 const dest=await point(7,7);
 await page.mouse.click(dest.x,dest.y);
 const placed=(await state()).pieces.find(p=>p.type==='mirror');
 expect([placed.x,placed.y,placed.inTray]).toEqual([7,7,false]);
 expect((await state()).placementMode).toBe(false);
 await expect(page.locator('#transform-tools')).toBeVisible();

 // Empty clicks only deselect; they never relocate an already placed mirror.
 const other=await point(6,6);
 await page.mouse.click(other.x,other.y);
 expect((await state()).pieces.find(p=>p.type==='mirror')).toMatchObject({x:7,y:7});
 expect((await state()).selectedId).toBe(null);

 const onMirror=await point(7,7);
 await page.mouse.click(onMirror.x,onMirror.y);
 const before=(await state()).pieces.find(p=>p.type==='mirror').rot;
 await page.mouse.click(onMirror.x,onMirror.y);
 expect((await state()).pieces.find(p=>p.type==='mirror').rot).toBe(before);
 // Rotate away from the winning angle before rotating back:
 // the success dialog must not interfere with this interaction regression.
 await page.locator('#turn-left').click();
 expect((await state()).pieces.find(p=>p.type==='mirror').rot).toBe((before+7)%8);
 await page.locator('#turn-right').click();
 expect((await state()).pieces.find(p=>p.type==='mirror').rot).toBe(before);
 await page.screenshot({path:'test-results/chromatron-controls.png'});
 expect(errors).toEqual([]);
});

test('different board mirrors remain distinct; dragging one does not move the other',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.locator('#next').click();
 const point=async(x,y,height=0)=>page.evaluate(({x,y,height})=>window.chromatron.projectCell(x,y,height),{x,y,height});
 const state=()=>page.evaluate(()=>window.chromatron.getState());
 const start=(await state()).pieces.filter(p=>p.type==='mirror');
 expect(start).toHaveLength(2);
 const m1=await point(5,11),m2=await point(9,11);
 const hit1=await page.evaluate(({x,y})=>window.chromatron.inspectPointer(x,y),m1);
 expect(hit1).toMatchObject({intent:'select',hit:{pieceType:'mirror'}});
 await page.mouse.click(m1.x,m1.y);
 expect((await state()).selectedId).toBe(start[0].id);
 await page.mouse.click(m2.x,m2.y);
 expect((await state()).selectedId).toBe(start[1].id);
 expect((await state()).pieces.find(p=>p.id===start[0].id)).toMatchObject({x:5,y:11});
 const dest=await point(8,11);
 await page.mouse.move(m2.x,m2.y);
 await page.mouse.down();
 await page.mouse.move(dest.x,dest.y,{steps:8});
 await page.mouse.up();
 const moved=(await state()).pieces;
 expect(moved.find(p=>p.id===start[0].id)).toMatchObject({x:5,y:11});
 expect(moved.find(p=>p.id===start[1].id)).toMatchObject({x:8,y:11});
 expect(errors).toEqual([]);
});
