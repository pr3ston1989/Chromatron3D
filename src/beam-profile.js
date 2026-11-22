// The tracer works on cell edges. Render a continuous span up to the next
// instrument, gap or change of colour, including half cells at the collector.
export function beamSpans(segments, positions, directed=false){
 const edges=new Map();
 for(const s of segments){
  let {x,y,nx,ny,color}=s;
  if(!directed&&(nx<x||(nx===x&&ny<y)))[x,y,nx,ny]=[nx,ny,x,y];
  const key=[x,y,nx,ny,directed?color:0].join(',');
  if(edges.has(key))edges.get(key).color|=color;
  else edges.set(key,{x,y,nx,ny,color});
 }
 const lines=new Map();
 for(const edge of edges.values()){
  const dx=Math.sign(edge.nx-edge.x),dy=Math.sign(edge.ny-edge.y);
  const key=[dx,dy,edge.color,edge.y*dx-edge.x*dy].join(',');
  if(!lines.has(key))lines.set(key,[]);
  lines.get(key).push(edge);
 }
 const spans=[];
 for(const line of lines.values()){
  const dx=Math.sign(line[0].nx-line[0].x),dy=Math.sign(line[0].ny-line[0].y);
  line.sort((a,b)=>(a.x-b.x)*dx+(a.y-b.y)*dy);
  let previous;
  for(const edge of line){
   if(previous&&previous.nx===edge.x&&previous.ny===edge.y&&!positions.has(edge.x+','+edge.y)){
    previous.nx=edge.nx;previous.ny=edge.ny;
   }else{
    previous=edge;spans.push(edge);
   }
  }
 }
 return spans;
}

const flatVertex=`
 varying vec2 vUv;
 void main(){
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
 }`;
const facingVertex=`
 attribute vec4 beamAxis;
 varying vec2 vUv;
 void main(){
  vUv=uv;
  vec4 eye=modelViewMatrix*vec4(position,1.);
  vec3 axis=normalize(mat3(modelViewMatrix)*beamAxis.xyz);
  vec3 across=cross(axis,normalize(eye.xyz));
  eye.xyz+=across/max(length(across),.0001)*(uv.y-.5)*beamAxis.w;
  gl_Position=projectionMatrix*eye;
 }`;

// Integrate the filament over the approximate pixel footprint. A thin,
// high-radiance centre and a broader coloured sheath survive minification.
const filament=`
 uniform vec3 uColor;
 varying vec2 vUv;
 void main(){
  float r=2.*vUv.y-1.;
  float footprint=fwidth(r);
  float variance=.021+footprint*footprint/6.;
  float hot=sqrt(.021/variance)*exp(-r*r/variance);
  float sheath=exp(-r*r*4.5);
  float opacity=(1.-smoothstep(.74,1.,abs(r)))*min(1.,1.7*sheath);
  vec3 radiance=uColor*(1.03+1.65*hot)+vec3(.56)*hot;
  gl_FragColor=vec4(radiance,opacity);
 }`;
const scatter=`
 uniform vec3 uColor;
 uniform float uStrength;
 varying vec2 vUv;
 void main(){
  float r=2.*vUv.y-1.;
  float light=exp(-5.*r*r)*(1.-smoothstep(.73,1.,abs(r)));
  gl_FragColor=vec4(uColor,uStrength*light);
 }`;

export function beamMaterial(THREE,color,layer,surfaceGlow){
 const core=layer==='filament',floor=layer==='floor';
 const spectrum=new THREE.Color(color);
 // White carries substantially more luminance than a single primary.
 // Keep its halo from swallowing adjacent optics on a mixed-light bench.
 const luminance=.2126*spectrum.r+.7152*spectrum.g+.0722*spectrum.b;
 const scatterPower=(floor?surfaceGlow:.77)/(1.+.96*luminance);
 return new THREE.ShaderMaterial({
  uniforms:{uColor:{value:spectrum},uStrength:{value:scatterPower}},
  vertexShader:floor?flatVertex:facingVertex,fragmentShader:core?filament:scatter,
  transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,forceSinglePass:true,
  blending:core?THREE.NormalBlending:THREE.AdditiveBlending
 });
}
