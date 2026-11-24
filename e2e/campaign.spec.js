import {selectQuality} from './hud-tools.js';
import {test,expect} from '@playwright/test';

test.describe('touch gestures',()=>{
 test.use({hasTouch:true,viewport:{width:390,height:844},reducedMotion:'reduce'});

 test('swiping over an optic scrolls the tray and lifting upward carries it onto the board',async({page})=>{
  await openFullTray(page);
  const slots=page.locator('.equipment-slots');
  const mirror=slots.locator('[data-slot=mirror]');
  const readMirror=()=>page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror'));
  const touch=await page.context().newCDPSession(page);
  const send=(type,point)=>touch.send('Input.dispatchTouchEvent',{type,touchPoints:point?[{id:1,...point}]:[]});
  await page.evaluate(()=>{
   window.carryStarts=0;
   new MutationObserver(records=>{
    window.carryStarts+=records.filter(r=>r.oldValue?.includes('carrying-optic')).length;
   }).observe(document.body,{attributes:true,attributeFilter:['class'],attributeOldValue:true});
  });

  // Begin a horizontal swipe slowly enough to expose accidental pickup before native scrolling.
  const splitter=await slots.locator('[data-slot=splitter]').boundingBox();
  const start={x:splitter.x+splitter.width/2,y:splitter.y+splitter.height/2};
  await send('touchStart',start);
  for(const dx of [8,20,42,65,86])await send('touchMove',{x:start.x-dx,y:start.y-2});
  await send('touchEnd');
  await expect.poll(()=>slots.evaluate(el=>el.scrollLeft)).toBeGreaterThan(20);
  expect(await page.evaluate(()=>window.carryStarts)).toBe(0);
  expect(await page.evaluate(()=>window.chromatron.getState().selectedId)).toBeNull();

  await slots.evaluate(el=>{el.scrollLeft=0});
  await page.locator('#camera-preset').tap();
  const box=await mirror.boundingBox();
  const pickup={x:box.x+box.width/2,y:box.y+box.height/2};
  const dest=await page.evaluate(()=>window.chromatron.projectCell(7,7));
  await send('touchStart',pickup);
  await send('touchMove',{x:pickup.x+2,y:pickup.y-18});
  await expect(page.locator('body')).toHaveClass(/carrying-optic/);
  await send('touchMove',dest);
  await send('touchCancel');
  await expect(page.locator('body')).not.toHaveClass(/carrying-optic/);
  expect(await readMirror()).toMatchObject({inTray:true});

  const fittedDest=await page.evaluate(()=>window.chromatron.projectCell(7,7));
  await send('touchStart',pickup);
  await send('touchMove',{x:pickup.x+2,y:pickup.y-18});
  await send('touchMove',fittedDest);
  await send('touchEnd');
  await expect.poll(readMirror).toMatchObject({inTray:false,x:7,y:7});
  await expect(page.locator('#drop-zone')).toBeHidden();
 });

 test('pinching with an armed tray optic zooms without committing a move',async({page})=>{
  await page.addInitScript(()=>{
   localStorage.setItem('chromatron-start-campaign','demo');
   localStorage.setItem('chromatron-coach-dismissed','yes');
   localStorage.setItem('chromatron-graphics-quality','performance');
  });
  await page.goto('/?play=1');
  await page.locator('#inventory button[data-optic-type=mirror]').tap();
  const state=()=>page.evaluate(()=>window.chromatron.getState());
  const mirror=(snapshot)=>snapshot.pieces.find(p=>p.type==='mirror');
  const project=(x,y)=>page.evaluate(([x,y])=>window.chromatron.projectCell(x,y),[x,y]);
  const span=()=>page.evaluate(()=>{
   const a=window.chromatron.projectCell(5,7),b=window.chromatron.projectCell(9,7);
   return Math.hypot(a.x-b.x,a.y-b.y);
  });
  const center=await project(7,7),before=await span();
  const touch=await page.context().newCDPSession(page);
  const point=(id,dx)=>({id,x:center.x+dx,y:center.y});
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(1,-34)]});
  expect(mirror(await state()).inTray).toBe(true);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(1,-34),point(2,34)]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(1,-58),point(2,58)]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[point(1,-58)]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(span).toBeGreaterThan(before*1.25);
  const after=await state();
  expect(mirror(after).inTray).toBe(true);
  expect(after.placementMode).toBe(true);
  const cell=await project(7,8);
  await page.touchscreen.tap(cell.x,cell.y);
  expect(mirror(await state())).toMatchObject({inTray:false,x:7,y:8});
  const dest=await project(8,8);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...cell}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,...dest}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  expect(mirror(await state())).toMatchObject({inTray:false,x:7,y:8});
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...cell}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,...dest}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(mirror(await state())).toMatchObject({inTray:false,x:8,y:8});
  await expect(page.locator('#drop-zone')).toBeHidden();
 });
});

