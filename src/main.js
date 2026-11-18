import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {PROTOTYPE_LEVELS,validateLevels} from './levels.js';
import {createSoundscape} from './soundscape.js';
import {COLORS,trace,movable} from './optics.js';
import {inspectLight,colorName,channels} from './analysis.js';
import {applyLanguage,t,loc,normalizeLanguage} from './i18n.js';
import {clampHints,hintFor,progressKey} from './hints.js';
import {normalizeWallet,packFingerprint,stageKey,rewardOnce,ensurePreviousHints,buyNextHint,HINT_COSTS} from './hint-economy.js';
import {verifyPuzzleSolution} from './puzzle-solver.js';
import {contextualHint} from './hint-assistant.js';
import {loadLevelBundle} from './classic-import.js';
import {disposeGroupChildren} from './dispose.js';
import {buildLaboratory} from './world-art.js';
import {createSpaceEnvironments,environmentForLevel,SPACE_BIOMES} from './world-biomes.js';
import {createHeroScenery} from './hero-scenery.js';
import {createMidgroundScenery} from './midground-scenery.js';
import {createAmbientLife} from './ambient-life.js';
import {stageEntryMode,stagePresentation} from './stage-presentation.js';
import {deckSurfaceProfile,deckCellFinish} from './deck-finishes.js';
import {createLivingWorld} from './living-world.js';
import {buildLevelAtlas} from './level-atlas.js';
import {draftKey,encodePuzzleDraft,restorePuzzleDraft} from './puzzle-drafts.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createTerraces} from './terraces.js';
import {opticDescription,opticExample} from './optic-help.js';
import {renderSelectionGuides} from './beam-guides.js';
import {renderLaserFX} from './laser-vfx.js';
import {createVictoryFX} from './victory-vfx.js';
import {mountRealMirror,disposeReflectionTargets} from './mirror-reflections.js';
import {applyOpticFinish} from './optic-textures.js';
import {createOpticModelLoader} from './optic-model-loader.js';
import {createCinematicPass} from './cinematic-pass.js';
import {createBoardEdgeGlow} from './board-edge-glow.js';
import {createAtmosphereParticles} from './atmosphere-particles.js';
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
import './stage-arrival.css';
const $=id=>document.getElementById(id);
const GRID=15, HALF=7, T=1.3;
const debugEnabled=new URLSearchParams(location.search).get('debug')==='1';
const debugData=debugEnabled?new Map():null;
const transientStorage=debugData&&{
 getItem:key=>debugData.get(key)??null,
 setItem:(key,value)=>debugData.set(key,String(value)),
 removeItem:key=>debugData.delete(key)
};
const gameStorage=()=>transientStorage||window.localStorage;
let debugFrozen=false,debugTheme=null;
const scene=new THREE.Scene();scene.background=new THREE.Color('#0d1b2c');scene.fog=new THREE.FogExp2('#0d1b2c',0.008);
const camera=new THREE.PerspectiveCamera(40,1,.1,200);
const cameraTarget=new THREE.Vector3(0,0,0);
let yaw=-.80,pitch=.86,dist=44;
let zoomTarget=44,zoomLastFrame=0;
let boardFocus=false;
try{boardFocus=gameStorage().getItem('chromatron-board-focus')==='yes'}catch{}
let graphicsMode='auto',autoLevel='balanced';
try{graphicsMode=normalizeQuality(gameStorage().getItem('chromatron-graphics-quality'))}catch{}
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
// Cinematic color grading: per-biome tint, vignette, saturation, film grain
const cinematic=createCinematicPass(THREE,ShaderPass);
composer.addPass(cinematic.pass);
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
const ambient=new THREE.AmbientLight(0xc8d6e1,.70);scene.add(ambient);
const key=new THREE.DirectionalLight(0xffebce,1.67);key.position.set(-8,16,12);scene.add(key);
const fill=new THREE.PointLight(0x2c6bff,25,35);fill.position.set(9,9,-9);scene.add(fill);
const world=new THREE.Group();scene.add(world);
const tileGeo=new THREE.BoxGeometry(T*.97,.22,T*.97);
function mesh(geo,mat,parent=world){const m=new THREE.Mesh(geo,mat);parent.add(m);return m;}
const deck=mesh(new RoundedBoxGeometry(21,.75,21,4,.26),new THREE.MeshStandardMaterial({color:0x0a1324,metalness:.65,roughness:.32}));deck.position.y=-.62;
const gridGroup=new THREE.Group();world.add(gridGroup);
// Two instanced draw calls replace 450 independent tile/line meshes.
// This preserves every logical cell and its coloring while keeping GPU headroom.
const tileMaterial=new THREE.MeshStandardMaterial({color:0xffffff,metalness:.48,roughness:.48});
applyOpticFinish(THREE,tileMaterial,'brushed');
const boardTiles=new THREE.InstancedMesh(tileGeo,tileMaterial,GRID*GRID);
const sceneryLoader=new GLTFLoader();
sceneryLoader.load(import.meta.env.BASE_URL+'models/board-cell.glb',({scene})=>{
 const tile=scene.getObjectByName('board-cell');
 if(!tile?.isMesh)return;
 boardTiles.geometry=tile.geometry;
 tileGeo.dispose();tile.material.dispose();
});
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
const spaceEnvironments=createSpaceEnvironments(THREE,scene,world,{tileSize:T,
 loadFlora:(id,ready)=>sceneryLoader.load(import.meta.env.BASE_URL+'models/terraces/'+id+'-flora.glb',({scene})=>ready(scene))
});
const heroScenery=createHeroScenery(THREE,world,{baseUrl:import.meta.env.BASE_URL+'models/biomes/'});
const midgroundScenery=createMidgroundScenery(THREE,world,{baseUrl:import.meta.env.BASE_URL+'models/midground/'});
const terraces=createTerraces(THREE,world,import.meta.env.BASE_URL+'models/terraces/');
const ambientLife=createAmbientLife(THREE,world);
const modeledScenery={
 chassis:false,absorber:false,shuttle:false
};
const chassisModels={standard:null,orbital:null};
function syncBoardChassis(){
 const showOrbital=activeEnvironment?.id==='orbital'&&Boolean(chassisModels.orbital);
 if(chassisModels.standard)chassisModels.standard.visible=!showOrbital;
 if(chassisModels.orbital)chassisModels.orbital.visible=showOrbital;
 if(modeledScenery.chassis){
  deck.visible=false;
  laboratory.userData.hideLegacyChassis();
 }
}
sceneryLoader.load(new URL('../assets/models/board-chassis.glb',import.meta.url).href,({scene:chassis})=>{
 chassis.position.y=-3.995;
 chassisModels.standard=chassis;
 world.add(chassis);
 modeledScenery.chassis=true;
 syncBoardChassis();
});
function loadOrbitalChassis(){
 if(chassisModels.orbital!==null)return;
 chassisModels.orbital=undefined;
 sceneryLoader.load(new URL('../assets/models/board-chassis-undercarriage.glb',import.meta.url).href,({scene:chassis})=>{
  chassis.position.y=-3.995;
  chassisModels.orbital=chassis;
  world.add(chassis);
  syncBoardChassis();
 },undefined,()=>{chassisModels.orbital=null});
}
sceneryLoader.load(new URL('../assets/models/absorber-armor.glb',import.meta.url).href,({scene:armor})=>{
 modeledScenery.absorber=laboratory.userData.beamPerimeter.setArmor(armor);
});
sceneryLoader.load(new URL('../assets/models/service-shuttle.glb',import.meta.url).href,({scene:shuttle})=>{
 ambientLife.setOrbitalShuttle(shuttle);
 modeledScenery.shuttle=true;
});
const livingWorld=createLivingWorld(THREE,scene,world);
const boardEdgeGlow=createBoardEdgeGlow(THREE,world,{tileSize:T,half:HALF});
const atmosphereParticles=createAtmosphereParticles(THREE,scene);
let modelRefresh=0;
const opticModels=createOpticModelLoader(THREE,{
 baseUrl:import.meta.env.BASE_URL+'models/optics/',portraitUrl:import.meta.env.BASE_URL+'portraits/',
 onReady(type){
  if(previewPiece?.type===type&&placementPreview.visible)previewInstrument(previewPiece);
  if(modelRefresh||!pieces.some(p=>p.type===type&&!p.inTray))return;
  modelRefresh=requestAnimationFrame(()=>{modelRefresh=0;rebuildPieces()});
 }
});
const environmentSessionSeed=debugEnabled?48129:Math.floor(Math.random()*0x7fffffff);
const soundscape=createSoundscape();
let activeEnvironment=null;
function applyLevelEnvironment(){
 const theme=spaceEnvironments.setLevel(currentPackId,levelIndex,{seed:environmentSessionSeed,themeId:debugTheme});
 activeEnvironment=theme;
 if(theme.id==='orbital')loadOrbitalChassis();
 syncBoardChassis();
 soundscape.setBiome(theme.id);
 heroScenery.setLevel(theme.id,currentPackId,levelIndex,environmentSessionSeed);
 midgroundScenery.setLevel(theme.id,currentPackId,levelIndex,environmentSessionSeed);
 terraces.setLevel(theme.id,levelIndex);
 ambientLife.setLevel(theme.id,currentPackId,levelIndex,environmentSessionSeed);
 livingWorld.setLevel(theme.id,currentPackId,levelIndex,environmentSessionSeed);
 boardEdgeGlow.setTheme(theme);
 atmosphereParticles.setBiome(theme.id);
 atmosphereParticles.setQuality(graphicsMode==='auto'?autoLevel:graphicsMode);
 cinematic.setBiome(theme.id);
 laboratory.userData.setTheme(theme,{packId:currentPackId,index:levelIndex,seed:environmentSessionSeed});
 const finish=deckSurfaceProfile(theme.decor);
 tileMaterial.metalness=finish.tileMetalness;
 tileMaterial.roughness=finish.tileRoughness;
 if(!modeledScenery.chassis){
  deck.material.color.setHex(theme.tileB);
  deck.material.metalness=finish.deckMetalness;
  deck.material.roughness=finish.deckRoughness;
 }
 // Subtle per-biome emissive tint on the board surface material
 const biomeEmissive={moss:0x1a3a22,ice:0x1a3044,crystal:0x2a1830,scrap:0x1a2530};
 const biomeEmissiveStrength={moss:.04,ice:.06,crystal:.08,scrap:.03};
 tileMaterial.emissive.setHex(biomeEmissive[theme.decor]||0x000000);
 tileMaterial.emissiveIntensity=biomeEmissiveStrength[theme.decor]||0;
 // Inlaid grid seams use the same instanced draw call, but each cell
 // reflects its biome's patina instead of an identical glowing strip.
 boardLines.material.color.setHex(0xffffff);
 boardLines.material.opacity=theme.decor==='moss'?.49:
  theme.decor==='ice'?.75:.65;
 const color=new THREE.Color(),line=new THREE.Color();
 for(let n=0;n<GRID*GRID;n++){
  const x=n%GRID,y=Math.floor(n/GRID);
  const surface=deckCellFinish(theme,currentPackId,levelIndex,
   environmentSessionSeed,x,y);
  boardTiles.setColorAt(n,color.setHex(surface.tileColor));
  boardLines.setColorAt(n,line.setHex(surface.lineColor));
 }
 boardTiles.instanceColor.needsUpdate=true;
 boardLines.instanceColor.needsUpdate=true;
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
const demoLevels=validateLevels(PROTOTYPE_LEVELS);
let levels=demoLevels,levelIndex=0,pieces=[],selected=null,history=[],redoHistory=[],currentResult=null,won=false,audioEnabled=false;
let language='pl',hintCount=0,solved=[],skipped=[],spectrumActive=false,analysisActive=false;
let wallet=normalizeWallet(null);
let currentPackId=packFingerprint(levels);
const demoPackId=currentPackId;
const classicLibrary=new Map();
for(let game=1;game<=4;game++){
 try{
  const json=gameStorage().getItem('chromatron-classic-'+game);
  if(json){
   const pack=validateLevels(JSON.parse(json));
   if(pack.length===50&&pack.every(l=>l.sourceGame===game))classicLibrary.set(game,pack);
  }
 }catch{}
}
for(const {game,levels:pack} of globalThis.chromatronLocalCampaigns||[])classicLibrary.set(game,pack);
delete globalThis.chromatronLocalCampaigns;
const firstOriginal=[...classicLibrary.keys()].sort((a,b)=>a-b)[0];
let campaignPreference=firstOriginal?'classic'+firstOriginal:'demo';
const verifiedSolutions=new Map();
let hintWorker=null,solvingId=null,solverStatus='';
let coachDismissed=false,tutorialPlaced=false;
let placementMode=false,draggedPiece=null;
let saved=0;
try{
 saved=Number(gameStorage().getItem('chromatron-reborn-level-'+currentPackId)??
  gameStorage().getItem('chromatron-reborn-level')??0);
 language=normalizeLanguage(gameStorage().getItem('chromatron-reborn-language')||'pl');
 analysisActive=gameStorage().getItem('chromatron-reborn-analysis')==='on';
 const preference=gameStorage().getItem('chromatron-start-campaign');
 const previous=preference||gameStorage().getItem('chromatron-reborn-campaign');
 if(previous==='demo'&&preference)campaignPreference='demo';
 else if(/^classic[1-4]$/.test(previous)&&classicLibrary.has(Number(previous.slice(7))))campaignPreference=previous;
 coachDismissed=gameStorage().getItem('chromatron-coach-dismissed')==='yes';
 solved=JSON.parse(gameStorage().getItem('chromatron-reborn-solved')||'[]');
 skipped=JSON.parse(gameStorage().getItem('chromatron-reborn-skipped')||'[]');
 spectrumActive=gameStorage().getItem('chromatron-reborn-spectrum')==='true';
 wallet=normalizeWallet(gameStorage().getItem('chromatron-reborn-credit-wallet'));
 if(!Array.isArray(solved))solved=[];
 if(!Array.isArray(skipped))skipped=[];
}catch{}
for(const level of solved){
 if(Number.isInteger(level)&&level>=0&&level<levels.length)
  wallet=rewardOnce(wallet,stageKey(currentPackId,level)).wallet;
}
try{gameStorage().setItem('chromatron-reborn-credit-wallet',JSON.stringify(wallet))}catch{}
// The old prototype allowed direct navigation to any level. Preserve the
// last previously visited level once, even if the new atlas locks later ones.
let accessFloor=0;
try{
 const key='chromatron-reborn-access-'+currentPackId;
 const previous=gameStorage().getItem(key);
 const value=previous===null?saved:Number(previous);
 accessFloor=Number.isFinite(value)?Math.min(levels.length-1,Math.max(0,Math.trunc(value))):0;
 if(previous===null)store(key,String(accessFloor));
}catch{}
let nextId=0;
const vec=(x,y,height=.3)=>new THREE.Vector3((x-HALF)*T,height,(y-HALF)*T);
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
 disposeGroupChildren(componentGroup);
 hitObjects.length=0;
 const reflectingIds=new Set(reflectionCandidates(pieces,selected,graphicsProfile.reflectorCount).map(p=>p.id));
 const walls=pieces.filter(p=>p.type==='wall'&&!p.inTray);
 for(const type of new Set(pieces.map(p=>p.type)))opticModels.load(type);
 const wallBatch=opticModels.instanceWalls(walls,p=>vec(p.x,p.y,.24));
 if(wallBatch){componentGroup.add(wallBatch);hitObjects.push(...wallBatch.children)}
 for(const p of pieces){
  if(p.inTray)continue;
  if(wallBatch&&p.type==='wall')continue;
  const g=new THREE.Group();g.position.copy(vec(p.x,p.y,.24));g.userData.piece=p;componentGroup.add(g);
  const color=new THREE.Color(COLORS[p.type==='target'?p.color:(p.color||7)]);
  const energized=p.type==='target'&&(currentResult?.received.get(p.id)||0)===p.color;
  const model=opticModels.cloneOptic(p.type,color,{energized});
  if(model){
   const head=new THREE.Group();
   head.userData.motionHead=true;
   head.rotation.y=-p.rot*Math.PI/4;
   head.position.y=.65;
   model.position.y=-.65;
   head.add(model);g.add(head);
   if(reflectingIds.has(p.id))mountRealMirror(THREE,head,graphicsProfile.reflectionSize);
   if(p.type==='target')g.userData.modelActive=energized;
   model.traverse(c=>{if(c.isMesh){c.userData.piece=p;hitObjects.push(c)}});
  }else{
   // Keep the exact silhouette visible and selectable while the mesh arrives.
   // Slow or interrupted downloads use the matching Blender portrait.
   const portrait=opticModels.portrait(p.type);
   portrait.position.y=.49;g.add(portrait);
   portrait.userData.piece=p;hitObjects.push(portrait);
  }
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
 // Input may arrive between loading/rebuilding a mesh and the next draw.
 // Raycasters must already see the new board positions in that interval.
 componentGroup.updateWorldMatrix(true,true);
}
let laserVisuals=null,victoryFX=null,victorySince=0;
let levelTransition=null;
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
 laserVisuals=renderLaserFX(THREE,beamGroup,currentResult.segments,pieces,currentResult.received,COLORS,vec,graphicsProfile,currentResult.boundaryHits);
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
function store(key,value){try{gameStorage().setItem(key,value)}catch{}}
function updateStatus(){
 const el=$('level-status');
 el.textContent=solved.includes(levelIndex)?t(language,'statusSolved'):skipped.includes(levelIndex)?t(language,'statusSkipped'):'';
 el.classList.toggle('solved',solved.includes(levelIndex));
}
function getLevelAtlas(){
 return buildLevelAtlas(levels.length,solved,skipped,accessFloor);
}
function syncLevelControls(){
 const atlas=getLevelAtlas();
 $('prev').disabled=levelIndex===0;
 $('next').disabled=levelIndex>=levels.length-1||!atlas.entries[levelIndex+1]?.unlocked;
}
let levelAtlasOpener=null;
function renderLevelAtlas(){
 if($('level-menu').classList.contains('hidden'))return;
 syncCampaignTabs();
 const atlas=getLevelAtlas(),grid=$('level-grid');
 $('level-atlas-summary').textContent=t(language,'atlasSummary',{
  done:atlas.solvedCount,total:atlas.total,unlocked:atlas.unlockedCount
 });
 grid.replaceChildren();
 const fragment=document.createDocumentFragment();
 for(const entry of atlas.entries){
  const name=loc(levels[entry.index].title,language);
  const button=document.createElement('button');
  button.type='button';button.className='level-atlas-card';
  button.dataset.levelIndex=String(entry.index);
  button.dataset.status=entry.status;
  button.disabled=!entry.unlocked;
  if(entry.index===levelIndex)button.setAttribute('aria-current','step');
  const number=String(entry.index+1).padStart(3,'0');
  const label=t(language,'atlasLevel',{number});
  const status=t(language,'atlas'+entry.status[0].toUpperCase()+entry.status.slice(1));
  const biome=stagePresentation(environmentForLevel(
   currentPackId,entry.index,environmentSessionSeed),language);
  button.dataset.biome=biome.biome;
  button.style.setProperty('--level-accent',biome.accent);
  let hasDraft=false;
  if(entry.unlocked&&entry.status!=='solved'){
   try{hasDraft=Boolean(gameStorage().getItem(draftKey(currentPackId,entry.index)))}catch{}
  }
  if(hasDraft)button.dataset.draft='true';
  button.setAttribute('aria-label',label+': '+(entry.unlocked?name+' · '+status+
   (hasDraft?' · '+t(language,'atlasInProgress'):''):status));
  button.title=entry.unlocked?name:t(language,'atlasLockedHint');
  const n=document.createElement('span');n.className='level-atlas-card-number';n.textContent=number;
  const title=document.createElement('strong');title.className='level-atlas-card-title';
  title.textContent=entry.unlocked?name:'···';
  const caption=document.createElement('span');caption.className='level-atlas-card-status';
  caption.textContent=(entry.index===levelIndex?t(language,'atlasNow')+' · ':'')+
   (hasDraft?t(language,'atlasInProgress')+' · ':'')+status;
  button.append(n,title);
  if(entry.unlocked){
   const biomeLabel=document.createElement('span');
   biomeLabel.className='level-atlas-card-biome';
   biomeLabel.textContent=biome.biomeLabel;
   button.appendChild(biomeLabel);
  }
  button.appendChild(caption);
  if(entry.unlocked)button.addEventListener('click',()=>{
   if(load(entry.index))closeLevelAtlas();
  });
  fragment.appendChild(button);
 }
 grid.append(fragment);
}
function openLevelAtlas(opener=document.activeElement){
 levelAtlasOpener=opener;
 $('level-menu').classList.remove('hidden');
 renderLevelAtlas();
 const current=$('level-grid').querySelector('[aria-current="step"]');
 (current&&!current.disabled?current:$('levels-close')).focus();
}
function closeLevelAtlas(){
 $('level-menu').classList.add('hidden');
 const opener=levelAtlasOpener;
 levelAtlasOpener=null;
 if(opener?.isConnected&&opener.getClientRects().length)opener.focus();
 else $('levels-button').focus();
}
function focusWithinLevelAtlas(e){
 const active=[...$('level-menu').querySelectorAll('button:not(:disabled)')];
 if(!active.length)return;
 const first=active[0],last=active[active.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
}
let currentStageEntry='new';
function syncLevelIntroText(){
 const l=levels[levelIndex];if(!l)return;
 $('level-intro-index').textContent=t(language,'atlasIntro',{
  number:String(levelIndex+1).padStart(3,'0'),total:String(levels.length).padStart(3,'0')
 });
 $('level-intro-title').textContent=loc(l.title,language);
 $('level-intro-pack').textContent=t(language,packLabelKey());
 if(activeEnvironment){
  const info=stagePresentation(activeEnvironment,language,currentStageEntry);
  $('level-intro-mode').textContent=t(language,info.statusKey);
  $('level-intro-biome').textContent=info.biomeLabel;
  for(const id of ['level-intro','level-arrival']){
   const element=$(id);
   element.dataset.biome=info.biome;
   element.style.setProperty('--level-accent',info.accent);
  }
 }
}
function hideLevelIntro(){
 $('level-intro').classList.remove('show');
 $('level-arrival').classList.remove('show');
}
function showLevelIntro(){
 syncLevelIntroText();
 const overlay=$('level-intro');
 const arrival=$('level-arrival');
 hideLevelIntro();
 // Restart all CSS keyframes even on rapid level changes. Neither surface
 // accepts mouse, touch, or keyboard input.
 void overlay.offsetWidth;
 arrival.classList.add('show');
 overlay.classList.add('show');
}

function syncDraftIndicator(){
 const el=$('draft-status');
 let hasDraft=false;
 try{hasDraft=Boolean(gameStorage().getItem(draftKey(currentPackId,levelIndex)))}catch{}
 el.textContent=hasDraft&&!won?t(language,'draftSaved'):'';
}
function persistDraft(){
 if(!pieces.length)return;
 const value=won?null:encodePuzzleDraft(levels[levelIndex],pieces,movable);
 try{
  const key=draftKey(currentPackId,levelIndex);
  if(value)gameStorage().setItem(key,value);
  else gameStorage().removeItem(key);
 }catch{}
 syncDraftIndicator();
 if(!$('level-menu').classList.contains('hidden'))renderLevelAtlas();
}
function packLabelKey(){
 return levels[levelIndex]?.sourceGame?'originalPack':currentPackId===demoPackId?'prototype':'classicPack';
}
function currentCampaign(){
 for(const [game,pack] of classicLibrary)if(pack===levels)return 'classic'+game;
 return currentPackId===demoPackId?'demo':'imported';
}
function syncCampaignTabs(){
 const campaign=currentCampaign();
 for(const tab of document.querySelectorAll('.campaign-tab')){
  const key=tab.dataset.campaign;
  if(key.startsWith('classic'))tab.hidden=!classicLibrary.has(Number(key.slice(7)));
  const active=key===campaign;
  tab.classList.toggle('active',active);
  tab.setAttribute('aria-selected',String(active));
 }
}
function switchCampaign(next){
 const pack=next==='demo'?demoLevels:/^classic[1-4]$/.test(next)?classicLibrary.get(Number(next.slice(7))):null;
 if(!pack)return currentCampaign();
 if(levels!==pack)switchLevelPack(pack);
 campaignPreference=next;
 store('chromatron-start-campaign',next);
 syncCampaignTabs();
 updateLocalizedLevel();
 return currentCampaign();
}
function updateLocalizedLevel(){
 const l=levels[levelIndex];if(!l)return;
 $('level-title').textContent=loc(l.title,language);
 $('level-desc').textContent=loc(l.description,language);
 const packLabel=$('level-pack-label');
 packLabel.removeAttribute('data-i18n');
 packLabel.textContent=t(language,packLabelKey());
 const chapter=$('chapter');
 if(l.chapter){
  chapter.removeAttribute('data-i18n');
  chapter.textContent=loc(l.chapter,language);
 }else if(l.sourceGame){
  chapter.removeAttribute('data-i18n');chapter.textContent='CHROMATRON '+l.sourceGame;
 }else{
  chapter.setAttribute('data-i18n','chapter');
  chapter.textContent=t(language,'chapter');
 }
 $('prev').setAttribute('aria-label',language==='pl'?'Poprzednia zagadka':'Previous puzzle');
 $('next').setAttribute('aria-label',language==='pl'?'Następna zagadka':'Next puzzle');
 updateStatus();renderInventory();renderHints();renderAnalyzer();syncCameraLabel();updateCoach();
 syncLevelIntroText();renderLevelAtlas();syncDraftIndicator();syncCampaignTabs();
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
 levelIndex=0;
 verifiedSolutions.clear();
 try{
  solved=JSON.parse(gameStorage().getItem('chromatron-reborn-solved-'+currentPackId)||'[]');
  skipped=JSON.parse(gameStorage().getItem('chromatron-reborn-skipped-'+currentPackId)||'[]');
  if(!Array.isArray(solved))solved=[];
  if(!Array.isArray(skipped))skipped=[];
 }catch{solved=[];skipped=[]}
 try{
  const remembered=Number(gameStorage().getItem('chromatron-reborn-access-'+currentPackId));
  accessFloor=Number.isFinite(remembered)?Math.max(0,Math.min(levels.length-1,Math.trunc(remembered))):0;
 }catch{accessFloor=0}
 let resume=0;
 try{resume=Number(gameStorage().getItem('chromatron-reborn-level-'+currentPackId)||0)}catch{}
 load(Number.isInteger(resume)?Math.min(Math.max(resume,0),levels.length-1):0);
 return levels.length;
}
function load(i,{silentIntro=false,allowLocked=false}={}){
 if(!Number.isInteger(i))return false;
 const requested=(i%levels.length+levels.length)%levels.length;
 if(!allowLocked&&!getLevelAtlas().entries[requested].unlocked){
  toast(t(language,'atlasLockedHint'));
  return false;
 }
 cancelBoardGesture();finishTrayGesture(null,false);
 cancelSolutionSearch();
 if(victoryFX){victoryFX.dispose();victoryFX=null}
 // ── Level transition animation: fog-in → swap → fog-out ──
 const prevBiome=activeEnvironment?.id;
 levelIndex=requested;
 applyLevelEnvironment();
 const newBiome=activeEnvironment?.id;
 if(prevBiome&&prevBiome!==newBiome&&!reducedMotion.matches){
  levelTransition={start:performance.now(),duration:800,
   fogFrom:scene.fog.density,fogPeak:0.035,fogTo:scene.fog.density,
   exposureFrom:cinematic.pass.uniforms.uExposure.value,phase:'in'};
 }

 const l=levels[levelIndex];pieces=l.pieces.map(([type,x,y,rot,color])=>{
  const inTray=Boolean(l.startMovablesInTray&&movable.has(type));
  return {id:++nextId,type,x,y,color,rot:l.sourceGame&&inTray?0:rot,sourceGame:l.sourceGame,inTray};
 });
 let restoredDraft=false;
 // Restore a private, validated per-level draft. Invalid or old versions
 // cannot modify the board and are discarded without losing the puzzle.
 try{
  const key=draftKey(currentPackId,levelIndex);
  const raw=gameStorage().getItem(key);
  if(raw){
   const restored=restorePuzzleDraft(l,pieces,raw,movable);
   if(restored){pieces=restored;restoredDraft=true}
   else gameStorage().removeItem(key);
  }
 }catch{}
 selected=null;wheelRotation.reset();placementMode=false;draggedPiece=null;history=[];redoHistory=[];won=false;tutorialPlaced=false;$('win').classList.add('hidden');
 $('hint-overlay').classList.add('hidden');
 let legacyHints=0;
 if(currentPackId===demoPackId){
  try{legacyHints=clampHints(gameStorage().getItem(progressKey(levelIndex)))}catch{}
 }
 wallet=ensurePreviousHints(wallet,currentLevelKey(),legacyHints);
 hintCount=wallet.unlocked[currentLevelKey()]||0;
 saveWallet();
 $('level-index').textContent=String(levelIndex+1).padStart(3,'0');
 $('total-levels').textContent=String(levels.length).padStart(3,'0');
 syncLevelControls();
 currentStageEntry=stageEntryMode({
  restored:restoredDraft,completed:solved.includes(levelIndex)
 });
 update();updateLocalizedLevel();syncUndoButtons();
 store('chromatron-reborn-level-'+currentPackId,String(levelIndex));
 if(currentPackId===demoPackId)store('chromatron-reborn-level',String(levelIndex));
 if(silentIntro)hideLevelIntro();
 else showLevelIntro();
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
 persistDraft();
}
function renderInventory(){
 const el=$('inventory'),scroll=el.scrollTop;
 const expanded=Boolean(el.querySelector('details')?.open);
 el.replaceChildren();
 const fixtures=document.createElement('details');
 fixtures.className='tray-fixtures';fixtures.open=expanded;
 const summary=document.createElement('summary');
 summary.textContent=language==='en'?'Fixed on the board':'Stałe na planszy';
 fixtures.append(summary);
 const groups=new Map();
 for(const piece of pieces){
  const key=piece.type==='filter'?'filter:'+piece.color:piece.type;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(piece);
 }
 for(const candidates of [...groups.values()].sort((a,b)=>Number(b.some(p=>p.inTray))-Number(a.some(p=>p.inTray)))){
  const {type,color}=candidates[0];
  const typeLabel=t(language,'type'+type[0].toUpperCase()+type.slice(1));
  const label=type==='filter'?typeLabel+' · '+colorName(color,language):typeLabel;
  const tray=candidates.filter(p=>p.inTray);
  const movableType=movable.has(type);
  const item=document.createElement(movableType?'button':'div');
  item.className='inventory-item'+(movableType?' selectable':'');
  if(currentPackId===demoPackId&&levelIndex===0&&!coachDismissed&&!selected&&type==='mirror'&&levels[0]?.startMovablesInTray)item.classList.add('coach-focus');
  item.type=movableType?'button':undefined;
  item.dataset.opticType=type;
  item.title=label+' — '+opticDescription(type,language);
  item.setAttribute('aria-description',opticDescription(type,language));
  if(!movableType)item.tabIndex=0;
  item.addEventListener('mouseenter',e=>showInventoryMechanics(type,e.clientX,e.clientY));
  item.addEventListener('mouseleave',hideOpticTooltip);
  item.addEventListener('focus',()=>{const b=item.getBoundingClientRect();showInventoryMechanics(type,b.left,b.top+b.height/2)});
  item.addEventListener('blur',hideOpticTooltip);
  if(movableType){
   item.setAttribute('aria-label',label);
   if(selected?.inTray && candidates.includes(selected))item.classList.add('selected');
   // Keep exhausted equipment focusable so its explanation is still
   // available with the mouse and keyboard.
   item.setAttribute('aria-disabled',String(tray.length===0));
   item.addEventListener('click',()=>{
    const first=nextTrayPiece(candidates,type);
    if(first)selectFromTray(first);
    else toast(t(language,'emptyTray'));
   });
   item.setAttribute('aria-pressed',String(selected?.inTray&&candidates.includes(selected)||false));
   if(tray.length)item.addEventListener('pointerdown',e=>{
    if(e.isPrimary&&e.button===0)trayGesture={id:e.pointerId,x:e.clientX,y:e.clientY,
     piece:nextTrayPiece(candidates,type),active:false};
   });
  }
  const icon=document.createElement('span');icon.className='component-icon';
  const portrait=document.createElement('img');
  portrait.src=import.meta.env.BASE_URL+'portraits/'+type+'.png';
  portrait.alt='';portrait.draggable=false;icon.append(portrait);
  const name=document.createElement('span');name.textContent=label;
  const count=document.createElement('strong');
  count.textContent='×'+(movableType?tray.length:candidates.length);
  item.append(icon,name,count);(movableType?el:fixtures).appendChild(item);
 }
 if(fixtures.children.length>1)el.append(fixtures);
 el.scrollTop=scroll;
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
 const show=currentPackId===demoPackId&&levelIndex===0&&!coachDismissed&&!currentResult?.won&&Boolean(levels[0]?.startMovablesInTray);
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
  const piece=group.userData.piece;
  if(piece?.type!=='target'||group.userData.modelActive===undefined)continue;
  const active=(currentResult?.received.get(piece.id)||0)===piece.color;
  if(group.userData.modelActive!==active){
   opticModels.tint(group,new THREE.Color(COLORS[piece.color]),active);
   group.userData.modelActive=active;
  }
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
  if(previewModel)previewModel.rotation.y=-selected.rot*Math.PI/4;
  syncTransformTools();
  persistDraft();
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
 persistDraft();
 beep(540,.05);
}
function move(x,y,fromDrag=false,rotation=selected?.rot){
 if(!selected)return false;
 wheelRotation.reset();
 // An existing optic can move ONLY when the player physically drags it.
 if(!selected.inTray&&!fromDrag)return false;
 if(!isFreeCell(pieces,selected,x,y)){toast(t(language,'cellOccupied'));return false}
 if(!selected.inTray&&selected.x===x&&selected.y===y)return false;
 saveHistory();selected.x=x;selected.y=y;selected.rot=rotation;selected.inTray=false;
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
const beep=soundscape.effect;

let cameraTween=null,cameraTop=false;
function syncCameraLabel(){
 $('camera-preset').setAttribute('aria-pressed',String(cameraTop));
 $('camera-preset-label').textContent=t(language,cameraTop?'analysisCameraIso':'analysisCameraTop');
}
function toggleCameraPreset(){
 cameraTop=!cameraTop;
 const nextYaw=cameraTop?0:-.80,nextPitch=cameraTop?1.49:.86;
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
 camera.updateMatrixWorld();
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
 heroScenery.setQuality(graphicsMode==='auto'?autoLevel:graphicsMode);
 terraces.setQuality(graphicsMode==='auto'?autoLevel:graphicsMode);
 midgroundScenery.setQuality(graphicsMode==='auto'?autoLevel:graphicsMode);
 ambientLife.setQuality(graphicsMode==='auto'?autoLevel:graphicsMode);
 livingWorld.setQuality(graphicsMode==='auto'?autoLevel:graphicsMode);
 boardEdgeGlow.setQuality(graphicsMode==='auto'?autoLevel:graphicsMode);
 atmosphereParticles.setQuality(graphicsMode==='auto'?autoLevel:graphicsMode);
 cinematic.setQuality(graphicsMode==='auto'?autoLevel:graphicsMode);
 renderer.setPixelRatio(Math.min(devicePixelRatio,graphicsProfile.pixelRatio));
 composer.setPixelRatio(renderer.getPixelRatio());
 bloomPass.strength=graphicsProfile.bloomStrength;
 bloomPass.enabled=graphicsProfile.bloomStrength>0&&(graphicsMode==='auto'?autoLevel:graphicsMode)!=='performance';
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
function boardPoint(clientX,clientY){
 mouse.set(clientX/innerWidth*2-1,-clientY/innerHeight*2+1);
 ray.setFromCamera(mouse,camera);
 return ray.ray.intersectPlane(plane,new THREE.Vector3());
}
function cellAt(clientX,clientY,offset){
 const point=boardPoint(clientX,clientY);
 if(!point)return null;
 if(offset)point.sub(offset);
 const x=Math.round(point.x/T+HALF),y=Math.round(point.z/T+HALF);
 return x>=0&&x<GRID&&y>=0&&y<GRID?{x,y}:null;
}
function hit(clientX,clientY){
 const cell=cellAt(clientX,clientY);
 // A tall head can cover a neighbouring cell from this camera angle. Resolve
 // the foremost visible surface first, including instanced barrier panels.
 const front=ray.intersectObjects(hitObjects,false)[0];
 if(front){
  const {object,instanceId}=front;
  const piece=object.userData.instances?.[instanceId]||object.userData.piece;
  if(piece)return {piece};
 }
 // The full tile is still an easy target in the gaps around a small optic.
 const occupant=cell&&pieces.find(p=>!p.inTray&&p.x===cell.x&&p.y===cell.y);
 return occupant?{piece:occupant}:cell;
}
const previewMat=new THREE.MeshBasicMaterial({color:0x69e6ff,transparent:true,opacity:.25,depthWrite:false,depthTest:false});
const placementPreview=mesh(new THREE.BoxGeometry(T*.90,.025,T*.90),previewMat,world);
placementPreview.visible=false;placementPreview.renderOrder=18;
const previewEdgeMat=new THREE.LineBasicMaterial({color:0x8ce9ff,depthTest:false});
const previewEdge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(T*.92,.04,T*.92)),previewEdgeMat);
placementPreview.add(previewEdge);
let previewModel=null,previewPiece=null;
function previewInstrument(piece){
 if(previewPiece!==piece||!previewModel){
  if(previewModel)placementPreview.remove(previewModel);
  previewPiece=piece;
  previewModel=opticModels.cloneOptic(piece.type,new THREE.Color(COLORS[piece.color||7]));
  if(previewModel){
   previewModel.position.y=.23;
   placementPreview.add(previewModel);
  }
 }
 if(previewModel)previewModel.rotation.y=-piece.rot*Math.PI/4;
}

function updatePlacementPreview(e){
 if(!selected||(!placementMode&&!draggedPiece)){placementPreview.visible=false;return}
 const dest=cellAt(e.clientX,e.clientY,draggedPiece?down?.offset:null);
 if(!dest){placementPreview.visible=false;return}
 const {x,y}=dest;
 const occupied=pieces.some(p=>!p.inTray&&p!==selected&&p.x===x&&p.y===y);
 previewMat.color.setHex(occupied?0xff728c:0x72eac1);
 previewEdgeMat.color.setHex(occupied?0xff728c:0xa8f9d3);
 placementPreview.position.copy(vec(x,y,.075));
 previewInstrument(selected);
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
 if(!e.isPrimary||down)return;
 if(boardFocus)closeFocusDrawers();
 hideOpticTooltip();setHoverGlow(null);
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
 const offset=draggingCandidate?boardPoint(e.clientX,e.clientY)?.sub(vec(origin.piece.x,origin.piece.y,0)):null;
 down={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,pitch,button:e.button,moved:false,offset,
       mode:draggingCandidate?'piece':'orbit',origin};
 if(draggingCandidate)select(origin.piece);
 renderer.domElement.setPointerCapture(e.pointerId);
});
// One outline follows the candidate. Catalog materials are shared between
// copies of an instrument, so highlighting their material would mark its peers.
const hoverOutline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
 [[-.46,-.46],[.46,-.46],[.46,.46],[-.46,.46]].map(([x,z])=>new THREE.Vector3(x*T,0,z*T))),
 new THREE.LineBasicMaterial({color:0xffdd95,toneMapped:false,depthTest:false}));
