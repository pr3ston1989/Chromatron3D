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
import {createShipyard} from './shipyard.js';
import {createCampaignArt} from './campaign-art.js';
import {createOrbitalBenchmark,orbitalArt} from './orbital-benchmark.js';
import {createSkyMeteor} from './sky-meteor.js';
import {campaignWorld, getCampaignWorld} from './campaign-worlds.js';
import {opticDescription,opticExample} from './optic-help.js';
import {renderSelectionGuides} from './beam-guides.js';
import {renderLaserFX} from './laser-vfx.js';
import {createOpticIllumination} from './optic-illumination.js';
import {createCollectorField} from './collector-field.js';
import {createVictoryFX} from './victory-vfx.js';
import {mountRealMirror,disposeReflectionTargets} from './mirror-reflections.js';
import {applyPanelSurface} from './panel-surface.js';
import {createOpticModelLoader} from './optic-model-loader.js';
import {createCinematicPass} from './cinematic-pass.js';
import {createBoardEdgeGlow} from './board-edge-glow.js';
import {createAtmosphereParticles} from './atmosphere-particles.js';
import {normalizeQuality,profileFor,reflectionCandidates,nextAutoProfile} from './visual-quality.js';
import {easeOutCubic,shortestAngle,travelDuration} from './optic-motion.js';
import {applyOpticTween,enqueueOpticTween} from './optic-tween-clock.js';
import {boardArrowOffset,classifyClick,isFreeCell,nextTrayPiece} from './interaction-model.js';
import {createSelectionReticle} from './selection-reticle.js';
import {createBoardSymbols} from './board-symbols.js';
import {createOverheadGrid} from './overhead-grid.js';
import {createOpticContactShadows} from './optic-contact-shadows.js';
import {createWheelRotation,toWheelPixels} from './wheel-rotation.js';
import './style.css';
import './redesign.css';
import './compact-layout.css';
import './level-atlas.css';
import './stage-arrival.css';
import './game-interface.css';
import './main-menu.css';
import './orbital-benchmark.css';
import './phone-board.css';
import {mountPhoneControls} from './phone-controls.js';
const $=id=>document.getElementById(id);
const GRID=15, HALF=7, T=1.3;
const searchParams=new URLSearchParams(location.search);
const debugEnabled=searchParams.get('debug')==='1';
const orbitalPilot=searchParams.get('benchmark')==='orbital';
const startsInGame=orbitalPilot||debugEnabled||searchParams.get('play')==='1';
$('app').classList.toggle('orbital-pilot',orbitalPilot);
if(orbitalPilot){
 const header=document.querySelector('.header');
 const sector=$('mission-world');
 sector.className='pilot-sector';header.insertBefore(sector,header.querySelector('.header-right'));
 header.querySelector('.header-right').prepend($('camera-preset'));
 document.querySelector('.hud-bottom').append($('hint'),$('review-result'));
}
const baselineScenery=debugEnabled&&searchParams.get('pilot')==='0';
const debugData=debugEnabled?new Map():null;
const transientStorage=debugData&&{
 getItem:key=>debugData.get(key)??null,
 setItem:(key,value)=>debugData.set(key,String(value)),
 removeItem:key=>debugData.delete(key)
};
const pilotStorage={
 getItem:key=>localStorage.getItem('kepler:'+key)??(['chromatron-reborn-language','chromatron-graphics-quality','chromatron-audio'].includes(key)?localStorage.getItem(key):null),
 setItem:(key,value)=>localStorage.setItem('kepler:'+key,value),
 removeItem:key=>localStorage.removeItem('kepler:'+key)
};
const gameStorage=()=>transientStorage||(orbitalPilot?pilotStorage:window.localStorage);
let debugFrozen=false,debugTheme=null;
const scene=new THREE.Scene();scene.background=new THREE.Color('#0d1b2c');scene.fog=new THREE.FogExp2('#0d1b2c',0.008);
const camera=new THREE.PerspectiveCamera(40,1,.1,200);
const cameraTarget=new THREE.Vector3(0,0,0);
const compactBoard=window.matchMedia('(max-width:680px), (max-width:960px) and (orientation:portrait)');
const phonePortrait=window.matchMedia('(pointer:coarse) and (max-width:680px) and (orientation:portrait)');
mountPhoneControls(phonePortrait);
const defaultZoom=44;
let yaw=orbitalPilot?-.56:-.80,pitch=.86,zoomLastFrame=0;
const orbitZoom={current:defaultZoom,target:defaultZoom};
const overheadZoom={current:defaultZoom,target:defaultZoom};
let boardFocus=false;
try{boardFocus=gameStorage().getItem('chromatron-board-focus')==='yes'}catch{}
let graphicsMode='auto',autoLevel='balanced';
try{graphicsMode=normalizeQuality(gameStorage().getItem('chromatron-graphics-quality'))}catch{}
let graphicsProfile=profileFor(graphicsMode,autoLevel);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}
catch(error){
 $('startup-status').textContent=t(normalizeLanguage(navigator.language),'webglUnavailable');
 throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio,graphicsProfile.pixelRatio));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=orbitalPilot?THREE.NeutralToneMapping:THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=orbitalPilot?1.06:1.23;
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
renderer.domElement.tabIndex=0;
renderer.domElement.setAttribute('role','application');
renderer.domElement.setAttribute('aria-describedby','board-keyboard-help');
renderer.domElement.setAttribute('aria-keyshortcuts','G');
const ambient=new THREE.AmbientLight(0xc8d6e1,.70);scene.add(ambient);
const key=new THREE.DirectionalLight(0xffebce,1.67);key.position.set(-8,16,12);scene.add(key);
if(orbitalPilot){
 renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
 key.castShadow=true;key.shadow.mapSize.set(1536,1536);
 Object.assign(key.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:.5,far:68});
 key.shadow.camera.updateProjectionMatrix();key.shadow.normalBias=.028;key.shadow.bias=-.00018;
}
const fill=new THREE.PointLight(0x2c6bff,25,35);fill.position.set(9,9,-9);scene.add(fill);
const world=new THREE.Group();scene.add(world);
const legacyScenery=new THREE.Group();world.add(legacyScenery);
const legacyAtmosphere=new THREE.Group();scene.add(legacyAtmosphere);
const tileGeo=new THREE.BoxGeometry(T*.97,.22,T*.97);
function mesh(geo,mat,parent=world){const m=new THREE.Mesh(geo,mat);parent.add(m);return m;}
const deck=mesh(new RoundedBoxGeometry(21,.75,21,4,.26),new THREE.MeshStandardMaterial({color:0x0a1324,metalness:.65,roughness:.32}));deck.position.y=-.62;
const gridGroup=new THREE.Group();world.add(gridGroup);
const setOverheadGrid=createOverheadGrid(THREE,world,{cells:GRID,tileSize:T});
// Two instanced draw calls replace 450 independent tile/line meshes.
// This preserves every logical cell and its coloring while keeping GPU headroom.
const tileMaterial=new THREE.MeshStandardMaterial({color:0xffffff,metalness:.48,roughness:.48});
const boardTiles=new THREE.InstancedMesh(tileGeo,tileMaterial,GRID*GRID);
const sceneryLoader=new GLTFLoader();
const orbitalScene=orbitalPilot?createOrbitalBenchmark(THREE,scene,world,sceneryLoader,syncBoardPresentation):null;
const campaignArt=createCampaignArt(THREE,scene,world,{loader:sceneryLoader,onReady:syncBoardPresentation});
const shipyard=createShipyard(THREE,scene,world,{
 loader:sceneryLoader,
 assets:{
  platform:new URL('../assets/models/overhaul-platform-shipyard.glb',import.meta.url).href,
  rib:new URL('../assets/models/scenery/shipyard-rib.glb',import.meta.url).href,
  berth:new URL('../assets/models/scenery/shipyard-platform.glb',import.meta.url).href,
  craft:new URL('../assets/models/overhaul-service-skiff.glb',import.meta.url).href
 },
 onReady:syncBoardPresentation
});
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
const collectorField=createCollectorField(THREE,world,{cells:GRID,tileSize:T,palette:COLORS});
sceneryLoader.load(new URL('../assets/models/field-rail.glb',import.meta.url).href,
 ({scene:rail})=>collectorField.setRail(rail));
