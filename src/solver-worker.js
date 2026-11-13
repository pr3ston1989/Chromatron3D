import {solvePuzzle} from './puzzle-solver.js';
// Runs expensive 15×15 optical searches without freezing camera animation or
// wheel input on the main thread. Worker has no access to DOM or local storage.
self.onmessage=event=>{
 const {id,level,maxChecks=60000,maxMovables=4}=event.data||{};
 try{
  const result=solvePuzzle(level,{maxChecks,maxMovables});
  self.postMessage({id,...result});
 }catch(error){
  self.postMessage({id,status:'error',solution:null,error:String(error?.message||error)});
 }
};
