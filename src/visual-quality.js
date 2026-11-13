/**
 * Performance profiles for WebGL optics. Never changes solver results.
 * 'auto' is balanced initially, but reduces cost after sustained low FPS.
 */
export const QUALITY_MODES=Object.freeze(['auto','performance','balanced','cinematic']);
export const QUALITY_PROFILES=Object.freeze({
 performance:Object.freeze({pixelRatio:1,bloomStrength:.22,reflectorCount:0,reflectionSize:0,maxBeamLights:1,maxOpticLights:2,antialias:'fxaa'}),
 balanced:Object.freeze({pixelRatio:1.35,bloomStrength:.39,reflectorCount:1,reflectionSize:160,maxBeamLights:3,maxOpticLights:5,antialias:'smaa'}),
 cinematic:Object.freeze({pixelRatio:1.8,bloomStrength:.57,reflectorCount:2,reflectionSize:320,maxBeamLights:4,maxOpticLights:9,antialias:'smaa'})
});
export const normalizeQuality=value=>QUALITY_MODES.includes(value)?value:'auto';
// An entirely CPU-rendered laptop cannot afford the multi-pass Gaussian bloom.
// The laser itself remains luminous thanks to its additive core and sprites.
export const shouldUseBloom=(mode,autoLevel='balanced')=>
 (mode==='auto'?autoLevel:mode)!=='performance';
export const profileFor=(value,autoLevel='balanced')=>QUALITY_PROFILES[value==='auto'?autoLevel:value]||QUALITY_PROFILES.balanced;
/** Prefer the actively inspected mirror; otherwise prioritize whichever is on board. */
export function reflectionCandidates(pieces,selected,limit){
 if(!Number.isInteger(limit)||limit<=0)return [];
 const candidates=pieces.filter(p=>!p.inTray&&p.type==='mirror');
 if(selected&&candidates.includes(selected))return [selected,...candidates.filter(p=>p!==selected)].slice(0,limit);
 return candidates.slice(0,limit);
}
/**
 * Hysteresis requires consistently poor/good frame rates; a single
 * tab switch or delayed frame does not reduce visual quality.
 */
export function nextAutoProfile(current,lowSamples,highSamples){
 if(current==='balanced'&&lowSamples>=3)return 'performance';
 if(current==='performance'&&highSamples>=12)return 'balanced';
 return current;
}