const spaceEnvironments=createSpaceEnvironments(THREE,scene,legacyScenery,{tileSize:T,backdrop:legacyAtmosphere,
 loadFlora:(id,ready)=>sceneryLoader.load(import.meta.env.BASE_URL+'models/terraces/'+id+'-flora.glb',({scene})=>ready(scene))
});
const heroScenery=createHeroScenery(THREE,legacyScenery,{baseUrl:import.meta.env.BASE_URL+'models/biomes/'});
const midgroundScenery=createMidgroundScenery(THREE,legacyScenery,{baseUrl:import.meta.env.BASE_URL+'models/midground/'});
const terraces=createTerraces(THREE,legacyScenery,import.meta.env.BASE_URL+'models/terraces/');
const ambientLife=createAmbientLife(THREE,legacyScenery);
const modeledScenery={
 chassis:false,absorber:false,shuttle:false
};
const chassisModels={standard:null,orbital:null};
function syncBoardChassis(){
 const preview=usesNewArt();
 const showOrbital=baseEnvironment?.id==='orbital'&&Boolean(chassisModels.orbital);
 if(chassisModels.standard)chassisModels.standard.visible=!preview&&!showOrbital;
 if(chassisModels.orbital)chassisModels.orbital.visible=!preview&&showOrbital;
 deck.visible=!preview&&!modeledScenery.chassis;
 laboratory.userData.setChassisVisible(deck.visible);
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
sceneryLoader.load(new URL('../assets/models/scenery/perimeter-corner.glb',import.meta.url).href,({scene:corner})=>{
 laboratory.userData.beamPerimeter.setCornerModel(corner);
});
sceneryLoader.load(new URL('../assets/models/scenery/perimeter-brace.glb',import.meta.url).href,({scene:brace})=>{
 laboratory.userData.beamPerimeter.setBraceModel(brace);
});
sceneryLoader.load(new URL('../assets/models/service-shuttle.glb',import.meta.url).href,({scene:shuttle})=>{
 ambientLife.setOrbitalShuttle(shuttle);
 modeledScenery.shuttle=true;
});
const livingWorld=createLivingWorld(THREE,legacyAtmosphere,legacyScenery);
const boardEdgeGlow=createBoardEdgeGlow(THREE,legacyScenery,{tileSize:T,half:HALF});
const atmosphereParticles=createAtmosphereParticles(THREE,legacyAtmosphere);
let modelRefresh=0;
const benchModels=import.meta.glob('../assets/models/optical-bench/*.glb',{eager:true,import:'default',query:'?url'});
const benchPortraits=import.meta.glob('../assets/models/optical-bench/portraits/*.png',{eager:true,import:'default',query:'?url'});
const assetNames=files=>Object.fromEntries(Object.entries(files).map(([path,url])=>[path.split('/').pop().split('.')[0],url]));
const opticIllumination=createOpticIllumination(THREE,GRID,T);
const opticModels=createOpticModelLoader(THREE,{
 baseUrl:import.meta.env.BASE_URL+'models/optics/',portraitUrl:import.meta.env.BASE_URL+'portraits/',
 modelUrls:assetNames(benchModels),portraitUrls:assetNames(benchPortraits),illumination:opticIllumination,
 onReady(type){
  if(previewPiece?.type===type&&placementPreview.visible)previewInstrument(previewPiece);
  if(modelRefresh||!pieces.some(p=>p.type===type&&!p.inTray))return;
  modelRefresh=requestAnimationFrame(()=>{modelRefresh=0;rebuildPieces()});
 }
});
const environmentSessionSeed=debugEnabled?48129:Math.floor(Math.random()*0x7fffffff);
const skyMeteor=createSkyMeteor(THREE,scene,environmentSessionSeed);
const soundscape=createSoundscape();
let activeEnvironment=null,baseEnvironment=null;
function artForLevel(index,campaign=currentCampaign()){
 if(orbitalPilot&&levels===demoLevels)return orbitalArt;
 if(baselineScenery)return null;
 return debugTheme?getCampaignWorld(debugTheme):campaignWorld(campaign,index);
}
function usesNewArt(){return orbitalScene?.isVisible()||shipyard.isVisible()||campaignArt.isVisible()}
function syncBoardPresentation(){
 const preview=usesNewArt();
 legacyScenery.visible=legacyAtmosphere.visible=!preview;
 gridGroup.visible=!preview;
 laboratory.userData.setSceneryVisible(!preview);
 collectorField.group.visible=preview;
 syncBoardChassis();
 key.color.setHex(preview?activeEnvironment.key:0xffebce);
 const sunset=preview&&activeEnvironment.id==='heliostat';
 key.position.set(sunset?9:-8,sunset?12:16,sunset?-8:12);
 key.intensity=sunset?2.04:preview?1.61:1.67;
 fill.intensity=sunset?9:preview?16:25;
 ambient.intensity=preview?.43:.70;
 const grotto=preview&&activeEnvironment.id==='grotto';
 if(grotto){
  key.position.set(-15,11,-9);key.intensity=1.94;
  ambient.intensity=.49;fill.intensity=13;
 }
 if(orbitalScene?.isVisible()){
  // Grazing morning light across the panels, with cool fill from the planet.
  key.position.set(-18,16,-12);key.color.setHex(0xffead2);
  key.intensity=2.48;ambient.intensity=.33;
  renderer.shadowMap.needsUpdate=true;
 }
 if(preview){
  scene.fog.color.setHex(activeEnvironment.fog);
  scene.fog.density=grotto?.013:.007;
  if(levelTransition)levelTransition.fogTo=scene.fog.density;
 }
 updateCamera();
}
function applyLevelEnvironment(){
 const art=artForLevel(levelIndex);
 $('app').style.setProperty('--deck-accent',art?'#'+art.accent.toString(16).padStart(6,'0'):'');
 const theme=spaceEnvironments.setLevel(currentPackId,levelIndex,{seed:environmentSessionSeed,themeId:art?.legacyId??debugTheme});
 baseEnvironment=theme;
 activeEnvironment=art??theme;
 orbitalScene?.setLevel(art===orbitalArt);
 shipyard.setLevel(art?.id==='shipyard',currentCampaign(),levelIndex);
 campaignArt.setLevel(art?.id==='shipyard'||art===orbitalArt?null:art,currentPackId,levelIndex);
 if(theme.id==='orbital')loadOrbitalChassis();
 syncBoardPresentation();
 soundscape.setBiome(activeEnvironment.id);
 heroScenery.setLevel(theme.id,currentPackId,levelIndex,environmentSessionSeed);
 midgroundScenery.setLevel(theme.id,currentPackId,levelIndex,environmentSessionSeed);
 terraces.setLevel(theme.id,levelIndex);
 ambientLife.setLevel(theme.id,currentPackId,levelIndex,environmentSessionSeed);
 livingWorld.setLevel(theme.id,currentPackId,levelIndex,environmentSessionSeed);
 boardEdgeGlow.setTheme(theme);
 atmosphereParticles.setBiome(theme.id);
 atmosphereParticles.setQuality(graphicsMode==='auto'?autoLevel:graphicsMode);
 cinematic.setBiome(activeEnvironment.id);
 laboratory.userData.setTheme(theme,{packId:currentPackId,index:levelIndex,seed:environmentSessionSeed});
 const finish=deckSurfaceProfile(theme.decor);
 tileMaterial.metalness=finish.tileMetalness;
 tileMaterial.roughness=finish.tileRoughness;
 if(!art)applyPanelSurface(THREE,tileMaterial,theme.decor,.03);
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
const hintMarker=mesh(new THREE.TorusGeometry(.49,.05,8,36),new THREE.MeshBasicMaterial({
 color:0xc992ff,transparent:true,opacity:.9,depthWrite:false,depthTest:false
}));
hintMarker.rotation.x=Math.PI/2;hintMarker.renderOrder=20;hintMarker.visible=false;
const guideGroup=new THREE.Group();world.add(guideGroup);
const selectionReticle=createSelectionReticle(THREE,world,(x,y,height)=>new THREE.Vector3((x-HALF)*T,height,(y-HALF)*T),T);
const wheelRotation=createWheelRotation();
const hitObjects=[];
function choosePilotLevel(){
 let local=globalThis.chromatronLocalCampaigns?.find(pack=>pack.game===1)?.levels;
 if(!local&&!debugEnabled){try{local=JSON.parse(localStorage.getItem('chromatron-classic-1'))}catch{}}
 if(local?.length===50&&local[14]?.sourceGame===1){
  try{return validateLevels([local[14]])}catch{}
 }
 return validateLevels([PROTOTYPE_LEVELS[6]]);
}
const demoLevels=orbitalPilot?choosePilotLevel():validateLevels(PROTOTYPE_LEVELS);
let levels=demoLevels,levelIndex=0,pieces=[],selected=null,history=[],redoHistory=[],currentResult=null,won=false,audioEnabled=false;
let language='pl',hintCount=0,solved=[],skipped=[],spectrumActive=false,analysisActive=false;
let wallet=normalizeWallet(null);
let currentPackId=packFingerprint(levels);
const demoPackId=currentPackId;
const classicLibrary=new Map();
for(let game=1;!orbitalPilot&&game<=4;game++){
 try{
  const json=gameStorage().getItem('chromatron-classic-'+game);
  if(json){
   const pack=validateLevels(JSON.parse(json));
   if(pack.length===50&&pack.every(l=>l.sourceGame===game))classicLibrary.set(game,pack);
  }
 }catch{}
}
if(!orbitalPilot)for(const {game,levels:pack} of globalThis.chromatronLocalCampaigns||[])classicLibrary.set(game,pack);
delete globalThis.chromatronLocalCampaigns;
const firstOriginal=[...classicLibrary.keys()].sort((a,b)=>a-b)[0];
let campaignPreference=firstOriginal?'classic'+firstOriginal:'demo';
const verifiedSolutions=new Map();
let hintWorker=null,solvingId=null,solverStatus='';
let offeredGuide=null,guidedSolution=null;
let coachDismissed=false,tutorialPlaced=false;
let placementMode=false,relocation=false,draggedPiece=null;
let hasPlayed=false,winPending=false;
let winReward=0;
let wantsAudio=false,showBoardSymbols=true;
let saved=0;
try{
 saved=Number(gameStorage().getItem('chromatron-reborn-level-'+currentPackId)??
  gameStorage().getItem('chromatron-reborn-level')??0);
 language=normalizeLanguage(gameStorage().getItem('chromatron-reborn-language')||'pl');
 analysisActive=gameStorage().getItem('chromatron-reborn-analysis')==='on';
 const preference=gameStorage().getItem('chromatron-start-campaign');
 const previous=preference||gameStorage().getItem('chromatron-reborn-campaign');
 hasPlayed=gameStorage().getItem('chromatron-play-entered')==='yes'||Boolean(previous&&gameStorage().getItem('chromatron-reborn-level'));
 if(previous==='demo'&&preference)campaignPreference='demo';
 else if(/^classic[1-4]$/.test(previous)&&classicLibrary.has(Number(previous.slice(7))))campaignPreference=previous;
 coachDismissed=gameStorage().getItem('chromatron-coach-dismissed')==='yes';
 wantsAudio=gameStorage().getItem('chromatron-audio')==='on';
 showBoardSymbols=gameStorage().getItem('chromatron-board-symbols')!=='off';
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
function pieceColor({type,color}){
 return new THREE.Color(COLORS[type==='target'||type==='filter'?color:color||7]);
}
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
 const deck=activeEnvironment?.deck;
 const wallBatch=opticModels.instanceWalls(walls,p=>vec(p.x,p.y,0),deck);
 if(wallBatch){componentGroup.add(wallBatch);hitObjects.push(...wallBatch.children)}
 for(const p of pieces){
  if(p.inTray)continue;
  if(wallBatch&&p.type==='wall')continue;
  const g=new THREE.Group();g.position.copy(vec(p.x,p.y,.24));g.userData.piece=p;componentGroup.add(g);
  const color=pieceColor(p);
  const energized=p.type==='target'&&(currentResult?.received.get(p.id)||0)===p.color;
  const model=opticModels.cloneOptic(p.type,color,{energized,deck});
  if(model){
   const head=new THREE.Group();
   head.userData.motionHead=true;
   head.rotation.y=-p.rot*Math.PI/4;
   head.position.y=.65;
   model.position.y=-(g.position.y+head.position.y);
   head.add(model);g.add(head);
   if(reflectingIds.has(p.id))mountRealMirror(THREE,head,graphicsProfile.reflectionSize,opticIllumination);
   if(p.type==='target')g.userData.modelActive=energized;
   model.traverse(c=>{if(c.isMesh){c.castShadow=orbitalPilot;c.userData.piece=p;hitObjects.push(c)}});
  }else{
   // Keep the exact silhouette visible and selectable while the mesh arrives.
   // Slow or interrupted downloads use the matching Blender portrait.
   const portrait=opticModels.portrait(p.type,p.color);
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
 if(orbitalPilot)renderer.shadowMap.needsUpdate=true;
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
 opticIllumination.update(currentResult.segments,currentResult.boundaryHits);
 collectorField.updateHits(currentResult.boundaryHits);
 const lighting=activeEnvironment?.deck?{...graphicsProfile,opticScale:1.05,surfaceGlow:activeEnvironment.glow??.26}:graphicsProfile;
 laserVisuals=renderLaserFX(THREE,beamGroup,currentResult.segments,pieces,currentResult.received,COLORS,vec,lighting,currentResult.boundaryHits);
 $('counter').textContent=currentResult.active+' / '+currentResult.total;
 $('progress').style.width=(currentResult.total?currentResult.active/currentResult.total*100:0)+'%';
 if(!currentResult.won&&won){won=false;winPending=false;closeScreen('win',false);updateStatus();if(victoryFX){victoryFX.dispose();victoryFX=null}}
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
  winReward=earned.awarded;
  syncVictorySummary();
  updateStatus();syncLevelControls();renderLevelAtlas();
  const completedKey=currentLevelKey();
  winPending=true;
  setTimeout(()=>{
   if(won&&winPending&&currentLevelKey()===completedKey&&!screenVisible('main-menu')){
    openVictory();beep(880,.15);
   }
  },650);
 }
}
function store(key,value){try{gameStorage().setItem(key,value)}catch{}}
const screenOrder=['main-menu','win','hint-overlay','help-overlay','settings-overlay','level-menu'];
const screenOpeners=new Map();
const screenVisible=id=>!$(id).classList.contains('hidden');
const activeScreen=()=>screenOrder.findLast(screenVisible);
function syncScreenFocus(){
 const top=activeScreen();
 $('play-surface').inert=Boolean(top);
 for(const id of screenOrder)$(id).inert=Boolean(top&&id!==top);
 return top;
}
function showScreen(id,focusId,opener=document.activeElement){
 if(!activeScreen()){cancelBoardGesture();finishTrayGesture(null,false);hideOpticTooltip()}
 if(!screenVisible(id))screenOpeners.set(id,opener);
 $(id).classList.remove('hidden');
 syncScreenFocus();
 if(focusId)$(focusId).focus();
}
function closeScreen(id,restore=true){
 if(!screenVisible(id))return;
 $(id).classList.add('hidden');
 const opener=screenOpeners.get(id);
 screenOpeners.delete(id);
 const top=syncScreenFocus();
 if(!restore)return;
 if(opener?.isConnected&&opener.getClientRects().length&&!opener.closest('[inert]'))opener.focus();
 else if(!top)$('main-menu-toggle').focus();
 else $(top).querySelector('button:not(:disabled)')?.focus();
}
function keepScreenFocus(event,id){
 const controls=[...$(id).querySelectorAll('button:not(:disabled),select:not(:disabled),a[href]')]
  .filter(el=>el.tabIndex>=0&&el.getClientRects().length);
 if(!controls.length)return;
 const first=controls[0],last=controls.at(-1),active=document.activeElement;
 if(!controls.includes(active)||event.shiftKey&&active===first||!event.shiftKey&&active===last){
  event.preventDefault();(event.shiftKey?last:first).focus();
 }
}
function menuResumeIndex(){
 if(!hasPlayed||!solved.includes(levelIndex)||(!won&&encodePuzzleDraft(levels[levelIndex],pieces,movable)))
  return levelIndex;
 return getLevelAtlas().entries.find(entry=>entry.index>levelIndex&&entry.status==='available')?.index??null;
}
function syncMainMenu(){
 const index=menuResumeIndex();
 const label=!hasPlayed?'menuPlay':index===null?'menuReviewCampaign':index===levelIndex?'menuContinue':'menuNextPuzzle';
 $('menu-play-label').textContent=t(language,label);
 if(index===null){
  const {solvedCount,total}=getLevelAtlas();
  $('menu-destination').textContent=t(language,'menuCompletion',{solved:solvedCount,total});
 }else{
  $('menu-destination').textContent=t(language,'menuDestination',{
   level:String(index+1).padStart(3,'0'),title:loc(levels[index].title,language)
  });
 }
}
function playFromMainMenu(){
 const index=menuResumeIndex();
 if(index===null){openLevelAtlas($('menu-play'));return}
 if(index!==levelIndex&&!load(index,{silentIntro:true}))return;
 enterGame();
}
function openMainMenu(){
 if(orbitalPilot){location.assign(location.pathname);return}
 hideLevelIntro();
 syncMainMenu();showScreen('main-menu','menu-play');
}
function enterGame(showArrival=true){
 const opened=screenVisible('main-menu');
 hasPlayed=true;store('chromatron-play-entered','yes');
 closeScreen('main-menu');
 if(opened&&wantsAudio&&!audioEnabled)void applySound(true);
 if(winPending&&won)openVictory();
 else if(opened&&showArrival)showLevelIntro();
}
function updateStatus(){
 const el=$('level-status');
 el.textContent=solved.includes(levelIndex)?t(language,'statusSolved'):skipped.includes(levelIndex)?t(language,'statusSkipped'):'';
 el.classList.toggle('solved',solved.includes(levelIndex));
 $('hint').hidden=won;
 $('review-result').hidden=!won;
}
function getLevelAtlas(){
 return buildLevelAtlas(levels.length,solved,skipped,accessFloor);
}
function syncLevelControls(){
 const atlas=getLevelAtlas();
 $('prev').disabled=levelIndex===0;
 $('next').disabled=levelIndex>=levels.length-1||!atlas.entries[levelIndex+1]?.unlocked;
}
function atlasStage(index,campaign=currentCampaign(),packId=currentPackId){
 return stagePresentation(artForLevel(index,campaign)??environmentForLevel(packId,index,environmentSessionSeed),language);
}
function atlasImage(biome){
 return getCampaignWorld(biome)?`url('${import.meta.env.BASE_URL}art/sectors/${biome}.jpg')`:'none';
}
function syncVictorySummary(){
 if(!won)return;
 const stage=atlasStage(levelIndex),number=String(levelIndex+1).padStart(3,'0');
 const {solvedCount,total}=getLevelAtlas();
 const next=levels[levelIndex+1];
 $('win').style.setProperty('--victory-art',atlasImage(stage.biome));
 $('win-stage').textContent=t(language,'atlasLevel',{number})+' · '+stage.biomeLabel;
 $('win-level').textContent=loc(levels[levelIndex].title,language);
 $('win-resonators').textContent=currentResult.active+' / '+currentResult.total;
 $('win-progress').textContent=solvedCount+' / '+total;
 $('win-action-label').textContent=t(language,next?'next':'viewCampaign');
 $('win-next').textContent=next?loc(next.title,language):'';
 $('win-reward').textContent=winReward?t(language,'earnedCredits',{amount:winReward}):t(language,'noRewardRepeat');
}
function openVictory(){
 if(!won)return;
 winPending=false;
 showScreen('win','continue',$('review-result'));
}
function showAtlasStage(biome,title){
 const feature=$('atlas-feature');
 feature.style.setProperty('--atlas-art',atlasImage(biome.biome));
 feature.style.setProperty('--level-accent',biome.accent);
 $('atlas-world-name').textContent=biome.biomeLabel;
 $('atlas-world-title').textContent=title;
}
function renderLevelAtlas(){
 if($('level-menu').classList.contains('hidden'))return;
 const campaign=atlasCampaign??currentCampaign();
 const pack=campaignPack(campaign)??levels;
 const packId=pack===levels?currentPackId:packFingerprint(pack);
 const progress=pack===levels?null:readCampaignProgress(packId);
 const atlas=progress?buildLevelAtlas(pack.length,progress.solved,progress.skipped,progress.access):getLevelAtlas();
 const current=progress?(atlas.entries[progress.resume]?.unlocked?progress.resume:0):levelIndex;
 const stage=index=>atlasStage(index,campaign,packId);
 syncCampaignTabs();
 const grid=$('level-grid');
 const active=document.activeElement;
 const focused=grid.contains(active)?Number(active.dataset.levelIndex):null;
 const tabStop=atlas.entries[focused]?.unlocked?focused:(atlas.entries[current]?.unlocked?current:0);
 $('level-atlas-summary').textContent=t(language,'atlasSummary',{
  done:atlas.solvedCount,total:atlas.total,unlocked:atlas.unlockedCount
 });
 grid.replaceChildren();
 const sectors=/^classic[1-4]$/.test(campaign);
 grid.classList.toggle('sector-grid',sectors);
 grid.classList.toggle('demo-grid',campaign==='demo');
 showAtlasStage(stage(current),loc(pack[current].title,language));
 const fragment=document.createDocumentFragment();
 let sectorTiles=fragment;
 for(const entry of atlas.entries){
  const name=loc(pack[entry.index].title,language);
  const button=document.createElement('button');
  button.type='button';button.className='level-atlas-card';
  button.dataset.levelIndex=String(entry.index);
  button.dataset.status=entry.status;
  button.disabled=!entry.unlocked;
  button.tabIndex=entry.index===tabStop&&!button.disabled?0:-1;
  if(entry.index===current)button.setAttribute('aria-current','step');
  const number=String(entry.index+1).padStart(3,'0');
  const label=t(language,'atlasLevel',{number});
  const status=t(language,'atlas'+entry.status[0].toUpperCase()+entry.status.slice(1));
  const biome=stage(entry.index);
  if(sectors&&entry.index%25===0){
   const sector=document.createElement('section');sector.className='atlas-sector';
   sector.style.setProperty('--atlas-art',atlasImage(biome.biome));
   const heading=document.createElement('h3');heading.textContent=biome.biomeLabel;
   sectorTiles=document.createElement('div');sectorTiles.className='atlas-sector-tiles';
   sector.append(heading,sectorTiles);fragment.append(sector);
  }
  button.dataset.biome=biome.biome;
  button.style.setProperty('--level-accent',biome.accent);
  if(campaign==='demo')button.style.setProperty('--atlas-art',atlasImage(biome.biome));
  let hasDraft=false;
  if(entry.unlocked&&entry.status!=='solved'){
   try{hasDraft=Boolean(gameStorage().getItem(draftKey(packId,entry.index)))}catch{}
  }
  if(hasDraft)button.dataset.draft='true';
  button.setAttribute('aria-label',label+': '+(entry.unlocked?name+' · '+status+
   (hasDraft?' · '+t(language,'atlasInProgress'):''):status));
  button.title=entry.unlocked?name:t(language,'atlasLockedHint');
  const n=document.createElement('span');n.className='level-atlas-card-number';n.textContent=number;
  const title=document.createElement('strong');title.className='level-atlas-card-title';
  title.textContent=name;
  const caption=document.createElement('span');caption.className='level-atlas-card-status';
  caption.textContent=(entry.index===current?t(language,'atlasNow')+' · ':'')+
   (hasDraft?t(language,'atlasInProgress')+' · ':'')+status;
  button.append(n);
  if(entry.unlocked){
   button.append(title);
   const biomeLabel=document.createElement('span');
   biomeLabel.className='level-atlas-card-biome';
   biomeLabel.textContent=biome.biomeLabel;
   button.appendChild(biomeLabel);
  }
  button.appendChild(caption);
  if(entry.unlocked){
   const preview=()=>showAtlasStage(biome,name);
   button.addEventListener('pointerenter',preview);
   button.addEventListener('focus',preview);
   button.addEventListener('click',()=>{
    if(pack!==levels)switchCampaign(campaign,entry.index);
    else if((entry.index!==levelIndex||won)&&!load(entry.index))return;
    const fromMenu=screenVisible('main-menu');
    closeLevelAtlas();
    if(fromMenu)enterGame();
   });
  }
  sectorTiles.appendChild(button);
 }
 grid.append(fragment);
 if(focused!==null)grid.querySelector('[tabindex="0"]')?.focus({preventScroll:true});
}
function openLevelAtlas(opener=document.activeElement){
 atlasCampaign=currentCampaign();
 showScreen('level-menu','levels-close',opener);
 renderLevelAtlas();
 ($('level-grid').querySelector('[tabindex="0"]')??$('levels-close')).focus();
}
function closeLevelAtlas(){
 closeScreen('level-menu');
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
let atlasCampaign=null;
function campaignPack(key){
 if(key==='imported')return currentCampaign()==='imported'?levels:null;
 return key==='demo'?demoLevels:/^classic[1-4]$/.test(key)?classicLibrary.get(Number(key.slice(7))):null;
}
function syncCampaignTabs(){
 const campaign=(screenVisible('level-menu')&&atlasCampaign)||currentCampaign();
 for(const tab of document.querySelectorAll('.campaign-tab')){
  const key=tab.dataset.campaign;
  if(key.startsWith('classic'))tab.hidden=!classicLibrary.has(Number(key.slice(7)));
  if(key==='imported')tab.hidden=currentCampaign()!=='imported';
  const active=key===campaign;
  tab.classList.toggle('active',active);
  tab.setAttribute('aria-selected',String(active));
  tab.tabIndex=active?0:-1;
  if(active)$('atlas-content').setAttribute('aria-labelledby',tab.id);
 }
}
function switchCampaign(next,requestedIndex){
 const pack=campaignPack(next);
 if(!pack)return currentCampaign();
 if(levels!==pack)switchLevelPack(pack,requestedIndex);
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
 if(orbitalPilot&&l.sourceGame===1&&language==='pl')
  $('level-desc').textContent='Filtr przepuszcza jedną składową białego światła. Doprowadź właściwy kolor do każdego rezonatora.';
 const packLabel=$('level-pack-label');
 packLabel.removeAttribute('data-i18n');
 packLabel.textContent=t(language,packLabelKey());
 $('mission-world').textContent=atlasStage(levelIndex).biomeLabel;
 if(orbitalPilot)$('level-pack-label').textContent=t(language,'orbitalDemo');
 $('prev').setAttribute('aria-label',language==='pl'?'Poprzednia zagadka':'Previous puzzle');
 $('next').setAttribute('aria-label',language==='pl'?'Następna zagadka':'Next puzzle');
 syncVictorySummary();
 updateStatus();renderInventory();renderHints();renderAnalyzer();syncCameraLabel();updateCoach();
 syncLevelIntroText();renderLevelAtlas();syncDraftIndicator();syncCampaignTabs();syncMainMenu();syncMenuSettings();
}
function setLanguage(next){
 language=normalizeLanguage(next);
 store('chromatron-reborn-language',language);
 applyLanguage(language);
 syncFullscreenButton();syncBoardFocus();
 $('language').textContent=language.toUpperCase();
 $('menu-language').value=language;
 renderer.domElement.setAttribute('aria-label',t(language,'boardKeyboardLabel'));
 updateLocalizedLevel();
 refreshKeyboardCursor();
}
function readCampaignProgress(packId){
 const read=(key,fallback)=>{
  try{return JSON.parse(gameStorage().getItem('chromatron-reborn-'+key+'-'+packId))??fallback}
  catch{return fallback}
 };
 const readList=key=>{
  const value=read(key,[]);
  return Array.isArray(value)?value:[];
 };
 return {solved:readList('solved'),skipped:readList('skipped'),access:read('access',0),resume:read('level',0)};
}
function switchLevelPack(nextLevels,requestedIndex){
 if(!Array.isArray(nextLevels)||!nextLevels.length||nextLevels.length>250)
  throw new Error('Expected 1–250 validated puzzles');
 // Preserve earlier progress separately; a user's privately imported pack
 // must not overwrite achievements from the eight bundled demonstrations.
 store('chromatron-reborn-solved-'+currentPackId,JSON.stringify(solved));
 store('chromatron-reborn-skipped-'+currentPackId,JSON.stringify(skipped));
 levels=nextLevels;currentPackId=packFingerprint(levels);
 levelIndex=0;
 verifiedSolutions.clear();
 const progress=readCampaignProgress(currentPackId);
 ({solved,skipped,access:accessFloor}=progress);
 const atlas=getLevelAtlas();
 const resume=requestedIndex??progress.resume;
 load(Number.isInteger(resume)&&atlas.entries[resume]?.unlocked?resume:0);
 return levels.length;
}
function initialBoard(level,previous=[]){
 return level.pieces.map(([type,x,y,rot,color],index)=>{
  const inTray=movable.has(type)&&Boolean(level.startMovablesInTray||level.trayIndices?.includes(index));
  return {id:previous[index]?.id??++nextId,type,x,y,color,rot:level.sourceGame&&inTray?0:rot,sourceGame:level.sourceGame,inTray};
 });
}
function load(i,{silentIntro=false,allowLocked=false}={}){
 if(!Number.isInteger(i))return false;
 const requested=(i%levels.length+levels.length)%levels.length;
 if(!allowLocked&&!getLevelAtlas().entries[requested].unlocked){
  toast(t(language,'atlasLockedHint'));
  return false;
 }
 cancelBoardGesture();finishTrayGesture(null,false);
 if(phonePortrait.matches)resetPhoneFraming();
 cancelSolutionSearch();
 guidedSolution=offeredGuide=null;
 if(victoryFX){victoryFX.dispose();victoryFX=null}
 // ── Level transition animation: fog-in → swap → fog-out ──
 const prevBiome=activeEnvironment?.id;
 levelIndex=requested;
 closeReceiver();
 applyLevelEnvironment();
 const newBiome=activeEnvironment?.id;
 if(prevBiome&&prevBiome!==newBiome&&!reducedMotion.matches){
  levelTransition={start:performance.now(),duration:800,
   fogFrom:scene.fog.density,fogPeak:0.035,fogTo:scene.fog.density,
   exposureFrom:cinematic.pass.uniforms.uExposure.value,phase:'in'};
 }

 const l=levels[levelIndex];pieces=initialBoard(l);
 keyboardCell={x:HALF,y:HALF};
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
 selected=null;wheelRotation.reset();placementMode=false;relocation=false;draggedPiece=null;history=[];redoHistory=[];won=false;winPending=false;tutorialPlaced=false;
 closeScreen('win',false);closeScreen('hint-overlay',false);
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
 if(silentIntro||screenVisible('main-menu'))hideLevelIntro();
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
   mountRealMirror(THREE,head,graphicsProfile.reflectionSize,opticIllumination);
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
 syncBoardSymbols();
 refreshOverheadLayout();
}
function update(){
 rebuildBeams();rebuildPieces();
 selectionReticle.setPiece(selected);
 rebuildSelectionGuides();renderInventory();renderAnalyzer();updateCoach();syncTransformTools();
 placementPreview.visible=false;
 syncBoardSymbols();
 refreshHintGuide();
 persistDraft();
}
function syncEquipmentScroll(){
 const slots=$('equipment-slots');
 if(!slots)return;
 const end=slots.scrollWidth-slots.clientWidth;
 $('equipment-scroll').hidden=end<=1||!slots.clientWidth;
 $('equipment-prev').setAttribute('aria-disabled',String(slots.scrollLeft<=1));
 $('equipment-next').setAttribute('aria-disabled',String(slots.scrollLeft>=end-1));
}
function scrollEquipment(direction){
 const slots=$('equipment-slots');
 const [first,second]=slots.children;
 if(!second)return;
 const step=second.offsetLeft-first.offsetLeft;
 const columns=Math.max(1,Math.floor(slots.clientWidth/step)-1);
 slots.scrollBy({left:direction*columns*step,behavior:reducedMotion.matches?'instant':'smooth'});
}
$('equipment-prev').onclick=()=>scrollEquipment(-1);
$('equipment-next').onclick=()=>scrollEquipment(1);
new ResizeObserver(syncEquipmentScroll).observe($('inventory'));
const compactTrayLabels={multiFilter:'trayMultiFilter',dualReflector:'trayDualReflector',
 quadBender:'trayQuadBender',primaryLogicGate:'trayPrimaryLogicGate'};
function renderInventory(){
 const el=$('inventory'),scroll=el.scrollTop;
 const scrollAcross=el.querySelector('.equipment-slots')?.scrollLeft??0;
 const expanded=Boolean(el.querySelector('details')?.open);
 const active=document.activeElement;
 const focused=active?.matches(':focus-visible')&&el.contains(active)?active.dataset.slot:null;
 el.replaceChildren();
 const slots=document.createElement('div');
 slots.id='equipment-slots';slots.className='equipment-slots';
 slots.addEventListener('scroll',syncEquipmentScroll,{passive:true});
 el.append(slots);
 const fixtures=document.createElement('details');
 fixtures.className='tray-fixtures';fixtures.open=expanded;
 const summary=document.createElement('summary');
 summary.textContent=t(language,'fixedOptics');
 const fixtureItems=document.createElement('div');fixtureItems.className='fixture-items';
 fixtures.append(summary,fixtureItems);
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
  if((orbitalPilot||phonePortrait.matches)&&(!movableType||!tray.length))continue;
  const item=document.createElement(movableType?'button':'div');
  item.className='inventory-item'+(movableType?' selectable':'');
  if(currentPackId===demoPackId&&levelIndex===0&&!coachDismissed&&!selected&&type==='mirror'&&levels[0]?.startMovablesInTray)item.classList.add('coach-focus');
  item.type=movableType?'button':undefined;
  item.dataset.opticType=type;
  item.dataset.slot=type==='filter'?'filter:'+color:type;
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
   item.addEventListener('contextmenu',e=>e.preventDefault());
   item.addEventListener('auxclick',e=>{
    if(e.button!==2||e.pointerType==='touch'||!tray.length)return;
    const part=tray.includes(selected)?selected:nextTrayPiece(candidates,type);
    if(!part?.inTray)return;
    if(part!==selected)selectFromTray(part);
    rotate(1);
   });
   if(tray.length)item.addEventListener('pointerdown',e=>{
    if(e.isPrimary&&e.button===0)trayGesture={id:e.pointerId,x:e.clientX,y:e.clientY,
     piece:nextTrayPiece(candidates,type),active:false};
   });
  }
  const icon=document.createElement('span');icon.className='component-icon';
  const portrait=document.createElement('img');
  portrait.src=opticModels.portraitPath(type,color);
  portrait.alt='';portrait.draggable=false;icon.append(portrait);
  const name=document.createElement('span');
  if(movableType)name.className='equipment-name';
  name.textContent=movableType&&compactTrayLabels[type]?t(language,compactTrayLabels[type]):label;
  const count=document.createElement('strong');
  count.textContent='×'+(movableType?tray.length:candidates.length);
  item.append(icon,name,count);(movableType?slots:fixtureItems).appendChild(item);
 }
 if(fixtureItems.children.length)el.append(fixtures);
 syncPhoneInstruction();
 el.closest('.game-dock').style.setProperty('--stock-types',slots.childElementCount);
 slots.scrollLeft=scrollAcross;
 el.scrollTop=scroll;
 if(focused)el.querySelector(`[data-slot="${focused}"]`)?.focus({preventScroll:true});
 syncEquipmentScroll();
 const details=$('optic-info');
 details.classList.toggle('hidden',!selected);
 if(selected){
  const heading=t(language,'type'+selected.type[0].toUpperCase()+selected.type.slice(1));
  details.textContent=heading+' — '+opticDescription(selected.type,language)+
   (opticExample(selected.type,language)?' '+opticExample(selected.type,language):'');
 }
 $('return-tray').disabled=!(selected&&!selected.inTray&&movable.has(selected.type));
 renderSpectrum();
 refreshReceiver();
}
let inspectedReceiver=null;
function closeReceiver(restoreFocus=false){
 inspectedReceiver=null;
 $('receiver-card').hidden=true;
 $('receiver-toggle').setAttribute('aria-expanded','false');
 if(restoreFocus)$('receiver-toggle').focus();
}
function refreshReceiver(){
 if(!inspectedReceiver)return;
 const part=pieces.find(piece=>piece.id===inspectedReceiver);
 if(!part){closeReceiver();return}
 $('receiver-name').textContent=t(language,'spectralTarget')+' · '+(part.x+1)+', '+(part.y+1);
 for(const [id,mask] of [['receiver-required',part.color],['receiver-actual',currentResult?.received.get(part.id)||0]]){
  $(id).textContent=mask?colorName(mask,language):t(language,'analysisNoLight');
  $(id).style.setProperty('--signal',mask?COLORS[mask]:'#516075');
 }
}
function inspectReceiver(part){
 if(!part)return;
 inspectedReceiver=part.id;
 hideOpticTooltip();
 $('receiver-card').hidden=false;
 $('receiver-toggle').setAttribute('aria-expanded','true');
 refreshReceiver();
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
 $('relocate').hidden=!selected||selected.inTray;
 $('relocate').setAttribute('aria-pressed',String(relocation));
 if(selected){
  $('transform-caption').textContent=t(language,relocation?'relocateCaption':placementMode?'placementCaption':'selectedCaption');
  $('rotation-angle').textContent=String(selected.rot*45).padStart(3,'0')+'°';
 }
 const showGuides=Boolean(selected && !selected.inTray && ['mirror','bender','splitter'].includes(selected.type));
 $('beam-guide-legend').classList.toggle('hidden',!showGuides);
 $('guide-incoming').textContent=t(language,'guideIncoming');
 $('guide-outgoing').textContent=t(language,'guideOutgoing');
 refreshKeyboardCursor();
}
function clearSelection(){wheelRotation.reset();selected=null;placementMode=false;relocation=false;draggedPiece=null;refreshSelection()}
function selectFromTray(p){
 if(!p?.inTray||!movable.has(p.type))return;
 selected=p;placementMode=true;relocation=false;wheelRotation.reset();closeFocusDrawers();refreshSelection();beep(420,.04)
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
 relocation=false;
 update();syncUndoButtons();beep(410,.045);
}
function redo(){
 if(!redoHistory.length)return;
 wheelRotation.reset();
 const selection=selected?.id;
 history.push(snapshot());pieces=redoHistory.pop();
 selected=pieces.find(p=>p.id===selection)||null;
 placementMode=Boolean(selected?.inTray);
 relocation=false;
 update();syncUndoButtons();beep(580,.045);
}
function select(p){
 if(orbitalPilot&&p.type==='target'){inspectReceiver(p);return}
 closeReceiver();
 if(!movable.has(p.type)){toast(t(language,'selectLocked'));return}
 // Clicking the same optic again is intentionally inert: rotation is explicit.
 if(selected===p && !placementMode&&!relocation)return;
 selected=p;placementMode=Boolean(p.inTray);relocation=false;wheelRotation.reset();refreshSelection();beep(420,.04)
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
   opticModels.tint(group,new THREE.Color(COLORS[piece.color]),active,piece.type);
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
 refreshHintGuide();
 persistDraft();
 beep(540,.05);
}
function move(x,y,reposition=false,rotation=selected?.rot){
 if(!selected)return false;
 wheelRotation.reset();
 // An existing optic moves through a drag or the explicit move action.
 if(!selected.inTray&&!reposition)return false;
 if(!isFreeCell(pieces,selected,x,y)){toast(t(language,'cellOccupied'));return false}
 if(!selected.inTray&&selected.x===x&&selected.y===y)return false;
 saveHistory();selected.x=x;selected.y=y;selected.rot=rotation;selected.inTray=false;
 placementMode=false;relocation=false;draggedPiece=null;tutorialPlaced=true;update();beep(620,.06);
 return true;
}
function returnToTray(){
 if(!selected||selected.inTray||!movable.has(selected.type))return;
 wheelRotation.reset();
 saveHistory();selected.inTray=true;placementMode=false;relocation=false;selected=null;update();beep(390,.05);
}
let toastTimeout;
function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),2600)}
const beep=soundscape.effect;

