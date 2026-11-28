const iceBands=`
  float layer=landmarkPoint.y-.18*sin(landmarkPoint.x*.51)-.073*landmarkPoint.z;
  float veins=abs(fract(layer*1.13+.068*sin(landmarkPoint.x*2.1))-.5);
  float seam=1.-smoothstep(.024,.083+fwidth(veins),veins);
  float density=.56+.44*sin(landmarkPoint.x*.84+landmarkPoint.z*.92+2.8*layer);
  diffuseColor.rgb*=.82+.17*density;
  diffuseColor.rgb+=vec3(.019,.058,.088)*seam*density;
`;

const finishes={
 'Heliostat coated glass':`
  float glint=exp(-5.2*abs(landmarkPoint.y-.41*landmarkPoint.x-4.59-.13*sin(landmarkTime*.29)));
  diffuseColor.rgb*=.87+.13*smoothstep(-1.4,1.8,landmarkPoint.x);
  diffuseColor.rgb+=vec3(.082,.137,.119)*glint;
 `,
 'Meridian fractured filter':`
  float catchlight=exp(-10.*abs(landmarkPoint.y+.51*landmarkPoint.x-4.41));
  diffuseColor.rgb+=vec3(.040,.081,.099)*catchlight;
 `,
 'Foundry flowing metal':`
  float roll=sin(landmarkPoint.x*8.1+landmarkPoint.z*4.4-landmarkTime*1.72);
  float crust=sin(landmarkPoint.z*12.9+roll*.93+landmarkTime*.84);
  float heat=smoothstep(.07,.78,roll*.52+crust*.48);
  diffuseColor.rgb=diffuseColor.rgb*(.66+.42*heat)+vec3(.24,.076,.008)*heat;
 `,
 'Spillway molten glass':`
  float distanceAlongFall=landmarkPoint.z*.61-landmarkPoint.y;
  float ripples=sin(distanceAlongFall*5.8-landmarkTime*3.9+1.25*sin(landmarkPoint.x*4.7));
  float seams=sin(landmarkPoint.x*18.+ripples*.94+landmarkPoint.y*.57);
  float flow=smoothstep(.20,.91,.57*seams+.43*ripples);
  diffuseColor.rgb=diffuseColor.rgb*(.31+.69*flow)+vec3(.64,.19,.014)*flow;
 `,
 'Glacier compressed blue ice':iceBands,
 'Glacier clear fracture':iceBands,
 'Heated polar glazing':`
  vec2 panel=landmarkPoint.xy;
  float ridge=panel.y-.22*sin(panel.x*.75)-3.01-.034*sin(landmarkTime*.56);
  float reflection=exp(-10.*abs(ridge));
  diffuseColor.rgb+=vec3(.066,.119,.143)*reflection;
 `,
 'Bathyal coated glass':`
  vec2 face=landmarkPoint.xy;
  float diagonal=face.y-.36*face.x-3.04;
  float reflected=exp(-9.*abs(diagonal-.07*sin(landmarkTime*.48)));
  diffuseColor.rgb+=vec3(.063,.139,.165)*reflected;
 `,
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
 if(material.name==='Garden running water'||material.name==='Spillway molten glass')material.side=THREE.DoubleSide;
 material.customProgramCacheKey=()=>material.name;
 material.onBeforeCompile=shader=>{
  shader.uniforms.landmarkTime=time;
  shader.vertexShader='varying vec3 landmarkPoint;\n'+shader.vertexShader.replace(
   '#include <begin_vertex>','#include <begin_vertex>\n landmarkPoint=position;');
  shader.fragmentShader='varying vec3 landmarkPoint; uniform float landmarkTime;\n'+shader.fragmentShader.replace(
   '#include <color_fragment>','#include <color_fragment>\n'+finish);
  if(material.name==='Spillway molten glass')shader.fragmentShader=shader.fragmentShader.replace(
   '#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance*=.26+.74*flow;');
 };
 return true;
}

// Origins correspond to the two high chimneys in the Blender reef, in Y-up.
const ventMouths=[[-1.67,5.00,-.71],[2.14,4.52,-1.52]];

export function createVentPlumes(THREE,time){
 const origins=[],phases=[];
 for(const [i,origin] of ventMouths.entries()){
  for(let j=0;j<10;j++){
   origins.push(...origin);
   phases.push(j/10,((j*7+i*3)%11)/11);
  }
 }
 const geometry=new THREE.InstancedBufferGeometry();
 geometry.setIndex([0,1,2,0,2,3]);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([
  -.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0
 ],3));
 geometry.setAttribute('vent',new THREE.InstancedBufferAttribute(new Float32Array(origins),3));
 geometry.setAttribute('phase',new THREE.InstancedBufferAttribute(new Float32Array(phases),2));
 geometry.instanceCount=phases.length/2;
 const material=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,uniforms:{seconds:time},
  vertexShader:`
   attribute vec3 vent;
   attribute vec2 phase;
   uniform float seconds;
   varying vec2 sprite;
   varying float fade,pattern;
   void main(){
    float age=fract(phase.x+seconds*(.22+.08*phase.y));
    float drift=sin(19.*phase.y+2.7*age);
    vec3 point=vent+vec3(.35*age+.17*drift*age,.11+1.04*age,(phase.y-.5)*.43*age);
    vec4 center=modelViewMatrix*vec4(point,1.);
    float size=(.27+.64*age)*length(modelMatrix[0].xyz);
    center.xy+=position.xy*vec2(size,size*1.16);
    sprite=position.xy*2.;
    fade=smoothstep(0.,.18,age)*(1.-smoothstep(.35,1.,age));
    pattern=phase.y;
    gl_Position=projectionMatrix*center;
   }`,
  fragmentShader:`
   varying vec2 sprite;
   varying float fade,pattern;
   void main(){
    float fringe=length(sprite)+.09*sin(7.3*sprite.x+4.2*sprite.y+pattern*18.);
    float veil=1.-smoothstep(.18,.98,fringe);
    gl_FragColor=vec4(.20,.38,.39,.22*veil*fade);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const plumes=new THREE.Mesh(geometry,material);
 plumes.name='Hydrothermal plumes';
 plumes.frustumCulled=false;
 return plumes;
}
