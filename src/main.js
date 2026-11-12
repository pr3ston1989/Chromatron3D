import * as THREE from 'three';
import {PROTOTYPE_LEVELS,validateLevels} from './levels.js';
import {COLORS,trace,movable} from './optics.js';
import {inspectLight,colorName,channels} from './analysis.js';
import {applyLanguage,t,loc,normalizeLanguage} from './i18n.js';
import {clampHints,nextHint,hintFor,progressKey} from './hints.js';
import {disposeGroupChildren} from './dispose.js';
import {buildLaboratory} from './world-art.js';
import './style.css';
const $=id=>document.getElementById(id);
const GRID=15, HALF=7, T=1.3;
const scene=new THREE.Scene();scene.background=new THREE.Color('#0d1b2c');scene.fog=new THREE.FogExp2('#0d1b2c',0.008);
const camera=new THREE.PerspectiveCamera(40,1,.1,200);
const cameraTarget=new THREE.Vector3(0,0,0);
let yaw=-.58,pitch=1.10,dist=44;
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.9;
$('scene').appendChild(renderer.domElement);
const ambient=new THREE.AmbientLight(0xb0d7ef,2.0);scene.add(ambient);
const key=new THREE.DirectionalLight(0xf0faff,3.2);key.position.set(-8,16,12);scene.add(key);
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
 const tile=mesh(tileGeo,new THREE.MeshStandardMaterial({color:(x+y)%2?0x263f53:0x2b465a,metalness:.48,roughness:.48}),gridGroup);
 tile.position.set((x-HALF)*T,-.12,(y-HALF)*T);
 tile.userData.cell={x,y};
 const line=mesh(new THREE.BoxGeometry(T*.88,.012,.016),new THREE.MeshBasicMaterial({color:0x73abc4,transparent:true,opacity:.68}),gridGroup);
 line.position.set((x-HALF)*T,.002,(y-HALF)*T-T*.44);
}
buildLaboratory(THREE,scene,world,T);
const starGeo=new THREE.BufferGeometry(),pos=[];for(let i=0;i<1000;i++)pos.push((Math.random()-.5)*150,Math.random()*58-5,(Math.random()-.5)*150);
starGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x76aaff,size:.035,transparent:true,opacity:.6})));
const componentGroup=new THREE.Group();world.add(componentGroup);
const beamGroup=new THREE.Group();world.add(beamGroup);
const assistGroup=new THREE.Group();world.add(assistGroup);
const hitObjects=[];
let levels=validateLevels(PROTOTYPE_LEVELS),levelIndex=0,pieces=[],selected=null,history=[],redoHistory=[],currentResult=null,won=false,audioEnabled=false;
let language='pl',hintCount=0,solved=[],skipped=[],spectrumActive=false,analysisActive=false;
let saved=0;
try{
 saved=Number(localStorage.getItem('chromatron-reborn-level')||0);
 language=normalizeLanguage(localStorage.getItem('chromatron-reborn-language')||'pl');
 analysisActive=localStorage.getItem('chromatron-reborn-analysis')==='on';
 solved=JSON.parse(localStorage.getItem('chromatron-reborn-solved')||'[]');
 skipped=JSON.parse(localStorage.getItem('chromatron-reborn-skipped')||'[]');
 spectrumActive=localStorage.getItem('chromatron-reborn-spectrum')==='true';
 if(!Array.isArray(solved))solved=[];
 if(!Array.isArray(skipped))skipped=[];
}catch{}
let nextId=0;
const vec=(x,y,height=.3)=>new THREE.Vector3((x-HALF)*T,height,(y-HALF)*T);
const matColor=color=>new THREE.MeshStandardMaterial({color:new THREE.Color(COLORS[color||7]),emissive:new THREE.Color(COLORS[color||7]),emissiveIntensity:1.8,metalness:.3,roughness:.18});
function torus(radius,tube,mat,parent,rotation=Math.PI/2){const a=mesh(new THREE.TorusGeometry(radius,tube,10,48),mat,parent);a.rotation.x=rotation;return a}
// Original premium optic meshes: luminous emitters, crystal targets and readable reflective mirrors.
function rebuildPieces(){
 disposeGroupChildren(componentGroup,new Set([metal,dark,cyan]));
 hitObjects.length=0;
 const silver=new THREE.MeshPhysicalMaterial({color:0xd3f6ff,metalness:.86,roughness:.11,clearcoat:1,clearcoatRoughness:.08,emissive:0x18415a,emissiveIntensity:.22,side:THREE.DoubleSide});
 const trim=new THREE.MeshStandardMaterial({color:0x587991,metalness:.82,roughness:.22});
 const glass=new THREE.MeshPhysicalMaterial({color:0x97eaff,metalness:.42,roughness:.12,transparent:true,opacity:.83,clearcoat:1,side:THREE.DoubleSide});
 for(const p of pieces){
  if(p.inTray)continue;
  const g=new THREE.Group();g.position.copy(vec(p.x,p.y,.24));g.userData.piece=p;componentGroup.add(g);
  const color=new THREE.Color(COLORS[p.color||7]);
  const glow=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2.3,metalness:.24,roughness:.18});
  const base=mesh(new THREE.CylinderGeometry(.53,.60,.24,12),metal,g);base.position.y=.025;
  const foot=mesh(new THREE.CylinderGeometry(.47,.49,.06,24),trim,g);foot.position.y=.17;
  const outline=torus(.48,.035,p===selected?glow:new THREE.MeshBasicMaterial({color:0x59acc8}),g);
  outline.position.y=-.045;
  if(p.type==='laser'){
   const barrel=mesh(new THREE.CylinderGeometry(.27,.35,.38,16),dark,g);barrel.position.y=.38;
   const corona=torus(.35,.07,glow,g);corona.position.y=.61;
   const lens=mesh(new THREE.SphereGeometry(.19,16,12),glow,g);lens.position.y=.63;
   const heading=p.rot*Math.PI/4;
   const nozzle=mesh(new THREE.CylinderGeometry(.13,.19,.47,12),silver,g);
   nozzle.rotation.z=Math.PI/2;nozzle.rotation.y=heading;
   nozzle.position.set(Math.sin(heading)*.33,.50,-Math.cos(heading)*.33);
   const arrow=mesh(new THREE.ConeGeometry(.13,.26,5),glow,g);
   arrow.rotation.x=Math.PI/2;arrow.rotation.z=-heading;
   arrow.position.set(Math.sin(heading)*.48,.69,-Math.cos(heading)*.48);
  }else if(p.type==='target'){
   const housing=mesh(new THREE.CylinderGeometry(.35,.42,.3,24),dark,g);housing.position.y=.27;
   torus(.41,.07,glow,g).position.y=.45;
   torus(.28,.042,silver,g).position.y=.52;
   const crystal=mesh(new THREE.IcosahedronGeometry(.235,1),glow,g);
   crystal.position.y=.56;crystal.userData.spin=true;
  }else if(p.type==='wall'){
   const wall=mesh(new THREE.BoxGeometry(.98,.81,.98),dark,g);wall.position.y=.45;
   const cap=mesh(new THREE.BoxGeometry(1.03,.07,1.03),trim,g);cap.position.y=.88;
   const stripe=mesh(new THREE.BoxGeometry(.85,.025,.06),new THREE.MeshBasicMaterial({color:0xffaa55}),g);stripe.position.set(0,.93,-.3);
  }else{
   const stem=mesh(new THREE.CylinderGeometry(.14,.19,.37,12),metal,g);stem.position.y=.36;
   const head=new THREE.Group();head.position.y=.65;head.rotation.y=-p.rot*Math.PI/4;g.add(head);
   if(p.type==='mirror'||p.type==='bender'){
    const plate=mesh(new THREE.BoxGeometry(.97,.72,.105),silver,head);
    plate.position.y=.045;
    const edgeMat=new THREE.MeshBasicMaterial({color:p.type==='bender'?0xffc177:0x85dcff});
    for(const side of [-.51,.51]){
     const stripe=mesh(new THREE.BoxGeometry(.055,.82,.14),edgeMat,head);stripe.position.set(side,0,0);
    }
    const lip=mesh(new THREE.BoxGeometry(1.06,.065,.17),trim,head);lip.position.y=-.38;
   }else if(p.type==='prism'){
    const prism=mesh(new THREE.ConeGeometry(.49,.78,3),glass,head);prism.rotation.y=Math.PI/6;
    const base=mesh(new THREE.CylinderGeometry(.32,.35,.08,3),glow,head);base.position.y=-.37;
   }else if(p.type==='filter'){
    const plate=mesh(new THREE.BoxGeometry(.9,.75,.12),glow,head);
    plate.material.transparent=true;plate.material.opacity=.72;
    const window=mesh(new THREE.BoxGeometry(.57,.48,.14),glass,head);window.position.z=.03;
   }else if(p.type==='splitter'){
    const plate=mesh(new THREE.BoxGeometry(.92,.64,.11),silver,head);
    const ring=torus(.23,.055,glow,head);ring.position.z=.09;ring.rotation.set(0,0,0);
   }else{
    const ring=torus(.34,.075,glow,head);ring.rotation.x=0;
    mesh(new THREE.IcosahedronGeometry(.2,1),silver,head);
   }
   torus(.50,.035,glow,g).position.y=.29;
  }
  g.traverse(c=>{if(c.isMesh){c.userData.piece=p;hitObjects.push(c)}});
  if(p===selected){
   const halo=torus(.66,.055,new THREE.MeshBasicMaterial({color:0xa5f1ff,transparent:true,opacity:.95,depthTest:false}),g);
   halo.position.y=.04;halo.renderOrder=20;
  }
 }
 // These are shared within this rebuild, but disposed next time by the group's
 // resource collector. Avoid disposing them before every piece has been rendered.
}
function rebuildBeams(){
 disposeGroupChildren(beamGroup);
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
 if(!currentResult.won&&won){won=false;$('win').classList.add('hidden')}
 if(currentResult.won&&!won){
  won=true;
  if(!solved.includes(levelIndex)){solved.push(levelIndex);store('chromatron-reborn-solved',JSON.stringify(solved))}
  updateStatus();
  const completedIndex=levelIndex;
  setTimeout(()=>{if(levelIndex===completedIndex&&won){$('win').classList.remove('hidden');beep(880,.15)}},250)
 }
}
function store(key,value){try{localStorage.setItem(key,value)}catch{}}
function updateStatus(){
 const el=$('level-status');
 el.textContent=solved.includes(levelIndex)?t(language,'statusSolved'):skipped.includes(levelIndex)?t(language,'statusSkipped'):'';
 el.classList.toggle('solved',solved.includes(levelIndex));
}
function updateLocalizedLevel(){
 const l=levels[levelIndex];if(!l)return;
 $('level-title').textContent=loc(l.title,language);
 $('level-desc').textContent=loc(l.description,language);
 $('prev').setAttribute('aria-label',language==='pl'?'Poprzednia zagadka':'Previous puzzle');
 $('next').setAttribute('aria-label',language==='pl'?'Następna zagadka':'Next puzzle');
 updateStatus();renderInventory();renderHints();renderAnalyzer();syncCameraLabel();
}
function setLanguage(next){
 language=normalizeLanguage(next);
 store('chromatron-reborn-language',language);
 applyLanguage(language);
 $('language').textContent=language.toUpperCase();
 updateLocalizedLevel();
}
function load(i){
 levelIndex=(i+levels.length)%levels.length;
 const l=levels[levelIndex];pieces=l.pieces.map(([type,x,y,rot,color])=>({id:++nextId,type,x,y,rot,color,inTray:Boolean(l.startMovablesInTray&&movable.has(type))}));
 selected=null;history=[];redoHistory=[];won=false;$('win').classList.add('hidden');
 $('hint-overlay').classList.add('hidden');
 try{hintCount=clampHints(localStorage.getItem(progressKey(levelIndex)))}catch{hintCount=0}
 $('level-index').textContent=String(levelIndex+1).padStart(3,'0');
 $('prev').disabled=levelIndex===0;$('next').disabled=levelIndex===levels.length-1;
 update();updateLocalizedLevel();syncUndoButtons();
 store('chromatron-reborn-level',String(levelIndex));
}
function update(){rebuildPieces();rebuildBeams();renderInventory();renderAnalyzer()}
function renderInventory(){
 const el=$('inventory');el.replaceChildren();
 for(const type of ['laser','mirror','bender','filter','prism','doppler','splitter','tangler','target','wall','conduit','teleporter']){
  const candidates=pieces.filter(p=>p.type===type);if(!candidates.length)continue;
  const tray=candidates.filter(p=>p.inTray);
  const movableType=movable.has(type);
  const item=document.createElement(movableType?'button':'div');
  item.className='inventory-item'+(movableType?' selectable':'');
  item.type=movableType?'button':undefined;
  if(movableType){
   item.setAttribute('aria-label',t(language,'type'+type[0].toUpperCase()+type.slice(1)));
   if(selected?.type===type)item.classList.add('selected');
   item.addEventListener('click',()=>{
    const first=tray[0]||candidates[0];
    if(first!==selected)select(first);
   });
  }
  const icon=document.createElement('span');icon.className='component-icon';
  icon.textContent=({laser:'↗',mirror:'◩',bender:'◢',filter:'◈',prism:'⬡',doppler:'◉',splitter:'◇',tangler:'⋈',target:'◎',wall:'▩',conduit:'▤',teleporter:'⊙'}[type]);
  const name=document.createElement('span');name.textContent=t(language,'type'+type[0].toUpperCase()+type.slice(1));
  const count=document.createElement('strong');
  count.textContent=tray.length?tray.length+' / '+candidates.length:String(candidates.length).padStart(2,'0');
  item.append(icon,name,count);el.appendChild(item);
 }
 $('return-tray').disabled=!(selected&&!selected.inTray&&movable.has(selected.type));
 renderSpectrum();
}
function renderSpectrum(){
 const panel=$('spectral-inspector');
 if(!panel)return;
 panel.classList.toggle('hidden',!spectrumActive);
 $('spectral-toggle').setAttribute('aria-expanded',String(spectrumActive));
 if(!spectrumActive)return;
 panel.replaceChildren();
 const makeBits=(mask)=>{
  const el=document.createElement('div');el.className='spectrum-bits';
  for(const [bit,label] of [[1,'R'],[2,'G'],[4,'B']]){
   const part=document.createElement('span');part.className='spectrum-bit '+(mask&bit?'on':'off')+' spectrum-'+label.toLowerCase();
   part.textContent=label;part.setAttribute('aria-label',label+': '+(mask&bit?'1':'0'));
   el.appendChild(part);
  }
  return el;
 };
 for(const part of pieces.filter(p=>!p.inTray&&(p.type==='laser'||p.type==='target'))){
  const row=document.createElement('div');row.className='spectrum-row';
  const heading=document.createElement('strong');
  heading.textContent=t(language,part.type==='laser'?'spectralSource':'spectralTarget')+' · '+(part.x+1)+','+(part.y+1);
  row.appendChild(heading);
  const lines=part.type==='laser'
   ? [[t(language,'spectralEmits'),part.color]]
   : [[t(language,'spectralNeed'),part.color],[t(language,'spectralReceived'),currentResult?.received.get(part.id)||0]];
  for(const [label,mask] of lines){
   const line=document.createElement('div');line.className='spectrum-line';
   const text=document.createElement('span');text.textContent=label;
   line.append(text,makeBits(mask));row.appendChild(line);
  }
  panel.appendChild(row);
 }
}

