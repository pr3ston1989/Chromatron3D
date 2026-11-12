import * as THREE from 'three';
import {PROTOTYPE_LEVELS,validateLevels} from './levels.js';
import {COLORS,trace,movable} from './optics.js';
import './style.css';
const $=id=>document.getElementById(id);
const GRID=15, HALF=7, T=1.3;
const scene=new THREE.Scene();scene.background=new THREE.Color('#070b18');scene.fog=new THREE.FogExp2('#070b18',0.018);
const camera=new THREE.PerspectiveCamera(40,1,.1,200);
const cameraTarget=new THREE.Vector3(0,0,0);
let yaw=-.68,pitch=.89,dist=35;
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.5;
$('scene').appendChild(renderer.domElement);
const ambient=new THREE.AmbientLight(0x8da8ff,1.25);scene.add(ambient);
const key=new THREE.DirectionalLight(0xa9c9ff,2.6);key.position.set(-8,16,12);scene.add(key);
const fill=new THREE.PointLight(0x2c6bff,100,35);fill.position.set(9,9,-9);scene.add(fill);
const world=new THREE.Group();scene.add(world);
const metal=new THREE.MeshStandardMaterial({color:0x15233b,metalness:.78,roughness:.26});
const dark=new THREE.MeshStandardMaterial({color:0x0a1225,metalness:.45,roughness:.4});
const cyan=new THREE.MeshStandardMaterial({color:0x1fa9c5,emissive:0x0a83c5,emissiveIntensity:1.3,metalness:.35,roughness:.22});
const tileGeo=new THREE.BoxGeometry(T*.97,.22,T*.97);
function mesh(geo,mat,parent=world){const m=new THREE.Mesh(geo,mat);parent.add(m);return m;}
const deck=mesh(new THREE.BoxGeometry(21,.75,21),new THREE.MeshStandardMaterial({color:0x0a1324,metalness:.65,roughness:.3}));deck.position.y=-.62;
const edge=new THREE.EdgesGeometry(new THREE.BoxGeometry(21,.75,21));const wire=new THREE.LineSegments(edge,new THREE.LineBasicMaterial({color:0x1c89bd,transparent:true,opacity:.35}));wire.position.copy(deck.position);world.add(wire);
const gridGroup=new THREE.Group();world.add(gridGroup);
for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){
 const tile=mesh(tileGeo,new THREE.MeshStandardMaterial({color:(x+y)%2?0x0e1b30:0x101e33,metalness:.73,roughness:.38}),gridGroup);
 tile.position.set((x-HALF)*T,-.12,(y-HALF)*T);
 tile.userData.cell={x,y};
 const line=mesh(new THREE.BoxGeometry(T*.88,.012,.016),new THREE.MeshBasicMaterial({color:0x245074,transparent:true,opacity:.29}),gridGroup);
 line.position.set((x-HALF)*T,.002,(y-HALF)*T-T*.44);
}
const starGeo=new THREE.BufferGeometry(),pos=[];for(let i=0;i<1000;i++)pos.push((Math.random()-.5)*150,Math.random()*58-5,(Math.random()-.5)*150);
starGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x76aaff,size:.035,transparent:true,opacity:.6})));
const componentGroup=new THREE.Group();world.add(componentGroup);
const beamGroup=new THREE.Group();world.add(beamGroup);
const hitObjects=[];
let levels=validateLevels(PROTOTYPE_LEVELS),levelIndex=0,pieces=[],selected=null,history=[],currentResult=null,won=false,audioEnabled=false;
let saved=0;try{saved=Number(localStorage.getItem('chromatron-reborn-level')||0)}catch{}
let nextId=0;
const vec=(x,y,height=.3)=>new THREE.Vector3((x-HALF)*T,height,(y-HALF)*T);
const matColor=color=>new THREE.MeshStandardMaterial({color:new THREE.Color(COLORS[color||7]),emissive:new THREE.Color(COLORS[color||7]),emissiveIntensity:1.8,metalness:.3,roughness:.18});
function torus(radius,tube,mat,parent,rotation=Math.PI/2){const a=mesh(new THREE.TorusGeometry(radius,tube,10,48),mat,parent);a.rotation.x=rotation;return a}
function rebuildPieces(){
 while(componentGroup.children.length)componentGroup.remove(componentGroup.children[0]);
 hitObjects.length=0;
 for(const p of pieces){
  const g=new THREE.Group();g.position.copy(vec(p.x,p.y,.24));g.userData.piece=p;componentGroup.add(g);
  const base=mesh(new THREE.CylinderGeometry(.44,.51,.22,8),metal,g);base.position.y=0;
  torus(.38,.022,p===selected?cyan:new THREE.MeshBasicMaterial({color:0x2a6a99}),g);
  const core=matColor(p.color||4);
  if(p.type==='laser'){
   const r=mesh(new THREE.CylinderGeometry(.28,.33,.28,12),dark,g);r.position.y=.24;
   torus(.28,.052,core,g).position.y=.4;
   const arrow=mesh(new THREE.ConeGeometry(.14,.31,4),core,g);arrow.position.set(0,.53,-.26);arrow.rotation.x=Math.PI/2;
   const dir=p.rot*Math.PI/4;arrow.position.x=Math.sin(dir)*.31;arrow.position.z=-Math.cos(dir)*.31;arrow.rotation.z=-dir;
  }else if(p.type==='target'){
   const r=mesh(new THREE.CylinderGeometry(.28,.38,.2,24),dark,g);r.position.y=.24;
   torus(.3,.055,core,g).position.y=.4;
   const gem=mesh(new THREE.IcosahedronGeometry(.18,1),core,g);gem.position.y=.43;gem.userData.spin=true;
  }else if(p.type==='wall'){
   const wall=mesh(new THREE.BoxGeometry(.9,.75,.9),dark,g);wall.position.y=.35;
   torus(.46,.025,metal,g).position.y=.75;
  }else{
   const stem=mesh(new THREE.CylinderGeometry(.12,.18,.36,12),metal,g);stem.position.y=.3;
   const optic=mesh(new THREE.BoxGeometry(.72,.48,.095),p.type==='filter'?core:new THREE.MeshStandardMaterial({color:0xc9f4ff,metalness:.8,roughness:.08,emissive:0x164e82,emissiveIntensity:.55}),g);
   optic.position.y=.53;optic.rotation.y=-p.rot*Math.PI/4;
   const ring=torus(.47,.025,cyan,g);ring.position.y=.52;
  }
  g.traverse(c=>{if(c.isMesh){c.userData.piece=p;hitObjects.push(c)}});
  if(p===selected){
   const halo=torus(.57,.045,new THREE.MeshBasicMaterial({color:0x48e5ff,transparent:true,opacity:.9}),g);halo.position.y=.04;
  }
 }
}
function rebuildBeams(){
 while(beamGroup.children.length)beamGroup.remove(beamGroup.children[0]);
 currentResult=trace(pieces);
 for(const s of currentResult.segments){
  const start=vec(s.x,s.y,.42),end=vec(s.nx,s.ny,.42),direction=end.clone().sub(start),length=direction.length();
  const color=new THREE.Color(COLORS[s.color]);
  const beam=mesh(new THREE.CylinderGeometry(.027,.027,length,6),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.97}),beamGroup);
  beam.position.copy(start).add(end).multiplyScalar(.5);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  const glow=mesh(new THREE.CylinderGeometry(.105,.105,length,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.10,depthWrite:false}),beamGroup);
  glow.position.copy(beam.position);glow.quaternion.copy(beam.quaternion);
 }
 $('counter').textContent=currentResult.active+' / '+currentResult.total;
 $('progress').style.width=(currentResult.total?currentResult.active/currentResult.total*100:0)+'%';
 if(currentResult.won&&!won){won=true;setTimeout(()=>{$('win').classList.remove('hidden');beep(880,.15)},250)}
}
function load(i){
 levelIndex=(i+levels.length)%levels.length;
 const l=levels[levelIndex];pieces=l.pieces.map(([type,x,y,rot,color])=>({id:++nextId,type,x,y,rot,color}));
 selected=null;history=[];won=false;$('win').classList.add('hidden');
 $('level-title').textContent=l.title;$('level-desc').textContent=l.description;$('level-index').textContent=String(levelIndex+1).padStart(3,'0');
 $('prev').disabled=levelIndex===0;$('next').disabled=levelIndex===levels.length-1;
 update();
 try{localStorage.setItem('chromatron-reborn-level',String(levelIndex))}catch{}
}
function update(){rebuildPieces();rebuildBeams();renderInventory()}
function renderInventory(){
 const el=$('inventory');el.innerHTML='';
 for(const type of ['laser','mirror','filter','splitter','prism','target']){
  const count=pieces.filter(p=>p.type===type).length;if(!count)continue;
  const item=document.createElement('div');item.className='inventory-item';
  item.innerHTML='<span class="component-icon">'+({laser:'↗',mirror:'◩',filter:'◈',splitter:'◇',prism:'⬡',target:'◎'}[type])+'</span><span>'+type.toUpperCase()+'</span><strong>'+String(count).padStart(2,'0')+'</strong>';
  el.appendChild(item);
 }
}
function saveHistory(){history.push(pieces.map(p=>({...p})));if(history.length>100)history.shift()}
function select(p){
 if(!movable.has(p.type)){toast('This component is locked in place');return}
 if(selected===p){rotate(1);return}
 selected=p;update();beep(420,.04)
}
function rotate(dir){
 if(!selected)return toast('Select a movable optical component first');
 saveHistory();selected.rot=(selected.rot+dir+8)%8;update();beep(540,.055)
}
function move(x,y){
 if(!selected)return;
 if(pieces.some(p=>p.x===x&&p.y===y)){toast('Cell occupied');return}
 saveHistory();selected.x=x;selected.y=y;update();beep(620,.06)
}
let toastTimeout;
function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),2600)}
let ctx;
function beep(freq,duration){if(!audioEnabled)return;try{ctx??=new AudioContext();const o=ctx.createOscillator(),gain=ctx.createGain();o.type='sine';o.frequency.value=freq;gain.gain.setValueAtTime(.025,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(gain).connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration)}catch{}}
function updateCamera(){camera.position.set(Math.sin(yaw)*Math.cos(pitch)*dist,Math.sin(pitch)*dist,Math.cos(yaw)*Math.cos(pitch)*dist);camera.lookAt(cameraTarget)}
function resize(){const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)}window.addEventListener('resize',resize);resize();updateCamera();
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function hit(clientX,clientY){mouse.set(clientX/innerWidth*2-1,-clientY/innerHeight*2+1);ray.setFromCamera(mouse,camera);const objs=ray.intersectObjects(hitObjects,false);if(objs.length)return {piece:objs[0].object.userData.piece};const point=new THREE.Vector3();if(ray.ray.intersectPlane(plane,point)){const x=Math.round(point.x/T+HALF),y=Math.round(point.z/T+HALF);if(x>=0&&x<GRID&&y>=0&&y<GRID)return {x,y}}return null}
let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;down={x:e.clientX,y:e.clientY,yaw,pitch,button:e.button,moved:false};renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.abs(dx)+Math.abs(dy)>7)down.moved=true;if(down.moved){yaw=down.yaw-dx*.005;pitch=Math.max(.3,Math.min(1.48,down.pitch+dy*.004));updateCamera()}});
renderer.domElement.addEventListener('pointerup',e=>{if(!down)return;const dragged=down.moved;down=null;if(dragged)return;const result=hit(e.clientX,e.clientY);if(!result)return;if(result.piece)select(result.piece);else if(selected)move(result.x,result.y)});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(19,Math.min(58,dist+e.deltaY*.023));updateCamera()},{passive:false});
document.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement)return;
 if(e.code==='KeyQ')rotate(-1);if(e.code==='KeyE'||e.code==='KeyR')rotate(1);
 if(e.code==='Escape'){selected=null;update();$('help-overlay').classList.add('hidden')}
 if(e.code==='KeyZ'&&e.ctrlKey){e.preventDefault();if(history.length){const selId=selected?.id;pieces=history.pop();selected=pieces.find(p=>p.id===selId)||null;update()}}
});
$('prev').onclick=()=>load(levelIndex-1);$('next').onclick=()=>load(levelIndex+1);
$('reset').onclick=()=>load(levelIndex);
$('continue').onclick=()=>load(levelIndex<levels.length-1?levelIndex+1:0);
$('help').onclick=()=>$('help-overlay').classList.remove('hidden');
$('close-help').onclick=()=>$('help-overlay').classList.add('hidden');
$('audio').onclick=()=>{audioEnabled=!audioEnabled;$('audio').classList.toggle('enabled',audioEnabled);beep(700,.08)};
let start=performance.now();
function animate(time){requestAnimationFrame(animate);for(const p of componentGroup.children)for(const c of p.children)if(c.userData.spin)c.rotation.y=(time-start)*.001;renderer.render(scene,camera)}
load(Math.min(Math.max(saved,0),levels.length-1));requestAnimationFrame(animate);
// For QA / external validation, expose read-only state and import API.
window.chromatron={
 getState:()=>({level:levelIndex,pieces:pieces.map(p=>({...p})),result:{...currentResult,received:[...currentResult.received]}}),
 loadLevels(json){const parsed=typeof json==='string'?JSON.parse(json):json;levels=validateLevels(parsed);load(0);toast('Imported '+levels.length+' levels')}
};