let cameraTween=null,cameraTop=phonePortrait.matches,overheadBlend=Number(cameraTop),overheadFrame=null;
const phonePan={x:0,z:0};
let manualCamera=false;
const symbolPoint=new THREE.Vector3();
const boardSymbols=createBoardSymbols($('board-symbols'),(x,y)=>{
 symbolPoint.set((x-HALF)*T,0,(y-HALF)*T).project(camera);
 return {x:(symbolPoint.x+1)*innerWidth/2,y:(1-symbolPoint.y)*innerHeight/2};
});
function syncBoardSymbols(){boardSymbols.update(showBoardSymbols&&overheadBlend===1,pieces,selected)}
let orbitAngles={yaw,pitch};
if(cameraTop){yaw=0;pitch=Math.PI/2}
const activeZoom=()=>cameraTop?overheadZoom:orbitZoom;
function resetPhoneFraming(){
 phonePan.x=phonePan.z=0;
 overheadZoom.current=overheadZoom.target=defaultZoom;
 syncPhoneZoomLabel();
}
function syncPhoneZoomLabel(){
 const button=$('phone-magnify');
 const enlarged=cameraTop&&overheadZoom.target<defaultZoom-.1;
 button.setAttribute('aria-pressed',String(enlarged));
 button.lastElementChild.textContent=t(language,enlarged?'phoneFit':'phoneEnlarge');
 syncPhoneInstruction();
}
function syncPhoneInstruction(){
 if(!phonePortrait.matches)return;
 const placing=selected&&(placementMode||relocation);
 const enlarged=cameraTop&&overheadZoom.target<defaultZoom-.1;
 const hasStock=$('equipment-slots')?.childElementCount;
 const copy=t(language,placing?'phonePlace':enlarged?'phonePan':hasStock?'phonePick':'phoneBoard');
 if($('phone-instruction').textContent!==copy)$('phone-instruction').textContent=copy;
}
function syncCameraLabel(){
 $('app').classList.toggle('board-overhead',cameraTop);
 $('camera-preset').setAttribute('aria-pressed',String(cameraTop));
 const label=phonePortrait.matches?(cameraTop?'phoneCamera3D':'phoneCameraMap'):(cameraTop?'analysisCameraIso':'analysisCameraTop');
 $('camera-preset-label').textContent=t(language,label);
 syncPhoneZoomLabel();
}
const overheadObstacles=[...document.querySelectorAll('.optic-workbench,#analysis-panel,#spectral-inspector,#coach')];
const overheadHeader=document.querySelector('.header'),overheadMission=document.querySelector('.mission');
const overheadDock=document.querySelector('.game-dock');
function measureOverheadFrame(){
 if(!cameraTop)return;
 const portrait=innerHeight>innerWidth;
 const headerEnd=overheadHeader.getBoundingClientRect().bottom;
 const top=(portrait?Math.max(headerEnd,overheadMission.getBoundingClientRect().bottom):headerEnd)+8;
 let bottom=overheadDock.getBoundingClientRect().top-8;
 const center=innerWidth/2;
 let halfWidth=center-10;
 for(const element of overheadObstacles){
  const bounds=element.getBoundingClientRect();
  if(!bounds.height||getComputedStyle(element).visibility==='hidden')continue;
  if(bounds.left<=center&&bounds.right>=center)bottom=Math.min(bottom,bounds.top-8);
  else halfWidth=Math.min(halfWidth,Math.max(bounds.left-center,center-bounds.right)-8);
 }
 const height=Math.max(32,bottom-top);
 const size=Math.max(32,Math.min(height,halfWidth*2));
 if(phonePortrait.matches&&overheadFrame&&overheadZoom.target<defaultZoom-.1){
  // Keep the physical touch target stable when selection tools occupy a row.
  const target=Math.min(defaultZoom,overheadZoom.target*size/overheadFrame.size);
  overheadZoom.current=overheadZoom.target=target;
  syncPhoneZoomLabel();
 }
 overheadFrame={size,distance:GRID*T*innerHeight/(2*size*Math.tan(camera.fov*Math.PI/360)),
  offset:innerHeight/2-top-height/2};
}
function toggleCameraPreset(manual=true){
 if(manual)manualCamera=true;
 if(!cameraTop&&!cameraTween)orbitAngles={yaw,pitch};
 cameraTop=!cameraTop;
 syncCameraLabel();
 if(cameraTop){resetPhoneFraming();measureOverheadFrame()}
 else phonePan.x=phonePan.z=0;
 const nextYaw=cameraTop?0:orbitAngles.yaw,nextPitch=cameraTop?Math.PI/2:orbitAngles.pitch;
 const endBlend=cameraTop?1:0;
 if(reducedMotion.matches||phonePortrait.matches){
  cameraTween=null;yaw=nextYaw;pitch=nextPitch;overheadBlend=endBlend;updateCamera();
 }else cameraTween={yaw0:yaw,pitch0:pitch,yaw1:nextYaw,pitch1:nextPitch,
  blend0:overheadBlend,blend1:endBlend,time:performance.now()};
}
function updateCamera(){
 const viewportWidth=innerWidth;
 const pilot=usesNewArt();
 const mobile=compactBoard.matches;
 const closeup=pilot&&!mobile?Math.max(0,Math.min(1,(viewportWidth-1040)/300,(innerHeight-575)/160)):0;
 $('app').classList.toggle('stage-closeup',closeup>.4);
 // Portrait mode: fit a 15×15 board into the usable central viewport.
 const pilotMargin=pilot?2.13*(390/viewportWidth)*(innerHeight/844):1;
 const portraitScale=mobile?Math.max(1.55,720/Math.max(380,viewportWidth),pilotMargin):Math.max(1,pilotMargin);
 // With both HUD drawers folded away the board can occupy more of the viewport.
 const focusScale=boardFocus&&!mobile?(innerHeight<650 ? .93 : .86):1;
 const orbitDistance=orbitZoom.current*portraitScale*focusScale*(pilot&&!mobile?.94-.19*closeup:1)*(orbitalPilot&&!mobile?.94:1);
 const overheadDistance=overheadFrame?overheadFrame.distance*overheadZoom.current/defaultZoom:orbitDistance;
 const cameraDistance=THREE.MathUtils.lerp(orbitDistance,overheadDistance,overheadBlend);
 const framing=pilot?Math.min(1,Math.max(0,(1.49-pitch)/.63)):0;
 const viewPitch=Math.max(.27,pitch-(mobile?.22:shipyard.isVisible()?.32:.25)*framing-.08*closeup*framing);
 const viewYaw=yaw+.23*framing*(1-closeup);
 const panLimit=phonePortrait.matches&&cameraTop?Math.max(0,(1-overheadZoom.current/defaultZoom)*GRID*T/2):0;
 phonePan.x=THREE.MathUtils.clamp(phonePan.x,-panLimit,panLimit);
 phonePan.z=THREE.MathUtils.clamp(phonePan.z,-panLimit,panLimit);
 cameraTarget.x=phonePan.x;cameraTarget.z=phonePan.z;
 cameraTarget.y=(pilot?(mobile?1.15:-.65):0)*(1-overheadBlend);
 camera.up.set(0,overheadBlend===1?0:1,overheadBlend===1?-1:0);
 camera.position.set(Math.sin(viewYaw)*Math.cos(viewPitch)*cameraDistance,Math.sin(viewPitch)*cameraDistance,Math.cos(viewYaw)*Math.cos(viewPitch)*cameraDistance);
 camera.position.x+=phonePan.x;camera.position.z+=phonePan.z;
 camera.lookAt(cameraTarget);
 camera.updateMatrixWorld();
 const portraitOffset=pilot&&viewportWidth<innerHeight?Math.min(88,Math.max(0,(innerHeight-600)*.35)):0;
 const orbitOffset=mobile?portraitOffset:innerHeight<470?42:30+innerHeight*(orbitalPilot?.045:.075)*closeup;
 const offset=THREE.MathUtils.lerp(orbitOffset,overheadFrame?.offset??orbitOffset,overheadBlend);
 if(camera.view?.fullWidth!==innerWidth||camera.view?.fullHeight!==innerHeight||camera.view?.offsetY!==offset)
  camera.setViewOffset(innerWidth,innerHeight,0,offset,innerWidth,innerHeight);
 const overhead=overheadBlend===1;
 boardLines.visible=!overhead;
 setOverheadGrid(overhead,renderer.getPixelRatio(),pilot?activeEnvironment.fog:undefined);
 syncBoardSymbols();
}
function refreshOverheadLayout(){
 if(compactBoard.matches){
  const height=document.querySelector('.optic-workbench').getBoundingClientRect().height;
  $('app').style.setProperty('--workbench-height',height+'px');
  if(phonePortrait.matches)$('app').style.setProperty('--phone-dock-height',overheadDock.offsetHeight+'px');
 }
 // Selecting a piece can open controls under a drag. Keep its projected
 // start position stable until the gesture ends.
 if(!cameraTop||down||touchPinch||trayGesture?.active)return;
 measureOverheadFrame();updateCamera();
}
const overheadObserver=new ResizeObserver(refreshOverheadLayout);
for(const element of [overheadHeader,overheadMission,overheadDock,...overheadObstacles])overheadObserver.observe(element);
function syncBoardFocus(){
 const enabled=boardFocus&&!compactBoard.matches;
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
 if(compactBoard.matches)return;
 boardFocus=!boardFocus;
 store('chromatron-board-focus',boardFocus?'yes':'no');
 closeFocusDrawers();
 syncBoardFocus();
 updateCamera();
}
function toggleBoardDrawer(selector){
 const panel=$('app').querySelector(selector);
 if(!boardFocus||compactBoard.matches)return;
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
 syncMenuSettings();
 resize();
});
function resize(){
 const w=innerWidth,h=innerHeight;
 renderer.setSize(w,h);composer.setSize(w,h);
 const pixelRatio=renderer.getPixelRatio();
 fxaaPass.uniforms.resolution.value.set(1/Math.max(1,w*pixelRatio),1/Math.max(1,h*pixelRatio));
 syncBoardFocus();
 measureOverheadFrame();updateCamera();
}
function applyGraphicsQuality(){
 if(orbitalPilot){
  renderer.shadowMap.enabled=(graphicsMode==='auto'?autoLevel:graphicsMode)!=='performance';
  renderer.shadowMap.needsUpdate=true;
 }
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
 bloomPass.strength=graphicsProfile.bloomStrength*.48;
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
window.addEventListener('resize',resize);resize();
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
function cellOccupant(cell){
 return cell&&pieces.find(p=>!p.inTray&&p.x===cell.x&&p.y===cell.y);
}
function hit(clientX,clientY){
 const cell=cellAt(clientX,clientY);
 // The overhead view is a precise tile map even if an optic's model overhangs.
 if(overheadBlend===1){const part=cellOccupant(cell);return part?{piece:part}:cell}
 // A tall head can cover a neighbouring cell from this camera angle. Resolve
 // the foremost visible surface first, including instanced barrier panels.
 const front=ray.intersectObjects(hitObjects,false)[0];
 if(front){
  const {object,instanceId}=front;
  const piece=object.userData.instances?.[instanceId]||object.userData.piece;
  if(piece)return {piece};
 }
 // The full tile is still an easy target in the gaps around a small optic.
 const occupant=cellOccupant(cell);
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
  previewModel=opticModels.cloneOptic(piece.type,pieceColor(piece),{deck:activeEnvironment?.deck});
  if(previewModel){
   previewModel.position.y=0;
   placementPreview.add(previewModel);
  }
 }
 if(previewModel)previewModel.rotation.y=-piece.rot*Math.PI/4;
}

