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
 // An occupied cell must not steal or drop a piece from the tray.
 const occupied=await page.evaluate(()=>window.chromatron.projectCell(7,3));
 await page.mouse.click(occupied.x,occupied.y);
 expect((await page.evaluate(()=>window.chromatron.getState())).pieces.find(p=>p.type==='mirror').inTray).toBe(true);
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
 await page.locator('#graphics-quality').selectOption('balanced');
 await page.locator('#next').click();
 const point=async(x,y,height=0)=>page.evaluate(({x,y,height})=>window.chromatron.projectCell(x,y,height),{x,y,height});
 const state=()=>page.evaluate(()=>window.chromatron.getState());
 const start=(await state()).pieces.filter(p=>p.type==='mirror');
 expect(start).toHaveLength(2);
 const m1=await point(5,11),m2=await point(9,11);
 const previousRebuilds=await page.evaluate(()=>window.chromatron.getVisualStats().componentRebuilds);
 const hit1=await page.evaluate(({x,y})=>window.chromatron.inspectPointer(x,y),m1);
 expect(hit1).toMatchObject({intent:'select',hit:{pieceType:'mirror'}});
 await page.mouse.click(m1.x,m1.y);
 expect((await state()).selectedId).toBe(start[0].id);
 await page.mouse.click(m2.x,m2.y);
 expect((await state()).selectedId).toBe(start[1].id);
 // Switching between mirrors must not recreate all optical hardware.
 expect(await page.evaluate(()=>window.chromatron.getVisualStats().componentRebuilds)).toBe(previousRebuilds);
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


test('spectrum FX and mirror light-direction guides are rendered in WebGL',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 const icons=page.locator('#inventory .component-icon svg');
 await expect(icons).toHaveCount(3);
 let stats=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(stats.photonSystems).toBeGreaterThan(0);
 expect(stats.beamSegments).toBeGreaterThan(1);
 expect(stats.guideObjects).toBe(0);

 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 const at=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.mouse.click(at.x,at.y);
 stats=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(stats.selectedType).toBe('mirror');
 expect(stats.guideObjects).toBeGreaterThan(0);
 await expect(page.locator('#beam-guide-legend')).toBeVisible();
 await page.keyboard.press('q'); // a live reflection, but not yet a win
 stats=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(stats.guideObjects).toBeGreaterThan(1);
 await page.screenshot({path:'test-results/chromatron-light-guides.png'});
 expect(errors).toEqual([]);
});


test('tooltip differentiates free and occupied cells, board remains GPU-instanced',async({page})=>{
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.goto('/');
 const stats=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(stats.instancedBoardLayers).toBe(2);
 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 const free=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.mouse.move(free.x,free.y);
 await expect(page.locator('#optic-tooltip')).toBeVisible();
 await expect(page.locator('#optic-tooltip')).toContainText(/Kliknij, aby postawić|Click to place/);
 const occupied=await page.evaluate(()=>window.chromatron.projectCell(7,3));
 await page.mouse.move(occupied.x,occupied.y);
 await expect(page.locator('#optic-tooltip')).toContainText(/Pole zajęte|Occupied cell/);
 const mirror=await page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
 expect(mirror.inTray).toBe(true);
 expect(errors).toEqual([]);
});


test('real planar mirror reflections and GPU quality presets are switchable',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.locator('#graphics-quality')).toHaveValue('auto');
 const point=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 await page.mouse.click(point.x,point.y);
 await expect.poll(async()=>page.evaluate(()=>window.chromatron.getVisualStats().planarReflections)).toBe(1);
 await page.locator('#graphics-quality').selectOption('performance');
 let stats=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(stats.planarReflections).toBe(0);
 expect(stats.pixelRatio).toBeLessThanOrEqual(1);
 await page.locator('#graphics-quality').selectOption('cinematic');
 stats=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(stats.planarReflections).toBe(1);
 expect(stats.effectiveQuality).toBe('cinematic');
 expect(stats.pixelRatio).toBeGreaterThanOrEqual(1);
 await page.screenshot({path:'test-results/chromatron-true-mirror.png'});
 await page.reload();
 await expect(page.locator('#graphics-quality')).toHaveValue('cinematic');
 expect(errors).toEqual([]);
});

test('rotation eases visually without delaying the optical logic',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 const point=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 await page.mouse.click(point.x,point.y);
 await page.locator('#turn-left').click();
 const result=await page.evaluate(()=>window.chromatron.getState());
 expect(result.pieces.find(p=>p.type==='mirror').rot).toBe(7);
 await expect.poll(async()=>page.evaluate(()=>window.chromatron.getVisualStats().activeOpticTweens)).toBe(0);
 await page.locator('#turn-right').click();
 expect((await page.evaluate(()=>window.chromatron.getState())).pieces.find(p=>p.type==='mirror').rot).toBe(0);
 await expect.poll(async()=>page.evaluate(()=>window.chromatron.getVisualStats().activeOpticTweens)).toBe(0);
 expect(errors).toEqual([]);
});


