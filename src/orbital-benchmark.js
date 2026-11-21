import {validateLevels} from './levels.js';

export const [orbitalLevel]=validateLevels([{
 title:{pl:'Węzeł Keplera',en:'Kepler Junction'},
 description:{pl:'Rozdziel turkusową wiązkę między dwa rezonatory, utrzymując oba filtry pod napięciem.',en:'Split the cyan beam between two receivers while keeping both filters powered.'},
 pieces:[
  ['laser',2,9,2,7],['splitter',6,9,1,0],['filter',10,9,0,1],['target',13,9,0,1],
  ['filter',6,5,2,2],['target',6,2,0,2],['laser',12,2,4,6],['target',12,12,0,6],
  ['target',9,3,0,6],['splitter',3,12,0,0],['mirror',3,13,0,0]
 ],
 hints:[
  {pl:'Zostaw zasilone filtry na miejscu. Turkusowy laser już trafia do jednego celu. Poszukaj miejsca, z którego jego druga gałąź może dojść pod drugi turkusowy rezonator.',en:'Leave the live filters in place. Cyan already reaches one receiver. Find a point where a second branch could pass underneath the other cyan receiver.'},
  {pl:'Skieruj boczną gałąź turkusowej wiązki w lewo. Gdy znajdzie się w kolumnie drugiego turkusowego rezonatora, odbij ją w górę.',en:'Send the side branch of cyan light left. Once it is in the column of the second cyan receiver, turn it upward.'},
  {pl:'Rozdziel turkus na przecięciu jego trasy z rzędem 7. Lustro na tym samym rzędzie zawróci światło ku górnemu odbiornikowi.',en:'Split cyan where its path crosses row 7. A mirror on the same row can turn the light toward the upper receiver.'}
 ],
 solution:[{index:1,x:6,y:9,rot:1},{index:2,x:10,y:9,rot:0},{index:4,x:6,y:5,rot:2},
           {index:9,x:12,y:6,rot:1},{index:10,x:9,y:6,rot:3}]
}]);
// This authored starting rack is private to the pilot. Imported packs retain their own layout.
orbitalLevel.trayIndices=[9,10];

export const orbitalArt={
 id:'kepler',pl:'Stacja orbitalna',en:'Orbital Station',legacyId:'orbital',deck:'kepler',
 key:0xe4eeff,fog:0x192e4f,accent:0x82d7ff,edge:0x82d7ff,glow:.18
};

