/**
 * UI invariants live independently of the renderer:
 * - Only an optic intentionally taken from the tray enters placement mode.
 * - Clicking an empty board square never teleports an already placed optic.
 * - Every board piece is a separate identity (no shared selection by type).
 * - Dragging or using Move acts on the exact selected optic.
 */
export function isFreeCell(pieces, piece, x, y) {
 return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<15&&y>=0&&y<15 &&
  !pieces.some(p=>!p.inTray && p!==piece && p.x===x && p.y===y);
}
export function nextTrayPiece(pieces, type) {
 return pieces.find(p=>p.inTray && p.type===type) || null;
}
export function classifyClick(target, selected, placing) {
 if(target?.piece) return {action:'select', piece:target.piece};
 if(target && Number.isInteger(target.x)&&Number.isInteger(target.y) && placing && selected?.inTray)
  return {action:'place',x:target.x,y:target.y};
 return {action:'clear'};
}
// The camera's world matrix starts with its screen-right and screen-up axes.
// Pair each screen arrow with one perpendicular grid axis for a predictable step.
export function boardArrowOffset(key, cameraMatrix){
 const horizontal=key==='ArrowLeft'||key==='ArrowRight';
 if(!horizontal&&key!=='ArrowUp'&&key!=='ArrowDown')return null;
 const xIsHorizontal=Math.abs(cameraMatrix[0])>=Math.abs(cameraMatrix[2]);
 const alongX=horizontal?xIsHorizontal:!xIsHorizontal;
 const component=cameraMatrix[(horizontal?0:4)+(alongX?0:2)];
 const direction=(Math.sign(component)||1)*(key==='ArrowLeft'||key==='ArrowDown'?-1:1);
 return alongX?{x:direction,y:0}:{x:0,y:direction};
}
export function mirrorFrontDirection(rotation) {
 // The reflective surface normal is at +6 octants from the optic axis.
 return (rotation+6)%8;
}
export function mirrorAccepts(incomingDirection,rotation) {
 const relative=(incomingDirection-rotation+8)%8;
 return relative>=1&&relative<=3;
}
