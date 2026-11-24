const finishes={
 'Garden running water':`
  vec2 water=landmarkPoint.xz;
  float wave=sin(water.x*7.2-landmarkTime*1.12+1.4*sin(water.y*8.5));
  float curl=sin(water.y*15.4+water.x*4.1-landmarkTime*.81);
  float ripple=wave*.57+curl*.43;
  float crest=smoothstep(.62,.98,ripple);
  vec3 waterNormal=normalize(cross(dFdx(landmarkPoint),dFdy(landmarkPoint)));
  float spill=(1.-smoothstep(.4,.82,abs(waterNormal.y)))*smoothstep(.27,.85,ripple);
  diffuseColor.rgb=diffuseColor.rgb*(.85+.12*ripple)+vec3(.030,.071,.056)*crest;
  diffuseColor.rgb+=vec3(.216,.263,.196)*spill;
 `,
 'Sanctuary active lens':`
  vec2 radial=vec2(landmarkPoint.x,landmarkPoint.y-4.09);
  float distanceFromAxis=length(radial);
  float edge=smoothstep(.73,1.42,distanceFromAxis);
  float coat=sin(distanceFromAxis*12.-landmarkTime*.42)*edge;
  float streak=exp(-5.1*abs(radial.y-.38*radial.x-.48-.09*sin(landmarkTime*.36)));
  diffuseColor.rgb*=.65+.20*edge+.10*coat;
  diffuseColor.rgb+=vec3(.040,.083,.112)*streak*(.52+.48*smoothstep(-1.,1.,radial.x));
 `
};

// The visible shapes and base PBR materials come from Blender. A shared
// time uniform drives the water and the lens finish for each loaded scene.
export function applyLandmarkFinish(THREE,material,time){
 const finish=finishes[material.name];
 if(!finish)return false;
 if(material.name==='Garden running water')material.side=THREE.DoubleSide;
 material.customProgramCacheKey=()=>material.name;
 material.onBeforeCompile=shader=>{
  shader.uniforms.landmarkTime=time;
  shader.vertexShader='varying vec3 landmarkPoint;\n'+shader.vertexShader.replace(
   '#include <begin_vertex>','#include <begin_vertex>\n landmarkPoint=position;');
  shader.fragmentShader='varying vec3 landmarkPoint; uniform float landmarkTime;\n'+shader.fragmentShader.replace(
   '#include <color_fragment>','#include <color_fragment>\n'+finish);
 };
 return true;
}
