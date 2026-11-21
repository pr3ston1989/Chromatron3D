import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createServer} from 'vite';
import {launchChromium} from './capture-browser.mjs';

const out=process.argv[2]||'screenshots/orbital';
await mkdir(out,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:0},logLevel:'error'});
await server.listen();
let browser;
try{
 browser=await launchChromium({backend:process.env.CHROMATRON_RENDER_BACKEND||'native'});
 const report=[];
 for(const [width,height] of [[1672,941],[1366,768],[1280,720],[1093,614],[390,844]]){
  const errors=[];
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce',locale:'pl-PL'});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error'&&msg.text().includes('THREE.'))errors.push(msg.text())});
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/?benchmark=orbital&debug=1');
  await page.waitForFunction(()=>window.__debug?.getLevelState().pilotStatus==='ready');
  await page.waitForLoadState('networkidle');
  await page.evaluate(()=>window.__debug.freezeAnimations(true));
  await page.evaluate(()=>new Promise(end=>requestAnimationFrame(()=>requestAnimationFrame(end))));
  const name='kepler-'+width+'x'+height;
  await page.screenshot({path:join(out,name+'.png')});
  const result=await page.evaluate(()=>({
   stats:window.__debug.getStats(),occluded:window.__debug.getSceneryOcclusion(),
   corners:[[0,0],[14,0],[14,14],[0,14]].map(([x,y])=>window.chromatron.projectCell(x,y,.1)),
   active:document.querySelector('#counter').textContent
  }));
  if(width===1366){
   await page.locator('#receiver-toggle').click();
   await page.screenshot({path:join(out,'kepler-inspection.png')});
  }
  report.push({width,height,...result,errors});
  console.log(name,JSON.stringify({active:result.active,blocked:result.occluded.length,errors}));
  await page.close();
 }
 await writeFile(join(out,'review.json'),JSON.stringify(report,null,2));
 if(report.some(s=>s.errors.length||s.occluded.length))process.exitCode=1;
}finally{
 await browser?.close();
 await server.close();
}
