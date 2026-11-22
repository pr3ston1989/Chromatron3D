import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createServer} from 'vite';
import {launchChromium} from './capture-browser.mjs';
import {readLocalCampaigns} from '../scripts/local-campaigns.mjs';
import {verifyPuzzleSolution} from '../src/puzzle-solver.js';
import {CLASSIC_TYPE_NAMES} from '../src/classic-pieces.js';
import {t} from '../src/i18n.js';

const output=process.argv[2]||'screenshots/kepler-service-dock';
await mkdir(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:0,watch:null},logLevel:'error'});
let browser;
try{
 await server.listen();
 browser=await launchChromium({backend:process.env.CHROMATRON_RENDER_BACKEND||'native'});
 const page=await browser.newPage({viewport:{width:1672,height:941},deviceScaleFactor:1.75,
  locale:'pl-PL',reducedMotion:'reduce'});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
 const loadedModels=new Set();
 page.on('response',r=>{
  const url=new URL(r.url());
  if(r.ok()&&url.pathname.endsWith('.glb')&&!url.search)loadedModels.add(url.pathname.split('/').pop());
 });
 await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/?benchmark=orbital&debug=1');
 await page.waitForFunction(()=>window.__debug?.getLevelState().pilotStatus==='ready');
 await page.waitForLoadState('networkidle');
 for(const model of ['kepler-service-dock.glb','transit-gate.glb'])assert.ok(loadedModels.has(model),model+' must load');
 await page.evaluate(()=>window.__debug.freezeAnimations(true));
 const coach=page.locator('#coach-dismiss');
 if(await coach.isVisible())await coach.click();
 await page.locator('#orbital-settings').click();
 await page.locator('#menu-quality').selectOption('cinematic');
 await page.locator('#close-settings').click();
 await page.mouse.move(5,5);

 async function verifyView(name,capture=false){
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const state=await page.evaluate(()=>({
   theme:window.__debug.getLevelState().theme,
   covered:window.__debug.getSceneryOcclusion(),
   center:window.chromatron.projectCell(0,0,.11),
   backend:window.__debug.getStats().backend
  }));
  assert.equal(state.theme,'kepler');
  assert.deepEqual(state.covered,[],name+' must leave every cell visible');
  if(capture)await page.screenshot({path:join(output,name+'.png'),scale:'css'});
  console.log(name,'225 cells visible;',state.backend);
  return state.center;
 }
 const initial=await verifyView('01-kamera-gry',true);
 if(process.argv.includes('--optics')){
  const local=readLocalCampaigns('original').find(pack=>pack.game===1)?.levels[14];
  if(local&&verifyPuzzleSolution(local,local.solution).valid){
   const prefix=local.solution.slice(0,Math.floor(local.solution.length*.80));
   await page.evaluate(moves=>moves.forEach(move=>window.__debug.applyMove(move)),prefix);
   await page.keyboard.press('Escape');
   await verifyView('03-pole-w-pracy',true);
   const point=await page.evaluate(()=>{
    const {pieces,result}=window.chromatron.getState();
    const received=new Map(result.received);
    const p=pieces.find(p=>p.type==='target'&&p.color!==7&&received.get(p.id)===p.color);
    if(!p||!result.boundaryHits.length)throw Error('Missing live coloured receiver or field contact');
    return window.chromatron.projectCell(p.x,p.y,.74);
   });
   await page.screenshot({path:join(output,'04-krysztal.png'),
    clip:{x:Math.max(0,Math.min(1672-540,Math.round(point.x)-270)),
          y:Math.max(52,Math.min(941-320,Math.round(point.y)-135)),width:540,height:320}});
  }
  const catalog=await browser.newPage({viewport:{width:1152,height:1060}});
  const cards=await Promise.all(CLASSIC_TYPE_NAMES.slice(1).map(async kind=>{
   const title=t('pl','type'+kind[0].toUpperCase()+kind.slice(1));
   const png=await readFile(new URL('../assets/models/optical-bench/portraits/'+kind+'.png',import.meta.url));
   return '<figure><img src="data:image/png;base64,'+png.toString('base64')+'"><figcaption>'+title+'</figcaption></figure>';
  }));
  await catalog.setContent('<style>*{box-sizing:border-box}body{margin:0;background:#101a2a;color:#dfebf6;font:16px Segoe UI,sans-serif;padding:32px}h1{font-size:29px;margin:0 0 20px}main{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}figure{margin:0;text-align:center;background:linear-gradient(145deg,#25364b,#172333);border:1px solid #33465b;padding:6px}img{width:154px;height:154px;display:block;margin:auto}figcaption{padding:6px 0;color:#c7d8e8;font-size:13px}</style><h1>Chromatron · modele planszowe</h1><main>'+cards.join('')+'</main>');
  await catalog.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
  await catalog.screenshot({path:join(output,'05-katalog.png'),fullPage:true});
  await catalog.close();
 }
 // Use the player's ordinary orbit gesture, away from the pieces and HUD.
 await page.mouse.move(820,680);
 await page.mouse.down();
 await page.mouse.move(1095,658,{steps:10});
 await page.mouse.up();
 await page.mouse.wheel(0,630);
 await page.mouse.move(5,5);
 const alternate=await verifyView('02-widok-boczny',true);
 assert.ok(Math.hypot(initial.x-alternate.x,initial.y-alternate.y)>50,'The second angle must differ');
 for(const [width,height] of [[1366,768],[1280,720],[1093,614],[390,844]]){
  await page.setViewportSize({width,height});
  await verifyView(width+'x'+height);
 }
 await page.setViewportSize({width:1366,height:768});
 await page.locator('#camera-preset').click();
 await verifyView('rzut z góry');
 assert.deepEqual(errors,[],'Browser errors');
}finally{
 await browser?.close();
 await server.close();
}
