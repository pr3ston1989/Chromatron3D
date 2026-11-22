import {createBeamBatcher} from './beam-batching.js';
import {beamMaterial,beamSpans} from './beam-profile.js';
import {DX,DY} from './optics.js';
const flareTextureCache=new WeakMap();

/**
 * One reusable GPU lens-flare texture for the lifetime of the renderer.
 * A wheel turn updates beam geometry, not an entire new GPU texture upload.
 */
export function getLaserFlareTexture(THREE){
 const cached=flareTextureCache.get(THREE);
 if(cached)return cached;
 const flareData=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);
  const i=(y*64+x)*4;
  const center=Math.exp(-r*r*22),outer=Math.exp(-r*r*4.5);
  flareData[i]=255;flareData[i+1]=255;flareData[i+2]=255;
  flareData[i+3]=Math.round(255*Math.min(1,center*.75+outer*.35));
 }
 const flareTexture=new THREE.DataTexture(flareData,64,64,THREE.RGBAFormat);
 flareTexture.minFilter=flareTexture.magFilter=THREE.LinearFilter;
 flareTexture.needsUpdate=true;
 flareTexture.colorSpace=THREE.SRGBColorSpace;

 flareTextureCache.set(THREE,flareTexture);
 return flareTexture;
}

/**
 * Cinematic additive laser renderer. Physical ray routing still comes exclusively
 * from src/optics.js; this module never affects puzzle mechanics.
 *
 * A camera-facing filament, optical halo and diffuse deck reflection
 * separate the beam from its environment. Glows at interactions
 * and carefully budgeted dynamic point lights connect the beam to the world.
 */
