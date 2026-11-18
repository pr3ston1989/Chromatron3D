import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {parseArgs} from 'node:util';
import {spawn} from 'node:child_process';
import {createServer} from 'vite';
import {launchChromium} from './capture-browser.mjs';
import {readLocalCampaigns} from '../scripts/local-campaigns.mjs';
import {createPuzzlePieces,solvePuzzle,verifyPuzzleSolution} from '../src/puzzle-solver.js';
import {contextualHint} from '../src/hint-assistant.js';

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
  const start=performance.now();
  const answer=solvePuzzle(level);
  const moves=answer.solution;
  const verified=verifyPuzzleSolution(level,moves).valid;
  return {level:index+1,status:verified?'verified':answer.status,
   validationMs:Number((performance.now()-start).toFixed(2)),
   method:answer.method??null,moves,moveCount:moves?.length??0,
   required:verified?moves.map(({index})=>level.pieces[index][0]):[],
   alternative:verified&&findAlternative(level,moves)};
 })}));
await mkdir('data',{recursive:true});
await writeFile('data/solutions.json',JSON.stringify({packs:findings},null,2)+'\n');

const hintPacks=packs.map(({game,levels})=>({campaign:'classic'+game,levels:levels.map((level,index)=>{
 const pieces=createPuzzlePieces(level);
 const clues=[1,2,3].map(step=>contextualHint(level,pieces,step,'pl',level.solution));
 const focus=clues[2].focus;
 const move=focus&&level.solution?.find(({x,y})=>x===focus.x&&y===focus.y);
 return {level:index+1,clues:clues.map(clue=>clue.body),move:move??null,
  verified:Boolean(clues.every(clue=>clue.verified)&&!clues[1].focus&&move)};
})}));
const previousHints=JSON.parse(await readFile('data/hints.pl.json','utf8').catch(error=>{
 if(error.code!=='ENOENT')throw error;
 return '{}';
}));
await writeFile('data/hints.pl.json',JSON.stringify({language:'pl',samples:previousHints.samples,packs:hintPacks},null,2)+'\n');

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
 hintsVerified:hintPacks.flatMap(pack=>pack.levels).filter(level=>level.verified).length,
 solverStatuses:{},memory:[],levels:[]};
for(const pack of findings)for(const level of pack.levels)report.levels.push({campaign:pack.campaign,
 level:level.level,validationMs:level.validationMs,solution:level.status,
 hint:hintPacks.find(row=>row.campaign===pack.campaign).levels[level.level-1].verified?'verified':'unverified'});
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
  window.__debug.freezeAnimations(false);
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
    const begun=performance.now();
    const step=await page.evaluate(({level,moves,pass})=>{
     const api=window.__debug;
     if(!api.loadLevel(level))return 'load';
     if(pass==='revisit')return api.getLevelState().completed?'ok':'not marked';
     for(const move of moves)if(!api.applyMove(move))return 'move rejected';
     if(!api.isSolved())return 'unsolved';
     return api.getLevelState().completed?'ok':'not marked';
    },{level,moves,pass});
    if(step==='ok'){
     if(pass==='solve'){
      report.browserVerified++;
      const measured=report.levels.find(row=>row.campaign===campaign&&row.level===level);
      measured.browserReplayMs=Math.round(performance.now()-begun);
     const sample=await page.evaluate(()=>new Promise(resolve=>{
      requestAnimationFrame(start=>{
       let frames=0;
       function tick(end){
        if(++frames<8)requestAnimationFrame(tick);
        else resolve({theme:window.__debug.getLevelState().theme,fps:Number((8000/(end-start)).toFixed(1))});
       }
       requestAnimationFrame(tick);
      });
     }));
     Object.assign(measured,sample);
     }
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
 report.hintsVerified!==report.expected||report.browserFailures.length||report.browserErrors.length)process.exitCode=1;

function command(script,args){
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[script,...args],{stdio:'inherit'});
  child.on('error',reject);
  child.on('exit',code=>code===0?resolve():reject(Error(script+' failed: '+code)));
 });
}
