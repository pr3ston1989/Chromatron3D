import {mkdir, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {parseArgs} from 'node:util';
import {createServer} from 'vite';
import {launchChromium} from './capture-browser.mjs';
import {DEMO_SOLUTIONS} from '../src/levels.js';

const {values: options} = parseArgs({options:{
  campaign:{type:'string',default:'demo'},
  levels:{type:'string',default:'1,3,6,8'},
  sizes:{type:'string',default:'1920x1080,390x844'},
  backend:{type:'string',default:'swiftshader'},
  quality:{type:'string',default:'performance'},
  themes:{type:'string'},
  'pilot-off':{type:'boolean',default:false},
  'solved-demo':{type:'boolean',default:false},
  'sample-ms':{type:'string',default:'4000'},
  'warmup-ms':{type:'string',default:'0'},
  out:{type:'string'},
  headed:{type:'boolean',default:false}
}});
const themes=options.themes?.split(',');
const levels=options.levels.split(',').map(Number);
const viewports=options.sizes.split(',').map(size=>{
  const [width,height]=size.split('x').map(Number);
  return {width,height};
});
const millis=Number(options['sample-ms']);
const warmup=Number(options['warmup-ms']);
if(!/^(demo|classic[1-4])$/.test(options.campaign)||
   !['swiftshader','native'].includes(options.backend)||
   options['solved-demo']&&(options.campaign!=='demo'||levels.some(n=>!DEMO_SOLUTIONS[n-1]))||
   !['auto','performance','balanced','cinematic'].includes(options.quality)||
   levels.some(n=>!Number.isInteger(n)||n<1)||
   viewports.some(v=>Object.values(v).some(n=>!Number.isInteger(n)||n<240||n>5000))||
   themes&&themes.length!==levels.length||
   !Number.isFinite(millis)||millis<2000||millis>30000||
   !Number.isFinite(warmup)||warmup<0||warmup>60000)
  throw Error('Invalid capture options');

const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw'}).format(new Date());
const output=resolve(options.out||join('screenshots',day));
await mkdir(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:4412},logLevel:'error'});
let browser;
const entries=[],browserMessages=[];
try{
  await server.listen();
  const address=server.httpServer.address();
  browser=await launchChromium(options);
  for(const viewport of viewports){
    const mobile=viewport.width<=600;
    const context=await browser.newContext({viewport,deviceScaleFactor:1,locale:'pl-PL',
      isMobile:mobile,hasTouch:mobile});
    const page=await context.newPage();
    const messages=[];
    browserMessages.push({viewport,messages});
    page.on('pageerror',error=>messages.push({type:'pageerror',message:error.message}));
    page.on('console',msg=>{
      if(msg.type()==='warning'||msg.type()==='error')
        messages.push({type:msg.type(),message:msg.text(),url:msg.location().url});
    });
    page.on('requestfailed',request=>messages.push({type:'requestfailed',url:request.url(),
      message:request.failure()?.errorText}));
    const startup=performance.now();
    const query=options['pilot-off']?'debug=1&pilot=0':'debug=1';
    await page.goto(`http://127.0.0.1:${address.port}/?${query}`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>Boolean(window.__debug),{},{timeout:30000});
    const startupMs=Math.round(performance.now()-startup);
    await page.evaluate(({campaign,quality})=>{
      const api=window.__debug;
      if(api.getLevelState().campaign!==campaign&&!api.switchCampaign(campaign))
        throw Error('Campaign unavailable: '+campaign);
      const control=document.querySelector('#graphics-quality');
      control.value=quality;
      control.dispatchEvent(new Event('change'));
    },options);
    for(const [i,level] of levels.entries()){
      const messageStart=i===0?0:messages.length;
      await page.evaluate(({level,theme})=>{
        const api=window.__debug;
        api.freezeAnimations(false);
        if(!api.setTheme(theme??null)||!api.loadLevel(level))throw Error('Invalid level or theme');
      },{level,theme:themes?.[i]});
      await page.waitForLoadState('networkidle',{timeout:30000});
      await page.waitForFunction(()=>{
        const state=window.__debug.getLevelState();
        return state.pilotStatus===null||['ready','error'].includes(state.pilotStatus);
      },{},{timeout:30000});
      if(await page.evaluate(()=>window.__debug.getLevelState().pilotStatus==='error'))
        throw Error('Could not load the pilot models');
      if(options['solved-demo']){
        const solved=await page.evaluate(moves=>{
          const api=window.__debug;
          for(const move of moves)api.applyMove(move);
          return api.isSolved();
        },DEMO_SOLUTIONS[level-1]);
        if(!solved)throw Error('The demo solution did not complete the level');
        await page.locator('#win').waitFor({state:'visible'});
        await page.keyboard.press('Escape');
      }
      if(warmup)await page.waitForTimeout(warmup);
      const measurement=await page.evaluate(ms=>new Promise(done=>{
        let first,previous;
        const frameMs=[];
        function sample(time){
          first??=time;
          if(previous!==undefined)frameMs.push(time-previous);
          previous=time;
          if(time-first>=ms){
            const ordered=[...frameMs].sort((a,b)=>a-b);
            done({stats:window.__debug.getStats(),sample:{
              frames:frameMs.length,elapsedMs:Math.round(time-first),
              fps:Number((1000*frameMs.length/(time-first)).toFixed(2)),
              medianFrameMs:Math.round(ordered[Math.floor(ordered.length/2)]),
              p95FrameMs:Math.round(ordered[Math.floor((ordered.length-1)*.95)])
            }});
          }else requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      }),millis);
      await page.evaluate(()=>window.__debug.freezeAnimations(true));
      const {theme}=await page.evaluate(()=>window.__debug.getLevelState());
      const file=`${options.campaign}-${String(level).padStart(3,'0')}_${viewport.width}x${viewport.height}.png`;
      await page.screenshot({path:join(output,file),timeout:40000,animations:'disabled'});
      entries.push({file,campaign:options.campaign,level,theme,viewport,startupMs,...measurement,
        messages:messages.slice(messageStart)});
      console.log(`${file}  ${theme}  ${measurement.sample.fps} FPS  ${measurement.stats.backend}`);
    }
    await context.close();
  }
} finally {
  await browser?.close();
  await server.close();
  await writeFile(join(output,'capture.json'),JSON.stringify({backend:options.backend,
    headed:options.headed,pilotDisabled:options['pilot-off'],solvedDemo:options['solved-demo'],
    requestedQuality:options.quality,warmupMs:warmup,entries,browserMessages},null,2)+'\n');
}
if(entries.some(entry=>entry.messages.some(msg=>msg.type==='error'||msg.type==='pageerror')))
  process.exitCode=1;