async function openFullTray(page){
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-start-campaign','demo');
  localStorage.setItem('chromatron-coach-dismissed','yes');
  localStorage.setItem('chromatron-graphics-quality','performance');
 });
 await page.goto('/?play=1');
 await page.evaluate(()=>{
  const optics=['mirror','splitter','prism','filter','bender','doppler','tangler',
   'mobileTeleporter','dualReflector','quadBender','primaryLogicGate'];
  window.chromatron.loadLevels([{title:'Pełny zasobnik',startMovablesInTray:true,pieces:[
   ['laser',1,8,2,1],['target',12,4,0,1],...optics.map((type,i)=>[type,3+i,8,1,type==='filter'?1:0])
  ]}]);
 });
}

test('large trays expose paging controls at laptop and compact screen sizes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await openFullTray(page);
 const previous=page.getByRole('button',{name:'Przewiń zasobnik w lewo'});
 const next=page.getByRole('button',{name:'Przewiń zasobnik w prawo'});
 const slots=page.locator('.equipment-slots');
 const scroll=()=>slots.evaluate(el=>el.scrollLeft);
 for(const [width,height] of [[1366,768],[1280,720],[1093,614],[640,360]]){
  await page.setViewportSize({width,height});
  await slots.evaluate(el=>{el.scrollLeft=0});
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(previous).toBeEnabled();
  await expect.poll(scroll).toBeGreaterThan(0);
  await previous.focus();
  await page.keyboard.press('Enter');
  await expect(previous).toBeDisabled();
  await expect(previous).toBeFocused();
  expect(await scroll()).toBe(0);
 }
 await page.setViewportSize({width:390,height:844});
 const end=await slots.evaluate(el=>el.scrollWidth-el.clientWidth);
 for(let step=0;step<12;step++){
  const before=await scroll();
  if(before>=end-1)break;
  await next.click();
  await expect.poll(scroll).toBeGreaterThan(before);
 }
 await expect(next).toBeDisabled();
 expect(await scroll()).toBe(end);
 const lastSlot=slots.getByRole('button',{name:'BRAMKA BARWY PODSTAWOWEJ'});
 await expect(lastSlot).toBeInViewport({ratio:1});
 await expect(lastSlot.locator('.equipment-name')).toHaveText('BRAMKA RGB');
 const crowdedLabels=await slots.locator('.equipment-name').evaluateAll(labels=>labels
  .filter(label=>label.getBoundingClientRect().height>2*parseFloat(getComputedStyle(label).lineHeight)+1)
  .map(label=>label.textContent));
 expect(crowdedLabels).toEqual([]);
 await expect(page.locator('#toast')).not.toHaveClass(/\bshow\b/);
 await page.screenshot({path:'test-results/equipment-tray-390x844.png'});
 await page.evaluate(()=>window.chromatron.loadLevels([{title:'Mały zasobnik',startMovablesInTray:true,
  pieces:[['laser',1,8,2,1],['target',12,4,0,1],['mirror',3,8,1,0]]}]));
 await expect(page.locator('#equipment-scroll')).toBeHidden();
});

