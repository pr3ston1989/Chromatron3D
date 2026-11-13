import {loc,t} from './i18n.js';
export const MAX_HINTS=3;
export const clampHints=n=>Math.min(3,Math.max(0,Math.trunc(Number(n)||0)));
export function hintFor(level,lang,count){
 const step=clampHints(count);
 if(!step)return null;
 const entry=level?.hints?.[step-1];
 const body=loc(entry,lang)||t(lang,'hintFallback'+step);
 const focus=step>=2&&level?.hintFocus ? level.hintFocus:null;
 return {step,label:t(lang,'hintType'+step),body,focus,
   canSkip:step===MAX_HINTS};
}
export const nextHint=n=>Math.min(MAX_HINTS,clampHints(n)+1);
/** Persist only disclosure progress: hints should never alter the puzzle or mark it solved. */
export function progressKey(index){return 'chromatron-reborn-hints-'+index;}
