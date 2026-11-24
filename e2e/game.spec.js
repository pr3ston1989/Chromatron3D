import {openTools,selectQuality,useTool} from './hud-tools.js';
import {test,expect} from '@playwright/test';

// SwiftShader in CI renders real Three.js postprocessing on the CPU. Reserve
// expensive live reflections and SMAA for the dedicated graphics-quality test.
// Other interaction tests use the same gameplay, but laptop-friendly settings.
test.beforeEach(async({page},testInfo)=>{
 await page.addInitScript(()=>localStorage.setItem('chromatron-start-campaign','demo'));
 if(process.env.CI&&!testInfo.title.includes('real planar mirror reflections')){
  await page.addInitScript(()=>{
   // Functional checks run real WebGL, but SwiftShader renders entirely on
   // the CI CPU. Lower the framebuffer resolution without changing CSS
   // viewport sizes, hit testing, layouts or underlying game logic.
   // The dedicated reflection/graphics-quality test keeps native DPR.
   Object.defineProperty(window,'devicePixelRatio',{
    configurable:true,get:()=>.7
   });
   if(!localStorage.getItem('chromatron-graphics-quality'))
    localStorage.setItem('chromatron-graphics-quality','performance');
  });
 }
});

test('3D gameplay loads, switches languages and exposes optical diagnostics',async({page})=>{
 const exceptions=[];page.on('pageerror',error=>exceptions.push(error.message));
 await page.goto('/?play=1');
 await expect(page.locator('#scene canvas')).toHaveCount(1);
 await expect(page.locator('#level-title')).not.toBeEmpty();
 await expect(page.locator('#total-levels')).toHaveText('008');
 await expect(page.locator('#counter')).toHaveText(/\d+\s*\/\s*\d+/);
 await expect(page.locator('#language')).toHaveText('PL');
 await useTool(page,'language');
 await expect(page.locator('#language')).toHaveText('EN');
 await expect(page.locator('#hint')).toContainText('HINT');
 await useTool(page,'analysis-toggle');
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
 await page.goto('/?play=1');
 await page.locator('#hint').click();
 await expect(page.locator('#hint-overlay')).toBeVisible();
 await page.locator('#reveal-hint').click();
 await expect(page.locator('#hint-steps .hint-step')).toHaveCount(1);
 await expect(page.locator('#skip-level')).toBeHidden();
 await page.locator('#close-hint').click();
 await expect(page.locator('#hint-overlay')).toBeHidden();
 await useTool(page,'analysis-toggle');
 await expect(page.locator('#analysis-panel')).toBeVisible();
 await page.locator('#analysis-close').click();
 await page.screenshot({path:'test-results/chromatron-mobile.png'});
 expect(exceptions).toEqual([]);
});

test('an unlocked verified guide follows the next unfinished move without charging again',async({page},testInfo)=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-reborn-level','1');
  localStorage.setItem('chromatron-reborn-credit-wallet',JSON.stringify({balance:5}));
 });
 await page.goto('/?play=1');
 await expect(page.locator('#level-index')).toHaveText('002');
 await page.locator('#camera-preset').click();
 const wallet=()=>page.evaluate(()=>window.chromatron.getPuzzleTools());
 const project=(x,y)=>page.evaluate(([x,y])=>window.chromatron.projectCell(x,y),[x,y]);
 const clickCell=async(x,y)=>{
  const point=await project(x,y);
  await page.mouse.click(point.x,point.y);
 };
 const show=page.locator('#hint-show-move'),guide=page.locator('#hint-guide');
 const copy=page.locator('#hint-guide-copy');
 await page.locator('#hint').click();
 await page.locator('#reveal-hint').click();
 await page.locator('#reveal-hint').click();
 await expect(show).toBeHidden();
 await page.locator('#reveal-hint').click();
 await expect(show).toBeEnabled();
 await show.click();
 await expect(page.locator('#hint-overlay')).toBeHidden();
 await expect(guide).toBeVisible();
 await expect(copy).toContainText(/Przenieś.*\(5, 9\).*45°/);
 await clickCell(5,11);
 await page.locator('#relocate').click();
 await clickCell(5,9);
 await expect(copy).toContainText(/Obróć.*\(5, 9\).*45° \(1 × w prawo\)/);
 await page.locator('#turn-right').click();
 await expect(copy).toContainText(/Przenieś.*\(5, 4\).*225°/);

 for(const [width,height] of [[640,360],[1093,614],[1280,720],[1366,768],[390,844]]){
  await page.setViewportSize({width,height});
  await expect.poll(()=>page.evaluate(()=>{
   for(let x=0;x<15;x++)for(let y=0;y<15;y++){
    const point=window.chromatron.projectCell(x,y);
    if(!document.elementFromPoint(point.x,point.y)?.closest('#scene'))return false;
   }
   return true;
  }),`${width} × ${height} guided board`).toBe(true);
 }
 await page.screenshot({path:testInfo.outputPath('guide-390x844.png')});
 await useTool(page,'language');
 await expect(copy).toContainText(/Move.*\(5, 4\).*225°/);
 await useTool(page,'language');
 await page.locator('#undo').click();
 await expect(copy).toContainText(/Obróć.*\(5, 9\).*45°/);
 await page.locator('#hint-dismiss-guide').click();
 await expect(guide).toBeHidden();
 expect(await wallet()).toMatchObject({credits:0,unlocked:3});
 await page.locator('#hint').click();
 await show.click();
 await page.locator('#turn-right').click();
 await clickCell(9,11);
 await page.locator('#relocate').click();
 await clickCell(5,4);
 await page.keyboard.press('q');
 await page.keyboard.press('q');
 await page.keyboard.press('q');
 await expect(page.locator('#win')).toBeVisible();
 await expect(guide).toBeHidden();
 expect(await wallet()).toMatchObject({credits:5,unlocked:3});
});