function orbitalSky(THREE){
 const material=new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,
  vertexShader:`
   varying vec3 direction;
   void main(){
    direction=position;
    gl_Position=projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.);
    gl_Position.z=gl_Position.w;
   }`,
  fragmentShader:`
   varying vec3 direction;
   float hash(vec3 p){
    p=fract(p*.1031);p+=dot(p,p.yzx+33.33);
    return fract((p.x+p.y)*p.z);
   }
   float noise3(vec3 v){
    vec3 i=floor(v),f=fract(v);f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                   mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                   mix(hash(i+vec3(0,1,1)),hash(i+vec3(1)),f.x),f.y),f.z);
   }
   float terrain(vec3 p){
    return .54*noise3(p)+.27*noise3(p*2.04+9.)+.13*noise3(p*4.13-7.)+.06*noise3(p*8.39);
   }
   void main(){
    vec3 ray=normalize(direction);
    vec2 uv=vec2(atan(ray.z,ray.x)/6.28318,asin(ray.y)/3.14159);
    vec2 field=uv*vec2(1750.,875.);
    vec3 cell=vec3(floor(field),2.);
    vec2 sub=fract(field)-vec2(hash(cell+3.),hash(cell-4.))*.7-.15;
    float stars=step(.974,hash(cell))*exp(-dot(sub,sub)*24.);
    float band=exp(-10.*abs(ray.y+.39+.13*ray.x));
    vec3 sky=mix(vec3(.002,.006,.019),vec3(.022,.052,.115),band*(.29+.71*noise3(ray*12.)));
    sky+=vec3(.16,.27,.44)*stars;
    vec3 center=normalize(vec3(-.12,-.88,-1.01));
    float facing=dot(ray,center),limb=.883;
    float haze=exp(-abs(facing-limb)*115.);
    vec3 light=normalize(vec3(.77,.29,-.50));
    if(facing>limb){
     float distanceToFace=facing-sqrt(max(0.,facing*facing-limb*limb));
     vec3 normal=normalize(ray*distanceToFace-center);
     float day=smoothstep(-.39,.78,dot(normal,light));
     float continent=terrain(normal*5.7+12.);
     float coast=smoothstep(.505,.56,continent);
     vec3 ground=mix(vec3(.014,.047,.115),vec3(.12,.17,.19),coast);
     vec3 wind=normal*37.+vec3(3.9*sin(normal.z*11.+normal.y*5.),1.3*cos(normal.x*14.),0.);
     float clouds=smoothstep(.47,.71,terrain(wind))*.65;
     sky=mix(ground,vec3(.21,.32,.51),clouds)*(.12+.68*day);
    }
    sky+=haze*vec3(.045,.17,.43)+exp(-abs(facing-limb)*660.)*vec3(.07,.22,.48);
    vec3 dawn=normalize(vec3(.20,-.43,-.87));
    float sun=max(0.,1.-dot(ray,dawn));
    sky+=vec3(.24,.106,.054)*exp(-sun*360.)+vec3(.9,.54,.25)*exp(-sun*6500.);
    gl_FragColor=vec4(sky,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const sky=new THREE.Mesh(new THREE.SphereGeometry(1,28,16),material);
 sky.frustumCulled=false;sky.renderOrder=-100;
 return sky;
}

const urls=import.meta.glob('../assets/models/benchmark/*.glb',{eager:true,import:'default',query:'?url'});
export function createOrbitalBenchmark(THREE,scene,world,loader,onReady){
 const root=new THREE.Group();
 root.name=orbitalArt.en;
 root.visible=false;world.add(root);
 const sky=orbitalSky(THREE);
 sky.visible=false;scene.add(sky);
 let wanted=false,status='idle',station;
 const sync=()=>{root.visible=sky.visible=wanted&&status==='ready'};
 function setLevel(enabled){
  wanted=enabled;sync();
  if(!enabled||status!=='idle')return;
  status='loading';
  const load=name=>loader.loadAsync(urls['../assets/models/benchmark/'+name+'.glb']).then(gltf=>gltf.scene);
  Promise.all(['station-deck','transfer-arch','relay-crown','mineral-shelf','belt-fragment'].map(load)).then(([deck,arch,relay,shelf,fragment])=>{
   deck.traverse(mesh=>{
    if(mesh.material?.name!=='Satin deck')return;
    mesh.material.onBeforeCompile=shader=>{
     shader.vertexShader='varying vec2 deckXZ;\n'+shader.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\n deckXZ=(modelMatrix*vec4(transformed,1.)).xz;');
     shader.fragmentShader='varying vec2 deckXZ;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      vec2 seam=abs(fract(deckXZ/1.30)-.5)*1.30/max(fwidth(deckXZ),vec2(.0001));
      diffuseColor.rgb*=mix(.22,1.,smoothstep(.12,1.08,min(seam.x,seam.y)));`);
    };
    mesh.material.color.multiplyScalar(.64);
   });
   deck.position.y=-3.53;root.add(deck);
   function place(source,x,y,z,scale,yaw){
    const prop=source.clone();prop.position.set(x,y,z);prop.scale.setScalar(scale);prop.rotation.y=yaw;
    root.add(prop);return prop;
   }
   station=place(relay,25,-7,-5,1.12,-.6);
   const gate=place(arch,-10,-3.85,-10.5,1.05,-.53);
   for(const [x,y,z,scale,yaw] of [
    [-10,-9.1,-10.5,1.30,-.53],[-15,-10.9,-8.9,1.61,-.21],[-17,-12.5,-4,1.47,2.14],
    [15,-10.7,10,1.35,-.65],[13,-12.3,15,1.35,1.23],[8,-13.5,19,1.53,-1.23]
   ])place(shelf,x,y,z,scale,yaw);
   const dummy=new THREE.Object3D(),matrix=new THREE.Matrix4();
   const count=37;
   fragment.updateMatrixWorld(true);
   fragment.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const belt=new THREE.InstancedMesh(mesh.geometry,mesh.material,count);
    for(let i=0;i<count;i++){
     const a=i*2.39996;
     dummy.position.set(12+.85*i+3*Math.sin(a),-7+.18*i+1.16*Math.cos(a),-34+.61*i+Math.sin(a*.72)*3);
     dummy.rotation.set(a*.9,a*.37,a*1.12);
     dummy.scale.setScalar(.16+.51*(.5+.5*Math.cos(a*.67))**3);
     dummy.updateMatrix();belt.setMatrixAt(i,matrix.multiplyMatrices(dummy.matrix,mesh.matrixWorld));
    }
    root.add(belt);
   });
   root.traverse(mesh=>{if(mesh.isMesh){mesh.receiveShadow=true;mesh.castShadow=!mesh.isInstancedMesh}});
   gate.userData.clearSight=true;station.userData.clearSight=true;
   status='ready';sync();onReady();
  }).catch(error=>{status='error';console.error('Orbital station',error);sync();onReady()});
 }
 function update(seconds,still,camera){
  if(!root.visible)return;
  station.rotation.y=-.6+(still?0:Math.sin(seconds*.09)*.085);
  for(const prop of root.children)if(prop.userData.clearSight)
   prop.visible=prop.position.x*camera.x+prop.position.z*camera.z<30;
 }
 return {setLevel,update,isVisible:()=>root.visible,getStatus:()=>status};
}
