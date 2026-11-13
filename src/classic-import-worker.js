import {extractChromatronExecutable} from './classic-exe.js';
import {loadLevelBundle} from './classic-import.js';

self.onmessage=async({data:files})=>{
 try{
  const packs=[];
  for(const [i,file] of files.entries()){
   if(file.size>8_000_000)throw Error('File is too large');
   const game=Number(file.name.match(/chroma(?:tron)?[-_ ]?([1-4])/i)?.[1]||i+1);
   if(/\.exe$/i.test(file.name)){
    const raw=extractChromatronExecutable(await file.arrayBuffer(),{game});
    packs.push({game:raw.detectedGame,levels:loadLevelBundle(raw,{game:raw.detectedGame})});
   }else{
    const levels=loadLevelBundle(await file.text(),{game});
    packs.push({game:0,levels});
   }
  }
  self.postMessage({packs});
 }catch(error){self.postMessage({error:String(error.message||error)})}
};
