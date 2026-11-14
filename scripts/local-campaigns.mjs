import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {extractChromatronExecutable} from '../src/classic-exe.js';
import {convertClassicPack} from '../src/classic-import.js';

export function readLocalCampaigns(directory){
 const packs=[];
 for(let game=1;game<=4;game++){
  const filename='chromatron'+(game===1?'':game)+'.exe';
  let bytes;
  try{bytes=readFileSync(join(directory,filename))}
  catch(error){if(error.code==='ENOENT')continue;throw error}
  const raw=extractChromatronExecutable(bytes,{game});
  if(raw.detectedGame!==game)throw Error('Unexpected game in '+filename);
  packs.push({game,levels:convertClassicPack(raw,{game})});
 }
 return packs;
}

const localAddresses=new Set(['localhost','127.0.0.1','[::1]']);
const localPeers=new Set(['127.0.0.1','::1','::ffff:127.0.0.1']);
export function localCampaignPlugin(directory){
 function install(server){
  let script;
  server.middlewares.use((req,res,next)=>{
   if(req.url?.split('?')[0]!=='/local-campaigns.js'||req.method!=='GET')return next();
   let host;
   try{host=new URL('http://'+req.headers.host).hostname}catch{return next()}
   if(!localAddresses.has(host)||!localPeers.has(req.socket.remoteAddress)||
      req.headers['sec-fetch-site']==='cross-site')return next();
   try{
    script??='globalThis.chromatronLocalCampaigns='+JSON.stringify(readLocalCampaigns(directory))+';';
    res.setHeader('Content-Type','text/javascript; charset=utf-8');
    res.setHeader('Cross-Origin-Resource-Policy','same-origin');
    res.setHeader('Cache-Control','private, no-store');
    res.end(script);
   }catch(error){next(error)}
  });
 }
 return {name:'local-chromatron-campaigns',configureServer:install,configurePreviewServer:install};
}