test('first puzzle teaches the three interactions and can be solved using the UI',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?play=1');
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
 await expect(page.locator('#next')).toBeEnabled();
 await page.locator('#levels-from-win').click();
 await expect(page.locator('#level-menu')).toBeVisible();
 await expect(page.locator('#level-grid [data-level-index="0"]')).toHaveAttribute('data-status','solved');
 await expect(page.locator('#level-grid [data-level-index="1"]')).toHaveAttribute('data-status','available');
 await expect(page.locator('#level-grid [data-level-index="2"]')).toBeDisabled();
 const nextBiome=await page.locator('#level-grid [data-level-index="1"]').getAttribute('data-biome');
 const nextBiomeLabel=await page.locator('#level-grid [data-level-index="1"] .level-atlas-card-biome').textContent();
 await page.locator('#level-grid [data-level-index="1"]').click();
 await expect(page.locator('#level-intro-mode')).toHaveText('NOWY POZIOM');
 await expect(page.locator('#level-intro')).toHaveAttribute('data-biome',nextBiome);
 await expect(page.locator('#level-intro-biome')).toHaveText(nextBiomeLabel);
 await expect(page.locator('#level-index')).toHaveText('002');
 await expect(page.locator('#level-intro-title')).toContainText('PODWÓJNY ZAKRĘT');
 await expect(page.locator('#level-menu')).toBeHidden();
 expect(errors).toEqual([]);
});


for(const [width,height] of [[1366,768],[1280,720],[1093,614]]){
 test(`right-click rotates the pointed optic once on the board and in the tray at ${width}x${height}`,async({page})=>{
  await page.setViewportSize({width,height});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?play=1');
  const tray=page.locator('#inventory button').filter({hasText:'LUSTRO'});
  const state=()=>page.evaluate(()=>window.chromatron.getState());
  const mirror=async()=>(await state()).pieces.find(p=>p.type==='mirror');
  const point=(x,y,height=0)=>page.evaluate(args=>window.chromatron.projectCell(...args),[x,y,height]);
  const start=await mirror();
  await tray.click({button:'right'});
  expect(await mirror()).toMatchObject({rot:(start.rot+1)%8,inTray:true});
  expect((await state()).placementMode).toBe(true);
  const dest=await point(5,7);
  await page.mouse.click(dest.x,dest.y,{button:'right'});
  expect(await mirror()).toMatchObject({rot:(start.rot+2)%8,inTray:true});
  await page.mouse.click(dest.x,dest.y);
  await page.keyboard.press('Escape');
  expect((await state()).selectedId).toBeNull();
  const head=await point(5,7,.78);
  await page.mouse.click(head.x,head.y,{button:'right'});
  expect(await mirror()).toMatchObject({x:5,y:7,inTray:false,rot:(start.rot+3)%8});
  expect((await state()).selectedId).toBe(start.id);
  await page.keyboard.press('Control+z');
  expect(await mirror()).toMatchObject({x:5,y:7,rot:(start.rot+2)%8});
  const fixed=(await state()).pieces.find(p=>p.type==='laser');
  const source=await point(fixed.x,fixed.y,.78);
  await page.mouse.click(source.x,source.y,{button:'right'});
  expect((await state()).pieces.find(p=>p.id===fixed.id)).toEqual(fixed);
  await page.mouse.move(head.x,head.y);
  await page.mouse.down({button:'right'});
  await page.mouse.move(head.x+35,head.y+22,{steps:4});
  await page.mouse.up({button:'right'});
  expect(await mirror()).toMatchObject({x:5,y:7,rot:(start.rot+2)%8});
 });
}

