import {loadSurfaceSample} from './panel-surface.js';

// Slopes and mineral flecks come from the Blender slate sheet already used by
// the deck. The cliff uses continuous metre-scale projections across its beds.
export function finishGrottoRock(THREE,material,surface='slate'){
 const gemstone=material.name==='Amethyst growth faces';
 const sample={value:null},ready={value:0};
 loadSurfaceSample(THREE,surface).then(texture=>{
  if(texture){sample.value=texture;ready.value=1}
 });
 material.customProgramCacheKey=()=>gemstone?'stratified-quartz':'stratified-rock';
 material.onBeforeCompile=shader=>{
  shader.uniforms.rockSample=sample;shader.uniforms.rockReady=ready;
  shader.vertexShader='varying vec3 mineralPoint; varying vec3 mineralNormal;\n'+shader.vertexShader
   .replace('#include <begin_vertex>','#include <begin_vertex>\n mineralPoint=position; mineralNormal=normal;');
  shader.fragmentShader='varying vec3 mineralPoint; varying vec3 mineralNormal; uniform sampler2D rockSample; uniform float rockReady;\n'+shader.fragmentShader
   .replace('#include <color_fragment>',`#include <color_fragment>
    vec3 a=abs(mineralNormal);
    vec2 plane=a.y>max(a.x,a.z)?mineralPoint.xz:(a.x>a.z?mineralPoint.zy:mineralPoint.xy);
    plane=mat2(.95,.31,-.31,.95)*plane*vec2(.18,.34);
    vec2 uv=1.-abs(mod(plane,2.)-1.);
    vec4 grain=textureGrad(rockSample,uv,dFdx(plane),dFdy(plane));
    float drift=.37*sin(.78*mineralPoint.x+.32*mineralPoint.z);
    float seam=abs(fract(mineralPoint.y*.62+drift+grain.r*.28)-.5);
    float mineral=(1.-smoothstep(.012,.051+fwidth(seam),seam))*smoothstep(.33,.75,grain.r);
    diffuseColor.rgb*=1.+rockReady*((grain.r-.50)*${gemstone?'.18':'.67'}+mineral*${gemstone?'.08':'.22'});
   `)
   .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    roughnessFactor=clamp(roughnessFactor+rockReady*((grain.g-.5)*.21-mineral*.17),.12,.96);`)
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    vec3 crossX=cross(dFdy(-vViewPosition),normal);
    vec3 crossY=cross(normal,dFdx(-vViewPosition));
    float area=dot(dFdx(-vViewPosition),crossX);
    vec3 gradient=crossX*dFdx(grain.r)+crossY*dFdy(grain.r);
    normal=normalize(normal-rockReady*sign(area)*${gemstone?'.003':'.012'}*gradient/max(abs(area),.000001));`);
 };
}

export function createGrottoPool(THREE){
 const material=new THREE.ShaderMaterial({
  uniforms:{seconds:{value:0}},transparent:true,depthWrite:false,
  vertexShader:`
   varying vec3 surface;
   void main(){
    vec4 point=modelMatrix*vec4(position,1.);
    surface=point.xyz;gl_Position=projectionMatrix*viewMatrix*point;
   }`,
  fragmentShader:`
   varying vec3 surface;
   uniform float seconds;
   float drip(vec2 offset,float age){
    float radius=length(offset);
    float wave=radius-age*2.3;
    float band=1.-smoothstep(.018,.09+fwidth(radius),abs(wave));
    return band*smoothstep(0.,.18,age)*(1.-smoothstep(.38,1.,age));
   }
   void main(){
    vec2 p=surface.xz;float t=seconds*.23;
    vec3 eye=normalize(cameraPosition-surface);
    float chop=sin(p.x*1.18+p.y*.58+t)+.39*sin(p.x*.48-p.y*1.54-t*.72);
    vec3 n=normalize(vec3(.019*cos(p.x*.54+p.y*.31+t)+.011*chop,1.,
                          .020*sin(p.y*1.07+t)+.012*cos(p.x*1.68-t)));
    vec3 reflected=reflect(-eye,n);
    float opening=clamp(.42+.63*reflected.z-.28*reflected.x,0.,1.);
    float fresnel=.15+.71*pow(1.-max(dot(eye,n),0.),2.);
    vec3 water=mix(vec3(.010,.029,.041),vec3(.079,.131,.179),opening*(fresnel+.15));
    float ripple=.5+.5*sin(p.y*4.3+p.x*.81+chop+t);
    float shimmer=smoothstep(.89,.99,ripple)*smoothstep(.18,.98,opening);
    water+=vec3(.013,.026,.032)*shimmer;
    // Drips from the rock shelves disturb only small patches of the surface.
    float rings=drip(p-vec2(-8.,4.),fract(seconds*.48+.37))
               +drip(p-vec2(6.,-5.),fract(seconds*.31+.76));
    water+=vec3(.012,.022,.028)*rings;
    float mist=smoothstep(32.,100.,length(p));
    water=mix(water,vec3(.049,.045,.079),mist);
    gl_FragColor=vec4(water,1.-smoothstep(78.,100.,length(p)));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const pool=new THREE.Mesh(new THREE.PlaneGeometry(202,202),material);
 pool.name='Grotto waterline';pool.rotation.x=-Math.PI/2;pool.position.y=-19.7;
 return pool;
}
