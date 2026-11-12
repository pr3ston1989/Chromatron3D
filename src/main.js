import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {PROTOTYPE_LEVELS,validateLevels} from './levels.js';
import {COLORS,DX,DY,trace,movable} from './optics.js';
import {inspectLight,colorName,channels} from './analysis.js';
import {applyLanguage,t,loc,normalizeLanguage} from './i18n.js';
import {clampHints,nextHint,hintFor,progressKey} from './hints.js';
import {disposeGroupChildren} from './dispose.js';
import {buildLaboratory} from './world-art.js';
import {opticIcon} from './optic-icons.js';
import {renderSelectionGuides} from './beam-guides.js';
import {renderLaserFX} from './laser-vfx.js';
import {classifyClick,isFreeCell,nextTrayPiece} from './interaction-model.js';
import './style.css';
import './redesign.css';
const $=id=>document.getElementById(id);
const GRID=15, HALF=7, T=1.3;
const scene=new THREE.Scene();scene.background=new THREE.Color('#0d1b2c');scene.fog=new THREE.FogExp2('#0d1b2c',0.008);
const camera=new THREE.PerspectiveCamera(40,1,.1,200);
const cameraTarget=new THREE.Vector3(0,0,0);
let yaw=-.58,pitch=1.10,dist=44;
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloomPass=new UnrealBloomPass(new THREE.Vector2(1,1),.52,.27,1.10);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

