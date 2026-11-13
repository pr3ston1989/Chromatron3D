import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {PROTOTYPE_LEVELS,validateLevels} from './levels.js';
import {COLORS,DX,DY,trace,movable} from './optics.js';
import {inspectLight,colorName,channels} from './analysis.js';
import {applyLanguage,t,loc,normalizeLanguage} from './i18n.js';
import {clampHints,hintFor,progressKey} from './hints.js';
import {normalizeWallet,packFingerprint,stageKey,rewardOnce,ensurePreviousHints,buyNextHint,HINT_COSTS} from './hint-economy.js';
import {verifyPuzzleSolution} from './puzzle-solver.js';
import {contextualHint} from './hint-assistant.js';
import {loadLevelBundle,convertClassicCollection} from './classic-import.js';
import {extractChromatron1Executable} from './classic-exe.js';
import {disposeGroupChildren} from './dispose.js';
import {buildLaboratory} from './world-art.js';
import {createSpaceEnvironments} from './world-biomes.js';
import {buildLevelAtlas} from './level-atlas.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {opticIcon} from './optic-icons.js';
import {opticDescription,opticExample} from './optic-help.js';
import {renderSelectionGuides} from './beam-guides.js';
import {renderLaserFX} from './laser-vfx.js';
import {createVictoryFX} from './victory-vfx.js';
import {mountRealMirror,disposeReflectionTargets} from './mirror-reflections.js';
import {createMirrorHardware} from './mirror-asset.js';
import {applyOpticFinish} from './optic-textures.js';
import {detailEmitter,detailResonator} from './optical-assets.js';
import {normalizeQuality,profileFor,reflectionCandidates,nextAutoProfile} from './visual-quality.js';
import {easeOutCubic,shortestAngle,travelDuration} from './optic-motion.js';
import {applyOpticTween,enqueueOpticTween} from './optic-tween-clock.js';
import {classifyClick,isFreeCell,nextTrayPiece} from './interaction-model.js';
import {createSelectionReticle} from './selection-reticle.js';
import {createOpticContactShadows} from './optic-contact-shadows.js';
import {createWheelRotation,toWheelPixels} from './wheel-rotation.js';
import './style.css';
import './redesign.css';
import './compact-layout.css';
import './level-atlas.css';
const $=id=>document.getElementById(id);
const GRID=15, HALF=7, T=1.3;
const scene=new THREE.Scene();scene.background=new THREE.Color('#0d1b2c');scene.fog=new THREE.FogExp2('#0d1b2c',0.008);
const camera=new THREE.PerspectiveCamera(40,1,.1,200);
const cameraTarget=new THREE.Vector3(0,0,0);
let yaw=-1.05,pitch=1.10,dist=44;
let zoomTarget=44,zoomLastFrame=0;
let boardFocus=false;
try{boardFocus=localStorage.getItem('chromatron-board-focus')==='yes'}catch{}
let graphicsMode='auto',autoLevel='balanced';
try{graphicsMode=normalizeQuality(localStorage.getItem('chromatron-graphics-quality'))}catch{}
let graphicsProfile=profileFor(graphicsMode,autoLevel);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,graphicsProfile.pixelRatio));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;
// Physically based studio reflections: low-roughness metals and mirror fronts
// need environment radiance to look like metal instead of unlit gray plastic.
const studioEnvironment=new RoomEnvironment();
const pmremGenerator=new THREE.PMREMGenerator(renderer);
const studioMap=pmremGenerator.fromScene(studioEnvironment,.04);
scene.environment=studioMap.texture;
scene.environmentIntensity=.48;
studioEnvironment.dispose();
pmremGenerator.dispose();
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloomPass=new UnrealBloomPass(new THREE.Vector2(1,1),graphicsProfile.bloomStrength,.27,1.10);
composer.addPass(bloomPass);
// WebGL's canvas antialias flag does not smooth postprocessed render targets.
// Use native postprocessing AA: inexpensive FXAA for laptops, SMAA for HQ.
const fxaaPass=new ShaderPass(FXAAShader);
const smaaPass=new SMAAPass();
fxaaPass.enabled=graphicsProfile.antialias==='fxaa';
smaaPass.enabled=graphicsProfile.antialias==='smaa';
composer.addPass(fxaaPass);
composer.addPass(smaaPass);
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
const deck=mesh(new RoundedBoxGeometry(21,.75,21,4,.26),new THREE.MeshStandardMaterial({color:0x0a1324,metalness:.65,roughness:.32}));deck.position.y=-.62;
const gridGroup=new THREE.Group();world.add(gridGroup);
// Two instanced draw calls replace 450 independent tile/line meshes.
// This preserves every logical cell and its coloring while keeping GPU headroom.
const tileMaterial=new THREE.MeshStandardMaterial({color:0xffffff,metalness:.48,roughness:.48});
applyOpticFinish(THREE,tileMaterial,'brushed');
const boardTiles=new THREE.InstancedMesh(tileGeo,tileMaterial,GRID*GRID);
const lineGeometry=new THREE.BoxGeometry(T*.88,.012,.016);
const boardLines=new THREE.InstancedMesh(lineGeometry,new THREE.MeshBasicMaterial({
 color:0x73abc4,transparent:true,opacity:.68,depthWrite:false
}),GRID*GRID);
const transform=new THREE.Object3D();
let tileIndex=0;
for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){
 transform.position.set((x-HALF)*T,-.12,(y-HALF)*T);
 transform.updateMatrix();
 boardTiles.setMatrixAt(tileIndex,transform.matrix);
 boardTiles.setColorAt(tileIndex,new THREE.Color((x+y)%2?0x263f53:0x2b465a));
 transform.position.set((x-HALF)*T,.002,(y-HALF)*T-T*.44);
 transform.updateMatrix();
 boardLines.setMatrixAt(tileIndex,transform.matrix);
 tileIndex++;
}
boardTiles.instanceMatrix.needsUpdate=true;
boardTiles.instanceColor.needsUpdate=true;
boardLines.instanceMatrix.needsUpdate=true;
gridGroup.add(boardTiles,boardLines);
const laboratory=buildLaboratory(THREE,scene,world,T);
const spaceEnvironments=createSpaceEnvironments(THREE,scene,world,{tileSize:T});
const environmentSessionSeed=Math.floor(Math.random()*0x7fffffff);
let activeEnvironment=null;
function applyLevelEnvironment(){
 const theme=spaceEnvironments.setLevel(currentPackId,levelIndex,{seed:environmentSessionSeed});
 activeEnvironment=theme;
 laboratory.userData.setTheme(theme,{packId:currentPackId,index:levelIndex,seed:environmentSessionSeed});
 deck.material.color.setHex(theme.tileB);
 const color=new THREE.Color();
 for(let n=0;n<GRID*GRID;n++){
  color.setHex(Math.floor(n/GRID)+n%GRID&1?theme.tileA:theme.tileB);
  boardTiles.setColorAt(n,color);
 }
 boardTiles.instanceColor.needsUpdate=true;
 return theme;
}
const componentGroup=new THREE.Group();world.add(componentGroup);
const opticShadows=createOpticContactShadows(THREE,world,{tileSize:T,half:HALF});
let componentRebuilds=0;
const opticTweens=[];
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const beamGroup=new THREE.Group();world.add(beamGroup);
const assistGroup=new THREE.Group();world.add(assistGroup);
const guideGroup=new THREE.Group();world.add(guideGroup);
const selectionReticle=createSelectionReticle(THREE,world,(x,y,height)=>new THREE.Vector3((x-HALF)*T,height,(y-HALF)*T),T);
const wheelRotation=createWheelRotation();
const hitObjects=[];
let levels=validateLevels(PROTOTYPE_LEVELS),levelIndex=0,pieces=[],selected=null,history=[],redoHistory=[],currentResult=null,won=false,audioEnabled=false;
let language='pl',hintCount=0,solved=[],skipped=[],spectrumActive=false,analysisActive=false;
let wallet=normalizeWallet(null);
let currentPackId=packFingerprint(levels);
const demoPackId=currentPackId;
const verifiedSolutions=new Map();
let hintWorker=null,solvingId=null,solverStatus='';
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
 wallet=normalizeWallet(localStorage.getItem('chromatron-reborn-credit-wallet'));
 if(!Array.isArray(solved))solved=[];
 if(!Array.isArray(skipped))skipped=[];
}catch{}
for(const level of solved){
 if(Number.isInteger(level)&&level>=0&&level<levels.length)
  wallet=rewardOnce(wallet,stageKey(currentPackId,level)).wallet;
}
try{localStorage.setItem('chromatron-reborn-credit-wallet',JSON.stringify(wallet))}catch{}
// The old prototype allowed direct navigation to any level. Preserve the
// last previously visited level once, even if the new atlas locks later ones.
let accessFloor=0;
try{
 const key='chromatron-reborn-access-'+currentPackId;
 const previous=localStorage.getItem(key);
 const value=previous===null?saved:Number(previous);
 accessFloor=Number.isFinite(value)?Math.min(levels.length-1,Math.max(0,Math.trunc(value))):0;
 if(previous===null)store(key,String(accessFloor));
}catch{}
let nextId=0;
const vec=(x,y,height=.3)=>new THREE.Vector3((x-HALF)*T,height,(y-HALF)*T);
const matColor=color=>new THREE.MeshStandardMaterial({color:new THREE.Color(COLORS[color||7]),emissive:new THREE.Color(COLORS[color||7]),emissiveIntensity:1.8,metalness:.3,roughness:.18});
function torus(radius,tube,mat,parent,rotation=Math.PI/2){const a=mesh(new THREE.TorusGeometry(radius,tube,10,48),mat,parent);a.rotation.x=rotation;return a}
// Original premium optic meshes: luminous emitters, crystal targets and readable reflective mirrors.
function rebuildPieces(){
 opticShadows.update(pieces);
 componentRebuilds++;
 // Capture current *visual* poses before rebuilding so interaction remains
 // responsive while optical hardware glides and rotates smoothly.
 const previous=new Map();
 for(const obj of componentGroup.children){
  if(!obj.userData.piece)continue;
  const head=obj.children.find(c=>c.userData.motionHead);
  previous.set(obj.userData.piece.id,{position:obj.position.clone(),rotation:head?.rotation.y});
 }
 opticTweens.length=0;
 const frameTime=performance.now();
 // Planar reflections own GPU render targets in addition to their meshes.
 disposeReflectionTargets(componentGroup);
 disposeGroupChildren(componentGroup,new Set([metal,dark,cyan]));
 hitObjects.length=0;
 const reflectingIds=new Set(reflectionCandidates(pieces,selected,graphicsProfile.reflectorCount).map(p=>p.id));
 const silver=new THREE.MeshPhysicalMaterial({color:0xd3f6ff,metalness:.86,roughness:.11,clearcoat:1,clearcoatRoughness:.08,emissive:0x18415a,emissiveIntensity:.22,side:THREE.DoubleSide});
 const trim=new THREE.MeshStandardMaterial({color:0x587991,metalness:.82,roughness:.22});
 const glass=new THREE.MeshPhysicalMaterial({color:0x97eaff,metalness:.42,roughness:.12,transparent:true,opacity:.83,clearcoat:1,side:THREE.DoubleSide});
 applyOpticFinish(THREE,silver,'polished');
 applyOpticFinish(THREE,trim,'brushed');
 for(const p of pieces){
  if(p.inTray)continue;
  const g=new THREE.Group();g.position.copy(vec(p.x,p.y,.24));g.userData.piece=p;componentGroup.add(g);
  const color=new THREE.Color(COLORS[p.color||7]);
  const glow=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2.3,metalness:.24,roughness:.18});
  const base=mesh(new THREE.CylinderGeometry(.53,.60,.24,12),metal,g);base.position.y=.025;
  const foot=mesh(new THREE.CylinderGeometry(.47,.49,.06,24),trim,g);foot.position.y=.17;
  const outlineMaterial=new THREE.MeshBasicMaterial({color:0x467e96,transparent:true,opacity:.43});
  const outline=torus(.48,.030,outlineMaterial,g);
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
   detailEmitter(THREE,g,p.rot,color);
  }else if(p.type==='target'){
   const energized=currentResult?.received.get(p.id)===p.color;
   glow.emissiveIntensity=energized?5.2:1.7;
   const housing=mesh(new THREE.CylinderGeometry(.35,.42,.24,24),dark,g);housing.position.y=.27;
   const receiverRing=torus(.41,.074,energized?glow:silver,g);receiverRing.position.y=.40;
   torus(.29,.04,glow,g).position.y=.49;
   const crystal=mesh(new THREE.IcosahedronGeometry(energized ? .27 : .225,1),glow,g);
   crystal.position.y=.56;crystal.userData.spin=true;
   const frame=mesh(new THREE.CylinderGeometry(.47,.50,.05,28),trim,g);frame.position.y=.13;
   const detail=detailResonator(THREE,g,{color,active:energized});
   g.userData.targetVisual={glow,crystal,receiverRing,silver,detail,active:energized};
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
   const head=new THREE.Group();head.position.y=.65;head.rotation.y=-p.rot*Math.PI/4;
   head.userData.motionHead=true;g.add(head);
   if(p.type==='mirror'||p.type==='bender'){
    // Original rule: optic axis rot=0 runs NORTH-SOUTH, not East-West.
    // The forward-facing reflective surface is local -X; the back is dark +X.
    // At rot=1 an eastbound ray strikes the reflective NW face and goes NORTH.
    const support=mesh(new THREE.BoxGeometry(.19,1.04,1.15),trim,head);support.position.y=.09;
    const front=mesh(new THREE.BoxGeometry(.026,.93,1.06),silver,head);
    front.position.set(-.113,.065,0);
    // The interactive mirror's silvered front receives a real reflection of
    // the 3D scene. The other faces retain PBR environment reflections.
    if(reflectingIds.has(p.id))mountRealMirror(THREE,head,graphicsProfile.reflectionSize);
    // Modular optical hardware: chamfered machined rails, captive screws, opaque carbon back.
    createMirrorHardware(THREE,head,{bender:p.type==='bender'});
    // Long, thin line on the pedestal is the actual tangent of the mirror:
    // readable even from a near top-down camera. Cyan = reflective/front;
    // charcoal = opaque/back. Orientation matches the ray tracer.
    const surfaceFootprint=new THREE.Group();surfaceFootprint.rotation.y=-p.rot*Math.PI/4;
    surfaceFootprint.userData.motionFootprint=true;
    surfaceFootprint.position.y=.205;g.add(surfaceFootprint);
    const frontMark=mesh(new THREE.BoxGeometry(.14,.035,1.14),
      new THREE.MeshBasicMaterial({color:0xc6f8ff,toneMapped:false}),surfaceFootprint);
    frontMark.position.x=-.12;
    const backMark=mesh(new THREE.BoxGeometry(.14,.036,1.14),
      new THREE.MeshBasicMaterial({color:0x152232}),surfaceFootprint);
    backMark.position.x=.12;
    const reflectionStrip=mesh(new THREE.BoxGeometry(.017,.60,.07),
      new THREE.MeshBasicMaterial({color:0xf0ffff,transparent:true,opacity:.88,toneMapped:false}),head);
    reflectionStrip.position.set(-.145,.13,-.25);
    // Incoming/outgoing beam arrows live in the independent guidance layer.
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
   const baseRingMaterial=p.type==='mirror'?new THREE.MeshBasicMaterial({color:0x417fa1,transparent:true,opacity:.78}):glow;
   torus(.50,.03,baseRingMaterial,g).position.y=.29;
  }
  g.traverse(c=>{if(c.isMesh){c.userData.piece=p;hitObjects.push(c)}});
  // Precise four-corner reticle is shared by all optics, never rebuilt.
  // Animate the model, not its logical placement. The ray tracer resolves
  // instantly; the optical hardware settles with an unobtrusive ease-out.
  if(!reducedMotion.matches){
   const old=previous.get(p.id);
   if(old){
    const target=g.position.clone(),distance=old.position.distanceTo(target);
    if(distance>.002){
     g.position.copy(old.position);
     enqueueOpticTween(opticTweens,{object:g,kind:'move',from:old.position,to:target,
       start:frameTime,duration:travelDuration(distance/T)},setTimeout);
    }
    const rotHead=g.children.find(c=>c.userData.motionHead);
    if(rotHead&&Number.isFinite(old.rotation)){
     const final=rotHead.rotation.y,delta=shortestAngle(old.rotation,final);
     if(Math.abs(delta)>.001){
      rotHead.rotation.y=old.rotation;
      const footprint=g.children.find(c=>c.userData.motionFootprint);
      if(footprint)footprint.rotation.y=old.rotation;
      enqueueOpticTween(opticTweens,{object:rotHead,footprint,kind:'rotate',from:old.rotation,
        to:old.rotation+delta,start:frameTime,duration:225},setTimeout);
     }
    }
   }else{
    g.position.y-=.18;g.scale.setScalar(.62);
    enqueueOpticTween(opticTweens,{object:g,kind:'appear',start:frameTime,duration:245,
      toY:g.position.y+.18},setTimeout);
   }
  }
 }
 // These are shared within this rebuild, but disposed next time by the group's
 // resource collector. Avoid disposing them before every piece has been rendered.
}
let laserVisuals=null,victoryFX=null,victorySince=0;
function currentLevelKey(){return stageKey(currentPackId,levelIndex)}
function saveWallet(){
 store('chromatron-reborn-credit-wallet',JSON.stringify(wallet));
 syncWalletUI();
}
function syncWalletUI(){
 $('hint-credits').textContent=String(wallet.balance);
 $('modal-credits').textContent=String(wallet.balance);
}
function verifiedSolutionForCurrent(){
 const level=levels[levelIndex];
 const provided=level.solution;
 if(provided&&verifyPuzzleSolution(level,provided).valid)return provided;
 const cached=verifiedSolutions.get(currentLevelKey());
 return cached&&verifyPuzzleSolution(level,cached).valid?cached:null;
}
function cancelSolutionSearch(){
 if(hintWorker){hintWorker.terminate();hintWorker=null}
 solvingId=null;solverStatus='';
}
function requestSolutionSearch(){
 const id=currentLevelKey();
 if(verifiedSolutionForCurrent()||solvingId===id||!globalThis.Worker)return;
 cancelSolutionSearch();
 solverStatus='running';solvingId=id;
 try{
  hintWorker=new Worker(new URL('./solver-worker.js',import.meta.url),{type:'module'});
  hintWorker.onmessage=event=>{
   if(event.data?.id!==solvingId)return;
   const answer=event.data;
   cancelSolutionSearch();
   if(answer.status==='solved'&&answer.solution&&
      verifyPuzzleSolution(levels[levelIndex],answer.solution).valid){
    verifiedSolutions.set(id,answer.solution);solverStatus='verified';
   }else solverStatus=answer.status||'unsupported';
   if(!$('hint-overlay').classList.contains('hidden'))renderHints();
  };
  hintWorker.onerror=()=>{
   cancelSolutionSearch();solverStatus='error';
   if(!$('hint-overlay').classList.contains('hidden'))renderHints();
  };
  hintWorker.postMessage({id,level:levels[levelIndex],maxChecks:20000});
 }catch(error){
  cancelSolutionSearch();solverStatus='error';
 }
}
function rebuildBeams(){
 if(laserVisuals)laserVisuals.dispose();
 disposeGroupChildren(beamGroup);
 currentResult=trace(pieces);
 laserVisuals=renderLaserFX(THREE,beamGroup,currentResult.segments,pieces,currentResult.received,COLORS,vec,graphicsProfile);
 $('counter').textContent=currentResult.active+' / '+currentResult.total;
 $('progress').style.width=(currentResult.total?currentResult.active/currentResult.total*100:0)+'%';
 if(!currentResult.won&&won){won=false;$('win').classList.add('hidden');if(victoryFX){victoryFX.dispose();victoryFX=null}}
 if(currentResult.won&&!won){
  won=true;
  if(victoryFX)victoryFX.dispose();
  victoryFX=createVictoryFX(THREE,world,pieces,COLORS,vec);
  victorySince=performance.now();
  if(!solved.includes(levelIndex)){
   solved.push(levelIndex);
   store('chromatron-reborn-solved-'+currentPackId,JSON.stringify(solved));
   if(currentPackId===demoPackId)store('chromatron-reborn-solved',JSON.stringify(solved));
  }
  const earned=rewardOnce(wallet,currentLevelKey());
  wallet=earned.wallet;saveWallet();
  $('win-reward').textContent=earned.awarded?
   t(language,'earnedCredits',{amount:earned.awarded}):t(language,'noRewardRepeat');
  updateStatus();syncLevelControls();renderLevelAtlas();
  const completedIndex=levelIndex;
  setTimeout(()=>{if(levelIndex===completedIndex&&won){$('win').classList.remove('hidden');beep(880,.15)}},650)
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
 $('level-pack-label').textContent=t(language,currentPackId===demoPackId?'prototype':'classicPack');
 $('prev').setAttribute('aria-label',language==='pl'?'Poprzednia zagadka':'Previous puzzle');
 $('next').setAttribute('aria-label',language==='pl'?'Następna zagadka':'Next puzzle');
 updateStatus();renderInventory();renderHints();renderAnalyzer();syncCameraLabel();updateCoach();
}
function setLanguage(next){
 language=normalizeLanguage(next);
 store('chromatron-reborn-language',language);
 applyLanguage(language);
 syncFullscreenButton();syncBoardFocus();
 $('language').textContent=language.toUpperCase();
 updateLocalizedLevel();
}
function switchLevelPack(nextLevels){
 if(!Array.isArray(nextLevels)||!nextLevels.length||nextLevels.length>250)
  throw new Error('Expected 1–250 validated puzzles');
 // Preserve earlier progress separately; a user's privately imported pack
 // must not overwrite achievements from the eight bundled demonstrations.
 store('chromatron-reborn-solved-'+currentPackId,JSON.stringify(solved));
 store('chromatron-reborn-skipped-'+currentPackId,JSON.stringify(skipped));
 levels=nextLevels;currentPackId=packFingerprint(levels);
 verifiedSolutions.clear();
 try{
  solved=JSON.parse(localStorage.getItem('chromatron-reborn-solved-'+currentPackId)||'[]');
  skipped=JSON.parse(localStorage.getItem('chromatron-reborn-skipped-'+currentPackId)||'[]');
  if(!Array.isArray(solved))solved=[];
  if(!Array.isArray(skipped))skipped=[];
 }catch{solved=[];skipped=[]}
 try{
  const remembered=Number(localStorage.getItem('chromatron-reborn-access-'+currentPackId));
  accessFloor=Number.isFinite(remembered)?Math.max(0,Math.min(levels.length-1,Math.trunc(remembered))):0;
 }catch{accessFloor=0}
 load(0);
 return levels.length;
}
function load(i){
 if(!Number.isInteger(i))return false;
 const requested=(i%levels.length+levels.length)%levels.length;
 if(!getLevelAtlas().entries[requested].unlocked){
  toast(t(language,'atlasLockedHint'));
  return false;
 }
 cancelSolutionSearch();
 if(victoryFX){victoryFX.dispose();victoryFX=null}
 levelIndex=requested;
 applyLevelEnvironment();
 const l=levels[levelIndex];pieces=l.pieces.map(([type,x,y,rot,color])=>({id:++nextId,type,x,y,rot,color,inTray:Boolean(l.startMovablesInTray&&movable.has(type))}));
 selected=null;wheelRotation.reset();placementMode=false;draggedPiece=null;history=[];redoHistory=[];won=false;tutorialPlaced=false;$('win').classList.add('hidden');
 $('hint-overlay').classList.add('hidden');
 let legacyHints=0;
 if(currentPackId===demoPackId){
  try{legacyHints=clampHints(localStorage.getItem(progressKey(levelIndex)))}catch{}
 }
 wallet=ensurePreviousHints(wallet,currentLevelKey(),legacyHints);
 hintCount=wallet.unlocked[currentLevelKey()]||0;
 saveWallet();
 $('level-index').textContent=String(levelIndex+1).padStart(3,'0');
 $('total-levels').textContent=String(levels.length).padStart(3,'0');
 syncLevelControls();
 update();updateLocalizedLevel();syncUndoButtons();
 store('chromatron-reborn-level',String(levelIndex));
 showLevelIntro();
 return true;
}
function rebuildSelectionGuides(){
 disposeGroupChildren(guideGroup);
 renderSelectionGuides(THREE,guideGroup,selected,currentResult?.segments||[],vec,COLORS,T);
}
function reconcileMirrorReflections(){
 const activeIds=new Set(reflectionCandidates(pieces,selected,graphicsProfile.reflectorCount).map(p=>p.id));
 for(const group of componentGroup.children){
  const piece=group.userData.piece;
  if(!piece||piece.type!=='mirror')continue;
  const head=group.children.find(c=>c.userData.motionHead);
  if(!head)continue;
  const reflector=head.children.find(c=>c.isReflector);
  if(activeIds.has(piece.id)&&!reflector){
   mountRealMirror(THREE,head,graphicsProfile.reflectionSize);
  }else if(!activeIds.has(piece.id)&&reflector){
   reflector.getRenderTarget()?.dispose();
   head.remove(reflector);
   reflector.geometry.dispose();reflector.material.dispose();
  }
 }
}
function refreshSelection(){
 // Never reconstruct the optics meshes and their GPU reflection targets just
 // to select or deselect a piece. This was the main source of interaction hitching.
 selectionReticle.setPiece(selected);
 reconcileMirrorReflections();
 rebuildSelectionGuides();renderInventory();updateCoach();syncTransformTools();
 placementPreview.visible=false;
}
function update(){
 rebuildBeams();rebuildPieces();
 selectionReticle.setPiece(selected);
 rebuildSelectionGuides();renderInventory();renderAnalyzer();updateCoach();syncTransformTools();
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
  item.dataset.opticType=type;
  item.title=t(language,'type'+type[0].toUpperCase()+type.slice(1))+' — '+opticDescription(type,language);
  item.setAttribute('aria-description',opticDescription(type,language));
  if(!movableType)item.tabIndex=0;
  item.addEventListener('mouseenter',e=>showInventoryMechanics(type,e.clientX,e.clientY));
  item.addEventListener('mouseleave',hideOpticTooltip);
  item.addEventListener('focus',()=>{const b=item.getBoundingClientRect();showInventoryMechanics(type,b.left,b.top+b.height/2)});
  item.addEventListener('blur',hideOpticTooltip);
  if(movableType){
   item.setAttribute('aria-label',t(language,'type'+type[0].toUpperCase()+type.slice(1)));
   if(selected?.inTray && selected?.type===type)item.classList.add('selected');
   // Keep exhausted equipment focusable so its explanation is still
   // available with the mouse and keyboard.
   item.setAttribute('aria-disabled',String(tray.length===0));
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
 const details=$('optic-info');
 details.classList.toggle('hidden',!selected);
 if(selected){
  const heading=t(language,'type'+selected.type[0].toUpperCase()+selected.type.slice(1));
  details.textContent=heading+' — '+opticDescription(selected.type,language)+
   (opticExample(selected.type,language)?' '+opticExample(selected.type,language):'');
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
 if(selected){
  $('transform-caption').textContent=t(language,placementMode?'placementCaption':'selectedCaption');
  $('rotation-angle').textContent=String(selected.rot*45).padStart(3,'0')+'°';
 }
 const showGuides=Boolean(selected && !selected.inTray && ['mirror','bender','splitter'].includes(selected.type));
 $('beam-guide-legend').classList.toggle('hidden',!showGuides);
 $('guide-incoming').textContent=t(language,'guideIncoming');
 $('guide-outgoing').textContent=t(language,'guideOutgoing');
}
function clearSelection(){wheelRotation.reset();selected=null;placementMode=false;draggedPiece=null;refreshSelection()}
function selectFromTray(p){
 if(!p?.inTray||!movable.has(p.type))return;
 selected=p;placementMode=true;wheelRotation.reset();closeFocusDrawers();refreshSelection();beep(420,.04)
}
function snapshot(){return pieces.map(p=>({...p}))}
function syncUndoButtons(){
 $('undo').disabled=history.length===0;
 $('redo').disabled=redoHistory.length===0;
}
function saveHistory(){history.push(snapshot());if(history.length>100)history.shift();redoHistory=[];syncUndoButtons()}
function undo(){
 if(!history.length)return;
 wheelRotation.reset();
 const selection=selected?.id;
 redoHistory.push(snapshot());pieces=history.pop();
 selected=pieces.find(p=>p.id===selection)||null;
 placementMode=Boolean(selected?.inTray);
 update();syncUndoButtons();beep(410,.045);
}
function redo(){
 if(!redoHistory.length)return;
 wheelRotation.reset();
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
 selected=p;placementMode=Boolean(p.inTray);wheelRotation.reset();refreshSelection();beep(420,.04)
}
function animateRotationTo(piece,previousRotation,dir){
 const group=componentGroup.children.find(g=>g.userData.piece?.id===piece.id);
 const head=group?.children.find(c=>c.userData.motionHead);
 if(!head)return;
 const footprint=group.children.find(c=>c.userData.motionFootprint);
 const active=opticTweens.find(a=>a.kind==='rotate'&&a.object===head);
 const currentAngle=head.rotation.y;
 // Work in an UNWRAPPED angle space. Repeated wheel steps always continue
 // in the requested direction, even past 360° or while another tween runs.
 const priorTarget=active?.to??currentAngle+shortestAngle(currentAngle,-previousRotation*Math.PI/4);
 const newTarget=priorTarget-dir*Math.PI/4;
 for(let i=opticTweens.length-1;i>=0;i--)
  if(opticTweens[i].kind==='rotate'&&opticTweens[i].object===head)opticTweens.splice(i,1);
 if(reducedMotion.matches){
  head.rotation.y=newTarget;if(footprint)footprint.rotation.y=newTarget;
  return;
 }
 // Longer bursts are eased in one continuous motion, without destroying the
 // mirror mesh, allocating GPU reflector targets or restarting from a snapped angle.
 const degrees=Math.abs(newTarget-currentAngle)/(Math.PI/4);
 enqueueOpticTween(opticTweens,{object:head,footprint,kind:'rotate',from:currentAngle,
  to:newTarget,start:performance.now(),duration:Math.min(490,155+degrees*68)},setTimeout);
}
function syncTargetGlow(){
 for(const group of componentGroup.children){
  const piece=group.userData.piece,visual=group.userData.targetVisual;
  if(piece?.type!=='target'||!visual)continue;
  const active=currentResult?.received.get(piece.id)===piece.color;
  if(visual.active===active)continue;
  visual.active=active;
  visual.glow.emissiveIntensity=active?5.2:1.7;
  visual.crystal.scale.setScalar(active?1.2:1);
  visual.receiverRing.material=active?visual.glow:visual.silver;
  const halo=visual.detail.children.find(c=>c.name==='receiver-color-halo');
  const outer=visual.detail.children.find(c=>c.name==='receiver-outer-collar');
  if(halo)halo.material.opacity=active ? .95 : .54;
  for(const index of visual.detail.children.filter(c=>c.name==='wavelength-index'))
   index.material=active?(halo?.material||index.material):(outer?.material||index.material);
 }
}
function rotate(dir){
 if(!selected)return toast(t(language,'selectFirst'));
 if(!Number.isInteger(dir)||dir===0)return;
 const previousRotation=selected.rot;
 saveHistory();
 selected.rot=(selected.rot+dir+8)%8;
 if(selected.inTray){
  // Preview the new angle immediately without rebuilding board meshes.
  ghostHead.rotation.y=-selected.rot*Math.PI/4;
  syncTransformTools();
  beep(540,.045);
  return;
 }
 animateRotationTo(selected,previousRotation,dir);
 // Only recompute *light*, not the entire lab and mirror hardware.
 // The shader ribbons follow logical physics immediately while the visual
 // optic smoothly settles into its next 45-degree detent.
 rebuildBeams();
 syncTargetGlow();
 rebuildSelectionGuides();
 renderAnalyzer();updateCoach();syncTransformTools();
 beep(540,.05);
}
function move(x,y,fromDrag=false){
 if(!selected)return false;
 wheelRotation.reset();
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
 wheelRotation.reset();
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
 const nextYaw=cameraTop?0:-1.05,nextPitch=cameraTop?1.49:1.10;
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
  cameraTween=null;yaw=nextYaw;pitch=nextPitch;updateCamera();
 }else cameraTween={yaw0:yaw,pitch0:pitch,yaw1:nextYaw,pitch1:nextPitch,time:performance.now()};
 syncCameraLabel();
}
function updateCamera(){
 const viewportWidth=innerWidth;
 // Portrait mode: fit a 15×15 board into the usable central viewport.
 const portraitScale=viewportWidth<680?Math.max(1.55,720/Math.max(380,viewportWidth)):1;
 // With both HUD drawers folded away the board can occupy more of the viewport.
 const focusScale=boardFocus&&viewportWidth>680?(innerHeight<650 ? .93 : .86):1;
 const cameraDistance=dist*portraitScale*focusScale;
 camera.position.set(Math.sin(yaw)*Math.cos(pitch)*cameraDistance,Math.sin(pitch)*cameraDistance,Math.cos(yaw)*Math.cos(pitch)*cameraDistance);
 camera.lookAt(cameraTarget);
}
function syncBoardFocus(){
 const enabled=boardFocus&&innerWidth>680;
 const app=$('app'),btn=$('board-focus');
 app.classList.toggle('board-focus',enabled);
 btn.setAttribute('aria-pressed',String(enabled));
 btn.title=t(language,enabled?'focusExit':'focusEnter');
 btn.setAttribute('aria-label',btn.title);
 for(const [pane,handle,key] of [
  ['.mission','mission-drawer','missionDrawer'],
  ['.tool-panel','tool-drawer','toolDrawer']
 ]){
  const panel=app.querySelector(pane),button=$(handle);
  if(!enabled)panel.classList.remove('drawer-open');
  button.setAttribute('aria-expanded',String(enabled&&panel.classList.contains('drawer-open')));
  button.setAttribute('aria-label',t(language,key));
  button.title=t(language,key);
 }
}
function closeFocusDrawers(){
 if(!boardFocus)return;
 $('app').querySelector('.mission').classList.remove('drawer-open');
 $('app').querySelector('.tool-panel').classList.remove('drawer-open');
 syncBoardFocus();
}
function toggleBoardFocus(){
 if(innerWidth<=680)return;
 boardFocus=!boardFocus;
 store('chromatron-board-focus',boardFocus?'yes':'no');
 closeFocusDrawers();
 syncBoardFocus();
 updateCamera();
}
function toggleBoardDrawer(selector){
 const panel=$('app').querySelector(selector);
 if(!boardFocus||innerWidth<=680)return;
 const wasOpen=panel.classList.contains('drawer-open');
 $('app').querySelector('.mission').classList.remove('drawer-open');
 $('app').querySelector('.tool-panel').classList.remove('drawer-open');
 if(!wasOpen)panel.classList.add('drawer-open');
 syncBoardFocus();
}
function syncFullscreenButton(){
 const full=Boolean(document.fullscreenElement);
 const btn=$('fullscreen');
 btn.setAttribute('aria-pressed',String(full));
 btn.title=t(language,full?'fullscreenExit':'fullscreenEnter');
 btn.setAttribute('aria-label',btn.title);
}
async function toggleFullscreen(){
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
 }catch{
  toast(t(language,'fullscreenUnavailable'));
 }
 syncFullscreenButton();
}
document.addEventListener('fullscreenchange',()=>{
 syncFullscreenButton();
 resize();updateCamera();
});
function resize(){
 const w=innerWidth,h=innerHeight;
 camera.aspect=w/h;camera.updateProjectionMatrix();
 renderer.setSize(w,h);composer.setSize(w,h);
 const pixelRatio=renderer.getPixelRatio();
 fxaaPass.uniforms.resolution.value.set(1/Math.max(1,w*pixelRatio),1/Math.max(1,h*pixelRatio));
 syncBoardFocus();
}
function applyGraphicsQuality(){
 graphicsProfile=profileFor(graphicsMode,autoLevel);
 spaceEnvironments.setQuality(graphicsMode==='auto'?autoLevel:graphicsMode);
 renderer.setPixelRatio(Math.min(devicePixelRatio,graphicsProfile.pixelRatio));
 composer.setPixelRatio(renderer.getPixelRatio());
 bloomPass.strength=graphicsProfile.bloomStrength;
 fxaaPass.enabled=graphicsProfile.antialias==='fxaa';
 smaaPass.enabled=graphicsProfile.antialias==='smaa';
 resize();
 if(pieces.length){
  // Performance presets limit both the expensive mirror reflections AND
  // the number of real point lights along the laser's route.
  rebuildBeams();
  rebuildPieces();
 }
 $('graphics-quality').value=graphicsMode;
}
window.addEventListener('resize',resize);resize();updateCamera();
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
 // Prefer the logical cell occupant. Only fallback to a 3D mesh when the
 // cursor points at a tall object's silhouette above its board footprint.
 const cell=cellAt(clientX,clientY);
 if(cell){
  const occupant=pieces.find(p=>!p.inTray && p.x===cell.x && p.y===cell.y);
  if(occupant)return {piece:occupant};
 }
 mouse.set(clientX/innerWidth*2-1,-clientY/innerHeight*2+1);
 ray.setFromCamera(mouse,camera);
 const objs=ray.intersectObjects(hitObjects,false);
 if(objs.length)return {piece:objs[0].object.userData.piece};
 return cell;
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
function hideOpticTooltip(){$('optic-tooltip').classList.add('hidden')}
function positionOpticTooltip(x,y){
 const tooltip=$('optic-tooltip');
 tooltip.style.left='0px';tooltip.style.top='0px';
 const b=tooltip.getBoundingClientRect();
 const width=Math.min(innerWidth-18,b.width||320);
 const height=Math.min(innerHeight-18,b.height||140);
 const nextX=x>innerWidth*.62?x-width-12:x+15;
 tooltip.style.left=Math.max(9,Math.min(innerWidth-width-9,nextX))+'px';
 tooltip.style.top=Math.max(9,Math.min(innerHeight-height-9,y+9))+'px';
}
function showInventoryMechanics(type,x,y){
 const name=t(language,'type'+type[0].toUpperCase()+type.slice(1));
 const message=name+'\n'+opticDescription(type,language)+
  (opticExample(type,language)?'\n'+opticExample(type,language):'');
 const tip=$('optic-tooltip');
 tip.textContent=message;tip.dataset.optic=type;
 tip.classList.remove('hidden','blocked');
 positionOpticTooltip(x,y);
}
function showOpticTooltip(e,hovered){
 const tooltip=$('optic-tooltip');
 let message='',blocked=false;
 if(placementMode&&selected?.inTray){
  const cell=cellAt(e.clientX,e.clientY);
  if(cell){
   blocked=!isFreeCell(pieces,selected,cell.x,cell.y);
   message=t(language,blocked?'tipOccupied':'tipPlace');
  }
 }else if(hovered?.piece){
  const p=hovered.piece;
  const key='type'+p.type[0].toUpperCase()+p.type.slice(1);
  message=t(language,key)+'\n'+opticDescription(p.type,language)+
   (opticExample(p.type,language)?'\n'+opticExample(p.type,language):'')+
   '\n'+t(language,movable.has(p.type)?'tipSelect':'tipFixed');
 }
 tooltip.classList.toggle('hidden',!message);
 tooltip.classList.toggle('blocked',blocked);
 if(message){
  if(tooltip.textContent!==message)tooltip.textContent=message;
  positionOpticTooltip(e.clientX,e.clientY);
 }
}
let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{
 // Tapping the board closes open focus drawers without swallowing the click.
 if(boardFocus)closeFocusDrawers();
 hideOpticTooltip();
 if(e.button!==0&&e.button!==2)return;
 cameraTween=null;
 const origin=hit(e.clientX,e.clientY);
 // Placement always uses the board's world-space cell, not a raycast mesh:
 // raised optics and glass can otherwise steal a click on an empty tile.
 const trayCell=cellAt(e.clientX,e.clientY);
 if(e.button===0 && placementMode && selected?.inTray && trayCell){
  if(isFreeCell(pieces,selected,trayCell.x,trayCell.y)){
   move(trayCell.x,trayCell.y);
  }else toast(t(language,'cellOccupied'));
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
  showOpticTooltip(e,hovered);
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
renderer.domElement.addEventListener('pointerleave',()=>{if(!down)placementPreview.visible=false;hideOpticTooltip()});
renderer.domElement.addEventListener('dragover',e=>{
 if(placementMode&&selected?.inTray){e.preventDefault();updatePlacementPreview(e)}
});
renderer.domElement.addEventListener('drop',e=>{
 e.preventDefault();const dest=cellAt(e.clientX,e.clientY);
 if(placementMode && selected?.inTray && dest)move(dest.x,dest.y);
 placementPreview.visible=false;
});
renderer.domElement.addEventListener('contextmenu',e=>{e.preventDefault();clearSelection()});
renderer.domElement.addEventListener('wheel',e=>{
 e.preventDefault();
 if(selected&&!e.shiftKey&&!e.ctrlKey){
  // Mouse wheel detents and high-resolution touchpad ticks have different
  // magnitudes and may report deltaY in pixels, lines or pages.
  const steps=wheelRotation.consume(e.deltaY,e.deltaMode,performance.now(),innerHeight);
  if(steps)rotate(steps);
 }else{
  wheelRotation.reset();
  const delta=toWheelPixels(e.deltaY,e.deltaMode,innerHeight);
  zoomTarget=Math.max(22,Math.min(60,zoomTarget+delta*.021));
  if(reducedMotion.matches){dist=zoomTarget;updateCamera()}
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
 if(e.code==='KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey){e.preventDefault();void toggleFullscreen();return}
 if(e.code==='KeyB' && !e.ctrlKey && !e.metaKey && !e.altKey){e.preventDefault();toggleBoardFocus();return}
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
// User-owned classic data stays local; neither source binaries nor extracted
// levels are included in the shipped bundle or uploaded to any server.
$('import-classic').onclick=()=>$('classic-files').click();
$('classic-files').addEventListener('change',async event=>{
 const input=event.target;
 try{
  const files=[...input.files];
  if(!files.length)return;
  const loaded=await Promise.all(files.map(async(file,i)=>{
   if(file.size>8_000_000)throw new Error('JSON file is too large');
   const match=file.name.match(/(?:chromatron|chroma)[-_ ]?([1-4])/i);
   const game=match?Number(match[1]):i+1;
   const isExecutable=/\.exe$/i.test(file.name);
   if(isExecutable&&game!==1)
    throw new Error('Direct executable extraction currently supports Chromatron 1 only; use JSON for 2–4.');
   const data=isExecutable?
    extractChromatron1Executable(await file.arrayBuffer()):
    JSON.parse(await file.text());
   return {game,data};
  }));
  const next=loaded.length===1?
   loadLevelBundle(loaded[0].data,{game:loaded[0].game}):
   convertClassicCollection(loaded);
  const count=switchLevelPack(next);
  $('classic-import-status').textContent=t(language,'classicImportSuccess',{count});
  $('help-overlay').classList.add('hidden');
  toast(t(language,'classicImportSuccess',{count}));
 }catch(error){
  const message=String(error?.message||error).slice(0,180);
  $('classic-import-status').textContent=t(language,'classicImportError',{message});
 }finally{input.value=''}
});
$('hint').onclick=()=>{
 $('hint-overlay').classList.remove('hidden');
 requestSolutionSearch();
 renderHints();
};
$('close-hint').onclick=()=>$('hint-overlay').classList.add('hidden');
$('reveal-hint').onclick=()=>{
 if(hintCount>=3)return toast(t(language,'allHints'));
 if(hintCount===2&&!verifiedSolutionForCurrent()&&!levels[levelIndex].hints?.[2])
  return toast(t(language,'hintNeedVerified'));
 const purchased=buyNextHint(wallet,currentLevelKey());
 if(!purchased.unlocked)
  return toast(t(language,purchased.reason==='credits'?'creditsRequired':'allHints'));
 wallet=purchased.wallet;hintCount=purchased.stage;
 saveWallet();
 if(currentPackId===demoPackId)store(progressKey(levelIndex),String(hintCount));
 renderHints();beep(460,.09);
};
$('skip-level').onclick=()=>{
 if(hintCount<3)return;
 if(levelIndex>=levels.length-1){toast(t(language,'lastLevel'));return}
 if(!skipped.includes(levelIndex)){
  skipped.push(levelIndex);
  store('chromatron-reborn-skipped-'+currentPackId,JSON.stringify(skipped));
  if(currentPackId===demoPackId)store('chromatron-reborn-skipped',JSON.stringify(skipped));
 }
 load(levelIndex+1);toast(t(language,'skipNotice'))
};
$('coach-dismiss').onclick=()=>{coachDismissed=true;store('chromatron-coach-dismissed','yes');updateCoach();renderInventory()};
$('board-focus').onclick=toggleBoardFocus;
$('mission-drawer').onclick=()=>toggleBoardDrawer('.mission');
$('tool-drawer').onclick=()=>toggleBoardDrawer('.tool-panel');
$('fullscreen').onclick=toggleFullscreen;
$('help').onclick=()=>$('help-overlay').classList.remove('hidden');
$('close-help').onclick=()=>$('help-overlay').classList.add('hidden');
$('audio').onclick=()=>{audioEnabled=!audioEnabled;$('audio').classList.toggle('enabled',audioEnabled);beep(700,.08)};
$('graphics-quality').value=graphicsMode;
$('graphics-quality').addEventListener('change',e=>{
 graphicsMode=normalizeQuality(e.target.value);autoLevel='balanced';
 store('chromatron-graphics-quality',graphicsMode);
 applyGraphicsQuality();
});
let start=performance.now(),fpsMark=0,fpsFrames=0,slowWindows=0,fastWindows=0;
function trackFrameRate(time){
 fpsFrames++;
 if(!fpsMark){fpsMark=time;return}
 const windowMs=time-fpsMark;
 if(windowMs<1500)return;
 const fps=Math.round(fpsFrames*1000/windowMs);
 $('graphics-fps').textContent=fps+' FPS';
 $('graphics-fps').classList.toggle('low',fps<42);
 if(graphicsMode==='auto'&&!document.hidden){
  // Only sustained low frame rate degrades quality; recovery is deliberately
  // much slower so the render target does not flap on individual frames.
  if(fps<42){slowWindows++;fastWindows=0}
  else if(fps>57){fastWindows++;slowWindows=0}
  else {slowWindows=0;fastWindows=0}
  const next=nextAutoProfile(autoLevel,slowWindows,fastWindows);
  if(next!==autoLevel){
   autoLevel=next;slowWindows=0;fastWindows=0;
   applyGraphicsQuality();
  }
 }
 fpsFrames=0;fpsMark=time;
}
function animate(time){
 requestAnimationFrame(animate);
 trackFrameRate(time);
 spaceEnvironments.update(time*.001,reducedMotion.matches);
 // Damped camera dolly, independent of mouse/trackpad event granularity.
 const zoomDt=Math.min(70,Math.max(0,time-(zoomLastFrame||time-16)));
 zoomLastFrame=time;
 if(Math.abs(zoomTarget-dist)>.015){
  const amount=reducedMotion.matches?1:1-Math.exp(-zoomDt/115);
  dist+=(zoomTarget-dist)*amount;
  updateCamera();
 }else if(zoomTarget!==dist){dist=zoomTarget;updateCamera()}
 for(let i=opticTweens.length-1;i>=0;i--){
  const a=opticTweens[i];
  const fraction=Math.min(1,Math.max(0,(time-a.start)/a.duration));
  const e=easeOutCubic(fraction);
  applyOpticTween(a,e);
  if(fraction===1)opticTweens.splice(i,1);
 }
 if(cameraTween){
  const f=Math.max(0,Math.min(1,(time-cameraTween.time)/520)),ease=f*f*(3-2*f);
  yaw=cameraTween.yaw0+(cameraTween.yaw1-cameraTween.yaw0)*ease;
  pitch=cameraTween.pitch0+(cameraTween.pitch1-cameraTween.pitch0)*ease;
  if(f===1)cameraTween=null;
  updateCamera();
 }
 for(const p of componentGroup.children)for(const c of p.children)if(c.userData.spin)c.rotation.y=(time-start)*.001;
 for(const c of assistGroup.children)c.scale.setScalar(1+.09*Math.sin(time*.005));
 selectionReticle.update(time,reducedMotion.matches);
 if(laserVisuals)laserVisuals.update(time*.001);
 if(victoryFX && !victoryFX.update((time-victorySince)*.001)){
  victoryFX.dispose();victoryFX=null;
 }
 composer.render();
}
function renderHints(){
 const root=$('hint-steps');
 if(!root)return;
 root.replaceChildren();
 const level=levels[levelIndex];
 const known=verifiedSolutionForCurrent();
 let finalFocus=null;
 for(let step=1;step<=hintCount;step++){
  // Built-in prose sets up a puzzle; a state-aware verified plan then reveals
  // one concrete next action, never a fabricated move.
  const authored=step<3&&level.hints?.[step-1]?
   hintFor(level,language,step):null;
  const dynamic=contextualHint(level,pieces,step,language,known);
  const hint=authored||dynamic;
  if(!hint)continue;
  finalFocus=hint.focus||finalFocus;
  const block=document.createElement('section');block.className='hint-step';
  const header=document.createElement('div');
  header.className='eyebrow';
  header.textContent=t(language,'hintStep',{step})+' · '+t(language,'hintType'+step);
  const copy=document.createElement('p');copy.textContent=hint.body;
  block.append(header,copy);root.appendChild(block);
 }
 disposeGroupChildren(assistGroup);
 if(finalFocus&&hintCount>=2&&Number.isInteger(finalFocus.x)&&Number.isInteger(finalFocus.y)){
  const marker=torus(.43,.032,new THREE.MeshBasicMaterial({
   color:0xc992ff,transparent:true,opacity:.82,depthTest:false
  }),assistGroup);
  marker.position.copy(vec(finalFocus.x,finalFocus.y,.055));marker.renderOrder=20;
 }
 $('hint-badge').textContent=hintCount+'/3';
 syncWalletUI();
 const next=hintCount;
 const cost=HINT_COSTS[next]??0;
 const needsVerified=next===2&&!known&&!level.hints?.[2];
 const canBuy=next<3&&wallet.balance>=cost&&!needsVerified;
 const button=$('reveal-hint');
 button.textContent=t(language,hintCount===0?'hintReveal':'hintAgain');
 button.disabled=!canBuy;
 const help=$('hint-cost');
 help.textContent=next===3?'':needsVerified?t(language,'hintNeedVerified'):
  cost===0?t(language,'hintCostFree'):
  wallet.balance<cost?t(language,'creditsRequired'):t(language,'hintCostPaid',{cost});
 const status=$('hint-analysis-status');
 status.textContent=solverStatus==='running'?t(language,'hintAnalysisRunning'):
  solverStatus&&solverStatus!=='verified'&&needsVerified?t(language,'hintAnalysisUnavailable'):'';
 $('skip-level').classList.toggle('hidden',hintCount<3 || levels.length<=1);
}
setLanguage(language);
load(Number.isFinite(saved)?Math.min(Math.max(Math.trunc(saved),0),levels.length-1):0);
syncWalletUI();
requestAnimationFrame(animate);
// For QA / external validation, expose read-only state and import API.
window.chromatron={
 getLayoutState:()=>({boardFocus:$('app').classList.contains('board-focus'),missionOpen:$('app').querySelector('.mission').classList.contains('drawer-open'),toolOpen:$('app').querySelector('.tool-panel').classList.contains('drawer-open')}),
 getState:()=>({level:levelIndex,pieces:pieces.map(p=>({...p})),selectedId:selected?.id??null,placementMode,result:{...currentResult,received:[...currentResult.received]}}),
 getVisualStats:()=>({activeOpticTweens:opticTweens.length,componentRebuilds,selectionVisible:selectionReticle.root.visible,selectionPieceId:selectionReticle.root.userData.pieceId??null,selectedVisualAngle:componentGroup.children.find(g=>g.userData.piece?.id===selected?.id)?.children.find(c=>c.userData.motionHead)?.rotation.y??null,qualityMode:graphicsMode,effectiveQuality:graphicsMode==='auto'?autoLevel:graphicsMode,antialiasing:graphicsProfile.antialias,planarReflections:componentGroup.children.flatMap(c=>{const out=[];c.traverse(obj=>{if(obj.isReflector)out.push(obj)});return out}).length,pixelRatio:renderer.getPixelRatio(),beamSegments:currentResult?.segments?.length||0,beamGeometryDrawCalls:laserVisuals?.geometryStats?.drawCalls??0,beamDynamicLights:laserVisuals?.dynamicLightCount??0,photonSystems:beamGroup.children.filter(c=>c.isPoints).length,guideObjects:guideGroup.children.length,instancedBoardLayers:gridGroup.children.filter(c=>c.isInstancedMesh).length,contactShadowInstances:opticShadows.mesh.count,environment:spaceEnvironments.getStats(),blossomActive:Boolean(victoryFX),selectedType:selected?.type||null}),
 projectCell(x,y,height=0){const v=vec(x,y,height).project(camera);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2}},
 inspectPointer(clientX,clientY){
  const cell=cellAt(clientX,clientY);
  const h=placementMode&&selected?.inTray&&cell?cell:hit(clientX,clientY);
  const c=classifyClick(h,selected,placementMode);
  return {hit:h?.piece?{pieceId:h.piece.id,pieceType:h.piece.type}:h,intent:c.action,selectedId:selected?.id??null,placementMode}
 },
 loadLevels(json){const next=loadLevelBundle(json);const count=switchLevelPack(next);toast(t(language,'imported',{count}));return count},
 getPuzzleTools:()=>({packId:currentPackId,levelKey:currentLevelKey(),credits:wallet.balance,unlocked:hintCount,verifiedSolution:!!verifiedSolutionForCurrent(),solverStatus}),
 getLevelAtlas:()=>getLevelAtlas(),
 setLanguage,getLanguage:()=>language,getHints:()=>hintCount
};