const placingByCell=()=>Boolean(selected&&(selected.inTray?placementMode:relocation));
function updatePlacementPreview(e){
 if(!selected||(!placingByCell()&&!draggedPiece)){placementPreview.visible=false;return}
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
 if(placingByCell()){
  const cell=cellAt(e.clientX,e.clientY);
  if(cell){
   blocked=!isFreeCell(pieces,selected,cell.x,cell.y);
   message=t(language,blocked?'tipOccupied':relocation?'tipRelocate':'tipPlace');
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
let down=null,touchPinch=null;
const boardTouches=new Map();
function touchSpan(){
 const [a,b]=boardTouches.values();
 return Math.max(1,Math.hypot(a.x-b.x,a.y-b.y));
}
function beginTouchPinch(){
 resetBoardPointer();
 const [a,b]=boardTouches.values();
 touchPinch={span:touchSpan(),zoom:activeZoom().target,
  anchor:phonePortrait.matches&&cameraTop?boardPoint((a.x+b.x)/2,(a.y+b.y)/2):null};
}
function endBoardTouch(e){
 if(!boardTouches.delete(e.pointerId)||!touchPinch)return false;
 // After a pinch, suppress the remaining finger until it also lifts.
 if(boardTouches.size===0)touchPinch=null;
 else if(boardTouches.size>=2)beginTouchPinch();
 return true;
}
function setBoardZoom(value){
 const zoom=activeZoom();
 const phoneMap=cameraTop&&phonePortrait.matches;
 const minZoom=phoneMap?Math.min(14,defaultZoom*(overheadFrame?.size??innerWidth)/(GRID*48)):22;
 zoom.target=THREE.MathUtils.clamp(value,minZoom,phoneMap?defaultZoom:60);
 if(phoneMap||reducedMotion.matches){zoom.current=zoom.target;updateCamera()}
 if(phoneMap)syncPhoneZoomLabel();
}
function panToAnchor(anchor,x,y){
 const point=boardPoint(x,y);
 if(!point||!anchor)return;
 phonePan.x+=anchor.x-point.x;phonePan.z+=anchor.z-point.z;
 updateCamera();
}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(cameraTween)return;
 setKeyboardCursor(false);
 const touch=e.pointerType==='touch';
 if(touch){
  boardTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  renderer.domElement.setPointerCapture(e.pointerId);
  if(boardTouches.size>=2){beginTouchPinch();return}
 }
 // Tapping the board closes open focus drawers without swallowing the click.
 if(!e.isPrimary||down)return;
 if(boardFocus)closeFocusDrawers();
 hideOpticTooltip();setHoverGlow(null);
 if(e.button!==0&&e.button!==2)return;
 // Placement always uses the board's world-space cell, not a raycast mesh:
 // raised optics and glass can otherwise steal a click on an empty tile.
 const placing=e.button===0&&placingByCell();
 const commitOnRelease=placing&&(touch||relocation);
 if(placing&&!commitOnRelease){
  const trayCell=cellAt(e.clientX,e.clientY);
  if(trayCell){move(trayCell.x,trayCell.y);return}
 }
 const origin=commitOnRelease?null:hit(e.clientX,e.clientY);
 const draggingCandidate=e.button===0&&origin?.piece&&movable.has(origin.piece.type);
 const offset=draggingCandidate?boardPoint(e.clientX,e.clientY)?.sub(vec(origin.piece.x,origin.piece.y,0)):null;
 down={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,pitch,button:e.button,moved:false,offset,
       mode:commitOnRelease?'place-cell':draggingCandidate?'piece':'orbit',origin,
       panAnchor:touch&&cameraTop&&phonePortrait.matches?boardPoint(e.clientX,e.clientY):null};
 if(draggingCandidate&&!touch)select(origin.piece);
 if(commitOnRelease)updatePlacementPreview(e);
 if(!touch)renderer.domElement.setPointerCapture(e.pointerId);
});
// One outline follows the candidate. Catalog materials are shared between
// copies of an instrument, so highlighting their material would mark its peers.
const hoverOutline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
 [[-.46,-.46],[.46,-.46],[.46,.46],[-.46,.46]].map(([x,z])=>new THREE.Vector3(x*T,0,z*T))),
 new THREE.LineBasicMaterial({color:0xffdd95,toneMapped:false,depthTest:false}));
