import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {parseArgs} from 'node:util';
import {spawn} from 'node:child_process';
import {createServer} from 'vite';
import {launchChromium} from './capture-browser.mjs';
import {readLocalCampaigns} from '../scripts/local-campaigns.mjs';
import {solvePuzzle,verifyPuzzleSolution} from '../src/puzzle-solver.js';

const {values}=parseArgs({options:{
 backend:{type:'string',default:'native'},
 out:{type:'string',default:'test-results/full-regression'},
 'skip-screenshots':{type:'boolean',default:false}
}});
if(!['native','swiftshader'].includes(values.backend))throw Error('Invalid WebGL backend');
const out=resolve(values.out);
await mkdir(out,{recursive:true});
const packs=readLocalCampaigns(resolve('original'));
const findings=packs.map(({game,levels})=>({campaign:'classic'+game,
 levels:levels.map((level,index)=>{
  const answer=solvePuzzle(level);
  const moves=answer.solution;
  const verified=verifyPuzzleSolution(level,moves).valid;
  return {level:index+1,status:verified?'verified':answer.status,
   method:answer.method??null,moves,moveCount:moves?.length??0,
   required:verified?moves.map(({index})=>level.pieces[index][0]):[],
   alternative:verified&&findAlternative(level,moves)};
 })}));
await mkdir('data',{recursive:true});
await writeFile('data/solutions.json',JSON.stringify({packs:findings},null,2)+'\n');

function findAlternative(level,moves){
 for(const [i,move] of moves.entries()){
  for(const delta of [2,4,6,1,3,5,7]){
   const variant=moves.slice();
   variant[i]={...move,rot:(move.rot+delta)%8};
   if(verifyPuzzleSolution(level,variant).valid)return true;
  }
  for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
   const variant=moves.slice();
   variant[i]={...move,x:move.x+dx,y:move.y+dy};
   if(verifyPuzzleSolution(level,variant).valid)return true;
  }
 }
 return false;
}

const report={expected:200,available:findings.reduce((n,pack)=>n+pack.levels.length,0),
 engineVerified:0,browserVerified:0,alternateFound:0,browserFailures:[],browserErrors:[],warnings:[],
 solverStatuses:{},memory:[]};
for(const pack of findings)for(const level of pack.levels){
 if(level.status==='verified')report.engineVerified++;
 report.solverStatuses[level.status]=(report.solverStatuses[level.status]??0)+1;
 if(level.alternative)report.alternateFound++;
}

const server=await createServer({server:{host:'127.0.0.1',port:4411},logLevel:'error'});
let browser;
const writeReport=()=>writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
try{
 await server.listen();
 const url='http://127.0.0.1:'+server.httpServer.address().port+'/?debug=1';
 browser=await launchChromium({backend:values.backend});
 const context=await browser.newContext({viewport:{width:1093,height:614},deviceScaleFactor:1});
 const page=await context.newPage();
 page.on('pageerror',error=>report.browserErrors.push(error.message));
 page.on('console',message=>{
  if(message.type()==='error')report.browserErrors.push(message.text());
  if(message.type()==='warning'&&!report.warnings.includes(message.text()))report.warnings.push(message.text());
 });
 page.on('response',response=>{
  if(response.status()>=400)report.browserErrors.push(response.status()+' '+new URL(response.url()).pathname);
 });
 const cdp=await context.newCDPSession(page);
 const started=performance.now();
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(window.__debug),{},{timeout:45000});
 report.startupMs=Math.round(performance.now()-started);
 await page.evaluate(()=>{
  const quality=document.querySelector('#graphics-quality');
  quality.value='performance';quality.dispatchEvent(new Event('change'));
  window.__debug.freezeAnimations(true);
 });
 const checkpoint=async(pass,campaign,level)=>{
  await page.waitForFunction(()=>{
   const status=window.__debug.getLevelState().pilotStatus;
   return status===null||status==='ready'||status==='error';
  },{},{timeout:18000});
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  await cdp.send('HeapProfiler.collectGarbage');
  const {usedSize}=await cdp.send('Runtime.getHeapUsage');
  const state=await page.evaluate(()=>({stats:window.__debug.getStats(),status:window.__debug.getLevelState().pilotStatus}));
  if(state.status==='error')report.browserErrors.push('Scenery failed: '+campaign+' '+level);
  report.memory.push({pass,campaign,level,heapBytes:Math.round(usedSize),...state.stats});
 };
 for(const pass of ['solve','revisit']){
  for(const {campaign,levels} of findings){
   const selected=await page.evaluate(c=>window.__debug.switchCampaign(c),campaign);
   if(!selected||await page.evaluate(()=>window.__debug.getLevelState().campaign)!==campaign)
    throw Error('Missing private campaign '+campaign);
   for(const candidate of levels){
    const {level,status,moves}=candidate;
    if(status!=='verified')continue;
    const step=await page.evaluate(({level,moves,pass})=>{
     const api=window.__debug;
     if(!api.loadLevel(level))return 'load';
     if(pass==='revisit')return api.getLevelState().completed?'ok':'not marked';
     for(const move of moves)if(!api.applyMove(move))return 'move rejected';
     if(!api.isSolved())return 'unsolved';
     return api.getLevelState().completed?'ok':'not marked';
    },{level,moves,pass});
    if(step==='ok'){
     if(pass==='solve')report.browserVerified++;
    }else report.browserFailures.push({pass,campaign,level,step});
    if(level%25===0)await checkpoint(pass,campaign,level);
   }
   console.log(pass,campaign,report.browserVerified+' verified, '+report.browserFailures.length+' failures');
   await writeReport();
  }
 }
} finally {
 await browser?.close();
 await server.close();
 await writeReport();
}

if(!values['skip-screenshots']){
 const shots=resolve(out,'public-demo');
 await command('tools/shoot.mjs',['--backend',values.backend,'--quality','balanced',
  '--levels','1,2,3,4,5,6,7,8','--warmup-ms','2500','--out',shots]);
 await command('tools/shoot.mjs',['--backend',values.backend,'--levels','8',
  '--sizes','1366x768,1280x720,1093x614,2560x1440,844x390,768x1024',
  '--warmup-ms','2000','--out',resolve(out,'viewport-demo')]);
}
if(report.engineVerified!==report.expected||report.browserVerified!==report.expected||
 report.browserFailures.length||report.browserErrors.length)process.exitCode=1;

function command(script,args){
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[script,...args],{stdio:'inherit'});
  child.on('error',reject);
  child.on('exit',code=>code===0?resolve():reject(Error(script+' failed: '+code)));
 });
}
