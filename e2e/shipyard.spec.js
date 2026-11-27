import {selectQuality} from './hud-tools.js';
import {expect,test} from '@playwright/test';
import {captureFrame,luminance,projectCells} from './frame.js';

for(const levels of [[1,2,3,8],[4,5,6,7]])
test(`scenery keeps all playable cells visible in worlds ${levels.join(', ')}`,async({page})=>{
 test.setTimeout(120000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1366,height:768});
 await page.goto('/?debug=1');
 await page.waitForFunction(()=>Boolean(window.__debug));
 await selectQuality(page,'performance');
 await page.evaluate(()=>window.__debug.switchCampaign('demo'));
 for(const level of levels){
  await page.evaluate(n=>{window.__debug.loadLevel(n);window.__debug.freezeAnimations(true,{onDemand:true})},level);
  await expect.poll(()=>page.evaluate(()=>window.__debug.getLevelState().pilotStatus)).toBe('ready');
  if(level===1)expect(await page.evaluate(()=>window.__debug.getLevelState().artScene)).toBe('kepler');
  for(const [width,height] of [[1366,768],[1280,720],[1093,614],[390,844]]){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
    window.__debug.renderStill();resolve();
   }))));
   expect(await page.evaluate(()=>window.__debug.getSceneryOcclusion()),`Demo ${level} · ${width} × ${height}`).toEqual([]);
  }
 }
});

test.describe('touch scenery',()=>{
 test.use({hasTouch:true,isMobile:true,reducedMotion:'reduce',viewport:{width:390,height:844}});
 test('all eight overhead boards keep the 225 cell centers clear',async({page})=>{
  test.setTimeout(90000);
  await page.goto('/?debug=1');
  const status=()=>page.evaluate(()=>window.__debug.getLevelState().pilotStatus);
  for(let level=1;level<=8;level++){
   await page.evaluate(n=>{
    const api=window.__debug;
    if(n===1)api.switchCampaign('demo');
    api.freezeAnimations(true,{onDemand:true});
    api.loadLevel(n);
   },level);
   await expect.poll(status).toBe('ready');
   await page.evaluate(()=>window.__debug.renderStill());
   expect(await page.evaluate(()=>window.__debug.getSceneryOcclusion()),`phone level ${level}`).toEqual([]);
  }
 });
});

for(const [level,world] of [[2,'garden'],[3,'grotto'],[4,'frost'],[5,'forge'],[6,'abyss'],[7,'sanctuary'],[8,'shipyard']])
test(`${world} scenery stays clear when orbiting the board at a low angle`,async({page})=>{
 test.setTimeout(90000);
 const failedShaders=[];
 page.on('console',message=>{
  if(message.type()==='error'&&/WebGLProgram|WebGLShader/.test(message.text()))failedShaders.push(message.text());
 });
 await page.setViewportSize({width:1280,height:720});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?debug=1');
 await page.waitForFunction(()=>Boolean(window.__debug));
 await page.evaluate(level=>{
  window.__debug.switchCampaign('demo');
  window.__debug.loadLevel(level);
  window.__debug.freezeAnimations(true,{onDemand:true});
 },level);
 await expect.poll(()=>page.evaluate(()=>window.__debug.getLevelState().pilotStatus)).toBe('ready');
 await page.evaluate(()=>window.__debug.renderStill());
 const corner=()=>page.evaluate(()=>window.chromatron.projectCell(0,0));
 for(let turn=0;turn<4;turn++){
  const before=await corner();
  const start=await page.evaluate(()=>{
   const api=window.chromatron,canvas=document.querySelector('#scene canvas');
   for(const x of [7,6,8,5,9])for(const y of [9,8,10,7,11]){
    const point=api.projectCell(x,y);
    if(point.y>90&&point.x<innerWidth-355&&document.elementFromPoint(point.x,point.y)===canvas&&
       api.inspectPointer(point.x,point.y).intent==='clear')return point;
   }
   return null;
  });
  expect(start).not.toBeNull();
  await page.mouse.move(start.x,start.y);
  await page.mouse.down();
  await page.mouse.move(start.x+349,start.y-(turn===0?78:0),{steps:5});
  await page.mouse.up();
  await expect.poll(corner).not.toEqual(before);
  await page.evaluate(()=>window.__debug.renderStill());
  expect(await page.evaluate(()=>window.__debug.getSceneryOcclusion()),'quarter turn '+(turn+1)).toEqual([]);
 }
 expect(failedShaders).toEqual([]);
});

