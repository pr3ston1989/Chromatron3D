/**
 * Cinematic additive laser renderer. Physical ray routing still comes exclusively
 * from src/optics.js; this module never affects puzzle mechanics.
 *
 * Three visible layers: crisp white-hot core, colored plasma sleeve and
 * crossed shader ribbons for soft volumetric scatter. Glows at interactions
 * and carefully budgeted dynamic point lights connect the beam to the world.
 */
export function renderLaserFX(THREE, parent, segments, pieces, received, palette, point) {
 const materials=new Map(), flicker=[], sparks=[];
 const activePieces=pieces.filter(p=>!p.inTray);
 const positions=new Map(activePieces.map(p=>[p.x+','+p.y,p]));
 const rayShader={
  vertexShader:`
   varying vec2 vUv;
   void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
  `,
  fragmentShader:`
   uniform vec3 uColor;
   uniform float uTime;
   varying vec2 vUv;
   void main(){
    float radial=abs(vUv.y-.5)*2.0;
    float halo=exp(-radial*radial*4.4);
    float middle=exp(-radial*radial*30.0);
    float core=exp(-radial*radial*165.0);
    float ripples=.94+.06*sin(vUv.x*37.0-uTime*7.0);
    float energy=(halo*.15+middle*.4+core*.7)*ripples;
    vec3 radiance=uColor*(halo*.34+middle*1.8+core*2.7)+vec3(.86,.96,1.0)*core*1.3;
    gl_FragColor=vec4(radiance*energy,clamp(halo*.19+middle*.47+core*.9,0.0,.94));
   }
  `
 };
 function material(mask){
  if(!materials.has(mask)){
   const mat=new THREE.ShaderMaterial({
    ...rayShader,uniforms:{uColor:{value:new THREE.Color(palette[mask])},uTime:{value:0}},
    transparent:true,depthWrite:false,side:THREE.DoubleSide,
    blending:THREE.AdditiveBlending,toneMapped:false
   });
   materials.set(mask,mat);
  }
  return materials.get(mask);
 }
 const flareData=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);
  const i=(y*64+x)*4;
  const center=Math.exp(-r*r*22),outer=Math.exp(-r*r*4.5);
  flareData[i]=255;flareData[i+1]=255;flareData[i+2]=255;
  flareData[i+3]=Math.round(255*Math.min(1,center*.75+outer*.35));
 }
 const flareTexture=new THREE.DataTexture(flareData,64,64,THREE.RGBAFormat);
 flareTexture.needsUpdate=true;
 flareTexture.colorSpace=THREE.SRGBColorSpace;
 function flare(x,y,color,scale=1){
  const m=new THREE.SpriteMaterial({
   map:flareTexture,color:new THREE.Color(palette[color]),transparent:true,
   depthWrite:false,depthTest:true,toneMapped:false,blending:THREE.AdditiveBlending
  });
  const sprite=new THREE.Sprite(m);
  sprite.position.copy(point(x,y,.69));
  sprite.scale.setScalar(scale);sprite.renderOrder=12;parent.add(sprite);
  flicker.push({sprite,scale});
 }
 // A custom quad in world-space, not a stretched opaque cylinder:
 // v is distance across the beam, u is progression along the beam.
 function ribbon(a,b,width,vertical,shader){
  const d=b.clone().sub(a),len=d.length();
  if(len<.001)return;
  const cross=vertical?new THREE.Vector3(0,1,0):new THREE.Vector3(-d.z,0,d.x).normalize();
  const side=cross.multiplyScalar(width*.5);
  const pts=[a.clone().sub(side),a.clone().add(side),b.clone().add(side),b.clone().sub(side)];
  const vertices=new Float32Array([...pts[0].toArray(),...pts[1].toArray(),...pts[2].toArray(),
     ...pts[0].toArray(),...pts[2].toArray(),...pts[3].toArray()]);
  const uvs=new Float32Array([0,0,0,1,1,1, 0,0,1,1,1,0]);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,shader);mesh.renderOrder=6;parent.add(mesh);
 }
 const whiteCore=new THREE.MeshBasicMaterial({
  color:0xf2fcff,transparent:true,opacity:.98,
  depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending
 });
 const shellMaterials=new Map();
 const coreAxis=new THREE.Vector3(0,1,0);
 for(const s of segments){
  const a=point(s.x,s.y,.53),b=point(s.nx,s.ny,.53);
  const segment=b.clone().sub(a),len=segment.length();
  if(len<.001)continue;
  if(!shellMaterials.has(s.color))shellMaterials.set(s.color,new THREE.MeshBasicMaterial({
   color:new THREE.Color(palette[s.color]),transparent:true,opacity:.8,
   depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending
  }));
  const jacket=new THREE.Mesh(new THREE.CylinderGeometry(.063,.063,len,9),shellMaterials.get(s.color));
  jacket.position.copy(a).add(b).multiplyScalar(.5);
  jacket.quaternion.setFromUnitVectors(coreAxis,segment.clone().normalize());
  jacket.renderOrder=8;parent.add(jacket);
  const core=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,len,7),whiteCore);
  core.position.copy(jacket.position);core.quaternion.copy(jacket.quaternion);
  core.renderOrder=9;parent.add(core);
  ribbon(a,b,.66,false,material(s.color));
  ribbon(a,b,.47,true,material(s.color));
 }
 const flareCells=new Set();
 function flareOnce(x,y,color,scale){
  const key=x+','+y;
  if(flareCells.has(key))return;
  flareCells.add(key);
  flare(x,y,color,scale);
 }
 let lightBudget=0;
 for(const piece of activePieces){
  if(piece.type==='laser'){
   flareOnce(piece.x,piece.y,piece.color,1.65);
   if(lightBudget++<5){
    const light=new THREE.PointLight(new THREE.Color(palette[piece.color]),14,7,2);
    light.position.copy(point(piece.x,piece.y,.85));parent.add(light);
   }
  }
 }
 for(const s of segments){
  const piece=positions.get(s.nx+','+s.ny);
  if(!piece||piece.type==='laser')continue;
  if(piece.type==='target'){
   const active=received.get(piece.id)===piece.color;
   flareOnce(piece.x,piece.y,s.color,active?2.3:.95);
   if(active&&lightBudget++<9){
    const l=new THREE.PointLight(new THREE.Color(palette[piece.color]),24,8,2);
    l.position.copy(point(piece.x,piece.y,1));parent.add(l);
   }
  }else if(piece.type!=='wall'){
   flareOnce(piece.x,piece.y,s.color,.85);
  }else{
   flareOnce(piece.x,piece.y,s.color,.6);
  }
 }
 return {
  update(seconds){
   for(const m of materials.values())m.uniforms.uTime.value=seconds;
   for(const f of flicker){
    const pulse=1+.055*Math.sin(seconds*7+f.sprite.position.x*.4);
    f.sprite.scale.setScalar(f.scale*pulse);
   }
  },
  dispose(){
   flareTexture.dispose();
   // All mesh and sprite geometries/materials are owned by the parent group
   // and disposed by disposeGroupChildren() before a new VFX pass.
  }
 };
}