function syncAnalyzer(){
 $('analysis-panel').classList.toggle('hidden',!analysisActive);
 $('analysis-toggle').setAttribute('aria-pressed',String(analysisActive));
 $('analysis-panel').setAttribute('aria-label',t(language,'analysisHeading'));
}
function toggleAnalyzer(){
 analysisActive=!analysisActive;store('chromatron-reborn-analysis',analysisActive?'on':'off');
 renderAnalyzer();
}
function renderAnalyzer(){
 syncAnalyzer();
 if(!analysisActive||!currentResult)return;
 const data=inspectLight(pieces,currentResult),targetRoot=$('analysis-targets'),blocked=$('analysis-collisions');
 $('analysis-sources').textContent=String(data.lasers);
 $('analysis-segments').textContent=String(data.segments);
 targetRoot.replaceChildren();blocked.replaceChildren();
 for(const target of data.targets){
  const tile=document.createElement('article');tile.className='analysis-target';
  const header=document.createElement('div');header.className='analysis-target-header';
  const title=document.createElement('strong');title.textContent=(target.x+1)+','+(target.y+1);
  const status=document.createElement('span');status.className='analysis-target-state'+(target.correct?' ok':'');
  status.textContent=t(language,target.correct?'analysisCorrect':target.received?'analysisWrong':'analysisNoLight');
  header.append(title,status);tile.appendChild(header);
  for(const [label,mask] of [[t(language,'analysisNeed'),target.required],[t(language,'analysisReceived'),target.received]]){
   const line=document.createElement('div');line.className='analysis-target-detail';
   const caption=document.createElement('span');caption.textContent=label;
   const value=document.createElement('span');
   const dot=document.createElement('span');dot.className='color-swatch';dot.style.background=COLORS[mask];
   const color=document.createElement('span');color.textContent=colorName(mask,language)+(mask?' ['+channels(mask).join('+')+']':'');
   value.append(dot,color);line.append(caption,value);tile.appendChild(line);
  }
  targetRoot.appendChild(tile);
 }
 if(!data.collisions.length){const empty=document.createElement('p');empty.textContent=t(language,'analysisNone');blocked.append(empty)}
 for(const hit of data.collisions.slice(0,12)){
  const line=document.createElement('div');line.className='analysis-collision';
  const type='type'+hit.type[0].toUpperCase()+hit.type.slice(1);
  line.textContent=t(language,type)+' · '+(hit.x+1)+','+(hit.y+1)+' · '+colorName(hit.color,language);
  blocked.append(line);
 }
 const warning=$('analysis-warning');warning.classList.toggle('hidden',!data.unsupported.length&&!data.truncated);
 warning.textContent=t(language,'analysisWarning');
}
function snapshot(){return pieces.map(p=>({...p}))}
function syncUndoButtons(){
 $('undo').disabled=history.length===0;
 $('redo').disabled=redoHistory.length===0;
}
function saveHistory(){history.push(snapshot());if(history.length>100)history.shift();redoHistory=[];syncUndoButtons()}
function undo(){
 if(!history.length)return;
 const selection=selected?.id;
 redoHistory.push(snapshot());pieces=history.pop();
 selected=pieces.find(p=>p.id===selection)||null;
 update();syncUndoButtons();beep(410,.045);
}
function redo(){
 if(!redoHistory.length)return;
 const selection=selected?.id;
 history.push(snapshot());pieces=redoHistory.pop();
 selected=pieces.find(p=>p.id===selection)||null;
 update();syncUndoButtons();beep(580,.045);
}
function select(p){
 if(!movable.has(p.type)){toast(t(language,'selectLocked'));return}
 if(selected===p){if(!selected.inTray)rotate(1);return}
 selected=p;update();beep(420,.04)
}
function rotate(dir){
 if(!selected)return toast(t(language,'selectFirst'));
 saveHistory();selected.rot=(selected.rot+dir+8)%8;update();beep(540,.055)
}
function move(x,y){
 if(!selected)return;
 if(pieces.some(p=>!p.inTray&&p.x===x&&p.y===y)){toast(t(language,'cellOccupied'));return}
 if(!selected.inTray&&selected.x===x&&selected.y===y)return;
 saveHistory();selected.x=x;selected.y=y;selected.inTray=false;update();beep(620,.06)
}
function returnToTray(){
 if(!selected||selected.inTray||!movable.has(selected.type))return;
 saveHistory();selected.inTray=true;update();beep(390,.05);
}
let toastTimeout;
function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),2600)}
let ctx;
function beep(freq,duration){if(!audioEnabled)return;try{ctx??=new AudioContext();const o=ctx.createOscillator(),gain=ctx.createGain();o.type='sine';o.frequency.value=freq;gain.gain.setValueAtTime(.025,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(gain).connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration)}catch{}}