test('select, place, rotate both ways and never teleport a placed mirror',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?play=1');
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
 await page.goto('/?debug=1');
 await selectQuality(page,'balanced');
 // A late scenery mesh used to move both mirrors by several cells on screen.
 let garden;
 await page.route('**/garden-heliostat-authored.glb',route=>{garden=route});
 await page.evaluate(()=>{window.__debug.switchCampaign('demo');window.__debug.loadLevel(2)});
 await expect.poll(()=>Boolean(garden)).toBe(true);
 const point=async(x,y,height=0)=>page.evaluate(({x,y,height})=>window.chromatron.projectCell(x,y,height),{x,y,height});
 const state=()=>page.evaluate(()=>window.chromatron.getState());
 const start=(await state()).pieces.filter(p=>p.type==='mirror');
 expect(start).toHaveLength(2);
 const m1=await point(5,11),m2=await point(9,11);
 await page.mouse.move(m1.x,m1.y);
 await garden.continue();
 await expect.poll(()=>page.evaluate(()=>window.__debug.getLevelState().pilotStatus)).toBe('ready');
 await page.waitForLoadState('networkidle');
 await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
 expect(await point(5,11)).toEqual(m1);
 expect(await point(9,11)).toEqual(m2);
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
 await page.goto('/?play=1');
 const icons=page.locator('#inventory .component-icon img');
 await expect(icons).toHaveCount(1);
 let stats=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(stats.photonSystems).toBeGreaterThan(0);
 expect(stats.beamSegments).toBeGreaterThan(1);
 expect(stats.beamGeometryDrawCalls).toBeLessThanOrEqual(8);
 expect(stats.contactShadowInstances).toBe(2); // laser + target; mirror is in tray
 expect(stats.guideObjects).toBe(0);

 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 const at=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.mouse.click(at.x,at.y);
 stats=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(stats.selectedType).toBe('mirror');
 expect(stats.contactShadowInstances).toBe(3);
 expect(stats.beamGeometryDrawCalls).toBeLessThanOrEqual(8);
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
 await page.goto('/?play=1');
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




test('physical laser absorber walls stop rays at their visible edge',async({page})=>{
 await page.goto('/?play=1',{waitUntil:'domcontentloaded'});
 const result=await page.evaluate(()=>window.chromatron.getState().result);
 const stats=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(stats.absorberStructure.segments).toBe(60);
 expect(stats.absorberStructure.collectors).toBe(60);
 expect(stats.absorberStructure.boundary).toBeCloseTo(9.75,3);
 expect(stats.absorberHits).toBeGreaterThan(0);
 expect(result.boundaryHits.length).toBe(stats.absorberHits);
 for(const hit of result.boundaryHits){
  expect(hit.boundary).toBe(true);
  expect(hit.nx===-.5||hit.nx===14.5||hit.ny===-.5||hit.ny===14.5).toBe(true);
 }
 await page.screenshot({path:'test-results/chromatron-physical-laser-walls.png',animations:'disabled'});
});

test('scenery uses cached, genuine GLB hero models without touching optics',async({page})=>{
 test.setTimeout(process.env.CI?120000:75000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?play=1');
 const first=await page.evaluate(()=>window.chromatron.getVisualStats());
 const biome=first.environment.biome;
 await expect.poll(async()=>page.evaluate(()=>window.chromatron.getVisualStats().heroScenery.status),
  {timeout:process.env.CI?30000:15000}).toBe('ready');
 const loaded=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(loaded.heroScenery.biome).toBe(biome);
 expect(loaded.heroScenery.loaded).toBe(true);
 expect(loaded.heroScenery.meshParts).toBeGreaterThanOrEqual(6);
 expect(loaded.heroScenery.visible).toBe({performance:2,balanced:3,cinematic:4}[loaded.effectiveQuality]);
 expect(loaded.heroScenery.loadError).toBeNull();
 await expect.poll(async()=>page.evaluate(()=>window.chromatron.getVisualStats().midgroundScenery.status),
  {timeout:process.env.CI?45000:20000}).toBe('ready');
 const dressed=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(dressed.midgroundScenery.biome).toBe(biome);
 expect(dressed.midgroundScenery.readyModels).toBe(2);
 expect(dressed.midgroundScenery.distinct).toBe(2);
 expect(dressed.midgroundScenery.visible).toBe({performance:3,balanced:6,cinematic:10}[dressed.effectiveQuality]);
 expect(dressed.midgroundScenery.loadErrors).toEqual([]);
 expect(dressed.beamSegments).toBe(first.beamSegments);
 await page.screenshot({path:'test-results/chromatron-premium-glb-world.png',animations:'disabled'});
 await page.screenshot({path:'test-results/chromatron-layered-midground.png',animations:'disabled'});
 const life=await page.evaluate(()=>window.chromatron.getVisualStats().ambientLife);
 expect(life.biome).toBe(biome);
 expect(life.craft).toBe({performance:1,balanced:2,cinematic:3}[loaded.effectiveQuality]);
 expect(life.rigs).toBe({performance:1,balanced:2,cinematic:2}[loaded.effectiveQuality]);
 expect(life.beacons).toBe({performance:4,balanced:8,cinematic:12}[loaded.effectiveQuality]);
 expect(life.motes).toBe({performance:6,balanced:16,cinematic:32}[loaded.effectiveQuality]);
 await page.screenshot({path:'test-results/chromatron-living-ambient.png',animations:'disabled'});
 const terrain=loaded.environment.terrain;
 expect(terrain.biome).toBe(biome);
 expect(terrain.courtyards).toBe(4);
 expect(terrain.textured).toBe(true);
 expect(terrain.rocks).toBe({performance:14,balanced:30,cinematic:48}[loaded.effectiveQuality]);
 expect(terrain.features).toBe({performance:24,balanced:52,cinematic:90}[loaded.effectiveQuality]);
 await page.screenshot({path:'test-results/chromatron-textured-biome-ground.png',animations:'disabled'});
 const far=loaded.environment.horizon;
 expect(far).toBeTruthy();
 expect(far.structures).toBe({performance:1,balanced:2,cinematic:3}[loaded.effectiveQuality]);
 expect(far.clouds).toBe(far.structures);
 await page.screenshot({path:'test-results/chromatron-deep-horizon.png',animations:'disabled'});
 expect(loaded.environment.rimHabitat).toBeLessThanOrEqual(8);
 expect(loaded.beamSegments).toBe(first.beamSegments);
 await page.locator('#levels-button').click();
 await expect(page.locator('#level-menu')).toBeVisible();
 await page.locator('#levels-close').click();
 const restored=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(restored.heroScenery.visible).toBe(loaded.heroScenery.visible);
 expect(restored.midgroundScenery.visible).toBe(dressed.midgroundScenery.visible);
 expect(errors).toEqual([]);
});

test('real planar mirror reflections and GPU quality presets are switchable',async({page})=>{
 // Mirror quality requires GPU-intensive render targets: SwiftShader on CI
 // is software-rendered and may be much slower than a normal laptop GPU.
 test.setTimeout(120000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1024,height:720});
 await page.goto('/?play=1',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#graphics-quality')).toHaveValue('auto');
 // Auto legitimately lowers GPU cost after sustained low FPS. A SwiftShader
 // runner would otherwise switch away from real mirrors during this test.
 await selectQuality(page,'balanced');
 const point=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 await page.mouse.click(point.x,point.y);
 await expect.poll(async()=>page.evaluate(()=>window.chromatron.getVisualStats().planarReflections)).toBe(1);
 await selectQuality(page,'performance');
 let stats=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(stats.planarReflections).toBe(0);
 expect(stats.pixelRatio).toBeLessThanOrEqual(1);
 await selectQuality(page,'cinematic');
 stats=await page.evaluate(()=>window.chromatron.getVisualStats());
 expect(stats.planarReflections).toBe(1);
 expect(stats.effectiveQuality).toBe('cinematic');
 expect(stats.pixelRatio).toBeGreaterThanOrEqual(1);
 await page.screenshot({path:'test-results/chromatron-true-mirror.png',animations:'disabled'});
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('#graphics-quality')).toHaveValue('cinematic');
 expect(errors).toEqual([]);
});

test('rotation eases visually without delaying the optical logic',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?play=1');
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
 await page.goto('/?play=1');
 // Pin a fixed profile so automatic GPU downgrades cannot invalidate counts.
 await selectQuality(page,'balanced');
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

 // Trackpad packets arrive inside one native input gesture. Dispatch them
 // together to avoid introducing multi-second test-runner gaps on SwiftShader:
 // one real wheel detent above still uses Playwright's physical mouse input.
 await page.evaluate(()=>{
  const canvas=document.querySelector('#scene canvas');
  for(let i=0;i<4;i++)canvas.dispatchEvent(new WheelEvent('wheel',{
   deltaY:-20,deltaMode:0,bubbles:true,cancelable:true
  }));
 });
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
 test.setTimeout(120000); // Multiple 3D viewport resizes on software-rendered CI GPUs.
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1366,height:768});
 await page.goto('/?play=1',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#scene canvas')).toBeVisible();
 for(const size of [
  {width:1366,height:768},
  {width:1280,height:720},
  {width:1093,height:614}, // 1366×768 with Windows display scaling 125%
  {width:1024,height:640}
 ]){
  await page.setViewportSize(size);
  for(const selector of ['.header','.mission','.tool-panel','#reset','#hint','#phone-tools summary','#camera-preset']){
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
  const mission=await page.locator('.mission').boundingBox();
  const tray=await page.locator('.tool-panel').boundingBox();
  expect(mission.y+mission.height).toBeLessThan(tray.y);
  expect(tray.x).toBeLessThan(size.width/2);
  expect(tray.x+tray.width).toBeGreaterThan(size.width/2);
  const footer=await page.locator('.hud-bottom').boundingBox();
  expect(footer.y+footer.height).toBeLessThanOrEqual(size.height+1);
  const boardClear=await page.evaluate(()=>[[0,0],[14,0],[14,14],[0,14]].every(([x,y])=>{
   const p=window.chromatron.projectCell(x,y);
   return Boolean(document.elementFromPoint(p.x,p.y)?.closest('#scene'));
  }));
  expect(boardClear).toBe(true);
 }
 // Verify controls are still reachable in the tightest configuration.
 const mirror=page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/});
 await mirror.click();
 const center=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.mouse.click(center.x,center.y);
 await expect(page.locator('#turn-left')).toBeVisible();
 await expect(page.locator('#turn-right')).toBeVisible();
 await page.screenshot({path:'test-results/chromatron-laptop-1024x640.png',animations:'disabled'});
 expect(errors).toEqual([]);
});