test('dragging a tray mirror to the board never opens file import',async({page})=>{
 test.setTimeout(120000);
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-start-campaign','demo');
  localStorage.setItem('chromatron-graphics-quality','performance');
  Object.defineProperty(window,'devicePixelRatio',{get:()=>.65});
 });
 const dialogs=[];
 page.on('filechooser',()=>dialogs.push('filechooser'));
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/?play=1');
 const tray=page.locator('#inventory button[data-optic-type=mirror]');
 await expect(tray).toBeVisible();
 await page.evaluate(()=>{
  window.importShown=false;window.nativeDrags=0;
  document.addEventListener('dragstart',()=>window.nativeDrags++);
  new MutationObserver(()=>{
   if(!document.getElementById('drop-zone').classList.contains('hidden'))window.importShown=true;
  }).observe(document.getElementById('drop-zone'),{attributes:true,attributeFilter:['class']});
 });
 const dest=await page.evaluate(()=>window.chromatron.projectCell(7,7));
 const canvas=page.locator('#scene canvas');
 const rect=await canvas.boundingBox();
 await tray.dragTo(canvas,{targetPosition:{x:dest.x-rect.x,y:dest.y-rect.y}});
 await expect.poll(()=>page.evaluate(()=>window.chromatron.getState().pieces.find(p=>p.type==='mirror')))
  .toMatchObject({x:7,y:7,inTray:false});
 expect(await page.evaluate(()=>window.importShown)).toBe(false);
 expect(dialogs).toEqual([]);
 expect(await page.evaluate(()=>window.nativeDrags)).toBe(0);
 await page.locator('#levels-button').click();
 await expect(page.locator('[data-campaign=expert]')).toHaveCount(0);
});

test('the workshop shows Blender portraits and cancels a carried optic released on the tray',async({page})=>{
 test.setTimeout(120000);
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-start-campaign','demo');
  localStorage.setItem('chromatron-graphics-quality','performance');
  localStorage.setItem('chromatron-coach-dismissed','yes');
 });
 await page.setViewportSize({width:1366,height:768});
 await page.goto('/?play=1');
 await page.evaluate(()=>window.chromatron.loadLevels(JSON.stringify([{title:'Pracownia optyczna',
  startMovablesInTray:true,pieces:[['laser',1,8,2,1],['target',12,4,0,1],['mirror',6,8,1,0],['splitter',9,8,3,0]]}])));
 const tray=page.locator('#inventory');
 const mirror=tray.locator('button[data-optic-type=mirror]');
 const splitter=tray.locator('button[data-optic-type=splitter]');
 await expect(splitter.locator('img')).toHaveAttribute('src',/portraits\/splitter\.png$/);
 await expect.poll(()=>mirror.locator('img').evaluate(img=>[img.naturalWidth,img.naturalHeight])).toEqual([160,160]);
 await expect(tray.locator('details')).not.toHaveAttribute('open','');
 const textHeight=await splitter.locator('span').nth(1).evaluate(el=>({
  height:el.getBoundingClientRect().height,line:parseFloat(getComputedStyle(el).lineHeight)
 }));
 expect(textHeight.height).toBeLessThanOrEqual(textHeight.line+1);
 const start=await mirror.boundingBox(),other=await splitter.boundingBox();
 await page.mouse.move(start.x+20,start.y+15);await page.mouse.down();
 await page.mouse.move(other.x+20,other.y+15,{steps:5});
 await expect(page.locator('body')).toHaveClass(/carrying-optic/);
 await page.mouse.up();
 await expect(page.locator('body')).not.toHaveClass(/carrying-optic/);
 expect(await page.evaluate(()=>window.chromatron.getState().pieces.filter(p=>p.inTray).length)).toBe(2);
 await mirror.click();
 const a=await page.evaluate(()=>window.chromatron.projectCell(5,8));
 await page.mouse.click(a.x,a.y);
 await splitter.click();
 const b=await page.evaluate(()=>window.chromatron.projectCell(8,8));
 await page.mouse.click(b.x,b.y);
 await page.keyboard.press('Escape');
 await page.mouse.move(1,1);
 await expect.poll(()=>page.evaluate(()=>window.chromatron.getVisualStats().activeOpticTweens)).toBe(0);
 await page.screenshot({path:'test-results/chromatron-workshop.png'});
});