$('scene').appendChild(renderer.domElement);
const ambient=new THREE.AmbientLight(0xb0d7ef,.96);scene.add(ambient);
const key=new THREE.DirectionalLight(0xf0faff,1.85);key.position.set(-8,16,12);scene.add(key);
const fill=new THREE.PointLight(0x2c6bff,25,35);fill.position.set(9,9,-9);scene.add(fill);
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
const guideGroup=new THREE.Group();world.add(guideGroup);
const hitObjects=[];
let levels=validateLevels(PROTOTYPE_LEVELS),levelIndex=0,pieces=[],selected=null,history=[],redoHistory=[],currentResult=null,won=false,audioEnabled=false;
let language='pl',hintCount=0,solved=[],skipped=[],spectrumActive=false,analysisActive=false;
let coachDismissed=false,tutorialPlaced=false;
let placementMode=false,draggedPiece=null;
let saved=0;
try{
 saved=Number(localStorage.getItem('chromatron-reborn-level')||0);
 language=normalizeLanguage(localStorage.getItem('chromatron-reborn-language')||'pl');
 analysisActive=localStorage.getItem('chromatron-reborn-analysis')==='on';
 coachDismissed=localStorage.getItem('chromatron-coach-dismissed')==='yes';
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
   // Distinct directional photon emitter: a barrel, aperture and hot optical lens.
   const tower=mesh(new THREE.CylinderGeometry(.30,.37,.43,20),dark,g);tower.position.y=.38;
   const poweredRing=torus(.32,.055,glow,g);poweredRing.position.y=.56;
   const lens=mesh(new THREE.SphereGeometry(.16,16,12),glow,g);lens.position.y=.59;
   const nozzleAxis=new THREE.Vector3(DX[p.rot],0,DY[p.rot]).normalize();
   const orientation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),nozzleAxis);
   const nozzle=mesh(new THREE.CylinderGeometry(.17,.205,.59,20),silver,g);
   nozzle.quaternion.copy(orientation);
   nozzle.position.set(nozzleAxis.x*.34,.53,nozzleAxis.z*.34);
   const lensFace=mesh(new THREE.CylinderGeometry(.16,.16,.034,20),glow,g);
   lensFace.quaternion.copy(orientation);
   lensFace.position.set(nozzleAxis.x*.655,.53,nozzleAxis.z*.655);
   const aperture=mesh(new THREE.CylinderGeometry(.22,.22,.035,20),trim,g);
   aperture.quaternion.copy(orientation);
   aperture.position.set(nozzleAxis.x*.63,.53,nozzleAxis.z*.63);
   const flare=mesh(new THREE.SphereGeometry(.11,12,8),
     new THREE.MeshBasicMaterial({color:0xe8ffff,toneMapped:false}),g);
   flare.position.set(nozzleAxis.x*.70,.53,nozzleAxis.z*.70);
  }else if(p.type==='target'){
   const energized=currentResult?.received.get(p.id)===p.color;
   glow.emissiveIntensity=energized?5.2:1.7;
   const housing=mesh(new THREE.CylinderGeometry(.35,.42,.24,24),dark,g);housing.position.y=.27;
   const receiverRing=torus(.41,.074,energized?glow:silver,g);receiverRing.position.y=.40;
   torus(.29,.04,glow,g).position.y=.49;
   const crystal=mesh(new THREE.IcosahedronGeometry(energized ? .27 : .225,1),glow,g);
   crystal.position.y=.56;crystal.userData.spin=true;
   const frame=mesh(new THREE.CylinderGeometry(.47,.50,.05,28),trim,g);frame.position.y=.13;
  }else if(p.type==='wall'){
   // A proper light-blocking bulkhead with inset armored faces and safety marks.
   const wall=mesh(new THREE.BoxGeometry(1.05,.88,1.05),dark,g);wall.position.y=.48;
   const top=mesh(new THREE.BoxGeometry(1.11,.095,1.11),trim,g);top.position.y=.95;
   const panelMat=new THREE.MeshStandardMaterial({color:0x233848,metalness:.7,roughness:.42});
   for(const side of [-1,1]){
    const panel=mesh(new THREE.BoxGeometry(.83,.64,.035),panelMat,g);
    panel.position.set(0,.48,side*.545);
    const stripe=mesh(new THREE.BoxGeometry(.75,.065,.045),new THREE.MeshBasicMaterial({color:0xf9b45b}),g);
    stripe.position.set(0,.69,side*.576);
   }
   for(const x of [-.4,.4])for(const z of [-.4,.4]){
    const bolt=mesh(new THREE.CylinderGeometry(.052,.052,.025,8),trim,g);
    bolt.position.set(x,.995,z);
   }
  }else{
   const stem=mesh(new THREE.CylinderGeometry(.14,.19,.37,12),metal,g);stem.position.y=.36;
   const head=new THREE.Group();head.position.y=.65;head.rotation.y=-p.rot*Math.PI/4;g.add(head);
   if(p.type==='mirror'||p.type==='bender'){
    // Original rule: optic axis rot=0 runs NORTH-SOUTH, not East-West.
    // The forward-facing reflective surface is local -X; the back is dark +X.
    // At rot=1 an eastbound ray strikes the reflective NW face and goes NORTH.
    const support=mesh(new THREE.BoxGeometry(.19,.82,1.06),trim,head);support.position.y=.04;
    const front=mesh(new THREE.BoxGeometry(.026,.70,.95),silver,head);
    front.position.set(-.113,.065,0);
    const rearMat=new THREE.MeshStandardMaterial({color:0x081522,metalness:.35,roughness:.75});
    const rear=mesh(new THREE.BoxGeometry(.035,.71,.96),rearMat,head);
    rear.position.set(.116,.065,0);
    const edgeMat=new THREE.MeshBasicMaterial({color:p.type==='bender'?0xffc177:0x82eaff});
    for(const end of [-.53,.53]){
     const trimRail=mesh(new THREE.BoxGeometry(.21,.81,.045),edgeMat,head);
     trimRail.position.set(0,.045,end);
    }
    const lip=mesh(new THREE.BoxGeometry(.29,.064,1.16),trim,head);lip.position.y=-.39;
    // Long, thin line on the pedestal is the actual tangent of the mirror:
    // readable even from a near top-down camera. Cyan = reflective/front;
    // charcoal = opaque/back. Orientation matches the ray tracer.
    const surfaceFootprint=new THREE.Group();surfaceFootprint.rotation.y=-p.rot*Math.PI/4;
    surfaceFootprint.position.y=.205;g.add(surfaceFootprint);
    const frontMark=mesh(new THREE.BoxGeometry(.075,.025,1.14),
      new THREE.MeshBasicMaterial({color:0xc6f8ff,toneMapped:false}),surfaceFootprint);
    frontMark.position.x=-.12;
    const backMark=mesh(new THREE.BoxGeometry(.085,.028,1.14),
      new THREE.MeshBasicMaterial({color:0x152232}),surfaceFootprint);
    backMark.position.x=.12;
    const reflectionStrip=mesh(new THREE.BoxGeometry(.017,.52,.10),
      new THREE.MeshBasicMaterial({color:0xf0ffff,transparent:true,opacity:.88,toneMapped:false}),head);
    reflectionStrip.position.set(-.145,.13,-.25);
    if(p===selected){
     const outward=(p.rot+6)%8;
     const guide=new THREE.ArrowHelper(new THREE.Vector3(DX[outward],0,DY[outward]).normalize(),
       new THREE.Vector3(0,.88,0),.58,0x86ebff,.19,.11);
     g.add(guide);
    }
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
let laserVisuals=null;
function rebuildBeams(){
 if(laserVisuals)laserVisuals.dispose();
 disposeGroupChildren(beamGroup);
 currentResult=trace(pieces);
 laserVisuals=renderLaserFX(THREE,beamGroup,currentResult.segments,pieces,currentResult.received,COLORS,vec);
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
 updateStatus();renderInventory();renderHints();renderAnalyzer();syncCameraLabel();updateCoach();
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
 selected=null;placementMode=false;draggedPiece=null;history=[];redoHistory=[];won=false;tutorialPlaced=false;$('win').classList.add('hidden');
 $('hint-overlay').classList.add('hidden');
 try{hintCount=clampHints(localStorage.getItem(progressKey(levelIndex)))}catch{hintCount=0}
 $('level-index').textContent=String(levelIndex+1).padStart(3,'0');
 $('prev').disabled=levelIndex===0;$('next').disabled=levelIndex===levels.length-1;
 update();updateLocalizedLevel();syncUndoButtons();
 store('chromatron-reborn-level',String(levelIndex));
}
function rebuildSelectionGuides(){
 disposeGroupChildren(guideGroup);
 renderSelectionGuides(THREE,guideGroup,selected,currentResult?.segments||[],vec,COLORS,T);
}
function refreshSelection(){
 rebuildPieces();rebuildSelectionGuides();renderInventory();updateCoach();syncTransformTools();
 placementPreview.visible=false;
}
function update(){
 rebuildBeams();rebuildPieces();rebuildSelectionGuides();renderInventory();renderAnalyzer();updateCoach();syncTransformTools();
 placementPreview.visible=false;
}
function renderInventory(){
 const el=$('inventory');el.replaceChildren();
 for(const type of ['laser','mirror','bender','filter','prism','doppler','splitter','tangler','target','wall','conduit','teleporter']){
  const candidates=pieces.filter(p=>p.type===type);if(!candidates.length)continue;
  const tray=candidates.filter(p=>p.inTray);
  const movableType=movable.has(type);
  const item=document.createElement(movableType?'button':'div');
  item.className='inventory-item'+(movableType?' selectable':'');
  if(levelIndex===0&&!coachDismissed&&!selected&&type==='mirror'&&levels[0]?.startMovablesInTray)item.classList.add('coach-focus');
  item.type=movableType?'button':undefined;
  if(movableType){
   item.setAttribute('aria-label',t(language,'type'+type[0].toUpperCase()+type.slice(1)));
   if(selected?.type===type)item.classList.add('selected');
   item.disabled=tray.length===0;
   item.addEventListener('click',()=>{
    const first=nextTrayPiece(pieces,type);
    if(first)selectFromTray(first);
    else toast(t(language,'emptyTray'));
   });
   if(tray.length){item.draggable=true;item.addEventListener('dragstart',e=>{
    const piece=nextTrayPiece(pieces,type);
    if(piece){selected=piece;placementMode=true;updateCoach();syncTransformTools()}
    e.dataTransfer?.setData('text/plain','chromatron-optic');if(e.dataTransfer)e.dataTransfer.effectAllowed='move';
   })}
  }
  const icon=document.createElement('span');icon.className='component-icon';
  icon.innerHTML=opticIcon(type);
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
function updateCoach(){
 const coach=$('coach');
 const show=levelIndex===0&&!coachDismissed&&!currentResult?.won&&Boolean(levels[0]?.startMovablesInTray);
 coach.classList.toggle('hidden',!show);
 if(!show)return;
 // A single clear next action, rather than a wall of controls.
 const step=!selected&&!tutorialPlaced?0:selected?.inTray?1:2;
 $('coach-number').innerHTML=String(step+1).padStart(2,'0')+' <span>/ 03</span>';
 const label=['coachChoose','coachPlace','coachRotate'][step];
 $('coach-title').textContent=t(language,label);
 $('coach-detail').textContent=t(language,label+'Detail');
 $('coach').setAttribute('aria-label',t(language,label));
}
function syncTransformTools(){
 const tools=$('transform-tools');
 tools.classList.toggle('hidden',!selected);
 if(selected)$('transform-caption').textContent=t(language,placementMode?'placementCaption':'selectedCaption');
}
function clearSelection(){selected=null;placementMode=false;draggedPiece=null;refreshSelection()}
function selectFromTray(p){
 if(!p?.inTray||!movable.has(p.type))return;
 selected=p;placementMode=true;refreshSelection();beep(420,.04)
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
 placementMode=Boolean(selected?.inTray);
 update();syncUndoButtons();beep(410,.045);
}
function redo(){
 if(!redoHistory.length)return;
 const selection=selected?.id;
 history.push(snapshot());pieces=redoHistory.pop();
 selected=pieces.find(p=>p.id===selection)||null;
 placementMode=Boolean(selected?.inTray);
 update();syncUndoButtons();beep(580,.045);
}
function select(p){
 if(!movable.has(p.type)){toast(t(language,'selectLocked'));return}
 // Clicking the same optic again is intentionally inert: rotation is explicit.
 if(selected===p && !placementMode)return;
 selected=p;placementMode=Boolean(p.inTray);refreshSelection();beep(420,.04)
}
function rotate(dir){
 if(!selected)return toast(t(language,'selectFirst'));
 saveHistory();selected.rot=(selected.rot+dir+8)%8;update();beep(540,.055)
}
function move(x,y,fromDrag=false){
 if(!selected)return false;
 // An existing optic can move ONLY when the player physically drags it.
 if(!selected.inTray&&!fromDrag)return false;
 if(!isFreeCell(pieces,selected,x,y)){toast(t(language,'cellOccupied'));return false}
 if(!selected.inTray&&selected.x===x&&selected.y===y)return false;
 saveHistory();selected.x=x;selected.y=y;selected.inTray=false;
 placementMode=false;draggedPiece=null;tutorialPlaced=true;update();beep(620,.06);
 return true;
}
function returnToTray(){
 if(!selected||selected.inTray||!movable.has(selected.type))return;
 saveHistory();selected.inTray=true;placementMode=false;selected=null;update();beep(390,.05);
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
function resize(){const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h)}window.addEventListener('resize',resize);resize();updateCamera();
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function cellAt(clientX,clientY){
 mouse.set(clientX/innerWidth*2-1,-clientY/innerHeight*2+1);
 ray.setFromCamera(mouse,camera);
 const pt=new THREE.Vector3();
 if(!ray.ray.intersectPlane(plane,pt))return null;
 const x=Math.round(pt.x/T+HALF),y=Math.round(pt.z/T+HALF);
 return x>=0&&x<GRID&&y>=0&&y<GRID?{x,y}:null;
}
function hit(clientX,clientY){
 mouse.set(clientX/innerWidth*2-1,-clientY/innerHeight*2+1);
 ray.setFromCamera(mouse,camera);
 const objs=ray.intersectObjects(hitObjects,false);
 if(objs.length)return {piece:objs[0].object.userData.piece};
 // Optical pieces are thin; a click anywhere inside their whole grid cell
 // must still pick that identity. This creates a forgiving, stable hit target.
 const cell=cellAt(clientX,clientY);
 if(!cell)return null;
 const occupant=pieces.find(p=>!p.inTray && p.x===cell.x && p.y===cell.y);
 return occupant?{piece:occupant}:cell;
}
const previewMat=new THREE.MeshBasicMaterial({color:0x69e6ff,transparent:true,opacity:.25,depthWrite:false,depthTest:false});
const placementPreview=mesh(new THREE.BoxGeometry(T*.90,.025,T*.90),previewMat,world);
placementPreview.visible=false;placementPreview.renderOrder=18;
const previewEdgeMat=new THREE.LineBasicMaterial({color:0x8ce9ff,depthTest:false});
const previewEdge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(T*.92,.04,T*.92)),previewEdgeMat);
placementPreview.add(previewEdge);
// A translucent, correctly oriented 3D silhouette follows the cursor while
// placing or dragging. The player sees the OPTIC, not just a highlighted tile.
const ghostMirror=new THREE.Group();
placementPreview.add(ghostMirror);
const ghostMat=new THREE.MeshBasicMaterial({
 color:0xa7f3ff,transparent:true,opacity:.43,depthWrite:false,depthTest:false,side:THREE.DoubleSide
});
const ghostStand=new THREE.Mesh(new THREE.CylinderGeometry(.40,.45,.15,12),ghostMat);
ghostStand.position.y=.18;ghostMirror.add(ghostStand);
const ghostHead=new THREE.Group();ghostHead.position.y=.64;ghostMirror.add(ghostHead);
const ghostPlate=new THREE.Mesh(new THREE.BoxGeometry(.13,.67,.99),ghostMat);
ghostHead.add(ghostPlate);
const ghostFace=new THREE.Mesh(new THREE.BoxGeometry(.035,.62,.90),
 new THREE.MeshBasicMaterial({color:0xe2fdff,transparent:true,opacity:.78,depthWrite:false,depthTest:false}));
ghostFace.position.x=-.09;ghostHead.add(ghostFace);

function updatePlacementPreview(e){
 if(!selected||(!placementMode&&!draggedPiece)){placementPreview.visible=false;return}
 mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);
 ray.setFromCamera(mouse,camera);
 const point=new THREE.Vector3();
 if(!ray.ray.intersectPlane(plane,point)){placementPreview.visible=false;return}
 const x=Math.round(point.x/T+HALF),y=Math.round(point.z/T+HALF);
 if(x<0||x>=GRID||y<0||y>=GRID){placementPreview.visible=false;return}
 const occupied=pieces.some(p=>!p.inTray&&p!==selected&&p.x===x&&p.y===y);
 previewMat.color.setHex(occupied?0xff728c:0x72eac1);
 previewEdgeMat.color.setHex(occupied?0xff728c:0xa8f9d3);
 placementPreview.position.copy(vec(x,y,.075));
 ghostHead.rotation.y=-selected.rot*Math.PI/4;
 ghostMat.color.setHex(occupied?0xff8fa7:0xa7f3ff);
 ghostMirror.visible=selected.type==='mirror'||selected.type==='bender';
 placementPreview.visible=true;
}
let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{
 if(e.button!==0&&e.button!==2)return;
 cameraTween=null;
 const origin=hit(e.clientX,e.clientY);
 // Place a tray optic on pointerdown. The action is deterministic even under
 // low frame rates or an interrupted pointer capture; it also feels immediate.
 if(e.button===0 && placementMode && selected?.inTray && origin &&
    Number.isInteger(origin.x) && Number.isInteger(origin.y)){
  move(origin.x,origin.y);
  down=null;
  return;
 }
 const draggingCandidate=e.button===0 && origin?.piece && movable.has(origin.piece.type);
 down={x:e.clientX,y:e.clientY,yaw,pitch,button:e.button,moved:false,
       mode:draggingCandidate?'piece':'orbit',origin};
 if(draggingCandidate)select(origin.piece);
 renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(!down){
  updatePlacementPreview(e);
  const hovered=hit(e.clientX,e.clientY);
  renderer.domElement.style.cursor=hovered?.piece&&movable.has(hovered.piece.type)?'grab':placementMode?'crosshair':'default';
  return;
 }
 const dx=e.clientX-down.x,dy=e.clientY-down.y;
 if(Math.abs(dx)+Math.abs(dy)>7)down.moved=true;
 if(!down.moved)return;
 if(down.mode==='piece'){
  draggedPiece=down.origin.piece;
  renderer.domElement.style.cursor='grabbing';
  updatePlacementPreview(e);
  return;
 }
 // Orbiting requires a drag on the empty board, not on an optic.
 if(down.button===0){
  yaw=down.yaw-dx*.0045;pitch=Math.max(.35,Math.min(1.49,down.pitch+dy*.004));
  updateCamera();
 }
});
renderer.domElement.addEventListener('pointerup',e=>{
 if(!down)return;
 const state=down;down=null;
 if(state.button===2){clearSelection();return}
 if(state.moved){
  if(state.mode==='piece'){
   const dest=cellAt(e.clientX,e.clientY);
   if(dest){selected=state.origin.piece;move(dest.x,dest.y,true)}
  }
  draggedPiece=null;placementPreview.visible=false;
  renderer.domElement.style.cursor='default';
  return;
 }
 // Clicking an optic only selects it. Clicking elsewhere only places a
 // tray optic, otherwise it cancels selection (never warps an existing optic).
 const target=hit(e.clientX,e.clientY);
 const intent=classifyClick(target,selected,placementMode);
 if(intent.action==='select')select(intent.piece);
 else if(intent.action==='place')move(intent.x,intent.y);
 else if(selected)clearSelection();
});
renderer.domElement.addEventListener('pointercancel',()=>{
 down=null;draggedPiece=null;placementPreview.visible=false;
});
renderer.domElement.addEventListener('pointerleave',()=>{if(!down)placementPreview.visible=false});
renderer.domElement.addEventListener('dragover',e=>{
 if(placementMode&&selected?.inTray){e.preventDefault();updatePlacementPreview(e)}
});
renderer.domElement.addEventListener('drop',e=>{
 e.preventDefault();const dest=cellAt(e.clientX,e.clientY);
 if(placementMode && selected?.inTray && dest)move(dest.x,dest.y);
 placementPreview.visible=false;
});
renderer.domElement.addEventListener('contextmenu',e=>{e.preventDefault();clearSelection()});
let wheelDelta=0;
renderer.domElement.addEventListener('wheel',e=>{
 e.preventDefault();
 if(selected&&!e.shiftKey){
  wheelDelta+=e.deltaY;
  if(Math.abs(wheelDelta)>=55){rotate(wheelDelta>0?1:-1);wheelDelta=0}
 }else{
  wheelDelta=0;
  dist=Math.max(22,Math.min(60,dist+e.deltaY*.021));updateCamera();
 }
},{passive:false});
document.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement)return;
 if(e.code==='Escape'){clearSelection();$('help-overlay').classList.add('hidden');$('hint-overlay').classList.add('hidden');$('win').classList.add('hidden');return}
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
$('turn-left').onclick=()=>rotate(-1);
$('turn-right').onclick=()=>rotate(1);
$('cancel-selection').onclick=clearSelection;
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
$('coach-dismiss').onclick=()=>{coachDismissed=true;store('chromatron-coach-dismissed','yes');updateCoach();renderInventory()};
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
 if(laserVisuals)laserVisuals.update(time*.001);
 composer.render();
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
 getState:()=>({level:levelIndex,pieces:pieces.map(p=>({...p})),selectedId:selected?.id??null,placementMode,result:{...currentResult,received:[...currentResult.received]}}),
 projectCell(x,y,height=0){const v=vec(x,y,height).project(camera);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2}},
 inspectPointer(clientX,clientY){const h=hit(clientX,clientY);const c=classifyClick(h,selected,placementMode);return {hit:h?.piece?{pieceId:h.piece.id,pieceType:h.piece.type}:h,intent:c.action,selectedId:selected?.id??null,placementMode}},
 loadLevels(json){const parsed=typeof json==='string'?JSON.parse(json):json;levels=validateLevels(parsed);solved=[];skipped=[];load(0);toast(t(language,'imported',{count:levels.length}))},
 setLanguage,getLanguage:()=>language,getHints:()=>hintCount
};