test('wheel and trackpad rotate continuously without recreating mirror geometry',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 // Pin a fixed profile so automatic GPU downgrades cannot invalidate counts.
 await page.locator('#graphics-quality').selectOption('balanced');
 const point=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 await page.mouse.click(point.x,point.y);
 const state=()=>page.evaluate(()=>window.chromatron.getState());
 const stats=()=>page.evaluate(()=>window.chromatron.getVisualStats());
 const baseline=await stats();
 expect(baseline.selectionVisible).toBe(true);
 expect(baseline.selectionPieceId).toBe((await state()).selectedId);

 await page.keyboard.press('Escape');
 expect((await stats()).componentRebuilds).toBe(baseline.componentRebuilds);
 expect((await stats()).selectionVisible).toBe(false);
 await page.mouse.click(point.x,point.y);
 expect((await stats()).selectionVisible).toBe(true);
 expect((await stats()).componentRebuilds).toBe(baseline.componentRebuilds);
 await page.mouse.move(point.x,point.y);
 // One negative wheel detent, one 45-degree reverse step.
 await page.mouse.wheel(0,-100);
 await expect.poll(async()=>(await state()).pieces.find(p=>p.type==='mirror').rot).toBe(7);
 await expect(page.locator('#rotation-angle')).toHaveText('315°');
 await page.mouse.wheel(0,100);
 await expect.poll(async()=>(await state()).pieces.find(p=>p.type==='mirror').rot).toBe(0);

 // High-resolution touchpads send several small sub-detent values.
 for(let i=0;i<4;i++)await page.mouse.wheel(0,-20);
 await expect.poll(async()=>(await state()).pieces.find(p=>p.type==='mirror').rot).toBe(7);
 expect((await stats()).componentRebuilds).toBe(baseline.componentRebuilds);
 await expect.poll(async()=>(await stats()).activeOpticTweens).toBe(0);
 const final=await stats();
 const expected=-7*Math.PI/4;
 expect(Math.abs(Math.sin(final.selectedVisualAngle-expected))).toBeLessThan(.025);
 await page.screenshot({path:'test-results/chromatron-precision-selection.png'});
 expect(errors).toEqual([]);
});


test('small laptop layouts keep essential controls on screen without horizontal overflow',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const size of [
  {width:1366,height:768},
  {width:1280,height:720},
  {width:1093,height:614}, // 1366x768 with 125% Windows scaling
  {width:1024,height:640}
 ]){
  await page.setViewportSize(size);
  await page.goto('/');
  await expect(page.locator('#scene canvas')).toBeVisible();
  for(const selector of ['.header','.mission','.tool-panel','#prev','#next','#reset','#hint','#graphics-quality','#camera-preset']){
   const el=page.locator(selector);
   await expect(el).toBeVisible();
   const b=await el.boundingBox();
   expect(b,selector+' at '+JSON.stringify(size)).toBeTruthy();
   expect(b.x,selector+' left').toBeGreaterThanOrEqual(-1);
   expect(b.x+b.width,selector+' right at '+JSON.stringify(size)).toBeLessThanOrEqual(size.width+1);
   expect(b.y,selector+' top').toBeGreaterThanOrEqual(-1);
   expect(b.y+b.height,selector+' bottom at '+JSON.stringify(size)).toBeLessThanOrEqual(size.height+1);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width+1);
  const mission=page.locator('.mission'),tray=page.locator('.tool-panel');
  const panelRects=await Promise.all([mission.boundingBox(),tray.boundingBox()]);
  expect(panelRects[0].x+panelRects[0].width).toBeLessThan(panelRects[1].x);
  // The first puzzle's frequently used rotate controls are accessible after placement.
  const mirror=page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/});
  await mirror.click();
  const center=await page.evaluate(()=>window.chromatron.projectCell(7,7));
  await page.mouse.click(center.x,center.y);
  await expect(page.locator('#turn-left')).toBeVisible();
  await expect(page.locator('#turn-right')).toBeVisible();
  const footer=await page.locator('.hud-bottom').boundingBox();
  expect(footer.y+footer.height).toBeLessThanOrEqual(size.height+1);
  await page.screenshot({path:'test-results/chromatron-laptop-'+size.width+'x'+size.height+'.png'});
 }
 expect(errors).toEqual([]);
});

test('short viewport uses scrollable side panels instead of clipping interactive optics',async({page})=>{
 await page.setViewportSize({width:1093,height:550});
 await page.goto('/');
 const panel=page.locator('.tool-panel');
 const info=await panel.evaluate(el=>({
  top:el.getBoundingClientRect().top,
  bottom:el.getBoundingClientRect().bottom,
  height:el.clientHeight,
  overflowY:getComputedStyle(el).overflowY
 }));
 expect(info.top).toBeGreaterThan(0);
 expect(info.bottom).toBeLessThanOrEqual(550);
 expect(info.overflowY).toBe('auto');
 await expect(page.locator('#next')).toBeVisible();
 await page.locator('#next').click();
 await expect(page.locator('#level-index')).toHaveText('002');
 await page.screenshot({path:'test-results/chromatron-short-window.png'});
});


test('fullscreen button and F shortcut adapt the game without hiding controls',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/');
 await expect(page.locator('#fullscreen')).toBeVisible();
 await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed','false');
 await page.locator('#fullscreen').click();
 await expect.poll(async()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(true);
 await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#scene canvas')).toBeVisible();
 await expect(page.locator('#next')).toBeVisible();
 await page.keyboard.press('f');
 await expect.poll(async()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(false);
 await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed','false');
 expect(errors).toEqual([]);
});
