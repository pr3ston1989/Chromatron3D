/** A small batch of camera-facing particles in a landmark's local space. */
export function createScenicDrift(THREE,time,{
 count,origin,spread,travel,tint,size,length,opacity,rate
}){
 const offsets=new Float32Array(count*3),seeds=new Float32Array(count*2);
 for(let i=0;i<count;i++){
  for(let axis=0;axis<3;axis++){
   const phase=(i*(.618034+axis*.173)+axis*.277)%1;
   offsets[3*i+axis]=origin[axis]+(phase-.5)*spread[axis];
  }
  seeds[2*i]=i/count;
  seeds[2*i+1]=(i*.381966)%1;
 }
 const geometry=new THREE.InstancedBufferGeometry();
 geometry.setIndex([0,1,2,0,2,3]);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([
  -.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0
 ],3));
 geometry.setAttribute('origin',new THREE.InstancedBufferAttribute(offsets,3));
 geometry.setAttribute('seed',new THREE.InstancedBufferAttribute(seeds,2));
 geometry.instanceCount=count;
 const material=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,uniforms:{seconds:time,
   travel:{value:new THREE.Vector3(...travel)},tint:{value:new THREE.Color(tint)},
   dimensions:{value:new THREE.Vector2(size,length)},opacity:{value:opacity},rate:{value:rate}},
  vertexShader:`
   attribute vec3 origin;
   attribute vec2 seed;
   uniform float seconds,rate;
   uniform vec3 travel;
   uniform vec2 dimensions;
   varying vec2 point;
   varying float life;
   void main(){
    float age=fract(seed.x+seconds*rate*(.77+.46*seed.y));
    float curl=sin(seed.y*15.3+age*3.7);
    vec3 positionLocal=origin+age*(travel+vec3(.33*curl,0.,.22*cos(seed.y*12.+age*4.)));
    vec4 center=modelViewMatrix*vec4(positionLocal,1.);
    vec2 flow=(mat3(modelViewMatrix)*travel).xy;
    vec2 along=flow/max(length(flow),.0001);
    vec2 across=vec2(along.y,-along.x);
    vec2 extent=dimensions*(.63+.53*seed.y)*(1.+.33*age);
    center.xy+=position.x*extent.x*across+position.y*extent.y*along;
    point=position.xy*2.;
    life=smoothstep(0.,.15,age)*(1.-smoothstep(.45,1.,age));
    gl_Position=projectionMatrix*center;
   }`,
  fragmentShader:`
   varying vec2 point;
   varying float life;
   uniform vec3 tint;
   uniform float opacity;
   void main(){
    float glow=1.-smoothstep(.11,1.,length(point));
    gl_FragColor=vec4(tint,glow*life*opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const field=new THREE.Mesh(geometry,material);
 field.name='Scenic particles';
 field.frustumCulled=false;
 field.raycast=()=>{};
 return field;
}