let cameraTween=null,cameraTop=false;
function syncCameraLabel(){
 $('camera-preset').setAttribute('aria-pressed',String(cameraTop));
 $('camera-preset-label').textContent=t(language,cameraTop?'analysisCameraIso':'analysisCameraTop');
}
function toggleCameraPreset(){
 cameraTop=!cameraTop;
 const nextYaw=cameraTop?0:-.58,nextPitch=cameraTop?1.49:1.10;
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
  cameraTween=null;yaw=nextYaw;pitch=nextPitch;updateCamera();
 }else cameraTween={yaw0:yaw,pitch0:pitch,yaw1:nextYaw,pitch1:nextPitch,time:performance.now()};
 syncCameraLabel();
}
function updateCamera(){
 const viewportWidth=innerWidth;
 // Portrait mode: fit a 15×15 board into the usable central viewport.
 const cameraDistance=dist*(viewportWidth<680?Math.max(1.55,720/Math.max(380,viewportWidth)):1);
 camera.position.set(Math.sin(yaw)*Math.cos(pitch)*cameraDistance,Math.sin(pitch)*cameraDistance,Math.cos(yaw)*Math.cos(pitch)*cameraDistance);
 camera.lookAt(cameraTarget);
}
function resize(){const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)}window.addEventListener('resize',resize);resize();updateCamera();
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function hit(clientX,clientY){mouse.set(clientX/innerWidth*2-1,-clientY/innerHeight*2+1);ray.setFromCamera(mouse,camera);const objs=ray.intersectObjects(hitObjects,false);if(objs.length)return {piece:objs[0].object.userData.piece};const point=new THREE.Vector3();if(ray.ray.intersectPlane(plane,point)){const x=Math.round(point.x/T+HALF),y=Math.round(point.z/T+HALF);if(x>=0&&x<GRID&&y>=0&&y<GRID)return {x,y}}return null}
let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;cameraTween=null;down={x:e.clientX,y:e.clientY,yaw,pitch,button:e.button,moved:false};renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.abs(dx)+Math.abs(dy)>7)down.moved=true;if(down.moved){yaw=down.yaw-dx*.005;pitch=Math.max(.3,Math.min(1.48,down.pitch+dy*.004));updateCamera()}});
renderer.domElement.addEventListener('pointerup',e=>{if(!down)return;const dragged=down.moved;down=null;if(dragged)return;const result=hit(e.clientX,e.clientY);if(!result)return;if(result.piece)select(result.piece);else if(selected)move(result.x,result.y)});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(19,Math.min(58,dist+e.deltaY*.023));updateCamera()},{passive:false});
document.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement)return;
 if(e.code==='Escape'){selected=null;update();$('help-overlay').classList.add('hidden');$('hint-overlay').classList.add('hidden');$('win').classList.add('hidden');return}
 if(!$('help-overlay').classList.contains('hidden')||!$('hint-overlay').classList.contains('hidden')||!$('win').classList.contains('hidden'))return;
 if(e.code==='KeyQ')rotate(-1);if(e.code==='KeyE'||e.code==='KeyR')rotate(1);
 if(e.code==='Backspace'||e.code==='Delete'){e.preventDefault();returnToTray()}
 if(e.code==='KeyV' && !e.ctrlKey){toggleAnalyzer();return}
 if(e.code==='KeyC' && !e.ctrlKey){toggleCameraPreset();return}
 if(e.code==='KeyH' && !e.ctrlKey){$('hint-overlay').classList.remove('hidden');renderHints()}
 if(e.code==='KeyL' && !e.ctrlKey){setLanguage(language==='pl'?'en':'pl')}
 if((e.code==='KeyZ'&&e.ctrlKey&&e.shiftKey)||(e.code==='KeyY'&&e.ctrlKey)){e.preventDefault();redo()}
 else if(e.code==='KeyZ'&&e.ctrlKey){e.preventDefault();undo()}
});
$('prev').onclick=()=>load(levelIndex-1);$('next').onclick=()=>load(levelIndex+1);
$('reset').onclick=()=>load(levelIndex);
$('undo').onclick=undo;$('redo').onclick=redo;
$('return-tray').onclick=returnToTray;
$('analysis-toggle').onclick=toggleAnalyzer;
$('analysis-close').onclick=toggleAnalyzer;
$('camera-preset').onclick=toggleCameraPreset;
$('spectral-toggle').onclick=()=>{spectrumActive=!spectrumActive;store('chromatron-reborn-spectrum',String(spectrumActive));renderSpectrum()};
$('continue').onclick=()=>load(levelIndex<levels.length-1?levelIndex+1:0);
$('language').onclick=()=>setLanguage(language==='pl'?'en':'pl');
$('hint').onclick=()=>{$('hint-overlay').classList.remove('hidden');renderHints()};
$('close-hint').onclick=()=>$('hint-overlay').classList.add('hidden');
$('reveal-hint').onclick=()=>{
 if(hintCount<3){hintCount=nextHint(hintCount);store(progressKey(levelIndex),String(hintCount));renderHints();beep(460,.09)}
 else toast(t(language,'allHints'));
};
$('skip-level').onclick=()=>{
 if(hintCount<3)return;
 if(levelIndex>=levels.length-1){toast(t(language,'lastLevel'));return}
 if(!skipped.includes(levelIndex)){skipped.push(levelIndex);store('chromatron-reborn-skipped',JSON.stringify(skipped))}
 load(levelIndex+1);toast(t(language,'skipNotice'))
};
$('help').onclick=()=>$('help-overlay').classList.remove('hidden');
$('close-help').onclick=()=>$('help-overlay').classList.add('hidden');
$('audio').onclick=()=>{audioEnabled=!audioEnabled;$('audio').classList.toggle('enabled',audioEnabled);beep(700,.08)};
let start=performance.now();
function animate(time){
 requestAnimationFrame(animate);
 if(cameraTween){
  const f=Math.max(0,Math.min(1,(time-cameraTween.time)/520)),ease=f*f*(3-2*f);
  yaw=cameraTween.yaw0+(cameraTween.yaw1-cameraTween.yaw0)*ease;
  pitch=cameraTween.pitch0+(cameraTween.pitch1-cameraTween.pitch0)*ease;
  if(f===1)cameraTween=null;
  updateCamera();
 }
 for(const p of componentGroup.children)for(const c of p.children)if(c.userData.spin)c.rotation.y=(time-start)*.001;
 for(const c of assistGroup.children)c.scale.setScalar(1+.09*Math.sin(time*.005));
 renderer.render(scene,camera);
}
function renderHints(){
 const root=$('hint-steps');
 if(!root)return;
 root.replaceChildren();
 for(let step=1;step<=hintCount;step++){
  const hint=hintFor(levels[levelIndex],language,step);
  if(!hint)continue;
  const block=document.createElement('section');block.className='hint-step';
  const header=document.createElement('div');header.className='eyebrow';header.textContent=t(language,'hintStep',{step})+' · '+hint.label;
  const copy=document.createElement('p');copy.textContent=hint.body;
  block.append(header,copy);root.appendChild(block);
 }
 // A board-space highlight appears only after the second hint.
 disposeGroupChildren(assistGroup);
 const focus=hintFor(levels[levelIndex],language,hintCount)?.focus;
 if(focus&&Number.isInteger(focus.x)&&Number.isInteger(focus.y)){
   const halo=torus(.48,.047,new THREE.MeshBasicMaterial({color:0xc992ff,transparent:true,opacity:.96,depthTest:false}),assistGroup);
   halo.position.copy(vec(focus.x,focus.y,.055));halo.renderOrder=20;
 }
 $('hint-badge').textContent=hintCount+'/3';
 $('reveal-hint').textContent=t(language,hintCount===0?'hintReveal':'hintAgain');
 $('reveal-hint').disabled=hintCount===3;
 $('skip-level').classList.toggle('hidden',hintCount<3 || levels.length<=1);
}
setLanguage(language);
load(Math.min(Math.max(saved,0),levels.length-1));requestAnimationFrame(animate);
// For QA / external validation, expose read-only state and import API.
window.chromatron={
 getState:()=>({level:levelIndex,pieces:pieces.map(p=>({...p})),result:{...currentResult,received:[...currentResult.received]}}),
 loadLevels(json){const parsed=typeof json==='string'?JSON.parse(json):json;levels=validateLevels(parsed);solved=[];skipped=[];load(0);toast(t(language,'imported',{count:levels.length}))},
 setLanguage,getLanguage:()=>language,getHints:()=>hintCount
};
