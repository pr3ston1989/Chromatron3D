/**
 * Level access is independent from the ray solver and the visual scene.
 * Solving a puzzle or using an explicitly purchased skip unlocks the next.
 * Existing achievements always remain replayable. A one-time access floor
 * preserves access to levels previously visited before the atlas existed.
 */
export function buildLevelAtlas(count,solved=[],skipped=[],accessFloor=0){
 if(!Number.isInteger(count)||count<1||count>250)
  throw new RangeError('Level pack must contain 1–250 puzzles');
 const valid=value=>Number.isInteger(value)&&value>=0&&value<count;
 const completed=new Set(Array.isArray(solved)?solved.filter(valid):[]);
 const passed=new Set(Array.isArray(skipped)?skipped.filter(valid):[]);
 const safeFloor=Number.isInteger(accessFloor)?
  Math.min(count-1,Math.max(0,accessFloor)):0;
 let furthest=safeFloor;
 for(const index of completed)furthest=Math.max(furthest,Math.min(count-1,index+1));
 for(const index of passed)furthest=Math.max(furthest,Math.min(count-1,index+1));
 const entries=Array.from({length:count},(_,index)=>{
  const status=completed.has(index)?'solved':
   passed.has(index)?'skipped':index<=furthest?'available':'locked';
  return {index,status,unlocked:status!=='locked'};
 });
 return {
  entries,total:count,solvedCount:entries.filter(e=>e.status==='solved').length,
  skippedCount:entries.filter(e=>e.status==='skipped').length,
  unlockedCount:entries.filter(e=>e.unlocked).length
 };
}