test('short viewport keeps the horizontal equipment rail and level controls reachable',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('chromatron-reborn-solved',JSON.stringify([0])));
 await page.setViewportSize({width:1093,height:550});
 await page.goto('/?play=1');
 const panel=page.locator('.game-dock');
 const info=await panel.evaluate(el=>({
  top:el.getBoundingClientRect().top,
  bottom:el.getBoundingClientRect().bottom,
  height:el.clientHeight
 }));
 expect(info.top).toBeGreaterThan(0);
 expect(info.bottom).toBeLessThanOrEqual(550);
 expect(info.height).toBeLessThan(98);
 await expect(page.locator('.equipment-slots')).toHaveCSS('overflow-x','auto');
 await expect(page.locator('#next')).toBeVisible();
 await page.locator('#next').click();
 await expect(page.locator('#level-index')).toHaveText('002');
 await page.screenshot({path:'test-results/chromatron-short-window.png'});
});

test('mobile equipment shelf keeps spectrum and keyboard selection within reach',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/?play=1');
 const shelf=page.locator('.tool-panel');
 const spectrum=page.locator('#spectral-toggle');
 const mirror=page.locator('.equipment-slots button[data-optic-type="mirror"]');
 await openTools(page);
 await expect(spectrum).toBeInViewport({ratio:1});
 await expect(mirror).toBeInViewport({ratio:1});
 await spectrum.click();
 await expect(spectrum).toHaveAttribute('aria-expanded','true');
 await useTool(page,'spectral-toggle');
 await page.locator('#phone-tools summary').focus();
 for(let i=0;i<18&&!await mirror.evaluate(el=>el===document.activeElement);i++)await page.keyboard.press('Tab');
 await expect(mirror).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(mirror).toBeFocused();
 await expect(mirror).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#transform-tools')).toBeVisible();
 await expect(shelf).toBeInViewport({ratio:1});
 await expect(page.locator('#drop-zone')).toBeHidden();
});


