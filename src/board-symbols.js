import {COLORS} from './optics.js';

// Optical diagrams kept legible at one small corner of a board tile.
const glyphs={
 wall:'M3 4h10M3 8h10M3 12h10',
 laser:'M3 4h5l5 4-5 4H3z',
 mirror:'M4 12l8-8',
 bender:'M4 12h5V4m-3 3 3-3 3 3',
 filter:'M5 3h6v10H5z',
 prism:'M8 3l5 10H3z',
 doppler:'M3 6h10l-3-3M13 10H3l3 3',
 splitter:'M8 13V8L3 3m5 5 5-5',
 tangler:'M8 8c-5-10-10 0-5 3 3 2 5-3 5-3s2-5 5-3c5 3 0 13-5 3',
 target:'M8 8h.01M13 8a5 5 0 1 1-10 0 5 5 0 0 1 10 0z',
 conduit:'M3 5h10M3 11h10',
 teleporter:'M13 8a5 5 0 1 1-10 0 5 5 0 0 1 10 0z',
 multiFilter:'M3 5h3v7H3zM8 3h5v7H8z',
 twister:'M12 7a4 4 0 1 0-1 5m-2-6 3 1 1-3',
 complementor:'M3 8h10M8 3v10M5 11l6-6',
 logicGate:'M5 4h3a4 4 0 0 1 0 8H5zM2 6h3m-3 4h3m7-2h2',
 starburst:'M8 2v12M2 8h12M4 4l8 8m0-8-8 8',
 mobileTeleporter:'M3 13V8a5 5 0 0 1 10 0v5M6 13h4',
 dualReflector:'M3 10l7-7m-4 10 7-7',
 quadBender:'M4 4h8v8H4zM3 13l10-10',
 occupiedSquare:'M3 3h10v10H3zM3 3l10 10m0-10L3 13',
 primaryLogicGate:'M5 4h3a4 4 0 0 1 0 8H5zM2 6h3m-3 4h3m7-2h2M8 8h.01'
};

export function createBoardSymbols(layer,project){
 const markers=new Map();
 function update(enabled,pieces,selected){
  layer.hidden=!enabled;
  if(!enabled)return;
  const width=layer.clientWidth,height=layer.clientHeight;
  const tileWidth=project(1,0).x-project(0,0).x;
  const size=Math.max(8,Math.min(22,Math.floor(tileWidth*.53)));
  const inset=Math.max(1,Math.floor(tileWidth*.30-size/2));
  layer.style.setProperty('--symbol-size',size+'px');
  const onBoard=new Set();
  for(const piece of pieces){
   if(piece.inTray||!glyphs[piece.type])continue;
   onBoard.add(piece.id);
   let marker=markers.get(piece.id);
   if(marker?.dataset.opticType!==piece.type){
    marker?.remove();
    marker=document.createElement('span');
    marker.className='board-symbol';
    marker.dataset.opticType=piece.type;
    marker.innerHTML='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="'+glyphs[piece.type]+'"/></svg>';
    layer.append(marker);
    markers.set(piece.id,marker);
   }
   const {x,y}=project(piece.x,piece.y);
   marker.hidden=x<0||y<0||x>width||y>height;
   marker.style.transform='translate('+Math.round(x+inset)+'px,'+Math.round(y+inset)+'px)';
   marker.classList.toggle('selected',piece===selected);
   const color=['laser','target','filter'].includes(piece.type)?COLORS[piece.color]:null;
   marker.style.setProperty('--symbol-accent',color||'#acc1ce');
  }
  for(const [id,marker] of markers){
   if(onBoard.has(id))continue;
   marker.remove();
   markers.delete(id);
  }
 }
 return {update};
}