export function renderLaserFX(THREE, parent, segments, pieces, received, palette, point, lightingProfile={}, boundaryHits=[]) {
 const drawnSegments=boundaryHits.length?segments.concat(boundaryHits):segments;
 const materials=new Map(), flicker=[];
 const beamBatcher=createBeamBatcher(THREE,parent);
 const activePieces=pieces.filter(p=>!p.inTray);
 const positions=new Map(activePieces.map(p=>[p.x+','+p.y,p]));
 function material(mask,layer){
  const key=mask+':'+layer;
  if(!materials.has(key))materials.set(key,beamMaterial(THREE,palette[mask],layer,lightingProfile.surfaceGlow??.22));
  return materials.get(key);
 }
 const flareTexture=getLaserFlareTexture(THREE);
 function flare(x,y,color,scale,opacity=.48,at=point(x,y,.78)){
  const m=new THREE.SpriteMaterial({
   map:flareTexture,color:new THREE.Color(palette[color]),transparent:true,
   depthWrite:false,depthTest:true,toneMapped:false,opacity,blending:THREE.AdditiveBlending
  });
  const sprite=new THREE.Sprite(m);
  sprite.position.copy(at);
  sprite.scale.setScalar(scale);sprite.renderOrder=12;parent.add(sprite);
  flicker.push({sprite,scale});
 }
 // Shader ribbons are assembled in shared GPU buffers instead of
 // allocating one mesh per ray segment. Color/layer still define materials.
 const ribbon=(a,b,width,orientation,shader,order=6)=>
  beamBatcher.addRibbon(a,b,width,orientation,shader,order);
 function trimAperture(x,y,nx,ny,a,b){
  const source=positions.get(x+','+y);
  if(source?.type!=='laser'||DX[source.rot]!==Math.sign(nx-x)||DY[source.rot]!==Math.sign(ny-y))return;
  const distance=a.distanceTo(b);
  if(distance>0)a.lerp(b,Math.min(1,.427*(lightingProfile.opticScale??1)/distance));
 }
 function ends(s){
  const a=point(s.x,s.y,.78),b=point(s.nx,s.ny,.78);
  trimAperture(s.x,s.y,s.nx,s.ny,a,b);
  trimAperture(s.nx,s.ny,s.x,s.y,b,a);
  return [a,b];
 }
 for(const s of beamSpans(drawnSegments,positions)){
  const [a,b]=ends(s);
  ribbon(a,b,.215,'camera',material(s.color,'filament'),9);
  ribbon(a,b,.68,'camera',material(s.color,'halo'),8);
  // This light is on the deck plane. Parallax separates it from the
  // suspended filament as the player lowers the camera.
  a.y=b.y=.037;
  ribbon(a,b,1.33,'horizontal',material(s.color,'floor'),5);
 }
 const laserGeometryStats=beamBatcher.flush();

 // Directional moving photons reveal how the light travels, especially with
 // several mirrors. A single GPU points draw call handles the entire board.
 const photonStarts=[],photonEnds=[],photonColors=[],photonPhases=[],photonSizes=[];
 const usedSegments=beamSpans(drawnSegments,positions,true).slice(0,120);
 for(let i=0;i<usedSegments.length;i++){
  const seg=usedSegments[i];
  const [a,b]=ends(seg);
  for(let n=0;n<2;n++){
   photonStarts.push(...a.toArray());
   photonEnds.push(...b.toArray());
   const c=new THREE.Color(palette[seg.color]);
   photonColors.push(c.r,c.g,c.b);
   photonPhases.push(((i*0.61803398875+n*.47)%1+1)%1);
   photonSizes.push(n===0?2.8:1.8);
  }
 }
 let photons=null;
 if(photonPhases.length){
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(photonStarts,3));
  geo.setAttribute('aDestination',new THREE.Float32BufferAttribute(photonEnds,3));
  geo.setAttribute('aColor',new THREE.Float32BufferAttribute(photonColors,3));
  geo.setAttribute('aPhase',new THREE.Float32BufferAttribute(photonPhases,1));
  geo.setAttribute('aSize',new THREE.Float32BufferAttribute(photonSizes,1));
  const mat=new THREE.ShaderMaterial({
   transparent:true,depthWrite:false,depthTest:true,toneMapped:false,
   blending:THREE.AdditiveBlending,
   uniforms:{uTime:{value:0}},
   vertexShader:`
    attribute vec3 aDestination;
    attribute vec3 aColor;
    attribute float aPhase;
    attribute float aSize;
    uniform float uTime;
    varying vec3 vColor;
    void main(){
     float progress=fract(uTime*2.8/max(length(aDestination-position),.5)+aPhase);
     vec3 p=mix(position,aDestination,progress);
     vec4 eye=modelViewMatrix*vec4(p,1.0);
     gl_Position=projectionMatrix*eye;
     gl_PointSize=clamp(aSize*90.0/max(1.0,-eye.z),1.5,9.5);
     vColor=aColor;
    }
   `,
   fragmentShader:`
    varying vec3 vColor;
    void main(){
     float d=length(gl_PointCoord-vec2(.5))*2.0;
     float hot=exp(-d*d*13.0);
     float haze=exp(-d*d*3.3);
     float alpha=min(1.0,.88*hot+.26*haze);
     gl_FragColor=vec4(vColor*(.61*hot+.29*haze)+vec3(.035)*hot,alpha);
    }
   `
  });
  photons=new THREE.Points(geo,mat);
  photons.renderOrder=11;
  photons.frustumCulled=false;
  parent.add(photons);
 }
 // A handful of real point lights let surrounding metallic tiles respond to
 // the laser wavelength. Bound the cost for integrated laptop GPUs.
 const maxBeamLights=Math.max(0,Math.min(4,Number.isFinite(lightingProfile.maxBeamLights)?lightingProfile.maxBeamLights:4));
 const maxOpticLights=Math.max(0,Math.min(9,Number.isFinite(lightingProfile.maxOpticLights)?lightingProfile.maxOpticLights:9));
 const glowLights=Math.min(maxBeamLights,segments.length);
 const stride=Math.max(1,Math.floor(segments.length/Math.max(1,glowLights)));
 for(let i=0;i<glowLights;i++){
  const s=segments[Math.min(segments.length-1,i*stride)];
  const l=new THREE.PointLight(new THREE.Color(palette[s.color]),5.5,4.3,2);
  l.position.copy(point(s.nx,s.ny,1.65));
  parent.add(l);
 }
 const flareCells=new Set();
 function flareOnce(x,y,color,scale,opacity){
  const key=x+','+y;
  if(flareCells.has(key))return;
  flareCells.add(key);
  flare(x,y,color,scale,opacity);
 }
 let lightBudget=0;
 for(const piece of activePieces){
  if(piece.type==='laser'){
   const muzzle=point(piece.x,piece.y,.78);
   const forward=point(piece.x+DX[piece.rot],piece.y+DY[piece.rot],.78).sub(muzzle).normalize();
   muzzle.addScaledVector(forward,.515*(lightingProfile.opticScale??1));
   flare(piece.x,piece.y,piece.color,.86,.69,muzzle);
   if(lightBudget<Math.min(5,maxOpticLights)){
    lightBudget++;
    const light=new THREE.PointLight(new THREE.Color(palette[piece.color]),3.2,4,2);
    light.position.copy(point(piece.x,piece.y,.85));parent.add(light);
   }
  }
 }
 // ── Wall-impact VFX: glow halos, point lights & GPU spark particles ──
 // Collect all wall-impact points (board edges + wall pieces)
 const impactPoints=[];
 for(const hit of boundaryHits){
  const impactPos=point(hit.nx,hit.ny,.78);
  const beamDir=new THREE.Vector3(hit.nx-hit.x,0,hit.ny-hit.y).normalize();
  impactPoints.push({pos:impactPos,dir:beamDir,color:hit.color});
  // Keep the contact on the collector legible; the field itself lights up.
  flare(hit.nx,hit.ny,hit.color,.55,.37);
  // Budget-limited point light per impact
  if(lightBudget<maxOpticLights){
   lightBudget++;
   const l=new THREE.PointLight(new THREE.Color(palette[hit.color]),4,3.4,2);
   l.position.copy(impactPos);parent.add(l);
  }
 }
 // Wall-piece impacts get the same treatment
 const litTargets=new Set();
 for(const s of segments){
  const piece=positions.get(s.nx+','+s.ny);
  if(!piece||piece.type==='laser')continue;
  if(piece.type==='target'){
   if(received.get(piece.id)!==piece.color||litTargets.has(piece.id))continue;
   litTargets.add(piece.id);
   flareOnce(piece.x,piece.y,piece.color,.54,.12);
   if(lightBudget<maxOpticLights){
    lightBudget++;
    const l=new THREE.PointLight(new THREE.Color(palette[piece.color]),5.4,5,2);
    l.position.copy(point(piece.x,piece.y,1));parent.add(l);
   }
  }else if(piece.type==='wall'){
   const impactPos=point(piece.x,piece.y,.78);
   const beamDir=new THREE.Vector3(s.nx-s.x,0,s.ny-s.y).normalize();
   impactPoints.push({pos:impactPos,dir:beamDir,color:s.color});
   flareOnce(piece.x,piece.y,s.color,1.2);
   // Bloom halo for wall-piece hits
   const key='wallbloom:'+piece.x+','+piece.y;
   if(!flareCells.has(key)){
    flareCells.add(key);
    const bloomMat=new THREE.SpriteMaterial({
     map:flareTexture,color:new THREE.Color(palette[s.color]),transparent:true,
     opacity:.28,depthWrite:false,depthTest:true,toneMapped:false,blending:THREE.AdditiveBlending
    });
    const bloom=new THREE.Sprite(bloomMat);
    bloom.position.copy(impactPos);bloom.position.y=.85;
    bloom.scale.setScalar(2.2);bloom.renderOrder=10;parent.add(bloom);
    flicker.push({sprite:bloom,scale:2.2});
   }
   if(lightBudget<maxOpticLights){
    lightBudget++;
    const l=new THREE.PointLight(new THREE.Color(palette[s.color]),8,4.5,2);
    l.position.copy(impactPos);l.position.y=1.1;parent.add(l);
   }
  }else{
   flareOnce(piece.x,piece.y,s.color,.38);
  }
 }
 // ── GPU spark particle system for all impacts ──
 let sparks=null;
 if(impactPoints.length){
  const SPARKS_PER_IMPACT=20;
  const totalSparks=impactPoints.length*SPARKS_PER_IMPACT;
  const sparkOrigins=new Float32Array(totalSparks*3);
  const sparkVelocities=new Float32Array(totalSparks*3);
  const sparkColors=new Float32Array(totalSparks*3);
  const sparkPhases=new Float32Array(totalSparks);
  const sparkLifetimes=new Float32Array(totalSparks);
  let si=0;
  for(const imp of impactPoints){
   const c=new THREE.Color(palette[imp.color]);
   // Reflect direction: sparks fly back from the wall
   const reflect=imp.dir.clone().negate();
   for(let n=0;n<SPARKS_PER_IMPACT;n++){
    const idx=si*3;
    sparkOrigins[idx]=imp.pos.x;
    sparkOrigins[idx+1]=imp.pos.y;
    sparkOrigins[idx+2]=imp.pos.z;
    // Random spray around reflected direction
    const spread=0.7+Math.random()*1.3;
    const angle=(Math.random()-.5)*Math.PI*.85;
    const upKick=0.5+Math.random()*2.0;
    sparkVelocities[idx]=reflect.x*spread+Math.sin(angle)*0.9;
    sparkVelocities[idx+1]=upKick;
    sparkVelocities[idx+2]=reflect.z*spread+Math.cos(angle)*0.9;
    sparkColors[si*3]=c.r;
    sparkColors[si*3+1]=c.g;
    sparkColors[si*3+2]=c.b;
    sparkPhases[si]=Math.random();
    sparkLifetimes[si]=0.35+Math.random()*0.55;
    si++;
   }
  }
  const sparkGeo=new THREE.BufferGeometry();
  sparkGeo.setAttribute('position',new THREE.Float32BufferAttribute(sparkOrigins,3));
  sparkGeo.setAttribute('aVelocity',new THREE.Float32BufferAttribute(sparkVelocities,3));
  sparkGeo.setAttribute('aColor',new THREE.Float32BufferAttribute(sparkColors,3));
  sparkGeo.setAttribute('aPhase',new THREE.Float32BufferAttribute(sparkPhases,1));
  sparkGeo.setAttribute('aLifetime',new THREE.Float32BufferAttribute(sparkLifetimes,1));
  const sparkMat=new THREE.ShaderMaterial({
   transparent:true,depthWrite:false,depthTest:true,toneMapped:false,
   blending:THREE.AdditiveBlending,
   uniforms:{uTime:{value:0}},
   vertexShader:`
    attribute vec3 aVelocity;
    attribute vec3 aColor;
    attribute float aPhase;
    attribute float aLifetime;
    uniform float uTime;
    varying vec3 vColor;
    varying float vAlpha;
    void main(){
     float cycle=aLifetime*1.3;
     float t=mod(uTime*0.9+aPhase*cycle,cycle);
     float life=clamp(t/aLifetime,0.0,1.0);
     // Ballistic trajectory: pos + vel*t + 0.5*gravity*t^2
     vec3 p=position+aVelocity*t+vec3(0.0,-3.8,0.0)*0.5*t*t;
     // Dampen lateral velocity over time
     p.xz=position.xz+aVelocity.xz*t*(1.0-life*0.4);
     p.y=position.y+aVelocity.y*t-3.8*0.5*t*t;
     vec4 eye=modelViewMatrix*vec4(p,1.0);
     gl_Position=projectionMatrix*eye;
     // Sparks start bright and small, grow slightly, then fade
     float sizePulse=mix(2.5,4.5,life*0.3)*smoothstep(0.0,0.05,life);
     gl_PointSize=clamp(sizePulse*65.0/max(1.0,-eye.z),1.0,8.0);
     // Hot white core fading to beam color
     vColor=mix(vec3(1.0),aColor,smoothstep(0.0,0.35,life));
     vAlpha=smoothstep(1.0,0.7,life)*smoothstep(0.0,0.04,life);
    }
   `,
   fragmentShader:`
    varying vec3 vColor;
    varying float vAlpha;
    void main(){
     float d=length(gl_PointCoord-vec2(0.5))*2.0;
     float core=exp(-d*d*16.0);
     float glow=exp(-d*d*4.0);
     float alpha=vAlpha*(0.9*core+0.35*glow);
     if(alpha<0.01)discard;
     gl_FragColor=vec4(vColor*(2.2*core+0.7*glow),alpha);
    }
   `
  });
  sparks=new THREE.Points(sparkGeo,sparkMat);
  sparks.renderOrder=13;
  sparks.frustumCulled=false;
  parent.add(sparks);
 }
 return {
  geometryStats:laserGeometryStats,
  dynamicLightCount:parent.children.filter(x=>x.isPointLight).length,
  update(seconds){
   if(photons)photons.material.uniforms.uTime.value=seconds;
   if(sparks)sparks.material.uniforms.uTime.value=seconds;
   for(const f of flicker){
    const pulse=1+.055*Math.sin(seconds*7+f.sprite.position.x*.4);
    f.sprite.scale.setScalar(f.scale*pulse);
   }
  },
  dispose(){
   // The small flare DataTexture is intentionally reused between wheel turns.
   // Temporary materials and geometries are owned/disposed by the beam group.
  }
 };
}