test('fullscreen button and F shortcut adapt the game without hiding controls',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/?play=1');
 await openTools(page);
 await expect(page.locator('#fullscreen')).toBeVisible();
 await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed','false');
 await useTool(page,'fullscreen');
 await expect.poll(async()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(true);
 await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#scene canvas')).toBeVisible();
 await expect(page.locator('#next')).toBeVisible();
 await page.keyboard.press('f');
 await expect.poll(async()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(false);
 await expect(page.locator('#fullscreen')).toHaveAttribute('aria-pressed','false');
 expect(errors).toEqual([]);
});


test('board focus mode expands usable puzzle space without losing equipment access',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1093,height:614});
 await page.goto('/?play=1');
 await openTools(page);
 await expect(page.locator('#board-focus')).toBeVisible();
 await useTool(page,'board-focus');
 await expect(page.locator('#app')).toHaveClass(/board-focus/);
 expect((await page.evaluate(()=>window.chromatron.getLayoutState())).boardFocus).toBe(true);
 for(const id of ['mission-drawer','tool-drawer']){
  const handle=page.locator('#'+id);
  await expect(handle).toBeVisible();
  const b=await handle.boundingBox();
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.x+b.width).toBeLessThanOrEqual(1093);
  expect(b.y+b.height).toBeLessThanOrEqual(614);
 }
 await page.locator('#tool-drawer').click();
 await expect(page.locator('#tool-drawer')).toHaveAttribute('aria-expanded','true');
 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 await expect(page.locator('#tool-drawer')).toHaveAttribute('aria-expanded','false');
 const cell=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.mouse.click(cell.x,cell.y);
 expect((await page.evaluate(()=>window.chromatron.getState())).pieces.find(p=>p.type==='mirror').inTray).toBe(false);
 await page.screenshot({path:'test-results/chromatron-laptop-focus.png'});
 await page.keyboard.press('b');
 await expect(page.locator('#app')).not.toHaveClass(/board-focus/);
 await useTool(page,'board-focus');
 await expect(page.locator('#app')).toHaveClass(/board-focus/);
 expect(errors).toEqual([]);
});