hoverOutline.visible=false;hoverOutline.renderOrder=17;world.add(hoverOutline);
function setHoverGlow(piece){
 hoverOutline.visible=Boolean(piece&&!piece.inTray&&movable.has(piece.type)&&!placementMode);
 if(hoverOutline.visible)hoverOutline.position.copy(vec(piece.x,piece.y,.045));
}
renderer.domElement.addEventListener('pointermove',e=>{
 if(!e.isPrimary||down&&e.pointerId!==down.id)return;
 if(!down){
  updatePlacementPreview(e);
  const hovered=hit(e.clientX,e.clientY);
  renderer.domElement.style.cursor=hovered?.piece&&movable.has(hovered.piece.type)?'grab':placementMode?'crosshair':'default';
  setHoverGlow(hovered?.piece&&movable.has(hovered.piece.type)?hovered.piece:null);
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
 if(e.pointerId!==down?.id)return;
 const state=down;down=null;
 if(state.button===2){clearSelection();return}
 if(state.moved){
  if(state.mode==='piece'){
   const dest=document.elementFromPoint(e.clientX,e.clientY)===renderer.domElement&&cellAt(e.clientX,e.clientY,state.offset);
   if(dest){selected=state.origin.piece;move(dest.x,dest.y,true)}
  }
  draggedPiece=null;placementPreview.visible=false;
  renderer.domElement.style.cursor='default';
  return;
 }
 // Clicking an optic only selects it. Clicking elsewhere only places a
 // tray optic, otherwise it cancels selection (never warps an existing optic).
 const intent=classifyClick(state.origin,selected,placementMode);
 if(intent.action==='select')select(intent.piece);
 else if(intent.action==='place')move(intent.x,intent.y);
 else if(selected)clearSelection();
});
function cancelBoardGesture(e){
 if(e&&e.pointerId!==down?.id)return;
 down=null;draggedPiece=null;placementPreview.visible=false;
 setHoverGlow(null);renderer.domElement.style.cursor='default';
}
renderer.domElement.addEventListener('pointercancel',cancelBoardGesture);
renderer.domElement.addEventListener('lostpointercapture',cancelBoardGesture);
window.addEventListener('blur',()=>cancelBoardGesture());
renderer.domElement.addEventListener('pointerleave',()=>{
 if(!down)placementPreview.visible=false;
 setHoverGlow(null);hideOpticTooltip();
});
// Capture on the stable inventory container: selecting an optic redraws its button.
let trayGesture=null;
const carriedPortrait=document.createElement('img');
carriedPortrait.className='carried-portrait';carriedPortrait.alt='';
carriedPortrait.hidden=true;document.body.append(carriedPortrait);
function finishTrayGesture(e,commit){
 const drag=trayGesture;
 if(!drag||e&&drag.id!==e.pointerId)return;
 trayGesture=null;
 if(!drag.active)return;
 const inventory=$('inventory');
 if(inventory.hasPointerCapture(drag.id))inventory.releasePointerCapture(drag.id);
 carriedPortrait.hidden=true;
 document.body.classList.remove('carrying-optic');
 placementPreview.visible=false;
 if(commit&&document.elementFromPoint(e.clientX,e.clientY)===renderer.domElement){
  const dest=cellAt(e.clientX,e.clientY);
  if(dest&&move(dest.x,dest.y))return;
 }
 clearSelection();
}
window.addEventListener('pointermove',e=>{
 const drag=trayGesture;
 if(!drag||e.pointerId!==drag.id)return;
 if(!drag.active){
  if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
  if(!drag.piece?.inTray){trayGesture=null;return}
  drag.active=true;
  $('inventory').setPointerCapture(e.pointerId);
  carriedPortrait.src=import.meta.env.BASE_URL+'portraits/'+drag.piece.type+'.png';
  hideOpticTooltip();selectFromTray(drag.piece);
  document.body.classList.add('carrying-optic');
 }
 if(document.elementFromPoint(e.clientX,e.clientY)===renderer.domElement)updatePlacementPreview(e);
 else placementPreview.visible=false;
 carriedPortrait.hidden=placementPreview.visible&&Boolean(previewModel);
 if(!carriedPortrait.hidden)carriedPortrait.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)';
});
window.addEventListener('pointerup',e=>finishTrayGesture(e,true));
window.addEventListener('pointercancel',e=>finishTrayGesture(e,false));
$('inventory').addEventListener('lostpointercapture',e=>{
 if(e.target===$('inventory'))finishTrayGesture(e,false);
});
window.addEventListener('blur',()=>finishTrayGesture(null,false));
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
 if(!$('level-menu').classList.contains('hidden')){
  if(e.code==='Escape'){e.preventDefault();closeLevelAtlas()}
  else if(e.code==='Tab')focusWithinLevelAtlas(e);
  return;
 }
 if(e.code==='Escape'){cancelBoardGesture();finishTrayGesture(null,false);clearSelection();$('help-overlay').classList.add('hidden');$('hint-overlay').classList.add('hidden');$('win').classList.add('hidden');return}
 if(!$('help-overlay').classList.contains('hidden')||!$('hint-overlay').classList.contains('hidden')||!$('win').classList.contains('hidden'))return;
 if(e.code==='KeyM'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();openLevelAtlas();return}
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
$('levels-button').onclick=()=>openLevelAtlas($('levels-button'));
$('levels-open').onclick=()=>openLevelAtlas($('levels-open'));
$('levels-from-win').onclick=()=>openLevelAtlas($('levels-from-win'));
$('levels-close').onclick=closeLevelAtlas;
for(const tab of document.querySelectorAll('.campaign-tab')){
 tab.addEventListener('click',()=>switchCampaign(tab.dataset.campaign));
}
$('level-menu').addEventListener('click',event=>{
 if(event.target===$('level-menu'))closeLevelAtlas();
});
$('prev').onclick=()=>load(levelIndex-1);$('next').onclick=()=>load(levelIndex+1);
function resetLevel(allowLocked=false){
 try{gameStorage().removeItem(draftKey(currentPackId,levelIndex))}catch{}
 return load(levelIndex,{silentIntro:true,allowLocked});
}
$('reset').onclick=()=>resetLevel();
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
$('import-classic').onclick=$('atlas-import').onclick=()=>$('classic-files').click();
let importing=false;
async function handleDroppedFiles(fileList){
 const files=[...fileList].filter(f=>/\.(json|exe)$/i.test(f.name));
 if(!files.length||importing)return;
 importing=true;
 let worker;
 try{
  if(files.length>4)throw Error(language==='pl'?'Wybierz maksymalnie cztery pliki.':'Choose up to four files.');
  worker=new Worker(new URL('./classic-import-worker.js',import.meta.url),{type:'module'});
  const packs=await new Promise((resolve,reject)=>{
   worker.onmessage=({data})=>data.error?reject(Error(data.error)):resolve(data.packs);
   worker.onerror=event=>reject(Error(event.message));
   worker.postMessage(files);
  });
  const games=packs.flatMap(({levels})=>levels.map(l=>l.sourceGame));
  if(games.every(Boolean)){
   const groups=new Map();
   for(const level of packs.flatMap(p=>p.levels)){
    if(!groups.has(level.sourceGame))groups.set(level.sourceGame,[]);
    groups.get(level.sourceGame).push(level);
   }
   if([...groups.values()].some(pack=>pack.length!==50))throw Error(language==='pl'?'Wybierz jeden plik na część.':'Choose one file per game.');
   for(const [game,pack] of groups){
    classicLibrary.set(game,pack);
    store('chromatron-classic-'+game,JSON.stringify(pack));
   }
   switchCampaign('classic'+Math.min(...groups.keys()));
  }else switchLevelPack(packs.flatMap(p=>p.levels));
  $('help-overlay').classList.add('hidden');
  const message=t(language,'classicImportSuccess',{count:games.length});
  $('classic-import-status').textContent=message;toast(message);
 }catch(error){
  const message=t(language,'classicImportError',{message:String(error.message||error).slice(0,180)});
  $('classic-import-status').textContent=message;toast(message);
 }finally{worker?.terminate();importing=false}
}
$('classic-files').addEventListener('change',event=>{
 handleDroppedFiles(event.target.files);
 event.target.value='';
});
const carriesFiles=e=>e.dataTransfer?.types.includes('Files');
let dragCounter=0;
document.addEventListener('dragenter',e=>{
 if(!carriesFiles(e))return;
 e.preventDefault();
 if(++dragCounter===1)$('drop-zone').classList.remove('hidden');
});
document.addEventListener('dragover',e=>{
 if(carriesFiles(e)){e.preventDefault();e.dataTransfer.dropEffect='copy'}
});
document.addEventListener('dragleave',e=>{
 if(!dragCounter)return;
 if(--dragCounter===0)$('drop-zone').classList.add('hidden');
});
document.addEventListener('drop',e=>{
 if(!carriesFiles(e))return;
 e.preventDefault();dragCounter=0;$('drop-zone').classList.add('hidden');
 handleDroppedFiles(e.dataTransfer.files);
});
$('hint').onclick=()=>{
 $('hint-overlay').classList.remove('hidden');
 requestSolutionSearch();
 renderHints();
};
$('close-hint').onclick=()=>$('hint-overlay').classList.add('hidden');
$('reveal-hint').onclick=()=>{
 if(hintCount>=3)return toast(t(language,'allHints'));
 if(hintCount===2&&!verifiedSolutionForCurrent())
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
$('audio').onclick=async()=>{
 audioEnabled=!audioEnabled;
 try{await soundscape.setEnabled(audioEnabled)}catch{audioEnabled=false;await soundscape.setEnabled(false)}
 $('audio').setAttribute('aria-pressed',String(audioEnabled));
 $('audio').classList.toggle('enabled',audioEnabled);beep(700,.08);
};
$('graphics-quality').value=graphicsMode;
$('graphics-quality').addEventListener('change',e=>{
 graphicsMode=normalizeQuality(e.target.value);autoLevel='balanced';
 store('chromatron-graphics-quality',graphicsMode);
 applyGraphicsQuality();
});
const start=performance.now();
let fpsMark=0,fpsFrames=0,slowWindows=0,fastWindows=0,measuredFps=null,debugFrames=0;
function trackFrameRate(time){
 if(!fpsMark){fpsMark=time;return}
 fpsFrames++;
 const windowMs=time-fpsMark;
 if(windowMs<1500)return;
 const fps=Math.round(fpsFrames*1000/windowMs);
 measuredFps=fps;
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
 const still=debugFrozen||reducedMotion.matches;
 const animationTime=debugFrozen?0:time;
 spaceEnvironments.update(animationTime*.001,still);
 terraces.update(animationTime*.001,still);
 midgroundScenery.update(animationTime*.001,still);
 ambientLife.update(animationTime*.001,still);
 livingWorld.update(animationTime*.001,still);
 boardEdgeGlow.update(still?0:time*.001);
 atmosphereParticles.update(still?0:time*.001);
 cinematic.update(still?0:time*.001);
 // Damped camera dolly, independent of mouse/trackpad event granularity.
 const zoomDt=Math.min(70,Math.max(0,time-(zoomLastFrame||time-16)));
 zoomLastFrame=time;
 if(Math.abs(zoomTarget-dist)>.015){
  const amount=still?1:1-Math.exp(-zoomDt/115);
  dist+=(zoomTarget-dist)*amount;
  updateCamera();
 }else if(zoomTarget!==dist){dist=zoomTarget;updateCamera()}
 for(let i=opticTweens.length-1;i>=0;i--){
  const a=opticTweens[i];
  const fraction=Math.min(1,Math.max(0,(time-a.start)/a.duration));
  const e=easeOutCubic(fraction);
  applyOpticTween(a,debugFrozen?1:e);
  if(debugFrozen||fraction===1)opticTweens.splice(i,1);
 }
 if(cameraTween){
  const f=debugFrozen?1:Math.max(0,Math.min(1,(time-cameraTween.time)/520)),ease=f*f*(3-2*f);
  yaw=cameraTween.yaw0+(cameraTween.yaw1-cameraTween.yaw0)*ease;
  pitch=cameraTween.pitch0+(cameraTween.pitch1-cameraTween.pitch0)*ease;
  if(f===1)cameraTween=null;
  updateCamera();
 }
 for(const p of componentGroup.children)for(const c of p.children)if(c.userData.spin)c.rotation.y=debugFrozen?0:(time-start)*.001;
 for(const c of assistGroup.children)c.scale.setScalar(1+.09*Math.sin(animationTime*.005));
 selectionReticle.update(animationTime,still);
 if(laserVisuals)laserVisuals.update(animationTime*.001);
 if(victoryFX && (debugFrozen||!victoryFX.update((time-victorySince)*.001))){
  victoryFX.dispose();victoryFX=null;
 }
 // ── Level transition fog+exposure animation ──
 if(levelTransition){
  const lt=levelTransition;
  const elapsed=debugFrozen?lt.duration:time-lt.start;
  const half=lt.duration/2;
  if(elapsed<half){
   // Phase 1: fog in, exposure down
   const f=elapsed/half;
   const ease=f*f;
   scene.fog.density=lt.fogFrom+(lt.fogPeak-lt.fogFrom)*ease;
   cinematic.pass.uniforms.uExposure.value=1.0-0.35*ease;
  }else if(elapsed<lt.duration){
   // Phase 2: fog out, exposure up
   const f=(elapsed-half)/half;
   const ease=1-Math.pow(1-f,2);
   scene.fog.density=lt.fogPeak+(lt.fogTo-lt.fogPeak)*ease;
   cinematic.pass.uniforms.uExposure.value=0.65+0.35*ease;
  }else{
   scene.fog.density=lt.fogTo;
   cinematic.pass.uniforms.uExposure.value=1.0;
   levelTransition=null;
  }
 }
 if(debugEnabled)renderer.info.reset();
 composer.render();
 if(debugEnabled)debugFrames++;
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
  const hint=dynamic.verified?dynamic:(authored||dynamic);
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
 const needsVerified=next===2&&!known;
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
// Apply the persisted GPU preset before loading the first puzzle or any GLB.
// Previously only interactive quality changes updated the environment.
applyGraphicsQuality();
if(campaignPreference.startsWith('classic')&&classicLibrary.has(Number(campaignPreference.slice(7))))switchCampaign(campaignPreference);
else load(Number.isFinite(saved)?Math.min(Math.max(Math.trunc(saved),0),levels.length-1):0);
syncCampaignTabs();
syncWalletUI();
requestAnimationFrame(animate);
// For QA / external validation, expose read-only state and import API.
window.chromatron={
 getLayoutState:()=>({boardFocus:$('app').classList.contains('board-focus'),missionOpen:$('app').querySelector('.mission').classList.contains('drawer-open'),toolOpen:$('app').querySelector('.tool-panel').classList.contains('drawer-open')}),
 getState:()=>({level:levelIndex,pieces:pieces.map(p=>({...p})),selectedId:selected?.id??null,placementMode,result:{...currentResult,received:[...currentResult.received]}}),
 getVisualStats:()=>({modeledScenery:{...modeledScenery},boardChassis:chassisModels.orbital?.visible?'orbital':chassisModels.standard?.visible?'standard':'loading',activeOpticTweens:opticTweens.length,componentRebuilds,selectionVisible:selectionReticle.root.visible,selectionPieceId:selectionReticle.root.userData.pieceId??null,selectedVisualAngle:componentGroup.children.find(g=>g.userData.piece?.id===selected?.id)?.children.find(c=>c.userData.motionHead)?.rotation.y??null,qualityMode:graphicsMode,effectiveQuality:graphicsMode==='auto'?autoLevel:graphicsMode,antialiasing:graphicsProfile.antialias,planarReflections:componentGroup.children.flatMap(c=>{const out=[];c.traverse(obj=>{if(obj.isReflector)out.push(obj)});return out}).length,pixelRatio:renderer.getPixelRatio(),beamSegments:currentResult?.segments?.length||0,absorberHits:currentResult?.boundaryHits?.length||0,absorberStructure:laboratory.userData.beamPerimeter.getStats(),beamGeometryDrawCalls:laserVisuals?.geometryStats?.drawCalls??0,beamDynamicLights:laserVisuals?.dynamicLightCount??0,photonSystems:beamGroup.children.filter(c=>c.isPoints).length,guideObjects:guideGroup.children.length,instancedBoardLayers:gridGroup.children.filter(c=>c.isInstancedMesh).length,contactShadowInstances:opticShadows.mesh.count,environment:spaceEnvironments.getStats(),heroScenery:heroScenery.getStats(),midgroundScenery:midgroundScenery.getStats(),ambientLife:ambientLife.getStats(),blossomActive:Boolean(victoryFX),selectedType:selected?.type||null}),
 projectCell(x,y,height=0){const v=vec(x,y,height).project(camera);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2}},
 inspectPointer(clientX,clientY){
  const cell=cellAt(clientX,clientY);
  const h=placementMode&&selected?.inTray&&cell?cell:hit(clientX,clientY);
  const c=classifyClick(h,selected,placementMode);
  return {cell,hit:h?.piece?{pieceId:h.piece.id,pieceType:h.piece.type}:h,intent:c.action,selectedId:selected?.id??null,placementMode}
 },
 loadLevels(json){const next=loadLevelBundle(json);const count=switchLevelPack(next);toast(t(language,'imported',{count}));return count},
 getPuzzleTools:()=>({packId:currentPackId,levelKey:currentLevelKey(),credits:wallet.balance,unlocked:hintCount,verifiedSolution:!!verifiedSolutionForCurrent(),solverStatus}),
 getLevelAtlas:()=>getLevelAtlas(),
 getCampaign:()=>currentCampaign(),switchCampaign,
 getCampaignInfo:()=>({campaign:currentCampaign(),total:levels.length,chapters:[]}),
 setLanguage,getLanguage:()=>language,getHints:()=>hintCount
};

if(debugEnabled){
 renderer.info.autoReset=false;
 const gl=renderer.getContext();
 const gpuInfo=gl.getExtension('WEBGL_debug_renderer_info');
 const backend=gl.getParameter(gpuInfo?.UNMASKED_RENDERER_WEBGL??gl.RENDERER);
 window.__debug=Object.freeze({
  loadLevel(n){
   return Number.isInteger(n)&&n>=1&&n<=levels.length&&load(n-1,{silentIntro:true,allowLocked:true});
  },
  getLevelCount:()=>levels.length,
  getLevelState:()=>({...window.chromatron.getState(),number:levelIndex+1,campaign:currentCampaign(),
   theme:activeEnvironment.id,completed:solved.includes(levelIndex)}),
  setTheme(name){
   if(name!==null&&!SPACE_BIOMES.some(theme=>theme.id===name))return false;
   debugTheme=name;
   levelTransition=null;
   cinematic.pass.uniforms.uExposure.value=1;
   applyLevelEnvironment();
   return true;
  },
  freezeAnimations(freeze){debugFrozen=Boolean(freeze);if(debugFrozen)hideLevelIntro();},
  applyMove({index,x,y,rot,inTray=false}={}){
   const part=pieces[index];
   if(!Number.isInteger(index)||!part||!movable.has(part.type))return false;
   if(inTray){
    if(part.inTray)return false;
    select(part);
    returnToTray();
    return true;
   }
   if(!Number.isInteger(rot)||rot<0||rot>7||!isFreeCell(pieces,part,x,y))return false;
   select(part);
   if(part.inTray||part.x!==x||part.y!==y)return move(x,y,true,rot);
   if(part.rot===rot)return false;
   rotate(rot-part.rot);
   return true;
  },
  isSolved:()=>Boolean(currentResult?.won),
  getStats:()=>({fps:measuredFps,frames:debugFrames,drawCalls:renderer.info.render.calls,
   triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,
   geometries:renderer.info.memory.geometries,pixelRatio:renderer.getPixelRatio(),backend,
   quality:graphicsMode==='auto'?autoLevel:graphicsMode}),
  resetLevel:()=>resetLevel(true),undo,redo,
  switchCampaign
 });
}
