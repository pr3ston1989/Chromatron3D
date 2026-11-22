// One quad at the sky's depth. Its trajectory is fixed among the stars at
// ignition, so turning the camera during a pass reveals another part of the sky.
export function createSkyMeteor(THREE,scene,seed){
 const start=new THREE.Vector3(),flight=new THREE.Vector3();
 const uniforms={
  head:{value:new THREE.Vector3()},wake:{value:new THREE.Vector3()},
  across:{value:new THREE.Vector3()},aspect:{value:1},intensity:{value:0}
 };
 const material=new THREE.ShaderMaterial({
  uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  blending:THREE.AdditiveBlending,forceSinglePass:true,
  vertexShader:`
   uniform vec3 head,wake,across;
   varying vec2 streak;
   void main(){
    streak=vec2(mix(-1.,.16,uv.x),uv.y*2.-1.);
    vec3 direction=head+wake*streak.x+across*streak.y;
    gl_Position=projectionMatrix*vec4(mat3(viewMatrix)*direction,1.);
    gl_Position.z=gl_Position.w;
   }`,
  fragmentShader:`
   uniform float aspect,intensity;
   varying vec2 streak;
   void main(){
    float age=clamp(-streak.x,0.,1.);
    float width=.075+.36*age;
    float y=streak.y-.14*age*sin(age*7.);
    float afterglow=exp(-3.1*y*y/(width*width))*(1.-smoothstep(0.,1.,age))
                    *(1.-smoothstep(-.015,.01,streak.x));
    vec2 p=vec2(streak.x*aspect,streak.y);
    float nucleus=exp(-dot(p,p)*14.);
    float halo=exp(-dot(p,p)*2.8);
    vec2 chip=vec2((streak.x+.21)*aspect,streak.y-.20);
    float ember=exp(-dot(chip,chip)*36.);
    vec3 trail=mix(vec3(1.05,.61,.27),vec3(.31,.41,.66),smoothstep(.12,.83,age));
    vec3 light=trail*afterglow+vec3(2.8,2.38,1.77)*nucleus+
               vec3(.43,.29,.18)*halo+vec3(1.,.54,.22)*ember;
    gl_FragColor=vec4(light,intensity);
    #include <colorspace_fragment>
   }`
 });
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
 mesh.name='Sky meteor';mesh.frustumCulled=false;mesh.visible=false;mesh.renderOrder=-90;
 scene.add(mesh);

 let wait=6,age=0,duration=0,state=seed>>>0,first=true;
 function random(){
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  return state/4294967296;
 }
 function ignite(camera){
  const sign=first||random()<.5?1:-1;
  first=false;
  const x=sign*(-.54+random()*.23),y=.77+random()*.055;
  start.set(x,y,.5).unproject(camera).sub(camera.position).normalize();
  flight.set(x+sign*(.72+random()*.23),y-.15-random()*.08,.5)
   .unproject(camera).sub(camera.position).normalize();
  uniforms.across.value.crossVectors(start,flight).normalize().multiplyScalar(.0055);
  flight.sub(start);
  duration=1.30+random()*.38;
  age=0;mesh.visible=true;
 }
 function update(dt,enabled,camera){
  if(!enabled){mesh.visible=false;wait=6;first=true;return}
  if(!mesh.visible){
   wait-=dt;
   if(wait>0)return;
   ignite(camera);
  }
  age+=dt;
  if(age>=duration){
   mesh.visible=false;wait=20+random()*20;return;
  }
  const phase=age/duration;
  uniforms.head.value.copy(start).addScaledVector(flight,phase);
  uniforms.wake.value.copy(flight).multiplyScalar(Math.min(.25,.015+phase));
  uniforms.aspect.value=uniforms.wake.value.length()/.0055;
  uniforms.intensity.value=THREE.MathUtils.smoothstep(phase,0,.14)*
                            (1-THREE.MathUtils.smoothstep(phase,.73,1));
 }
 return {update,mesh};
}
