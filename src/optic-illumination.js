import {DX,DY} from './optics.js';

// Two RGBA texels per cell hold the RGB masks of its eight half-rays.
// Entry and exit colours can differ across the same filter. The optical
// surfaces sample this shared map in the ordinary material pass.
export function createOpticIllumination(THREE,cells,pitch){
 const bytes=new Uint8Array(cells*cells*8);
 const map=new THREE.DataTexture(bytes,cells*2,cells);
 map.magFilter=map.minFilter=THREE.NearestFilter;
 map.needsUpdate=true;
 const uniforms={opticRays:{value:map},opticGrid:{value:new THREE.Vector2(cells,pitch)}};
 const treated=new WeakSet();
 function update(segments,boundary){
  bytes.fill(0);
  function record(x,y,dir,mask){bytes[(y*cells+x)*8+dir]|=mask}
  for(const group of [segments,boundary]){
   for(const s of group){
    const x=Math.sign(s.nx-s.x),y=Math.sign(s.ny-s.y);
    const dir=DX.findIndex((dx,i)=>dx===x&&DY[i]===y);
    if(dir<0)continue;
    record(s.x,s.y,dir,s.color);
    if(group===segments)record(s.nx,s.ny,(dir+4)%8,s.color);
   }
  }
  map.needsUpdate=true;
 }
 function apply(material){
  if(treated.has(material))return;
  treated.add(material);
  const previous=material.onBeforeCompile;
  const cacheKey=material.customProgramCacheKey();
  material.customProgramCacheKey=()=>cacheKey+'|optic-entry-exit';
  material.onBeforeCompile=function(shader,renderer){
   previous.call(this,shader,renderer);
   Object.assign(shader.uniforms,uniforms);
   shader.vertexShader='varying vec3 beamSurface;\n'+shader.vertexShader
    .replace('void main() {','void main() {\n beamSurface=(modelMatrix*vec4(position,1.)).xyz;');
   shader.fragmentShader=`
    varying vec3 beamSurface;
    uniform sampler2D opticRays;
    uniform vec2 opticGrid;
    vec3 surfaceContact(){
     vec2 cell=floor(beamSurface.xz/opticGrid.y+.5);
     vec2 local=beamSurface.xz-cell*opticGrid.y;
     vec2 texel=cell+floor(opticGrid.x*.5);
     vec4 lo=floor(texture2D(opticRays,(texel+vec2(.25,.5))/opticGrid.x)*255.+.5);
     vec4 hi=floor(texture2D(opticRays,(texel+vec2(.75,.5))/opticGrid.x)*255.+.5);
     vec4 axis=vec4(-local.y,(local.x-local.y)*.707107,local.x,(local.x+local.y)*.707107);
     vec4 side=axis.zwxy;
     vec4 mask=mix(hi,lo,step(vec4(0.),axis));
     float height=beamSurface.y-.78;
     vec4 d=side*side+height*height;
     vec4 light=.95*exp(-d*500.)+.23*exp(-d*65.);
     return vec3(dot(light,mod(mask,2.)),dot(light,mod(floor(mask*.5),2.)),
                 dot(light,mod(floor(mask*.25),2.)));
    }
   `+shader.fragmentShader.replace('#include <tonemapping_fragment>',
     'gl_FragColor.rgb+=surfaceContact();\n #include <tonemapping_fragment>');
  };
 }
 return {update,apply,map};
}