test('credits are spent once per hint stage and solved-level rewards cannot be farmed',async({page})=>{
 test.setTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?play=1',{waitUntil:'domcontentloaded'});
 const tools=()=>page.evaluate(()=>window.chromatron.getPuzzleTools());
 expect((await tools()).credits).toBe(3);
 await page.locator('#hint').click();
 await expect(page.locator('#reveal-hint')).toBeEnabled();
 await page.locator('#reveal-hint').click();
 expect((await tools()).unlocked).toBe(1);
 expect((await tools()).credits).toBe(3);
 await page.locator('#reveal-hint').click();
 expect((await tools()).unlocked).toBe(2);
 expect((await tools()).credits).toBe(1);
 await expect(page.locator('#reveal-hint')).toBeDisabled();
 await page.locator('#close-hint').click();
 const loc=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 await page.mouse.click(loc.x,loc.y);
 await page.keyboard.press('e');
 await expect.poll(async()=>page.evaluate(()=>window.chromatron.getState().result.won)).toBe(true);
 expect((await tools()).credits).toBe(6);
 await page.locator('#win').waitFor({state:'visible'});
 await expect(page.locator('#win-reward')).toContainText('+5');
 // Returning to the solved arrangement cannot grant credits again.
 await page.locator('#win').waitFor({state:'visible'});
 await page.keyboard.press('Escape');
 await page.locator('#reset').click();
 await page.locator('#inventory button').filter({hasText:/LUSTRO|MIRROR/}).click();
 await page.mouse.click(loc.x,loc.y);
 await page.keyboard.press('e');
 await expect.poll(async()=>page.evaluate(()=>window.chromatron.getState().result.won)).toBe(true);
 expect((await tools()).credits).toBe(6);
 expect(errors).toEqual([]);
});


