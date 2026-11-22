import {applyOpticFinish} from './optic-textures.js';
import {createDockPatrol} from './kepler-traffic.js';

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
    float stars=step(.979,hash(cell))*exp(-dot(sub,sub)*22.);
    float band=exp(-10.*abs(ray.y+.39+.13*ray.x));
    vec3 sky=mix(vec3(.002,.006,.019),vec3(.022,.052,.115),band*(.29+.71*noise3(ray*12.)));
    sky+=mix(vec3(.17,.27,.42),vec3(.35,.30,.29),hash(cell+1.))*stars;
    vec3 center=normalize(vec3(-.12,-.88,-1.01));
    float facing=dot(ray,center),limb=.883;
    float haze=exp(-abs(facing-limb)*115.);
    vec3 light=normalize(vec3(.77,.29,-.50));
    if(facing>limb){
     float distanceToFace=facing-sqrt(max(0.,facing*facing-limb*limb));
     vec3 normal=normalize(ray*distanceToFace-center);
     float day=smoothstep(-.39,.78,dot(normal,light));
     float continent=terrain(normal*5.7+12.);
     float coast=smoothstep(.503,.546,continent);
     vec3 ground=mix(vec3(.013,.049,.129),vec3(.068,.118,.145),coast);
     vec3 wind=normal*31.+vec3(3.4*sin(normal.z*12.+normal.y*5.),1.8*cos(normal.x*14.),0.);
     vec2 storm=wind.xy-vec2(-10.,13.);
     float turn=1.7*exp(-dot(storm,storm)*.019);
     wind.xy+=mat2(cos(turn)-1.,sin(turn),-sin(turn),cos(turn)-1.)*storm;
     float clouds=smoothstep(.46,.73,terrain(wind));
     float cirrus=smoothstep(.52,.74,noise3(wind*vec3(1.1,3.7,1.6)+4.));
     float oceanGlint=pow(max(0.,dot(reflect(ray,normal),light)),22.)*(1.-coast);
     ground+=vec3(.15,.17,.19)*oceanGlint;
     sky=mix(ground,vec3(.25,.36,.49),clouds*(.56+.19*cirrus))*(.12+.68*day);
     sky+=vec3(.032,.080,.14)*pow(1.-max(0.,dot(normal,-ray)),3.)*(.15+.85*day);
    }
    sky+=haze*vec3(.045,.17,.43)+exp(-abs(facing-limb)*660.)*vec3(.07,.22,.48);
    vec3 dawn=normalize(vec3(.27,-.36,-.89));
    float sun=max(0.,1.-dot(ray,dawn));
    sky+=vec3(.26,.13,.071)*exp(-sun*360.)+vec3(1.4,.84,.52)*exp(-sun*11500.);
    gl_FragColor=vec4(sky,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const sky=new THREE.Mesh(new THREE.SphereGeometry(1,28,16),material);
 sky.frustumCulled=false;sky.renderOrder=-100;
 return sky;
}

