/**
 * Selected-mirror beam direction guides.
 * Uses current traced segments only: does not reveal moves or invent solutions.
 */
export function classifyMirrorSegments(selected,segments){
 if(!selected || selected.inTray || !['mirror','bender','splitter'].includes(selected.type))return {incoming:[],outgoing:[]};
 return {
  incoming:segments.filter(s=>s.nx===selected.x && s.ny===selected.y),
  outgoing:segments.filter(s=>s.x===selected.x && s.y===selected.y)
 };
}
export function renderSelectionGuides(THREE,group,selected,segments,point,palette,tileSize){
 if(!selected || selected.inTray || !['mirror','bender','splitter'].includes(selected.type))return;
 const streams=classifyMirrorSegments(selected,segments);
 const green=0x8cf8d4,orange=0xffcd86;
 // The precision corner reticle handles selection. No duplicate glowing ring
 // here: this overlay only communicates actual incoming/outgoing light.
 function arrow(seg,color,from=0.26){
  const a=point(seg.x,seg.y,1.27),b=point(seg.nx,seg.ny,1.27);
  const vec=b.clone().sub(a),len=vec.length();
  if(len<.01)return;
  const dir=vec.clone().normalize();
  const origin=a.addScaledVector(dir,len*from);
  const marker=new THREE.ArrowHelper(dir,origin,len*.36,color,len*.14,len*.065);
  marker.line.material.transparent=true;
  marker.line.material.opacity=.75;
  marker.renderOrder=20;
  group.add(marker);
 }
 // Cyan arrows point into the optic, amber arrows leave the surface. Clear
 // direction cues without competing with the original beam's wavelength color.
 for(const seg of streams.incoming.slice(0,4))arrow(seg,green,.17);
 for(const seg of streams.outgoing.slice(0,4))arrow(seg,orange,.15);
 return streams;
}
