import {scenerySeed} from './campaign-worlds.js';
import {applyPanelSurface} from './panel-surface.js';

function createSky(THREE){
 const sky=new THREE.Mesh(new THREE.SphereGeometry(1,20,12),new THREE.ShaderMaterial({
  uniforms:{planetDirection:{value:new THREE.Vector3(.51,-.825,-.255).normalize()}},
  side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:`
   varying vec3 direction;
   void main(){
    direction=position;
    gl_Position=projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.0);
    gl_Position.z=gl_Position.w;
   }
  `,
  fragmentShader:`
   uniform vec3 planetDirection;
   varying vec3 direction;
   void main(){
    vec3 ray=normalize(direction);
    float facing=dot(ray,planetDirection);
    float horizon=.769;
    float edge=smoothstep(horizon-.002,horizon+.002,facing);
    float air=exp(-abs(facing-horizon)*60.)*.08+exp(-abs(facing-horizon)*285.)*.16;
    vec3 color=mix(vec3(.005,.012,.030),vec3(.014,.037,.082),smoothstep(-.8,-.1,ray.y));
    float hit=facing-sqrt(max(0.,facing*facing-horizon*horizon));
    vec3 normal=normalize(ray*hit-planetDirection);
    float drift=normal.x*19.+normal.z*11.;
    float strata=(.5+.5*sin(normal.y*73.+3.4*sin(drift*1.9)))*.52
       +(.5+.5*sin(normal.y*171.+drift*4.2))*.24;
    float day=smoothstep(-.9,.1,dot(normal,normalize(vec3(-.22,.89,-.38))));
    vec3 ocean=mix(vec3(.006,.020,.051),vec3(.012,.059,.124),day);
    vec3 earth=ocean+vec3(.015,.027,.041)*strata*day;
    color=mix(color,earth,edge)+air*vec3(.091,.31,.73);
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }
  `
 }));
 sky.name='Orbital horizon';
 sky.visible=false;
 sky.frustumCulled=false;
 sky.renderOrder=-100;
 return sky;
}

/** One cached decorative layer, loaded atomically while the regular stage remains playable. */
export function createShipyard(THREE,scene,world,{loader,assets,onReady}){
 const root=new THREE.Group();
 root.name='Orbital Shipyard';
 root.userData.scenicOnly=true;
 root.visible=false;
 world.add(root);
 const sky=createSky(THREE);
 scene.add(sky);
 let wanted=false,status='idle',nodes,drift=0;
 function sync(){
  root.visible=sky.visible=wanted&&status==='ready';
 }
 function startLoading(){
  status='loading';
  const load=id=>loader.loadAsync(assets[id]).then(asset=>asset.scene);
  Promise.all(['platform','rib','berth','craft'].map(load)).then(([platform,rib,berth,craft])=>{
   platform.position.y=-3.768;
   platform.traverse(node=>{
    if(!node.isMesh)return;
    const material=node.material;
    if(material.name==='Uniform playing surface'||material.name==='Machined upper bevel')
     material.color.multiplyScalar(.59);
    if(material.name==='Inlay seam')material.color.multiplyScalar(.70);
    if(material.name==='Uniform playing surface')applyPanelSurface(THREE,material,'shipyard',.037);
   });
   rib.position.set(-13.4,-9.8,-17.9);
   rib.rotation.y=-.67;
   rib.scale.setScalar(1.61);
   rib.traverse(node=>{
    if(node.isMesh&&node.material.name!=='Warm status marker')node.material.color.multiplyScalar(.59);
   });
   berth.position.set(36,-19.2,-12);
   berth.rotation.y=-.74;
   berth.scale.setScalar(1.28);
   craft.scale.setScalar(.75);
   craft.rotation.y=-.34;
   root.add(platform,rib,berth,craft);
   nodes={rib,berth,craft};
   status='ready';
  },()=>{status='error'}).then(()=>{
   sync();
   onReady();
  });
 }
 function setLevel(enabled,campaign,index){
  wanted=enabled;
  if(wanted)drift=campaign==='demo'?0:scenerySeed(campaign,index)/4294967296-.5;
  if(wanted&&status==='idle')startLoading();
  sync();
 }
 function update(seconds,still,cameraPosition){
  if(!root.visible)return;
  const t=still?0:seconds;
  const {rib,berth,craft}=nodes;
  // Keep the framing structures from crossing the puzzle when orbiting the board.
  rib.visible=rib.position.x*cameraPosition.x+rib.position.z*cameraPosition.z<0;
  berth.visible=berth.position.x*cameraPosition.x+berth.position.z*cameraPosition.z<0;
  berth.position.x=36+drift*3.2;
  craft.position.set(23+drift*2.4+Math.sin(t*.13)*3,-3.1+Math.sin(t*.24)*.23,-20+Math.cos(t*.13)*1.7);
 }
 return {setLevel,update,isVisible:()=>root.visible,getStatus:()=>status};
}