const urls=import.meta.glob(['../assets/models/benchmark/kepler-service-dock.glb','../assets/models/benchmark/station/*.glb'],{eager:true,import:'default',query:'?url'});
export function createOrbitalBenchmark(THREE,scene,world,loader,onReady){
 const root=new THREE.Group();
 root.name=orbitalArt.en;
 root.visible=false;world.add(root);
 const sky=orbitalSky(THREE);
 sky.visible=false;scene.add(sky);
 let wanted=false,status='idle',station,carriage,patrol,elapsed=0;
 const sync=()=>{root.visible=sky.visible=wanted&&status==='ready'};
 function setLevel(enabled){
  if(!enabled)elapsed=0;
  wanted=enabled;sync();
  if(!enabled||status!=='idle')return;
  status='loading';
  const load=name=>loader.loadAsync(urls['../assets/models/benchmark/'+name+'.glb']).then(gltf=>gltf.scene);
  Promise.all(['station/station-deck','kepler-service-dock','station/relay-crown','station/belt-fragment','station/transit-gate'].map(load)).then(([deck,dock,relay,fragment,gantry])=>{
   deck.traverse(mesh=>{
    if(mesh.material?.name!=='Satin deck')return;
    mesh.material.onBeforeCompile=shader=>{
     shader.vertexShader='varying vec2 deckXZ;\n'+shader.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\n deckXZ=(modelMatrix*vec4(transformed,1.)).xz;');
     shader.fragmentShader='varying vec2 deckXZ;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      vec2 seam=abs(fract(deckXZ/1.30)-.5)*1.30/max(fwidth(deckXZ),vec2(.0001));
      float d=min(seam.x,seam.y);
      vec2 tile=floor(deckXZ/1.30+.5);
      float temper=fract(sin(dot(tile,vec2(29.17,73.53)))*3712.17);
      diffuseColor.rgb*=mix(.96,1.04,temper)*mix(.38,1.,smoothstep(.12,1.06,d));
      diffuseColor.rgb+=vec3(.016,.023,.031)*(1.-smoothstep(.36,1.18,abs(d-1.38)));`);
    };
    mesh.material.color.setHex(0x9baac0);
    mesh.material.roughness=.51;
    mesh.material.metalness=.34;
   });
   deck.position.y=-3.53;root.add(deck);
   function place(source,x,y,z,scale,yaw){
    const prop=source.clone();prop.position.set(x,y,z);prop.scale.setScalar(scale);prop.rotation.y=yaw;
    root.add(prop);return prop;
   }
   station=place(relay,25,-7,-5,1.12,-.6);
   const gate=place(gantry,-10.1,-4.75,-12.6,1.02,.06);
   gate.userData.clearSight=true;
   carriage=gate.getObjectByName('Inspection_carriage');
   // The Blender kit shares the centre of the logical deck. Its lowest
   // maintenance skid sits 6.80 m below the playing surface.
   dock.position.y=-6.80;root.add(dock);
   const beltGroup=new THREE.Group();
   root.add(beltGroup);
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
     const size=.14+.47*(.5+.5*Math.cos(a*.67))**3;
     dummy.scale.set(size*(1.+.30*Math.cos(a)),size*(.88+.2*Math.sin(a*1.9)),size);
     dummy.updateMatrix();belt.setMatrixAt(i,matrix.multiplyMatrices(dummy.matrix,mesh.matrixWorld));
    }
    beltGroup.add(belt);
   });
   patrol=createDockPatrol(THREE,dock,beltGroup);
   const finished=new Set();
   root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    mesh.receiveShadow=true;mesh.castShadow=!mesh.isInstancedMesh;
    if(finished.has(mesh.material)||!mesh.geometry.getAttribute('uv'))return;
    finished.add(mesh.material);
    if(['Machined rim','Satellite blue','Midnight hull','Satin deck'].includes(mesh.material.name))
     applyOpticFinish(THREE,mesh.material,mesh.material.name==='Satin deck'?'polished':'brushed');
    if(['Dock | Cut titanium','Dock | Ceramic enamel','Dock | Blue grey alloy'].includes(mesh.material.name))
     applyOpticFinish(THREE,mesh.material,'polished');
   });
   station.userData.clearSight=true;
   // The benchmark caches its shadow map. Moving hardware already carries
   // baked cavity shading and must not leave a stationary shadow in its berth.
   for(const name of ['Survey_tender','Tracking_reflector'])
    dock.getObjectByName(name).traverse(node=>{node.castShadow=false});
   status='ready';sync();onReady();
  }).catch(error=>{status='error';console.error('Orbital station',error);sync();onReady()});
 }
 function update(delta,still,camera){
  if(!root.visible)return;
  elapsed=still?0:elapsed+delta;
  patrol(elapsed);
  station.rotation.y=-.6+Math.sin(elapsed*.09)*.085;
  if(carriage)carriage.rotation.z=Math.PI*(.61+.31*Math.sin(elapsed*.19));
  for(const prop of root.children)if(prop.userData.clearSight)
   prop.visible=prop.position.x*camera.x+prop.position.z*camera.z<30;
 }
 return {setLevel,update,isVisible:()=>root.visible,getStatus:()=>status};
}