test('compact overhead framing retains all 14 inner grid lines on each axis',async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:640,height:360});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?debug=1');
 await page.waitForFunction(()=>Boolean(window.__debug));
 await page.evaluate(()=>{
  const quality=document.querySelector('#graphics-quality');
  quality.value='balanced';quality.dispatchEvent(new Event('change'));
  window.__debug.switchCampaign('demo');window.__debug.loadLevel(8);
  window.__debug.freezeAnimations(true,{onDemand:true});
 });
 await expect.poll(()=>page.evaluate(()=>window.__debug.getLevelState().pilotStatus)).toBe('ready');
 await page.locator('#camera-preset').click();
 await expect(page.locator('.board-symbol').first()).toBeVisible();
 const setups=[[640,360,'balanced'],[1093,614,'performance'],[390,844,'performance'],[1280,720,'cinematic'],[1366,768,'balanced']];
 for(const [width,height,profile] of setups){
  await page.setViewportSize({width,height});
  await selectQuality(page,profile);
  const frame=await captureFrame(page);
  for(const axis of ['vertical','horizontal']){
   const vertical=axis==='vertical',cells=[];
   // Sample ordinary cells, away from the bright horizontal beam and the board rim.
   for(let line=0;line<14;line++)for(const cell of [1,5,10,12,13])
    cells.push(vertical?[line+.5,cell]:[cell,line+.5]);
   const points=await projectCells(page,cells);
   const lines=[];
   for(let i=0;i<points.length;i+=5){
    const samples=points.slice(i,i+5).map(({x,y})=>{
     const sample=offset=>vertical?luminance(frame,x+offset,y):luminance(frame,x,y+offset);
     return (sample(-3)+sample(3))/2-Math.min(sample(-1),sample(0),sample(1));
    }).sort((a,b)=>a-b);
    lines.push(Math.round(samples[2]));
   }
   expect(lines.filter(delta=>delta>=12),`${width} × ${height} ${axis} luminance deltas: ${lines.join(', ')}`).toHaveLength(14);
  }
 }
});

test('top view labels adjacent optics without intercepting their cells',async({page})=>{
 await page.setViewportSize({width:1366,height:768});
 await page.addInitScript(()=>{
  localStorage.setItem('chromatron-start-campaign','demo');
  localStorage.setItem('chromatron-graphics-quality','performance');
 });
 await page.goto('/?play=1');
 const camera=page.locator('#camera-preset'),symbols=page.locator('#board-symbols');
 await expect(symbols).toBeHidden();
 // Deliver a press while the camera is still between its two presets.
 await page.evaluate(()=>{
  document.querySelector('#camera-preset').click();
  document.querySelector('#scene canvas').dispatchEvent(new PointerEvent('pointerdown',{isPrimary:true,button:0}));
 });
 await expect(symbols).toBeVisible();
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>window.chromatron.loadLevels([{title:'Sąsiednie przyrządy',pieces:[
  ['laser',1,6,2,1],['target',11,4,0,1],['mirror',7,8,0,0],['splitter',8,8,1,0]
 ]}]));
 await expect(symbols.locator('.board-symbol')).toHaveCount(4);
 const mirror=symbols.locator('[data-optic-type=mirror]');
 const splitter=symbols.locator('[data-optic-type=splitter]');
 expect(await mirror.locator('path').getAttribute('d')).not.toBe(await splitter.locator('path').getAttribute('d'));
 for(const [width,height] of [[1366,768],[1280,720],[1093,614],[390,844],[640,360]]){
  await page.setViewportSize({width,height});
  await expect.poll(()=>page.evaluate(()=>{
   const parts=window.chromatron.getState().pieces;
   const marker=type=>document.querySelector(`.board-symbol[data-optic-type="${type}"]`).getBoundingClientRect();
   const left=marker('mirror'),right=marker('splitter');
   const part=parts.find(p=>p.type==='splitter');
   const {x,y}=window.chromatron.projectCell(part.x,part.y);
   return left.right<=right.left&&right.left>x&&right.top>y&&
    Boolean(document.elementFromPoint(right.x+right.width/2,right.y+right.height/2)?.closest('#scene'));
  }),`${width} × ${height} distinct symbols and unobstructed pointer target`).toBe(true);
 }
 const box=await splitter.boundingBox();
 await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
 await expect(splitter).toHaveClass(/selected/);
 await page.locator('#return-tray').click();
 await expect(splitter).toHaveCount(0);
 await page.locator('#undo').click();
 await expect(splitter).toBeVisible();

 await page.locator('#main-menu-toggle').click();
 await page.locator('#menu-settings').click();
 const preference=page.getByRole('button',{name:'Symbole w widoku z góry'});
 await expect(preference).toHaveAttribute('aria-pressed','true');
 await preference.click();
 await page.keyboard.press('Escape');
 await page.locator('#menu-play').click();
 await expect(symbols).toBeHidden();
 await page.reload();
 await camera.click();
 await expect(symbols).toBeHidden();
});

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
