// Blender's linear sample packs tone, roughness and the two surface slopes.
// A piece cut from the sheet covers one logical cell. Projecting it in metres
// also works on the campaign GLBs, which ship without UVs on their top faces.
const samples=new Map(), surfaces=new WeakMap();
const finishes={
 slate:    {contrast:.50,metal:.12},
 limestone:{contrast:.43,metal:.06},
 alloy:    {contrast:.30,metal:.48},
 frost:    {contrast:.38,metal:.11},
 ceramic:  {contrast:.31,metal:.08}
};
const families={
 observatory:'ceramic',heliostat:'limestone',grotto:'slate',frost:'frost',
 forge:'alloy',abyss:'ceramic',sanctuary:'slate',shipyard:'alloy',kepler:'alloy',
 scrap:'alloy',moss:'limestone',ice:'frost',crystal:'slate'
};

export function loadSurfaceSample(THREE,kind){
 if(!samples.has(kind)){
  const url=new URL(`../assets/materials/deck/${kind}.png`,import.meta.url);
  samples.set(kind,new THREE.TextureLoader().loadAsync(url.href).then(texture=>{
   texture.colorSpace=THREE.NoColorSpace;
   texture.minFilter=THREE.LinearMipmapLinearFilter;
   texture.anisotropy=4;
   return texture;
  }).catch(()=>{samples.delete(kind);return null}));
 }
 return samples.get(kind);
}

const surfaceSample=`
 vec2 grid=panelXZ/1.30;
 vec2 cell=floor(grid+.5);
 vec2 local=grid-cell;
 vec3 seed=fract(vec3(cell.xyx)*vec3(.1031,.1030,.0973)+.127);
 seed+=dot(seed,seed.yzx+33.33);
 seed=fract((seed.xxy+seed.yzz)*seed.zyx);
 float turn=step(.68,seed.z);
 vec2 cut=mix(local,local.yx,turn)*.40;
 vec2 sheetUV=.21+seed.xy*.58+cut;
 // Compute derivatives before the discontinuity between independently cut
 // panels. Otherwise the mip sampler blurs a strip along every joint.
 vec2 dx=dFdx(grid)*.40,dy=dFdy(grid)*.40;
 vec4 sheet=textureGrad(panelSample,sheetUV,mix(dx,dx.yx,turn),mix(dy,dy.yx,turn));
 float field=1.-step(9.75,max(abs(panelXZ.x),abs(panelXZ.y)));
 float strength=field*panelReady;
 vec2 fromJoint=(.5-abs(local))*1.30;
 vec2 footprint=max(fwidth(panelXZ),vec2(.0001));
 vec2 bevel=1.-smoothstep(vec2(panelInset+.012)-footprint*.5,
                           vec2(panelInset+.068)+footprint*.5,fromJoint);
 vec2 slope=mix(sheet.ba,sheet.ab,turn)*2.-1.;
 float detail=1.-.55*smoothstep(.052,.135,max(footprint.x,footprint.y));
 vec2 relief=strength*(slope*detail+sign(local)*bevel*.37);
 float lip=max(bevel.x,bevel.y);
 // Mipmaps already average the stone pigment. Attenuate its subpixel relief
 // separately so the broad mineral pattern survives in the full-board view.
 diffuseColor.rgb*=1.+strength*((sheet.r-.5)*panelContrast+(seed.z-.5)*.10+.085*lip);
 // When the cut in the Blender mesh projects to less than one render pixel,
 // carry its remaining coverage onto the tile lip. The station already draws
 // its own antialiased joint (zero inset).
 vec2 jointPixels=fromJoint/footprint;
 vec2 missing=1.-smoothstep(vec2(.35),vec2(1.35),jointPixels);
 missing*=smoothstep(vec2(panelInset),vec2(panelInset*2.+.001),footprint);
 float seamInk=max(missing.x,missing.y)*step(.001,panelInset);
 diffuseColor.rgb*=1.-field*.32*seamInk;
`;

function attach(material){
 const state={kind:null,tex:{value:null},ready:{value:0},contrast:{value:0},inset:{value:0}};
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.customProgramCacheKey=()=>key+'|cut-panel';
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  Object.assign(shader.uniforms,{panelSample:state.tex,panelReady:state.ready,
   panelContrast:state.contrast,panelInset:state.inset});
  shader.vertexShader='varying vec2 panelXZ;\n'+shader.vertexShader.replace('#include <worldpos_vertex>',`
   #include <worldpos_vertex>
   vec4 panelVertex=vec4(transformed,1.);
   #ifdef USE_INSTANCING
   panelVertex=instanceMatrix*panelVertex;
   #endif
   panelXZ=(modelMatrix*panelVertex).xz;`);
  shader.fragmentShader=`
   varying vec2 panelXZ;
   uniform sampler2D panelSample;
   uniform float panelReady, panelContrast, panelInset;
  `+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+surfaceSample)
   .replace('#include <roughnessmap_fragment>',
    '#include <roughnessmap_fragment>\n roughnessFactor=mix(roughnessFactor,sheet.g,strength);')
   .replace('#include <normal_fragment_maps>',
    '#include <normal_fragment_maps>\n normal=normalize(normal+mat3(viewMatrix)*vec3(relief.x,0.,relief.y));');
 };
 material.needsUpdate=true;
 surfaces.set(material,state);
 return state;
}

export function applyPanelSurface(THREE,material,world,inset=.043){
 const kind=families[world]??'ceramic';
 const state=surfaces.get(material)??attach(material);
 state.inset.value=inset;
 material.metalness=finishes[kind].metal;
 if(state.kind===kind)return;
 state.kind=kind;
 state.ready.value=0;
 state.contrast.value=finishes[kind].contrast;
 loadSurfaceSample(THREE,kind).then(texture=>{
  if(state.kind!==kind)return;
  if(!texture){state.kind=null;return}
  state.tex.value=texture;state.ready.value=1;
 });
}