test('grabbing the raised face above an occupied neighbouring tile moves the visible mirror',async({page})=>{
 test.setTimeout(120000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-start-campaign','demo');
  localStorage.setItem('chromatron-graphics-quality','performance');
  Object.defineProperty(window,'devicePixelRatio',{get:()=>.65});
 });
 await page.setViewportSize({width:1093,height:614});
 await page.goto('/?play=1');
 await page.evaluate(()=>window.chromatron.loadLevels([{title:'Adjacent instruments',pieces:[
  ['laser',2,3,2,1],['target',10,12,0,2],['mirror',7,7,0,0],
  ['splitter',8,6,0,0],['filter',7,6,0,2],['bender',8,7,0,0]
 ]}]));
 // Aim at the upper part of the metal face, where perspective puts a
 // different occupied floor cell underneath the mouse.
 const sample=()=>page.evaluate(()=>{
  const game=window.chromatron,parts=game.getState().pieces;
  const mirror=parts.find(p=>p.type==='mirror');
  for(const height of [1.10,1.13,1.04,.99]){
   for(const z of [0,-.1,-.2,.1,.2]){
    const point=game.projectCell(7-.06/1.3,7+z,height);
    const result=game.inspectPointer(point.x,point.y);
    const other=parts.find(p=>p.x===result.cell?.x&&p.y===result.cell?.y);
    if(result.hit?.pieceId===mirror.id&&other&&other.id!==mirror.id)
     return {point,dest:game.projectCell(5-.06/1.3,8+z,height),id:mirror.id};
   }
  }
  return null;
 });
 await expect.poll(sample).toBeTruthy();
 const {point,dest,id}=await sample();
 await page.mouse.move(point.x,point.y);await page.mouse.down();
 expect(await page.evaluate(()=>window.chromatron.getState().selectedId)).toBe(id);
 await page.mouse.move(dest.x,dest.y,{steps:6});await page.mouse.up();
 const parts=await page.evaluate(()=>window.chromatron.getState().pieces);
 expect(parts.find(p=>p.id===id)).toMatchObject({x:5,y:8});
 expect(parts.find(p=>p.type==='splitter')).toMatchObject({x:8,y:6});
 expect(parts.find(p=>p.type==='filter')).toMatchObject({x:7,y:6});
 expect(parts.find(p=>p.type==='bender')).toMatchObject({x:8,y:7});
});

test('picking uses current world transforms immediately after switching boards, before a render',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('chromatron-start-campaign','demo'));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?play=1');
 const picked=await page.evaluate(()=>{
  window.chromatron.loadLevels([{title:'Immediate selection',pieces:[
   ['laser',2,7,2,1],['target',7,3,0,2],['mirror',7,7,0,0]
  ]}]);
  const point=window.chromatron.projectCell(7,7);
  return window.chromatron.inspectPointer(point.x,point.y).hit;
 });
 expect(picked).toMatchObject({pieceType:'mirror'});
});

test('orbital scenery loads all three GLBs on a laptop layout',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>Object.defineProperty(window,'devicePixelRatio',{get:()=>.70}));
 await page.setViewportSize({width:1366,height:768});
 await page.goto('/?debug=1&pilot=0');
 await page.waitForFunction(()=>Boolean(window.__debug));
 await selectQuality(page,'performance');
 await page.evaluate(()=>{
  window.__debug.switchCampaign('demo');
  window.__debug.setTheme('orbital');
 });
 await expect.poll(()=>page.evaluate(()=>window.chromatron?.getVisualStats().modeledScenery))
  .toEqual({chassis:true,absorber:true,shuttle:true});
 expect(await page.evaluate(()=>window.chromatron.getVisualStats().environment.biome)).toBe('orbital');
 await expect.poll(()=>page.evaluate(()=>window.chromatron.getVisualStats().boardChassis)).toBe('orbital');
 await page.screenshot({path:'test-results/scenery-pilot-orbital.png'});
});
