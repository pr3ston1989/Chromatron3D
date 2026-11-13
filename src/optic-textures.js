/**
 * Small deterministic 128px physically based textures for precision lab optics.
 * Shared between all devices: 3 textures per finish (albedo, roughness, normal).
 * Includes micro-machined lines and subtle grain; zero asset downloads and
 * no giant per-object images. Suitable for laptop GPUs and offline Windows.
 */
const cache=new WeakMap();
const hash=(x,y,salt)=>{
 let n=Math.imul(x+11,374761393)^Math.imul(y+37,668265263)^salt;
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967295;
};
function makeFinish(THREE,{brushed}){
 const size=128;
 const albedo=new Uint8Array(size*size*4);
 const rough=new Uint8Array(size*size*4);
 const normal=new Uint8Array(size*size*4);
 const height=(x,y)=>{
  const line=brushed?Math.sin((y%size)*.69+1.1)*.18:Math.sin((y%size)*.27)*.045;
  return line+(hash(x%size,y%size,1301)-.5)*(brushed?.13:.045);
 };
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4;
  const scratches=hash(Math.floor(x/2),Math.floor(y/7),934);
  const streak=brushed ? Math.sin(y*.93)*.025 : Math.sin(y*.4)*.009;
  const grain=(hash(x,y,550)-.5)*(brushed?.10:.035);
  const shade=Math.max(.76,Math.min(1,brushed?.91+grain+streak:.964+grain+streak));
  const value=Math.round(255*shade);
  albedo.set([value,value,value,255],i);
  const r=Math.max(.5,Math.min(1,(brushed?.84:.72)+grain*.5+(scratches>.985?.10:0)));
  const roughness=Math.round(255*r);
  rough.set([255,roughness,255,255],i);
  const dx=height(x+1,y)-height(x-1,y);
  const dy=height(x,y+1)-height(x,y-1);
  const nx=-dx*(brushed?1.45:.82),ny=-dy*(brushed?1.45:.82),nz=1;
  const inv=1/Math.hypot(nx,ny,nz);
  normal.set([
   Math.round((nx*inv*.5+.5)*255),
   Math.round((ny*inv*.5+.5)*255),
   Math.round((nz*inv*.5+.5)*255),255
  ],i);
 }
 const make=(data,{srgb=false}={})=>{
  const tex=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
  tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
  tex.minFilter=THREE.LinearMipmapLinearFilter;tex.magFilter=THREE.LinearFilter;
  tex.generateMipmaps=true;
  tex.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;
  tex.needsUpdate=true;
  return tex;
 };
 return {albedo:make(albedo,{srgb:true}),roughness:make(rough),
  normal:make(normal)};
}
export function getOpticFinishes(THREE){
 if(cache.has(THREE))return cache.get(THREE);
 const finishes={polished:makeFinish(THREE,{brushed:false}),
  brushed:makeFinish(THREE,{brushed:true})};
 cache.set(THREE,finishes);
 return finishes;
}
export function applyOpticFinish(THREE,material,kind='brushed'){
 const tex=getOpticFinishes(THREE)[kind];
 if(!tex)throw new Error('Unknown optic finish: '+kind);
 material.map=tex.albedo;
 material.roughnessMap=tex.roughness;
 material.normalMap=tex.normal;
 material.normalScale=new THREE.Vector2(kind==='brushed'?.32:.13,kind==='brushed'?.32:.13);
 material.needsUpdate=true;
 return material;
}
