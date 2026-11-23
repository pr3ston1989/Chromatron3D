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
 function apply(material,{prism=false}={}){
  if(treated.has(material))return;
  treated.add(material);
  const previous=material.onBeforeCompile;
  const cacheKey=material.customProgramCacheKey();
  material.customProgramCacheKey=()=>cacheKey+'|optic-entry-exit'+(prism?'|prism':'');
  material.onBeforeCompile=function(shader,renderer){
   previous.call(this,shader,renderer);
   Object.assign(shader.uniforms,uniforms);
   const varyings='varying vec3 beamSurface;\n'+(prism?'varying vec2 prismAxis;\n':'');
   shader.vertexShader=varyings+shader.vertexShader
    .replace('void main() {','void main() {\n beamSurface=(modelMatrix*vec4(position,1.)).xyz;'+
     (prism?'\n prismAxis=modelMatrix[0].xz;':''));
   shader.fragmentShader=varyings+`
    uniform sampler2D opticRays;
    uniform vec2 opticGrid;
    vec3 lightAt(vec2 local,float height,vec4 lo,vec4 hi){
     vec4 axis=vec4(-local.y,(local.x-local.y)*.707107,local.x,(local.x+local.y)*.707107);
     vec4 side=axis.zwxy;
     vec4 mask=mix(hi,lo,step(vec4(0.),axis));
     vec4 d=side*side+height*height;
     vec4 light=.95*exp(-d*500.)+.23*exp(-d*65.);
     return vec3(dot(light,mod(mask,2.)),dot(light,mod(floor(mask*.5),2.)),
                 dot(light,mod(floor(mask*.25),2.)));
    }
    vec3 surfaceContact(){
     vec2 cell=floor(beamSurface.xz/opticGrid.y+.5);
     vec2 local=beamSurface.xz-cell*opticGrid.y;
     vec2 texel=cell+floor(opticGrid.x*.5);
     vec4 lo=floor(texture2D(opticRays,(texel+vec2(.25,.5))/opticGrid.x)*255.+.5);
     vec4 hi=floor(texture2D(opticRays,(texel+vec2(.75,.5))/opticGrid.x)*255.+.5);
     float height=beamSurface.y-.78;
     vec3 contact=lightAt(local,height,lo,hi);
     ${prism?`
     // Follow the refracted viewing ray to the actual beam plane. Restrict
     // scattering to the interior of the three polished windows at that height.
     vec3 incident=normalize(beamSurface-cameraPosition);
     vec3 facet=normalize(cross(dFdx(beamSurface),dFdy(beamSurface)));
     vec3 inside=refract(incident,faceforward(facet,incident,facet),.65);
     if(abs(inside.y)<.001)return contact;
     float travel=-height/inside.y;
     if(travel<=0.||travel>1.)return contact;
     vec2 probe=local+inside.xz*travel;
     vec2 p=vec2(dot(probe,prismAxis),dot(probe,vec2(-prismAxis.y,prismAxis.x)))/dot(prismAxis,prismAxis);
     float margin=min(min(p.x+.329,.474-p.x),.2212-dot(vec2(p.x,abs(p.y)),vec2(.385,.743)));
     margin=min(margin,.496-dot(vec2(p.x,abs(p.y)),vec2(-.724,.690)));
     contact+=lightAt(probe,0.,lo,hi)*smoothstep(0.,.034,margin)*(.78*exp(-travel*1.45));
     `:''}
     return contact;
    }
   `+shader.fragmentShader.replace('#include <tonemapping_fragment>',
     'gl_FragColor.rgb+=surfaceContact();\n #include <tonemapping_fragment>');
  };
 }
 return {update,apply,map};
}