hoverOutline.visible=false;hoverOutline.renderOrder=17;world.add(hoverOutline);
const keyboardCursor=new THREE.LineLoop(hoverOutline.geometry,
 new THREE.LineBasicMaterial({color:0xffc65d,toneMapped:false,depthTest:false}));
keyboardCursor.visible=false;keyboardCursor.renderOrder=19;world.add(keyboardCursor);
let keyboardCell={x:HALF,y:HALF};
function setKeyboardCursor(visible){
 keyboardCursor.visible=visible;
 $('board-keyboard').classList.toggle('active',visible);
 refreshKeyboardCursor();
}
function keyboardOccupant(){
 return cellOccupant(keyboardCell);
}
function refreshKeyboardCursor(){
 if(!keyboardCursor.visible)return;
 const {x,y}=keyboardCell;
 keyboardCursor.position.copy(vec(x,y,.062));
 const part=keyboardOccupant();
 let content=part?t(language,'type'+part.type[0].toUpperCase()+part.type.slice(1)):t(language,'boardEmpty');
 if(part&&['laser','target','filter'].includes(part.type))content+=' · '+colorName(part.color,language);
 const action=placingByCell()?(relocation?'boardMoving':'boardCarrying'):null;
 const status=t(language,'boardCell',{x,y,content})+(action?' · '+t(language,action):'');
 if($('board-cell-status').textContent!==status)$('board-cell-status').textContent=status;
}
function focusKeyboardBoard(){
 if(!keyboardCursor.visible&&selected&&!selected.inTray)keyboardCell={x:selected.x,y:selected.y};
 renderer.domElement.focus({preventScroll:true});
 setKeyboardCursor(true);
}
function handleBoardKeyboard(event){
 if(event.target!==renderer.domElement||event.ctrlKey||event.metaKey||event.altKey)return false;
 const offset=boardArrowOffset(event.code,camera.matrixWorld.elements);
 if(!offset&&!['Enter','Space'].includes(event.code))return false;
 event.preventDefault();
 if(offset){
  keyboardCell={x:THREE.MathUtils.clamp(keyboardCell.x+offset.x,0,GRID-1),
   y:THREE.MathUtils.clamp(keyboardCell.y+offset.y,0,GRID-1)};
 }else if(!event.repeat){
  const {x,y}=keyboardCell;
  if(placingByCell())move(x,y,relocation);
  else if(event.code==='Space'&&selected&&!selected.inTray)toggleRelocation();
  else{
   const part=keyboardOccupant();
   if(part)select(part);
   else if(selected)clearSelection();
  }
 }
 setKeyboardCursor(true);
 return true;
}
renderer.domElement.addEventListener('focus',()=>{
 if(renderer.domElement.matches(':focus-visible'))setKeyboardCursor(true);
});
renderer.domElement.addEventListener('blur',()=>setKeyboardCursor(false));
function setHoverGlow(piece){
 hoverOutline.visible=Boolean(piece&&!piece.inTray&&movable.has(piece.type)&&!placingByCell()&&!keyboardCursor.visible);
 if(hoverOutline.visible)hoverOutline.position.copy(vec(piece.x,piece.y,.045));
}
renderer.domElement.addEventListener('pointermove',e=>{
 if(boardTouches.has(e.pointerId)){
  boardTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(touchPinch){
   if(boardTouches.size>=2){
    setBoardZoom(touchPinch.zoom*touchPinch.span/touchSpan());
    if(touchPinch.anchor){
     const [a,b]=boardTouches.values();
     panToAnchor(touchPinch.anchor,(a.x+b.x)/2,(a.y+b.y)/2);
    }
   }
   return;
  }
 }
 if(!e.isPrimary||down&&e.pointerId!==down.id)return;
 if(!down){
  updatePlacementPreview(e);
  const hovered=hit(e.clientX,e.clientY);
  renderer.domElement.style.cursor=placingByCell()?'crosshair':hovered?.piece&&movable.has(hovered.piece.type)?'grab':'default';
  setHoverGlow(hovered?.piece&&movable.has(hovered.piece.type)?hovered.piece:null);
  showOpticTooltip(e,hovered);
  return;
 }
 const dx=e.clientX-down.x,dy=e.clientY-down.y;
 if(Math.abs(dx)+Math.abs(dy)>(e.pointerType==='touch'?12:7))down.moved=true;
 if(!down.moved){
  if(down.mode==='place-cell')updatePlacementPreview(e);
  return;
 }
 if(down.mode==='piece'){
  if(e.pointerType==='touch'&&!draggedPiece)select(down.origin.piece);
  draggedPiece=down.origin.piece;
  renderer.domElement.style.cursor='grabbing';
  updatePlacementPreview(e);
  return;
 }
 if(down.panAnchor&&overheadZoom.target<defaultZoom-.1){
  placementPreview.visible=false;
  panToAnchor(down.panAnchor,e.clientX,e.clientY);
  return;
 }
 // Orbiting requires a drag on the empty board, not on an optic.
 if(down.button===0){
  placementPreview.visible=false;
  if(cameraTop)return;
  yaw=down.yaw-dx*.0045;pitch=Math.max(.35,Math.min(1.49,down.pitch+dy*.004));
  updateCamera();
 }
});
renderer.domElement.addEventListener('pointerup',e=>{
 if(endBoardTouch(e))return;
 if(e.pointerId!==down?.id)return;
 const state=down;down=null;
 if(state.button===2){
  if(e.button!==2||state.moved||document.elementFromPoint(e.clientX,e.clientY)!==renderer.domElement)return;
  const part=state.origin?.piece;
  if(part&&movable.has(part.type)){
   select(part);rotate(1);
  }else if(!part&&state.origin&&selected?.inTray&&placementMode){
   rotate(1);updatePlacementPreview(e);
  }else if(!part&&selected)clearSelection();
  return;
 }
 if(state.moved){
  if(state.mode==='piece'){
   const dest=document.elementFromPoint(e.clientX,e.clientY)===renderer.domElement&&cellAt(e.clientX,e.clientY,state.offset);
   if(dest){selected=state.origin.piece;move(dest.x,dest.y,true)}
  }
  draggedPiece=null;placementPreview.visible=false;
  renderer.domElement.style.cursor='default';
  return;
 }
 if(state.mode==='place-cell'){
  const dest=document.elementFromPoint(e.clientX,e.clientY)===renderer.domElement&&cellAt(e.clientX,e.clientY);
  placementPreview.visible=false;
  if(dest)move(dest.x,dest.y,relocation);
  return;
 }
 // Clicking an optic only selects it. Clicking elsewhere only places a
 // tray optic, otherwise it cancels selection (never warps an existing optic).
 const intent=classifyClick(state.origin,selected,placementMode);
 if(orbitalPilot&&intent.piece?.type!=='target')closeReceiver();
 if(intent.action==='select')select(intent.piece);
 else if(intent.action==='place')move(intent.x,intent.y);
 else if(selected)clearSelection();
});
function resetBoardPointer(){
 down=null;draggedPiece=null;placementPreview.visible=false;
 setHoverGlow(null);renderer.domElement.style.cursor='default';
}
function cancelBoardGesture(e){
 if(e){
  if(endBoardTouch(e)||e.pointerId!==down?.id)return;
 }else{boardTouches.clear();touchPinch=null}
 resetBoardPointer();
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
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(e.pointerType==='touch'){
   if(Math.hypot(dx,dy)<12)return;
   // Horizontal touch movement belongs to the native scrolling strip.
   if(-dy<=Math.abs(dx)){trayGesture=null;return}
  }else if(Math.hypot(dx,dy)<6)return;
  if(!drag.piece?.inTray){trayGesture=null;return}
  drag.active=true;
  $('inventory').setPointerCapture(e.pointerId);
  carriedPortrait.src=opticModels.portraitPath(drag.piece.type,drag.piece.color);
  hideOpticTooltip();selectFromTray(drag.piece);
  document.body.classList.add('carrying-optic');
 }
 if(document.elementFromPoint(e.clientX,e.clientY)===renderer.domElement)updatePlacementPreview(e);
 else placementPreview.visible=false;
 carriedPortrait.hidden=placementPreview.visible&&Boolean(previewModel);
 if(!carriedPortrait.hidden)carriedPortrait.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)';
});
window.addEventListener('pointerup',e=>{finishTrayGesture(e,true);refreshOverheadLayout()});
window.addEventListener('pointercancel',e=>{finishTrayGesture(e,false);refreshOverheadLayout()});
$('inventory').addEventListener('lostpointercapture',e=>{
 if(e.target===$('inventory'))finishTrayGesture(e,false);
});
window.addEventListener('blur',()=>finishTrayGesture(null,false));
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
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
  setBoardZoom(activeZoom().target+delta*.021);
 }
},{passive:false});
document.addEventListener('keydown',e=>{
 const screen=activeScreen();
 if(screen){
  if(e.code==='Escape'){
   e.preventDefault();
   if(screen!=='main-menu')closeScreen(screen);
   else if(hasPlayed)enterGame();
  }else if(e.code==='Tab')keepScreenFocus(e,screen);
  return;
 }
 if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
 if(handleBoardKeyboard(e))return;
 if(e.code==='Escape'){
  if(inspectedReceiver){closeReceiver(true);return}
  if(selected||down||trayGesture){cancelBoardGesture();finishTrayGesture(null,false);clearSelection()}
  else openMainMenu();
  return;
 }
 if(e.code==='KeyM'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();openLevelAtlas();return}
 if(e.code==='KeyG'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();focusKeyboardBoard();return}
 if(e.code==='KeyQ')rotate(-1);if(e.code==='KeyE'||e.code==='KeyR')rotate(1);
 if(e.code==='Backspace'||e.code==='Delete'){e.preventDefault();returnToTray()}
 if(e.code==='KeyV' && !e.ctrlKey){toggleAnalyzer();return}
 if(e.code==='KeyC' && !e.ctrlKey){toggleCameraPreset();return}
 if(e.code==='KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey){e.preventDefault();void toggleFullscreen();return}
 if(e.code==='KeyB' && !e.ctrlKey && !e.metaKey && !e.altKey){e.preventDefault();toggleBoardFocus();return}
 if(e.code==='KeyH' && !e.ctrlKey){openHint()}
 if(e.code==='KeyL' && !e.ctrlKey){setLanguage(language==='pl'?'en':'pl')}
 if((e.code==='KeyZ'&&e.ctrlKey&&e.shiftKey)||(e.code==='KeyY'&&e.ctrlKey)){e.preventDefault();redo()}
 else if(e.code==='KeyZ'&&e.ctrlKey){e.preventDefault();undo()}
});
$('levels-button').onclick=()=>openLevelAtlas($('levels-button'));
$('levels-from-win').onclick=()=>openLevelAtlas($('levels-from-win'));
$('levels-close').onclick=closeLevelAtlas;
$('main-menu-toggle').onclick=openMainMenu;
$('menu-orbital').onclick=()=>location.assign('?benchmark=orbital');
$('orbital-settings').onclick=()=>showScreen('settings-overlay','menu-language',$('orbital-settings'));
$('receiver-toggle').onclick=()=>{
  if(inspectedReceiver){closeReceiver(true);return}
  inspectReceiver(pieces.find(p=>p.type==='target'&&currentResult?.received.get(p.id)!==p.color)??pieces.find(p=>p.type==='target'));
};
$('receiver-next').onclick=()=>{
 const targets=pieces.filter(p=>p.type==='target');
 inspectReceiver(targets[(targets.findIndex(p=>p.id===inspectedReceiver)+1)%targets.length]);
};
$('receiver-close').onclick=()=>closeReceiver(true);
$('menu-play').onclick=playFromMainMenu;
$('menu-campaign').onclick=()=>openLevelAtlas($('menu-campaign'));
$('menu-settings').onclick=()=>showScreen('settings-overlay','menu-language',$('menu-settings'));
$('menu-guide').onclick=()=>showScreen('help-overlay','close-help',$('menu-guide'));
$('menu-from-win').onclick=()=>{closeScreen('win',false);openMainMenu()};
$('review-result').onclick=openVictory;
$('win-close').onclick=()=>closeScreen('win');
for(const tab of document.querySelectorAll('.campaign-tab')){
 tab.addEventListener('click',()=>{
  atlasCampaign=tab.dataset.campaign;
  $('level-grid').scrollTop=0;
  renderLevelAtlas();
 });
}
$('campaign-tabs').addEventListener('keydown',event=>{
 const tabs=[...$('campaign-tabs').querySelectorAll('button:not([hidden])')];
 const index=tabs.indexOf(event.target);
 if(index<0)return;
 const next={ArrowLeft:(index+tabs.length-1)%tabs.length,ArrowRight:(index+1)%tabs.length,
  Home:0,End:tabs.length-1}[event.key];
 if(next===undefined)return;
 event.preventDefault();
 tabs[next].click();tabs[next].focus();
});
function verticalAtlasCard(cards,current,direction){
 const origin=current.getBoundingClientRect();
 const center=origin.x+origin.width/2;
 let nearest=null,rowDistance=Infinity,horizontalDistance=Infinity;
 for(const card of cards){
  const rect=card.getBoundingClientRect();
  const row=(rect.y-origin.y)*direction;
  if(row<2)continue;
  const horizontal=Math.abs(rect.x+rect.width/2-center);
  if(row<rowDistance-1||(Math.abs(row-rowDistance)<1&&horizontal<horizontalDistance)){
   nearest=card;rowDistance=row;horizontalDistance=horizontal;
  }
 }
 return nearest;
}
$('level-grid').addEventListener('focusin',event=>{
 const card=event.target.closest('.level-atlas-card');
 if(!card||card.disabled)return;
 const old=$('level-grid').querySelector('[tabindex="0"]');
 if(old)old.tabIndex=-1;
 card.tabIndex=0;
});
$('level-grid').addEventListener('keydown',event=>{
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
 const cards=[...$('level-grid').querySelectorAll('button:not(:disabled)')];
 const index=cards.indexOf(event.target);
 if(index<0)return;
 event.preventDefault();
 const shortcuts={ArrowLeft:cards[index-1],ArrowRight:cards[index+1],Home:cards[0],End:cards.at(-1)};
 const target=event.key in shortcuts?shortcuts[event.key]:verticalAtlasCard(cards,cards[index],event.key==='ArrowUp'?-1:1);
 target?.focus();
});
$('level-menu').addEventListener('click',event=>{
 if(event.target===$('level-menu'))closeLevelAtlas();
});
$('prev').onclick=()=>load(levelIndex-1);$('next').onclick=()=>load(levelIndex+1);
function resetLevel(allowLocked=false){
 if(!allowLocked&&!getLevelAtlas().entries[levelIndex].unlocked)return false;
 const level=levels[levelIndex];
 const changed=Boolean(encodePuzzleDraft(level,pieces,movable));
 cancelBoardGesture();finishTrayGesture(null,false);
 if(changed)saveHistory();
 pieces=initialBoard(level,pieces);
 selected=null;placementMode=false;relocation=false;tutorialPlaced=false;wheelRotation.reset();
 closeScreen('win',false);closeScreen('hint-overlay',false);hideLevelIntro();
 update();
 if(changed)toast(t(language,'resetUndo'));
 return true;
}
$('reset').onclick=()=>resetLevel();
$('undo').onclick=undo;$('redo').onclick=redo;
$('return-tray').onclick=returnToTray;
function toggleRelocation(){
 if(!selected||selected.inTray)return;
 relocation=!relocation;
 placementPreview.visible=false;
 syncTransformTools();
}
$('relocate').onclick=toggleRelocation;
$('turn-left').onclick=()=>rotate(-1);
$('turn-right').onclick=()=>rotate(1);
$('cancel-selection').onclick=clearSelection;
$('analysis-toggle').onclick=toggleAnalyzer;
$('analysis-close').onclick=toggleAnalyzer;
$('camera-preset').onclick=toggleCameraPreset;
$('phone-magnify').onclick=()=>{
 if(!cameraTop)toggleCameraPreset();
 if(overheadZoom.target<defaultZoom-.1){resetPhoneFraming();updateCamera()}
 else{
  if(selected&&!selected.inTray){
   phonePan.x=(selected.x-HALF)*T;phonePan.z=(selected.y-HALF)*T;
  }
  setBoardZoom(defaultZoom*overheadFrame.size/(GRID*48));
 }
 renderInventory();
};
phonePortrait.addEventListener('change',()=>{
 if(!manualCamera&&phonePortrait.matches!==cameraTop)toggleCameraPreset(false);
 renderInventory();resize();
});
$('keyboard-board-button').onclick=focusKeyboardBoard;
$('spectral-toggle').onclick=()=>{spectrumActive=!spectrumActive;store('chromatron-reborn-spectrum',String(spectrumActive));renderSpectrum()};
$('continue').onclick=()=>{
 if(levelIndex<levels.length-1){if(load(levelIndex+1))$('main-menu-toggle').focus()}
 else openLevelAtlas($('continue'));
};
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
  atlasCampaign=currentCampaign();renderLevelAtlas();
  closeScreen('help-overlay');
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
function openHint(){
 requestSolutionSearch();
 renderHints();
 const focus=offeredGuide?'hint-show-move':$('reveal-hint').disabled?'close-hint':'reveal-hint';
 showScreen('hint-overlay',focus);
}
$('hint').onclick=openHint;
$('close-hint').onclick=()=>closeScreen('hint-overlay');
$('hint-show-move').onclick=()=>{
 if(!offeredGuide)return;
 guidedSolution=offeredGuide;
 refreshHintGuide();
 closeScreen('hint-overlay');
};
$('hint-dismiss-guide').onclick=()=>{
 guidedSolution=null;
 refreshHintGuide();
 $('hint').focus({preventScroll:true});
};
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
 if($('reveal-hint').disabled)$(offeredGuide?'hint-show-move':'close-hint').focus();
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
$('help').onclick=()=>showScreen('help-overlay','close-help',$('help'));
$('close-help').onclick=()=>closeScreen('help-overlay');
$('close-settings').onclick=()=>closeScreen('settings-overlay');
$('menu-language').onchange=event=>setLanguage(event.target.value);
$('settings-fullscreen').onclick=toggleFullscreen;
$('menu-symbols').onclick=()=>{
 showBoardSymbols=!showBoardSymbols;
 store('chromatron-board-symbols',showBoardSymbols?'on':'off');
 syncMenuSettings();syncBoardSymbols();
};
function syncMenuSettings(){
 $('menu-symbols').textContent=t(language,showBoardSymbols?'soundOn':'soundOff');
 $('menu-symbols').setAttribute('aria-pressed',String(showBoardSymbols));
 $('menu-audio').textContent=t(language,wantsAudio?'soundOn':'soundOff');
 $('menu-audio').setAttribute('aria-pressed',String(wantsAudio));
 $('audio').setAttribute('aria-pressed',String(wantsAudio));
 $('audio').classList.toggle('enabled',wantsAudio);
 $('menu-quality').value=graphicsMode;
 const full=Boolean(document.fullscreenElement);
 $('settings-fullscreen').textContent=t(language,full?'fullscreenExit':'fullscreenEnter');
 $('settings-fullscreen').setAttribute('aria-pressed',String(full));
}
async function applySound(enabled){
 try{await soundscape.setEnabled(enabled);audioEnabled=enabled}
 catch{audioEnabled=false}
}
async function toggleAudio(){
 wantsAudio=!wantsAudio;
 store('chromatron-audio',wantsAudio?'on':'off');
 await applySound(wantsAudio);
 syncMenuSettings();beep(700,.08);
}
$('audio').onclick=$('menu-audio').onclick=toggleAudio;
$('graphics-quality').value=graphicsMode;
$('menu-quality').replaceChildren(...[...$('graphics-quality').options].map(option=>option.cloneNode(true)));
function changeQuality(event){
 graphicsMode=normalizeQuality(event.target.value);autoLevel='balanced';
 store('chromatron-graphics-quality',graphicsMode);
 applyGraphicsQuality();syncMenuSettings();
}
$('graphics-quality').onchange=$('menu-quality').onchange=changeQuality;
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
let lastSceneryFrame;
function animate(time){
 requestAnimationFrame(animate);
 if(screenVisible('main-menu')||document.hidden){lastSceneryFrame=undefined;fpsMark=fpsFrames=0;return}
 trackFrameRate(time);
 const still=debugFrozen||reducedMotion.matches;
 const animationTime=debugFrozen?0:time;
 const sceneryDelta=Math.min(.25,Math.max(0,(time-(lastSceneryFrame??time))*.001));
 lastSceneryFrame=time;
 const openSky=activeEnvironment===orbitalArt||activeEnvironment?.id==='observatory'||activeEnvironment?.id==='shipyard';
 skyMeteor.update(sceneryDelta,openSky&&!still&&usesNewArt()&&!cameraTop,camera);
 if(usesNewArt()){
  orbitalScene?.update(sceneryDelta,still,camera.position);
  shipyard.update(animationTime*.001,still,camera.position);
  campaignArt.update(animationTime*.001,still,camera.position);
 }else{
  spaceEnvironments.update(animationTime*.001,still);
  terraces.update(animationTime*.001,still);
  midgroundScenery.update(animationTime*.001,still);
  ambientLife.update(animationTime*.001,still);
  livingWorld.update(animationTime*.001,still);
  boardEdgeGlow.update(still?0:time*.001);
  atmosphereParticles.update(still?0:time*.001);
 }
 cinematic.update(still?0:time*.001);
 // Damped camera dolly, independent of mouse/trackpad event granularity.
 const zoomDt=Math.min(70,Math.max(0,time-(zoomLastFrame||time-16)));
 zoomLastFrame=time;
 const zoom=activeZoom();
 if(Math.abs(zoom.target-zoom.current)>.015){
  const amount=still?1:1-Math.exp(-zoomDt/115);
  zoom.current+=(zoom.target-zoom.current)*amount;
  updateCamera();
 }else if(zoom.target!==zoom.current){zoom.current=zoom.target;updateCamera()}
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
  overheadBlend=THREE.MathUtils.lerp(cameraTween.blend0,cameraTween.blend1,ease);
  if(f===1)cameraTween=null;
  updateCamera();
 }
 for(const p of componentGroup.children)for(const c of p.children)if(c.userData.spin)c.rotation.y=debugFrozen?0:(time-start)*.001;
 if(hintMarker.visible)hintMarker.scale.setScalar(still?1:1+.07*Math.sin(animationTime*.006));
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
function setHintMarker(focus){
 hintMarker.visible=Boolean(focus);
 if(focus)hintMarker.position.copy(vec(focus.x,focus.y,.055));
}
function showHintGuide(hint){
 const guide=$('hint-guide'),copy=$('hint-guide-copy');
 const body=hint?.instruction??'';
 guide.hidden=!body;
 if(copy.textContent!==body)copy.textContent=body;
 setHintMarker(body?hint.focus:null);
}
function refreshHintGuide(){
 const hint=guidedSolution&&contextualHint(levels[levelIndex],pieces,3,language,guidedSolution,currentResult);
 showHintGuide(hint);
}
function renderHints(){
 const root=$('hint-steps');
 if(!root)return;
 root.replaceChildren();
 const level=levels[levelIndex];
 const known=verifiedSolutionForCurrent();
 let finalFocus=null,exactHint=null;
 for(let step=1;step<=hintCount;step++){
  // Built-in prose sets up a puzzle; a state-aware verified plan then reveals
  // one concrete next action, never a fabricated move.
  const authored=step<3&&level.hints?.[step-1]?
   hintFor(level,language,step):null;
  const dynamic=contextualHint(level,pieces,step,language,known,currentResult);
  const hint=dynamic.verified?dynamic:(authored||dynamic);
  if(!hint)continue;
  if(hint.verified&&hint.focus)finalFocus=hint.focus;
  if(step===3&&hint.instruction)exactHint=hint;
  const block=document.createElement('section');block.className='hint-step';
  const header=document.createElement('div');
  header.className='eyebrow';
  header.textContent=t(language,'hintStep',{step})+' · '+t(language,'hintType'+step);
  const copy=document.createElement('p');copy.textContent=hint.body;
  block.append(header,copy);root.appendChild(block);
 }
 offeredGuide=exactHint?known:null;
 $('hint-show-move').hidden=!offeredGuide;
 if(guidedSolution)showHintGuide(exactHint);
 else setHintMarker(finalFocus);
 $('hint-badge').textContent=hintCount+'/3';
 syncWalletUI();
 const next=hintCount;
 const cost=HINT_COSTS[next]??0;
 const needsVerified=next===2&&!known;
 const canBuy=next<3&&wallet.balance>=cost&&!needsVerified;
 const button=$('reveal-hint');
 button.textContent=t(language,hintCount===0?'hintReveal':'hintAgain');
 button.hidden=next===3;
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
if(startsInGame){closeScreen('main-menu',false);enterGame(false)}
setLanguage(language);
// Apply the persisted GPU preset before loading the first puzzle or any GLB.
// Previously only interactive quality changes updated the environment.
applyGraphicsQuality();
if(campaignPreference.startsWith('classic')&&classicLibrary.has(Number(campaignPreference.slice(7))))switchCampaign(campaignPreference);
else load(Number.isFinite(saved)?Math.min(Math.max(Math.trunc(saved),0),levels.length-1):0);
syncCampaignTabs();
syncWalletUI();
requestAnimationFrame(animate);
for(const button of $('main-menu').querySelectorAll('button'))button.disabled=false;
if(!startsInGame)openMainMenu();
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
   theme:activeEnvironment.id,pilotStatus:activeEnvironment===orbitalArt?orbitalScene.getStatus():activeEnvironment.id==='shipyard'?shipyard.getStatus():campaignArt.getStatus(),
   completed:solved.includes(levelIndex)}),
  setTheme(name){
   if(name!==null&&!getCampaignWorld(name)&&!SPACE_BIOMES.some(theme=>theme.id===name))return false;
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
  getAmbientMotion(){
   const tender=world.getObjectByName('Survey_tender');
   const dish=world.getObjectByName('Tracking_reflector');
   const tracker=world.getObjectByName('Sun_tracker');
   const rotor=world.getObjectByName('Habitat_rotor');
   const pivot=tracker?.getWorldPosition(new THREE.Vector3()).project(camera);
   const meteor=skyMeteor.mesh;
   const head=meteor.visible?meteor.material.uniforms.head.value.clone().multiplyScalar(100)
    .add(camera.position).project(camera):null;
   return {tender:tender?.position.toArray(),dish:dish?.quaternion.toArray(),
    relay:tracker&&rotor?{angle:rotor.rotation.y,tilt:tracker.rotation.x,
     x:(pivot.x+1)*innerWidth/2,y:(1-pivot.y)*innerHeight/2}:null,
    meteor:head?{x:(head.x+1)*innerWidth/2,y:(1-head.y)*innerHeight/2,
     intensity:meteor.material.uniforms.intensity.value}:null};
  },
  getSceneryOcclusion(){
   const scenery=world.children.find(node=>node.visible&&node.name===activeEnvironment?.en);
   if(!scenery)return [];
   scene.updateMatrixWorld(true);
   const meshes=[];
   scenery.traverseVisible(node=>{if(node.isMesh)meshes.push(node)});
   collectorField.group.traverseVisible(node=>{if(node.name==='collector-cassettes')meshes.push(node)});
   const sight=new THREE.Raycaster();
   const hits=[];
   for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){
    const delta=vec(x,y,.11).sub(camera.position);
    sight.far=delta.length()-.04;
    sight.set(camera.position,delta.normalize());
    const blocker=sight.intersectObjects(meshes,false)[0];
    if(blocker)hits.push({x,y,object:blocker.object.name});
   }
   return hits;
  },
  getStats:()=>({fps:measuredFps,frames:debugFrames,drawCalls:renderer.info.render.calls,
   triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,
   geometries:renderer.info.memory.geometries,pixelRatio:renderer.getPixelRatio(),backend,
   quality:graphicsMode==='auto'?autoLevel:graphicsMode}),
  resetLevel:()=>resetLevel(true),undo,redo,
  switchCampaign
 });
}