test('level atlas is accessible on laptop and mobile, localized, and never blocks the board',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1093,height:614});
 await page.goto('/?play=1');
 await expect(page.locator('#level-intro-title')).toContainText('PIERWSZE ŚWIATŁO');
 await expect(page.locator('#level-intro-mode')).toHaveText('NOWY POZIOM');
 await expect(page.locator('#level-intro')).toHaveClass(/show/);
 await expect(page.locator('#level-arrival')).toHaveClass(/show/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1094);
 expect(await page.locator('#level-intro').evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');
 expect(await page.locator('#level-arrival').evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');
 await page.locator('#levels-button').click();
 await expect(page.locator('#level-menu')).toBeVisible();
 await expect(page.locator('#level-grid button.level-atlas-card')).toHaveCount(8);
 await expect(page.locator('#level-grid [data-level-index="0"]')).toBeEnabled();
 await expect(page.locator('#level-grid [data-level-index="0"] .level-atlas-card-biome')).not.toBeEmpty();
 await expect(page.locator('#level-grid [data-level-index="1"]')).toBeDisabled();
 await expect(page.locator('#level-atlas-summary')).toContainText('0 Z 8');
 await page.screenshot({path:'test-results/chromatron-level-map-laptop.png',animations:'disabled'});
 await page.keyboard.press('Escape');
 await expect(page.locator('#level-menu')).toBeHidden();
 await useTool(page,'language');
 await page.keyboard.press('m');
 await expect(page.locator('#level-menu-title')).toHaveText('LEVEL MAP');
 await expect(page.locator('#level-grid [data-level-index="1"]')).toHaveAttribute('data-status','locked');
 await page.locator('#levels-close').click();
 await page.setViewportSize({width:390,height:844});
 await page.locator('#levels-button').click();
 await expect(page.locator('#level-menu')).toBeVisible();
 const bounds=await page.locator('.level-atlas-modal').boundingBox();
 expect(bounds.x).toBeGreaterThanOrEqual(0);
 expect(bounds.x+bounds.width).toBeLessThanOrEqual(390);
 expect(bounds.y+bounds.height).toBeLessThanOrEqual(844);
 await page.screenshot({path:'test-results/chromatron-level-map-mobile.png',animations:'disabled'});
 await page.locator('#levels-close').click();
 await page.emulateMedia({reducedMotion:'reduce'});
 expect(await page.locator('#level-intro').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 expect(await page.locator('#level-arrival').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 expect(errors).toEqual([]);
});

test('original numeric level JSON imports privately with full 50 level index order',async({page})=>{
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?play=1',{waitUntil:'domcontentloaded'});
 await page.locator('#levels-button').click();
 const chooser=page.waitForEvent('filechooser');
 await page.locator('#atlas-import').click();
 await (await chooser).setFiles([]);
 await page.locator('#levels-close').click();
 const sample={
  levels:Array.from({length:50},(_,i)=>({
   text:'Synthetic sample '+i,
   pieces:[{type:2,rotation:2,color:4,x:2,y:7},
    {type:10,rotation:0,color:1,x:12,y:7}]
  })),
  level_order:Array.from({length:50},(_,i)=>i)
 };
 await page.locator('#help').click();
 await page.locator('#classic-files').setInputFiles({
  name:'chromatron1-extracted.json',
  mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(sample))
 });
 await expect(page.locator('#total-levels')).toHaveText('050');
 await expect(page.locator('#level-title')).toContainText('CHROMATRON 1');
 await expect(page.locator('#play-surface')).not.toHaveAttribute('inert','');
 expect((await page.evaluate(()=>window.chromatron.getState())).pieces).toHaveLength(2);
 await expect(page.locator('#next')).toBeDisabled();
 await page.locator('#levels-button').click();
 await expect(page.locator('#level-grid button.level-atlas-card')).toHaveCount(50);
 await expect(page.locator('#level-grid [data-level-index="0"]')).toBeEnabled();
 await expect(page.locator('#level-grid [data-level-index="1"]')).toBeDisabled();
 await expect(page.locator('#level-grid [data-level-index="49"]')).toBeDisabled();
 expect((await page.evaluate(()=>window.chromatron.getLevelAtlas())).unlockedCount).toBe(1);
 expect(errors).toEqual([]);
});
