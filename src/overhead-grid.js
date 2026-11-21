export function createOverheadGrid(THREE,world,{cells,tileSize}){
 const uniforms={
  cells:{value:cells},
  halfWidth:{value:.67},
  ink:{value:new THREE.Color()},
  strength:{value:0}
 };
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(cells*tileSize,cells*tileSize),new THREE.ShaderMaterial({
  uniforms,transparent:true,depthWrite:false,
  vertexShader:`
   uniform float cells;
   varying vec2 cell;
   void main(){
    cell=uv*cells;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
   }
  `,
  fragmentShader:`
   uniform float halfWidth;
   uniform vec3 ink;
   uniform float strength;
   varying vec2 cell;
   void main(){
    // Measure each seam in render pixels so distant tiles keep a readable line.
    vec2 distance=abs(fract(cell+.5)-.5)/fwidth(cell);
    vec2 coverage=1.0-smoothstep(vec2(halfWidth-.5),vec2(halfWidth+.5),distance);
    gl_FragColor=vec4(ink,max(coverage.x,coverage.y)*strength);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }
  `
 }));
 mesh.name='Overhead grid seams';
 mesh.rotation.x=-Math.PI/2;
 mesh.position.y=.025;
 mesh.visible=false;
 world.add(mesh);

 return function setOverheadGrid(visible,pixelRatio,deckInk){
  mesh.visible=visible;
  if(!visible)return;
  uniforms.halfWidth.value=Math.max(.58,.67*pixelRatio);
  uniforms.ink.value.setHex(deckInk??0x9fbfcd);
  uniforms.strength.value=deckInk===undefined?.43:.56;
 };
}
