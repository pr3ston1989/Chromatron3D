// The screen lies on the exact four termination planes returned by trace().
// Each row of the little contact texture describes one side in half-cell steps,
// which also covers diagonals and simultaneous hits at a corner.
export function createCollectorField(THREE, parent, {cells, tileSize, palette}){
 const half=cells*tileSize/2, slots=2*cells+1, height=1.02;
 const group=new THREE.Group();
 group.name='collector-field';
 group.visible=false;
 parent.add(group);
 const pixels=new Uint8Array(4*slots*4);
 const texture=new THREE.DataTexture(pixels,slots,4);
 texture.needsUpdate=true;
 const material=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,
  uniforms:{contacts:{value:texture},slots:{value:slots},pitch:{value:tileSize/2}},
  vertexShader:`
   attribute vec3 screenCoord;
   varying vec3 field;
   void main(){field=screenCoord;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
  `,
  fragmentShader:`
   uniform sampler2D contacts;
   uniform float slots,pitch;
   varying vec3 field;
   vec3 hit(float i){
    float d=length(vec2((field.x-i)*pitch,field.y-.78));
    return texture2D(contacts,vec2((i+.5)/slots,(field.z+.5)/4.)).rgb*
     (1.45*exp(-125.*d*d)+.66*exp(-44.*abs(d-.23)));
   }
   void main(){
    float top=1.-smoothstep(.008,.032+fwidth(field.y),abs(field.y-1.0));
    float bottom=1.-smoothstep(.01,.08,abs(field.y-.13));
    float notch=(1.-smoothstep(.035,.08,abs(fract(field.x*.5)-.5)))*(1.-smoothstep(.18,.29,field.y));
    float cell=clamp(floor(field.x),0.,slots-1.);
    vec3 light=hit(cell);
    if(cell+1.<slots)light+=hit(cell+1.);
    float energy=max(light.r,max(light.g,light.b));
    vec3 cold=vec3(.12,.44,.60);
    float ink=.067+.40*top+.12*bottom+.25*notch;
    gl_FragColor=vec4(mix(cold,light/max(energy,.001),smoothstep(.01,.42,energy)),
                      clamp(ink+energy*.93,0.,.94));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }
  `
 });
 const coords=[],vertices=[],indices=[];
 function position(side,along,y,out=0){
  const r=(side%2?1:-1)*(half+out);
  return side<2?[along,y,r]:[r,y,along];
 }
 for(let side=0;side<4;side++){
  for(const [along,y] of [[-half,0],[half,0],[half,height],[-half,height]]){
   vertices.push(...position(side,along,y));
   coords.push((along+half)/(tileSize/2),y,side);
  }
  const n=side*4;
  indices.push(n,n+1,n+2,n,n+2,n+3);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('screenCoord',new THREE.Float32BufferAttribute(coords,3));
 geometry.setIndex(indices);
 const screen=new THREE.Mesh(geometry,material);
 screen.name='collector-membrane';
 screen.renderOrder=4;group.add(screen);
 const masks=new Uint8Array(slots*4), color=new THREE.Color();
 function updateHits(hits){
  masks.fill(0);
  for(const {nx,ny,color} of hits){
   const x=Math.round((nx+.5)*2),y=Math.round((ny+.5)*2);
   if(y===0||y===slots-1)masks[(y===0?0:1)*slots+x]|=color;
   if(x===0||x===slots-1)masks[(x===0?2:3)*slots+y]|=color;
  }
  for(let i=0;i<masks.length;i++){
   color.set(masks[i]?palette[masks[i]]:0);
   pixels[4*i]=Math.round(255*color.r);pixels[4*i+1]=Math.round(255*color.g);
   pixels[4*i+2]=Math.round(255*color.b);pixels[4*i+3]=255;
  }
  texture.needsUpdate=true;
 }
 function setRail(source){
  const pose=new THREE.Object3D(), matrix=new THREE.Matrix4();
  source.updateMatrixWorld(true);
  source.traverse(node=>{
   if(!node.isMesh)return;
   const rail=new THREE.InstancedMesh(node.geometry,node.material,cells*4);
   rail.name='collector-cassettes';
   for(let side=0;side<4;side++)for(let i=0;i<cells;i++){
    pose.position.fromArray(position(side,(i-(cells-1)/2)*tileSize,0));
    pose.rotation.y=[0,Math.PI,Math.PI/2,-Math.PI/2][side];
    pose.scale.x=tileSize/1.3;
    pose.updateMatrix();rail.setMatrixAt(side*cells+i,matrix.multiplyMatrices(pose.matrix,node.matrixWorld));
   }
   rail.computeBoundingSphere();
   group.add(rail);
  });
 }
 return {group,updateHits,setRail};
}
